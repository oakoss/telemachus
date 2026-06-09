import { type Page, expect, test } from '@playwright/test';

const trapErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    // The app's structured logger writes error lines via console.log, so a
    // type check alone is blind to them.
    if (
      message.type() === 'error' ||
      /"level":"(?:error|fatal)"/.test(message.text())
    ) {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => {
    // reload() aborts in-flight requests; aborts aren't failures.
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') {
      errors.push(`request failed: ${request.url()}`);
    }
  });
  return errors;
};

// Trailing async failures (worker, CSP) need a beat to land before the assert.
const expectNoErrors = async (page: Page, errors: string[]) => {
  await page.waitForTimeout(250);
  expect(errors).toEqual([]);
};

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
