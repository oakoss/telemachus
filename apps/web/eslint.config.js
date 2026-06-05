import { browser, config, test, typeChecked } from '@oakoss/eslint';

// oxlint covers react/jsx-a11y natively; the full React/TanStack ESLint layers
// are deferred (telemachus-8zj.10).
export default config(browser, typeChecked, test);
