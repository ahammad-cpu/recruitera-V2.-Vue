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
 */
const ALL_CANDIDATES: Candidate[] = [
  { id: '1',  name: 'dasdasdasdasd',            initials: 'D',  avatarColor: 'var(--brand-avatar-1)', isNew: true,  status: 'new',          jobs: [],                                                                                                    sources: [],              tags: [],                            talentPools: [],                            disqualifiedBy: null,               dateCreated: 'an hour ago' },
  { id: '2',  name: 'asdsd',                    initials: 'A',  avatarColor: 'var(--brand-avatar-2)', isNew: true,  status: 'new',          jobs: [],                                                                                                    sources: [],              tags: [],                            talentPools: [],                            disqualifiedBy: null,               dateCreated: 'an hour ago' },
  { id: '3',  name: 'dasda',                    initials: 'D',  avatarColor: 'var(--brand-avatar-3)', isNew: true,  status: 'new',          jobs: [],                                                                                                    sources: [],              tags: [],                            talentPools: [],                            disqualifiedBy: null,               dateCreated: 'an hour ago' },
  { id: '4',  name: 'Kendall McClure (Sample)', initials: 'KM', avatarColor: 'var(--brand-avatar-1)', isNew: false, status: 'not_contacted', jobs: [],                                                                                                    sources: ['Indeed'],       tags: ['Sample', 'Junior'],           talentPools: ['Next recruitment - Q3 (Sample)'], disqualifiedBy: null,       dateCreated: 'a month ago' },
  { id: '5',  name: 'Mikel Lang (Sample)',      initials: 'ML', avatarColor: 'var(--brand-avatar-2)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Backend Engineer', status: 'internal', location: 'Berlin, Germany', assignedDate: 'May 28, 2026' }, { title: 'Frontend Engineer', status: 'published', disqualified: true, location: 'Amsterdam', assignedDate: '11 Jul 2026' }],  sources: ['LinkedIn'],     tags: ['Sample', 'Mid-level'],        talentPools: ['Engineering (Sample)'],      disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '6',  name: 'John Smith (Sample)',      initials: 'JS', avatarColor: 'var(--brand-avatar-3)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Senior Marketer (Sample)', status: 'published' }],                                           sources: ['Referral'],     tags: ['Sample', 'Mid-level'],        talentPools: [],                            disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '7',  name: 'Zachery Bahringer (Sample)', initials: 'ZB', avatarColor: 'var(--brand-avatar-1)', isNew: false, status: 'not_contacted', jobs: [],                                                                                                  sources: ['Indeed'],       tags: ['Sample', 'Junior'],           talentPools: ['Rising stars (Sample)'],     disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '8',  name: 'Wilma Roelendsen (Sample)', initials: 'WR', avatarColor: 'var(--brand-avatar-2)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Recruiter (Sample)', status: 'internal' }, { title: 'Senior Marketer (Sample)', status: 'published' }], sources: ['Indeed'],       tags: ['Sample', 'Mid-level'],        talentPools: [],                            disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '9',  name: 'Serena Uppin (Sample)',    initials: 'SU', avatarColor: 'var(--brand-avatar-3)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Senior Marketer (Sample)', status: 'published' }, { title: 'Recruiter (Sample)', status: 'internal' }], sources: ['Careers site'], tags: ['Sample', 'Senior'],           talentPools: [],                            disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '10', name: 'Brooke Strosin (Sample)',  initials: 'BS', avatarColor: 'var(--brand-avatar-1)', isNew: false, status: 'not_contacted', jobs: [],                                                                                                    sources: ['Resume sent'],  tags: ['Sample'],                     talentPools: ['Next recruitment - Q3 (Sample)'], disqualifiedBy: null,       dateCreated: 'a month ago' },
  { id: '11', name: 'Kevin Hernandez (Sample)', initials: 'KH', avatarColor: 'var(--brand-avatar-2)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Senior Marketer (Sample)', status: 'published' }],                                           sources: ['Resume sent'],  tags: ['Sample', 'Senior'],           talentPools: [],                            disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '12', name: 'Mariela Vasquez (Sample)', initials: 'MV', avatarColor: 'var(--brand-avatar-3)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Senior Marketer (Sample)', status: 'published' }],                                           sources: ['Careers site'], tags: ['Sample', 'Senior'],           talentPools: [],                            disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '13', name: 'Anna Jansen (Sample)',     initials: 'AJ', avatarColor: 'var(--brand-avatar-1)', isNew: false, status: 'disqualified',  jobs: [{ title: 'Marketer (Sample)', status: 'archived' }, { title: 'Senior Marketer (Sample)', status: 'published' }],   sources: ['Indeed'],       tags: ['Sample', 'Junior'],           talentPools: ['Rising stars (Sample)'],     disqualifiedBy: 'Knockout question', dateCreated: 'a month ago' },
  { id: '14', name: 'Max Mustermann (Sample)',  initials: 'MM', avatarColor: 'var(--brand-avatar-2)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Recruiter (Sample)', status: 'internal' }],                                                  sources: ['Indeed'],       tags: ['Sample', 'Mid-level'],        talentPools: [],                            disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '15', name: 'Conor Moreno (Sample)',    initials: 'CM', avatarColor: 'var(--brand-avatar-3)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Recruiter (Sample)', status: 'internal' }],                                                  sources: ['Facebook'],     tags: ['Sample', 'Junior'],           talentPools: [],                            disqualifiedBy: null,               dateCreated: 'a month ago' },
  { id: '16', name: 'Scot Highlinder (Sample)', initials: 'SH', avatarColor: 'var(--brand-avatar-1)', isNew: false, status: 'not_contacted', jobs: [{ title: 'Senior Marketer (Sample)', status: 'published' }],                                           sources: ['LinkedIn'],     tags: ['Sample', 'Senior'],           talentPools: [],                            disqualifiedBy: null,               dateCreated: '2 months ago' },
  { id: '17', name: 'John Doe (Sample)',        initials: 'JD', avatarColor: 'var(--brand-avatar-2)', isNew: true,  status: 'new',           jobs: [{ title: 'Senior Marketer (Sample)', status: 'published' }],                                           sources: ['Indeed'],       tags: ['Sample', 'Senior'],           talentPools: [],                            disqualifiedBy: null,               dateCreated: '2 months ago' },
]

export const candidatesHandlers = [
  http.get('/api/candidates', async ({ request }) => {
    await delay(DEV_LATENCY_MS)
    const url = new URL(request.url)
    const status  = url.searchParams.get('status')
    const search  = url.searchParams.get('search') ?? ''
    const job     = url.searchParams.get('job')?.toLowerCase()
    const pool    = url.searchParams.get('pool')
    const page    = Math.max(1, Number(url.searchParams.get('page') ?? 1))
    const perPage = Math.max(1, Number(url.searchParams.get('perPage') ?? 30))

    let result = [...ALL_CANDIDATES]
    if (status) result = result.filter(c => c.status === status)
    // Semantic + boolean search: AND/OR keywords, synonym expansion
    // (e.g. "recruiter" also matches "Talent Acquisition"). See candidateSearch.ts.
    if (search.trim()) result = result.filter(c => matchesSearchQuery(candidateHaystack(c), search))
    if (job) result = result.filter(c => c.jobs.some(j => j.title.toLowerCase().includes(job)))
    if (pool) result = result.filter(c => c.talentPools.includes(pool))

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
