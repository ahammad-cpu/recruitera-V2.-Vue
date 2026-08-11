import tailwindcss from '@tailwindcss/vite'

/**
 * Content Security Policy — controls what can load/run on the page.
 * Kept in `report-only` mode initially — flip to `Content-Security-Policy`
 * (see below) once the API host is confirmed and violations are audited.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",          // tighten after audit; MSW needs eval in dev
  "style-src 'self' 'unsafe-inline'",           // shadcn tokens injected inline
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://api.recruitera.ai ws: wss:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/eslint',
  ],

  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light',
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
  },

  // Public → serialised into the client bundle. NEVER put secrets here.
  // Private → server-only, redacted from the client payload.
  runtimeConfig: {
    apiSecret: process.env.API_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3000',
      appEnv:  process.env.NUXT_PUBLIC_APP_ENV  ?? 'development',
    },
  },

  routeRules: {
    // ── Security headers on every response ──
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
        'Content-Security-Policy-Report-Only': CSP,
        // TODO: enable once we confirm HTTPS-only hosting (irreversible for 1yr):
        // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      },
    },

    // ── SSR strategy ──
    // Auth pages benefit from SSR (fast TTFB on the login screen).
    // Everything else is behind auth — no SEO benefit, so ship them as SPA
    // for smaller server payloads and quicker interactivity.
    '/auth/**':        { ssr: true },
    '/dashboard':      { ssr: false },
    '/candidates/**':  { ssr: false },
    '/jobs/**':        { ssr: false },
    '/settings/**':    { ssr: false },
    '/interviews':     { ssr: false },
    '/offers':         { ssr: false },
    '/talent-pools':   { ssr: false },
    '/analytics':      { ssr: false },
    '/reports/**':     { ssr: false },
    '/whatsapp':       { ssr: false },
    '/career-site':    { ssr: false },
    '/careers/**':     { ssr: false },
  },

  experimental: {
    payloadExtraction: true,   // smaller JS on client
    inlineRouteRules: true,
  },

  app: {
    // Must stay false — see "Known landmines" in the root CLAUDE.md. A named
    // transition here ({ name: 'page', mode: 'out-in' }) silently breaks every
    // client-side route change app-wide: the URL updates but the page
    // component never swaps (clicking a candidate, job, or pool leaves you
    // looking at the previous screen). Reproduced on a clean dev server;
    // disabling it is what fixes it — missing .page-enter/.page-leave CSS is
    // not the cause. Re-enable only as its own task with its own verification.
    pageTransition: false,
  },
})
