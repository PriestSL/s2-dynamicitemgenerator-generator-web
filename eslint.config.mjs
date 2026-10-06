import globals from "globals";
import pluginJs from "@eslint/js";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {languageOptions: { globals: { ...globals.browser, process: 'readonly' }}},
  {ignores: ['vite.config.js', 'dist/']},
  pluginJs.configs.recommended,
  {files: ['tests/**/*.mjs'], languageOptions: {globals: globals.node}},
];
