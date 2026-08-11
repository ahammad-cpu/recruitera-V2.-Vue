import { http, HttpResponse, delay } from 'msw'
import type { SmartDistributeCandidate, SmartDistributeConfig } from '~/types'
import { ALL_CANDIDATES } from './candidates.handlers'

const DEV_LATENCY_MS = 350

// Job-level rules only (mode, capacity, unlimited). "Assigned" is never
// stored here — it's always derived live from ALL_CANDIDATES.assignedRecruiterId
// so this config and the candidate list can never drift apart (E1 config +
// E2 ownership were two separate trackers in an earlier pass; that let the
// numbers disagree with what "View assigned candidates" actually listed).
interface RecruiterRules { teamMemberId: string; capacity: number | null; unlimited: boolean; priority: number }
const configsByJob = new Map<string, { enabled: boolean; mode: SmartDistributeConfig['mode']; unclaimedAlertHours: number; recruiters: RecruiterRules[] }>()

function defaultConfig(): { enabled: boolean; mode: SmartDistributeConfig['mode']; unclaimedAlertHours: number; recruiters: RecruiterRules[] } {
  return {
    enabled: true,
    mode: 'parallel',
    unclaimedAlertHours: 48,
    recruiters: [
      { teamMemberId: '1', capacity: 12, unlimited: false, priority: 1 },
      { teamMemberId: '2', capacity: 10, unlimited: false, priority: 2 },
      { teamMemberId: '3', capacity: null, unlimited: true, priority: 3 },
      { teamMemberId: '4', capacity: 8, unlimited: false, priority: 4 },
    ],
  }
}

function rulesFor(jobId: string) {
  let cfg = configsByJob.get(jobId)
  if (!cfg) {
    cfg = defaultConfig()
    configsByJob.set(jobId, cfg)
  }
  return cfg
}

function assignedCountFor(teamMemberId: string): number {
  return ALL_CANDIDATES.filter(c => c.assignedRecruiterId === teamMemberId).length
}

export const smartDistributeHandlers = [
  http.get('/api/jobs/:jobId/smart-distribute', async ({ params }) => {
    await delay(DEV_LATENCY_MS)
    const jobId = String(params.jobId)
    const rules = rulesFor(jobId)
    const config: SmartDistributeConfig = {
      jobId,
      enabled: rules.enabled,
      mode: rules.mode,
      unclaimedAlertHours: rules.unclaimedAlertHours,
      recruiters: rules.recruiters.map(r => ({ ...r, assigned: assignedCountFor(r.teamMemberId) })),
    }
    return HttpResponse.json(config)
  }),

  http.get('/api/jobs/:jobId/smart-distribute/candidates', async ({ request }) => {
    await delay(DEV_LATENCY_MS)
    const url = new URL(request.url)
    const recruiterId = url.searchParams.get('recruiterId') ?? ''
    const STAGES = ['Applied', 'Screened', 'Interview', 'Offer']
    const data: SmartDistributeCandidate[] = ALL_CANDIDATES
      .filter(c => c.assignedRecruiterId === recruiterId)
      .map((c, i) => ({
        id: c.id,
        name: c.name,
        initials: c.initials,
        avatarColor: c.avatarColor,
        stage: STAGES[i % STAGES.length]!,
        source: c.sources[0] ?? 'Careers site',
        assignmentSource: c.assignmentSource ?? 'external',
        evaluationScore: c.evaluationScore ?? null,
      }))
    return HttpResponse.json({ data, total: data.length })
  }),
]
