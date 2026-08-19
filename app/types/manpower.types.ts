// Workforce / Manpower Planning (v3.0) — project-based headcount planning that
// connects pre-recruitment budgeting to hiring execution. See PRD RC-135.

export type ManpowerBudgetKind = 'headcount' | 'project'

export const MANPOWER_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

export interface ManpowerMonthly {
  month: string // 'Jan' … 'Dec'
  budgeted: number
  current: number
  needToHire: number // max(0, budgeted − current)
}

// A single planned role (Job Title × Location) within a group.
export interface ManpowerLine {
  id: string
  jobTitle: string
  location: string
  currentHC: number
  budgeted: number // total planned HC
  hired: number // hired so far toward the plan
  needToHire: number // max(0, budgeted − currentHC)
  monthly: ManpowerMonthly[]
}

// Department → Sub-Department grouping of plan lines.
export interface ManpowerGroup {
  id: string
  department: string
  subDepartment: string
  lines: ManpowerLine[]
}

export interface ManpowerProject {
  id: string
  name: string
  code: string
  kind: ManpowerBudgetKind
  assignedToName: string
  assignedToInitials: string
  createdAt: string
  startDate: string
  endDate: string
  departments: string[]
  locations: string[]
  visibility: string
  currentHeadcount: number
  budgeted: number
  hired: number
  needToHire: number
  targetAchieved: number // % of budget currently staffed
  groups: ManpowerGroup[]
}

export interface ManpowerSummary {
  companyBudget: number
  currentEmployees: number
  budgeted: number
  hired: number
  needToHire: number
  targetAchieved: number
  projectCount: number
}

export interface ManpowerResponse {
  summary: ManpowerSummary
  projects: ManpowerProject[]
}

export interface NewManpowerProjectInput {
  name: string
  kind: ManpowerBudgetKind
  startDate: string
  endDate: string
  departments: string[]
  locations: string[]
  visibility: string
}
