export type CandidateStatus = 'new' | 'qualified' | 'disqualified' | 'not_contacted' | 'followed'
export type JobStatus       = 'published' | 'internal' | 'closed' | 'archived' | 'draft'

export interface CandidateJob {
  title: string
  status: JobStatus
  /** Pipeline-level disqualification for this specific job assignment (independent of CandidateStatus). */
  disqualified?: boolean
  /** Where this specific job is based — overrides the profile location on the pipeline card. */
  location?: string
  /** Human-readable date this job assignment was created (e.g. "May 28, 2026"). */
  assignedDate?: string
}

export interface AiCriterion {
  label: string
  weight: number
}

export interface Candidate {
  id: string
  name: string
  initials: string
  avatarColor: string
  isNew: boolean

  status: CandidateStatus
  jobs: CandidateJob[]                 // 0..N
  sources: string[]                    // e.g. ['Indeed'], ['LinkedIn'], ['Careers site']
  tags: string[]                       // e.g. ['Sample', 'Junior']
  talentPools: string[]                // e.g. ['Rising stars (Sample)']
  disqualifiedBy: string | null

  /** Smart Distribute ownership (E2) — team member id, or null/undefined
   * when unassigned. Job-scoped in a real API; this fixture treats it as
   * a single global assignment since candidates only carry one demo job. */
  assignedRecruiterId?: string | null
  /** E5 ownership type — how the current assignment came to be. Drives the
   * "Source" filter/column in the per-recruiter candidates table (View &
   * Redistribute modal), separate from `sources` (how the candidate itself
   * was sourced/applied). 'external' covers LinkedIn/Company Website/
   * Referral/Recruiter-sourced candidates who were auto-distributed. */
  assignmentSource?: 'manual' | 'self' | 'external'

  // relative time strings — a real API would return ISO dates
  dateCreated: string

  // hidden-by-default columns
  stage?: string
  evaluationScore?: number
  averageEvaluationScore?: number
  screeningScore?: number
  workLocation?: string
  disqualifyDate?: string
  integrations?: string[]
  lastActivity?: string
  hireDate?: string
  startDate?: string
}

export interface CandidateTask {
  id: string
  title: string
  dueDate: string | null
  done: boolean
}

export interface CandidateNote {
  id: string
  author: string
  authorInitials: string
  body: string
  createdAt: string
}

export interface CandidateLastActivity {
  when: string
  actor: string
  actorInitials: string
  action: string
}

export interface CandidateProfileFields {
  university: string | null
  faculty: string | null
  yearsOfExperience: number | null
  industryRelevant: boolean | null
  languages: string | null
  gender: string | null
}

export interface ScreeningQuestion {
  id: string
  question: string
  answer: string
}

export interface CvExperienceEntry {
  role: string
  company: string
  period: string
  location: string
  description: string
}

export interface CvEducationEntry {
  degree: string
  school: string
  period: string
}

export interface CandidateCv {
  candidateName: string
  title: string
  contactLine: string
  summary: string
  experience: CvExperienceEntry[]
  skills: string[]
  education: CvEducationEntry[]
}

export interface CandidateProfile extends Candidate {
  email: string
  phone: string
  location: string
  score: string | null
  source: string
  createdDate: string
  cvFileName: string | null
  owner: string
  ownerInitials: string
  aiCriteria: AiCriterion[]
  tasks: CandidateTask[]
  notes: CandidateNote[]
  lastActivityDetail: CandidateLastActivity | null
  profileFields: CandidateProfileFields
  screeningQuestions: ScreeningQuestion[]
  cv: CandidateCv | null
  screenedAt: string | null
}

export interface CandidatesResponse {
  data: Candidate[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface CandidateFilterCounts {
  recentlyDeleted: number
  qualifiedCandidates: number
  newCandidates: number
  notContacted: number
  followedCandidates: number
}

export interface CandidateFilters {
  status: string
  search: string
  job: string
  page: number
  perPage: number
}
