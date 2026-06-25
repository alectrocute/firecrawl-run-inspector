// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  tailwindcss: {
    configPath: '~/tailwind.config.ts',
  },
  nitro: {
    cloudflare: {
      nodeCompat: true,
    },
  },
  app: {
    head: {
      title: 'Run Inspector — Firecrawl',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: 'https://www.firecrawl.dev/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap',
        },
      ],
    },
  },
  runtimeConfig: {
    apiKey: process.env.FIRECRAWL_API_KEY,
  },
})
