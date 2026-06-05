import type { Linter } from 'eslint';

export const browser: Linter.Config[];
export const node: Linter.Config[];
export const react: Linter.Config[];
export const sort: Linter.Config[];
export const tanstack: Linter.Config[];
export const test: Linter.Config[];
export const typeChecked: Linter.Config[];
export function tailwind(entryPoint: string): Linter.Config[];
export function config(...layers: Linter.Config[][]): Linter.Config[];
