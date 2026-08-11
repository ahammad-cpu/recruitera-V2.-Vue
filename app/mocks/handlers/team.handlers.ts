import { http, HttpResponse } from 'msw'
import type { HiringRole, TeamMember } from '~/types'

// Exported so other domains (Reports, Smart Distribute) build recruiter/hiring-
// manager identity from this one roster instead of inventing a parallel cast.
export const teamMembers: TeamMember[] = [
  { id: '1', name: 'Mohamed Salem', email: 'm.salem@icareer.ai', role: 'Administrator', status: 'Active', avatarBg: 'var(--brand-teal)', avatarText: 'var(--brand-avatar-text)' },
  { id: '2', name: 'Sara Rashed', email: 's.rashed@icareer.ai', role: 'Recruiter', status: 'Active', avatarBg: 'var(--brand-teal-secondary)', avatarText: 'var(--brand-avatar-text)' },
  { id: '3', name: 'Ahmed Kamal', email: 'a.kamal@icareer.ai', role: 'Hiring Manager', status: 'Pending', avatarBg: 'var(--brand-avatar-4)', avatarText: 'var(--brand-avatar-text)' },
  { id: '4', name: 'Lina Waheed', email: 'l.waheed@icareer.ai', role: 'Recruiter', status: 'Active', avatarBg: 'var(--brand-settings-danger)', avatarText: 'var(--brand-avatar-text)' },
]

const ALL_PERMS = [
  // General
  'view-candidates', 'add-candidates', 'view-jobs', 'access-reports', 'share-candidates', 'print-candidates',
  // Workflow
  'move-candidates', 'disqualify-candidates', 'edit-candidates', 'delete-candidates', 'send-emails', 'send-interviews', 'make-evaluations', 'time-scheduling',
  // Templates
  'manage-templates',
  // Company
  'create-edit-jobs', 'manage-career-page', 'manage-hiring-roles', 'add-team-members',
  // Add-ons
  'access-requisition', 'access-manpower', 'smart-distribute',
]

function permMap(granted: string[]): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  for (const p of ALL_PERMS) map[p] = granted.includes(p)
  return map
}

const hmGranted = ['view-candidates', 'add-candidates', 'view-jobs', 'share-candidates', 'print-candidates', 'move-candidates', 'disqualify-candidates', 'edit-candidates', 'send-emails', 'send-interviews', 'make-evaluations', 'time-scheduling', 'access-requisition', 'smart-distribute']
const recruiterGranted = ['view-candidates', 'add-candidates', 'view-jobs', 'access-reports', 'share-candidates', 'print-candidates', 'move-candidates', 'disqualify-candidates', 'edit-candidates', 'delete-candidates', 'send-emails', 'send-interviews', 'make-evaluations', 'time-scheduling', 'manage-templates', 'create-edit-jobs']
const employeeGranted = ['view-candidates', 'view-jobs', 'make-evaluations']
const reviewerGranted = ['view-candidates', 'view-jobs', 'make-evaluations']

const hiringRoles: HiringRole[] = [
  {
    id: 'admin', label: 'Company Admin', locked: true, custom: false,
    description: 'Administrators have access to all candidates, jobs, and settings, and can fully manage the company\'s account and members. Only users with this role can delete other administrators and be granted access to all data.',
    members: [{ name: 'Mohamed Salem', email: 'm.salem@icareer.ai', status: 'Active' }],
    permissions: permMap(ALL_PERMS),
  },
  {
    id: 'hm', label: 'Hiring Manager', locked: false, custom: false,
    description: 'Hiring Managers participate in candidate evaluation and pipeline decisions within their assigned departments. They can review candidates, conduct interviews, and submit evaluations.',
    members: [
      { name: 'Ahmed Kamal', email: 'a.kamal@icareer.ai', status: 'Pending' },
      { name: 'Lina Waheed', email: 'l.waheed@icareer.ai', status: 'Active' },
    ],
    permissions: permMap(hmGranted),
  },
  {
    id: 'recruiter', label: 'Recruiter', locked: false, custom: false,
    description: 'Recruiters manage the day-to-day hiring workflow. They can source candidates, move them through the pipeline, send emails, and schedule interviews.',
    members: [{ name: 'Sara Rashed', email: 's.rashed@icareer.ai', status: 'Active' }],
    permissions: permMap(recruiterGranted),
  },
  {
    id: 'employee', label: 'Employee', locked: false, custom: false,
    description: 'Employees can collaborate on candidates they have been invited to review. They can add notes and evaluations to candidates shared with them.',
    members: [],
    permissions: permMap(employeeGranted),
  },
  {
    id: 'reviewer', label: 'Reviewer', locked: false, custom: false,
    description: 'Reviewers can be invited to evaluate candidates. They can view candidate profiles and submit structured feedback via evaluation forms.',
    members: [],
    permissions: permMap(reviewerGranted),
  },
]

export const teamHandlers = [
  http.get('/api/team/members', () => HttpResponse.json({ data: teamMembers, total: teamMembers.length })),
  http.get('/api/team/roles', () => HttpResponse.json({ data: hiringRoles, total: hiringRoles.length })),
]
