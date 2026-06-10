import { expect, test } from '@playwright/test';

import { expectNoErrors, trapErrors } from './support/trap-errors';

// Persistence wedge (telemachus-8zj.3): OPFS survives reload under the enforcing CSP.
test('a note inserted into the persisted collection survives reload', async ({
  page,
}) => {
  const errors = trapErrors(page);

  await page.goto('/db-smoke');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const noteText = `persisted-${Date.now()}`;
  await page.getByLabel('Note text').fill(noteText);
  await page.getByRole('button', { name: 'Add note' }).click();
  await expect(page.getByRole('list', { name: 'Notes' })).toContainText(
    noteText,
  );
  // The optimistic insert renders immediately; reload only after the page
  // reports the row durable in OPFS, or the reload races the SQLite write.
  await expect(page.getByText('Saved to SQLite')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('list', { name: 'Notes' })).toContainText(
    noteText,
  );

  await expectNoErrors(page, errors);
});

test('persistence works without cross-origin isolation (no COOP/COEP)', async ({
  page,
}) => {
  const errors = trapErrors(page);

  await page.goto('/db-smoke');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Locks in the 8zj.3 determination: the sync OPFS VFS needs no
  // SharedArrayBuffer, so the headers stay off until something demands them.
  expect(await page.evaluate(() => globalThis.crossOriginIsolated)).toBe(false);
  await expectNoErrors(page, errors);
});
