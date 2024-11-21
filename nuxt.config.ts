// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: true,

  modules: [
    "@pinia/nuxt",
    "@nuxtjs/color-mode",
    "@nuxtjs/tailwindcss",
    "@nuxt/eslint",
    "shadcn-nuxt",
    "@nuxtjs/i18n",
  ],

  typescript: {
    typeCheck: true,
    strict: true,
  },

  eslint: {
    checker: true,
    config: {
      standalone: false,
    },
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  shadcn: {
    /** Prefix for all the imported component */
    prefix: "",
    /**
     * Directory that the component lives in.
     *
     * @default "./components/ui"
     */
    componentDir: "./components/ui",
  },
  colorMode: {
    preference: "system", // default value of $colorMode.preference
    fallback: "light", // fallback value if not system preference found
    hid: "nuxt-color-mode-script",
    globalName: "__NUXT_COLOR_MODE__",
    componentName: "ColorScheme",
    classPrefix: "",
    classSuffix: "",
    storage: "localStorage", // or 'sessionStorage' or 'cookie'
    storageKey: "color-mode",
  },
  i18n: {
    lazy: true,
    defaultLocale: "zh",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "lang",
      redirectOn: "root",
      alwaysRedirect: true,
    },
    langDir: "../locales/",
    locales: [
      {
        code: "zh",
        file: "zh-CN.json",
      },
      // {
      //   code: "ja",
      //   file: "ja-JP.json",
      // },
      // {
      //   code: "en",
      //   file: "en-US.json",
      // },
    ],
  },

  compatibilityDate: "2024-11-19",
});
