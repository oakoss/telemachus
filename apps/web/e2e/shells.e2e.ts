import { expect, test } from '@playwright/test';

import { expectNoErrors, trapErrors } from './support/trap-errors';

// Pins group -> shell -> Outlet wiring (telemachus-utf); content assertions
// stay minimal so R1 can replace the markup freely. One <main> per shell —
// __root.tsx renders bare children so landmarks belong to the shells alone.
const PAGES = [
  { name: 'public home', path: '/' },
  { name: 'auth sign-in', path: '/sign-in' },
  { name: 'app dashboard', path: '/dashboard' },
];

for (const { name, path } of PAGES) {
  test(`${name} mounts its group shell with a single main landmark`, async ({
    page,
  }) => {
    const errors = trapErrors(page);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('main')).toHaveCount(1);
    await expectNoErrors(page, errors);
  });
}
