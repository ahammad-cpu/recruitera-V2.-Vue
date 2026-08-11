import { defineStore } from 'pinia'
import type { TeamMemberRole } from '~/types'

/**
 * DEMO-ONLY. There's no real role switching yet (auth is a single mock
 * user — see auth.store.ts) — this exists so permission-gated UI (Smart
 * Distribute's "Admin/Hiring Manager/Recruiter see different things", and
 * E2's per-candidate ownership/read-only rules) can actually be previewed
 * instead of only existing in the spec. Remove once real role-aware auth
 * ships.
 */
export type PreviewRole = 'admin' | 'hiring_manager' | 'recruiter'

export const PREVIEW_ROLE_LABELS: Record<PreviewRole, string> = {
  admin: 'Admin',
  hiring_manager: 'Hiring Manager',
  recruiter: 'Recruiter',
}

// Mirrors the default "Smart Distribute Initiation and Management" grants
// in team.handlers.ts (hmGranted/recruiterGranted both list/omit
// 'smart-distribute') — Admin is always on and locked, Hiring Manager is
// on by default, Recruiter is off by default.
export const SMART_DISTRIBUTE_PERMISSION_DEFAULT: Record<PreviewRole, boolean> = {
  admin: true,
  hiring_manager: true,
  recruiter: false,
}

/** Collapses a real TeamMember.role onto the coarse permission class above. */
export function previewRoleForTeamRole(teamRole: TeamMemberRole): PreviewRole {
  if (teamRole === 'Administrator') return 'admin'
  if (teamRole === 'Hiring Manager') return 'hiring_manager'
  return 'recruiter' // Recruiter, Viewer — no separate Viewer permission model yet
}

export const usePreviewRoleStore = defineStore('previewRole', () => {
  const role = ref<PreviewRole>('admin')

  // Which real team member is being previewed as. Candidate-ownership
  // checks (E2 "Assigned Recruiter" read-only rules) need to compare a
  // specific viewer against Candidate.assignedRecruiterId, not just an
  // abstract role class — `role` alone can't answer "is this viewer the
  // owner?". Defaults to team.handlers.ts's fixture Administrator ('1',
  // Mohamed Salem) so it matches the `role: 'admin'` default above before
  // any picker has loaded the roster.
  const viewerTeamMemberId = ref<string | null>('1')

  const canManageSmartDistribute = computed(() => SMART_DISTRIBUTE_PERMISSION_DEFAULT[role.value])
  return { role, viewerTeamMemberId, canManageSmartDistribute }
})
