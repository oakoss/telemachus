import { expect, test } from '@playwright/test';

import { expectNoErrors, trapErrors } from './support/trap-errors';

const SYNC_TIMEOUT = 15_000;

// The Electric spike (telemachus-8zj.8) needs the compose stack:
// `docker compose --profile electric up -d`. Probe through the app's shape
// proxy so a missing service (or DATABASE_URL) skips instead of failing.
// REQUIRE_ELECTRIC=1 turns the skip into a failure so an environment that
// promises the stack (CI with services up) can't green-skip a regression.
test.beforeEach(async ({ request }) => {
  let probeError = '';
  const probe = await request
    .get('/api/electric-smoke/shape?offset=-1')
    .catch((error: unknown) => {
      probeError = error instanceof Error ? error.message : String(error);
      return null;
    });
  const probeState = probe?.status() ?? `unreachable (${probeError})`;
  if (process.env.REQUIRE_ELECTRIC) {
    expect(
      probe?.status(),
      `Electric stack required but probe failed: ${probeState}`,
    ).toBe(200);
    return;
  }
  test.skip(
    !probe?.ok(),
    `Electric stack not running (probe: ${probeState}) — docker compose --profile electric up -d`,
  );
});

// Write-path (AC3) + the compose crux (AC4): optimistic insert -> write API
// -> Postgres -> Electric streams the txid back -> exactly one row, before
// and after a reload that re-hydrates from SQLite while Electric re-syncs.
test('a note round-trips through Postgres and survives reload without duplicating', async ({
  page,
}) => {
  const errors = trapErrors(page);

  await page.goto('/electric-smoke');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const noteText = `write-path-${Date.now()}`;
  await page.getByLabel('Note text').fill(noteText);
  await page.getByRole('button', { name: 'Add note' }).click();

  const note = page
    .getByRole('list', { name: 'Notes' })
    .getByRole('listitem')
    .filter({ hasText: noteText });
  await expect(note).toHaveCount(1);
  await expect(page.getByText('Synced to Postgres')).toBeVisible({
    timeout: SYNC_TIMEOUT,
  });
  await expect(note).toHaveCount(1);

  await page.reload();
  await expect(note).toHaveCount(1, { timeout: SYNC_TIMEOUT });

  await expectNoErrors(page, errors);
});

// Read-path (AC2): a row written to Postgres behind the page's back appears
// reactively through Electric — no reload.
test('a server-side Postgres insert appears live in the collection', async ({
  page,
  request,
}) => {
  const errors = trapErrors(page);

  await page.goto('/electric-smoke');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const noteText = `read-path-${Date.now()}`;
  const response = await request.post('/api/electric-smoke/notes', {
    data: { created_at: Date.now(), id: crypto.randomUUID(), text: noteText },
  });
  expect(response.ok()).toBe(true);

  await expect(page.getByRole('list', { name: 'Notes' })).toContainText(
    noteText,
    { timeout: SYNC_TIMEOUT },
  );

  await expectNoErrors(page, errors);
});

// Multi-tab: BrowserCollectionCoordinator elects one writer per OPFS database;
// a second tab must converge on the same data instead of corrupting it.
test('a note inserted in one tab appears in a second tab', async ({
  context,
  page,
}) => {
  const errorsA = trapErrors(page);
  await page.goto('/electric-smoke');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const pageB = await context.newPage();
  const errorsB = trapErrors(pageB);
  await pageB.goto('/electric-smoke');
  await expect(pageB.getByRole('heading', { level: 1 })).toBeVisible();

  const noteText = `multi-tab-${Date.now()}`;
  await page.getByLabel('Note text').fill(noteText);
  await page.getByRole('button', { name: 'Add note' }).click();
  await expect(page.getByText('Synced to Postgres')).toBeVisible({
    timeout: SYNC_TIMEOUT,
  });

  const noteInB = pageB
    .getByRole('list', { name: 'Notes' })
    .getByRole('listitem')
    .filter({ hasText: noteText });
  await expect(noteInB).toHaveCount(1, { timeout: SYNC_TIMEOUT });

  await expectNoErrors(page, errorsA);
  await expectNoErrors(pageB, errorsB);
});
