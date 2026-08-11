import { defineStore } from 'pinia'

/**
 * ⚠️ MOCK "For Employees" SESSION — replace when the real API ships.
 *
 * Mirrors auth.store.ts's shape. In the real PRD this is created by clicking
 * a magic link sent to a company-domain email (re-verified every session).
 * There's no email delivery in this prototype, so `verify()` is called either
 * after the fake "check your inbox" step resolves, or instantly by the
 * "Demo as Employee" shortcut — same resulting session either way.
 */

const SESSION_KEY = 'recruitera:employee_portal_session'

export const useEmployeePortalStore = defineStore('employeePortal', () => {
  const email = ref<string | null>(null)
  const domain = ref<string | null>(null)

  const isVerified = computed(() => !!email.value)

  function restore() {
    if (import.meta.server) return
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as { email: string, domain: string }
      email.value = parsed.email
      domain.value = parsed.domain
    }
    catch {
      window.sessionStorage.removeItem(SESSION_KEY)
    }
  }

  function verify(fullEmail: string) {
    const domainPart = fullEmail.slice(fullEmail.lastIndexOf('@') + 1).toLowerCase()
    email.value = fullEmail
    domain.value = domainPart
    if (import.meta.client) {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: fullEmail, domain: domainPart }))
    }
  }

  function logout() {
    email.value = null
    domain.value = null
    if (import.meta.client) window.sessionStorage.removeItem(SESSION_KEY)
  }

  return { email, domain, isVerified, restore, verify, logout }
})
