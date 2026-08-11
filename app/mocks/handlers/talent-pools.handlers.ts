import { http, HttpResponse } from 'msw'
import { ALL_CANDIDATES, findOrCreateCandidate } from './candidates.handlers'
import type { Candidate, PoolCandidate, PoolCandidateStage, TalentPool } from '~/types'

/**
 * Talent pools are built on the real sample candidates in candidates.handlers.ts,
 * not on a separate cast of people. Every row here resolves to /candidates/{id},
 * so opening a candidate from a pool lands on their existing profile.
 *
 * The pool names come from the `talentPools` field those candidate records already
 * carried — 'Engineering (Sample)', 'Rising stars (Sample)' and
 * 'Next recruitment - Q3 (Sample)' were referenced there but had no pool behind
 * them. They exist now, with the same membership the profiles claim.
 *
 * The General Application pool is system-generated and holds spontaneous
 * applicants — candidates with no job assignment, so their row shows no job title.
 */

const pools: TalentPool[] = [
  {
    id: 'p1',
    name: 'General Application',
    description: 'Spontaneous applicants who applied without a specific job. Auto-collected from the career site.',
    category: 'general',
    system: true,
    total: 0,
    created: '2026-03-01',
    members: ['1'],
    archived: false,
    pinned: true,
  },
  {
    id: 'p2',
    name: 'Engineering (Sample)',
    description: 'Backend and frontend engineers kept warm for the next opening.',
    category: 'department',
    department: 'Engineering',
    total: 0,
    created: '2026-04-12',
    members: ['1', '2'],
    archived: false,
    pinned: true,
  },
  {
    id: 'p3',
    name: 'Next recruitment - Q3 (Sample)',
    description: 'Shortlist carried into the Q3 hiring round.',
    category: 'event',
    event: 'Q3 2026 Recruitment',
    total: 0,
    created: '2026-05-28',
    members: ['1', '2'],
    archived: false,
    pinned: false,
    formStatus: 'live',
  },
  {
    id: 'p4',
    name: 'Rising stars (Sample)',
    description: 'Junior candidates worth re-engaging as they grow.',
    category: 'event',
    event: 'Graduate Programme 2026',
    total: 0,
    created: '2026-05-06',
    members: ['3'],
    archived: false,
    pinned: false,
    formStatus: 'draft',
  },
  {
    id: 'p5',
    name: 'Marketing Bench (Sample)',
    description: 'Marketing and comms candidates re-engaged for upcoming roles.',
    category: 'department',
    department: 'Sales',
    total: 0,
    created: '2026-05-14',
    members: ['4'],
    archived: false,
    pinned: false,
  },
  {
    id: 'p6',
    name: 'Recruiting Ops (Sample)',
    description: 'In-house recruiting hires from the last cycle.',
    category: 'department',
    department: 'Human Resources',
    total: 0,
    created: '2026-02-20',
    members: ['3'],
    archived: true,
    pinned: false,
  },
]

/** Pool membership, keyed by candidate id. Mirrors `talentPools` on the candidate records. */
interface Membership {
  candidateId: string
  poolId: string
  stage: PoolCandidateStage
  date: string
  aiScore: number | null
  evalScore: number | null
  /** General Application only — the free-text job title the applicant entered. */
  jobTitleOverride?: string
}

const memberships: Membership[] = [
  // General Application — no job assignment, so no job title on the row.
  { candidateId: '4', poolId: 'p1', stage: 'New', date: '2026-06-12', aiScore: null, evalScore: null },
  { candidateId: '7', poolId: 'p1', stage: 'New', date: '2026-06-10', aiScore: null, evalScore: null },
  { candidateId: '10', poolId: 'p1', stage: 'Applied', date: '2026-06-04', aiScore: null, evalScore: null },

  // Engineering (Sample)
  { candidateId: '5', poolId: 'p2', stage: 'Screened', date: '2026-05-28', aiScore: 88, evalScore: 91 },

  // Next recruitment - Q3 (Sample)
  { candidateId: '4', poolId: 'p3', stage: 'Applied', date: '2026-06-14', aiScore: 62, evalScore: null },
  { candidateId: '9', poolId: 'p3', stage: 'Interview', date: '2026-06-02', aiScore: 82, evalScore: 85 },
  { candidateId: '10', poolId: 'p3', stage: 'Screened', date: '2026-06-07', aiScore: 74, evalScore: null },
  { candidateId: '11', poolId: 'p3', stage: 'Offer', date: '2026-05-20', aiScore: 95, evalScore: 91 },
  { candidateId: '12', poolId: 'p3', stage: 'Reference check', date: '2026-05-26', aiScore: 87, evalScore: 90 },

  // Rising stars (Sample)
  { candidateId: '7', poolId: 'p4', stage: 'Screened', date: '2026-06-13', aiScore: 63, evalScore: null },
  { candidateId: '13', poolId: 'p4', stage: 'Applied', date: '2026-06-07', aiScore: 48, evalScore: null },
  { candidateId: '15', poolId: 'p4', stage: 'New', date: '2026-05-29', aiScore: null, evalScore: null },

  // Marketing Bench (Sample)
  { candidateId: '6', poolId: 'p5', stage: 'Applied', date: '2026-05-20', aiScore: 68, evalScore: null },
  { candidateId: '8', poolId: 'p5', stage: 'Screened', date: '2026-06-04', aiScore: 74, evalScore: null },
  { candidateId: '16', poolId: 'p5', stage: 'Interview', date: '2026-05-26', aiScore: 87, evalScore: 90 },
  { candidateId: '17', poolId: 'p5', stage: 'New', date: '2026-06-10', aiScore: null, evalScore: null },

  // Recruiting Ops (Sample) — archived
  { candidateId: '14', poolId: 'p6', stage: 'Applied', date: '2026-02-20', aiScore: 55, evalScore: null },
]

/** Spontaneous applicants carry no job title unless the form captured one (General Application); everyone else shows their first job. */
function jobTitleFor(c: Candidate, m: Membership): string | null {
  if (m.jobTitleOverride) return m.jobTitleOverride
  if (m.poolId === 'p1') return null
  return c.jobs[0]?.title ?? null
}

function buildRow(m: Membership): PoolCandidate | null {
  const c = ALL_CANDIDATES.find(x => x.id === m.candidateId)
  if (!c) return null
  const slug = c.name.replace(/\s*\(Sample\)\s*/g, '').trim().toLowerCase().replace(/\s+/g, '.')
  return {
    id: c.id,
    poolId: m.poolId,
    name: c.name,
    initials: c.initials,
    avatarColor: c.avatarColor,
    stage: m.stage,
    appliedVia: c.sources[0] ?? 'Careers site',
    jobTitle: jobTitleFor(c, m),
    email: `${slug}@example.com`,
    aiScore: m.aiScore,
    evalScore: m.evalScore,
    tags: c.tags,
    date: m.date,
  }
}

// Recomputed on every read — memberships/candidates can grow at runtime
// (career-site General Application submissions), and totals must never drift.
function buildState() {
  const candidates: PoolCandidate[] = memberships
    .map(buildRow)
    .filter((r): r is PoolCandidate => r !== null)
  for (const p of pools) {
    p.total = candidates.filter(c => c.poolId === p.id).length
  }
  return { pools, candidates }
}

/**
 * Career-site General Application submission → routes into the pinned
 * "General Application" pool (p1), matching or creating the candidate.
 */
export function addGeneralApplication(input: { fullName: string, email: string, jobTitle: string }) {
  const candidate = findOrCreateCandidate({ name: input.fullName, source: 'General Application' })
  memberships.push({
    candidateId: candidate.id,
    poolId: 'p1',
    stage: 'New',
    date: new Date().toISOString().slice(0, 10),
    aiScore: null,
    evalScore: null,
    jobTitleOverride: input.jobTitle.trim() || undefined,
  })
  return candidate
}

export const talentPoolsHandlers = [
  http.get('/api/talent-pools', () => {
    return HttpResponse.json(buildState())
  }),
]
