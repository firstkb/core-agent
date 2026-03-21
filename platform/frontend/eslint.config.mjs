import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "docs/metronic/**",
      "docs/frontend-skeleton*",
      "**/dist/**",
      "**/coverage/**",
      "**/node_modules/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["**/*.config.{ts,js,mjs}", "tooling/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
