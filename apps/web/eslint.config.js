import {
  browser,
  config,
  react,
  sort,
  tailwind,
  tanstack,
  test,
  typeChecked,
} from '@oakoss/eslint';
import { globalIgnores } from 'eslint/config';

export default config(
  globalIgnores([
    '**/.nitro/**',
    '**/.tanstack/**',
    '**/playwright-report/**',
    '**/test-results/**',
  ]),
  browser,
  react,
  sort,
  tanstack,
  tailwind('./src/styles/globals.css'),
  typeChecked,
  test,
);
