import { http, HttpResponse, delay } from 'msw'
import type {
  CandidatesReportResponse, CareersSiteReportResponse, DisqualificationsReportResponse,
  DrillDownCandidateRow, DrillDownResponse, EvaluationsReportResponse, FunnelStep,
  HiresReportResponse, InterviewsReportResponse, JobReportResponse, JobsReportResponse,
  PipelinesReportResponse, ReportFilterOptions, CategoryValue, KpiCard, SeriesPoint,
} from '~/types'
import { ALL_CANDIDATES } from './candidates.handlers'
import { teamMembers } from './team.handlers'
import { useJobs } from '~/composables/useJobs'

const DEV_LATENCY_MS = 300

// ─── Shared vocabulary ─────────────────────────────────────────────────────
// Reconciles the legacy funnel (Sourced/Applied/Phone Interview/On-site
// Interview/Evaluation/Offer/Hired) with this codebase's existing stage
// vocabulary (JobStageDot, PipelineStageType) — see reports-module spec.
const FUNNEL_STAGES = ['Sourced', 'Applied', 'Phone Screening', 'Interview', 'Evaluation', 'Offer', 'Hired'] as const
type FunnelStage = typeof FUNNEL_STAGES[number]

// Real taxonomy, otherwise only local component state in
// settings/workflow/disqualify.vue — reused here rather than re-invented.
const DISQUALIFY_REASONS = ['Not a fit', 'Hired elsewhere', 'Lack of knowledge', 'Overpriced', 'Spam', 'Lacks interpersonal skills', 'Wrong skill set']
const TRAFFIC_SOURCES = ['Direct', 'LinkedIn', 'Google', 'Wuzzuf', 'Other']

// The one Hiring-Manager-role member in team.handlers.ts's fixture — every
// job maps to them for the Hiring Manager filter (there's no per-job
// hiring-manager field anywhere in the real Job data to read from instead).
const HIRING_MANAGER_ID = teamMembers.find(m => m.role === 'Hiring Manager')?.id ?? null

// ─── Deterministic helpers (stable across reloads, no Math.random) ────────
function seededFraction(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return (h % 1000) / 1000
}
function addDays(d: Date, n: number): Date { const c = new Date(d); c.setDate(c.getDate() + n); return c }
function addHours(d: Date, n: number): Date { const c = new Date(d); c.setHours(c.getHours() + n); return c }
function daysBetween(a: Date, b: Date): number { return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000)) }
function isoDay(d: Date): string { return d.toISOString().slice(0, 10) }

/** This fixture's `dateCreated` is relative text ('a month ago', 'just now'), not an ISO
 * date — parsed into a concrete anchor so day-level math (avg time per stage, TTH…) works. */
function parseRelativeDate(text: string): Date {
  const now = new Date()
  if (text.includes('hour')) return addHours(now, -1)
  if (text === 'just now') return now
  const n = /^(\d+)/.exec(text)?.[1]
  if (text.includes('month')) return addDays(now, -30 * (n ? Number(n) : 1))
  if (text.includes('week')) return addDays(now, -7 * (n ? Number(n) : 1))
  if (text.includes('day')) return addDays(now, -(n ? Number(n) : 1))
  return now
}

function originFor(sources: string[]): 'Applied' | 'Sourced' | 'Referred' {
  if (sources.includes('Referral')) return 'Referred'
  if (sources.length === 0) return 'Applied'
  if (sources.some(s => s === 'Careers site' || s === 'Resume sent')) return 'Applied'
  return 'Sourced'
}

// ─── Candidate seed: outcome + current/final stage per candidate. Hand-
// written (not algorithmic) for the same reason the Smart Distribute seeds
// in candidates.handlers.ts are hand-written — full control over a small,
// legible, believable fixture. Candidate job titles in ALL_CANDIDATES don't
// line up with the real Jobs fixture (different design-reference vintage —
// confirmed pre-existing mismatch), so job assignment here is a fresh,
// self-consistent mapping scoped to Reports only, not a re-read of
// candidate.jobs[].title. Only candidates attached to a real job are used —
// ids 1/2/3/7/10 (jobs: []) are test/unassigned-application rows, out of
// scope for pipeline/funnel reporting. */
type Outcome = 'active' | 'hired' | 'disqualified'
interface CandidateSeed {
  id: string
  jobId: string
  outcome: Outcome
  /** Current stage (active), stage reached before disqualification, or 'Hired'. */
  stage: FunnelStage
  disqualifyReason?: string
  disqualifyTrigger?: 'knockout_question' | 'recruiter'
  /** 4 = Strong Yes, 3 = Yes, 2 = Not Sure, 1 = No. Omitted = not evaluated. */
  evaluationScore?: 1 | 2 | 3 | 4
}

const CANDIDATE_SEEDS: CandidateSeed[] = [
  { id: '4', jobId: 'j1', outcome: 'hired', stage: 'Hired', evaluationScore: 4 },
  { id: '5', jobId: 'j2', outcome: 'active', stage: 'Interview', evaluationScore: 3 },
  { id: '6', jobId: 'j3', outcome: 'disqualified', stage: 'Interview', disqualifyReason: 'Not a fit', disqualifyTrigger: 'recruiter' },
  { id: '8', jobId: 'j1', outcome: 'hired', stage: 'Hired', evaluationScore: 4 },
  { id: '9', jobId: 'j3', outcome: 'active', stage: 'Phone Screening', evaluationScore: 2 },
  { id: '11', jobId: 'j4', outcome: 'disqualified', stage: 'Phone Screening', disqualifyReason: 'Wrong skill set', disqualifyTrigger: 'recruiter' },
  { id: '12', jobId: 'j1', outcome: 'active', stage: 'Evaluation', evaluationScore: 3 },
  { id: '13', jobId: 'j3', outcome: 'disqualified', stage: 'Applied', disqualifyReason: 'Knockout question', disqualifyTrigger: 'knockout_question' },
  { id: '14', jobId: 'j6', outcome: 'active', stage: 'Sourced' },
  { id: '15', jobId: 'j7', outcome: 'active', stage: 'Applied' },
  { id: '16', jobId: 'j3', outcome: 'active', stage: 'Offer', evaluationScore: 4 },
  { id: '17', jobId: 'j1', outcome: 'active', stage: 'Applied' },
]

// Catches a typo'd reason drifting from the real Settings taxonomy — 'Knockout
// question' is the one deliberate exception (an auto-disqualify trigger label,
// not a recruiter-chosen reason).
for (const seed of CANDIDATE_SEEDS) {
  if (seed.disqualifyReason && seed.disqualifyReason !== 'Knockout question' && !DISQUALIFY_REASONS.includes(seed.disqualifyReason)) {
    throw new Error(`reports.handlers.ts: "${seed.disqualifyReason}" is not in the Settings disqualify-reasons taxonomy`)
  }
}

export interface EnrichedCandidate {
  id: string
  name: string
  initials: string
  avatarColor: string
  jobId: string
  jobTitle: string
  department: string
  collar: 'white' | 'blue'
  recruiterId: string | null
  hiringManagerId: string | null
  sources: string[]
  origin: 'Applied' | 'Sourced' | 'Referred'
  talentPools: string[]
  appliedAt: Date
  stageHistory: { stage: FunnelStage, enteredAt: Date }[]
  currentStage: FunnelStage
  outcome: Outcome
  hiredAt: Date | null
  startAt: Date | null
  disqualifiedAt: Date | null
  disqualifyReason: string | null
  disqualifyTrigger: 'knockout_question' | 'recruiter' | null
  evaluationScore: 1 | 2 | 3 | 4 | null
}

let ENRICHED_CACHE: EnrichedCandidate[] | null = null

function buildEnriched(): EnrichedCandidate[] {
  if (ENRICHED_CACHE) return ENRICHED_CACHE
  const { jobs } = useJobs()
  const jobsById = new Map(jobs.value.map(j => [j.id, j]))

  ENRICHED_CACHE = CANDIDATE_SEEDS.map((seed) => {
    const base = ALL_CANDIDATES.find(c => c.id === seed.id)!
    const job = jobsById.get(seed.jobId)!
    const appliedAt = parseRelativeDate(base.dateCreated)

    const stagesReached = FUNNEL_STAGES.slice(0, FUNNEL_STAGES.indexOf(seed.stage) + 1)
    let cursor = appliedAt
    const stageHistory = stagesReached.map((stage) => {
      const entry = { stage, enteredAt: cursor }
      const gap = 2 + Math.floor(seededFraction(seed.id + stage) * 8)
      cursor = addDays(cursor, gap)
      return entry
    })

    const hiredAt = seed.outcome === 'hired' ? stageHistory[stageHistory.length - 1]!.enteredAt : null
    const startAt = hiredAt ? addDays(hiredAt, 12 + Math.floor(seededFraction(seed.id + 'start') * 10)) : null
    const disqualifiedAt = seed.outcome === 'disqualified'
      ? addDays(stageHistory[stageHistory.length - 1]!.enteredAt, 1 + Math.floor(seededFraction(seed.id + 'dq') * 3))
      : null

    return {
      id: base.id,
      name: base.name,
      initials: base.initials,
      avatarColor: base.avatarColor,
      jobId: job.id,
      jobTitle: job.title,
      department: job.department ?? 'Unassigned',
      collar: job.collar,
      recruiterId: base.assignedRecruiterId ?? null,
      hiringManagerId: HIRING_MANAGER_ID,
      sources: base.sources,
      origin: originFor(base.sources),
      talentPools: base.talentPools,
      appliedAt,
      stageHistory,
      currentStage: seed.stage,
      outcome: seed.outcome,
      hiredAt,
      startAt,
      disqualifiedAt,
      disqualifyReason: seed.disqualifyReason ?? null,
      disqualifyTrigger: seed.disqualifyTrigger ?? null,
      evaluationScore: seed.evaluationScore ?? null,
    }
  })
  return ENRICHED_CACHE
}

// ─── Job lifecycle dates (publish/fill/close) — gap-filled here only, not
// bolted onto the real Job type (see spec: "Reused vs. new"). Derived from
// each job's existing createdAt + status so numbers stay consistent. ───────
function jobLifecycle(job: { id: string, status: string, createdAt: string, hires: number }) {
  const publishedAt = new Date(job.createdAt)
  // Target openings must be at least the actual hire count, or a fully-hired
  // job would show a nonsensical >100% fill rate.
  const positions = Math.max(job.hires, 1 + Math.floor(seededFraction(job.id + 'pos') * 4))
  const filledAt = job.hires >= positions && job.hires > 0
    ? addDays(publishedAt, 20 + Math.floor(seededFraction(job.id + 'fill') * 60))
    : null
  const closedAt = job.status === 'closed' || job.status === 'archived'
    ? addDays(publishedAt, 30 + Math.floor(seededFraction(job.id + 'close') * 90))
    : null
  return { publishedAt, positions, filledAt: job.status === 'closed' ? null : filledAt, closedAt }
}

// ─── Generated adapters for dependencies not built yet (Scheduler, M26
// Evaluation, Career Site sessions) — per BRD §0 instruction to "build clean
// interfaces/adapters... so they can be wired to real data later." Each
// derives from the same enriched candidate pool, not a disconnected cast.
// M15 Offer data (accepted date, start date) doesn't need its own adapter —
// EnrichedCandidate already carries hiredAt/startAt as that offer outcome. ─
interface InterviewRecord { id: string, candidateId: string, interviewerId: string | null, date: Date, durationMinutes: number, type: 'Online' | 'On-site', status: 'Completed' }
interface EvaluationRecord { id: string, candidateId: string, evaluatorId: string, score: 1 | 2 | 3 | 4, requestedAt: Date, submittedAt: Date, status: 'Completed' }

function buildInterviews(enriched: EnrichedCandidate[]): InterviewRecord[] {
  const durations = [20, 35, 45, 50, 65, 80, 95, 110]
  return enriched
    .filter(ec => FUNNEL_STAGES.indexOf(ec.currentStage) >= FUNNEL_STAGES.indexOf('Interview'))
    .map((ec, i) => {
      const entry = ec.stageHistory.find(s => s.stage === 'Interview')!
      return {
        id: `iv-${ec.id}`,
        candidateId: ec.id,
        interviewerId: ec.recruiterId ?? teamMembers[i % teamMembers.length]!.id,
        date: entry.enteredAt,
        durationMinutes: durations[Math.floor(seededFraction(ec.id + 'dur') * durations.length)]!,
        type: seededFraction(ec.id + 'type') > 0.5 ? 'Online' : 'On-site',
        status: 'Completed',
      }
    })
}

function buildEvaluations(enriched: EnrichedCandidate[]): EvaluationRecord[] {
  return enriched.filter(ec => ec.evaluationScore != null).map((ec, i) => {
    const entry = ec.stageHistory.find(s => s.stage === 'Evaluation') ?? ec.stageHistory[ec.stageHistory.length - 1]!
    const requestedAt = addDays(entry.enteredAt, -1)
    return {
      id: `ev-${ec.id}`,
      candidateId: ec.id,
      evaluatorId: teamMembers[(i + 1) % teamMembers.length]!.id,
      score: ec.evaluationScore!,
      requestedAt,
      submittedAt: entry.enteredAt,
      status: 'Completed',
    }
  })
}

const SCORE_LABEL: Record<1 | 2 | 3 | 4, string> = { 4: 'Strong Yes', 3: 'Yes', 2: 'Not Sure', 1: 'No' }

// ─── Career Site — no tracking data exists anywhere in this codebase despite
// the public pages being built (confirmed via audit). Aggregate daily
// sessions/applications only — no consumer needs session-level granularity. */
interface CareerSiteDay { date: string, visits: number, applications: number, avgDurationSeconds: number, bounceRate: number }
function buildCareerSiteDays(): CareerSiteDay[] {
  const days: CareerSiteDay[] = []
  const now = new Date()
  for (let i = 89; i >= 0; i--) {
    const d = addDays(now, -i)
    const key = isoDay(d)
    const visits = 18 + Math.floor(seededFraction(key + 'v') * 35)
    const applications = Math.max(0, Math.round(visits * (0.03 + seededFraction(key + 'a') * 0.05)))
    days.push({
      date: key,
      visits,
      applications,
      avgDurationSeconds: 80 + Math.floor(seededFraction(key + 'd') * 160),
      bounceRate: 0.32 + seededFraction(key + 'b') * 0.25,
    })
  }
  return days
}

// ─── Filters ────────────────────────────────────────────────────────────
interface ParsedFilters {
  from: Date | null
  to: Date | null
  departments: string[]
  jobIds: string[]
  recruiterIds: string[]
  hiringManagerIds: string[]
  talentPoolIds: string[]
  collar: 'all' | 'white' | 'blue'
}

function parseFilters(url: URL): ParsedFilters {
  const csv = (key: string) => (url.searchParams.get(key) ?? '').split(',').filter(Boolean)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  return {
    from: from ? new Date(from) : null,
    to: to ? new Date(to) : null,
    departments: csv('departments'),
    jobIds: csv('jobIds'),
    recruiterIds: csv('recruiterIds'),
    hiringManagerIds: csv('hiringManagerIds'),
    talentPoolIds: csv('talentPoolIds'),
    collar: (url.searchParams.get('collar') as ParsedFilters['collar']) || 'all',
  }
}

function matchesStatic(ec: EnrichedCandidate, f: ParsedFilters): boolean {
  if (f.departments.length && !f.departments.includes(ec.department)) return false
  if (f.jobIds.length && !f.jobIds.includes(ec.jobId)) return false
  if (f.recruiterIds.length && (!ec.recruiterId || !f.recruiterIds.includes(ec.recruiterId))) return false
  if (f.hiringManagerIds.length && (!ec.hiringManagerId || !f.hiringManagerIds.includes(ec.hiringManagerId))) return false
  if (f.talentPoolIds.length && !ec.talentPools.some(tp => f.talentPoolIds.includes(tp))) return false
  if (f.collar !== 'all' && ec.collar !== f.collar) return false
  return true
}

function inRange(date: Date | null, f: ParsedFilters): boolean {
  if (!date) return false
  if (f.from && date < f.from) return false
  if (f.to && date > f.to) return false
  return true
}

function kpi(key: string, label: string, value: string | number, sublabel?: string, danger = false): KpiCard {
  return { key, label, value: String(value), sublabel, danger }
}

function toCategoryValues(counts: Map<string, number>, total: number): CategoryValue[] {
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value, percent: total ? Math.round((value / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.value - a.value)
}

function bucketByDay(dates: Date[]): SeriesPoint[] {
  const counts = new Map<string, number>()
  for (const d of dates) counts.set(isoDay(d), (counts.get(isoDay(d)) ?? 0) + 1)
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }))
}

// ─── Handlers ──────────────────────────────────────────────────────────
export const reportsHandlers = [
  http.get('/api/reports/filter-options', async () => {
    await delay(DEV_LATENCY_MS)
    const { jobs } = useJobs()
    const enriched = buildEnriched()
    const options: ReportFilterOptions = {
      departments: [...new Set(jobs.value.map(j => j.department).filter((d): d is string => !!d))].sort(),
      jobs: jobs.value.map(j => ({ id: j.id, title: j.title })),
      recruiters: teamMembers.map(m => ({ id: m.id, name: m.name })),
      hiringManagers: teamMembers.filter(m => m.role === 'Hiring Manager').map(m => ({ id: m.id, name: m.name })),
      talentPools: [...new Set(ALL_CANDIDATES.flatMap(c => c.talentPools))].sort(),
      hasBlueCollar: enriched.some(e => e.collar === 'blue'),
      hasWhiteCollar: enriched.some(e => e.collar === 'white'),
    }
    return HttpResponse.json(options)
  }),

  http.get('/api/reports/jobs', async ({ request }) => {
    await delay(DEV_LATENCY_MS)
    const f = parseFilters(new URL(request.url))
    const { jobs } = useJobs()
    const enriched = buildEnriched().filter(ec => matchesStatic(ec, f))
    let jobList = jobs.value
    if (f.departments.length) jobList = jobList.filter(j => j.department && f.departments.includes(j.department))
    if (f.jobIds.length) jobList = jobList.filter(j => f.jobIds.includes(j.id))
    if (f.collar !== 'all') jobList = jobList.filter(j => j.collar === f.collar)
    const lifecycle = new Map(jobList.map(j => [j.id, jobLifecycle(j)]))

    const publishedJobs = jobList.filter((j) => {
      const lc = lifecycle.get(j.id)!
      return j.status === 'published' && inRange(lc.publishedAt, f) || (!f.from && !f.to && j.status === 'published')
    })
    const filledJobs = jobList.filter(j => lifecycle.get(j.id)!.filledAt && inRange(lifecycle.get(j.id)!.filledAt, f))
    const closedJobs = jobList.filter(j => lifecycle.get(j.id)!.closedAt && j.hires === 0 && inRange(lifecycle.get(j.id)!.closedAt, f))
    const fillRate = (filledJobs.length + closedJobs.length) ? Math.round((filledJobs.length / (filledJobs.length + closedJobs.length)) * 1000) / 10 : 0
    const avgTtf = filledJobs.length
      ? Math.round(filledJobs.reduce((s, j) => s + daysBetween(lifecycle.get(j.id)!.publishedAt, lifecycle.get(j.id)!.filledAt!), 0) / filledJobs.length)
      : 0
    const avgTtc = closedJobs.length
      ? Math.round(closedJobs.reduce((s, j) => s + daysBetween(lifecycle.get(j.id)!.publishedAt, lifecycle.get(j.id)!.closedAt!), 0) / closedJobs.length)
      : 0

    const jobEvents = new Map<string, { published: number, filled: number, closed: number }>()
    for (const j of jobList) {
      const lc = lifecycle.get(j.id)!
      for (const [dateVal, key] of [[lc.publishedAt, 'published'], [lc.filledAt, 'filled'], [lc.closedAt, 'closed']] as const) {
        if (!dateVal) continue
        const day = isoDay(dateVal)
        const row = jobEvents.get(day) ?? { published: 0, filled: 0, closed: 0 }
        row[key]++
        jobEvents.set(day, row)
      }
    }

    const now = new Date()
    const openTimePerJob = jobList.filter(j => j.status === 'published' || j.status === 'internal').map(j => ({
      jobId: j.id, jobTitle: j.title, daysOpen: daysBetween(lifecycle.get(j.id)!.publishedAt, now), overSla: daysBetween(lifecycle.get(j.id)!.publishedAt, now) > 60,
    })).sort((a, b) => b.daysOpen - a.daysOpen)

    const fillRatePerJob = jobList.map((j) => {
      const positions = lifecycle.get(j.id)!.positions
      return { jobId: j.id, jobTitle: j.title, positionsNeeded: positions, hires: j.hires, fillRate: Math.round((j.hires / positions) * 1000) / 10 }
    }).sort((a, b) => a.fillRate - b.fillRate)

    const deptCounts = new Map<string, number>()
    for (const j of jobList.filter(j => j.status === 'published')) deptCounts.set(j.department ?? 'Unassigned', (deptCounts.get(j.department ?? 'Unassigned') ?? 0) + 1)

    const deptFillRate = new Map<string, { filled: number, total: number }>()
    for (const j of jobList) {
      const dept = j.department ?? 'Unassigned'
      const lc = lifecycle.get(j.id)!
      const row = deptFillRate.get(dept) ?? { filled: 0, total: 0 }
      if (lc.filledAt) { row.filled++; row.total++ }
      else if (lc.closedAt && j.hires === 0) row.total++
      deptFillRate.set(dept, row)
    }

    const body: JobsReportResponse = {
      kpis: {
        publishedJobs: kpi('publishedJobs', 'Published Jobs', publishedJobs.length),
        filledJobs: kpi('filledJobs', 'Filled Jobs', filledJobs.length),
        closedJobs: kpi('closedJobs', 'Closed Jobs', closedJobs.length),
        fillRate: kpi('fillRate', 'Fill Rate', `${fillRate}%`),
        avgTimeToFill: kpi('avgTimeToFill', 'Avg Time to Fill', `${avgTtf}d`),
        avgTimeToClose: kpi('avgTimeToClose', 'Avg Time to Close', `${avgTtc}d`),
      },
      jobEventsOverTime: [...jobEvents.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v })),
      openTimePerJob,
      fillRatePerJob,
      publishedJobsPerDepartment: toCategoryValues(deptCounts, [...deptCounts.values()].reduce((a, b) => a + b, 0)),
      fillRatePerDepartment: [...deptFillRate.entries()].map(([label, v]) => ({ label, value: v.total ? Math.round((v.filled / v.total) * 1000) / 10 : 0 })),
    }
    void enriched
    return HttpResponse.json(body)
  }),

  http.get('/api/reports/candidates', async ({ request }) => {
    await delay(DEV_LATENCY_MS)
    const f = parseFilters(new URL(request.url))
    const enriched = buildEnriched().filter(ec => matchesStatic(ec, f))

    const newCandidates = enriched.filter(ec => inRange(ec.appliedAt, f))
    const movedForward = enriched.filter(ec => inRange(ec.appliedAt, f) && ec.stageHistory.length > 1)
    const disqualified = enriched.filter(ec => ec.disqualifiedAt && inRange(ec.disqualifiedAt, f))
    const now = new Date()
    const overdue = enriched.filter(ec => ec.outcome === 'active' && daysBetween(ec.stageHistory[ec.stageHistory.length - 1]!.enteredAt, now) > 7)

    const originSeries = new Map<string, { Applied: number, Sourced: number, Referred: number }>()
    for (const ec of newCandidates) {
      const day = isoDay(ec.appliedAt)
      const row = originSeries.get(day) ?? { Applied: 0, Sourced: 0, Referred: 0 }
      row[ec.origin]++
      originSeries.set(day, row)
    }

    const statusCounts = new Map<string, number>()
    for (const ec of newCandidates) {
      const label = ec.outcome === 'disqualified' ? 'Disqualified' : ec.recruiterId ? 'Qualified' : 'Unassigned'
      statusCounts.set(label, (statusCounts.get(label) ?? 0) + 1)
    }

    const sourceCounts = new Map<string, number>()
    for (const ec of enriched) for (const s of (ec.sources.length ? ec.sources : ['Direct'])) sourceCounts.set(s, (sourceCounts.get(s) ?? 0) + 1)

    const hiresPerSourceMap = new Map<string, { total: number, hired: number }>()
    for (const ec of enriched) {
      for (const s of (ec.sources.length ? ec.sources : ['Direct'])) {
        const row = hiresPerSourceMap.get(s) ?? { total: 0, hired: 0 }
        row.total++
        if (ec.outcome === 'hired') row.hired++
        hiresPerSourceMap.set(s, row)
      }
    }

    const perJob = new Map<string, { jobTitle: string, qualified: number, disqualified: number, hired: number }>()
    for (const ec of enriched) {
      const row = perJob.get(ec.jobId) ?? { jobTitle: ec.jobTitle, qualified: 0, disqualified: 0, hired: 0 }
      if (ec.outcome === 'disqualified') row.disqualified++
      else row.qualified++
      if (ec.outcome === 'hired') row.hired++
      perJob.set(ec.jobId, row)
    }

    const body: CandidatesReportResponse = {
      kpis: {
        newCandidates: kpi('newCandidates', 'New Candidates', newCandidates.length),
        movedForward: kpi('movedForward', 'Moved Forward', movedForward.length),
        disqualified: kpi('disqualified', 'Disqualified', disqualified.length),
        overdueCandidates: kpi('overdueCandidates', 'Overdue Candidates', overdue.length, '> 7 days inactive'),
      },
      candidatesOverTimeByOrigin: [...originSeries.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v })),
      newCandidatesByStatus: toCategoryValues(statusCounts, newCandidates.length),
      candidatesPerSource: toCategoryValues(sourceCounts, enriched.length),
      hiresPerSource: [...hiresPerSourceMap.entries()].map(([label, v]) => ({ label, values: v })),
      qualifiedCandidatesPerJob: [...perJob.entries()].map(([jobId, v]) => ({ jobId, ...v })),
    }
    return HttpResponse.json(body)
  }),

  http.get('/api/reports/pipelines', async ({ request }) => {
    await delay(DEV_LATENCY_MS)
    const f = parseFilters(new URL(request.url))
    const enriched = buildEnriched().filter(ec => matchesStatic(ec, f))

    const interviewed = enriched.filter(ec => ec.stageHistory.some(s => s.stage === 'Interview' && inRange(s.enteredAt, f)))
    const offered = enriched.filter(ec => ec.stageHistory.some(s => s.stage === 'Offer' && inRange(s.enteredAt, f)))
    const hired = enriched.filter(ec => ec.hiredAt && inRange(ec.hiredAt, f))

    const eventSeries = new Map<string, { Applied: number, Active: number, Hired: number }>()
    for (const ec of enriched) {
      for (const s of ec.stageHistory) {
        const day = isoDay(s.enteredAt)
        const row = eventSeries.get(day) ?? { Applied: 0, Active: 0, Hired: 0 }
        if (s.stage === 'Applied') row.Applied++
        else if (s.stage === 'Hired') row.Hired++
        else row.Active++
        eventSeries.set(day, row)
      }
    }

    const stageCounts = new Map<string, number>()
    for (const ec of enriched.filter(e => e.outcome === 'active')) stageCounts.set(ec.currentStage, (stageCounts.get(ec.currentStage) ?? 0) + 1)
    const candidatesPerStage = FUNNEL_STAGES.map(stage => ({ label: stage, value: stageCounts.get(stage) ?? 0 }))

    const proceedRatePerStage: FunnelStep[] = FUNNEL_STAGES.map((stage, i) => {
      const entered = enriched.filter(ec => ec.stageHistory.some(s => s.stage === stage)).length
      const nextStage = FUNNEL_STAGES[i + 1]
      const proceeded = nextStage ? enriched.filter(ec => ec.stageHistory.some(s => s.stage === nextStage)).length : entered
      const proceedRate = entered ? Math.round((proceeded / entered) * 1000) / 10 : 0
      return { stage, entered, proceeded, proceedRate, dropOffRate: Math.round((100 - proceedRate) * 10) / 10 }
    })

    const timeToReach = new Map<string, number[]>()
    const timeInStage = new Map<string, number[]>()
    for (const ec of enriched) {
      for (let i = 0; i < ec.stageHistory.length; i++) {
        const s = ec.stageHistory[i]!
        timeToReach.set(s.stage, [...(timeToReach.get(s.stage) ?? []), daysBetween(ec.appliedAt, s.enteredAt)])
        const exit = ec.stageHistory[i + 1]?.enteredAt ?? ec.disqualifiedAt ?? new Date()
        timeInStage.set(s.stage, [...(timeInStage.get(s.stage) ?? []), daysBetween(s.enteredAt, exit)])
      }
    }
    const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0

    const body: PipelinesReportResponse = {
      kpis: {
        interviewed: kpi('interviewed', 'Interviewed (period)', interviewed.length),
        offered: kpi('offered', 'Offered (period)', offered.length),
        hired: kpi('hired', 'Hired (period)', hired.length),
      },
      pipelineEventsOverTime: [...eventSeries.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v })),
      candidatesPerStage,
      proceedRatePerStage,
      avgTimeToReachStage: FUNNEL_STAGES.map(stage => ({ label: stage, value: avg(timeToReach.get(stage) ?? []) })),
      avgTimeSpentPerStage: FUNNEL_STAGES.map(stage => ({ label: stage, value: avg(timeInStage.get(stage) ?? []) })),
    }
    return HttpResponse.json(body)
  }),

  http.get('/api/reports/disqualifications', async ({ request }) => {
    await delay(DEV_LATENCY_MS)
    const f = parseFilters(new URL(request.url))
    const enriched = buildEnriched().filter(ec => matchesStatic(ec, f) && ec.outcome === 'disqualified' && ec.disqualifiedAt)
    const inWindow = enriched.filter(ec => inRange(ec.disqualifiedAt, f))

    const avgToDisqualify = inWindow.length ? Math.round(inWindow.reduce((s, ec) => s + daysBetween(ec.appliedAt, ec.disqualifiedAt!), 0) / inWindow.length) : 0
    const auto = inWindow.filter(ec => ec.disqualifyTrigger === 'knockout_question')

    const overTime = bucketByDay(inWindow.map(ec => ec.disqualifiedAt!))
    const perStage = new Map<string, number>()
    for (const ec of inWindow) perStage.set(ec.currentStage, (perStage.get(ec.currentStage) ?? 0) + 1)

    const dropOffPerStage: FunnelStep[] = FUNNEL_STAGES.map((stage) => {
      const enteredCount = buildEnriched().filter(ec => matchesStatic(ec, f) && ec.stageHistory.some(s => s.stage === stage)).length
      const dqCount = inWindow.filter(ec => ec.currentStage === stage).length
      const dropOffRate = enteredCount ? Math.round((dqCount / enteredCount) * 1000) / 10 : 0
      return { stage, entered: enteredCount, proceeded: enteredCount - dqCount, proceedRate: Math.round((100 - dropOffRate) * 10) / 10, dropOffRate }
    })

    const reasonCounts = new Map<string, number>()
    for (const ec of inWindow) reasonCounts.set(ec.disqualifyReason ?? 'Other', (reasonCounts.get(ec.disqualifyReason ?? 'Other') ?? 0) + 1)
    const sourceCounts = new Map<string, number>()
    for (const ec of inWindow) sourceCounts.set(ec.sources[0] ?? 'Direct', (sourceCounts.get(ec.sources[0] ?? 'Direct') ?? 0) + 1)

    const totalCandidatesInWindow = buildEnriched().filter(ec => matchesStatic(ec, f) && inRange(ec.appliedAt, f)).length

    const body: DisqualificationsReportResponse = {
      kpis: {
        totalDisqualified: kpi('totalDisqualified', 'Total Disqualified', inWindow.length),
        avgTimeToDisqualify: kpi('avgTimeToDisqualify', 'Avg Time to Disqualify', `${avgToDisqualify}d`),
        autoDisqualified: kpi('autoDisqualified', 'Auto-Disqualified', auto.length),
      },
      disqualificationsOverTime: overTime,
      disqualificationsPerStage: toCategoryValues(perStage, inWindow.length),
      dropOffRatePerStage: dropOffPerStage,
      disqualificationReasonsOverview: toCategoryValues(reasonCounts, inWindow.length),
      disqualificationsPerSource: toCategoryValues(sourceCounts, inWindow.length),
    }
    void totalCandidatesInWindow
    return HttpResponse.json(body)
  }),

  http.get('/api/reports/hires', async ({ request }) => {
    await delay(DEV_LATENCY_MS)
    const f = parseFilters(new URL(request.url))
    const enriched = buildEnriched().filter(ec => matchesStatic(ec, f) && ec.outcome === 'hired')
    const inWindow = enriched.filter(ec => inRange(ec.hiredAt, f))

    const avgTth = inWindow.length ? Math.round(inWindow.reduce((s, ec) => s + daysBetween(ec.appliedAt, ec.hiredAt!), 0) / inWindow.length) : 0
    const withStart = inWindow.filter(ec => ec.startAt)
    const avgTts = withStart.length ? Math.round(withStart.reduce((s, ec) => s + daysBetween(ec.hiredAt!, ec.startAt!), 0) / withStart.length) : 0

    const perJob = new Map<string, number>(); const perDept = new Map<string, number>(); const perSource = new Map<string, number>(); const perRecruiter = new Map<string, number>()
    const tthByRecruiter = new Map<string, number[]>()
    for (const ec of inWindow) {
      perJob.set(ec.jobTitle, (perJob.get(ec.jobTitle) ?? 0) + 1)
      perDept.set(ec.department, (perDept.get(ec.department) ?? 0) + 1)
      perSource.set(ec.sources[0] ?? 'Direct', (perSource.get(ec.sources[0] ?? 'Direct') ?? 0) + 1)
      const recruiterName = teamMembers.find(m => m.id === ec.recruiterId)?.name ?? 'Unassigned'
      perRecruiter.set(recruiterName, (perRecruiter.get(recruiterName) ?? 0) + 1)
      tthByRecruiter.set(recruiterName, [...(tthByRecruiter.get(recruiterName) ?? []), daysBetween(ec.appliedAt, ec.hiredAt!)])
    }

    const body: HiresReportResponse = {
      kpis: {
        totalHires: kpi('totalHires', 'Total Hires', inWindow.length),
        avgTimeToHire: kpi('avgTimeToHire', 'Avg Time to Hire (TTH)', `${avgTth}d`),
        avgTimeToStart: kpi('avgTimeToStart', 'Avg Time to Start (TTS)', `${avgTts}d`),
      },
      hiresOverTime: bucketByDay(inWindow.map(ec => ec.hiredAt!)),
      hiresPerJob: toCategoryValues(perJob, inWindow.length),
      hiresPerDepartment: toCategoryValues(perDept, inWindow.length),
      hiresPerSource: toCategoryValues(perSource, inWindow.length),
      hiresPerRecruiter: toCategoryValues(perRecruiter, inWindow.length),
      avgTthPerRecruiter: [...tthByRecruiter.entries()].map(([label, arr]) => ({ label, value: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) })),
      collarSplitAvailable: enriched.some(e => e.collar === 'blue') && enriched.some(e => e.collar === 'white'),
    }
    return HttpResponse.json(body)
  }),

  http.get('/api/reports/interviews', async ({ request }) => {
    await delay(DEV_LATENCY_MS)
    const f = parseFilters(new URL(request.url))
    const enriched = buildEnriched().filter(ec => matchesStatic(ec, f))
    const enrichedIds = new Set(enriched.map(ec => ec.id))
    const interviews = buildInterviews(buildEnriched()).filter(iv => enrichedIds.has(iv.candidateId) && inRange(iv.date, f))

    const uniqueCandidates = new Set(interviews.map(iv => iv.candidateId)).size
    const totalHours = Math.round((interviews.reduce((s, iv) => s + iv.durationMinutes, 0) / 60) * 10) / 10

    const byType = new Map<string, number>()
    const durationBuckets = new Map<string, number>([['0-30 min', 0], ['30-60 min', 0], ['60-90 min', 0], ['90+ min', 0]])
    const perRecruiter = new Map<string, number>()
    const hoursPerRecruiter = new Map<string, number>()
    for (const iv of interviews) {
      byType.set(iv.type, (byType.get(iv.type) ?? 0) + 1)
      const bucket = iv.durationMinutes <= 30 ? '0-30 min' : iv.durationMinutes <= 60 ? '30-60 min' : iv.durationMinutes <= 90 ? '60-90 min' : '90+ min'
      durationBuckets.set(bucket, (durationBuckets.get(bucket) ?? 0) + 1)
      const name = teamMembers.find(m => m.id === iv.interviewerId)?.name ?? 'Unassigned'
      perRecruiter.set(name, (perRecruiter.get(name) ?? 0) + 1)
      hoursPerRecruiter.set(name, Math.round(((hoursPerRecruiter.get(name) ?? 0) + iv.durationMinutes / 60) * 10) / 10)
    }

    const body: InterviewsReportResponse = {
      kpis: {
        interviewsCompleted: kpi('interviewsCompleted', 'Interviews Completed', interviews.length),
        uniqueCandidatesInterviewed: kpi('uniqueCandidatesInterviewed', 'Unique Candidates Interviewed', uniqueCandidates),
        totalInterviewHours: kpi('totalInterviewHours', 'Total Interview Hours', `${totalHours}h`),
      },
      interviewsOverTime: bucketByDay(interviews.map(iv => iv.date)),
      interviewsByType: toCategoryValues(byType, interviews.length),
      interviewsByDuration: [...durationBuckets.entries()].map(([label, value]) => ({ label, value })),
      interviewsPerRecruiter: toCategoryValues(perRecruiter, interviews.length),
      interviewHoursPerRecruiter: [...hoursPerRecruiter.entries()].map(([label, value]) => ({ label, value })),
    }
    return HttpResponse.json(body)
  }),

  http.get('/api/reports/evaluations', async ({ request }) => {
    await delay(DEV_LATENCY_MS)
    const f = parseFilters(new URL(request.url))
    const enriched = buildEnriched().filter(ec => matchesStatic(ec, f))
    const enrichedIds = new Set(enriched.map(ec => ec.id))
    const evaluations = buildEvaluations(buildEnriched()).filter(ev => enrichedIds.has(ev.candidateId) && inRange(ev.submittedAt, f))

    const uniqueCandidates = new Set(evaluations.map(ev => ev.candidateId)).size
    const avgScore = evaluations.length ? Math.round((evaluations.reduce((s, ev) => s + ev.score, 0) / evaluations.length) * 10) / 10 : 0

    const scoreDist = new Map<string, number>([['Strong Yes', 0], ['Yes', 0], ['Not Sure', 0], ['No', 0]])
    const perEvaluator = new Map<string, number[]>()
    const timeToEvaluate = new Map<string, number[]>()
    const perSource = new Map<string, number[]>()
    for (const ev of evaluations) {
      scoreDist.set(SCORE_LABEL[ev.score], (scoreDist.get(SCORE_LABEL[ev.score]) ?? 0) + 1)
      const name = teamMembers.find(m => m.id === ev.evaluatorId)?.name ?? 'Unknown'
      perEvaluator.set(name, [...(perEvaluator.get(name) ?? []), ev.score])
      timeToEvaluate.set(name, [...(timeToEvaluate.get(name) ?? []), daysBetween(ev.requestedAt, ev.submittedAt)])
      const ec = enriched.find(e => e.id === ev.candidateId)
      const src = ec?.sources[0] ?? 'Direct'
      perSource.set(src, [...(perSource.get(src) ?? []), ev.score])
    }
    const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0

    const body: EvaluationsReportResponse = {
      kpis: {
        completedEvaluations: kpi('completedEvaluations', 'Completed Evaluations', evaluations.length),
        evaluatedCandidates: kpi('evaluatedCandidates', 'Evaluated Candidates', uniqueCandidates),
        avgCandidateScore: kpi('avgCandidateScore', 'Avg Candidate Score', `${avgScore} / 4`),
      },
      evaluationsOverTime: bucketByDay(evaluations.map(ev => ev.submittedAt)),
      scoreDistribution: toCategoryValues(scoreDist, evaluations.length),
      avgScorePerTeamMember: [...perEvaluator.entries()].map(([label, arr]) => ({ label, value: avg(arr) })),
      requestStatus: [{ label: 'Completed', value: evaluations.length, percent: 100 }, { label: 'Pending', value: 0, percent: 0 }, { label: 'Discarded', value: 0, percent: 0 }, { label: 'Expired', value: 0, percent: 0 }],
      avgTimeToEvaluate: [...timeToEvaluate.entries()].map(([label, arr]) => ({ label, value: avg(arr) })),
      avgScorePerSource: [...perSource.entries()].map(([label, arr]) => ({ label, value: avg(arr) })),
    }
    return HttpResponse.json(body)
  }),

  http.get('/api/reports/careers-site', async ({ request }) => {
    await delay(DEV_LATENCY_MS)
    const f = parseFilters(new URL(request.url))
    const { jobs } = useJobs()
    const days = buildCareerSiteDays().filter((d) => {
      const date = new Date(d.date)
      return inRange(date, f) || (!f.from && !f.to)
    })

    const totalVisits = days.reduce((s, d) => s + d.visits, 0)
    const totalApplications = days.reduce((s, d) => s + d.applications, 0)
    const avgDuration = days.length ? Math.round(days.reduce((s, d) => s + d.avgDurationSeconds, 0) / days.length) : 0
    const bounceRate = days.length ? Math.round((days.reduce((s, d) => s + d.bounceRate, 0) / days.length) * 1000) / 10 : 0
    const visitToApp = totalVisits ? Math.round((totalApplications / totalVisits) * 1000) / 10 : 0
    const started = Math.round(totalApplications * 1.35)
    const dropOff = started ? Math.round(((started - totalApplications) / started) * 1000) / 10 : 0

    const weights = [0.30, 0.25, 0.20, 0.15, 0.10]
    const visitsPerTraffic = TRAFFIC_SOURCES.map((label, i) => ({ label, value: Math.round(totalVisits * weights[i]!) }))
    const appsPerTraffic = TRAFFIC_SOURCES.map((label, i) => ({ label, value: Math.round(totalApplications * weights[i]!) }))

    const jobWeights = jobs.value.map(j => Math.max(1, j.candidateCount))
    const jobWeightSum = jobWeights.reduce((a, b) => a + b, 0)
    const mostVisited = jobs.value.map((j, i) => {
      const visits = Math.round(totalVisits * (jobWeights[i]! / jobWeightSum))
      const applications = Math.round(visits * (0.03 + seededFraction(j.id + 'conv') * 0.06))
      return { jobId: j.id, jobTitle: j.title, visits, applications, conversion: visits ? Math.round((applications / visits) * 1000) / 10 : 0 }
    }).sort((a, b) => b.visits - a.visits)

    const body: CareersSiteReportResponse = {
      kpis: {
        totalVisits: kpi('totalVisits', 'Total Visits', totalVisits),
        avgVisitDuration: kpi('avgVisitDuration', 'Avg Visit Duration', `${Math.round(avgDuration / 60 * 10) / 10}m`),
        bounceRate: kpi('bounceRate', 'Bounce Rate', `${bounceRate}%`),
        totalApplications: kpi('totalApplications', 'Total Applications', totalApplications),
        visitToApplicationRate: kpi('visitToApplicationRate', 'Visit-to-Application Rate', `${visitToApp}%`),
        applicationDropOffRate: kpi('applicationDropOffRate', 'Application Drop-off Rate', `${dropOff}%`),
      },
      visitsOverTime: days.map(d => ({ date: d.date, visits: d.visits })),
      applicationsOverTime: days.map(d => ({ date: d.date, applications: d.applications })),
      mostVisitedJobs: mostVisited,
      applicationsPerJob: mostVisited.map(j => ({ label: j.jobTitle, value: j.applications })),
      visitsPerTrafficSource: visitsPerTraffic,
      applicationsPerTrafficSource: appsPerTraffic,
    }
    return HttpResponse.json(body)
  }),

  // ─── Job-Level Reports tab (E5 v2.0) ────────────────────────────────────
  http.get('/api/reports/jobs/:id', async ({ params, request }) => {
    await delay(DEV_LATENCY_MS)
    const jobId = params.id as string
    const { jobs } = useJobs()
    const job = jobs.value.find(j => j.id === jobId)
    if (!job) return new HttpResponse(null, { status: 404 })

    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const f: ParsedFilters = { from: from ? new Date(from) : null, to: to ? new Date(to) : null, departments: [], jobIds: [jobId], recruiterIds: [], hiringManagerIds: [], talentPoolIds: [], collar: 'all' }

    const enriched = buildEnriched().filter(ec => ec.jobId === jobId)
    const lifecycle = jobLifecycle(job)
    const now = new Date()
    const daysPublished = daysBetween(lifecycle.publishedAt, now)

    const inWindow = enriched.filter(ec => inRange(ec.appliedAt, f) || (!f.from && !f.to))
    const hiredInWindow = enriched.filter(ec => ec.outcome === 'hired' && (inRange(ec.hiredAt, f) || (!f.from && !f.to)))
    const avgTth = hiredInWindow.length ? Math.round(hiredInWindow.reduce((s, ec) => s + daysBetween(ec.appliedAt, ec.hiredAt!), 0) / hiredInWindow.length) : 0
    const firstContactHours = inWindow.length
      ? Math.round(inWindow.reduce((s, ec) => s + (ec.stageHistory[1] ? (ec.stageHistory[1].enteredAt.getTime() - ec.appliedAt.getTime()) / 3600000 : 24), 0) / inWindow.length)
      : 0

    const pipelineFunnel: FunnelStep[] = FUNNEL_STAGES.map((stage, i) => {
      const entered = enriched.filter(ec => ec.stageHistory.some(s => s.stage === stage)).length
      const nextStage = FUNNEL_STAGES[i + 1]
      const proceeded = nextStage ? enriched.filter(ec => ec.stageHistory.some(s => s.stage === nextStage)).length : entered
      const proceedRate = entered ? Math.round((proceeded / entered) * 1000) / 10 : 0
      return { stage, entered, proceeded, proceedRate, dropOffRate: Math.round((100 - proceedRate) * 10) / 10 }
    })

    const timeInStage = new Map<string, number[]>()
    for (const ec of enriched) {
      for (let i = 0; i < ec.stageHistory.length; i++) {
        const s = ec.stageHistory[i]!
        const exit = ec.stageHistory[i + 1]?.enteredAt ?? ec.disqualifiedAt ?? now
        timeInStage.set(s.stage, [...(timeInStage.get(s.stage) ?? []), daysBetween(s.enteredAt, exit)])
      }
    }
    const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0
    const SLA_DAYS: Record<string, number> = { Sourced: 5, Applied: 3, 'Phone Screening': 4, Interview: 6, Evaluation: 3, Offer: 5, Hired: 0 }
    const avgTimePerStage = FUNNEL_STAGES.map((stage) => {
      const avgDays = avg(timeInStage.get(stage) ?? [])
      return { stage, avgDays, slaDays: SLA_DAYS[stage] ?? 5, overSla: avgDays > (SLA_DAYS[stage] ?? 5) }
    })
    const slaBreachPerStage = avgTimePerStage.map((s) => {
      const times = timeInStage.get(s.stage) ?? []
      const breaches = times.filter(t => t > s.slaDays).length
      return { stage: s.stage, slaDays: s.slaDays, avgDays: s.avgDays, breaches, breachRate: times.length ? Math.round((breaches / times.length) * 1000) / 10 : 0 }
    })

    const sourceCounts = new Map<string, number>()
    for (const ec of enriched) for (const s of (ec.sources.length ? ec.sources : ['Direct'])) sourceCounts.set(s, (sourceCounts.get(s) ?? 0) + 1)
    const reasonCounts = new Map<string, number>()
    for (const ec of enriched.filter(e => e.outcome === 'disqualified')) reasonCounts.set(ec.disqualifyReason ?? 'Other', (reasonCounts.get(ec.disqualifyReason ?? 'Other') ?? 0) + 1)

    const evaluations = buildEvaluations(buildEnriched()).filter(ev => enriched.some(ec => ec.id === ev.candidateId))
    const scoreDist = new Map<string, number>([['Strong Yes', 0], ['Yes', 0], ['Not Sure', 0], ['No', 0]])
    for (const ev of evaluations) scoreDist.set(SCORE_LABEL[ev.score], (scoreDist.get(SCORE_LABEL[ev.score]) ?? 0) + 1)
    const avgEvalScore = evaluations.length ? Math.round((evaluations.reduce((s, ev) => s + ev.score, 0) / evaluations.length) * 10) / 10 : null

    const hasSmartDistribute = enriched.some(ec => ec.recruiterId)
    const recruiterPerformance = hasSmartDistribute
      ? [...new Set(enriched.map(ec => ec.recruiterId).filter((id): id is string => !!id))].map((recruiterId) => {
          const mine = enriched.filter(ec => ec.recruiterId === recruiterId)
          const progressed = mine.filter(ec => ec.stageHistory.length > 1)
          const hired = mine.filter(ec => ec.outcome === 'hired')
          return {
            recruiterId,
            recruiterName: teamMembers.find(m => m.id === recruiterId)?.name ?? 'Unknown',
            assigned: mine.length,
            progressed: progressed.length,
            hired: hired.length,
            timeToFirstContact: mine.length ? Math.round(mine.reduce((s, ec) => s + (ec.stageHistory[1] ? daysBetween(ec.appliedAt, ec.stageHistory[1].enteredAt) : 1), 0) / mine.length) : 0,
            avgDaysToProgress: progressed.length ? Math.round(progressed.reduce((s, ec) => s + daysBetween(ec.appliedAt, ec.stageHistory[1]!.enteredAt), 0) / progressed.length) : 0,
          }
        })
      : null

    const body: JobReportResponse = {
      jobId: job.id,
      jobTitle: job.title,
      kpis: {
        daysPublished: kpi('daysPublished', 'Days Published', daysPublished),
        totalCandidates: kpi('totalCandidates', 'Total Candidates', inWindow.length),
        timeToFirstContact: kpi('timeToFirstContact', 'Time to First Contact', `${firstContactHours}h`),
        timeToHire: kpi('timeToHire', 'Time to Hire', `${avgTth}d`),
        hiredVsTarget: kpi('hiredVsTarget', 'Hired vs Target', `${job.hires} of ${lifecycle.positions}`),
      },
      hiredCount: job.hires,
      targetPositions: lifecycle.positions,
      pipelineFunnel,
      avgTimePerStage,
      conversionRatePerStage: pipelineFunnel,
      newCandidatesOverTime: bucketByDay(inWindow.map(ec => ec.appliedAt)),
      sources: toCategoryValues(sourceCounts, enriched.length),
      slaBreachPerStage,
      evaluationScoreDistribution: toCategoryValues(scoreDist, evaluations.length),
      avgEvaluationScore: avgEvalScore,
      disqualifyReasons: toCategoryValues(reasonCounts, enriched.filter(e => e.outcome === 'disqualified').length),
      recruiterPerformance,
      hasSmartDistribute,
      collarSplitAvailable: false,
    }
    return HttpResponse.json(body)
  }),

  // ─── Global drill-down popup (§2.5) — generic dimension/value match against
  // the same enriched pool, keeps the active global filters applied. ────────
  http.get('/api/reports/drilldown', async ({ request }) => {
    await delay(150)
    const url = new URL(request.url)
    const f = parseFilters(url)
    const dimension = url.searchParams.get('dimension') ?? ''
    const value = url.searchParams.get('value') ?? ''
    const chartName = url.searchParams.get('chartName') ?? 'Chart'
    const contextLine = url.searchParams.get('contextLine') ?? value
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
    const perPage = Math.max(1, Number(url.searchParams.get('perPage') ?? 10))

    let matches = buildEnriched().filter(ec => matchesStatic(ec, f))
    switch (dimension) {
      case 'stage': matches = matches.filter(ec => ec.currentStage === value); break
      case 'source': matches = matches.filter(ec => ec.sources.includes(value) || (value === 'Direct' && ec.sources.length === 0)); break
      case 'department': matches = matches.filter(ec => ec.department === value); break
      case 'job': matches = matches.filter(ec => ec.jobId === value || ec.jobTitle === value); break
      case 'reason': matches = matches.filter(ec => ec.disqualifyReason === value); break
      case 'recruiter': matches = matches.filter(ec => (teamMembers.find(m => m.id === ec.recruiterId)?.name ?? 'Unassigned') === value); break
      case 'date': matches = matches.filter(ec => isoDay(ec.appliedAt) === value); break
      case 'interview-type': {
        const ids = new Set(buildInterviews(buildEnriched()).filter(iv => iv.type === value).map(iv => iv.candidateId))
        matches = matches.filter(ec => ids.has(ec.id))
        break
      }
      case 'interview-duration': {
        const bucketOf = (mins: number) => mins <= 30 ? '0-30 min' : mins <= 60 ? '30-60 min' : mins <= 90 ? '60-90 min' : '90+ min'
        const ids = new Set(buildInterviews(buildEnriched()).filter(iv => bucketOf(iv.durationMinutes) === value).map(iv => iv.candidateId))
        matches = matches.filter(ec => ids.has(ec.id))
        break
      }
      case 'score-label': {
        const ids = new Set(buildEvaluations(buildEnriched()).filter(ev => SCORE_LABEL[ev.score] === value).map(ev => ev.candidateId))
        matches = matches.filter(ec => ids.has(ec.id))
        break
      }
      case 'evaluator': {
        const ids = new Set(buildEvaluations(buildEnriched()).filter(ev => (teamMembers.find(m => m.id === ev.evaluatorId)?.name ?? 'Unknown') === value).map(ev => ev.candidateId))
        matches = matches.filter(ec => ids.has(ec.id))
        break
      }
      default: break
    }

    const rows: DrillDownCandidateRow[] = matches.map(ec => ({
      id: ec.id, name: ec.name, initials: ec.initials, avatarColor: ec.avatarColor, job: ec.jobTitle,
      stage: ec.outcome === 'disqualified' ? 'Disqualified' : ec.currentStage,
      evaluationScore: ec.evaluationScore, dateCreated: isoDay(ec.appliedAt),
    }))
    const start = (page - 1) * perPage
    const body: DrillDownResponse = { chartName, contextLine, candidates: rows.slice(start, start + perPage), total: rows.length }
    return HttpResponse.json(body)
  }),
]
