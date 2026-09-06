// Thin wrapper over the Intercom Messenger global. All calls are no-ops when
// Intercom is not enabled (no App ID) or on the server — safe to call anywhere.
function ic(...args: unknown[]) {
  if (typeof window === 'undefined') return
  const fn = (window as unknown as { Intercom?: (...a: unknown[]) => void }).Intercom
  if (typeof fn === 'function') fn(...args)
}

export function useIntercom() {
  const enabled = !!useRuntimeConfig().public.intercomAppId

  return {
    enabled,
    /** Identify the signed-in user (name/email/user_id + custom attributes). */
    update: (data: Record<string, unknown>) => ic('update', data),
    /** Open / close / toggle the messenger. */
    show: () => ic('show'),
    hide: () => ic('hide'),
    showMessages: () => ic('showMessages'),
    showNewMessage: (text?: string) => ic('showNewMessage', text ?? ''),
    /** Log a product event (e.g. onboarding progress). */
    trackEvent: (name: string, metadata?: Record<string, unknown>) => ic('trackEvent', name, metadata),
    /** Clear session on logout. */
    shutdown: () => ic('shutdown'),
  }
}
