import js from "@eslint/js";
import globals from "globals";
import stylistic from "@stylistic/eslint-plugin";
import html from "eslint-plugin-html";

export default [
  js.configs.recommended,
  {
    files: ["**/*.xul", "**/*.xml"],
    plugins: {
      html,
    },
    settings: {
      "html/xml-extensions": [".xul", ".xml"],
    },
  },
  {
    files: ["**/*.js", "**/*.xul", "**/*.xml"],
    plugins: {
      "@stylistic": stylistic,
    },
    languageOptions: {
      ecmaVersion: 2015,
      sourceType: "script",
      globals: {
        ...globals.browser,
        gBundle: "writable",
        gStrings: "writable",
        Components: "readonly",
        Services: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-sparse-arrays": "warn",
      "no-console": "warn",
      "curly": ["error", "all"],
      "@stylistic/brace-style": ["error", "1tbs", { "allowSingleLine": false }],
      "@stylistic/indent": ["error", 2],
      "@stylistic/linebreak-style": ["error", "windows"],
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/semi": ["error", "always"],
    },
  },
];
