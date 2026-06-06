import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('placeholder renders without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) =>
    errors.push(`request failed: ${request.url()}`),
  );

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Poll so post-load errors (hydration, async) don't race the assertion.
  await expect.poll(() => errors).toEqual([]);
});

test('serves an enforcing strict CSP whose nonce matches the document', async ({
  page,
}) => {
  const response = await page.goto('/');
  const csp = response?.headers()['content-security-policy'];
  expect(csp, 'enforcing CSP header present').toBeTruthy();
  expect(csp).toMatch(/script-src[^;]*'strict-dynamic'/);
  expect(csp).toContain("object-src 'none'");

  // Header nonce must match the meta tag — the start.ts→router.tsx handoff most
  // likely to silently break on a framework upgrade.
  const headerNonce = csp?.match(/'nonce-([\w-]+)'/)?.[1];
  expect(headerNonce).toBeTruthy();
  const metaNonce = await page
    .locator('meta[property="csp-nonce"]')
    .getAttribute('content');
  expect(metaNonce).toBe(headerNonce);
});

test('placeholder has no axe a11y violations', async ({ page }) => {
  await page.goto('/');

  // Pin to WCAG 2.2 AA — excludes axe's volatile best-practice rules.
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations).toEqual([]);
});
