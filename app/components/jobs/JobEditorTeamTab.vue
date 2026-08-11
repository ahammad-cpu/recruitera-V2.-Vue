<!--
  Team tab body for the /jobs/new editor. Ports the reference layout:
  two-column card (member picker + added zone) + Auto-Distribute
  toggle + Candidate Distribution (Parallel / Sequential / Referral Link /
  Open Pool picker + recruiter capacity list + Save).

  Reuses:
    · useTeamMembers()  — settings composable, same source as
                          /settings/team so this stays in lockstep
                          with the workspace roster.
    · useSmartDistributeConfig() — seeds assigned/capacity/mode from the
      job's Smart Distribute config (E1), mutated locally afterwards the
      same way settings/locations.vue mutates its seeded copy.
    · BrandButton, BrandAvatarInitials, SettingsRowMenu/Item — the only
      new components are the two Smart Distribute modals (view assigned /
      redistribute) — nothing like them exists yet.
    · --brand-* tokens only; no hex.
-->
<script setup lang="ts">
import { Search, UserPlus, ClipboardPlus, X, GripVertical, ArrowLeftRight, Users, Copy, Check, Shuffle, ListOrdered, Link2, Hand, Trash2, Eye, Repeat2, AlertTriangle } from 'lucide-vue-next'
import { BrandButton, BrandAvatarInitials } from '~/components/brand'
import { useTeamMembers } from '~/composables/useTeam'
import { useAssignCandidates, useSmartDistributeConfig } from '~/composables/useSmartDistribute'
import { useApi } from '~/composables/useApi'
import JobTeamMemberModal from '~/components/jobs/JobTeamMemberModal.vue'
import SmartDistributeCandidatesModal from '~/components/jobs/SmartDistributeCandidatesModal.vue'
import SmartDistributeRedistributeModal from '~/components/jobs/SmartDistributeRedistributeModal.vue'
import SettingsRowMenu from '~/components/settings/SettingsRowMenu.vue'
import SettingsRowMenuItem from '~/components/settings/SettingsRowMenuItem.vue'
import { usePreviewRoleStore, PREVIEW_ROLE_LABELS, previewRoleForTeamRole } from '~/stores/previewRole.store'
import type { Component } from 'vue'
import type { DistributionMode, SmartDistributeCandidatesResponse, TeamMember } from '~/types'

const { data: teamData } = useTeamMembers()
const roster = computed<TeamMember[]>(() => teamData.value?.data ?? [])

// jobs/new.vue has no real job id yet (the job doesn't exist until
// Publish) — same fixture-stage placeholder this tab already used before.
const DEMO_JOB_ID = 'demo-job'

// `avatarText` on TeamMember is actually a color token (foreground color
// for the initials pill), NOT the initials themselves — mirrors how the
// Settings > Team page renders these. Derive initials from the display
// name at the render site so the avatar reads correctly here.
function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last  = parts.length > 1 ? parts[parts.length - 1]![0] : ''
  return (first + last).toUpperCase() || '?'
}

// Per-job added-member set (fixture; wire to job.assignedMemberIds when
// the API endpoint lands). Seed with two so the layout reads populated.
const added = ref<Set<string>>(new Set())
watchEffect(() => {
  if (!added.value.size && roster.value.length >= 2) {
    added.value = new Set([roster.value[0]!.id, roster.value[1]!.id])
  }
})

// Left column: search + list. Rows show Add or Added.
const search = ref('')
const filteredRoster = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return roster.value
  return roster.value.filter(m =>
    m.name.toLowerCase().includes(q)
    || m.email.toLowerCase().includes(q))
})

// Members added straight from the "Add Member To Job" modal (no roster
// row picked) live here so they still show under Added Members.
const manualMembers = ref<TeamMember[]>([])
const addedMembers = computed<TeamMember[]>(() => [
  ...roster.value.filter(m => added.value.has(m.id)),
  ...manualMembers.value,
])

function toggleAdd(id: string) {
  const next = new Set(added.value)
  if (next.has(id)) next.delete(id); else next.add(id)
  added.value = next
}

// Add-member flow — clicking "Add" opens the config modal (Role +
// stage visibility) instead of adding directly. Save commits both the
// membership and its per-job config.
const memberModalOpen = ref(false)
const pendingMember = ref<TeamMember | null>(null)
const memberConfig = ref<Record<string, { role: string; customizeStages: boolean; stages: string[] }>>({})
function openMemberModal(m: TeamMember | null = null) {
  pendingMember.value = m ?? firstUnaddedMember()
  memberModalOpen.value = true
}
function firstUnaddedMember() {
  return roster.value.find(m => !added.value.has(m.id)) ?? null
}
function onMemberSave(payload: { memberId: string; role: string; customizeStages: boolean; stages: string[] }) {
  if (payload.memberId && roster.value.some(m => m.id === payload.memberId)) {
    added.value = new Set([...added.value, payload.memberId])
    memberConfig.value = { ...memberConfig.value, [payload.memberId]: { role: payload.role, customizeStages: payload.customizeStages, stages: payload.stages } }
  } else {
    // Generic add (no roster row) — synthesize a row so it shows.
    manualMembers.value = [...manualMembers.value, {
      id: `tm-${manualMembers.value.length + 1}`,
      name: payload.role,
      email: '',
      role: payload.role,
      avatarBg: 'var(--brand-lime-tint)',
      avatarText: 'var(--brand-teal)',
    } as TeamMember]
  }
}
function roleFor(m: TeamMember) { return memberConfig.value[m.id]?.role || m.role }

// ─── Smart Distribute — pool membership, capacity, mode (E1) ─────────
// The Auto-Distribute pool is a subset of Added Members: removing someone
// here only takes them out of distribution, they stay on the job's Team —
// that's a separate action (the X button above) (E1 UC-07 / E3 "Protect
// Assigned Recruiters from Being Removed").
const distExcluded = ref<Set<string>>(new Set())
const poolMembers = computed(() => addedMembers.value.filter(m => !distExcluded.value.has(m.id)))

const autoDistribute = ref(true)
type DistMode = DistributionMode
const distMode = ref<DistMode>('parallel')
const unclaimedAlertHours = ref(48)

// Open Pool (claim mode) — which actions actually claim a candidate (E7).
// Viewing/sharing/downloading a profile is deliberately never a claim.
const QUALIFYING_ACTIONS: Array<{ key: string; label: string }> = [
  { key: 'stage',      label: 'Move pipeline stage' },
  { key: 'email',      label: 'Send email' },
  { key: 'whatsapp',   label: 'Send WhatsApp message' },
  { key: 'comment',    label: 'Add comment' },
  { key: 'evaluation', label: 'Request evaluation' },
  { key: 'task',       label: 'Add task' },
]
const NON_QUALIFYING_ACTIONS = ['View profile', 'Share profile', 'Download CV']
const claimActions = ref<Record<string, boolean>>(
  Object.fromEntries(QUALIFYING_ACTIONS.map(a => [a.key, true])),
)
function toggleClaimAction(key: string) {
  claimActions.value = { ...claimActions.value, [key]: !claimActions.value[key] }
}

// "Assigned" is never stored client-side — it's always read live off the
// job's Smart Distribute config, which itself derives it from real
// candidate ownership (ALL_CANDIDATES.assignedRecruiterId) server-side.
// Only capacity/unlimited (job-level rules, not ownership) get a local
// mutable copy, same pattern as settings/locations.vue.
const { data: distConfigData } = useSmartDistributeConfig(DEMO_JOB_ID)
const assignMutation = useAssignCandidates()

interface DistState { capacity: number | null; unlimited: boolean }
const distState = ref<Record<string, DistState>>({})
function distOf(id: string): DistState { return distState.value[id] ?? { capacity: null, unlimited: true } }
function distAssigned(id: string) { return distConfigData.value?.recruiters.find(r => r.teamMemberId === id)?.assigned ?? 0 }
function distCapacity(id: string) { return distOf(id).capacity }

const lastMemberId = computed(() =>
  poolMembers.value.length ? poolMembers.value[poolMembers.value.length - 1]!.id : null,
)
// Sequential always forces the last-in-order recruiter to Unlimited so
// overflow never gets stuck — regardless of what's stored for them (E1).
function isUnlimited(id: string) {
  if (distMode.value === 'sequential' && id === lastMemberId.value) return true
  return distOf(id).unlimited
}
function setCapacity(id: string, raw: string) {
  const n = raw === '' ? null : Math.max(0, Math.floor(Number(raw)) || 0)
  distState.value = { ...distState.value, [id]: { ...distOf(id), capacity: n } }
}
function toggleUnlimited(id: string) {
  const cur = distOf(id)
  distState.value = { ...distState.value, [id]: { ...cur, unlimited: !cur.unlimited } }
}

const distSeeded = ref(false)
watch(distConfigData, (cfg) => {
  if (cfg && !distSeeded.value) {
    distState.value = Object.fromEntries(
      cfg.recruiters.map(r => [r.teamMemberId, { capacity: r.capacity, unlimited: r.unlimited }]),
    )
    autoDistribute.value = cfg.enabled
    distMode.value = cfg.mode
    unclaimedAlertHours.value = cfg.unclaimedAlertHours
    distSeeded.value = true
  }
}, { immediate: true })

const DIST_MODES: Array<{ key: DistMode; label: string; desc: string; icon: Component }> = [
  { key: 'parallel',   label: 'Parallel Distribution',    desc: 'Assign candidates evenly across the team.', icon: Shuffle },
  { key: 'sequential', label: 'Sequential Distribution',  desc: 'Assigned in order by recruiter list.', icon: ListOrdered },
  { key: 'referral',   label: 'Referral Link',           desc: 'Assigned by the recruiter link used.', icon: Link2 },
  { key: 'claim',      label: 'Open Pool (Claim on Open)', desc: 'Unassigned until a recruiter opens it.', icon: Hand },
]
// Per-recruiter referral link (Referral Link mode).
function refLink(m: TeamMember) {
  const handle = (m.email.split('@')[0] || m.id).toLowerCase()
  return `apply.recruitera.ai/mmm?ref=${handle}`
}
const copiedRef = ref<string | null>(null)
function copyRef(m: TeamMember) {
  navigator.clipboard?.writeText('https://' + refLink(m))
  copiedRef.value = m.id
  setTimeout(() => { if (copiedRef.value === m.id) copiedRef.value = null }, 1500)
}

// ─── Permission gate (E4) — driven by the demo role-preview switcher
// since there's no real role-aware auth yet ───────────────────────────
const previewRoleStore = usePreviewRoleStore()
const canManage = computed(() => previewRoleStore.canManageSmartDistribute)

// Preview-as is now a real person picker (roster, above) so E2's
// ownership-based read-only rules on the candidate profile can compare a
// specific viewer against Candidate.assignedRecruiterId — `role` alone
// can't answer "is this viewer the owner?". Keep `role` in sync from the
// selected member's real TeamMemberRole so the existing E4 gates above
// keep working unchanged.
watchEffect(() => {
  const member = roster.value.find(m => m.id === previewRoleStore.viewerTeamMemberId)
  if (member) previewRoleStore.role = previewRoleForTeamRole(member.role)
})

// ─── Validation (E1) — blocks Save the same way the spec's acceptance
// criteria describe, not just a visual pass ──────────────────────────
const toggleWarning = ref<string | null>(null)
function flashWarning(msg: string) {
  toggleWarning.value = msg
  setTimeout(() => { if (toggleWarning.value === msg) toggleWarning.value = null }, 3400)
}
function onToggleAuto() {
  if (!canManage.value) {
    flashWarning("You don't have permission to manage Smart Distribute. Please contact your admin.")
    return
  }
  if (!autoDistribute.value && poolMembers.value.length < 2) {
    flashWarning('At least 2 recruiters must be added to this job to enable Auto Distribute.')
    return
  }
  autoDistribute.value = !autoDistribute.value
}

const validationError = computed(() => {
  if (!autoDistribute.value) return null
  if (poolMembers.value.length < 2) return 'At least 2 recruiters must be in the Auto-Distribute pool.'
  if (distMode.value === 'parallel') {
    const anyLimited = poolMembers.value.some(m => !isUnlimited(m.id))
    const anyUnlimited = poolMembers.value.some(m => isUnlimited(m.id))
    if (anyLimited && !anyUnlimited) return 'At least one recruiter must be Unlimited to absorb overflow.'
  }
  if (distMode.value === 'sequential' && poolMembers.value.length) {
    const nonLast = poolMembers.value.slice(0, -1)
    if (nonLast.some(m => !distCapacity(m.id) || (distCapacity(m.id) ?? 0) <= 0)) {
      return 'Every recruiter except the last one needs a capacity greater than 0.'
    }
  }
  return null
})
const canSave = computed(() => !validationError.value)

// ─── View assigned candidates (E3) ───────────────────────────────────
const viewOpen = ref(false)
const viewRecruiter = ref<(TeamMember & { assigned: number }) | null>(null)
function openView(m: TeamMember) {
  viewRecruiter.value = { ...m, assigned: distAssigned(m.id) }
  viewOpen.value = true
}
// Richer than a plain TeamMember[] — the View-and-redistribute modal's bulk
// flow (SmartDistributeRedistributeModal) needs capacity/unlimited too, not
// just who's eligible.
const viewOtherRecruiters = computed(() =>
  poolMembers.value
    .filter(m => m.id !== viewRecruiter.value?.id)
    .map(m => ({ ...m, ...distOf(m.id), assigned: distAssigned(m.id) })),
)
function onCandidatesReassigned(count: number) {
  showToast(count === 1 ? 'Candidate reassigned' : `${count} candidates redistributed`)
}

// ─── Redistribute + guarded remove (E3) ──────────────────────────────
const redistOpen = ref(false)
const redistSource = ref<(TeamMember & { assigned: number }) | null>(null)
const redistRemoveAfter = ref(false)
const redistTargets = computed(() => {
  if (!redistSource.value) return []
  return poolMembers.value
    .filter(m => m.id !== redistSource.value!.id)
    .map(m => ({ ...m, ...distOf(m.id), assigned: distAssigned(m.id) }))
})
function openRedistribute(m: TeamMember, removeAfter = false) {
  redistSource.value = { ...m, assigned: distAssigned(m.id) }
  redistRemoveAfter.value = removeAfter
  redistOpen.value = true
}
function requestRemove(m: TeamMember) {
  if (distAssigned(m.id) > 0) { openRedistribute(m, true); return }
  distExcluded.value = new Set([...distExcluded.value, m.id])
  showToast(`${m.name} removed from Auto-Distribute`)
}
// E3 "Add Recruiter to Auto-Distribute" — job team members who were taken
// out of the pool (not out of the job) can be put back in.
const excludedMembers = computed(() => addedMembers.value.filter(m => distExcluded.value.has(m.id)))
function readdToPool(id: string) {
  const next = new Set(distExcluded.value)
  next.delete(id)
  distExcluded.value = next
}
async function onRedistributeConfirm(payload: { count: number; strategy: 'auto' | 'manual'; allocations: Record<string, number> }) {
  const src = redistSource.value
  if (!src) return
  const api = useApi()
  // Fetch the source recruiter's real assigned candidates so there's an
  // actual id to move — the modal only deals in counts.
  const res = await api.get<SmartDistributeCandidatesResponse>(
    `/api/jobs/${DEMO_JOB_ID}/smart-distribute/candidates?recruiterId=${src.id}`,
  )
  const ids = res.data.slice(0, payload.count).map(c => c.id)
  let cursor = 0
  for (const [teamMemberId, n] of Object.entries(payload.allocations)) {
    if (!n) continue
    const slice = ids.slice(cursor, cursor + n)
    cursor += n
    if (slice.length) await assignMutation.mutateAsync({ candidateIds: slice, recruiterId: teamMemberId })
  }

  if (redistRemoveAfter.value) {
    if (payload.count >= src.assigned) {
      distExcluded.value = new Set([...distExcluded.value, src.id])
      showToast(`${src.name} removed from Auto-Distribute`)
    } else {
      showToast(`${src.assigned - payload.count} candidate(s) left — redistribute the rest to remove ${src.name}`)
    }
  } else {
    showToast('Candidates redistributed')
  }
  redistOpen.value = false
}

// Small local toast — this branch doesn't have a shared success-toast
// primitive yet (SettingsToast is styled specifically for blocking errors).
const toastMsg = ref<string | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | undefined
function showToast(msg: string) {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastMsg.value = null), 2600)
}

// Save state — noop today, but lights up the button and shows a small
// microcopy under the CTA after save so users see feedback.
const saveState = ref<'idle' | 'saving' | 'saved'>('idle')
async function save() {
  if (!canSave.value) return
  saveState.value = 'saving'
  await new Promise(r => setTimeout(r, 400))
  saveState.value = 'saved'
  setTimeout(() => (saveState.value = 'idle'), 1600)
}
</script>

<template>
  <div class="max-w-[960px] mx-auto pt-8 flex flex-col gap-6">
    <!-- Two-column card: picker (left) + added zone (right) -->
    <section class="rounded-[12px] bg-white border border-[var(--brand-border-fade)] overflow-hidden">
      <div class="grid grid-cols-2 min-h-[380px] divide-x divide-[var(--brand-border-fade)]">
        <!-- LEFT: search + roster -->
        <div class="flex flex-col">
          <div class="p-5">
            <div class="relative">
              <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-text-quiet)]" stroke-width="2" />
              <input
                v-model="search"
                placeholder="Search…"
                class="w-full h-9 pl-9 pr-3 text-[13.5px] rounded-full bg-[var(--brand-canvas)] border-[1.5px] border-[var(--brand-border-fade)] focus:border-[var(--brand-teal)] focus:bg-white focus:outline-none transition"
              >
            </div>
          </div>
          <div class="flex-1 overflow-y-auto">
            <div
              v-for="m in filteredRoster"
              :key="m.id"
              class="flex items-center gap-3 px-5 py-3 border-b border-[var(--brand-border-fade)] last:border-b-0"
            >
              <BrandAvatarInitials
                :initials="initialsFor(m.name)"
                :bg="m.avatarBg"
                :color="m.avatarText"
                size="xl"
              />
              <div class="flex-1 min-w-0">
                <div class="text-[13.5px] font-bold text-[var(--brand-text)] truncate">{{ m.name }}</div>
                <div class="text-[12px] text-[var(--brand-text-quiet)] truncate">{{ m.email }}</div>
              </div>
              <button
                v-if="!added.has(m.id)"
                type="button"
                class="text-[13px] font-bold text-[var(--brand-text-secondary)] hover:text-[var(--brand-text)] px-2 py-1 rounded-md hover:bg-[var(--brand-canvas)] transition"
                @click="openMemberModal(m)"
              >Add</button>
              <span
                v-else
                class="text-[12px] font-semibold text-[var(--brand-text-quiet)]"
              >Added</span>
            </div>
          </div>
          <div class="p-5 border-t border-[var(--brand-border-fade)]">
            <button
              type="button"
              class="w-full inline-flex items-center justify-center gap-2 h-10 rounded-[9px] border-[1.5px] border-dashed border-[var(--brand-border)] bg-transparent text-[13.5px] font-bold text-[var(--brand-text-secondary)] hover:text-[var(--brand-text)] hover:border-[var(--brand-teal)] hover:bg-[var(--brand-lime-tint)] transition disabled:opacity-40 disabled:pointer-events-none"
              :disabled="!firstUnaddedMember()"
              @click="openMemberModal(firstUnaddedMember()!)"
            >
              <UserPlus class="w-4 h-4" stroke-width="1.8" />
              Add Team Member
            </button>
          </div>
        </div>

        <!-- RIGHT: dropzone + added -->
        <div class="flex flex-col p-5 gap-5">
          <div class="rounded-[12px] border-[2px] border-dashed border-[var(--brand-border)] bg-[var(--brand-canvas)] px-5 py-7 flex flex-col items-center justify-center gap-2 text-center">
            <ClipboardPlus class="w-8 h-8 text-[var(--brand-text-faint)]" stroke-width="1.4" />
            <div class="text-[13px] text-[var(--brand-text-quiet)] leading-relaxed">
              Drag and drop member here<br>or click on add button
            </div>
          </div>

          <div>
            <div class="text-[13px] font-bold text-[var(--brand-text-secondary)] mb-2.5">Added Members</div>
            <div v-if="addedMembers.length" class="flex flex-col gap-2.5">
              <div
                v-for="m in addedMembers"
                :key="m.id"
                class="flex items-center gap-2.5"
              >
                <BrandAvatarInitials
                  :initials="initialsFor(m.name)"
                  :bg="m.avatarBg"
                  :color="m.avatarText"
                  size="xl"
                />
                <div class="flex-1 min-w-0">
                  <div class="text-[13.5px] font-bold text-[var(--brand-text)] truncate">
                    {{ m.name }}
                    <span class="font-normal text-[var(--brand-text-quiet)]">— {{ roleFor(m) }}</span>
                  </div>
                  <div class="text-[12px] text-[var(--brand-text-quiet)] truncate">{{ m.email }}</div>
                </div>
                <button
                  class="w-6 h-6 rounded-full inline-flex items-center justify-center border-[1.5px] border-[var(--brand-border)] bg-white text-[var(--brand-text-quiet)] hover:text-[var(--brand-status-closed-text)] hover:border-[var(--brand-status-closed-text)] transition"
                  :aria-label="`Remove ${m.name}`"
                  @click="toggleAdd(m.id)"
                >
                  <X class="w-3.5 h-3.5" stroke-width="2" />
                </button>
              </div>
            </div>
            <div v-else class="text-[13px] text-[var(--brand-text-faint)] italic">No members added yet.</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Auto-Distribute + Candidate Distribution card -->
    <section class="rounded-[12px] bg-white border border-[var(--brand-border-fade)] p-8">
    <!-- Preview-as person switcher — demo only, see previewRole.store.ts.
         A real team member (not just an abstract role) so ownership-based
         read-only rules on the candidate profile (E2) can be previewed too. -->
    <div class="flex items-center gap-2 mb-5 pb-5 border-b border-dashed border-[var(--brand-border)]">
      <span class="text-[10.5px] font-bold text-white bg-[var(--brand-teal-secondary)] px-1.5 py-0.5 rounded-[4px] tracking-wide">DEMO</span>
      <span class="text-[12.5px] font-semibold text-[var(--brand-text-quiet)]">Previewing as</span>
      <select
        v-model="previewRoleStore.viewerTeamMemberId"
        class="h-7 pl-2 pr-6 text-[12.5px] font-bold rounded-[7px] border-[1.5px] border-[var(--brand-border)] bg-white text-[var(--brand-text)] focus:border-[var(--brand-teal)] focus:outline-none"
      >
        <option v-for="m in roster" :key="m.id" :value="m.id">{{ m.name }} — {{ m.role }}</option>
      </select>
      <span class="text-[11.5px] text-[var(--brand-text-faint)]">— controls the "Smart Distribute Initiation and Management" (E4) and candidate ownership (E2) permissions</span>
    </div>

    <!-- Auto-Distribute Candidates -->
    <div class="flex items-center gap-4">
      <ArrowLeftRight class="w-5 h-5 text-[var(--brand-text-quiet)] shrink-0" stroke-width="1.7" />
      <div class="flex-1 min-w-0">
        <div class="text-[15px] font-bold text-[var(--brand-text)]">Auto-Distribute Candidates</div>
        <div class="text-[13px] text-[var(--brand-text-quiet)] mt-0.5">Assign candidates to recruiters based on distribution rules</div>
        <div v-if="toggleWarning" class="text-[12.5px] font-semibold text-[var(--brand-status-closed-text)] mt-1.5 flex items-center gap-1.5">
          <AlertTriangle class="w-3.5 h-3.5 shrink-0" stroke-width="2" />
          {{ toggleWarning }}
        </div>
      </div>
      <label
        class="inline-flex items-center shrink-0"
        :class="canManage ? 'cursor-pointer' : 'cursor-not-allowed'"
      >
        <span
          class="relative inline-flex w-[38px] h-[22px] rounded-full transition-colors"
          :class="{ 'opacity-50': !canManage }"
          :style="{ background: autoDistribute ? 'var(--brand-teal)' : 'var(--brand-border)' }"
        >
          <span
            class="absolute top-[2px] w-[18px] h-[18px] bg-white rounded-full shadow-[0_1px_2px_rgba(0,20,18,0.25)] transition-[left]"
            :style="{ left: autoDistribute ? '18px' : '2px' }"
          />
        </span>
        <input :checked="autoDistribute" type="checkbox" class="sr-only" aria-label="Auto-distribute candidates" @change="onToggleAuto">
      </label>
    </div>

    <!-- Non-permitted role: state only, no management controls (E3 "Smart Distribute Management Access") -->
    <div v-if="autoDistribute && !canManage" class="mt-6 pt-6 border-t border-[var(--brand-border-fade)] text-[13px] text-[var(--brand-text-quiet)]">
      Auto-Distribute is currently <span class="font-bold text-[var(--brand-text)]">ON</span> for this job. Configuration is hidden — {{ PREVIEW_ROLE_LABELS[previewRoleStore.role] }} doesn't have the Smart Distribute permission.
    </div>

    <!-- Candidate Distribution -->
    <div v-if="autoDistribute && canManage" class="mt-6 pt-6 border-t border-[var(--brand-border-fade)]">
      <div class="flex items-center gap-2.5 mb-3">
        <Users class="w-5 h-5 text-[var(--brand-text-quiet)]" stroke-width="1.7" />
        <h2 class="text-[16px] font-bold text-[var(--brand-text)]">Candidate Distribution</h2>
      </div>

      <div class="text-[13px] text-[var(--brand-text-secondary)] mb-2">Distribution Mode</div>
      <div class="grid grid-cols-4 gap-3 mb-3.5">
        <button
          v-for="mode in DIST_MODES"
          :key="mode.key"
          type="button"
          class="relative h-full text-left rounded-[10px] border-[1.5px] p-4 pr-9 transition"
          :class="distMode === mode.key
            ? 'border-[var(--brand-teal)] bg-[var(--brand-lime-tint)]'
            : 'border-[var(--brand-border)] bg-white hover:border-[var(--brand-teal)] hover:bg-[var(--brand-lime-tint)]'"
          @click="distMode = mode.key"
        >
          <!-- selection indicator — pinned to the same top-right corner on every card -->
          <span
            v-if="distMode === mode.key"
            class="absolute top-4 right-4 w-5 h-5 rounded-full bg-[var(--brand-teal)] inline-flex items-center justify-center"
          >
            <Check class="w-3 h-3 text-[var(--brand-lime)]" stroke-width="3" />
          </span>
          <span v-else class="absolute top-4 right-4 w-5 h-5 rounded-full border-[1.5px] border-[var(--brand-border)]" />

          <component :is="mode.icon" class="w-5 h-5 text-[var(--brand-text-secondary)] mb-3" stroke-width="1.7" />
          <div class="text-[14px] font-bold text-[var(--brand-text)] mb-0.5">{{ mode.label }}</div>
          <div class="text-[12.5px] text-[var(--brand-text-quiet)] line-clamp-2">{{ mode.desc }}</div>
        </button>
      </div>

      <!-- Validation banner (E1) — blocks Save until fixed -->
      <div
        v-if="validationError"
        class="flex items-center gap-2.5 text-[12.5px] font-semibold text-[var(--brand-status-closed-text)] bg-[var(--brand-status-closed-bg)] rounded-[10px] px-4 py-3 mb-3.5"
      >
        <AlertTriangle class="w-4 h-4 shrink-0" stroke-width="2" />
        {{ validationError }}
      </div>
      <div v-else class="text-[13px] text-[var(--brand-text-secondary)] mb-3">
        <template v-if="distMode === 'sequential'">
          Recruiters will receive candidates in the order listed below.
          <span class="font-bold text-[var(--brand-text)]">The last recruiter will receive any remaining candidates.</span>
        </template>
        <template v-else-if="distMode === 'referral'">
          Share each recruiter's link. Candidates who apply through it are automatically assigned to that recruiter.
        </template>
        <template v-else-if="distMode === 'claim'">
          New candidates stay in a shared pool. <span class="font-bold text-[var(--brand-text)]">The first recruiter to take action on a candidate is assigned to it.</span>
        </template>
        <template v-else>
          When using capacity limits, at least one recruiter must be set as unlimited to handle overflow.
        </template>
      </div>

      <!-- Open Pool — which actions actually claim a candidate, + unclaimed nudge -->
      <div v-if="distMode === 'claim'" class="rounded-[10px] border border-[var(--brand-border-fade)] bg-[var(--brand-canvas)] p-4 mb-3.5">
        <div class="text-[12.5px] font-bold text-[var(--brand-text-secondary)] mb-2.5">Claims ownership when a recruiter…</div>
        <div class="flex flex-wrap gap-2 mb-3">
          <button
            v-for="a in QUALIFYING_ACTIONS"
            :key="a.key"
            type="button"
            class="inline-flex items-center gap-1.5 text-[12px] font-bold rounded-full px-3 py-1.5 border-[1.5px] transition"
            :class="claimActions[a.key]
              ? 'border-[var(--brand-teal)] bg-[var(--brand-lime-tint)] text-[var(--brand-text)]'
              : 'border-[var(--brand-border)] bg-white text-[var(--brand-text-quiet)]'"
            @click="toggleClaimAction(a.key)"
          >
            <Check v-if="claimActions[a.key]" class="w-3 h-3 text-[var(--brand-teal-secondary)]" stroke-width="2.5" />
            {{ a.label }}
          </button>
          <span
            v-for="label in NON_QUALIFYING_ACTIONS"
            :key="label"
            class="inline-flex items-center text-[12px] font-semibold rounded-full px-3 py-1.5 border-[1.5px] border-dashed border-[var(--brand-border)] text-[var(--brand-text-faint)]"
            :title="`${label} never claims a candidate — viewing isn't a commitment.`"
          >{{ label }}</span>
        </div>
        <div class="flex items-center gap-3 pt-3 border-t border-[var(--brand-border-fade)]">
          <span class="text-[12.5px] font-semibold text-[var(--brand-text-secondary)]">Nudge recruiters if a candidate stays unclaimed for</span>
          <select
            v-model.number="unclaimedAlertHours"
            class="h-8 pl-3 pr-7 text-[12.5px] font-bold rounded-[8px] border-[1.5px] border-[var(--brand-border)] bg-white text-[var(--brand-text)] focus:border-[var(--brand-teal)] focus:outline-none"
          >
            <option :value="24">24 hours</option>
            <option :value="48">48 hours</option>
            <option :value="72">72 hours</option>
          </select>
        </div>
      </div>

      <!-- Recruiter list — every mode shows Assigned; Capacity/Unlimited only apply to Parallel & Sequential -->
      <div class="flex flex-col gap-2">
        <div
          v-for="m in poolMembers"
          :key="m.id"
          class="flex items-center gap-3 px-4 py-3 border border-[var(--brand-border-fade)] rounded-[10px] bg-white"
        >
          <GripVertical v-if="distMode === 'sequential'" class="w-3.5 h-3.5 text-[var(--brand-border)] cursor-grab shrink-0" stroke-width="2" />
          <!-- Recruiter identity — also an entry point into "View assigned
               candidates" (RC-1250), not just the kebab menu. -->
          <button
            type="button"
            class="flex items-center gap-3 flex-1 min-w-0 text-left rounded-[8px] -mx-1 px-1 py-0.5 hover:bg-[var(--brand-canvas)] transition"
            title="Click to view assigned candidates"
            @click="openView(m)"
          >
            <BrandAvatarInitials :initials="initialsFor(m.name)" :bg="m.avatarBg" :color="m.avatarText" size="xl" />
            <div class="flex-1 min-w-0">
              <div class="text-[13.5px] font-bold text-[var(--brand-text)] truncate">{{ m.name }}</div>
              <div class="text-[12px] text-[var(--brand-text-quiet)] truncate">{{ m.email }}</div>
            </div>
          </button>

          <!-- Assigned — progress bar when a real capacity applies, plain count
               otherwise. Also an entry point into "View assigned candidates"
               (RC-1250): "Hovering over the Assigned Candidates number shows a
               tooltip... Clicking the number opens the modal." -->
          <button
            type="button"
            class="shrink-0 w-[84px] rounded-[8px] hover:bg-[var(--brand-canvas)] transition"
            title="Click to view assigned candidates"
            @click="openView(m)"
          >
            <template v-if="(distMode === 'parallel' || distMode === 'sequential') && !isUnlimited(m.id) && (distCapacity(m.id) ?? 0) > 0">
              <div class="flex items-baseline justify-between text-[11px] font-bold text-[var(--brand-text-secondary)] mb-1 tabular-nums">
                <span>{{ distAssigned(m.id) }}</span>
                <span class="text-[var(--brand-text-quiet)] font-semibold">/ {{ distCapacity(m.id) }}</span>
              </div>
              <div class="h-[6px] rounded-full bg-[var(--brand-border-fade)] overflow-hidden">
                <div
                  class="h-full rounded-full transition-[width]"
                  :style="{
                    width: Math.min(100, Math.round((distAssigned(m.id) / Math.max(distCapacity(m.id) || 1, 1)) * 100)) + '%',
                    background: distAssigned(m.id) >= (distCapacity(m.id) || 0) ? 'var(--brand-warning)' : 'var(--brand-teal-secondary)',
                  }"
                />
              </div>
            </template>
            <template v-else>
              <div class="text-center leading-none">
                <div class="text-[15px] font-bold text-[var(--brand-text)] tabular-nums">{{ distAssigned(m.id) }}</div>
                <div class="text-[9.5px] font-bold text-[var(--brand-text-quiet)] uppercase tracking-wide mt-1">Assigned</div>
              </div>
            </template>
          </button>

          <!-- Sequential: capacity input per recruiter; the last one is Unlimited -->
          <template v-if="distMode === 'sequential'">
            <span v-if="m.id === lastMemberId" class="text-[13.5px] font-bold text-[var(--brand-text-secondary)] shrink-0">Unlimited</span>
            <div v-else class="shrink-0 flex flex-col items-center gap-1">
              <input
                :value="distCapacity(m.id) ?? ''"
                type="number"
                min="0"
                placeholder="0"
                :aria-label="`Capacity for ${m.name}`"
                class="w-[64px] h-9 px-2 text-center text-[14px] font-bold rounded-[9px] border-[1.5px] border-[var(--brand-border)] bg-white focus:border-[var(--brand-teal)] focus:outline-none transition"
                @input="setCapacity(m.id, ($event.target as HTMLInputElement).value)"
              >
              <span class="text-[11px] font-semibold text-[var(--brand-text-quiet)]">Capacity</span>
            </div>
          </template>

          <!-- Referral Link: per-recruiter shareable link + copy -->
          <div v-else-if="distMode === 'referral'" class="shrink-0 flex items-center gap-2">
            <span class="hidden sm:inline-flex items-center h-9 px-3 rounded-[9px] border-[1.5px] border-[var(--brand-border-fade)] bg-[var(--brand-canvas)] text-[12.5px] font-semibold text-[var(--brand-text-secondary)] max-w-[240px] truncate">
              {{ refLink(m) }}
            </span>
            <button
              type="button"
              class="w-9 h-9 rounded-[9px] inline-flex items-center justify-center border-[1.5px] border-[var(--brand-border-fade)] bg-white text-[var(--brand-teal)] hover:bg-[var(--brand-lime-tint)] transition"
              :aria-label="`Copy referral link for ${m.name}`"
              @click="copyRef(m)"
            >
              <Check v-if="copiedRef === m.id" class="w-4 h-4" stroke-width="2.2" />
              <Copy v-else class="w-4 h-4" stroke-width="1.7" />
            </button>
          </div>

          <!-- Parallel: unlimited on/off toggle -->
          <label v-else-if="distMode === 'parallel'" class="inline-flex items-center cursor-pointer shrink-0 gap-2">
            <div v-if="!isUnlimited(m.id)" class="shrink-0 flex flex-col items-center gap-1">
              <input
                :value="distCapacity(m.id) ?? ''"
                type="number"
                min="0"
                placeholder="0"
                :aria-label="`Capacity for ${m.name}`"
                class="w-[64px] h-9 px-2 text-center text-[14px] font-bold rounded-[9px] border-[1.5px] border-[var(--brand-border)] bg-white focus:border-[var(--brand-teal)] focus:outline-none transition"
                @input="setCapacity(m.id, ($event.target as HTMLInputElement).value)"
              >
              <span class="text-[11px] font-semibold text-[var(--brand-text-quiet)]">Capacity</span>
            </div>
            <span
              class="relative inline-flex w-[38px] h-[22px] rounded-full transition-colors"
              :style="{ background: isUnlimited(m.id) ? 'var(--brand-teal)' : 'var(--brand-border)' }"
            >
              <span
                class="absolute top-[2px] w-[18px] h-[18px] bg-white rounded-full shadow-[0_1px_2px_rgba(0,20,18,0.25)] transition-[left]"
                :style="{ left: isUnlimited(m.id) ? '18px' : '2px' }"
              />
            </span>
            <input
              :checked="isUnlimited(m.id)"
              type="checkbox"
              class="sr-only"
              :aria-label="`Unlimited capacity for ${m.name}`"
              @change="toggleUnlimited(m.id)"
            >
            <span class="text-[13px] font-bold text-[var(--brand-text-secondary)]">Unlimited</span>
          </label>

          <!-- View assigned / Redistribute / Remove — one menu -->
          <SettingsRowMenu>
            <SettingsRowMenuItem @click="openView(m)">
              <Eye class="w-3.5 h-3.5" stroke-width="1.8" />
              View assigned candidates
            </SettingsRowMenuItem>
            <SettingsRowMenuItem :disabled="distAssigned(m.id) === 0" @click="openRedistribute(m)">
              <Repeat2 class="w-3.5 h-3.5" stroke-width="1.8" />
              Redistribute candidates
            </SettingsRowMenuItem>
            <SettingsRowMenuItem danger :aria-label="`Remove ${m.name} from Auto-Distribute`" @click="requestRemove(m)">
              <Trash2 class="w-3.5 h-3.5" stroke-width="1.8" />
              Remove from Auto-Distribute
            </SettingsRowMenuItem>
          </SettingsRowMenu>
        </div>
        <div v-if="!poolMembers.length" class="text-[13px] text-[var(--brand-text-faint)] italic px-1 py-2">
          No recruiters in the Auto-Distribute pool.
        </div>
      </div>

      <!-- On the job's team, but taken out of the pool -->
      <div v-if="excludedMembers.length" class="flex flex-wrap items-center gap-2 mt-3">
        <span class="text-[11.5px] font-semibold text-[var(--brand-text-quiet)]">Not in the pool:</span>
        <button
          v-for="m in excludedMembers"
          :key="m.id"
          type="button"
          class="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--brand-teal-secondary)] bg-[var(--brand-lime-tint)] border border-[var(--brand-border-fade)] rounded-full pl-2.5 pr-3 py-1 hover:bg-[var(--brand-lime-active-bg)] transition"
          @click="readdToPool(m.id)"
        >
          <UserPlus class="w-3 h-3" stroke-width="2" />
          {{ m.name }}
        </button>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-2.5 mt-5 pt-4 border-t border-[var(--brand-border-fade)]">
        <BrandButton variant="outline" :disabled="!firstUnaddedMember()" @click="openMemberModal(firstUnaddedMember()!)">
          <UserPlus class="w-3.5 h-3.5 mr-1.5" stroke-width="1.8" />
          Add Team Member
        </BrandButton>
        <button
          class="px-6 h-10 rounded-[9px] text-[13.5px] font-bold bg-[var(--brand-lime)] text-[var(--brand-teal)] hover:brightness-95 transition disabled:opacity-40 disabled:pointer-events-none"
          :disabled="saveState === 'saving' || !canSave"
          @click="save"
        >
          {{ saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Save' }}
        </button>
      </div>
    </div>
    </section>

    <!-- Add-member config modal (Role + stage visibility) -->
    <JobTeamMemberModal v-model:open="memberModalOpen" :member="pendingMember" @save="onMemberSave" />

    <!-- Smart Distribute — view assigned candidates -->
    <SmartDistributeCandidatesModal
      v-model:open="viewOpen"
      :job-id="DEMO_JOB_ID"
      :recruiter="viewRecruiter"
      :other-recruiters="viewOtherRecruiters"
      @reassigned="onCandidatesReassigned"
    />

    <!-- Smart Distribute — redistribute / guarded remove -->
    <SmartDistributeRedistributeModal
      v-model:open="redistOpen"
      :source="redistSource"
      :targets="redistTargets"
      :remove-after="redistRemoveAfter"
      @confirm="onRedistributeConfirm"
    />

    <!-- Local success toast -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="toastMsg"
        class="fixed bottom-7 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2.5 rounded-[12px] px-5 py-3.5 text-[13.5px] font-semibold shadow-[0_8px_32px_rgba(0,0,0,0.22)]"
        style="background: var(--brand-toast-success-bg); color: var(--brand-toast-success-text)"
      >
        <Check class="w-4 h-4 shrink-0" stroke-width="2.5" />
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>
