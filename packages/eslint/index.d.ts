import type { Linter } from 'eslint';

export const node: Linter.Config[];
export const test: Linter.Config[];
export const typeChecked: Linter.Config[];
export function config(...layers: Linter.Config[][]): Linter.Config[];
