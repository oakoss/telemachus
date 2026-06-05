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

  // Poll so errors firing after load (hydration, async) still fail the test
  // instead of racing the assertion.
  await expect.poll(() => errors).toEqual([]);
});

test('placeholder has no axe a11y violations', async ({ page }) => {
  await page.goto('/');

  // Pin to WCAG 2.2 AA — excludes axe's volatile best-practice rules.
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations).toEqual([]);
});
