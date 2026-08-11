<!--
  Job Management page — ported from "Job management.dc.html". Matches the
  design's visible-on-load structure at ~90% fidelity: header row, tab bar,
  sub-toolbar, pipeline kanban board with candidate cards.

  Interactive additions on top of the base design:
   • Column collapse — click chevron in a stage header to fold to a 40px
     rail (dot + count + rotated label). Click the expand chevron to restore.
   • Per-column automation — lightning-bolt in every header opens a stub
     menu (Send email / Move to next stage / Notify recruiter).
   • Bulk-select — checkbox on every card (plus a select-all in each column
     header). When ≥1 selected the Qualified/Disqualified segmented toggle
     swaps for the bulk toolbar (Send Email / Change Stage / More…), and
     selected cards highlight with lime tint.

  Every color goes through --brand-* tokens so a future palette swap
  propagates. Reuse: BrandLimeCheckbox for selection, JobStatusMenu-style
  status dot for the header, DropdownMenu for automation + bulk More menu.
-->
<script setup lang="ts">
import { Share2, Eye, Plus, Pencil, MapPin, Briefcase, Zap, MoreHorizontal,
         Mail, MessageSquare, CornerUpLeft, ArrowUpDown, Kanban, ChevronLeft, ChevronRight,
         X, ArrowLeftRight, Users, Copy, Trash2, Share, Ban, Download, Search,
         UserPlus, Building2, Bold, Italic, Underline, List, ListOrdered, ListChecks, Link2,
         Paperclip, AtSign, Smile, ThumbsUp, MoreVertical } from 'lucide-vue-next'
import { BrandButton, BrandLimeCheckbox } from '~/components/brand'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import AddCandidatesModal from '~/components/candidates/AddCandidatesModal.vue'
import CandidatesTable from '~/components/candidates/CandidatesTable.vue'
import CandidatesToolbar from '~/components/candidates/CandidatesToolbar.vue'
import CandidatesTableSkeleton from '~/components/candidates/CandidatesTableSkeleton.vue'
import CandidatesEmptyState from '~/components/candidates/CandidatesEmptyState.vue'
import CandidatesPerPage from '~/components/candidates/CandidatesPerPage.vue'
import CandidatesFilters from '~/components/candidates/CandidatesFilters.vue'
import CandidatePipelineCard from '~/components/jobs/CandidatePipelineCard.vue'
import PipelineScreeningView from '~/components/jobs/pipeline/PipelineScreeningView.vue'
import ErrorBoundary from '~/components/ErrorBoundary.vue'
import JobReportsTab from '~/components/reports/JobReportsTab.vue'
import { BrandPageTitle, BrandSearchBar } from '~/components/brand'
import { useJobs } from '~/composables/useJobs'
import { useJobPipeline } from '~/composables/useJobPipeline'
import { useJobActivity, type JobActivityKind } from '~/composables/useJobActivity'
import { useJobNotes, type NoteVisibility } from '~/composables/useJobNotes'
import { useJobReferrals, REFERRAL_SOURCE_TAGS } from '~/composables/useJobReferrals'
import { useCandidates } from '~/composables/useCandidates'
import { useTeamMembers } from '~/composables/useTeam'
import { useSmartDistributeConfig } from '~/composables/useSmartDistribute'
import { useActiveFilters } from '~/composables/useActiveFilters'
import CandidatesBulkAssignModal from '~/components/candidates/CandidatesBulkAssignModal.vue'
import { usePreviewRoleStore } from '~/stores/previewRole.store'
import { refDebounced, useLocalStorage } from '@vueuse/core'
import type { Job, PipelineStage } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const jobId = computed(() => String(route.params.id))
const { jobs } = useJobs()
const job = computed<Job | undefined>(() => jobs.value.find(j => j.id === jobId.value))

const { stages, qualifiedCount, disqualifiedCount, moveCandidate } = useJobPipeline(jobId.value)

// ── Kanban drag-and-drop ──
// Tracks the candidate currently being dragged so we can (a) render the
// source card as a subtle placeholder and (b) accept drops on any column.
type DragCtx = { id: string; fromKey: string }
const drag = ref<DragCtx | null>(null)
const dropTarget = ref<string | null>(null)   // stage key currently under the pointer

function onDragStart(id: string, fromKey: string, e: DragEvent) {
  drag.value = { id, fromKey }
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
}
function onDragEnd() { drag.value = null; dropTarget.value = null }

function onColumnDragEnter(stageKey: string) {
  if (drag.value) dropTarget.value = stageKey
}
function onColumnDragOver(e: DragEvent) {
  // preventDefault on dragover is what allows a drop to fire on this element.
  if (drag.value) { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move' }
}
function onColumnDrop(stageKey: string, e: DragEvent) {
  e.preventDefault()
  if (drag.value && drag.value.fromKey !== stageKey) {
    onMove(drag.value.id, drag.value.fromKey, stageKey)
  }
  drag.value = null
  dropTarget.value = null
}

// ── Shared move path — used by BOTH HTML5 drag-and-drop AND the keyboard
// "Move to…" menu on each card, so the two paths never diverge (Part 7).
// Also emits a screen-reader announcement (Part 7 aria-live spec).
const moveAnnouncement = ref('')
function onMove(id: string, fromKey: string, toKey: string) {
  if (fromKey === toKey) return
  const fromLabel = stages.value.find(s => s.key === fromKey)?.label ?? fromKey
  const toLabel   = stages.value.find(s => s.key === toKey)?.label   ?? toKey
  const cand      = stages.value.find(s => s.key === fromKey)?.candidates.find(c => c.id === id)
  moveCandidate(id, fromKey as never, toKey as never)
  const fromCount = stages.value.find(s => s.key === fromKey)?.candidates.length ?? 0
  const toCount   = stages.value.find(s => s.key === toKey)?.candidates.length ?? 0
  moveAnnouncement.value = `${cand?.name ?? 'Candidate'} moved from ${fromLabel} to ${toLabel}. ${fromLabel} ${fromCount}. ${toLabel} ${toCount}.`
}

/** All stages except the current one — populates the card's "Move to…" menu. */
function moveTargetsFor(currentKey: string) {
  return stages.value.filter(s => s.key !== currentKey)
}

// ─── UI state ───
const STATUS_DOT: Record<string, string> = {
  published: 'var(--brand-status-approved-text)',
  internal:  'var(--brand-status-teal-green)',
  draft:     'var(--brand-text-quiet)',
  closed:    'var(--brand-status-closed-text)',
  archived:  'var(--brand-text-faint)',
}
const WORK_MODEL_LABEL: Record<Job['workModel'], string> = {
  'on-site': 'On-site',
  remote:    'Remote',
  hybrid:    'Hybrid',
}

const TABS = ['Pipeline', 'Filters', 'Activity', 'Notes', 'Referral', 'Reports'] as const
type Tab = typeof TABS[number]
const activeTab = ref<Tab>('Pipeline')

const segment = ref<'qual' | 'disq'>('qual')
const myOn     = ref(true)

// Pipeline sub-view: kanban board (default) vs Recruitee-style 3-pane
// screening view. Persist per-job so a recruiter's preferred workflow
// on a specific job survives reloads.
const pipelineViewMode = useLocalStorage<'kanban' | 'screening'>(`pipeline-view-mode:${jobId.value}`, 'kanban')

// Activity tab — segmented control + kind→icon mapping. See useJobActivity.ts.
const { grouped: activityGroups } = useJobActivity(jobId.value)
const activityFilter = ref<'all' | 'automations'>('all')
const ACTIVITY_ICONS: Record<JobActivityKind, unknown> = {
  'assign-candidate': UserPlus,
  'assign-location':  MapPin,
  'change-status':    Eye,
  'assign-work-type': Building2,
  'add-job':          Briefcase,
  'automation':       Zap,
}
const filteredActivityGroups = computed(() => {
  if (activityFilter.value === 'all') return activityGroups.value
  return activityGroups.value
    .map(g => ({ date: g.date, items: g.items.filter(a => a.kind === 'automation' || a.isAutomation) }))
    .filter(g => g.items.length > 0)
})

// ── Notes tab ──
// Simple editor state — the toolbar buttons are visual for now; a real WYSIWYG
// (tiptap / prosemirror) plugs in the same shell without changing the layout.
const { notes: jobNotes, addNote, removeNote } = useJobNotes(jobId.value)
const noteDraft = ref('')
const noteVisibility = ref<NoteVisibility>('everyone')

const VIS_LABEL: Record<NoteVisibility, string> = {
  everyone: 'Visible to everyone',
  admins:   'Visible to admins',
  me:       'Visible only to me',
}

function saveNote() {
  addNote(noteDraft.value, noteVisibility.value)
  noteDraft.value = ''
}
function cancelNote() { noteDraft.value = '' }

// ── Referral tab ──
// Share-links per source. Each link carries its own click counter that
// increments when a candidate applies via that specific URL.
const { referrals: jobReferrals, addReferral, removeReferral } = useJobReferrals(jobId.value)
const referralSearch = ref('')
const referralModalOpen = ref(false)
const referralForm = reactive({ name: '', sourceTag: '' })
const referralFormValid = computed(() => referralForm.name.trim().length > 0 && referralForm.sourceTag.length > 0)

const filteredReferrals = computed(() => {
  const q = referralSearch.value.trim().toLowerCase()
  if (!q) return jobReferrals.value
  return jobReferrals.value.filter(r =>
    r.name.toLowerCase().includes(q) || r.sourceTag.toLowerCase().includes(q),
  )
})

function openReferralModal() {
  referralForm.name = ''
  referralForm.sourceTag = ''
  referralModalOpen.value = true
}
function saveReferral() {
  if (!referralFormValid.value) return
  addReferral({ name: referralForm.name, sourceTag: referralForm.sourceTag })
  referralModalOpen.value = false
}

const copiedReferralId = ref<string | null>(null)
async function copyReferralLink(id: string, url: string) {
  try {
    await navigator.clipboard.writeText(url)
    copiedReferralId.value = id
    setTimeout(() => { if (copiedReferralId.value === id) copiedReferralId.value = null }, 1200)
  } catch { /* clipboard blocked */ }
}

function sourceTagLabel(v: string) {
  return REFERRAL_SOURCE_TAGS.find(t => t.value === v)?.label ?? v
}
// Both default ON — matches how the board always looked before this toggle
// had a real effect (everyone visible). A recruiter narrows to just their
// own by turning "Shared with me" off, rather than opening a job and
// finding an empty board because ownership doesn't happen to include them.
const sharedOn = ref(true)

// Share popover state — computed job URL and copy-to-clipboard flag.
const jobUrl = computed(() =>
  `https://app.recruitera.ai/job/${encodeURIComponent((job.value?.title || jobId.value).toLowerCase().replace(/\s+/g, '-'))}-${jobId.value}`,
)
const copied = ref(false)
async function copyJobUrl() {
  try {
    await navigator.clipboard.writeText(jobUrl.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1200)
  } catch { /* clipboard blocked — ignore, tooltip stays */ }
}

// ─── Filters tab: reuse the real Candidates page components ────────────
// Fetches from /api/candidates?job=<title> so results match /candidates
// exactly, just scoped to THIS job. CandidatesTable / Toolbar / Skeleton
// / EmptyState are the same instances the /candidates page uses — bug
// fixes on either surface propagate automatically.
const searchInput = ref('')
const debouncedSearch = refDebounced(searchInput, 250)
const filtersPage = ref(1)
const filtersPerPage = ref(30)

// Shared Smart Distribute context — the Assigned Recruiter filter catalog
// entry (Filters tab), the bulk-assign button + badges (Pipeline tab) all
// need "who's in this job's pool" and "is Auto-Distribute even on".
const { data: teamData, isLoading: teamPending } = useTeamMembers()
const { data: distConfig, isLoading: distConfigPending } = useSmartDistributeConfig(jobId)
const previewRoleStore = usePreviewRoleStore()
const poolRecruiters = computed(() => {
  const roster = teamData.value?.data ?? []
  return (distConfig.value?.recruiters ?? [])
    .map(r => roster.find(m => m.id === r.teamMemberId))
    .filter((m): m is NonNullable<typeof m> => !!m)
})
const smartDistributeOn = computed(() => !!distConfig.value?.enabled)
const assignedRecruiterOptions = computed(() => poolRecruiters.value.map(r => ({ value: r.id, label: r.name })))
// CandidatesFilters seeds "Assigned Recruiter" into the active filter set
// once, in its own onMounted — it needs the pool to already be final at
// that point (a second push after an async prop update was observed to
// race the URL and get silently dropped), so its mount waits here.
const filtersPanelReady = computed(() => !teamPending.value && !distConfigPending.value)

// Assigned Recruiter filter (E2) now lives in the normal filter-catalog
// panel (CandidatesFilters.vue seeds it into the active set once the pool
// is known) instead of a bespoke control — read its live value here to
// build the actual query.
const activeFilters = useActiveFilters()
const assignedRecruiterActiveFilter = computed(() => activeFilters.get('assigned-recruiter'))
watch(() => assignedRecruiterActiveFilter.value?.values, () => { filtersPage.value = 1 })

// Lightweight, unpaginated fetch of this job's candidates purely to read
// assignedRecruiterId — the Pipeline board's own PipelineCandidate fixture
// doesn't carry ownership, but ids match real candidate rows (see
// useJobPipeline.ts), so a cheap cross-reference is enough for badges.
const { data: allJobCandidatesData } = useCandidates(computed(() => ({ job: job.value?.title, perPage: 999 })))
const assignedRecruiterIdByCandidateId = computed(() => {
  const map: Record<string, string | null | undefined> = {}
  for (const c of allJobCandidatesData.value?.data ?? []) map[c.id] = c.assignedRecruiterId
  return map
})
function assignedRecruiterFor(candidateId: string) {
  if (!smartDistributeOn.value) return undefined
  const recruiterId = assignedRecruiterIdByCandidateId.value[candidateId]
  if (!recruiterId) return null
  const m = poolRecruiters.value.find(r => r.id === recruiterId)
    ?? (teamData.value?.data ?? []).find(r => r.id === recruiterId)
  if (!m) return null
  const parts = m.name.trim().split(/\s+/)
  const initials = ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1]![0] : '')).toUpperCase()
  return { name: m.name, initials, bg: m.avatarBg, color: m.avatarText }
}

// Recruiter Focus Mode (E2) — "My candidates" / "Shared with me" toggles
// existed as decorative UI before; wire them to the same ownership data the
// filters/badges above already use. Only meaningful once Smart Distribute is
// on for the job — otherwise there's no ownership to focus on, so every
// candidate stays visible regardless of toggle state. The Pipeline board's
// PipelineCandidate fixture only cross-references ALL_CANDIDATES by id for
// jobs where the two happen to overlap (see assignedRecruiterFor above) — a
// candidate id absent from that map is "unresolvable," not "not mine," so it
// always stays visible rather than silently emptying the whole board.
const visibleStages = computed(() => {
  if (!smartDistributeOn.value) return stages.value
  return stages.value.map(s => ({
    ...s,
    candidates: s.candidates.filter((c) => {
      const recruiterId = assignedRecruiterIdByCandidateId.value[c.id]
      if (recruiterId === undefined) return true
      const isMine = recruiterId === previewRoleStore.viewerTeamMemberId
      return (myOn.value && isMine) || (sharedOn.value && !isMine)
    }),
  }))
})

// Bulk "Assign to recruiters" from the Pipeline board's own selection —
// lives in the "More…" menu (matching CandidatesToolbar.vue's placement)
// rather than a standalone button, so it stays visible-but-disabled with
// an explanation instead of silently vanishing when gated off.
const pipelineBulkAssignOpen = ref(false)
const pipelineAssignToast = ref<string | null>(null)
const pipelineCanBulkAssign = computed(() => smartDistributeOn.value && previewRoleStore.canManageSmartDistribute)
const pipelineBulkAssignDisabledReason = computed(() => {
  if (!smartDistributeOn.value) return 'Auto-Distribute is off for this job'
  if (!previewRoleStore.canManageSmartDistribute) return "You don't have permission to manage Smart Distribute"
  return ''
})
function onPipelineBulkAssigned() {
  const n = selectedCount.value
  pipelineBulkAssignOpen.value = false
  clearSelection()
  pipelineAssignToast.value = `${n} candidate${n === 1 ? '' : 's'} assigned`
  setTimeout(() => { pipelineAssignToast.value = null }, 2600)
}

const candidatesFilters = computed<Record<string, string | number | undefined>>(() => ({
  job:          job.value?.title,
  search:       debouncedSearch.value || undefined,
  assignedTo:   assignedRecruiterActiveFilter.value?.values?.length ? assignedRecruiterActiveFilter.value.values.join(',') : undefined,
  assignedToOp: assignedRecruiterActiveFilter.value?.op,
  page:         filtersPage.value,
  perPage:      filtersPerPage.value,
}))

const { data: candidatesData, isFetching: candidatesFetching } = useCandidates(candidatesFilters)
const candidates  = computed(() => candidatesData.value?.data ?? [])
const totalCands  = computed(() => candidatesData.value?.total ?? 0)
const totalPages  = computed(() => candidatesData.value?.totalPages ?? 1)
const candIds     = computed(() => candidates.value.map(c => c.id))
function onFiltersPageChange(p: number) {
  filtersPage.value = p
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function onFiltersPerPageChange(n: number) {
  filtersPerPage.value = n
  filtersPage.value = 1
}

// (legacy) filter-status stubs kept for the removed custom sidebar — clean up in a follow-up.
const filtersStatusOn = ref<Set<'qualified' | 'disqualified' | 'new' | 'overdue'>>(new Set())
function toggleFiltersStatus(s: 'qualified' | 'disqualified' | 'new' | 'overdue') {
  const n = new Set(filtersStatusOn.value)
  n.has(s) ? n.delete(s) : n.add(s)
  filtersStatusOn.value = n
}
const allJobCandidates = computed(() => stages.value.flatMap(s => s.candidates.map(c => ({ ...c, stage: s.label, stageDot: s.dot }))))
const filtersRows = computed(() => {
  const term = filtersSearch.value.trim().toLowerCase()
  return allJobCandidates.value.filter((c) => {
    if (term && !c.name.toLowerCase().includes(term)) return false
    if (filtersStatusOn.value.has('new') && !c.isNew) return false
    // qualified/disqualified/overdue stubs are visual-only for now
    return true
  })
})
const filtersStatusCounts = computed(() => ({
  qualified:    allJobCandidates.value.length,
  disqualified: 0,
  new:          allJobCandidates.value.filter(c => c.isNew).length,
  overdue:      0,
}))

// Column collapse — Set of stage keys currently collapsed.
const collapsedStages = ref<Set<string>>(new Set())
function toggleColumn(key: string) {
  const next = new Set(collapsedStages.value)
  next.has(key) ? next.delete(key) : next.add(key)
  collapsedStages.value = next
}

// Bulk selection — Set of candidate ids across all columns.
const selectedIds = ref<Set<string>>(new Set())
const selectedCount = computed(() => selectedIds.value.size)

function isSelected(id: string) { return selectedIds.value.has(id) }
function toggleCandidate(id: string) {
  const next = new Set(selectedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedIds.value = next
}
function columnAllSelected(stage: PipelineStage) {
  return stage.candidates.length > 0 && stage.candidates.every(c => selectedIds.value.has(c.id))
}
function columnAnySelected(stage: PipelineStage) {
  return stage.candidates.some(c => selectedIds.value.has(c.id))
}
function toggleAllInColumn(stage: PipelineStage, next: boolean) {
  const s = new Set(selectedIds.value)
  for (const c of stage.candidates) next ? s.add(c.id) : s.delete(c.id)
  selectedIds.value = s
}
function clearSelection() { selectedIds.value = new Set() }
</script>

<template>
  <!-- Same curved-corner shell as /candidates + /jobs + /settings: white
       card starts with rounded-tl-[22px], top + left borders in --brand-border. -->
  <div class="flex flex-col h-full bg-[var(--brand-surface-listview)] overflow-hidden">
    <div class="flex-1 flex flex-col overflow-hidden px-7 pt-6 bg-white rounded-tl-[22px] border-t border-l border-[var(--brand-border)]">

      <!-- Missing job (bad id) -->
      <div v-if="!job" class="text-center py-16 text-[14px] text-[var(--brand-text-quiet)]">
        Job not found —
        <NuxtLink to="/jobs" class="text-[var(--brand-teal)] font-semibold hover:underline">back to jobs</NuxtLink>
      </div>

      <template v-else>
        <!-- ─────────── HEADER ─────────── -->
        <div class="flex items-start gap-3.5 mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2.5">
              <span class="w-[9px] h-[9px] rounded-full shrink-0" :style="{ background: STATUS_DOT[job.status] }" />
              <h1 class="m-0 text-[22px] font-bold tracking-tight text-[var(--brand-text)]">{{ job.title }}</h1>
            </div>
            <div class="flex items-center gap-4 mt-2 text-[13.5px] text-[var(--brand-text-quiet)]">
              <span v-if="job.location" class="inline-flex items-center gap-1.5">
                <MapPin class="w-3.5 h-3.5" stroke-width="1.5" />
                {{ job.location }}
              </span>
              <span class="inline-flex items-center gap-1.5">
                <Briefcase class="w-3.5 h-3.5" stroke-width="1.5" />
                {{ WORK_MODEL_LABEL[job.workModel] }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <Popover>
              <PopoverTrigger as-child>
                <button class="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[9px] text-[13.5px] font-semibold text-[var(--brand-text-secondary)] hover:bg-[var(--brand-lime-tint-hover)] transition" aria-label="Share job">
                  <Share2 class="w-4 h-4" stroke-width="1.5" />
                  Share
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                :side-offset="6"
                class="w-[320px] p-[18px] rounded-[14px] border border-[var(--brand-border-light)] shadow-[0_12px_34px_rgba(0,20,18,0.16)]"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="font-bold text-[13px] text-[var(--brand-text)] mb-1.5">Job URL</div>
                    <div class="text-[13px] leading-[1.5] text-[var(--brand-text-quiet)] break-all">{{ jobUrl }}</div>
                  </div>
                  <button
                    class="shrink-0 w-[34px] h-[34px] rounded-[9px] inline-flex items-center justify-center text-[var(--brand-teal)] hover:bg-[var(--brand-lime-tint-hover)] transition"
                    :aria-label="copied ? 'Copied' : 'Copy job URL'"
                    :title="copied ? 'Copied' : 'Copy link'"
                    @click="copyJobUrl"
                  >
                    <Copy class="w-[17px] h-[17px]" stroke-width="1.7" />
                  </button>
                </div>
                <div class="h-px bg-[var(--brand-border-fade)] my-4" />
                <div class="font-bold text-[13px] text-[var(--brand-text)] mb-3">Share Job on Social Media</div>
                <div class="flex items-center gap-2.5">
                  <!-- Social buttons keep their canonical brand colors (external IP) -->
                  <a href="#" title="Facebook" aria-label="Share on Facebook" class="w-6 h-6 rounded-md inline-flex items-center justify-center" style="background:#1877F2" @click.prevent>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M14 8.5V7c0-.7.5-.9.9-.9H16V3.2l-2.2-.01c-2.5 0-3.1 1.86-3.1 3.06V8.5H9v3h1.7V21h3.3v-9.5h2.3l.35-3H14z" /></svg>
                  </a>
                  <a href="#" title="X" aria-label="Share on X" class="w-6 h-6 rounded-md inline-flex items-center justify-center" style="background:#000" @click.prevent>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M17.53 3h3.02l-6.6 7.54L21.75 21h-6.07l-4.76-6.22L5.48 21H2.46l7.06-8.07L2.25 3h6.23l4.3 5.69L17.53 3zm-1.06 16.2h1.67L7.6 4.7H5.8l10.67 14.5z" /></svg>
                  </a>
                  <a href="#" title="LinkedIn" aria-label="Share on LinkedIn" class="w-6 h-6 rounded-md inline-flex items-center justify-center" style="background:#0A66C2" @click.prevent>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M6.94 5A1.94 1.94 0 1 1 3.06 5a1.94 1.94 0 0 1 3.88 0zM3.3 8.4h3.28V21H3.3V8.4zm5.5 0h3.14v1.72h.05c.44-.83 1.5-1.72 3.1-1.72 3.31 0 3.92 2.18 3.92 5.02V21h-3.28v-5.6c0-1.34-.03-3.06-1.86-3.06-1.87 0-2.15 1.45-2.15 2.96V21H8.8V8.4z" /></svg>
                  </a>
                </div>
              </PopoverContent>
            </Popover>
            <button class="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[9px] text-[13.5px] font-semibold text-[var(--brand-text-secondary)] hover:bg-[var(--brand-lime-tint-hover)] transition" aria-label="Preview job posting">
              <Eye class="w-4 h-4" stroke-width="1.5" />
              Preview
            </button>
            <button class="w-[34px] h-[34px] rounded-full border border-dashed border-[var(--brand-border)] text-[var(--brand-text-quiet)] hover:bg-[var(--brand-lime-tint-hover)] inline-flex items-center justify-center transition" aria-label="Add collaborator">
              <Plus class="w-4 h-4" stroke-width="1.5" />
            </button>
            <span class="w-[34px] h-[34px] rounded-full bg-[var(--brand-teal)] text-white inline-flex items-center justify-center font-bold text-[13px]" aria-label="Assigned to MS">MS</span>
            <BrandButton variant="outline" size="sm" class="ml-1">
              <Pencil class="w-3.5 h-3.5 mr-1.5" stroke-width="1.5" />
              Edit
            </BrandButton>
          </div>
        </div>

        <!-- ─────────── TABS ─────────── -->
        <div class="flex items-center gap-7 border-b border-[var(--brand-border-fade)] mb-4">
          <button
            v-for="tab in TABS"
            :key="tab"
            class="relative pb-3 text-[14px] transition"
            :class="activeTab === tab
              ? 'text-[var(--brand-text)] font-bold'
              : 'text-[var(--brand-text-quiet)] font-semibold hover:text-[var(--brand-text-secondary)]'"
            @click="activeTab = tab"
          >
            <span class="inline-flex items-center gap-1.5">
              {{ tab }}
              <span
                v-if="tab === 'Notes' && jobNotes.length > 0"
                class="text-[11px] font-bold text-[var(--brand-text-secondary)] bg-[var(--brand-lime-tint)] rounded-md px-1.5 py-px"
              >{{ jobNotes.length }}</span>
            </span>
            <span v-if="activeTab === tab" class="absolute left-0 right-0 bottom-0 h-[3px] bg-[var(--brand-teal)] rounded-t-[3px]" />
          </button>
        </div>

        <!-- ─────────── SUB-TOOLBAR (Pipeline tab only) ─────────── -->
        <div v-if="activeTab === 'Pipeline'" class="flex items-center gap-3 mb-4 flex-wrap">
          <!-- Bulk-action bar (replaces segmented toggle when items selected) -->
          <template v-if="selectedCount > 0">
            <span class="text-[14px] font-semibold text-[var(--brand-text)] whitespace-nowrap">
              <span class="text-[var(--brand-teal)] font-bold">{{ selectedCount }}</span> selected
            </span>
            <span class="w-px h-[22px] bg-[var(--brand-border)]" />
            <button class="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[9px] bg-white border border-[var(--brand-border)] text-[13px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint-hover)] transition whitespace-nowrap">
              <Mail class="w-4 h-4 text-[var(--brand-text-quiet)]" stroke-width="1.7" />
              Send Email
            </button>
            <button class="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[9px] bg-white border border-[var(--brand-border)] text-[13px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint-hover)] transition whitespace-nowrap">
              <ArrowLeftRight class="w-4 h-4 text-[var(--brand-text-quiet)]" stroke-width="1.7" />
              Change Stage
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <button class="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[9px] bg-white border border-[var(--brand-border)] text-[13px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint-hover)] transition whitespace-nowrap">
                  More…
                  <ChevronRight class="w-3 h-3 text-[var(--brand-text-quiet)] rotate-90" stroke-width="2" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" class="w-[210px] p-1">
                <DropdownMenuItem class="flex items-center gap-3 px-3 py-2 text-[14px] cursor-pointer">
                  <Download class="w-4 h-4 text-[var(--brand-teal)]" stroke-width="1.7" />
                  Export As CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  class="flex items-center gap-3 px-3 py-2 text-[14px] cursor-pointer"
                  :disabled="!pipelineCanBulkAssign"
                  :title="pipelineBulkAssignDisabledReason"
                  @click="pipelineCanBulkAssign && (pipelineBulkAssignOpen = true)"
                >
                  <UserPlus class="w-4 h-4 text-[var(--brand-teal)]" stroke-width="1.7" />
                  Assign to recruiters
                </DropdownMenuItem>
                <DropdownMenuItem class="flex items-center gap-3 px-3 py-2 text-[14px] cursor-pointer">
                  <Ban class="w-4 h-4 text-[var(--brand-teal)]" stroke-width="1.7" />
                  Disqualify
                </DropdownMenuItem>
                <DropdownMenuItem class="flex items-center gap-3 px-3 py-2 text-[14px] cursor-pointer">
                  <Users class="w-4 h-4 text-[var(--brand-teal)]" stroke-width="1.7" />
                  Add to talent pool
                </DropdownMenuItem>
                <DropdownMenuItem class="flex items-center gap-3 px-3 py-2 text-[14px] cursor-pointer">
                  <Copy class="w-4 h-4 text-[var(--brand-teal)]" stroke-width="1.7" />
                  Add to job
                </DropdownMenuItem>
                <DropdownMenuItem class="flex items-center gap-3 px-3 py-2 text-[14px] cursor-pointer">
                  <Share class="w-4 h-4 text-[var(--brand-teal)]" stroke-width="1.7" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem class="flex items-center gap-3 px-3 py-2 text-[14px] text-[var(--brand-danger)] cursor-pointer">
                  <Trash2 class="w-4 h-4" stroke-width="1.7" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              class="w-[34px] h-[34px] rounded-[9px] inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] hover:text-[var(--brand-danger)] transition"
              aria-label="Clear selection"
              @click="clearSelection"
            >
              <X class="w-4 h-4" stroke-width="1.9" />
            </button>
          </template>

          <!-- Segmented Qualified/Disqualified. Shown in BOTH Kanban and
                Screening. Order: [Qual/Disq]  [Kanban⇆Screening] — the
                qualification split reads as the primary scope; the view
                toggle is the secondary control. -->
          <template v-else>
            <div class="inline-flex items-center bg-[var(--brand-canvas)] rounded-[10px] p-[3px] h-[37px]">
              <button
                class="inline-flex items-center gap-2 rounded-[8px] px-3.5 h-[31px] text-[13px] font-bold transition"
                :class="segment === 'qual'
                  ? 'bg-white text-[var(--brand-text)] shadow-[0_1px_2px_rgba(0,20,18,0.08)]'
                  : 'text-[var(--brand-text-subtle)] hover:text-[var(--brand-text)]'"
                @click="segment = 'qual'"
              >
                Qualified
                <span
                  class="text-[11px] font-bold rounded-md px-[7px] py-px tabular-nums text-[var(--brand-text-secondary)] bg-[var(--brand-canvas)]"
                >{{ qualifiedCount }}</span>
              </button>
              <button
                class="inline-flex items-center gap-2 rounded-[8px] px-3.5 h-[31px] text-[13px] font-bold transition"
                :class="segment === 'disq'
                  ? 'bg-white text-[var(--brand-text)] shadow-[0_1px_2px_rgba(0,20,18,0.08)]'
                  : 'text-[var(--brand-text-subtle)] hover:text-[var(--brand-text)]'"
                @click="segment = 'disq'"
              >
                Disqualified
                <span
                  class="text-[11px] font-bold rounded-md px-[7px] py-px tabular-nums text-[var(--brand-text-secondary)] bg-[var(--brand-canvas)]"
                >{{ disqualifiedCount }}</span>
              </button>
            </div>

            <!-- Screening mode toggle. ON = screening (one candidate at
                 a time), OFF = kanban (pipeline overview). Same visual
                 switch used elsewhere on the toolbar so the intent
                 reads as "turn screening on/off", not "pick a view". -->
            <label class="inline-flex items-center gap-2 cursor-pointer whitespace-nowrap" role="switch" :aria-checked="pipelineViewMode === 'screening'">
              <span
                class="relative inline-flex w-[34px] h-5 rounded-full transition-colors"
                :style="{ background: pipelineViewMode === 'screening' ? 'var(--brand-teal)' : 'var(--brand-border)' }"
              >
                <span
                  class="absolute top-[2px] w-4 h-4 bg-white rounded-full shadow-[0_1px_2px_rgba(0,20,18,0.25)] transition-[left]"
                  :style="{ left: pipelineViewMode === 'screening' ? '16px' : '2px' }"
                />
              </span>
              <input
                :checked="pipelineViewMode === 'screening'"
                type="checkbox"
                class="sr-only"
                aria-label="Screening mode"
                @change="(e) => pipelineViewMode = (e.target as HTMLInputElement).checked ? 'screening' : 'kanban'"
              >
              <span class="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand-text)]">
                <Users class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" stroke-width="1.8" />
                Screening mode
              </span>
            </label>
          </template>

          <span class="flex-1" />

          <!-- Scope toggles + Add candidates — KANBAN ONLY.
               In Screening view these controls move into the list column
               (search, filter popover, per-row bulk actions), so the
               top-level sub-toolbar stays clean. -->
          <div v-if="pipelineViewMode === 'kanban'" class="inline-flex items-center gap-4 mr-3">
            <label class="inline-flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <span class="relative inline-flex w-[34px] h-5 rounded-full transition-colors" :style="{ background: myOn ? 'var(--brand-teal)' : 'var(--brand-border)' }">
                <span class="absolute top-[2px] w-4 h-4 bg-white rounded-full shadow-[0_1px_2px_rgba(0,20,18,0.25)] transition-[left]" :style="{ left: myOn ? '16px' : '2px' }" />
              </span>
              <input v-model="myOn" type="checkbox" class="sr-only">
              <span class="text-[14px] font-semibold text-[var(--brand-text)]">My candidates</span>
            </label>
            <span class="w-px h-5 bg-[var(--brand-border)]" />
            <label class="inline-flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <span class="relative inline-flex w-[34px] h-5 rounded-full transition-colors" :style="{ background: sharedOn ? 'var(--brand-teal)' : 'var(--brand-border)' }">
                <span class="absolute top-[2px] w-4 h-4 bg-white rounded-full shadow-[0_1px_2px_rgba(0,20,18,0.25)] transition-[left]" :style="{ left: sharedOn ? '16px' : '2px' }" />
              </span>
              <input v-model="sharedOn" type="checkbox" class="sr-only">
              <span class="text-[14px] font-semibold text-[var(--brand-text)]">Shared with me</span>
            </label>
          </div>

          <!-- Shared Add-candidates flow (same component as /candidates).
               preselectedJobId pre-checks THIS job in Step 3's Assign list
               so the user knows the candidate will land in this pipeline.
               Kanban only — Screening uses its own list-scoped affordances. -->
          <AddCandidatesModal v-if="pipelineViewMode === 'kanban'" :preselected-job-id="jobId" />

          <div v-if="pipelineViewMode === 'kanban'" class="inline-flex items-center gap-1.5">
            <button class="w-9 h-9 rounded-[10px] bg-[var(--brand-canvas)] text-[var(--brand-text-quiet)] inline-flex items-center justify-center hover:bg-[var(--brand-lime-tint)] transition" aria-label="Sort candidates">
              <ArrowUpDown class="w-4 h-4" stroke-width="1.5" />
            </button>
          </div>
        </div>

        <!-- Screen-reader-only announcer for card moves (Part 7 a11y).
             Scoped to move events only so it doesn't fire on unrelated
             mutations. Assertive is polite here — we don't want to interrupt. -->
        <div aria-live="polite" aria-atomic="true" class="sr-only">
          {{ moveAnnouncement }}
        </div>

        <!-- ─────────── PIPELINE BOARD (kanban view) ─────────── -->
        <div v-if="activeTab === 'Pipeline' && pipelineViewMode === 'kanban'" class="flex-1 min-h-0 flex gap-4 overflow-x-auto overflow-y-hidden pb-4 items-stretch">

          <!-- Collapsed rail — 40px, rotated label + dot + count -->
          <template v-for="stage in visibleStages" :key="stage.key">
            <section
              v-if="collapsedStages.has(stage.key)"
              class="flex-none w-10 flex flex-col items-center gap-2 rounded-[14px] py-3 min-h-[420px] bg-[var(--brand-surface-listview)]"
              :aria-label="`${stage.label} column (collapsed, ${stage.candidates.length} candidates)`"
            >
              <button
                class="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition"
                :aria-label="`Expand ${stage.label} column`"
                @click="toggleColumn(stage.key)"
              >
                <ChevronRight class="w-4 h-4" stroke-width="2" />
              </button>
              <span
                class="text-[11px] font-bold rounded-md px-1.5 py-px inline-flex items-center h-[19px] bg-[var(--brand-canvas)] text-[var(--brand-text-secondary)]"
              >{{ stage.candidates.length }}</span>
              <div
                class="flex-1 flex items-center justify-center"
                style="writing-mode: vertical-rl; transform: rotate(180deg)"
              >
                <span class="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--brand-text)] whitespace-nowrap">
                  <span class="w-[8px] h-[8px] rounded-full" :style="{ background: stage.dot }" />
                  {{ stage.label }}
                </span>
              </div>
            </section>

            <!-- Full column — 288px. `group` scopes hover reveals to THIS
                 column: checkbox + collapse chevron only fade in when the
                 user hovers the column (or when it already has a selection). -->
            <section
              v-else
              class="group flex-none w-[288px] flex flex-col rounded-[14px] px-3 pt-[14px] pb-3 min-h-[420px] transition"
              :class="dropTarget === stage.key && drag && drag.fromKey !== stage.key
                ? 'ring-2 ring-[var(--brand-teal)]/40 ring-inset'
                : ''"
              :style="{ background: 'linear-gradient(180deg, var(--brand-surface-listview) 0%, transparent 95%)' }"
              @dragenter.prevent="onColumnDragEnter(stage.key)"
              @dragover="onColumnDragOver"
              @drop="(e) => onColumnDrop(stage.key, e)"
            >
              <header class="flex items-center gap-[9px] px-1 pb-3">
                <!-- Dot ↔ select-all checkbox swap. Idle = dot. Hover /
                     column-has-selection = checkbox in the same slot. -->
                <span class="relative inline-flex w-[18px] h-[18px] shrink-0 items-center justify-center">
                  <span
                    class="absolute w-[9px] h-[9px] rounded-full transition-opacity"
                    :style="{ background: stage.dot }"
                    :class="columnAnySelected(stage) ? 'opacity-0' : 'group-hover:opacity-0'"
                    :aria-hidden="columnAnySelected(stage) ? 'true' : undefined"
                  />
                  <span
                    v-if="stage.candidates.length > 0"
                    class="absolute inset-0 inline-flex items-center justify-center transition-opacity"
                    :class="columnAnySelected(stage) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                    @click.stop
                  >
                    <BrandLimeCheckbox
                      :model-value="columnAllSelected(stage)"
                      :aria-label="`Select all candidates in ${stage.label}`"
                      @update:model-value="(v) => toggleAllInColumn(stage, v)"
                    />
                  </span>
                </span>
                <span class="text-[14px] font-semibold text-[var(--brand-text)]">{{ stage.label }}</span>
                <span
                  class="text-[12px] font-bold rounded-md px-2 inline-flex items-center h-[19px] bg-[var(--brand-canvas)]"
                  :class="stage.candidates.length > 0 ? 'text-[var(--brand-text-secondary)]' : 'text-[var(--brand-text-quiet)]'"
                >{{ stage.candidates.length }}</span>
                <span class="flex-1" />
                <!-- Collapse chevron — hidden until hover -->
                <button
                  class="w-6 h-6 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition-opacity opacity-0 group-hover:opacity-100"
                  :aria-label="`Collapse ${stage.label} column`"
                  @click="toggleColumn(stage.key)"
                >
                  <ChevronLeft class="w-3.5 h-3.5" stroke-width="2" />
                </button>
                <!-- Automation -->
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <button
                      class="w-6 h-6 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition"
                      :aria-label="`Automate ${stage.label} stage`"
                    >
                      <Zap class="w-4 h-4" stroke-width="0" fill="currentColor" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-[220px] p-1">
                    <div class="px-3 py-2 text-[12px] font-bold uppercase tracking-wider text-[var(--brand-text-quiet)]">
                      Stage automation
                    </div>
                    <DropdownMenuItem class="flex items-center gap-3 px-3 py-2 text-[14px] cursor-pointer">
                      <Mail class="w-4 h-4 text-[var(--brand-text-quiet)]" stroke-width="1.7" />
                      Send email on move-in
                    </DropdownMenuItem>
                    <DropdownMenuItem class="flex items-center gap-3 px-3 py-2 text-[14px] cursor-pointer">
                      <ArrowLeftRight class="w-4 h-4 text-[var(--brand-text-quiet)]" stroke-width="1.7" />
                      Auto-move to next stage
                    </DropdownMenuItem>
                    <DropdownMenuItem class="flex items-center gap-3 px-3 py-2 text-[14px] cursor-pointer">
                      <Users class="w-4 h-4 text-[var(--brand-text-quiet)]" stroke-width="1.7" />
                      Notify recruiter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </header>

              <!-- Candidate cards — one shared component per Part 2. -->
              <div class="flex flex-col gap-3">
                <CandidatePipelineCard
                  v-for="cand in stage.candidates"
                  :key="cand.id"
                  :candidate="cand"
                  :stage-key="stage.key"
                  :move-targets="moveTargetsFor(stage.key)"
                  :selected="isSelected(cand.id)"
                  :dragging="drag?.id === cand.id"
                  :assigned-recruiter="assignedRecruiterFor(cand.id)"
                  @toggle-select="toggleCandidate"
                  @move="(id, fromKey, toKey) => onMove(id, fromKey, toKey)"
                  @drag-start="(id, fromKey, e) => onDragStart(id, fromKey, e)"
                  @drag-end="onDragEnd"
                  @open-profile="(id) => navigateTo({ path: `/candidates/${id}`, query: { from: route.fullPath } })"
                />

                <div v-if="!stage.candidates.length" class="text-center text-[12.5px] text-[var(--brand-text-faint)] py-8">
                  No candidates yet
                </div>
              </div>
            </section>
          </template>
        </div>

        <!-- ─────────── PIPELINE — SCREENING VIEW (3-pane) ─────────── -->
        <PipelineScreeningView
          v-else-if="activeTab === 'Pipeline' && pipelineViewMode === 'screening'"
          :stages="stages"
          :selected="selectedIds"
          :qualified-count="qualifiedCount"
          :disqualified-count="disqualifiedCount"
          @toggle-select="toggleCandidate"
          @move="(id, from, to) => onMove(id, from, to)"
          @open-full="(id) => navigateTo({ path: `/candidates/${id}`, query: { from: route.fullPath } })"
        />

        <!-- ─────────── FILTERS TAB — candidates scoped to this job ─────────── -->
        <!-- Same shell as /candidates/index.vue: CandidatesFilters sidebar
             (rounded-tl card, 288px full / 60px rail), then the content
             column with page title + search + toolbar + table. Data comes
             from /api/candidates?job=<title> so results match /candidates
             exactly, just scoped to this job. Bug fixes on either surface
             propagate automatically. -->
        <div v-else-if="activeTab === 'Filters'" class="flex-1 min-h-0 flex overflow-hidden -mx-7 -mb-6">
          <ErrorBoundary>
            <CandidatesFilters
              v-if="filtersPanelReady"
              :assigned-recruiter-options="smartDistributeOn ? assignedRecruiterOptions : undefined"
            />
            <div v-else class="w-[288px] shrink-0 h-full rounded-tl-[22px] bg-white border-t border-l border-r border-[var(--brand-border)]" />
          </ErrorBoundary>

          <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--brand-surface-white)] border-t border-[var(--brand-border)]">
            <div class="flex items-center gap-2 px-6 pt-6 pb-4">
              <BrandPageTitle label="Candidates" />
            </div>

            <div class="px-6 pb-3">
              <BrandSearchBar
                v-model="searchInput"
                size="lg"
                placeholder="Search by name or role — try 'recruiter OR marketer' or 'John AND manager'"
              />
            </div>

            <div class="px-6 pb-2">
              <CandidatesToolbar
                :page-ids="candIds"
                :total="totalCands"
                :current-page="filtersPage"
                :total-pages="totalPages"
                :per-page="filtersPerPage"
                :job-id="jobId"
                @page-change="onFiltersPageChange"
              />
            </div>

            <div class="flex-1 overflow-auto px-6 pb-3">
              <ErrorBoundary>
                <CandidatesTableSkeleton v-if="candidatesFetching && !candidates.length" />
                <CandidatesEmptyState
                  v-else-if="!candidates.length"
                  :has-filters="!!debouncedSearch"
                  @clear="searchInput = ''"
                />
                <div v-else :class="candidatesFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'">
                  <CandidatesTable :candidates="candidates" :is-fetching="candidatesFetching" />
                  <CandidatesPerPage
                    :per-page="filtersPerPage"
                    :current-page="filtersPage"
                    :total-pages="totalPages"
                    @change="onFiltersPerPageChange"
                    @page-change="onFiltersPageChange"
                  />
                </div>
              </ErrorBoundary>
            </div>
          </div>
        </div>

        <!-- ─────────── ACTIVITY TAB ─────────── -->
        <!-- Segmented control (All / Automations) → bordered card holding
             timeline groups. Each item is avatar + kind icon in the corner
             + bold message segments + relative time. Uses --brand-* tokens
             only; avatar color reuses the same teal used by candidate cards. -->
        <div v-else-if="activeTab === 'Activity'" class="flex-1 min-h-0 flex flex-col overflow-hidden">
          <!-- Segmented -->
          <div class="pb-4 flex">
            <div class="inline-flex items-center bg-[var(--brand-canvas)] rounded-[10px] p-[3px] h-[37px]">
              <button
                class="inline-flex items-center rounded-[8px] px-3.5 h-[31px] text-[13px] font-bold transition"
                :class="activityFilter === 'all'
                  ? 'bg-white text-[var(--brand-text)] shadow-[0_1px_2px_rgba(0,20,18,0.08)]'
                  : 'text-[var(--brand-text-subtle)] hover:text-[var(--brand-text)]'"
                @click="activityFilter = 'all'"
              >
                All
              </button>
              <button
                class="inline-flex items-center gap-1.5 rounded-[8px] px-3.5 h-[31px] text-[13px] font-bold transition"
                :class="activityFilter === 'automations'
                  ? 'bg-white text-[var(--brand-text)] shadow-[0_1px_2px_rgba(0,20,18,0.08)]'
                  : 'text-[var(--brand-text-subtle)] hover:text-[var(--brand-text)]'"
                @click="activityFilter = 'automations'"
              >
                <Zap class="w-3.5 h-3.5" stroke-width="0" fill="currentColor" />
                Automations
              </button>
            </div>
          </div>

          <!-- Timeline card -->
          <div class="flex-1 overflow-auto">
            <div v-for="group in filteredActivityGroups" :key="group.date" class="mb-6">
              <div class="relative pl-6 mb-3">
                <span class="absolute left-[10px] top-1 bottom-0 w-px bg-[var(--brand-border-fade)]" />
                <span class="text-[13.5px] text-[var(--brand-text-quiet)]">{{ group.date }}</span>
              </div>

              <div class="rounded-[12px] border border-[var(--brand-border-light)] bg-white overflow-hidden">
                <div
                  v-for="(a, i) in group.items"
                  :key="a.id"
                  class="flex items-center gap-3.5 px-5 py-3.5 hover:bg-[var(--brand-lime-tint)]/40 transition"
                  :class="i > 0 ? 'border-t border-[var(--brand-border-fade)]' : ''"
                >
                  <!-- Avatar + kind icon badge -->
                  <div class="relative shrink-0">
                    <span
                      class="w-9 h-9 rounded-full bg-[var(--brand-teal)] text-white inline-flex items-center justify-center font-bold text-[12.5px]"
                      :aria-label="`${a.userName} avatar`"
                    >{{ a.userInitials }}</span>
                    <span
                      class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-[var(--brand-border-light)] inline-flex items-center justify-center text-[var(--brand-text-secondary)]"
                      :aria-label="a.kind"
                    >
                      <component :is="ACTIVITY_ICONS[a.kind]" class="w-3 h-3" stroke-width="1.8" />
                    </span>
                  </div>

                  <!-- Message -->
                  <div class="flex-1 min-w-0 text-[13.5px] text-[var(--brand-text)] leading-[1.5]">
                    <template v-for="(seg, si) in a.segments" :key="si">
                      <strong v-if="'b' in seg" class="font-bold">{{ seg.b }}</strong>
                      <span v-else>{{ seg.t }}</span>
                    </template>
                  </div>

                  <!-- Time -->
                  <span class="text-[13px] text-[var(--brand-text-quiet)] tabular-nums shrink-0">{{ a.timeAgo }}</span>
                </div>
              </div>
            </div>

            <div v-if="!filteredActivityGroups.length" class="py-16 text-center text-[13.5px] text-[var(--brand-text-quiet)]">
              No activity yet.
            </div>
          </div>
        </div>

        <!-- ─────────── NOTES TAB ─────────── -->
        <!-- Sticky editor at the top (textarea + formatting toolbar +
             visibility dropdown + Cancel/Save), followed by empty state or
             the notes list. Formatting buttons are visual today — plug in a
             tiptap/prosemirror instance later without changing the shell. -->
        <div v-else-if="activeTab === 'Notes'" class="flex-1 min-h-0 flex flex-col overflow-hidden max-w-[880px] mx-auto w-full">
          <!-- Editor card -->
          <div class="rounded-[10px] border-[1.5px] border-[var(--brand-teal)]/60 bg-white overflow-hidden">
            <textarea
              v-model="noteDraft"
              rows="3"
              placeholder="Click here to add a note in this job"
              class="w-full resize-none bg-transparent outline-none text-[14px] leading-[1.55] text-[var(--brand-text)] placeholder:text-[var(--brand-text-quiet)] px-4 pt-3 pb-2"
            />

            <div class="flex items-center justify-between px-2 py-1.5 border-t border-[var(--brand-border-fade)]">
              <!-- Left toolbar: formatting -->
              <div class="flex items-center gap-0.5">
                <button v-for="btn in [
                  { icon: Bold,        label: 'Bold' },
                  { icon: Italic,      label: 'Italic' },
                  { icon: Underline,   label: 'Underline' },
                  { icon: List,        label: 'Bulleted list' },
                  { icon: ListOrdered, label: 'Numbered list' },
                  { icon: ListChecks,  label: 'Checklist' },
                  { icon: Link2,       label: 'Link' },
                ]" :key="btn.label"
                  class="w-8 h-8 rounded-md inline-flex items-center justify-center text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition"
                  :aria-label="btn.label"
                  :title="btn.label"
                >
                  <component :is="btn.icon" class="w-4 h-4" stroke-width="1.7" />
                </button>
              </div>
              <!-- Right toolbar: attach / mention / emoji -->
              <div class="flex items-center gap-0.5">
                <button v-for="btn in [
                  { icon: Paperclip, label: 'Attach file' },
                  { icon: AtSign,    label: 'Mention someone' },
                  { icon: Smile,     label: 'Insert emoji' },
                ]" :key="btn.label"
                  class="w-8 h-8 rounded-md inline-flex items-center justify-center text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition"
                  :aria-label="btn.label"
                  :title="btn.label"
                >
                  <component :is="btn.icon" class="w-4 h-4" stroke-width="1.7" />
                </button>
              </div>
            </div>

            <div class="border-t border-[var(--brand-border-fade)] px-3 py-2">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button
                    class="inline-flex items-center gap-2 px-2 py-1 rounded-md text-[13px] font-semibold text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)]"
                    aria-label="Change note visibility"
                  >
                    <Eye class="w-3.5 h-3.5" stroke-width="1.7" />
                    {{ VIS_LABEL[noteVisibility] }}
                    <ChevronRight class="w-3 h-3 rotate-90" stroke-width="2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-[220px] p-1">
                  <DropdownMenuItem
                    v-for="v in (['everyone','admins','me'] as const)"
                    :key="v"
                    class="flex items-center gap-2 px-2 py-1.5 text-[13.5px] cursor-pointer"
                    @select="noteVisibility = v"
                  >
                    <Eye class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" stroke-width="1.7" />
                    {{ VIS_LABEL[v] }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <!-- Actions row -->
          <div class="flex items-center justify-end gap-2 py-3">
            <button
              class="h-9 px-4 rounded-[9px] text-[13.5px] font-semibold text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition"
              @click="cancelNote"
            >Cancel</button>
            <button
              class="h-9 px-5 rounded-[9px] text-[13.5px] font-bold text-white bg-[var(--brand-teal)] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
              :disabled="!noteDraft.trim()"
              @click="saveNote"
            >Save</button>
          </div>

          <!-- Notes list / empty state -->
          <div v-if="!jobNotes.length" class="flex-1 flex flex-col items-center justify-center text-center pt-4">
            <span class="w-11 h-11 rounded-[10px] bg-[var(--brand-canvas)] inline-flex items-center justify-center text-[var(--brand-text-quiet)] mb-3">
              <MessageSquare class="w-5 h-5" stroke-width="1.7" />
            </span>
            <div class="text-[16px] font-bold text-[var(--brand-text)] mb-1">No notes yet</div>
            <div class="text-[13.5px] text-[var(--brand-text-quiet)]">Click above to add your very first note.</div>
          </div>

          <div v-else class="flex-1 overflow-auto flex flex-col gap-3">
            <article
              v-for="n in jobNotes"
              :key="n.id"
              class="rounded-[10px] border border-[var(--brand-border-light)] bg-white p-4"
            >
              <header class="flex items-center gap-3 pb-2">
                <span class="w-7 h-7 rounded-full bg-[var(--brand-teal)] text-white inline-flex items-center justify-center font-bold text-[11px] shrink-0">{{ n.userInitials }}</span>
                <span class="font-bold text-[13.5px] text-[var(--brand-text)]">{{ n.userName }}</span>
                <span class="flex-1" />
                <button
                  class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition"
                  aria-label="Edit note"
                >
                  <Pencil class="w-3.5 h-3.5" stroke-width="1.7" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <button
                      class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition"
                      aria-label="More"
                    >
                      <MoreVertical class="w-3.5 h-3.5" stroke-width="1.7" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-[160px] p-1">
                    <DropdownMenuItem class="flex items-center gap-2 px-2 py-1.5 text-[13.5px] text-[var(--brand-danger)] cursor-pointer" @select="removeNote(n.id)">
                      <Trash2 class="w-3.5 h-3.5" stroke-width="1.7" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <span class="text-[13px] text-[var(--brand-text-quiet)] ml-1">{{ n.createdAt }}</span>
              </header>
              <div class="text-[14px] text-[var(--brand-text)] whitespace-pre-wrap">{{ n.text }}</div>
              <footer class="flex items-center gap-1 pt-3">
                <button class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition" aria-label="Like">
                  <ThumbsUp class="w-3.5 h-3.5" stroke-width="1.7" />
                </button>
                <button class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition" aria-label="Add reaction">
                  <Smile class="w-3.5 h-3.5" stroke-width="1.7" />
                </button>
                <button class="h-7 px-2 rounded-md text-[13px] font-semibold text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition">
                  Reply
                </button>
              </footer>
            </article>
          </div>
        </div>

        <!-- ─────────── REFERRAL TAB ─────────── -->
        <!-- Per-source share links with a click counter. Uses the same
             --brand-* tokens as the rest of the app; Dialog/Select come
             from shadcn primitives so the identity matches. -->
        <div v-else-if="activeTab === 'Referral'" class="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div class="flex items-center gap-3 pb-4">
            <div class="flex-1 max-w-[420px]">
              <BrandSearchBar v-model="referralSearch" placeholder="Search referrals..." />
            </div>
            <span class="flex-1" />
            <BrandButton variant="primary-teal" @click="openReferralModal">
              <Plus class="w-3.5 h-3.5 mr-1.5" stroke-width="2.5" />
              Add Referral
            </BrandButton>
          </div>

          <div class="flex-1 overflow-auto rounded-[12px] border border-[var(--brand-border-light)] bg-white">
            <table class="w-full border-collapse text-[13.5px]">
              <thead class="bg-[var(--brand-surface-listview)] sticky top-0 z-10">
                <tr class="border-b border-[var(--brand-border)]">
                  <th class="text-left font-semibold text-[var(--brand-text)] px-5 py-3">Referral Name</th>
                  <th class="text-left font-semibold text-[var(--brand-text)] px-5 py-3">Source tag</th>
                  <th class="text-left font-semibold text-[var(--brand-text)] px-5 py-3">Referrals</th>
                  <th class="text-left font-semibold text-[var(--brand-text)] px-5 py-3">Creation Date</th>
                  <th class="text-right font-semibold text-[var(--brand-text)] px-5 py-3 w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(r, i) in filteredReferrals"
                  :key="r.id"
                  class="border-b border-[var(--brand-border-light)] hover:bg-[var(--brand-lime-tint)]/40 transition"
                  :class="i % 2 === 1 ? 'bg-[var(--brand-surface-table-alt)]/60' : ''"
                >
                  <td class="px-5 py-3.5 font-semibold text-[var(--brand-text)]">{{ r.name }}</td>
                  <td class="px-5 py-3.5">
                    <span class="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--brand-text-secondary)] bg-[var(--brand-canvas)] rounded-md px-2 py-1">
                      {{ sourceTagLabel(r.sourceTag) }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 tabular-nums text-[var(--brand-text)]">{{ r.referrals }}</td>
                  <td class="px-5 py-3.5 text-[var(--brand-text-quiet)]">{{ r.createdAt }}</td>
                  <td class="px-5 py-3.5 text-right">
                    <button
                      class="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[13px] font-semibold text-[var(--brand-teal)] hover:bg-[var(--brand-lime-tint)] transition"
                      :aria-label="`Copy link for ${r.name}`"
                      @click="copyReferralLink(r.id, r.shareUrl)"
                    >
                      <Copy class="w-3.5 h-3.5" stroke-width="1.8" />
                      {{ copiedReferralId === r.id ? 'Copied!' : 'Copy Link' }}
                    </button>
                    <button
                      class="w-8 h-8 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] hover:text-[var(--brand-danger)] transition ml-1"
                      :aria-label="`Delete ${r.name}`"
                      @click="removeReferral(r.id)"
                    >
                      <Trash2 class="w-3.5 h-3.5" stroke-width="1.7" />
                    </button>
                  </td>
                </tr>
                <tr v-if="!filteredReferrals.length">
                  <td colspan="5" class="py-16 text-center text-[13.5px] text-[var(--brand-text-quiet)]">
                    <div v-if="referralSearch">No referrals match "{{ referralSearch }}"</div>
                    <template v-else>
                      <span class="w-11 h-11 rounded-[10px] bg-[var(--brand-canvas)] inline-flex items-center justify-center text-[var(--brand-text-quiet)] mb-3">
                        <Share2 class="w-5 h-5" stroke-width="1.7" />
                      </span>
                      <div class="text-[16px] font-bold text-[var(--brand-text)] mb-1">No referrals yet</div>
                      <div>Create a per-source share link to track applications from each channel.</div>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Add Referral modal -->
          <Dialog v-model:open="referralModalOpen">
            <DialogContent class="max-w-[440px] p-0 rounded-[14px] border border-[var(--brand-border-light)] shadow-[0_16px_48px_rgba(0,20,18,0.22)]">
              <DialogHeader class="px-5 pt-5 pb-3 border-b border-[var(--brand-border-fade)]">
                <DialogTitle class="text-[17px] font-bold text-[var(--brand-text)]">Add Referral</DialogTitle>
              </DialogHeader>
              <div class="px-5 py-4 flex flex-col gap-4">
                <div>
                  <label class="block text-[13px] font-semibold text-[var(--brand-text)] mb-1.5">
                    Name <span class="text-[var(--brand-danger)]">*</span>
                  </label>
                  <input
                    v-model="referralForm.name"
                    type="text"
                    placeholder="ex: Careers page banner"
                    class="w-full h-10 px-3.5 rounded-[9px] border border-[var(--brand-border)] bg-white text-[14px] text-[var(--brand-text)] placeholder:text-[var(--brand-text-quiet)] outline-none focus:border-[var(--brand-teal)] transition-colors"
                  >
                </div>
                <div>
                  <label class="block text-[13px] font-semibold text-[var(--brand-text)] mb-1.5">
                    Source tag <span class="text-[var(--brand-danger)]">*</span>
                  </label>
                  <Select v-model="referralForm.sourceTag">
                    <SelectTrigger class="w-full h-10 rounded-[9px] border-[var(--brand-border)] bg-white text-[14px]">
                      <SelectValue placeholder="ex: LinkedIn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="tag in REFERRAL_SOURCE_TAGS" :key="tag.value" :value="tag.value">
                        {{ tag.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div class="px-5 py-4 border-t border-[var(--brand-border-fade)] flex items-center justify-end gap-2">
                <BrandButton variant="outline" @click="referralModalOpen = false">Discard</BrandButton>
                <BrandButton variant="primary-teal" :disabled="!referralFormValid" @click="saveReferral">Add Referral</BrandButton>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <!-- ─────────── REPORTS TAB ─────────── -->
        <JobReportsTab v-else-if="activeTab === 'Reports'" :job-id="jobId" />

        <!-- Other tabs — placeholder while we build them -->
        <div v-else class="flex-1 flex items-center justify-center text-[13.5px] text-[var(--brand-text-quiet)]">
          {{ activeTab }} — coming soon
        </div>
      </template>
    </div>

    <!-- Bulk "Assign to recruiters" from the Pipeline board (E5) -->
    <CandidatesBulkAssignModal
      v-model:open="pipelineBulkAssignOpen"
      :job-id="jobId"
      :candidate-ids="Array.from(selectedIds)"
      @assigned="onPipelineBulkAssigned"
    />
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="pipelineAssignToast"
        class="fixed bottom-7 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2.5 rounded-[12px] px-5 py-3.5 text-[13.5px] font-semibold shadow-[0_8px_32px_rgba(0,0,0,0.22)]"
        style="background: var(--brand-toast-success-bg); color: var(--brand-toast-success-text)"
      >
        {{ pipelineAssignToast }}
      </div>
    </Transition>
  </div>
</template>
