// Employee Hub — company email domains that unlock the career site's
// "For Employees" access. Module-scope singleton so Settings (where domains
// are managed) and the public /careers/* "For Employees" modal (which
// validates a candidate email's domain) share one source of truth.
//
// Fixture today; swap for a Vue Query + mutation pair when the API lands.

export interface EmployeeHubState {
  enabled: boolean
  domainSelfServe: boolean
  domains: string[]
}

const state = reactive<EmployeeHubState>({
  enabled: true,
  domainSelfServe: true,
  domains: ['icareer.ai'],
})

// Same reasoning as useCareerSite.ts — the "For Employees" modal is on the
// public site, opened in its own tab, so domain config must survive across
// tabs via localStorage rather than only living in one tab's memory.
const STORAGE_KEY = 'recruitera:employee_hub_config'
if (import.meta.client) {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try { Object.assign(state, JSON.parse(raw)) }
    catch { /* corrupt/old shape — keep defaults */ }
  }
  watch(state, () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, { deep: true })
}

export function useEmployeeHub() {
  function addDomain(raw: string) {
    const d = raw.trim().toLowerCase().replace(/^@/, '').replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!d) return { ok: false, error: '' }
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d)) return { ok: false, error: 'Enter a valid domain, e.g. company.com' }
    if (state.domains.includes(d)) return { ok: false, error: 'That domain is already added.' }
    state.domains.push(d)
    return { ok: true, error: '' }
  }
  function removeDomain(d: string) {
    const i = state.domains.indexOf(d)
    if (i !== -1) state.domains.splice(i, 1)
  }
  function isCompanyDomain(email: string) {
    const at = email.lastIndexOf('@')
    if (at === -1) return false
    const domain = email.slice(at + 1).trim().toLowerCase()
    return state.enabled && state.domainSelfServe && state.domains.includes(domain)
  }
  return { state, addDomain, removeDomain, isCompanyDomain }
}
