import { expect, test } from '@playwright/test';

import { expectNoErrors, trapErrors } from './support/trap-errors';

// Pruned-replay recovery (telemachus-t1v): the store prunes its applied_tx
// replay log to one row, so a catch-up from an old version can't be served
// incrementally and the adapter must signal requiresFullReload. The rows
// themselves are untouched, so the full reload recovers complete data.
test('a pruned replay window forces requiresFullReload yet survives reload', async ({
  page,
}) => {
  const errors = trapErrors(page);
  // The library logs `Failed pullSince recovery attempt:` via console.warn,
  // which trapErrors ignores — capture it so a broken recovery path is caught.
  const recoveryWarnings: string[] = [];
  page.on('console', (message) => {
    if (
      message.type() === 'warning' &&
      message.text().includes('pullSince recovery')
    ) {
      recoveryWarnings.push(message.text());
    }
  });

  await page.goto('/reload-smoke');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const notes = page.getByRole('list', { name: 'Notes' });
  // Three commits, each pruning applied_tx to one row, push the replay floor
  // past the first insert — two would suffice; three is unambiguous.
  const stamp = Date.now();
  const texts = [1, 2, 3].map((n) => `reload-note-${n}-${stamp}`);
  const addNote = async (noteText: string) => {
    await page.getByLabel('Note text').fill(noteText);
    await page.getByRole('button', { name: 'Add note' }).click();
    await expect(notes).toContainText(noteText);
    await expect(page.getByText('Saved to SQLite')).toBeVisible();
  };
  const checkReplayWindow = page.getByRole('button', {
    name: 'Check replay window',
  });

  // Assert the probe's state attribute, not its prose, so a label copy change
  // can't silently weaken the test.
  const replayState = page.locator('[data-replay-pruned]');

  // One row hasn't crossed the floor, so the catch-up is still servable — the
  // counter-case that proves the probe discriminates rather than always
  // reporting a pruned window.
  for (const noteText of texts.slice(0, 1)) await addNote(noteText);
  await checkReplayWindow.click();
  await expect(replayState).toHaveAttribute('data-replay-pruned', 'servable');

  // Further commits prune past the floor, so the same catch-up now needs a
  // full reload.
  for (const noteText of texts.slice(1)) await addNote(noteText);
  await checkReplayWindow.click();
  await expect(replayState).toHaveAttribute('data-replay-pruned', 'pruned');

  await page.reload();
  for (const noteText of texts) {
    await expect(notes).toContainText(noteText);
  }

  // expectNoErrors waits 250ms — recovery warnings fire async during the
  // post-reload re-hydrate, so let that beat pass before asserting none landed.
  await expectNoErrors(page, errors);
  expect(recoveryWarnings).toEqual([]);
});
