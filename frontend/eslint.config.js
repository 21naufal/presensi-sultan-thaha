import { defineConfig, globalIgnores } from "eslint/config";

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default defineConfig([
  // abaikan folder hasil build
  globalIgnores(["dist"]),

  {
    // terapkan aturan untuk file JavaScript dan React
    files: ["**/*.{js,jsx}"],

    extends: [
      js.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],

    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: "module",
      },
    },

    rules: {
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^[A-Z_]",
        },
      ],
    },
  },
]);
