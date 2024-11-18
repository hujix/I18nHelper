// @ts-check
import antfu from "@antfu/eslint-config";

import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  antfu({
    stylistic: {
      indent: 2,
      semi: true,
      quotes: "double",
    },
    formatters: true,
    typescript: true,
    vue: true,
    ignores: ["**/node_modules/**", "**/dist/**", "**/public/**", "components/ui/**/*"],
  }),
  {
    rules: {
      "vue/comma-dangle": ["error", "only-multiline"],
      "style/comma-dangle": ["error", "only-multiline"],
      "style/brace-style": ["error", "1tbs"],
      "vue/html-self-closing": [
        "error",
        {
          html: {
            void: "always",
            normal: "always",
            component: "always",
          },
          svg: "always",
          math: "always",
        },
      ],
    },
  }
);
