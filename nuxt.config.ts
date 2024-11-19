// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: true,

  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss", "@nuxt/eslint", "shadcn-nuxt", "@nuxtjs/i18n"],

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
        name: "简体中文",
        file: "zh-CN.json",
      },
    ],
  },

  compatibilityDate: "2024-11-19",
});
