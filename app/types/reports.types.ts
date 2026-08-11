// Reports module (General Reports V3 + Job-Level Reports E5 v2.0). See
// docs/superpowers/specs/2026-08-11-reports-module-spec.md.

export type DateRangePreset =
  | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month'
  | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year'
  | 'last_7' | 'last_14' | 'last_30' | 'last_60' | 'last_90' | 'last_365'
  | 'custom' | 'all_time'

/** Simpler 5-option picker used only by the Job-Level Reports tab (BRD §3.4). */
export type JobDateRangePreset = 'last_7' | 'last_30' | 'last_90' | 'custom' | 'all_time'

export interface DateRangeValue {
  preset: DateRangePreset
  /** Resolved ISO dates (inclusive). Null start = no lower bound (All time). */
  from: string | null
  to: string | null
}

export type CollarFilter = 'all' | 'white' | 'blue'

/** Global filter state — shared across all 8 General Reports sections (R-G01). */
export interface ReportFilters {
  dateRange: DateRangeValue
  departments: string[]
  jobIds: string[]
  recruiterIds: string[]
  hiringManagerIds: string[]
  talentPoolIds: string[]
  collar: CollarFilter
}

export interface ReportFilterOptions {
  departments: string[]
  jobs: { id: string, title: string }[]
  recruiters: { id: string, name: string }[]
  hiringManagers: { id: string, name: string }[]
  talentPools: string[]
  hasBlueCollar: boolean
  hasWhiteCollar: boolean
}

export interface KpiCard {
  key: string
  label: string
  value: string
  sublabel?: string
  danger?: boolean
}

/** One point in a line/stacked-line chart — `date` plus one numeric field per series. */
export type SeriesPoint = Record<string, string | number>

export interface CategoryValue {
  label: string
  value: number
  percent?: number
}

export interface StackedCategoryValue {
  label: string
  values: Record<string, number>
}

export interface FunnelStep {
  stage: string
  entered: number
  proceeded: number
  proceedRate: number
  dropOffRate: number
  avgTimeInStageDays?: number
}

/** Row shown inside the global drill-down popup (§2.5). Read-only, no profile nav. */
export interface DrillDownCandidateRow {
  id: string
  name: string
  initials: string
  avatarColor: string
  job: string
  stage: string
  evaluationScore: number | null
  dateCreated: string
}

export interface DrillDownResponse {
  chartName: string
  contextLine: string
  candidates: DrillDownCandidateRow[]
  total: number
}

// ─── 2.8.1 Jobs ──────────────────────────────────────────────────────────
export interface JobsReportResponse {
  kpis: {
    publishedJobs: KpiCard
    filledJobs: KpiCard
    closedJobs: KpiCard
    fillRate: KpiCard
    avgTimeToFill: KpiCard
    avgTimeToClose: KpiCard
  }
  jobEventsOverTime: SeriesPoint[] // {date, published, filled, closed}
  openTimePerJob: { jobId: string, jobTitle: string, daysOpen: number, overSla: boolean }[]
  fillRatePerJob: { jobId: string, jobTitle: string, positionsNeeded: number, hires: number, fillRate: number }[]
  publishedJobsPerDepartment: CategoryValue[]
  fillRatePerDepartment: CategoryValue[]
}

// ─── 2.8.2 Candidates ────────────────────────────────────────────────────
export interface CandidatesReportResponse {
  kpis: {
    newCandidates: KpiCard
    movedForward: KpiCard
    disqualified: KpiCard
    overdueCandidates: KpiCard
  }
  candidatesOverTimeByOrigin: SeriesPoint[] // {date, Applied, Sourced, Referred}
  newCandidatesByStatus: CategoryValue[] // Qualified / Disqualified / Unassigned
  candidatesPerSource: CategoryValue[]
  hiresPerSource: StackedCategoryValue[] // {label: source, values: {total, hired}}
  qualifiedCandidatesPerJob: { jobId: string, jobTitle: string, qualified: number, disqualified: number, hired: number }[]
}

// ─── 2.8.3 Pipelines ─────────────────────────────────────────────────────
export interface PipelinesReportResponse {
  kpis: {
    interviewed: KpiCard
    offered: KpiCard
    hired: KpiCard
  }
  pipelineEventsOverTime: SeriesPoint[] // {date, Applied, Active, Hired}
  candidatesPerStage: CategoryValue[]
  proceedRatePerStage: FunnelStep[]
  avgTimeToReachStage: CategoryValue[]
  avgTimeSpentPerStage: CategoryValue[]
}

// ─── 2.8.4 Disqualifications ─────────────────────────────────────────────
export interface DisqualificationsReportResponse {
  kpis: {
    totalDisqualified: KpiCard
    avgTimeToDisqualify: KpiCard
    autoDisqualified: KpiCard
  }
  disqualificationsOverTime: SeriesPoint[]
  disqualificationsPerStage: CategoryValue[]
  dropOffRatePerStage: FunnelStep[]
  disqualificationReasonsOverview: CategoryValue[]
  disqualificationsPerSource: CategoryValue[]
}

// ─── 2.8.5 Hires ─────────────────────────────────────────────────────────
export interface HiresReportResponse {
  kpis: {
    totalHires: KpiCard
    avgTimeToHire: KpiCard
    avgTimeToStart: KpiCard
  }
  hiresOverTime: SeriesPoint[]
  hiresPerJob: CategoryValue[]
  hiresPerDepartment: CategoryValue[]
  hiresPerSource: CategoryValue[]
  hiresPerRecruiter: CategoryValue[]
  avgTthPerRecruiter: CategoryValue[]
  collarSplitAvailable: boolean
}

// ─── 2.8.6 Interviews ────────────────────────────────────────────────────
export interface InterviewsReportResponse {
  kpis: {
    interviewsCompleted: KpiCard
    uniqueCandidatesInterviewed: KpiCard
    totalInterviewHours: KpiCard
  }
  interviewsOverTime: SeriesPoint[]
  interviewsByType: CategoryValue[] // Online / On-site
  interviewsByDuration: CategoryValue[] // buckets
  interviewsPerRecruiter: CategoryValue[]
  interviewHoursPerRecruiter: CategoryValue[]
}

// ─── 2.8.7 Evaluations ───────────────────────────────────────────────────
export interface EvaluationsReportResponse {
  kpis: {
    completedEvaluations: KpiCard
    evaluatedCandidates: KpiCard
    avgCandidateScore: KpiCard
  }
  evaluationsOverTime: SeriesPoint[]
  scoreDistribution: CategoryValue[] // Strong Yes / Yes / Not Sure / No
  avgScorePerTeamMember: CategoryValue[]
  requestStatus: CategoryValue[] // Completed / Pending / Discarded / Expired
  avgTimeToEvaluate: CategoryValue[]
  avgScorePerSource: CategoryValue[]
}

// ─── 2.8.8 Careers Site ──────────────────────────────────────────────────
export interface CareersSiteReportResponse {
  kpis: {
    totalVisits: KpiCard
    avgVisitDuration: KpiCard
    bounceRate: KpiCard
    totalApplications: KpiCard
    visitToApplicationRate: KpiCard
    applicationDropOffRate: KpiCard
  }
  visitsOverTime: SeriesPoint[]
  applicationsOverTime: SeriesPoint[]
  mostVisitedJobs: { jobId: string, jobTitle: string, visits: number, applications: number, conversion: number }[]
  applicationsPerJob: CategoryValue[]
  visitsPerTrafficSource: CategoryValue[]
  applicationsPerTrafficSource: CategoryValue[]
}

// ─── Section 3 — Job-Level Reports (E5 v2.0) ─────────────────────────────
export interface JobReportResponse {
  jobId: string
  jobTitle: string
  kpis: {
    daysPublished: KpiCard
    totalCandidates: KpiCard
    timeToFirstContact: KpiCard
    timeToHire: KpiCard
    hiredVsTarget: KpiCard
  }
  hiredCount: number
  targetPositions: number
  pipelineFunnel: FunnelStep[]
  avgTimePerStage: { stage: string, avgDays: number, slaDays: number, overSla: boolean }[]
  conversionRatePerStage: FunnelStep[]
  newCandidatesOverTime: SeriesPoint[]
  sources: CategoryValue[]
  slaBreachPerStage: { stage: string, slaDays: number, avgDays: number, breaches: number, breachRate: number }[]
  evaluationScoreDistribution: CategoryValue[]
  avgEvaluationScore: number | null
  disqualifyReasons: CategoryValue[]
  recruiterPerformance: {
    recruiterId: string
    recruiterName: string
    assigned: number
    progressed: number
    hired: number
    timeToFirstContact: number
    avgDaysToProgress: number
  }[] | null
  hasSmartDistribute: boolean
  collarSplitAvailable: boolean
}
