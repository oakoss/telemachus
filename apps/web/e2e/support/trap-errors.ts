import { type Page, expect } from '@playwright/test';

export const trapErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    // The app's structured logger writes error lines via console.log, so a
    // type check alone is blind to them. The regex relies on the logger
    // overlaying reserved keys last (packages/shared logger.ts) — callers
    // can't shadow `level`, so the match can't be spoofed or evaded.
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
    const errorText = request.failure()?.errorText;
    if (errorText !== 'net::ERR_ABORTED') {
      errors.push(
        `request failed: ${request.url()} (${errorText ?? 'unknown'})`,
      );
    }
  });
  return errors;
};

// Trailing async failures (worker, CSP) need a beat to land before the assert.
export const expectNoErrors = async (page: Page, errors: string[]) => {
  await page.waitForTimeout(250);
  expect(errors).toEqual([]);
};
