// Intercom Messenger — boots only when a workspace App ID is configured
// (NUXT_PUBLIC_INTERCOM_APP_ID). Dormant otherwise: no external script loads,
// nothing is sent anywhere. Client-only.
export default defineNuxtPlugin(() => {
  const appId = useRuntimeConfig().public.intercomAppId as string
  if (!appId || typeof window === 'undefined') return

  const w = window as unknown as { Intercom?: any, intercomSettings?: Record<string, unknown> }

  w.intercomSettings = { api_base: 'https://api-iam.intercom.io', app_id: appId }

  // Standard Intercom loader snippet.
  ;(function () {
    const ic = w.Intercom
    if (typeof ic === 'function') {
      ic('reattach_activator')
      ic('update', w.intercomSettings)
    }
    else {
      const d = document
      const i: any = function () { i.c(arguments) }
      i.q = []
      i.c = function (args: unknown) { i.q.push(args) }
      w.Intercom = i
      const l = function () {
        const s = d.createElement('script')
        s.type = 'text/javascript'
        s.async = true
        s.src = `https://widget.intercom.io/widget/${appId}`
        const x = d.getElementsByTagName('script')[0]
        x?.parentNode?.insertBefore(s, x)
      }
      if (document.readyState === 'complete') l()
      else window.addEventListener('load', l, false)
    }
  })()

  // Boot the messenger (anonymous visitor). Identify the signed-in user later
  // via useIntercom().update({ name, email, user_id }) once real auth lands.
  w.Intercom?.('boot', { app_id: appId })
})
