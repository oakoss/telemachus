import { expect, test } from 'vitest';

import { buildCsp } from '#/lib/csp.ts';

const NONCE = 'test-nonce-123';

test('script-src is nonce-based + strict-dynamic', () => {
  const { value } = buildCsp(NONCE);
  expect(value).toMatch(/script-src[^;]*'self'/);
  expect(value).toContain(`'nonce-${NONCE}'`);
  expect(value).toMatch(/script-src[^;]*'strict-dynamic'/);
});

test('locks down the high-risk directives', () => {
  const { value } = buildCsp(NONCE);
  expect(value).toContain("default-src 'self'");
  expect(value).toContain("object-src 'none'");
  expect(value).toContain("frame-ancestors 'none'");
  expect(value).toContain("base-uri 'self'");
  expect(value).toContain("form-action 'self'");
  expect(value).toContain('upgrade-insecure-requests');
});

test('reportOnly toggles only the header name, never the policy', () => {
  const enforce = buildCsp(NONCE);
  const report = buildCsp(NONCE, { reportOnly: true });
  expect(enforce.name).toBe('Content-Security-Policy');
  expect(report.name).toBe('Content-Security-Policy-Report-Only');
  expect(report.value).toBe(enforce.value);
});

test('serializes each directive as "name value(s)", "; "-joined', () => {
  for (const directive of buildCsp(NONCE).value.split('; ')) {
    expect(directive).toMatch(/^[a-z-]+( \S.*)?$/);
  }
});

test('rejects an empty nonce rather than emitting a fail-open policy', () => {
  expect(() => buildCsp('')).toThrow(/non-empty/);
});
