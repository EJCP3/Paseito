// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  // View Transitions API nativa del navegador (fallback silencioso donde no
  // exista). El sweep de glimm en la salida del detalle ya oculta la página
  // detrás de un canvas opaco antes de swapear la ruta, así que no compite
  // visualmente con este cross-fade — solo se ve en las entradas normales
  // (detalle de anuncio, perfil, etc.) que hoy no tienen ninguna transición.
  experimental: {
    viewTransition: true,
  },

  // Modules
  modules: [
    '@pinia/nuxt',
    '@nuxt/image',
    '@nuxt/eslint',
    '@nuxt/fonts',
  ],

  // Solo los pesos usados (font-weight/font-* en app); sin itálicas. 800/900 se sintetizan desde 700.
  fonts: {
    families: [
      { name: 'IBM Plex Sans', provider: 'google', weights: [400, 500, 600, 700], styles: ['normal'] },
      { name: 'IBM Plex Mono', provider: 'google', weights: [600, 700], styles: ['normal'] },
    ],
  },

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
    // Nombre/modo de la transición — el CSS real vive en app.vue (.page-enter-active).
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Paseito — Marketplace de Inmuebles con Tours 360°',
      htmlAttrs: { lang: 'es' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Encuentra tu próximo hogar con recorridos virtuales 360°. Explora apartamentos, casas y villas desde cualquier lugar.',
        },
        { name: 'theme-color', content: '#B9FF66' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },

  // Runtime config for env variables
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    betterAuthSecret: process.env.BETTER_AUTH_SECRET || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    cloudName: process.env.CLOUD_NAME || '',
    cloudApiKey: process.env.CLOUD_API_KEY || '',
    cloudApiSecret: process.env.CLOUD_API_SECRET || '',
    public: {
      appName: 'Paseito',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
    },
  },

  // Cabeceras de seguridad (sin CSP: va con la auditoría de lanzamiento)
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
        ...(process.env.NODE_ENV === 'production' && {
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        }),
      },
    },
  },

  // Image module config
  image: {
    quality: 80,
    format: ['webp', 'avif'],
  },

  // Pre-bundle deps only reached via client-only imports, so Vite doesn't
  // discover them at runtime and force a full page reload mid-session
  vite: {
    optimizeDeps: {
      include: [
        'better-auth/vue',
        '@better-auth/infra/client',
        'zod',
        'gsap',
        'gsap/ScrollTrigger',
        'gsap/Flip',
        'leaflet',
        'v-calendar',
      ],
    },
  },
})
