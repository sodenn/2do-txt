// eslint-disable-next-line no-undef
module.exports = {
  extends: [
    "prettier",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:react/jsx-runtime",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    project: "./tsconfig.eslint.json",
  },
  rules: {
    "no-debugger": "off",
    "react/display-name": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { ignoreRestSiblings: true, argsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/await-thenable": "warn",
    "react/prop-types": "off"
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  root: true,
  overrides: [
    {
      files: ["src/*.+(ts|tsx)", "tests/*.+(ts|tsx)"],
    },
  ],
  ignorePatterns: [
    "tools",
    "capacitor.config.ts",
    "playwright.config.ts",
    "vite.config.ts",
    ".eslintrc.js",
  ],
};
