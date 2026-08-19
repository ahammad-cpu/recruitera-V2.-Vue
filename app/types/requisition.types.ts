// Requisition module — modelled on the Recruitera requisition flow: a hiring
// request (title + manpower project + department) that is fleshed out on a
// detail page (joining month, workplace, salary, custom questions, job
// openings) and routed through a multi-step approval flow before it opens.

export type RequisitionStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'filled' | 'archived'
export type ApproverDecision = 'pending' | 'approved' | 'rejected'

export type RequisitionFilter = 'all' | 'approval' | 'mine' | 'assigned'
export type RequisitionScope = 'active' | 'archived'
export type RequisitionView = 'list' | 'board'

export type Workplace = 'on-site' | 'remote' | 'hybrid'
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship'
export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'experienced' | 'senior' | 'lead'

export interface RequisitionApprover {
  userId: string
  name: string
  initials: string
  decision: ApproverDecision
  decidedAt?: string
  note?: string
}

// One step of the approval flow. `rule` = how many approvers must approve.
export interface RequisitionApprovalStep {
  id: string
  order: number
  rule: 'all' | 'any'
  approvers: RequisitionApprover[]
}

// A single job opening = one seat, with a reason for the hire.
export interface RequisitionJobOpening {
  id: string
  reason: string
  explanation: string
}

// A custom screening question answered on the requisition.
export interface RequisitionCustomQuestion {
  id: string
  label: string
  required: boolean
  answer: string
}

export interface RequisitionActivity {
  id: string
  at: string
  actor: string
  text: string
}

export interface RequisitionNote {
  id: string
  author: string
  authorInitials: string
  text: string
  at: string
}

export interface RequisitionTeamMember {
  id: string
  name: string
  initials: string
  role: string
}

export interface Requisition {
  id: string
  code: string
  title: string
  status: RequisitionStatus
  // "New requisition" modal fields
  manpowerProject: string
  department: string
  // Requisition details
  joiningMonth: string // e.g. "2025-09"
  workplace: Workplace | ''
  employmentType: EmploymentType | ''
  experience: ExperienceLevel | ''
  // Salary
  salaryCurrency: string
  salaryFrom: number | null
  salaryTo: number | null
  // Custom questions + openings
  customQuestions: RequisitionCustomQuestion[]
  jobOpenings: RequisitionJobOpening[]
  openingsTotal: number // = jobOpenings.length
  hiresCount: number
  // Timeline dates: requestedAt = createdAt (bar start); expectedJoinDate =
  // planned join milestone; fulfilledAt = actual join-done milestone (or '').
  expectedJoinDate: string
  fulfilledAt: string
  locations: string[]
  // Approval
  approvalSteps: RequisitionApprovalStep[]
  // People + meta
  requesterId: string
  requesterName: string
  requesterInitials: string
  // Assigned recruiter (E5 — set after approval; empty while unassigned)
  assignedRecruiterId: string
  assignedRecruiterName: string
  assignedRecruiterInitials: string
  assignedAt: string
  following: boolean
  linkedJobIds: string[]
  team: RequisitionTeamMember[]
  notes: RequisitionNote[]
  activity: RequisitionActivity[]
  createdAt: string
  updatedAt: string
}

export interface RequisitionCounts {
  all: number
  approval: number
  mine: number
  assigned: number
}

// One row of the Team-Lead workload dashboard.
export interface RecruiterWorkload {
  recruiterId: string
  name: string
  initials: string
  role: string
  active: number // approved & open
  pending: number
  fulfilled: number
  total: number
  avgDaysToFill: number | null
  requisitions: Requisition[]
}

export interface RequisitionWorkloadResponse {
  data: RecruiterWorkload[]
  currentUserId: string
}

export interface RequisitionGroup {
  status: RequisitionStatus
  items: Requisition[]
  count: number
}

export interface RequisitionsResponse {
  groups: RequisitionGroup[]
  total: number
  counts: RequisitionCounts
  archivedCount: number
  currentUserId: string
}

export interface NewRequisitionInput {
  title: string
  manpowerProject: string
  department: string
}

export interface UpdateRequisitionInput {
  title?: string
  department?: string
  manpowerProject?: string
  joiningMonth?: string
  workplace?: Workplace | ''
  employmentType?: EmploymentType | ''
  experience?: ExperienceLevel | ''
  salaryCurrency?: string
  salaryFrom?: number | null
  salaryTo?: number | null
  customQuestions?: RequisitionCustomQuestion[]
  jobOpenings?: RequisitionJobOpening[]
  locations?: string[]
  approvalSteps?: RequisitionApprovalStep[]
}

export const REQUISITION_STATUS_META: Record<RequisitionStatus, { label: string, tone: 'gray' | 'pending' | 'approved' | 'danger' | 'teal-green', order: number }> = {
  draft: { label: 'Draft', tone: 'gray', order: 0 },
  pending: { label: 'Pending', tone: 'pending', order: 1 },
  approved: { label: 'Approved', tone: 'approved', order: 2 },
  filled: { label: 'Filled', tone: 'teal-green', order: 3 },
  rejected: { label: 'Rejected', tone: 'danger', order: 4 },
  archived: { label: 'Archived', tone: 'gray', order: 5 },
}

// Option lists (mock config).
export const MANPOWER_PROJECTS = ['Project test', '2025 Headcount Plan', 'Q3 Backfills', 'New Market — GCC']
export const REQUISITION_DEPARTMENTS = ['Finance', 'Engineering', 'Product', 'Human Resources', 'Operations', 'Marketing', 'Sales']
export const REQUISITION_LOCATIONS = ['Cairo', 'Alexandria', 'Dubai', 'Riyadh', 'Remote', 'Aruba']
export const WORKPLACE_OPTIONS: { value: Workplace, label: string }[] = [
  { value: 'on-site', label: 'On-Site' }, { value: 'remote', label: 'Remote' }, { value: 'hybrid', label: 'Hybrid' },
]
export const EMPLOYMENT_OPTIONS: { value: EmploymentType, label: string }[] = [
  { value: 'full-time', label: 'Full-time' }, { value: 'part-time', label: 'Part-time' }, { value: 'contract', label: 'Contract' }, { value: 'internship', label: 'Internship' },
]
export const EXPERIENCE_OPTIONS: { value: ExperienceLevel, label: string }[] = [
  { value: 'entry', label: 'Entry level' }, { value: 'junior', label: 'Junior' }, { value: 'mid', label: 'Mid level' }, { value: 'experienced', label: 'Experienced' }, { value: 'senior', label: 'Senior' }, { value: 'lead', label: 'Lead' },
]
export const CURRENCY_OPTIONS = ['EGP', 'USD', 'EUR', 'GBP', 'AED', 'SAR']
export const OPENING_REASONS = ['New position', 'Backfill / Replacement', 'Team expansion', 'Budget approved', 'Seasonal']
export const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
