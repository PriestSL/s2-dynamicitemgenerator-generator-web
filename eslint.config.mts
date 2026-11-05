import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import type { Linter } from "eslint";
export default [
  {languageOptions: { globals: { ...globals.browser, process: 'readonly' }}},
  {ignores: ['dist/', '.npm-cache/']},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended.map(config => ({ ...config, files: ['**/*.ts', '**/*.mts'] })),
  {files: ['tests/**/*.ts', 'scripts/**/*.ts', '*.ts', '*.mts'], languageOptions: {globals: globals.node}},
] satisfies Linter.Config[];
