// Employee referrals — scoped to what's observable in the UI without a real
// pipeline/Smart-Distribution backend (see docs/superpowers/specs/2026-08-06-
// career-site-public-design.md). Tracks Referral Form submissions; "Copy my
// referral link" is a generated URL only (no second visitor to click it here).

export interface Referral {
  id: string
  jobId: string
  jobTitle: string
  mode: 'Form' | 'Link'
  candidateName: string
  referrerEmail: string
  status: 'Submitted' | 'Reviewing' | 'Interviewing' | 'Hired' | 'Bonus Paid' | 'Ineligible'
  createdAt: string
  /** Illustrative seed row — shown to every employee regardless of who's logged in, so the page isn't empty on first look. */
  isDemo?: boolean
}

function daysAgoIso(d: number) {
  return new Date(Date.now() - d * 86400000).toISOString()
}

// Status mapping per PRD: Referred/Submitted → Reviewing → Interviewing →
// Hired → Bonus Paid, or Ineligible if disqualified along the way. These
// three rows show the range of outcomes so My Referrals isn't empty on the
// very first demo login.
const DEMO_REFERRALS: Referral[] = [
  { id: 'demo-ref-1', jobId: 'j2', jobTitle: 'Senior Frontend Engineer', mode: 'Form', candidateName: 'Youssef Adly (Demo)', referrerEmail: '', status: 'Interviewing', createdAt: daysAgoIso(12), isDemo: true },
  { id: 'demo-ref-2', jobId: 'j6', jobTitle: 'Warehouse Operative', mode: 'Link', candidateName: 'Mona Fathy (Demo)', referrerEmail: '', status: 'Hired', createdAt: daysAgoIso(41), isDemo: true },
  { id: 'demo-ref-3', jobId: 'j4', jobTitle: 'Product Designer', mode: 'Form', candidateName: 'Karim Hussein (Demo)', referrerEmail: '', status: 'Ineligible', createdAt: daysAgoIso(6), isDemo: true },
]

const store = ref<Referral[]>([...DEMO_REFERRALS])
let seq = 0

export function useReferrals() {
  function forEmployee(email: string) {
    return computed(() => store.value.filter(r => r.isDemo || r.referrerEmail === email))
  }
  function addFormReferral(payload: { jobId: string, jobTitle: string, candidateName: string, referrerEmail: string }) {
    const referral: Referral = {
      id: `ref${++seq}`,
      jobId: payload.jobId,
      jobTitle: payload.jobTitle,
      mode: 'Form',
      candidateName: payload.candidateName,
      referrerEmail: payload.referrerEmail,
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    }
    store.value = [referral, ...store.value]
    return referral
  }
  function referralLink(jobId: string, employeeEmail: string) {
    const token = employeeEmail.split('@')[0]
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/careers/jobs/${jobId}?ref=${encodeURIComponent(token ?? 'employee')}`
  }
  return { forEmployee, addFormReferral, referralLink }
}
