import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {languageOptions: { globals: { ...globals.browser, process: 'readonly' }}},
  {ignores: ['vite.config.js', 'dist/']},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended.map(config => ({ ...config, files: ['src/**/*.ts', 'tests/types/**/*.ts'] })),
  {files: ['tests/**/*.mjs'], languageOptions: {globals: globals.node}},
];
