/**
 * @type {import("prettier").Config}
 * @see https://prettier.io/docs/en/configuration.html
 */
const config = {
  trailingComma: "es5",
  tabWidth: 2,
  printWidth: 100,
  useTabs: false,
  semi: true,
  singleQuote: false,
  quoteProps: "preserve",
  bracketSameLine: false,
  bracketSpacing: true,
  endOfLine: "auto",
  arrowParens: "always",
  vueIndentScriptAndStyle: false,
  proseWrap: "never",
  plugins: ["prettier-plugin-jsdoc", "prettier-plugin-tailwindcss"],
  tailwindConfig: "tailwind.config.ts",
};

export default config;
