// Talent Pool module — group candidates who aren't placed immediately (by
// department, by event, or the system General Application pool) for later reuse.

export type TalentPoolCategory = 'department' | 'event' | 'general'
export type TalentPoolStatus = 'active' | 'archived'

export interface TalentPoolMember {
  id: string
  name: string
  initials: string
}

export type TalentPoolFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'file' | 'yesno' | 'number' | 'date' | 'single-choice' | 'multi-choice'
export type TalentPoolFieldSection = 'candidate' | 'screening'

// A field on an event/general pool's public application form. Grouped into
// "Candidate information" and "Screening questions" like the job Application tab.
export interface TalentPoolFormField {
  id: string
  label: string
  type: TalentPoolFieldType
  required: boolean
  locked: boolean // Full Name / Email — always present + required
  enabled: boolean // included on the published form
  section: TalentPoolFieldSection
  visibility?: 'everyone' | 'me' // screening questions only
}

export interface TalentPool {
  id: string
  code: string
  name: string
  category: TalentPoolCategory
  department: string // for 'department' pools
  eventName: string // for 'event' pools
  description: string
  members: TalentPoolMember[]
  talentsCount: number
  pinned: boolean
  following: boolean
  system: boolean // General Application pool — limited actions
  hasForm: boolean
  formPublished: boolean
  formFields: TalentPoolFormField[]
  status: TalentPoolStatus
  createdAt: string
  createdBy: string
}

export interface TalentPoolCounts {
  all: number
  followed: number
  archived: number
}

export interface TalentPoolsResponse {
  data: TalentPool[]
  counts: TalentPoolCounts
  currentUserId: string
}

export interface NewTalentPoolInput {
  name: string
  category?: TalentPoolCategory
  department?: string
  eventName?: string
  description?: string
  memberIds: string[]
}

export interface UpdateTalentPoolInput {
  name?: string
  department?: string
  eventName?: string
  description?: string
  memberIds?: string[]
}

export interface DeleteTalentPoolInput {
  mode: 'all' | 'reassign'
  destinationId?: string
}

export const TALENT_POOL_CATEGORY_LABEL: Record<TalentPoolCategory, string> = {
  department: 'Department',
  event: 'Event',
  general: 'General Application',
}
