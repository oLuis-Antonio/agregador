/** @typedef {import('prettier').Config} PrettierConfig*/

/** @type {PrettierConfig}*/
const config = {
  plugins: ["prettier-plugin-organize-imports", "prettier-plugin-prisma", "prettier-plugin-css-order"],
  printWidth: 80,
  tabWidth: 2,
  useTabs: true,
  semi: true,
  singleQuote: true,
  quoteProps: "as-needed",
  jsxSingleQuote: false,
  trailingComma: "es5",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "auto",
  bracketSameLine: false,
};

export default config;