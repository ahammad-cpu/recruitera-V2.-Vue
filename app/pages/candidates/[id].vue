<script setup lang="ts">
import {
  X, Plus, ChevronDown, ChevronUp, Copy, Linkedin, Github, Check,
  Users, Tag, MoreVertical, MessageCircle, FolderCheck, Link2, Printer,
  ExternalLink, GraduationCap, GripVertical, Upload, RefreshCw, Trash2, FolderMinus,
  ListOrdered, RotateCcw,
} from 'lucide-vue-next'
import { BrandAvatarInitials, BrandButton, BrandEmptyState, BrandStatusBadge, BrandLimeCheckbox } from '~/components/brand'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import CandidateCollapsibleCard from '~/components/candidates/CandidateCollapsibleCard.vue'
import CandidateJobPipelineCard from '~/components/candidates/CandidateJobPipelineCard.vue'
import CandidateEmailsTab from '~/components/candidates/CandidateEmailsTab.vue'
import CandidateWhatsAppTab from '~/components/candidates/CandidateWhatsAppTab.vue'
import CandidateEvaluationTab from '~/components/candidates/CandidateEvaluationTab.vue'
import CandidateFilesTab from '~/components/candidates/CandidateFilesTab.vue'
import CandidateActivityTab from '~/components/candidates/CandidateActivityTab.vue'
import CandidateEventsTab from '~/components/candidates/CandidateEventsTab.vue'
import CandidateScheduleModal from '~/components/candidates/CandidateScheduleModal.vue'
import CandidateTagMenu from '~/components/candidates/CandidateTagMenu.vue'
import CandidateSourceMenu from '~/components/candidates/CandidateSourceMenu.vue'
import CandidateQuickEvalPopover from '~/components/candidates/CandidateQuickEvalPopover.vue'
import CandidateAssignModal from '~/components/candidates/CandidateAssignModal.vue'
import CandidateAssignRecruiterMenu from '~/components/candidates/CandidateAssignRecruiterMenu.vue'
import CandidateShareMenu from '~/components/candidates/CandidateShareMenu.vue'
import CandidateConfirmDialog from '~/components/candidates/CandidateConfirmDialog.vue'
import CandidateTaskComposer from '~/components/candidates/CandidateTaskComposer.vue'
import CandidateNotesComposer from '~/components/candidates/CandidateNotesComposer.vue'
import ErrorBoundary from '~/components/ErrorBoundary.vue'
import { useCandidates, useCandidateProfile } from '~/composables/useCandidates'
import { useTeamMembers } from '~/composables/useTeam'
import { useAssignCandidates } from '~/composables/useSmartDistribute'
import { usePreviewRoleStore } from '~/stores/previewRole.store'
import type { CandidateJob, CandidateProfile } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id))

const { data: profile, isLoading } = useCandidateProfile(id)

// Smart Distribute ownership (E2) — who this candidate is assigned to, and
// whether the currently-previewed viewer (demo-only, see previewRole.store.ts)
// is that owner or an Admin. Drives the header chip + read-only gating below.
const { data: teamData } = useTeamMembers()
const roster = computed(() => teamData.value?.data ?? [])
const previewRoleStore = usePreviewRoleStore()
const assignedRecruiter = computed(() => {
  const rid = profile.value?.assignedRecruiterId
  return rid ? roster.value.find(m => m.id === rid) ?? null : null
})
const isOwner = computed(() =>
  !!profile.value?.assignedRecruiterId && profile.value.assignedRecruiterId === previewRoleStore.viewerTeamMemberId,
)
// Non-owner recruiters can view the profile, add notes, and share — but not
// move stages, disqualify/hire/delete, edit candidate data, or add/edit
// tasks/tags/evaluations. Admin always has full access. Unassigned
// candidates aren't gated — there's no owner to defer to yet.
const readOnly = computed(() =>
  !!profile.value?.assignedRecruiterId && !isOwner.value && previewRoleStore.role !== 'admin',
)

// E5 ownership writes — self-claim and Admin manual (re)assign both funnel
// through the same mutation, just with a different target recruiterId.
const { mutateAsync: assignCandidateMutation, isPending: assigningCandidate } = useAssignCandidates()
async function assignToRecruiter(recruiterId: string | null) {
  if (!profile.value) return
  await assignCandidateMutation({ candidateIds: [profile.value.id], recruiterId, assignmentSource: 'manual' })
}

// Overview-tab ownership demo (E2/E5) — two always-visible boxes instead of
// one banner driven by the global "Preview as" switcher, so both the Admin
// and Recruiter perspectives are visible side by side without anyone having
// to go flip the switcher first. Independent of previewRoleStore on purpose.
const demoRecruiter = computed(() => roster.value.find(m => m.role === 'Recruiter') ?? null)
const demoRecruiterIsOwner = computed(() =>
  !!profile.value?.assignedRecruiterId && profile.value.assignedRecruiterId === demoRecruiter.value?.id,
)
const demoRecruiterReadOnly = computed(() => !!profile.value?.assignedRecruiterId && !demoRecruiterIsOwner.value)
async function claimForDemoRecruiter() {
  if (!profile.value || !demoRecruiter.value) return
  await assignCandidateMutation({ candidateIds: [profile.value.id], recruiterId: demoRecruiter.value.id, assignmentSource: 'self' })
}
// Either demo box can be dismissed independently — session-only, not persisted.
const showAdminDemoBox = ref(true)
const showRecruiterDemoBox = ref(true)

/**
 * Where closing the overlay lands. Callers outside the Candidates module pass
 * ?from= — a talent pool sends its own URL — so you return to the screen you
 * opened the profile from instead of being dropped on the candidates list.
 * Only same-origin paths are honoured; anything else falls back.
 */
const returnTo = computed(() => {
  const from = route.query.from
  const path = typeof from === 'string' ? from : ''
  return path.startsWith('/') && !path.startsWith('//') ? path : '/candidates'
})

function close() {
  router.push(returnTo.value)
}

// Prev/next-candidate rail — walks the same order the candidates table
// renders in. A large perPage keeps this a single request against the mock
// dataset rather than wiring up cross-page cursoring.
const { data: navList } = useCandidates(ref({ perPage: 200, page: 1 }))
const navIds = computed(() => navList.value?.data.map(c => c.id) ?? [])
const navIndex = computed(() => navIds.value.indexOf(id.value))
const prevId = computed(() => navIndex.value > 0 ? navIds.value[navIndex.value - 1] : null)
const nextId = computed(() => navIndex.value >= 0 && navIndex.value < navIds.value.length - 1 ? navIds.value[navIndex.value + 1] : null)

// Right-column resize handle — width persists per-browser so a recruiter's
// preferred split survives across candidates.
const SIDEBAR_WIDTH_KEY = 'candidate-profile-sidebar-width'
const SIDEBAR_MIN = 360
const SIDEBAR_MAX = 640
const sidebarWidth = ref(464)
const isResizingSidebar = ref(false)

onMounted(() => {
  const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY))
  if (stored >= SIDEBAR_MIN && stored <= SIDEBAR_MAX) sidebarWidth.value = stored
})

function startSidebarResize(e: PointerEvent) {
  e.preventDefault()
  isResizingSidebar.value = true
  const startX = e.clientX
  const startWidth = sidebarWidth.value

  function onMove(moveEvent: PointerEvent) {
    const next = startWidth + (startX - moveEvent.clientX)
    sidebarWidth.value = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, next))
  }
  function onUp() {
    isResizingSidebar.value = false
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth.value))
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function goToCandidate(targetId: string | null) {
  if (!targetId) return
  // Carry ?from= across prev/next so the return path survives browsing the rail.
  router.push({
    path: `/candidates/${targetId}`,
    query: typeof route.query.from === 'string' ? { from: route.query.from } : {},
  })
}

const TABS = ['Overview', 'Emails', 'WhatsApp', 'Events', 'Evaluation', 'Files', 'Activity'] as const
type Tab = typeof TABS[number]
const activeTab = ref<Tab>('Overview')

// AI Summary — clamp to 2 lines until "See more" is clicked.
const summaryExpanded = ref(false)
const AI_SUMMARY = 'This candidate has consistently strong evaluation scores across technical skills, system design, and culture add. Communication is clear, with solid written documentation and a track record of cross-functional collaboration. Overall a high-confidence match for the role — recommend fast-tracking through the remaining pipeline stages.'

// Profile fields — label + accessor pairs, rendered as rows with an "empty" fallback.
const PROFILE_FIELD_ROWS: { label: string, value: (p: CandidateProfile) => string | null }[] = [
  { label: 'University', value: p => p.profileFields.university },
  { label: 'Faculty', value: p => p.profileFields.faculty },
  { label: 'Years of experience', value: p => p.profileFields.yearsOfExperience === null ? null : String(p.profileFields.yearsOfExperience) },
  { label: 'Industry-relevant', value: p => p.profileFields.industryRelevant === null ? null : (p.profileFields.industryRelevant ? 'Yes' : 'No') },
  { label: 'Languages', value: p => p.profileFields.languages },
  { label: 'Gender', value: p => p.profileFields.gender },
]

// CV — File/Experience segmented toggle.
const cvTab = ref<'File' | 'Experience'>('File')

// Contact — static placeholder social links (no linkedin/github fields on the
// mock Candidate type yet; mirrors the reference mockup's placeholder data-init).
const socialLinks = ref({
  linkedin: 'linkedin.com/in/candidate',
  github: 'github.com/candidate',
})

// AI Criteria — mock candidate data only stores criterion labels, not a
// per-criterion % or description, so those are derived/placeholder here.
const criteriaOpen = ref<boolean[]>([])
watchEffect(() => {
  if (profile.value) criteriaOpen.value = profile.value.aiCriteria.map(() => false)
})

// Local editable copies — no write endpoint exists yet, so every mutation
// below (tags/tasks/jobs/talent pools/contact) is client-state only, seeded
// from the fetched profile whenever it (re)loads.
const localTags = ref<string[]>([])
const localTasks = ref<{ id: string, title: string, dueDate: string | null, done: boolean }[]>([])
const localJobs = ref<CandidateJob[]>([])
const localTalentPools = ref<string[]>([])

// Interview scheduling — "Set Interview" opens the 2-step Schedule dialog.
const scheduleOpen = ref(false)
watchEffect(() => {
  if (!profile.value) return
  localTags.value = [...profile.value.tags]
  localTasks.value = profile.value.tasks.map(t => ({ ...t }))
  localJobs.value = profile.value.jobs.map(j => ({ ...j }))
  localTalentPools.value = [...profile.value.talentPools]
})

function removeTag(t: string) {
  localTags.value = localTags.value.filter(x => x !== t)
}
function onSelectTag(name: string) {
  if (!localTags.value.includes(name)) localTags.value.push(name)
}

// Source — editable via the searchable source menu (client-only).
const source = ref('')
watchEffect(() => { if (profile.value) source.value = profile.value.source })

// Assign modal — ticks jobs + talent pools, appends them to local state.
const assignOpen = ref(false)
function onAssignConfirm(payload: { jobs: string[], pools: string[] }) {
  if (!profile.value) return
  for (const title of payload.jobs) {
    if (!localJobs.value.some(j => j.title === title)) {
      localJobs.value.push({ title, status: 'internal', location: profile.value.location, assignedDate: 'Just now' })
    }
  }
  for (const pool of payload.pools) {
    if (!localTalentPools.value.includes(pool)) localTalentPools.value.push(pool)
  }
}

function disqualifyJob(i: number, _reason: string) {
  const job = localJobs.value[i]
  if (job) job.disqualified = true
}
function proceedJob(_i: number) {
  // No further pipeline stage exists in the mock model yet — Proceed is a no-op signal for now.
}

// Requalify — guarded by a confirm dialog.
const requalifyOpen = ref(false)
const requalifyIndex = ref<number | null>(null)
function askRequalify(i: number) { requalifyIndex.value = i; requalifyOpen.value = true }
function confirmRequalify() {
  const job = requalifyIndex.value !== null ? localJobs.value[requalifyIndex.value] : null
  if (job) job.disqualified = false
  requalifyIndex.value = null
}

// Remove-from-pool — guarded by a confirm dialog.
const removePoolOpen = ref(false)
const removePoolName = ref<string | null>(null)
function askRemovePool(p: string) { removePoolName.value = p; removePoolOpen.value = true }
function confirmRemovePool() {
  if (removePoolName.value) localTalentPools.value = localTalentPools.value.filter(x => x !== removePoolName.value)
  removePoolName.value = null
}

// Delete candidate — guarded by a confirm dialog, then returns to the list.
const deleteOpen = ref(false)
function confirmDelete() { close() }

// CV resume ⋯ actions (client-only, mirror the reference's confirm modals).
const uploadResumeOpen = ref(false)
const reparseOpen = ref(false)
const deleteResumeOpen = ref(false)
function confirmUploadResume() { /* TODO: POST resume once the endpoint exists */ }
function confirmReparse() { /* TODO: POST re-parse once the endpoint exists */ }
function confirmDeleteResume() { /* TODO: DELETE resume once the endpoint exists */ }

// Overview section reordering — drag-to-reorder + "Save as default" (persisted).
const OVERVIEW_ORDER_KEY = 'candidate-overview-order'
const DEFAULT_OVERVIEW_ORDER = ['details', 'contact', 'fields', 'summary', 'screening', 'cv']
const overviewOrder = ref<string[]>([...DEFAULT_OVERVIEW_ORDER])
const reordering = ref(false)
const dragKey = ref<string | null>(null)
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(OVERVIEW_ORDER_KEY) || '[]')
    if (Array.isArray(saved) && saved.length && DEFAULT_OVERVIEW_ORDER.every(k => saved.includes(k))) {
      overviewOrder.value = saved
    }
  }
  catch {}
})
function startReorder() { activeTab.value = 'Overview'; reordering.value = true }
function cancelReorder() { reordering.value = false }
function saveReorder() {
  try { localStorage.setItem(OVERVIEW_ORDER_KEY, JSON.stringify(overviewOrder.value)) }
  catch {}
  reordering.value = false
}
function onDragStart(key: string) { if (reordering.value) dragKey.value = key }
function onDragOver(key: string) {
  if (!reordering.value || !dragKey.value || dragKey.value === key) return
  const from = overviewOrder.value.indexOf(dragKey.value)
  const to = overviewOrder.value.indexOf(key)
  if (from === -1 || to === -1) return
  const next = [...overviewOrder.value]
  next.splice(from, 1)
  next.splice(to, 0, dragKey.value)
  overviewOrder.value = next
}
function onDragEnd() { dragKey.value = null }

// Contact — static placeholder social links (no linkedin/github fields on the
// mock Candidate type yet; mirrors the reference mockup's placeholder data-init).
// Email/Phone/Links/Location all support multiple entries (the "+ Add" affordance
// in the reference design), so each is stored as an array — display shows the
// first entry, edit mode lets you add/remove any number of entries.
const PHONE_COUNTRIES = [
  { code: 'EG', flag: '🇪🇬' },
  { code: 'DE', flag: '🇩🇪' },
  { code: 'US', flag: '🇺🇸' },
  { code: 'GB', flag: '🇬🇧' },
  { code: 'AE', flag: '🇦🇪' },
] as const
type PhoneEntry = { country: string, number: string }

const editingField = ref<'email' | 'phone' | 'location' | 'links' | null>(null)
const contact = reactive({
  emails: [] as string[],
  phones: [] as PhoneEntry[],
  locations: [] as string[],
})
const emailsDraft = ref<string[]>([])
const phonesDraft = ref<PhoneEntry[]>([])
const locationsDraft = ref<string[]>([])
const linksDraft = ref<string[]>([])
watchEffect(() => {
  if (!profile.value) return
  contact.emails = [profile.value.email]
  contact.phones = [{ country: 'EG', number: profile.value.phone }]
  contact.locations = [profile.value.location]
})

function stripProtocol(url: string) {
  return url.trim().replace(/^https?:\/\//i, '')
}
function startEdit(field: 'email' | 'phone' | 'location') {
  editingField.value = field
  if (field === 'email') emailsDraft.value = [...contact.emails]
  else if (field === 'phone') phonesDraft.value = contact.phones.map(p => ({ ...p }))
  else locationsDraft.value = [...contact.locations]
}
function startEditLinks() {
  editingField.value = 'links'
  linksDraft.value = [socialLinks.value.linkedin, socialLinks.value.github].filter(Boolean)
}
function addDraftEntry(field: 'email' | 'phone' | 'location' | 'links') {
  if (field === 'email') emailsDraft.value.push('')
  else if (field === 'phone') phonesDraft.value.push({ country: 'EG', number: '' })
  else if (field === 'location') locationsDraft.value.push('')
  else linksDraft.value.push('')
}
function removeDraftEntry(field: 'email' | 'phone' | 'location' | 'links', i: number) {
  if (field === 'email') emailsDraft.value.splice(i, 1)
  else if (field === 'phone') phonesDraft.value.splice(i, 1)
  else if (field === 'location') locationsDraft.value.splice(i, 1)
  else linksDraft.value.splice(i, 1)
}
function saveEdit() {
  if (editingField.value === 'email') contact.emails = emailsDraft.value.filter(v => v.trim())
  else if (editingField.value === 'phone') contact.phones = phonesDraft.value.filter(p => p.number.trim())
  else if (editingField.value === 'location') contact.locations = locationsDraft.value.filter(v => v.trim())
  else if (editingField.value === 'links') {
    const cleaned = linksDraft.value.map(stripProtocol).filter(Boolean)
    socialLinks.value.linkedin = cleaned.find(u => u.includes('linkedin')) ?? cleaned[0] ?? ''
    socialLinks.value.github = cleaned.find(u => u.includes('github')) ?? cleaned[1] ?? ''
  }
  editingField.value = null
}
function cancelEdit() {
  editingField.value = null
}

const copiedField = ref<string | null>(null)
async function copyField(field: string, value: string) {
  await navigator.clipboard.writeText(value)
  copiedField.value = field
  setTimeout(() => { if (copiedField.value === field) copiedField.value = null }, 1600)
}

function goToTab(tab: Tab) {
  activeTab.value = tab
}

const shareCopied = ref(false)
async function copyShareLink() {
  await navigator.clipboard.writeText(window.location.href)
  shareCopied.value = true
  setTimeout(() => { shareCopied.value = false }, 1600)
}

function replyToNote(authorName: string) {
  body.value = `@${authorName} `
}

function printProfile() {
  window.print()
}

// Tasks composer — the composer emits { title, dueLabel }; local state only.
function addTask(payload: { title: string, dueLabel: string | null }) {
  localTasks.value.unshift({ id: `local-${Date.now()}`, title: payload.title, dueDate: payload.dueLabel, done: false })
}
function toggleTask(id: string, done: boolean) {
  const t = localTasks.value.find(x => x.id === id)
  if (t) t.done = done
}

// Notes — local list seeded from the profile; the composer prepends new notes,
// and each note supports an inline reply (all client-only for now).
interface LocalNoteReply { id: string, author: string, authorInitials: string, body: string, createdAt: string }
interface LocalNote { id: string, author: string, authorInitials: string, body: string, createdAt: string, replies: LocalNoteReply[] }
const localNotes = ref<LocalNote[]>([])
watchEffect(() => {
  if (!profile.value) return
  localNotes.value = profile.value.notes.map(n => ({
    id: n.id, author: n.author, authorInitials: n.authorInitials, body: n.body, createdAt: n.createdAt, replies: [],
  }))
})
function addNote(text: string) {
  if (!profile.value) return
  localNotes.value.unshift({
    id: `local-${Date.now()}`, author: profile.value.owner, authorInitials: profile.value.ownerInitials,
    body: text, createdAt: 'now', replies: [],
  })
}
const replyingId = ref<string | null>(null)
const replyText = ref('')
function startReply(id: string) { replyingId.value = id; replyText.value = '' }
function cancelReply() { replyingId.value = null; replyText.value = '' }
function sendReply(note: LocalNote) {
  if (!replyText.value.trim() || !profile.value) return
  note.replies.push({ id: `r-${Date.now()}`, author: profile.value.owner, authorInitials: profile.value.ownerInitials, body: replyText.value.trim(), createdAt: 'now' })
  cancelReply()
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45" @click.self="close">
    <div class="flex items-start gap-2 w-full lg:w-auto lg:mt-6">
    <div class="relative w-full min-h-full lg:w-[calc(100vw-118px)] lg:min-w-[900px] lg:max-w-[1500px] lg:h-[calc(100vh-24px)] lg:min-h-0">
      <div class="w-full min-h-full lg:h-full bg-[var(--brand-surface-white)] lg:rounded-t-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] flex flex-col lg:overflow-hidden">
      <ErrorBoundary>
        <!-- Loading -->
        <div v-if="isLoading" class="flex-1 flex items-center justify-center">
          <p class="text-[13px] text-[var(--brand-text-quiet)]">Loading candidate…</p>
        </div>

        <!-- Not found -->
        <BrandEmptyState
          v-else-if="!profile"
          title="Candidate not found"
          description="This candidate may have been removed."
          class="flex-1"
        >
          <BrandButton variant="primary-teal" @click="close">Back to candidates</BrandButton>
        </BrandEmptyState>

        <template v-else>
          <!-- Modal body: 2-col grid from the very top — left is the white
               candidate header/tabs panel, right is a persistent action +
               pipeline rail that starts level with the header, not the tabs. -->
          <div
            class="flex flex-col lg:flex-row lg:flex-1 lg:min-h-0"
            :style="{ '--candidate-sidebar-w': sidebarWidth + 'px' }"
          >
            <!-- LEFT column -->
            <div class="flex-1 min-w-0 flex flex-col lg:min-h-0">
              <!-- Header + tabs -->
              <div class="shrink-0 border-b border-[var(--brand-border-hairline)]">
                <div class="flex items-center justify-between gap-4 px-4 lg:px-7 pt-5 pb-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <BrandAvatarInitials :initials="profile.initials" :bg="profile.avatarColor" size="xl" />
                    <div class="flex items-center gap-2.5 flex-wrap min-w-0">
                      <h1 class="m-0 text-[18px] font-bold tracking-[-0.02em] text-[var(--brand-text)] truncate">{{ profile.name }}</h1>
                      <BrandStatusBadge v-if="profile.isNew" tone="new" label="NEW" />
                    </div>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <BrandButton
                      variant="ghost" size="md" :disabled="readOnly"
                      :title="readOnly ? 'Read-only — assigned to another recruiter' : undefined"
                      class="hidden lg:inline-flex !text-[var(--brand-text)] !text-[15px] !font-medium !px-3 !h-10 disabled:opacity-60 disabled:cursor-not-allowed"
                      @click="scheduleOpen = true"
                    >
                      <Users class="!w-[18px] !h-[18px] text-[var(--brand-text)]" stroke-width="1.6" />Set Interview
                    </BrandButton>
                    <span class="hidden lg:inline-flex"><CandidateQuickEvalPopover :candidate-name="profile.name" :disabled="readOnly" /></span>
                    <button
                      class="lg:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--brand-icon-default)] hover:bg-[var(--brand-surface-hover)]"
                      aria-label="Close"
                      @click="close"
                    >
                      <X class="w-5 h-5" stroke-width="1.8" />
                    </button>
                  </div>
                </div>
                <div class="flex lg:hidden items-center gap-1 px-4 pb-3">
                  <BrandButton
                    variant="ghost" size="md" :disabled="readOnly"
                    class="!text-[var(--brand-text)] !text-[14px] !font-medium !px-3 !h-9 disabled:opacity-60 disabled:cursor-not-allowed"
                    @click="scheduleOpen = true"
                  >
                    <Users class="!w-[16px] !h-[16px] text-[var(--brand-text)]" stroke-width="1.6" />Set Interview
                  </BrandButton>
                  <CandidateQuickEvalPopover :candidate-name="profile.name" :disabled="readOnly" />
                </div>

                <!-- Tabs -->
                <div class="flex items-center gap-6 px-4 lg:px-7 overflow-x-auto">
                  <button
                    v-for="tab in TABS"
                    :key="tab"
                    class="relative py-2.5 text-[14.5px] font-semibold whitespace-nowrap transition-colors"
                    :class="activeTab === tab ? 'text-[var(--brand-text)]' : 'text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]'"
                    @click="activeTab = tab"
                  >
                    {{ tab }}
                    <span
                      v-if="activeTab === tab"
                      class="absolute left-0 right-0 bottom-0 h-[3px] rounded-t-[3px] bg-[var(--brand-teal)]"
                    />
                  </button>
                </div>
              </div>

              <!-- Scrollable tab body -->
              <div class="lg:flex-1 lg:overflow-auto bg-[var(--brand-canvas)]">
                <div v-if="activeTab === 'Overview'" class="flex flex-col gap-4 p-6">
                <!-- Smart Distribute ownership (E2/E5) — two DEMO boxes,
                     always shown, independent of previewRoleStore, so both
                     the Admin and Recruiter perspectives are visible at once
                     without switching the "Preview as" picker first. Each
                     carries a short explanation of the state + what the
                     action button does, and can be dismissed on its own. -->
                <div class="flex flex-col gap-2">
                  <div v-if="showAdminDemoBox" class="rounded-[12px] border border-[var(--brand-border-light)] bg-[var(--brand-surface-white)] px-4 py-3 flex items-start gap-3">
                    <div class="flex-1 min-w-0 flex flex-col gap-1">
                      <span class="shrink-0 self-start text-[10px] font-bold uppercase tracking-wide text-white bg-[var(--brand-teal-secondary)] rounded-[5px] px-1.5 py-0.5">Demo — Admin</span>
                      <span class="text-[13px] font-semibold text-[var(--brand-text)]">
                        <template v-if="assignedRecruiter">This candidate is assigned to <strong>{{ assignedRecruiter.name }}</strong>.</template>
                        <template v-else>This candidate is still unassigned.</template>
                      </span>
                      <span class="text-[11.5px] text-[var(--brand-text-quiet)]">
                        <template v-if="assignedRecruiter">As Admin, you can reassign this candidate to anyone on the team at any time.</template>
                        <template v-else>As Admin, assign this candidate to a recruiter to put someone in charge of it.</template>
                      </span>
                    </div>
                    <CandidateAssignRecruiterMenu
                      class="shrink-0"
                      :team-members="roster"
                      :current="profile.assignedRecruiterId ?? null"
                      @select="assignToRecruiter"
                    />
                    <button
                      type="button"
                      class="shrink-0 w-6 h-6 rounded-md inline-flex items-center justify-center text-[var(--brand-icon-muted)] hover:bg-[var(--brand-surface-hover)] hover:text-[var(--brand-text)]"
                      aria-label="Dismiss"
                      @click="showAdminDemoBox = false"
                    ><X class="w-3.5 h-3.5" stroke-width="1.8" /></button>
                  </div>
                  <div v-if="showRecruiterDemoBox" class="rounded-[12px] border border-[var(--brand-border-light)] bg-[var(--brand-surface-white)] px-4 py-3 flex items-start gap-3">
                    <div class="flex-1 min-w-0 flex flex-col gap-1">
                      <span class="shrink-0 self-start text-[10px] font-bold uppercase tracking-wide text-white bg-[var(--brand-avatar-4)] rounded-[5px] px-1.5 py-0.5">
                        Demo — Recruiter{{ demoRecruiter ? ` (${demoRecruiter.name})` : '' }}
                      </span>
                      <template v-if="!profile.assignedRecruiterId">
                        <span class="text-[13px] font-semibold text-[var(--brand-text)]">This candidate is still unassigned.</span>
                        <span class="text-[11.5px] text-[var(--brand-text-quiet)]">Claim this candidate to take ownership and start working on it.</span>
                      </template>
                      <template v-else-if="demoRecruiterIsOwner">
                        <span class="text-[13px] font-semibold text-[var(--brand-text)]">This candidate is assigned to you.</span>
                        <span class="text-[11.5px] text-[var(--brand-text-quiet)]">You have full access — move stages, message, and more.</span>
                      </template>
                      <template v-else-if="demoRecruiterReadOnly">
                        <span class="text-[13px] font-semibold text-[var(--brand-text)]">This candidate is assigned to <strong>{{ assignedRecruiter?.name }}</strong>.</span>
                        <span class="text-[11.5px] text-[var(--brand-text-quiet)]">You can view the profile, add notes, and share it, but can't edit, move stages, or delete.</span>
                      </template>
                    </div>
                    <button
                      v-if="!profile.assignedRecruiterId"
                      type="button"
                      class="shrink-0 text-[12.5px] font-bold text-[var(--brand-teal-secondary)] hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                      :disabled="assigningCandidate"
                      @click="claimForDemoRecruiter"
                    >{{ assigningCandidate ? 'Assigning…' : 'Assign to me' }}</button>
                    <button
                      type="button"
                      class="shrink-0 w-6 h-6 rounded-md inline-flex items-center justify-center text-[var(--brand-icon-muted)] hover:bg-[var(--brand-surface-hover)] hover:text-[var(--brand-text)]"
                      aria-label="Dismiss"
                      @click="showRecruiterDemoBox = false"
                    ><X class="w-3.5 h-3.5" stroke-width="1.8" /></button>
                  </div>
                </div>

                <!-- Tags -->
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="inline-flex items-center gap-2 text-[14px] font-bold text-[var(--brand-text)] mr-1">
                    <Tag class="w-4 h-4 text-[var(--brand-text-quiet)]" stroke-width="1.7" />Tags
                  </span>
                  <span
                    v-for="t in localTags"
                    :key="t"
                    class="inline-flex items-center gap-2 h-[30px] text-[13px] font-medium text-[var(--brand-text)] bg-[var(--brand-surface-white)] border border-[var(--brand-border)] rounded-[9px] pl-3 pr-2.5"
                  >
                    {{ t }}
                    <X
                      v-if="!readOnly"
                      class="w-3.5 h-3.5 text-[var(--brand-text-quiet)] hover:text-[var(--brand-danger)] cursor-pointer"
                      stroke-width="1.7"
                      @click="removeTag(t)"
                    />
                  </span>
                  <CandidateTagMenu v-if="!readOnly" :applied="localTags" @select="onSelectTag" />
                </div>

                <!-- Reorder toolbar (Overview sections) -->
                <div v-if="reordering" class="flex items-center justify-end gap-2.5">
                  <BrandButton variant="outline" size="sm" @click="cancelReorder">Cancel</BrandButton>
                  <BrandButton variant="primary-teal" size="sm" @click="saveReorder">Save as default</BrandButton>
                </div>

                <!-- Details -->
                <div
                  :style="{ order: overviewOrder.indexOf('details') }"
                  :draggable="reordering"
                  class="relative"
                  :class="reordering ? 'ring-1 ring-[var(--brand-lime)] rounded-[15px] cursor-grab' : ''"
                  @dragstart="onDragStart('details')"
                  @dragover.prevent="onDragOver('details')"
                  @dragend="onDragEnd"
                >
                  <span v-if="reordering" class="absolute -left-2 top-4 z-10 text-[var(--brand-icon-muted)]"><GripVertical class="w-3.5 h-4" /></span>
                <CandidateCollapsibleCard title="Details">
                  <div class="flex items-center gap-4 text-[14px] py-1">
                    <span class="w-[96px] shrink-0 text-[var(--brand-text-quiet)]">Date created</span>
                    <span class="inline-flex items-center gap-2 text-[var(--brand-text-secondary)]">{{ profile.createdDate }}</span>
                  </div>
                  <div class="flex items-center gap-4 text-[14px] py-1">
                    <span class="w-[96px] shrink-0 text-[var(--brand-text-quiet)]">Source</span>
                    <span class="flex-1 min-w-0 flex items-center gap-2">
                      <span class="inline-flex items-center h-[24px] text-[12.5px] font-semibold text-[var(--brand-pipeline-purple)] bg-[var(--brand-surface-badge)] rounded-[7px] px-2.5">{{ source }}</span>
                      <CandidateSourceMenu @select="v => source = v" />
                    </span>
                  </div>
                  <div v-if="profile.lastActivityDetail" class="flex items-center gap-4 text-[14px] py-1">
                    <span class="w-[96px] shrink-0 text-[var(--brand-text-quiet)]">Last activity</span>
                    <span class="flex-1 min-w-0 flex items-center gap-2">
                      <BrandAvatarInitials :initials="profile.lastActivityDetail.actorInitials" size="sm" />
                      <span class="text-[var(--brand-text-secondary)] truncate">
                        <span class="font-semibold text-[var(--brand-text)]">{{ profile.lastActivityDetail.actor }}</span>
                        {{ profile.lastActivityDetail.action }}
                      </span>
                    </span>
                  </div>
                </CandidateCollapsibleCard>

                </div>
                <!-- Contact -->
                <div
                  :style="{ order: overviewOrder.indexOf('contact') }"
                  :draggable="reordering"
                  class="relative"
                  :class="reordering ? 'ring-1 ring-[var(--brand-lime)] rounded-[15px] cursor-grab' : ''"
                  @dragstart="onDragStart('contact')"
                  @dragover.prevent="onDragOver('contact')"
                  @dragend="onDragEnd"
                >
                  <span v-if="reordering" class="absolute -left-2 top-4 z-10 text-[var(--brand-icon-muted)]"><GripVertical class="w-3.5 h-4" /></span>
                <CandidateCollapsibleCard title="Contact">
                  <template #actions>
                    <span class="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--brand-teal-secondary)] cursor-pointer hover:underline" @click="goToTab('WhatsApp')">
                      <MessageCircle class="w-4 h-4" stroke-width="1.7" />Send message
                    </span>
                  </template>

                  <div class="py-1.5">
                    <div v-if="editingField !== 'email'" class="flex items-center gap-3 text-[14px]">
                      <span class="w-[60px] shrink-0 text-[var(--brand-text-quiet)]">Email</span>
                      <a href="#" class="flex-1 min-w-0 truncate text-[var(--brand-teal-secondary)] hover:underline" @click.prevent="copyField('email', contact.emails[0] ?? '')">{{ contact.emails[0] }}</a>
                      <span v-if="copiedField === 'email'" class="text-[12px] font-medium text-[var(--brand-success)] whitespace-nowrap">Copied!</span>
                      <button class="w-[26px] h-[26px] inline-flex items-center justify-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-teal)]" title="Copy" @click="copyField('email', contact.emails[0] ?? '')">
                        <Copy class="w-3.5 h-3.5" stroke-width="1.7" />
                      </button>
                      <button class="w-[26px] h-[26px] inline-flex items-center justify-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-teal)]" title="Edit" @click="startEdit('email')">
                        <Pencil class="w-3.5 h-3.5" stroke-width="1.7" />
                      </button>
                    </div>
                    <div v-else>
                      <span class="block text-[14px] text-[var(--brand-text-quiet)] mb-2">Email</span>
                      <div class="flex flex-col gap-2">
                        <div v-for="(v, i) in emailsDraft" :key="i" class="flex items-center gap-2">
                          <input
                            v-model="emailsDraft[i]"
                            type="text"
                            :autofocus="i === 0"
                            class="flex-1 min-w-0 box-border border border-[var(--brand-border)] rounded-[10px] px-3 py-2 text-[14px] text-[var(--brand-text)] outline-none focus:border-[var(--brand-lime)]"
                            @keydown.esc="cancelEdit"
                          >
                          <button class="w-7 h-7 inline-flex items-center justify-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-danger)]" title="Remove" @click="removeDraftEntry('email', i)">
                            <X class="w-4 h-4" stroke-width="1.8" />
                          </button>
                        </div>
                        <button type="button" class="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--brand-text)] w-fit cursor-pointer" @click="addDraftEntry('email')">
                          <Plus class="w-4 h-4" stroke-width="2" />Add
                        </button>
                      </div>
                      <div class="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-[var(--brand-border-hairline)]">
                        <BrandButton variant="primary-teal" size="md" @click="saveEdit">Save</BrandButton>
                        <BrandButton variant="outline" size="md" @click="cancelEdit">Cancel</BrandButton>
                      </div>
                    </div>
                  </div>

                  <div class="py-1.5">
                    <div v-if="editingField !== 'phone'" class="flex items-center gap-3 text-[14px]">
                      <span class="w-[60px] shrink-0 text-[var(--brand-text-quiet)]">Phone</span>
                      <span class="flex-1 min-w-0 truncate text-[var(--brand-text-secondary)]">{{ contact.phones[0]?.number }}</span>
                      <span v-if="copiedField === 'phone'" class="text-[12px] font-medium text-[var(--brand-success)] whitespace-nowrap">Copied!</span>
                      <button class="w-[26px] h-[26px] inline-flex items-center justify-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-teal)]" title="Copy" @click="copyField('phone', contact.phones[0]?.number ?? '')">
                        <Copy class="w-3.5 h-3.5" stroke-width="1.7" />
                      </button>
                      <button class="w-[26px] h-[26px] inline-flex items-center justify-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-teal)]" title="Edit" @click="startEdit('phone')">
                        <Pencil class="w-3.5 h-3.5" stroke-width="1.7" />
                      </button>
                    </div>
                    <div v-else>
                      <span class="block text-[14px] text-[var(--brand-text-quiet)] mb-2">Phone</span>
                      <div class="flex flex-col gap-2">
                        <div v-for="(p, i) in phonesDraft" :key="i" class="flex items-center gap-2">
                          <select
                            v-model="p.country"
                            class="shrink-0 box-border border border-[var(--brand-border)] rounded-[10px] px-2 py-2 text-[14px] text-[var(--brand-text)] outline-none focus:border-[var(--brand-lime)]"
                          >
                            <option v-for="c in PHONE_COUNTRIES" :key="c.code" :value="c.code">{{ c.flag }} {{ c.code }}</option>
                          </select>
                          <input
                            v-model="p.number"
                            type="text"
                            :autofocus="i === 0"
                            class="flex-1 min-w-0 box-border border border-[var(--brand-border)] rounded-[10px] px-3 py-2 text-[14px] text-[var(--brand-text)] outline-none focus:border-[var(--brand-lime)]"
                            @keydown.esc="cancelEdit"
                          >
                          <button class="w-7 h-7 inline-flex items-center justify-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-danger)]" title="Remove" @click="removeDraftEntry('phone', i)">
                            <X class="w-4 h-4" stroke-width="1.8" />
                          </button>
                        </div>
                        <button type="button" class="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--brand-text)] w-fit cursor-pointer" @click="addDraftEntry('phone')">
                          <Plus class="w-4 h-4" stroke-width="2" />Add
                        </button>
                      </div>
                      <div class="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-[var(--brand-border-hairline)]">
                        <BrandButton variant="primary-teal" size="md" @click="saveEdit">Save</BrandButton>
                        <BrandButton variant="outline" size="md" @click="cancelEdit">Cancel</BrandButton>
                      </div>
                    </div>
                  </div>

                  <div class="py-1.5">
                    <div v-if="editingField !== 'links'" class="flex items-center gap-3 text-[14px]">
                      <span class="w-[60px] shrink-0 text-[var(--brand-text-quiet)]">Links</span>
                      <span class="flex-1 min-w-0 flex items-center gap-3">
                        <a :href="`https://${socialLinks.linkedin}`" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--brand-text)] hover:underline">
                          <span class="w-6 h-6 rounded-md bg-[var(--brand-linkedin)] inline-flex items-center justify-center text-white">
                            <Linkedin class="w-3.5 h-3.5" stroke-width="2" fill="currentColor" />
                          </span>LinkedIn
                        </a>
                        <a :href="`https://${socialLinks.github}`" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--brand-text)] hover:underline">
                          <span class="w-6 h-6 rounded-md bg-[var(--brand-text)] inline-flex items-center justify-center text-white">
                            <Github class="w-3.5 h-3.5" stroke-width="2" />
                          </span>GitHub
                        </a>
                      </span>
                      <button class="w-[26px] h-[26px] inline-flex items-center justify-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-teal)]" title="Edit" @click="startEditLinks">
                        <Pencil class="w-3.5 h-3.5" stroke-width="1.7" />
                      </button>
                    </div>
                    <div v-else>
                      <span class="block text-[14px] text-[var(--brand-text-quiet)] mb-2">Links</span>
                      <div class="flex flex-col gap-2">
                        <div v-for="(v, i) in linksDraft" :key="i" class="flex items-center gap-2">
                          <input
                            v-model="linksDraft[i]"
                            type="text"
                            placeholder="linkedin.com/in/..."
                            :autofocus="i === 0"
                            class="flex-1 min-w-0 box-border border border-[var(--brand-border)] rounded-[10px] px-3 py-2 text-[14px] text-[var(--brand-text)] outline-none focus:border-[var(--brand-lime)]"
                            @keydown.esc="cancelEdit"
                          >
                          <button class="w-7 h-7 inline-flex items-center justify-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-danger)]" title="Remove" @click="removeDraftEntry('links', i)">
                            <X class="w-4 h-4" stroke-width="1.8" />
                          </button>
                        </div>
                        <button type="button" class="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--brand-text)] w-fit cursor-pointer" @click="addDraftEntry('links')">
                          <Plus class="w-4 h-4" stroke-width="2" />Add
                        </button>
                      </div>
                      <div class="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-[var(--brand-border-hairline)]">
                        <BrandButton variant="primary-teal" size="md" @click="saveEdit">Save</BrandButton>
                        <BrandButton variant="outline" size="md" @click="cancelEdit">Cancel</BrandButton>
                      </div>
                    </div>
                  </div>

                  <div class="py-1.5">
                    <div v-if="editingField !== 'location'" class="flex items-center gap-3 text-[14px]">
                      <span class="w-[60px] shrink-0 text-[var(--brand-text-quiet)]">Location</span>
                      <span class="flex-1 min-w-0 truncate text-[var(--brand-text-secondary)]">{{ contact.locations[0] }}</span>
                      <button class="w-[26px] h-[26px] inline-flex items-center justify-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-teal)]" title="Edit" @click="startEdit('location')">
                        <Pencil class="w-3.5 h-3.5" stroke-width="1.7" />
                      </button>
                    </div>
                    <div v-else>
                      <span class="block text-[14px] text-[var(--brand-text-quiet)] mb-2">Location</span>
                      <div class="flex flex-col gap-2">
                        <div v-for="(v, i) in locationsDraft" :key="i" class="flex items-center gap-2">
                          <input
                            v-model="locationsDraft[i]"
                            type="text"
                            :autofocus="i === 0"
                            class="flex-1 min-w-0 box-border border border-[var(--brand-border)] rounded-[10px] px-3 py-2 text-[14px] text-[var(--brand-text)] outline-none focus:border-[var(--brand-lime)]"
                            @keydown.esc="cancelEdit"
                          >
                          <button class="w-7 h-7 inline-flex items-center justify-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-danger)]" title="Remove" @click="removeDraftEntry('location', i)">
                            <X class="w-4 h-4" stroke-width="1.8" />
                          </button>
                        </div>
                        <button type="button" class="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--brand-text)] w-fit cursor-pointer" @click="addDraftEntry('location')">
                          <Plus class="w-4 h-4" stroke-width="2" />Add
                        </button>
                      </div>
                      <div class="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-[var(--brand-border-hairline)]">
                        <BrandButton variant="primary-teal" size="md" @click="saveEdit">Save</BrandButton>
                        <BrandButton variant="outline" size="md" @click="cancelEdit">Cancel</BrandButton>
                      </div>
                    </div>
                  </div>
                </CandidateCollapsibleCard>

                </div>
                <!-- Profile fields -->
                <div
                  :style="{ order: overviewOrder.indexOf('fields') }"
                  :draggable="reordering"
                  class="relative"
                  :class="reordering ? 'ring-1 ring-[var(--brand-lime)] rounded-[15px] cursor-grab' : ''"
                  @dragstart="onDragStart('fields')"
                  @dragover.prevent="onDragOver('fields')"
                  @dragend="onDragEnd"
                >
                  <span v-if="reordering" class="absolute -left-2 top-4 z-10 text-[var(--brand-icon-muted)]"><GripVertical class="w-3.5 h-4" /></span>
                <CandidateCollapsibleCard title="Profile fields">
                  <div v-for="f in PROFILE_FIELD_ROWS" :key="f.label" class="flex items-center gap-4 text-[14px] py-1">
                    <span class="w-[144px] shrink-0 text-[var(--brand-text-quiet)]">{{ f.label }}</span>
                    <span
                      class="flex-1 min-w-0 truncate"
                      :class="f.value(profile) === null ? 'text-[var(--brand-text-faint)] italic' : 'text-[var(--brand-text-secondary)]'"
                    >{{ f.value(profile) === null ? 'empty' : f.value(profile) }}</span>
                  </div>
                </CandidateCollapsibleCard>

                </div>
                <!-- AI Summary -->
                <div
                  :style="{ order: overviewOrder.indexOf('summary') }"
                  :draggable="reordering"
                  class="relative"
                  :class="reordering ? 'ring-1 ring-[var(--brand-lime)] rounded-[15px] cursor-grab' : ''"
                  @dragstart="onDragStart('summary')"
                  @dragover.prevent="onDragOver('summary')"
                  @dragend="onDragEnd"
                >
                  <span v-if="reordering" class="absolute -left-2 top-4 z-10 text-[var(--brand-icon-muted)]"><GripVertical class="w-3.5 h-4" /></span>
                <CandidateCollapsibleCard title="AI Summary">
                  <template #icon>
                    <svg width="18" height="21" viewBox="0 0 23.272 28" fill="var(--brand-ai-accent)">
                      <g transform="translate(-4.364 -2)">
                        <path d="M13.294,7.436l.8,2.23a8.835,8.835,0,0,0,5.316,5.316l2.23.8a.229.229,0,0,1,0,.43l-2.23.8A8.835,8.835,0,0,0,14.1,22.334l-.8,2.23a.229.229,0,0,1-.43,0l-.8-2.23a8.835,8.835,0,0,0-5.316-5.316l-2.23-.8a.229.229,0,0,1,0-.43l2.23-.8a8.835,8.835,0,0,0,5.316-5.316l.8-2.23a.228.228,0,0,1,.43,0Z" />
                        <path d="M23.332,2.077l.407,1.129A4.477,4.477,0,0,0,26.431,5.9L27.56,6.3a.116.116,0,0,1,0,.218l-1.129.407a4.477,4.477,0,0,0-2.692,2.692l-.407,1.129a.116.116,0,0,1-.218,0l-.407-1.129A4.477,4.477,0,0,0,20.015,6.93l-1.129-.407a.116.116,0,0,1,0-.218L20.015,5.9a4.477,4.477,0,0,0,2.692-2.692l.407-1.129A.116.116,0,0,1,23.332,2.077Z" />
                        <path d="M23.332,21.25l.407,1.129a4.477,4.477,0,0,0,2.692,2.692l1.129.407a.116.116,0,0,1,0,.218l-1.129.407a4.477,4.477,0,0,0-2.692,2.692l-.407,1.129a.116.116,0,0,1-.218,0l-.407-1.129A4.477,4.477,0,0,0,20.015,26.1L18.886,25.7a.116.116,0,0,1,0-.218l1.129-.407a4.477,4.477,0,0,0,2.692-2.692l.407-1.129A.116.116,0,0,1,23.332,21.25Z" />
                      </g>
                    </svg>
                  </template>
                  <p
                    class="m-0 text-[14px] leading-[1.6] text-[var(--brand-text-secondary)]"
                    :class="!summaryExpanded && 'line-clamp-2'"
                  >{{ AI_SUMMARY }}</p>
                  <span
                    class="inline-block mt-2 text-[13.5px] font-semibold text-[var(--brand-teal-secondary)] cursor-pointer hover:underline"
                    @click="summaryExpanded = !summaryExpanded"
                  >{{ summaryExpanded ? 'See less' : 'See more' }}</span>
                </CandidateCollapsibleCard>

                </div>
                <!-- Screening questions -->
                <div
                  :style="{ order: overviewOrder.indexOf('screening') }"
                  :draggable="reordering"
                  class="relative"
                  :class="reordering ? 'ring-1 ring-[var(--brand-lime)] rounded-[15px] cursor-grab' : ''"
                  @dragstart="onDragStart('screening')"
                  @dragover.prevent="onDragOver('screening')"
                  @dragend="onDragEnd"
                >
                  <span v-if="reordering" class="absolute -left-2 top-4 z-10 text-[var(--brand-icon-muted)]"><GripVertical class="w-3.5 h-4" /></span>
                <CandidateCollapsibleCard title="Screening questions">
                  <template #actions>
                    <span v-if="profile.screenedAt" class="text-[12.5px] text-[var(--brand-text-quiet)]">Screened {{ profile.screenedAt }}</span>
                  </template>
                  <div v-if="profile.screeningQuestions.length" class="flex flex-col gap-4">
                    <div v-for="q in profile.screeningQuestions" :key="q.id" class="py-1">
                      <p class="m-0 text-[14px] font-semibold text-[var(--brand-text)]">{{ q.question }}</p>
                      <p class="m-0 mt-1 text-[14px] leading-[1.6] text-[var(--brand-text-secondary)]">{{ q.answer }}</p>
                    </div>
                  </div>
                  <BrandEmptyState v-else title="No screening questions" description="This candidate hasn't been screened yet." />
                </CandidateCollapsibleCard>

                </div>
                <!-- CV -->
                <div
                  :style="{ order: overviewOrder.indexOf('cv') }"
                  :draggable="reordering"
                  class="relative"
                  :class="reordering ? 'ring-1 ring-[var(--brand-lime)] rounded-[15px] cursor-grab' : ''"
                  @dragstart="onDragStart('cv')"
                  @dragover.prevent="onDragOver('cv')"
                  @dragend="onDragEnd"
                >
                  <span v-if="reordering" class="absolute -left-2 top-4 z-10 text-[var(--brand-icon-muted)]"><GripVertical class="w-3.5 h-4" /></span>
                <CandidateCollapsibleCard title="CV">
                  <template v-if="profile.cv" #title-controls>
                    <div class="inline-flex items-center gap-0.5 rounded-[9px] bg-[var(--brand-surface-hover)] p-0.5 ml-1">
                      <button
                        v-for="t in (['File', 'Experience'] as const)"
                        :key="t"
                        type="button"
                        class="h-[26px] px-3 rounded-[7px] text-[12.5px] font-semibold cursor-pointer"
                        :class="cvTab === t ? 'bg-[var(--brand-surface-white)] text-[var(--brand-text)] shadow-sm border border-[var(--brand-border)]' : 'text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]'"
                        @click="cvTab = t"
                      >{{ t }}</button>
                    </div>
                  </template>
                  <template #actions>
                    <template v-if="profile.cv">
                      <button class="w-[26px] h-[26px] inline-flex items-center justify-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-teal)]" title="Open in new tab">
                        <ExternalLink class="w-3.5 h-3.5" stroke-width="1.7" />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <button class="w-[26px] h-[26px] inline-flex items-center justify-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-teal)]" title="More options">
                            <MoreVertical class="w-3.5 h-3.5" stroke-width="1.7" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" class="min-w-[210px] p-1.5 rounded-[12px]">
                          <DropdownMenuItem class="flex items-center gap-2.5 text-[13.5px]" @click="uploadResumeOpen = true">
                            <Upload class="w-4 h-4 text-[var(--brand-text-secondary)]" stroke-width="1.8" />Upload new resume
                          </DropdownMenuItem>
                          <DropdownMenuItem class="flex items-center gap-2.5 text-[13.5px]" @click="reparseOpen = true">
                            <RefreshCw class="w-4 h-4 text-[var(--brand-text-secondary)]" stroke-width="1.8" />Re-parse resume
                          </DropdownMenuItem>
                          <DropdownMenuItem class="flex items-center gap-2.5 text-[13.5px] !text-[var(--brand-danger)]" @click="deleteResumeOpen = true">
                            <Trash2 class="w-4 h-4" stroke-width="1.8" />Delete resume
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </template>
                  </template>

                  <template v-if="profile.cv">
                    <!-- File preview -->
                    <div v-if="cvTab === 'File'" class="rounded-[12px] border border-[var(--brand-border-hairline)] bg-[var(--brand-surface-hover)] p-6">
                      <h3 class="m-0 text-[18px] font-bold text-[var(--brand-text)]">{{ profile.cv.candidateName }}</h3>
                      <p class="m-0 mt-0.5 text-[14px] text-[var(--brand-text-secondary)]">{{ profile.cv.title }} · {{ profile.location }}</p>
                      <p class="m-0 mt-1 text-[13px] text-[var(--brand-text-quiet)]">{{ profile.cv.contactLine }}</p>

                      <h4 class="m-0 mt-5 text-[12px] font-bold uppercase tracking-[0.04em] text-[var(--brand-text-quiet)]">Summary</h4>
                      <p class="m-0 mt-2 text-[14px] leading-[1.6] text-[var(--brand-text-secondary)]">{{ profile.cv.summary }}</p>

                      <h4 class="m-0 mt-5 text-[12px] font-bold uppercase tracking-[0.04em] text-[var(--brand-text-quiet)]">Experience</h4>
                      <div class="flex flex-col gap-3 mt-2">
                        <div v-for="e in profile.cv.experience" :key="e.role + e.company">
                          <div class="flex items-baseline justify-between gap-3">
                            <span class="text-[14px] font-semibold text-[var(--brand-text)]">{{ e.role }} · {{ e.company }}</span>
                            <span class="shrink-0 text-[12.5px] text-[var(--brand-text-quiet)]">{{ e.period }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Experience timeline -->
                    <div v-else class="flex flex-col gap-6">
                      <div>
                        <h4 class="m-0 mb-3 text-[15px] font-bold text-[var(--brand-text)]">Work experience</h4>
                        <div class="flex flex-col">
                          <div v-for="(e, i) in profile.cv.experience" :key="e.role + e.company" class="relative pl-5 pb-4 last:pb-0">
                            <span
                              class="absolute left-0 top-1.5 w-2 h-2 rounded-full"
                              :class="i === 0 ? 'bg-[var(--brand-text)]' : 'bg-[var(--brand-border-mid)]'"
                            />
                            <span v-if="i < profile.cv.experience.length - 1" class="absolute left-[3px] top-4 bottom-0 w-px bg-[var(--brand-border)]" />
                            <span class="block text-[14px] font-bold text-[var(--brand-text)]">{{ e.role }} · {{ e.company }}</span>
                            <span class="block mt-0.5 text-[12.5px] text-[var(--brand-text-quiet)]">{{ e.period }} · {{ e.location }}</span>
                            <p class="m-0 mt-1.5 text-[13.5px] leading-[1.6] text-[var(--brand-text-secondary)]">{{ e.description }}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 class="m-0 mb-2.5 text-[15px] font-bold text-[var(--brand-text)]">Skills</h4>
                        <div class="flex items-center gap-2 flex-wrap">
                          <span
                            v-for="s in profile.cv.skills"
                            :key="s"
                            class="inline-flex items-center h-[26px] text-[12.5px] font-semibold text-[var(--brand-olive)] bg-[var(--brand-lime-tint)] border border-[var(--brand-lime)]/50 rounded-[7px] px-2.5"
                          >{{ s }}</span>
                        </div>
                      </div>

                      <div>
                        <h4 class="m-0 mb-2.5 text-[15px] font-bold text-[var(--brand-text)]">Education</h4>
                        <div v-for="ed in profile.cv.education" :key="ed.degree" class="flex items-start gap-3 rounded-[12px] border border-[var(--brand-border-hairline)] p-3.5">
                          <span class="w-8 h-8 rounded-md bg-[var(--brand-surface-hover)] inline-flex items-center justify-center shrink-0">
                            <GraduationCap class="w-4 h-4 text-[var(--brand-icon-default)]" stroke-width="1.7" />
                          </span>
                          <span class="min-w-0">
                            <span class="block text-[14px] font-bold text-[var(--brand-text)]">{{ ed.degree }}</span>
                            <span class="block mt-0.5 text-[13px] text-[var(--brand-text-quiet)]">{{ ed.school }} · {{ ed.period }}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </template>
                  <BrandEmptyState v-else title="No CV on file" description="This candidate hasn't uploaded a resume yet." />
                </CandidateCollapsibleCard>
                </div>
              </div>

                <CandidateEmailsTab v-else-if="activeTab === 'Emails' && profile" :profile="profile" />
                <CandidateWhatsAppTab v-else-if="activeTab === 'WhatsApp' && profile" :profile="profile" />
                <CandidateEventsTab v-else-if="activeTab === 'Events' && profile" :profile="profile" @schedule="scheduleOpen = true" />
                <CandidateEvaluationTab v-else-if="activeTab === 'Evaluation' && profile" :profile="profile" />
                <CandidateFilesTab v-else-if="activeTab === 'Files' && profile" :profile="profile" />
                <CandidateActivityTab v-else-if="activeTab === 'Activity' && profile" :profile="profile" />
              </div>
            </div>

            <!-- Drag handle: resizes the RIGHT rail, matches
                 rt-candidate-profile-sidebar-drag-handle in the reference app -->
            <div
              class="hidden lg:flex shrink-0 w-3 items-center justify-center cursor-col-resize select-none touch-none border-x border-[var(--brand-border-hairline)] bg-[var(--brand-surface-white)] hover:bg-[var(--brand-lime-tint)] active:bg-[var(--brand-lime-tint)] transition-colors"
              :class="{ '!bg-[var(--brand-lime-tint)]': isResizingSidebar }"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize panel"
              @pointerdown="startSidebarResize"
            >
              <GripVertical class="w-[14px] h-[14px] text-[var(--brand-icon-muted)]" stroke-width="1.8" />
            </div>

            <!-- RIGHT column: persistent action + pipeline rail, starts flush
                 with the left header (not the tabs), independent of activeTab -->
            <aside
              class="flex flex-col lg:min-h-0 bg-[var(--brand-canvas)] lg:w-[var(--candidate-sidebar-w)] lg:shrink-0"
            >
              <!-- Actions row — sits above the job pipeline card -->
              <div class="shrink-0 flex items-center justify-between gap-2 px-6 pt-5 pb-4">
                <BrandButton
                  variant="ghost" size="md" :disabled="readOnly"
                  :title="readOnly ? 'Read-only — assigned to another recruiter' : undefined"
                  class="!text-[var(--brand-text)] !text-[15px] !font-medium !px-3 !h-10 disabled:opacity-60 disabled:cursor-not-allowed"
                  @click="assignOpen = true"
                >
                  <Plus class="!w-[18px] !h-[18px] text-[var(--brand-text)]" stroke-width="1.8" />Assign
                </BrandButton>
                <div class="flex items-center gap-1">
                  <CandidateShareMenu
                    :candidate-name="profile.name"
                    :candidate-initials="profile.initials"
                    :candidate-color="profile.avatarColor"
                    :owner="profile.owner"
                    :owner-initials="profile.ownerInitials"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <button class="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--brand-text-secondary)] hover:bg-[var(--brand-surface-hover)]" title="More options">
                        <MoreVertical class="w-[18px] h-[18px]" stroke-width="1.8" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="min-w-[200px] p-1.5 rounded-[12px]">
                      <DropdownMenuItem class="flex items-center gap-2 text-[13.5px]" @click="startReorder">
                        <ListOrdered class="w-3.5 h-3.5" stroke-width="1.8" />Reorder sections
                      </DropdownMenuItem>
                      <DropdownMenuItem class="flex items-center gap-2 text-[13.5px]" @click="copyShareLink">
                        <Link2 class="w-3.5 h-3.5" stroke-width="1.8" />{{ shareCopied ? 'Copied!' : 'Copy profile link' }}
                      </DropdownMenuItem>
                      <DropdownMenuItem class="flex items-center gap-2 text-[13.5px]" @click="printProfile">
                        <Printer class="w-3.5 h-3.5" stroke-width="1.8" />Print profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        class="flex items-center gap-2 text-[13.5px] !text-[var(--brand-danger)]"
                        :disabled="readOnly"
                        :title="readOnly ? 'Read-only — assigned to another recruiter' : undefined"
                        @click="deleteOpen = true"
                      >
                        <Trash2 class="w-3.5 h-3.5" stroke-width="1.8" />Delete candidate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div class="lg:flex-1 lg:overflow-auto px-6 pb-6 flex flex-col gap-4">
                <!-- Job pipeline cards -->
                <div v-if="localJobs.length" class="shrink-0 rounded-[14px] border border-[var(--brand-border-light)] bg-[var(--brand-surface-white)] overflow-hidden">
                  <CandidateJobPipelineCard
                    v-for="(j, i) in localJobs"
                    :key="j.title"
                    :job="j"
                    :location="j.location || profile.location"
                    :assigned-date="j.assignedDate || profile.createdDate"
                    :read-only="readOnly"
                    @disqualify="reason => disqualifyJob(i, reason)"
                    @requalify="askRequalify(i)"
                    @proceed="proceedJob(i)"
                  />
                </div>

                <!-- AI Criteria -->
                <CandidateCollapsibleCard v-if="profile.aiCriteria.length" title="AI Criteria">
                  <template #icon>
                    <svg width="18" height="21" viewBox="0 0 23.272 28" fill="var(--brand-ai-accent)">
                      <g transform="translate(-4.364 -2)">
                        <path d="M13.294,7.436l.8,2.23a8.835,8.835,0,0,0,5.316,5.316l2.23.8a.229.229,0,0,1,0,.43l-2.23.8A8.835,8.835,0,0,0,14.1,22.334l-.8,2.23a.229.229,0,0,1-.43,0l-.8-2.23a8.835,8.835,0,0,0-5.316-5.316l-2.23-.8a.229.229,0,0,1,0-.43l2.23-.8a8.835,8.835,0,0,0,5.316-5.316l.8-2.23a.228.228,0,0,1,.43,0Z" />
                        <path d="M23.332,2.077l.407,1.129A4.477,4.477,0,0,0,26.431,5.9L27.56,6.3a.116.116,0,0,1,0,.218l-1.129.407a4.477,4.477,0,0,0-2.692,2.692l-.407,1.129a.116.116,0,0,1-.218,0l-.407-1.129A4.477,4.477,0,0,0,20.015,6.93l-1.129-.407a.116.116,0,0,1,0-.218L20.015,5.9a4.477,4.477,0,0,0,2.692-2.692l.407-1.129A.116.116,0,0,1,23.332,2.077Z" />
                        <path d="M23.332,21.25l.407,1.129a4.477,4.477,0,0,0,2.692,2.692l1.129.407a.116.116,0,0,1,0,.218l-1.129.407a4.477,4.477,0,0,0-2.692,2.692l-.407,1.129a.116.116,0,0,1-.218,0l-.407-1.129A4.477,4.477,0,0,0,20.015,26.1L18.886,25.7a.116.116,0,0,1,0-.218l1.129-.407a4.477,4.477,0,0,0,2.692-2.692l.407-1.129A.116.116,0,0,1,23.332,21.25Z" />
                      </g>
                    </svg>
                  </template>
                  <template #actions>
                    <span
                      v-if="profile.score"
                      class="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--brand-olive)] bg-[var(--brand-lime-active-bg)] border border-[var(--brand-lime)]/60 rounded-md px-2.5 py-[3px] whitespace-nowrap"
                    >AI score {{ profile.score }}</span>
                  </template>

                  <div v-for="(c, i) in profile.aiCriteria" :key="c.label" class="border-t border-[var(--brand-border-hairline)] first:border-t-0">
                    <button
                      type="button"
                      class="w-full flex items-center gap-2.5 py-2.5 cursor-pointer text-left"
                      @click="criteriaOpen[i] = !criteriaOpen[i]"
                    >
                      <span class="text-[13.5px] font-medium text-[var(--brand-text)]">{{ c.label }}</span>
                      <ChevronDown
                        class="w-[15px] h-[15px] text-[var(--brand-text-quiet)] shrink-0 transition-transform duration-150"
                        :class="{ 'rotate-180': criteriaOpen[i] }"
                        stroke-width="2"
                      />
                      <span class="ml-auto text-[14px] font-semibold text-[var(--brand-olive)] tabular-nums whitespace-nowrap">{{ c.weight }}%</span>
                    </button>
                    <div v-show="criteriaOpen[i]" class="pb-3.5 text-[13px] leading-[1.6] text-[var(--brand-text-secondary)]">
                      AI-derived assessment of this criterion based on the candidate's resume, screening answers, and evaluation history.
                    </div>
                  </div>
                </CandidateCollapsibleCard>

                <!-- Talent pools -->
                <CandidateCollapsibleCard title="Talent pools">
                  <div v-if="localTalentPools.length" class="flex flex-col">
                    <div v-for="p in localTalentPools" :key="p" class="flex items-center gap-3 py-2.5">
                      <FolderCheck class="w-[19px] h-[19px] text-[var(--brand-text-quiet)] shrink-0" stroke-width="1.6" />
                      <span class="flex-1 text-[14px] font-medium text-[var(--brand-text)]">{{ p }}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <button class="w-[30px] h-[30px] inline-flex items-center justify-center rounded-lg text-[var(--brand-text-quiet)] hover:bg-[var(--brand-surface-hover)]" title="More options">
                            <MoreVertical class="w-4 h-4" stroke-width="1.7" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" class="min-w-[180px] p-1.5 rounded-[12px]">
                          <DropdownMenuItem class="text-[13.5px] !text-[var(--brand-danger)]" @click="askRemovePool(p)">
                            Remove from pool
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p v-else class="text-[13px] text-[var(--brand-text-quiet)] m-0 py-1">Not in any talent pool.</p>
                </CandidateCollapsibleCard>

                <!-- Tasks -->
                <CandidateCollapsibleCard title="Tasks">
                  <CandidateTaskComposer v-if="!readOnly" :owner-initials="profile.ownerInitials" @add="addTask" />
                  <div v-if="localTasks.length" class="flex flex-col gap-1">
                    <label
                      v-for="t in localTasks"
                      :key="t.id"
                      class="flex items-center gap-3 py-2 px-1.5 rounded-lg cursor-pointer hover:bg-[var(--brand-surface-hover)]"
                    >
                      <BrandLimeCheckbox :model-value="t.done" @update:model-value="toggleTask(t.id, $event)" />
                      <span class="flex-1 text-[14px] text-[var(--brand-text)]" :class="t.done && 'line-through text-[var(--brand-text-quiet)]'">{{ t.title }}</span>
                      <BrandAvatarInitials :initials="profile.ownerInitials" size="xs" />
                      <span v-if="t.dueDate" class="text-[12px] text-[var(--brand-text-quiet)]">{{ t.dueDate }}</span>
                    </label>
                  </div>
                  <p v-else class="text-[13px] text-[var(--brand-text-quiet)] m-0 py-1">No tasks yet.</p>
                </CandidateCollapsibleCard>

                <!-- Notes -->
                <CandidateCollapsibleCard title="Notes">
                  <CandidateNotesComposer @save="addNote" />

                  <div v-if="localNotes.length" class="flex flex-col gap-4">
                    <div v-for="n in localNotes" :key="n.id" class="flex gap-3">
                      <BrandAvatarInitials :initials="n.authorInitials" size="sm" />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2">
                          <span class="font-semibold text-[14px] text-[var(--brand-text)]">{{ n.author }}</span>
                          <span class="text-[12px] text-[var(--brand-text-quiet)]">{{ n.createdAt }}</span>
                        </div>
                        <p class="m-0 mt-1 text-[14px] text-[var(--brand-text-secondary)] whitespace-pre-wrap">{{ n.body }}</p>
                        <span class="inline-block mt-2 text-[13px] font-semibold text-[var(--brand-teal-secondary)] cursor-pointer hover:underline" @click="startReply(n.id)">Reply</span>

                        <!-- Replies -->
                        <div v-if="n.replies.length" class="flex flex-col gap-3 mt-3">
                          <div v-for="r in n.replies" :key="r.id" class="flex gap-2.5">
                            <BrandAvatarInitials :initials="r.authorInitials" size="xs" />
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center justify-between gap-2">
                                <span class="font-semibold text-[13px] text-[var(--brand-text)]">{{ r.author }}</span>
                                <span class="text-[11.5px] text-[var(--brand-text-quiet)]">{{ r.createdAt }}</span>
                              </div>
                              <p class="m-0 mt-0.5 text-[13.5px] text-[var(--brand-text-secondary)]">{{ r.body }}</p>
                            </div>
                          </div>
                        </div>

                        <!-- Reply box -->
                        <div v-if="replyingId === n.id" class="mt-2.5">
                          <input
                            v-model="replyText"
                            type="text"
                            placeholder="Write a reply…"
                            class="w-full box-border border-[1.6px] border-[var(--brand-border)] rounded-[10px] px-3 py-2 text-[13.5px] text-[var(--brand-text)] outline-none focus:border-[var(--brand-lime)]"
                            @keydown.enter="sendReply(n)"
                            @keydown.esc="cancelReply"
                          >
                          <div class="flex justify-end gap-2 mt-2">
                            <BrandButton variant="outline" size="sm" @click="cancelReply">Cancel</BrandButton>
                            <BrandButton variant="primary-teal" size="sm" @click="sendReply(n)">Reply</BrandButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p v-else class="text-[13px] text-[var(--brand-text-quiet)] m-0">No notes yet.</p>
                </CandidateCollapsibleCard>
              </div>
            </aside>
          </div>
        </template>
      </ErrorBoundary>
      </div>
    </div>

    <!-- Close/Prev/Next rail, sits outside the card (desktop only — mobile close lives in the header) -->
    <div class="hidden lg:flex flex-col gap-2 shrink-0 pt-0.5">
      <button
        class="w-11 h-11 inline-flex items-center justify-center rounded-xl bg-white/10 text-white/90 hover:bg-white/20"
        aria-label="Close"
        @click="close"
      >
        <X class="w-5 h-5" stroke-width="1.8" />
      </button>
      <div class="flex flex-col rounded-xl overflow-hidden bg-white/10">
        <button
          class="w-11 h-11 inline-flex items-center justify-center text-white/90 enabled:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous candidate"
          :disabled="!prevId"
          @click="goToCandidate(prevId)"
        >
          <ChevronUp class="w-5 h-5" stroke-width="1.8" />
        </button>
        <div class="h-px bg-white/15" />
        <button
          class="w-11 h-11 inline-flex items-center justify-center text-white/90 enabled:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next candidate"
          :disabled="!nextId"
          @click="goToCandidate(nextId)"
        >
          <ChevronDown class="w-5 h-5" stroke-width="1.8" />
        </button>
      </div>
    </div>
    </div>

    <!-- Interview scheduling — 2-step Schedule event dialog -->
    <CandidateScheduleModal
      v-if="profile"
      v-model:open="scheduleOpen"
      :candidate-name="profile.name"
      :candidate-initials="profile.initials"
      :candidate-color="profile.avatarColor"
      :job-name="localJobs[0]?.title"
    />

    <!-- Assign candidate -->
    <CandidateAssignModal v-if="profile" v-model:open="assignOpen" @confirm="onAssignConfirm" />

    <!-- Guarded actions -->
    <CandidateConfirmDialog
      v-if="profile"
      v-model:open="requalifyOpen"
      title="Requalify candidate?"
      :description="`This will move ${profile.name} back into the active pipeline and clear the disqualification reason.`"
      confirm-label="Requalify"
      tone="success"
      :icon="RotateCcw"
      @confirm="confirmRequalify"
    />
    <CandidateConfirmDialog
      v-if="profile"
      v-model:open="removePoolOpen"
      title="Remove from talent pool?"
      :description="`This will remove ${profile.name} from the &quot;${removePoolName}&quot; talent pool. You can add them back at any time.`"
      confirm-label="Remove"
      tone="danger"
      :icon="FolderMinus"
      @confirm="confirmRemovePool"
    />
    <CandidateConfirmDialog
      v-if="profile"
      v-model:open="deleteOpen"
      title="Delete candidate?"
      :description="`This will permanently remove ${profile.name} and all associated data from your workspace. This action cannot be undone.`"
      confirm-label="Delete"
      tone="danger"
      :icon="Trash2"
      @confirm="confirmDelete"
    />

    <!-- CV resume actions -->
    <CandidateConfirmDialog
      v-model:open="reparseOpen"
      title="Re-parse resume?"
      description="We'll re-analyze the current resume and refresh the candidate's parsed details. This may take a few minutes and will overwrite existing parsed fields."
      confirm-label="Re-parse"
      tone="success"
      :icon="RefreshCw"
      @confirm="confirmReparse"
    />
    <CandidateConfirmDialog
      v-model:open="deleteResumeOpen"
      title="Delete resume?"
      description="This will permanently remove the current resume file from the candidate's profile. This action cannot be undone."
      confirm-label="Delete"
      tone="danger"
      :icon="Trash2"
      @confirm="confirmDeleteResume"
    />
    <CandidateConfirmDialog
      v-model:open="uploadResumeOpen"
      title="Upload new resume"
      confirm-label="Upload"
      tone="neutral"
      :icon="Upload"
      @confirm="confirmUploadResume"
    >
      <div class="mt-2">
        <ul class="m-0 mb-4 pl-4 text-[13.5px] leading-[1.7] text-[var(--brand-text-secondary)] list-disc">
          <li>Uploading a new resume will replace the existing file.</li>
          <li>You'll still be able to view the previous file in the Files tab.</li>
          <li>Re-parsing the resume may take a few minutes.</li>
        </ul>
        <label class="flex flex-col items-center justify-center gap-2 border-[1.6px] border-dashed border-[var(--brand-border-mid)] rounded-xl px-5 py-7 cursor-pointer hover:border-[var(--brand-lime)] hover:bg-[var(--brand-lime-tint)]/40 transition-colors">
          <Upload class="w-7 h-7 text-[var(--brand-icon-muted)]" stroke-width="1.5" />
          <span class="text-[14px] text-[var(--brand-text-secondary)]"><span class="text-[var(--brand-teal-secondary)] font-bold">Upload a file</span> or drag and drop</span>
          <span class="text-[12px] text-[var(--brand-text-faint)]">PDF, Word — up to 10MB</span>
          <input type="file" accept=".pdf,.doc,.docx" class="hidden">
        </label>
      </div>
    </CandidateConfirmDialog>
  </div>
</template>
