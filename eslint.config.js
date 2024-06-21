const globals = require("globals");
const jestPlugin = require("eslint-plugin-jest");
const js = require("@eslint/js");  // Assuming the recommended config is imported from @eslint/js

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.es2021
      }
    },
    rules: {
      // Add your rules here
    }
  },
  {
    files: ["**/*.test.js", "**/__tests__/**/*.js"], // Apply Jest configurations to test files
    languageOptions: {
      globals: {
        ...globals.jest, // Merging Jest globals
      },
    },
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      ...jestPlugin.configs.recommended.rules, // Use recommended rules from eslint-plugin-jest
    }
  }
];
