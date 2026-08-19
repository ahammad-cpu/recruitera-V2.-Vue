// Analytics / Reports module — board-based dashboards (Jobs, Candidates, …),
// each a grid of single-number metric cards + charts. All served over MSW.

export type AnalyticsBoardKey =
  | 'jobs' | 'candidates' | 'pipelines' | 'disqualifications'
  | 'hires' | 'interviews' | 'evaluations' | 'careers-site'

export interface AnalyticsBoardSummary {
  key: AnalyticsBoardKey
  label: string
  icon: string // lucide name resolved on the client
}

export interface AnalyticsMetric {
  id: string
  title: string
  subtitle: string // filter caption, e.g. "Job published · Last 30 days"
  value: string // pre-formatted ("0", "42%", "32 days", "—")
  unit: string // small caption under the number, e.g. "JOBS"
  delta?: number // +/- vs previous period (percentage points); omitted = no delta
}

export interface AnalyticsPoint {
  label: string
  value: number
  value2?: number // second series (e.g. published vs filled)
}

export type AnalyticsChartType = 'bars' | 'area' | 'hbars'

export interface AnalyticsChart {
  id: string
  title: string
  subtitle: string
  type: AnalyticsChartType
  span: 1 | 2 | 3 // grid columns (out of 3)
  points: AnalyticsPoint[]
  unit?: string // '%', ' days', etc. appended to values in tooltips/labels
  seriesLabels?: [string, string] // legend when value2 is used
}

export interface AnalyticsBoard {
  key: AnalyticsBoardKey
  label: string
  metrics: AnalyticsMetric[]
  charts: AnalyticsChart[]
  timezone: string
}
