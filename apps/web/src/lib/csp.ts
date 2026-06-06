// Future rungs extend this map (foundations.md:65): wa-sqlite adds
// 'wasm-unsafe-eval', OPFS adds 'worker-src', COOP/COEP ship as sibling headers.

// Start emits the nonce on a <meta property> when ssr.nonce is set; the client
// reads it back during hydration.
export const CSP_NONCE_META = 'csp-nonce';

type Directive =
  | 'base-uri'
  | 'connect-src'
  | 'default-src'
  | 'font-src'
  | 'form-action'
  | 'frame-ancestors'
  | 'img-src'
  | 'object-src'
  | 'script-src'
  | 'style-src'
  | 'upgrade-insecure-requests';

const SELF = "'self'";

function directives(nonce: string): Record<Directive, string[]> {
  return {
    'default-src': [SELF],
    // 'strict-dynamic' propagates nonce trust to code-split chunks, eliminating
    // the need for a host allowlist. TanStack stamps the nonce on every script.
    'script-src': [SELF, `'nonce-${nonce}'`, "'strict-dynamic'"],
    // 'unsafe-inline' for styles is a deliberate, low-risk trade-off: react-aria
    // (ADR-005) emits inline positioning styles, and CSS injection can't run JS.
    'style-src': [SELF, "'unsafe-inline'"],
    'img-src': [SELF, 'data:'],
    'font-src': [SELF],
    'connect-src': [SELF],
    'object-src': ["'none'"],
    'base-uri': [SELF],
    'frame-ancestors': ["'none'"],
    'form-action': [SELF],
    'upgrade-insecure-requests': [],
  };
}

const ENFORCE = 'Content-Security-Policy';
const REPORT_ONLY = 'Content-Security-Policy-Report-Only';

export type CspHeader = {
  name: typeof ENFORCE | typeof REPORT_ONLY;
  value: string;
};

// upgrade-insecure-requests legitimately takes no sources; an empty array on
// any other directive serializes to a bare token, which CSP treats as deny-all.
const VALUELESS = new Set<string>(['upgrade-insecure-requests']);

export function buildCsp(
  nonce: string,
  { reportOnly = false } = {},
): CspHeader {
  if (!nonce) throw new Error('buildCsp: nonce must be non-empty');

  const value = Object.entries(directives(nonce))
    .map(([name, values]) => {
      if (values.length > 0) return `${name} ${values.join(' ')}`;
      if (!VALUELESS.has(name)) {
        throw new Error(
          `buildCsp: directive "${name}" has no sources (deny-all)`,
        );
      }
      return name;
    })
    .join('; ');

  return { name: reportOnly ? REPORT_ONLY : ENFORCE, value };
}
