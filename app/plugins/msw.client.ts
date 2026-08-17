// Nuxt runs *.client.ts plugins in the browser only.
// MSW is enabled in production too until a real backend exists — this app
// has no server API yet, so without it every page shows empty states.
export default defineNuxtPlugin(async () => {
  try {
    const { worker } = await import('~/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  }
  catch (err) {
    // Service workers can't always register (sandboxed/preview browsers, some
    // privacy modes, insecure origins). Don't crash the whole app — continue
    // without mocks so pages backed by local data still render.
    console.warn('[msw] mock worker failed to start; continuing without mocks', err)
  }
})
