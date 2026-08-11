export type JobStatus = 'published' | 'internal' | 'closed' | 'archived' | 'draft'
export type CollarType = 'white' | 'blue'
export type WorkModel = 'on-site' | 'remote' | 'hybrid'
/** Career Site "Type" filter — distinct from CollarType, which is the "Job Type" filter. */
export type EmploymentType = 'Full-time' | 'Part-time' | 'Freelance / Project' | 'Shift Based' | 'Volunteering' | 'Internship'
export type CareerLevel = 'Student' | 'Entry Level' | 'Experienced' | 'Manager' | 'Senior Management'

export interface JobAssignee {
  name: string
  initials: string
  bg: string
  color: string
}

export interface Job {
  id: string
  title: string
  status: JobStatus
  location: string | null
  department: string | null
  workModel: WorkModel
  collar: CollarType
  candidateCount: number
  newCandidates: number
  hires: number
  createdAt: string
  assignees: JobAssignee[]
  /**
   * Career-site content — optional because internal ATS rows (drafts, imported
   * jobs) may not have these yet. The public career site only ever renders
   * published/internal jobs, which the job wizard requires these for.
   */
  description?: string
  responsibilities?: string[]
  requirements?: string[]
  employmentType?: EmploymentType
  /** Career Site "Category" filter — e.g. "IT/Software Development". */
  category?: string
  careerLevel?: CareerLevel
}
