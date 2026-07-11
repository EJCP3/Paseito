// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  // Modules
  modules: [
    '@pinia/nuxt',
    '@nuxt/image',
  ],

  // Component Scanning Configuration
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  // Global CSS
  css: ['~/assets/css/main.css'],

  // PostCSS — Tailwind CSS 4
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },

  // App metadata
  app: {
    head: {
      title: 'Paseito — Marketplace de Inmuebles y Vehículos con Tours 360°',
      htmlAttrs: { lang: 'es' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Encuentra tu próximo hogar o vehículo con recorridos virtuales 360°. Explora apartamentos, casas y autos desde cualquier lugar.',
        },
        { name: 'theme-color', content: '#B9FF66' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  // Runtime config for env variables
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    betterAuthSecret: process.env.BETTER_AUTH_SECRET || '',
    r2AccountId: process.env.R2_ACCOUNT_ID || '',
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    r2BucketName: process.env.R2_BUCKET_NAME || '',
    public: {
      appName: 'Paseito',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
    },
  },

  // Image module config
  image: {
    quality: 80,
    format: ['webp', 'avif'],
  },
})
