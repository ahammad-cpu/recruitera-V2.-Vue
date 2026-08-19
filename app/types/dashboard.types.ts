// Home / Overview dashboard data shapes (served by dashboard.handlers via MSW).

export interface DashboardRecent {
  id: string
  kind: 'candidate' | 'job'
  title: string
  sub: string
  initial?: string
  bg?: string
}

export interface DashboardNewCandidate {
  id: string
  name: string
  initial: string
  bg: string
  when: string
}

export interface DashboardAppliedCard {
  key: string
  label: string
  value: number
}

export interface DashboardAppliedStats {
  cards: DashboardAppliedCard[]
  series: number[]
}

export interface DashboardEvaluationAnswer {
  q: string
  a: string
}

export interface DashboardEvaluation {
  id: string
  status: 'requested' | 'completed' | 'dismissed'
  candidate: { name: string; initial: string; bg: string }
  job: string
  verdict: string
  stage: string
  evaluator: { name: string; initials: string; bg: string }
  template: string
  when: string
  summary: string
  answers: DashboardEvaluationAnswer[]
}

export interface DashboardTask {
  id: string
  text: string
  done: boolean
  ago: string
}

export interface DashboardNote {
  author: string
  initials: string
  bg: string
  mention?: string
  body: string
  ago: string
}

export interface DashboardNoteGroup {
  date: string
  about: string
  notes: DashboardNote[]
}

export interface DashboardActivityEvent {
  text: string
  bold: string
  tail?: string
  icon: 'screen' | 'bookmark' | 'job'
  ago: string
}

export interface DashboardActivityGroup {
  date: string
  events: DashboardActivityEvent[]
}

export interface DashboardEvent {
  id: string
  candidate: string
  initials: string
  bg: string
  job: string
  jobDot: string
  title: string
  date: string
  time: string
  scope: 'week' | 'today' | 'past'
  role: string
}

export interface DashboardTag {
  label: string
  count: number
}

export interface DashboardSource {
  label: string
  count: number
}
