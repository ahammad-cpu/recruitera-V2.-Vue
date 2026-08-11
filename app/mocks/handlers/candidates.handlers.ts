import { http, HttpResponse, delay } from 'msw'
import type { Candidate, CandidateProfile } from '~/types'
import { candidateHaystack, matchesSearchQuery } from '~/utils/candidateSearch'

// Simulates realistic API latency in dev so skeletons + loading states are
// visible to design/QA. Real API responses (150-500ms) replace this in prod.
const DEV_LATENCY_MS = 350

/**
 * The exact 17 sample candidates from the design spec. Field shape mirrors
 * a future API response — jobs/sources/tags/talentPools are arrays because
 * the design shows them stacked.
 *
 * Exported so talent-pools.handlers.ts can build its rows from these records
 * instead of keeping a second, drifting copy of the same people. `talentPools`
 * here and the memberships there are two views of one relationship — change one
 * and change the other.
 */
// Exported so other domains (Talent Pools, Smart Distribute's per-recruiter
// candidate view, etc.) build on this one roster instead of inventing a
// parallel cast — see CLAUDE.md "Data layer".
export const ALL_CANDIDATES: Candidate[] = [
  { id: '1',  name: 'dasdasdasdasd',            initials: 'D',  avatarColor: 'var(--brand-avatar-1)', isNew: true,  status: 'new',          jobs: [],                                                                                                    sources: [],              tags: [],                            talentPools: [],                            disqualifiedBy: null,               dateCreated: 'an hour ago' },
  { id: '2',  name: 'asdsd',                    initials: 'A',  avatarColor: 'var(--brand-avatar-2)', isNew: true,  status: 'new',          jobs: [],                                                                                                    sources: [],              tags: [],                            talentPools: [],                            disqualifiedBy: null,               dateCreated: 'an hour ago' },
  { id: '3',  name: 'dasda',                    initials: 'D',  avatarColor: 'var(--brand-avatar-3)', isNew: true,  status: 'new',          jobs: [],                                                                                                    sources: [],              tags: [],                            talentPools: [],                            disqualifiedBy: null,               dateCreated: 'an hour ago' },
  { id: '4',  name: 'Kendall McClure (Sample)', initials: 'KM', avatarColor: 'var(--brand-avatar-1)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Backend Engineer', status: 'published' }],                                                 sources: ['Indeed'],       tags: ['Sample', 'Junior'],           talentPools: ['General Application', 'Next recruitment - Q3 (Sample)'], disqualifiedBy: null,       dateCreated: 'a month ago' },
  { id: '5',  name: 'Mikel Lang (Sample)',      initials: 'ML', avatarColor: 'var(--brand-avatar-2)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Backend Engineer', status: 'internal', location: 'Berlin, Germany', assignedDate: 'May 28, 2026' }, { title: 'Frontend Engineer', status: 'published', disqualified: true, location: 'Amsterdam', assignedDate: '11 Jul 2026' }],  sources: ['LinkedIn'],     tags: ['Sample', 'Mid-level'],        talentPools: ['Engineering (Sample)'],      disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '6',  name: 'John Smith (Sample)',      initials: 'JS', avatarColor: 'var(--brand-avatar-3)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Senior Marketer (Sample)', status: 'published' }],                                           sources: ['Referral'],     tags: ['Sample', 'Mid-level'],        talentPools: ['Marketing Bench (Sample)'],                            disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '7',  name: 'Zachery Bahringer (Sample)', initials: 'ZB', avatarColor: 'var(--brand-avatar-1)', isNew: false, status: 'not_contacted', jobs: [],                                                                                                  sources: ['Indeed'],       tags: ['Sample', 'Junior'],           talentPools: ['General Application', 'Rising stars (Sample)'],     disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '8',  name: 'Wilma Roelendsen (Sample)', initials: 'WR', avatarColor: 'var(--brand-avatar-2)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Recruiter (Sample)', status: 'internal' }, { title: 'Senior Marketer (Sample)', status: 'published' }, { title: 'Backend Engineer', status: 'published' }], sources: ['Indeed'],       tags: ['Sample', 'Mid-level'],        talentPools: ['Marketing Bench (Sample)'],                            disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '9',  name: 'Serena Uppin (Sample)',    initials: 'SU', avatarColor: 'var(--brand-avatar-3)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Senior Marketer (Sample)', status: 'published' }, { title: 'Recruiter (Sample)', status: 'internal' }], sources: ['Careers site'], tags: ['Sample', 'Senior'],           talentPools: ['Next recruitment - Q3 (Sample)'],                            disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '10', name: 'Brooke Strosin (Sample)',  initials: 'BS', avatarColor: 'var(--brand-avatar-1)', isNew: false, status: 'not_contacted', jobs: [],                                                                                                    sources: ['Resume sent'],  tags: ['Sample'],                     talentPools: ['General Application', 'Next recruitment - Q3 (Sample)'], disqualifiedBy: null,       dateCreated: 'a month ago' },
  { id: '11', name: 'Kevin Hernandez (Sample)', initials: 'KH', avatarColor: 'var(--brand-avatar-2)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Senior Marketer (Sample)', status: 'published' }, { title: 'Backend Engineer', status: 'published' }], sources: ['Resume sent'],  tags: ['Sample', 'Senior'],           talentPools: ['Next recruitment - Q3 (Sample)'],                            disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '12', name: 'Mariela Vasquez (Sample)', initials: 'MV', avatarColor: 'var(--brand-avatar-3)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Senior Marketer (Sample)', status: 'published' }, { title: 'Backend Engineer', status: 'published' }], sources: ['Careers site'], tags: ['Sample', 'Senior'],           talentPools: ['Next recruitment - Q3 (Sample)'],                            disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '13', name: 'Anna Jansen (Sample)',     initials: 'AJ', avatarColor: 'var(--brand-avatar-1)', isNew: false, status: 'disqualified',  jobs: [{ title: 'Marketer (Sample)', status: 'archived' }, { title: 'Senior Marketer (Sample)', status: 'published' }],   sources: ['Indeed'],       tags: ['Sample', 'Junior'],           talentPools: ['Rising stars (Sample)'],     disqualifiedBy: 'Knockout question', dateCreated: 'a month ago' },
  { id: '14', name: 'Max Mustermann (Sample)',  initials: 'MM', avatarColor: 'var(--brand-avatar-2)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Recruiter (Sample)', status: 'internal' }],                                                  sources: ['Indeed'],       tags: ['Sample', 'Mid-level'],        talentPools: ['Recruiting Ops (Sample)'],                            disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '15', name: 'Conor Moreno (Sample)',    initials: 'CM', avatarColor: 'var(--brand-avatar-3)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Recruiter (Sample)', status: 'internal' }],                                                  sources: ['Facebook'],     tags: ['Sample', 'Junior'],           talentPools: ['Rising stars (Sample)'],                            disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '16', name: 'Scot Highlinder (Sample)', initials: 'SH', avatarColor: 'var(--brand-avatar-1)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Senior Marketer (Sample)', status: 'published' }],                                           sources: ['LinkedIn'],     tags: ['Sample', 'Senior'],           talentPools: ['Marketing Bench (Sample)'],                            disqualifiedBy: null,               dateCreated: '2 months ago' },
  { id: '17', name: 'John Doe (Sample)',        initials: 'JD', avatarColor: 'var(--brand-avatar-2)', isNew: true,  status: 'new',           jobs: [{ title: 'Senior Marketer (Sample)', status: 'published' }, { title: 'Backend Engineer', status: 'published' }], sources: ['Indeed'],       tags: ['Sample', 'Senior'],           talentPools: ['Marketing Bench (Sample)'],                            disqualifiedBy: null,               dateCreated: '2 months ago' },
]

const AVATAR_TOKENS = ['var(--brand-avatar-1)', 'var(--brand-avatar-2)', 'var(--brand-avatar-3)']
let genSeq = 0

/**
 * Finds an existing candidate by name (case-insensitive) or creates a new
 * one — the "create or match to avoid duplication" behavior the General
 * Application and Referral flows on the career site need. Mutates
 * ALL_CANDIDATES in place so every consumer (candidates list, talent pools)
 * sees the same record.
 */
export function findOrCreateCandidate(input: { name: string, source: string, tags?: string[], jobTitle?: string, jobStatus?: Candidate['jobs'][number]['status'] }): Candidate {
  const existing = ALL_CANDIDATES.find(c => c.name.trim().toLowerCase() === input.name.trim().toLowerCase())
  if (existing) return existing

  const initials = input.name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'
  const candidate: Candidate = {
    id: `gen${++genSeq}`,
    name: input.name.trim(),
    initials,
    avatarColor: AVATAR_TOKENS[genSeq % AVATAR_TOKENS.length]!,
    isNew: true,
    status: 'new',
    jobs: input.jobTitle ? [{ title: input.jobTitle, status: input.jobStatus ?? 'published' }] : [],
    sources: [input.source],
    tags: input.tags ?? [],
    talentPools: [],
    disqualifiedBy: null,
    dateCreated: 'just now',
  }
  ALL_CANDIDATES.push(candidate)
  return candidate
}

// Smart Distribute demo seed (E1/E2) — ties a handful of candidates to
// team members so "Assigned Recruiter" has real, non-empty data on first
// load. Everyone else (including the disqualified candidate) stays
// unassigned. teamMemberId values match team.handlers.ts's fixture roster.
;(function seedAssignments() {
  const seed: Record<string, number> = { 1: 4, 2: 3, 3: 2, 4: 2 }
  let cursor = 0
  const pool = ALL_CANDIDATES.filter(c => c.status !== 'disqualified')
  for (const [teamMemberId, count] of Object.entries(seed)) {
    for (let i = 0; i < count && cursor < pool.length; i++, cursor++) {
      pool[cursor]!.assignedRecruiterId = teamMemberId
    }
  }
})()

// Backend Engineer (job j1) demo — explicit half-assigned/half-unassigned
// split across the candidates the Pipeline board's fixture shows for this
// job (useJobPipeline.ts's DEMO_STAGES), overriding the generic seed above
// so this job's Smart Distribute demo reads cleanly regardless of where
// these ids land in it. Spread across different recruiters for variety.
;(function seedBackendEngineerAssignments() {
  const BACKEND_ENGINEER_SPLIT: Record<string, string | null> = {
    '17': '2', // John Doe → Sara Rashed
    '5':  '4', // Mikel Lang → Lina Waheed
    '4':  '3', // Kendall McClure → Ahmed Kamal
    '12': null, // Mariela Vasquez → unassigned
    '8':  null, // Wilma Roelendsen → unassigned
    '11': null, // Kevin Hernandez → unassigned
  }
  for (const c of ALL_CANDIDATES) {
    if (c.id in BACKEND_ENGINEER_SPLIT) c.assignedRecruiterId = BACKEND_ENGINEER_SPLIT[c.id]!
  }
})()

// E5 assignment source (E3's "View & Redistribute Candidates per Recruiter"
// Source column/filter: Manually assigned / Self assigned / External).
// Derived from the candidate's own `sources` — an empty list means the
// candidate was hand-entered with no channel (manual); anything else came
// through a real sourcing channel (external). A couple of already-assigned
// candidates are tagged 'self' so the filter's three buckets are all
// non-empty out of the box; real self-claims (candidate profile "Assign to
// me") set this for real going forward via POST /api/candidates/assign.
;(function seedAssignmentSource() {
  for (const c of ALL_CANDIDATES) {
    c.assignmentSource = c.sources.length === 0 ? 'manual' : 'external'
  }
  for (const id of ['6', '9']) {
    const c = ALL_CANDIDATES.find(c => c.id === id)
    if (c) c.assignmentSource = 'self'
  }
})()

export const candidatesHandlers = [
  http.get('/api/candidates', async ({ request }) => {
    await delay(DEV_LATENCY_MS)
    const url = new URL(request.url)
    const status     = url.searchParams.get('status')
    const search     = url.searchParams.get('search') ?? ''
    const job        = url.searchParams.get('job')?.toLowerCase()
    const assignedTo   = url.searchParams.get('assignedTo')
    const assignedToOp = url.searchParams.get('assignedToOp') ?? 'is'
    const page    = Math.max(1, Number(url.searchParams.get('page') ?? 1))
    const perPage = Math.max(1, Number(url.searchParams.get('perPage') ?? 30))

    let result = [...ALL_CANDIDATES]
    if (status) result = result.filter(c => c.status === status)
    // Semantic + boolean search: AND/OR keywords, synonym expansion
    // (e.g. "recruiter" also matches "Talent Acquisition"). See candidateSearch.ts.
    if (search.trim()) result = result.filter(c => matchesSearchQuery(candidateHaystack(c), search))
    if (job) result = result.filter(c => c.jobs.some(j => j.title.toLowerCase().includes(job)))
    // Smart Distribute ownership filter (E2 "Filter by Assigned Recruiter").
    // checkbox-multi — assignedTo is a comma-separated list of team member
    // ids and/or the literal 'unassigned'; assignedToOp flips is/is-not.
    if (assignedTo) {
      const tokens = assignedTo.split(',').filter(Boolean)
      const matches = (c: Candidate) => tokens.some(t => t === 'unassigned' ? !c.assignedRecruiterId : c.assignedRecruiterId === t)
      result = result.filter(c => assignedToOp === 'is-not' ? !matches(c) : matches(c))
    }

    const total = result.length
    const start = (page - 1) * perPage
    const paginated = result.slice(start, start + perPage)

    return HttpResponse.json({
      data: paginated,
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    })
  }),

  http.get('/api/candidates/filters/counts', () => {
    return HttpResponse.json({
      recentlyDeleted: 0,
      qualifiedCandidates: ALL_CANDIDATES.filter(c => c.status === 'qualified').length,
      newCandidates:       ALL_CANDIDATES.filter(c => c.status === 'new').length,
      notContacted:        ALL_CANDIDATES.filter(c => c.status === 'not_contacted').length,
      followedCandidates:  ALL_CANDIDATES.filter(c => c.status === 'followed').length,
    })
  }),

  http.get('/api/candidates/:id', ({ params }) => {
    const candidate = ALL_CANDIDATES.find(c => c.id === params.id)
    if (!candidate) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(candidate)
  }),

  http.get('/api/candidates/:id/profile', async ({ params }) => {
    await delay(DEV_LATENCY_MS)
    const candidate = ALL_CANDIDATES.find(c => c.id === params.id)
    if (!candidate) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(buildProfile(candidate))
  }),

  // Smart Distribute ownership write (E1/E2/E3/E5 all funnel through this
  // one action — auto-assign, redistribute, manual/bulk assign, self-claim).
  // A deliberate exception to "mocks are read-only, mutate a local copy" —
  // filtering by Assigned Recruiter has to reflect a prior assignment even
  // after a fresh query, which a component-local copy can't give it.
  http.post('/api/candidates/assign', async ({ request }) => {
    await delay(150)
    const body = await request.json() as {
      candidateIds: string[]
      recruiterId: string | null
      /** Omit to leave the candidate's existing assignmentSource untouched
       * (e.g. a redistribute that just moves ownership between recruiters). */
      assignmentSource?: 'manual' | 'self' | 'external'
    }
    let updated = 0
    for (const c of ALL_CANDIDATES) {
      if (body.candidateIds.includes(c.id)) {
        c.assignedRecruiterId = body.recruiterId
        if (body.assignmentSource) c.assignmentSource = body.assignmentSource
        updated++
      }
    }
    return HttpResponse.json({ updated })
  }),
]

/** Derives profile-detail fields (email/phone/tasks/notes/etc.) for a base Candidate row. */
function buildProfile(c: Candidate): CandidateProfile {
  const slug = c.name.replace(/\s*\(Sample\)\s*/g, '').trim().toLowerCase().replace(/\s+/g, '.')
  const isDemo = c.id === '5'
  return {
    ...c,
    email: isDemo ? 'mei.lin@mail.com' : `${slug || 'candidate'}@example.com`,
    phone: isDemo ? '+49 30 1234 5678' : '+1 (555) 019-2837',
    location: isDemo ? 'Berlin, Germany' : 'Remote',
    score: c.evaluationScore ? `${c.evaluationScore}%` : c.status === 'disqualified' ? null : '91%',
    source: c.sources[0] ?? 'Referral',
    createdDate: isDemo ? 'May 28, 2026 · Added Manually by Amr Hammad' : c.dateCreated,
    cvFileName: c.status === 'disqualified' ? null : `${c.initials}-CV.pdf`,
    owner: isDemo ? 'Amr Hammad' : 'Mo Salah',
    ownerInitials: isDemo ? 'AH' : 'MS',
    aiCriteria: [
      { label: 'Full Recruitment Cycle Experience', weight: 18 },
      { label: 'Resume Screening Efficiency', weight: 19 },
      { label: 'Interview and Selection Knowledge', weight: 18 },
      { label: 'Applicant Tracking Systems Proficiency', weight: 18 },
      { label: 'Bilingual Communication Skills', weight: 18 },
    ],
    tasks: [
      { id: `${c.id}-t1`, title: 'Schedule intro call', dueDate: '1d', done: false },
    ],
    notes: c.status === 'disqualified'
      ? [{ id: `${c.id}-n1`, author: 'Mo Salah', authorInitials: 'MS', body: c.disqualifiedBy ? `Disqualified: ${c.disqualifiedBy}` : 'Disqualified.', createdAt: c.dateCreated }]
      : [{ id: `${c.id}-n1`, author: 'Mo Salah', authorInitials: 'MS', body: 'Strong first screen — moving to interview.', createdAt: '1d' }],
    lastActivityDetail: isDemo
      ? { when: 'a day ago', actor: 'Mo Salah', actorInitials: 'MS', action: 'completed a task' }
      : { when: c.dateCreated, actor: 'Mo Salah', actorInitials: 'MS', action: 'added this candidate' },
    profileFields: isDemo
      ? { university: null, faculty: null, yearsOfExperience: 8, industryRelevant: false, languages: null, gender: null }
      : { university: null, faculty: null, yearsOfExperience: null, industryRelevant: null, languages: null, gender: null },
    screeningQuestions: isDemo
      ? [
          { id: `${c.id}-sq1`, question: 'Are you legally authorized to work in Germany without visa sponsorship?', answer: 'Yes — I hold an EU Blue Card valid through 2028 and require no sponsorship.' },
          { id: `${c.id}-sq2`, question: 'What is your expected annual salary, and what is your notice period?', answer: 'Targeting €95,000–105,000 gross. My current notice period is 8 weeks to end of month.' },
          { id: `${c.id}-sq3`, question: 'How many years of hands-on experience do you have building distributed backend systems?', answer: '8 years — most recently owning a payments platform handling ~40k requests/second at Northwind Pay.' },
        ]
      : [],
    screenedAt: isDemo ? '11 Jul 2026 (just now)' : null,
    cv: isDemo
      ? {
          candidateName: 'M Sherbiny',
          title: 'Backend Engineer',
          contactLine: 'mei.lin@mail.com · +49 30 1234 5678',
          summary: 'Senior backend engineer with 8 years building distributed systems and payment infrastructure at scale. Led a monolith-to-microservices migration handling 40k requests/second.',
          experience: [
            { role: 'Staff Backend Engineer', company: 'Northwind Pay', period: '2021 — Present', location: 'Berlin', description: 'Own the payments platform. Cut settlement latency 60% and led a team of 5.' },
            { role: 'Senior Software Engineer', company: 'Kestrel Labs', period: '2017 — 2021', location: 'Amsterdam', description: 'Built the core API and CI pipeline from scratch; scaled to 2M users.' },
            { role: 'Software Engineer', company: 'Bright Motion', period: '2015 — 2017', location: 'Remote', description: 'Full-stack product work on a logistics dashboard.' },
          ],
          skills: ['Go', 'PostgreSQL', 'Kafka', 'Kubernetes', 'gRPC', 'AWS'],
          education: [{ degree: 'MSc Computer Science', school: 'TU Delft', period: '2013 — 2015' }],
        }
      : null,
  }
}
