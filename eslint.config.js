import reactPlugin from "eslint-plugin-react";
export default [
  {
    files: ["**/*.jsx", "**/*.js"],
    plugins: {
      react: reactPlugin
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        console: "readonly",
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        React: "readonly",
        navigator: "readonly",
        URL: "readonly",
        Date: "readonly",
        Math: "readonly",
        String: "readonly",
        Number: "readonly",
        Array: "readonly",
        Object: "readonly",
        JSON: "readonly",
        Promise: "readonly",
        Blob: "readonly",
        File: "readonly",
        FileReader: "readonly",
        fetch: "readonly"
      }
    },
    rules: {
      "no-undef": "error"
    }
  }
];
