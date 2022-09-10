module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/*.{spec,test}.{ts,tsx}"],
  transform: {
    "^.+\\.(ts|tsx|js)$": "ts-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  moduleDirectories: ["node_modules", "src"],
  transformIgnorePatterns: [
    "node_modules/(?!react-movable|remark-parse|mdast-util-from-markdown|mdast-util-to-string|micromark|decode-named-character-reference|character-entities|unist-util-stringify-position|remark-stringify|mdast-util-to-markdown|zwitch|longest-streak|unist-util-visit|unist-util-is|unified|bail|is-plain-obj|trough|vfile)",
  ],
  moduleNameMapper: {
    "\\.(png)$": "<rootDir>/src/__mocks__/fileMock.js",
  },
};
