<!--
  Smart Distribute — "View & Redistribute Candidates per Recruiter" modal
  (E3, RC-1250). Opens scoped to one recruiter — from a recruiter row's
  kebab menu, the Assigned Candidates count, or the recruiter's name/avatar
  in JobEditorTeamTab.

  Read/filter concerns (table + stage/source filters) never mutate anything
  on their own — only an explicit Reassign confirm or a Redistribute confirm
  writes. Single reassign owns its own recruiter-picker + confirmation step;
  2+ selected candidates disables per-row Reassign and hands off to the
  shared SmartDistributeRedistributeModal, pre-scoped to exactly the
  selected ids via its candidateIds prop.
-->
<script setup lang="ts">
import { X, ArrowRightLeft, ChevronDown, SlidersHorizontal } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogTitle } from '~/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { BrandAvatarInitials, BrandButton, BrandLimeCheckbox } from '~/components/brand'
import CandidateConfirmDialog from '~/components/candidates/CandidateConfirmDialog.vue'
import SmartDistributeRedistributeModal from '~/components/jobs/SmartDistributeRedistributeModal.vue'
import { useSmartDistributeCandidates, useAssignCandidates } from '~/composables/useSmartDistribute'
import type { SmartDistributeCandidate, TeamMember } from '~/types'

interface RedistributeTarget extends TeamMember {
  capacity: number | null
  unlimited: boolean
  assigned: number
}

const props = defineProps<{
  jobId: string
  recruiter: (TeamMember & { assigned: number }) | null
  /** Every other recruiter in the pool — already excludes `recruiter` — used
   * both as the single-reassign picker's option list and as the bulk
   * redistribute flow's targets. */
  otherRecruiters: RedistributeTarget[]
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ reassigned: [count: number] }>()

const route = useRoute()
const recruiterId = computed(() => props.recruiter?.id ?? null)
const { data, isLoading } = useSmartDistributeCandidates(props.jobId, recruiterId)
const assignMutation = useAssignCandidates()

// Local mutable copy, reseeded per recruiter, so a reassign/redistribute can
// remove rows immediately without waiting on a refetch (same pattern as
// settings/locations.vue — seed once from the query, mutate locally).
const localCandidates = ref<SmartDistributeCandidate[]>([])
watch([data, recruiterId], ([v]) => { localCandidates.value = v ? [...v.data] : [] })
// Live count, not the (possibly now-stale) recruiter.assigned prop — a
// reassign/redistribute removes rows from localCandidates immediately, and
// the header should reflect that without waiting on the parent to refetch.
const headerCount = computed(() => isLoading.value ? (props.recruiter?.assigned ?? 0) : localCandidates.value.length)

const STAGE_OPTIONS = ['Applied', 'Screened', 'Interview', 'Offer']
const SOURCE_OPTIONS: { value: SmartDistributeCandidate['assignmentSource']; label: string }[] = [
  { value: 'manual', label: 'Manually assigned' },
  { value: 'self', label: 'Self assigned' },
  { value: 'external', label: 'External' },
]
const SOURCE_LABELS = Object.fromEntries(SOURCE_OPTIONS.map(o => [o.value, o.label])) as Record<string, string>

// ── Filters — pending selections only ever take effect on Apply. Reopening
// the modal (not just a dropdown) resyncs pending from applied, so anything
// picked but never applied is discarded, per spec. ──
const appliedStages = ref<Set<string>>(new Set())
const appliedSources = ref<Set<string>>(new Set())
const pendingStages = ref<Set<string>>(new Set())
const pendingSources = ref<Set<string>>(new Set())
watch(open, (isOpen) => {
  if (isOpen) {
    pendingStages.value = new Set(appliedStages.value)
    pendingSources.value = new Set(appliedSources.value)
  }
})
function togglePendingStage(s: string) {
  const next = new Set(pendingStages.value)
  if (next.has(s)) next.delete(s); else next.add(s)
  pendingStages.value = next
}
function togglePendingSource(s: string) {
  const next = new Set(pendingSources.value)
  if (next.has(s)) next.delete(s); else next.add(s)
  pendingSources.value = next
}
function applyFilters() {
  appliedStages.value = new Set(pendingStages.value)
  appliedSources.value = new Set(pendingSources.value)
}
function clearFilters() {
  appliedStages.value = new Set()
  appliedSources.value = new Set()
  pendingStages.value = new Set()
  pendingSources.value = new Set()
}
const activeFilterCount = computed(() => appliedStages.value.size + appliedSources.value.size)

const candidates = computed(() => localCandidates.value.filter(c =>
  (appliedStages.value.size === 0 || appliedStages.value.has(c.stage))
  && (appliedSources.value.size === 0 || appliedSources.value.has(c.assignmentSource)),
))

// ── Selection — resets whenever the visible (filtered) set changes, e.g.
// switching recruiter or applying new filters. ──
const selectedIds = ref<Set<string>>(new Set())
watch(candidates, () => { selectedIds.value = new Set() })
const allSelected = computed(() => candidates.value.length > 0 && candidates.value.every(c => selectedIds.value.has(c.id)))
function toggleSelectAll(v: boolean) {
  selectedIds.value = v ? new Set(candidates.value.map(c => c.id)) : new Set()
}
function toggleSelect(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id); else next.add(id)
  selectedIds.value = next
}
const bulkMode = computed(() => selectedIds.value.size >= 2)

// ── Single reassign — picker, then an explicit confirmation step. Each
// row's popover is controlled off `reassignPickerOpenFor` (a candidate id,
// not a shared boolean) so opening one row's picker can't also open every
// other row's popover in the same table. ──
const reassignTarget = ref<SmartDistributeCandidate | null>(null)
const reassignPickerOpenFor = ref<string | null>(null)
const reassignConfirmOpen = ref(false)
const reassignToRecruiter = ref<TeamMember | null>(null)
function onReassignPopoverToggle(c: SmartDistributeCandidate, isOpen: boolean) {
  if (isOpen) {
    reassignTarget.value = c
    reassignToRecruiter.value = null
    reassignPickerOpenFor.value = c.id
  } else if (reassignPickerOpenFor.value === c.id) {
    reassignPickerOpenFor.value = null
  }
}
function pickReassignTarget(r: TeamMember) {
  reassignToRecruiter.value = r
  reassignPickerOpenFor.value = null
  reassignConfirmOpen.value = true
}
async function confirmReassign() {
  if (!reassignTarget.value || !reassignToRecruiter.value) return
  const id = reassignTarget.value.id
  await assignMutation.mutateAsync({ candidateIds: [id], recruiterId: reassignToRecruiter.value.id, assignmentSource: 'manual' })
  localCandidates.value = localCandidates.value.filter(c => c.id !== id)
  emit('reassigned', 1)
  reassignTarget.value = null
  reassignToRecruiter.value = null
}

// ── Bulk redistribute — reuses the shared Redistribution flow, pre-scoped
// to exactly the checked ids via its candidateIds prop. ──
const bulkRedistributeOpen = ref(false)
async function onBulkRedistributeConfirm(payload: { count: number; strategy: 'auto' | 'manual'; allocations: Record<string, number> }) {
  const ids = [...selectedIds.value]
  let cursor = 0
  for (const [teamMemberId, n] of Object.entries(payload.allocations)) {
    if (!n) continue
    const slice = ids.slice(cursor, cursor + n)
    cursor += n
    if (slice.length) await assignMutation.mutateAsync({ candidateIds: slice, recruiterId: teamMemberId, assignmentSource: 'manual' })
  }
  localCandidates.value = localCandidates.value.filter(c => !ids.includes(c.id))
  emit('reassigned', ids.length)
  selectedIds.value = new Set()
  bulkRedistributeOpen.value = false
}

function openProfile(candidateId: string) {
  open.value = false
  navigateTo({ path: `/candidates/${candidateId}`, query: { from: route.fullPath } })
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      :show-close-button="false"
      class="p-0 gap-0 border-0 rounded-[20px] max-w-[820px] w-[94vw] max-h-[85vh] shadow-[0_24px_64px_rgba(0,20,18,0.22)] bg-white overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 px-7 pt-6 pb-5 shrink-0">
        <BrandAvatarInitials
          v-if="recruiter"
          :initials="recruiter.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()"
          :bg="recruiter.avatarBg"
          :color="recruiter.avatarText"
          size="xl"
        />
        <div class="flex-1 min-w-0">
          <DialogTitle class="text-[17px] font-bold text-[var(--brand-text)] leading-tight truncate">
            {{ recruiter?.name }}
          </DialogTitle>
          <p class="text-[13px] text-[var(--brand-text-quiet)] mt-0.5">
            {{ headerCount }} candidate{{ headerCount === 1 ? '' : 's' }} assigned
          </p>
        </div>
        <button
          type="button"
          class="w-8 h-8 rounded-[8px] inline-flex items-center justify-center bg-[var(--brand-canvas)] text-[var(--brand-text-secondary)] hover:bg-[var(--brand-lime-tint)] hover:text-[var(--brand-text)] transition"
          aria-label="Close"
          @click="open = false"
        >
          <X class="w-4 h-4" stroke-width="2" />
        </button>
      </div>

      <!-- Filter bar -->
      <div class="flex items-center gap-2 px-7 pb-4 shrink-0">
        <Popover>
          <PopoverTrigger as-child>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-[var(--brand-border)] bg-white text-[12.5px] font-semibold text-[var(--brand-text-secondary)] hover:border-[var(--brand-border-mid)] transition"
            >
              Stage
              <span v-if="pendingStages.size" class="text-[var(--brand-teal-secondary)]">({{ pendingStages.size }})</span>
              <ChevronDown class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" stroke-width="1.7" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" class="w-[200px] p-1.5 rounded-[10px]">
            <button
              v-for="s in STAGE_OPTIONS"
              :key="s"
              type="button"
              class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint)] transition"
              @click="togglePendingStage(s)"
            >
              <BrandLimeCheckbox :model-value="pendingStages.has(s)" class="pointer-events-none shrink-0" />
              {{ s }}
            </button>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger as-child>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-[var(--brand-border)] bg-white text-[12.5px] font-semibold text-[var(--brand-text-secondary)] hover:border-[var(--brand-border-mid)] transition"
            >
              Source
              <span v-if="pendingSources.size" class="text-[var(--brand-teal-secondary)]">({{ pendingSources.size }})</span>
              <ChevronDown class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" stroke-width="1.7" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" class="w-[200px] p-1.5 rounded-[10px]">
            <button
              v-for="o in SOURCE_OPTIONS"
              :key="o.value"
              type="button"
              class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint)] transition"
              @click="togglePendingSource(o.value!)"
            >
              <BrandLimeCheckbox :model-value="pendingSources.has(o.value!)" class="pointer-events-none shrink-0" />
              {{ o.label }}
            </button>
          </PopoverContent>
        </Popover>
        <BrandButton variant="primary-teal" size="sm" @click="applyFilters">
          <SlidersHorizontal class="w-3.5 h-3.5 mr-1" stroke-width="1.8" />Apply
        </BrandButton>
        <button
          v-if="activeFilterCount"
          type="button"
          class="text-[12.5px] font-semibold text-[var(--brand-text-quiet)] hover:text-[var(--brand-danger)] transition"
          @click="clearFilters"
        >Clear filters</button>
      </div>

      <div class="h-px bg-[var(--brand-border-fade)] shrink-0" />

      <!-- Table -->
      <div class="flex-1 overflow-auto">
        <div v-if="isLoading" class="py-10 text-center text-[13px] text-[var(--brand-text-quiet)]">Loading…</div>
        <div v-else-if="!localCandidates.length" class="py-10 text-center text-[13px] text-[var(--brand-text-quiet)]">
          No candidates assigned to this recruiter yet.
        </div>
        <div v-else-if="!candidates.length" class="py-10 text-center text-[13px] text-[var(--brand-text-quiet)]">
          No candidates match the current filters.
        </div>
        <table v-else class="w-full text-left border-collapse">
          <thead class="sticky top-0 bg-white z-10">
            <tr class="border-b border-[var(--brand-border-fade)]">
              <th class="px-7 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)]">
                <span class="inline-flex items-center gap-3">
                  <BrandLimeCheckbox :model-value="allSelected" @update:model-value="toggleSelectAll" />
                  Candidate Name
                </span>
              </th>
              <th class="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)]">Stage</th>
              <th class="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)]">AI Score</th>
              <th class="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)]">Source</th>
              <th class="px-7 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)] text-right">Reassign</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in candidates"
              :key="c.id"
              class="border-b border-[var(--brand-border-hairline)] last:border-b-0 hover:bg-[var(--brand-canvas)] cursor-pointer transition"
              @click="openProfile(c.id)"
            >
              <td class="px-7 py-2.5">
                <span class="inline-flex items-center gap-3 min-w-0">
                  <span @click.stop>
                    <BrandLimeCheckbox :model-value="selectedIds.has(c.id)" @update:model-value="() => toggleSelect(c.id)" />
                  </span>
                  <BrandAvatarInitials :initials="c.initials" :bg="c.avatarColor" color="var(--brand-avatar-text)" size="sm" />
                  <span class="text-[13px] font-bold text-[var(--brand-text)] truncate">{{ c.name }}</span>
                </span>
              </td>
              <td class="px-3 py-2.5 text-[12.5px] text-[var(--brand-text-secondary)] whitespace-nowrap">{{ c.stage }}</td>
              <td class="px-3 py-2.5 text-[12.5px] font-bold text-[var(--brand-text-secondary)] tabular-nums">
                {{ c.evaluationScore ? `${c.evaluationScore}%` : '—' }}
              </td>
              <td class="px-3 py-2.5 text-[12.5px] text-[var(--brand-text-secondary)] whitespace-nowrap">{{ SOURCE_LABELS[c.assignmentSource] }}</td>
              <td class="px-7 py-2.5 text-right" @click.stop>
                <Popover :open="reassignPickerOpenFor === c.id" @update:open="(v) => onReassignPopoverToggle(c, v)">
                  <PopoverTrigger as-child :disabled="bulkMode">
                    <button
                      type="button"
                      :disabled="bulkMode"
                      :title="bulkMode ? '2+ candidates selected — use Redistribute candidates below' : undefined"
                      class="inline-flex items-center gap-1.5 h-8 pl-3 pr-2.5 text-[11.5px] font-semibold rounded-[8px] border-[1.5px] border-[var(--brand-border)] bg-white text-[var(--brand-text-secondary)] hover:border-[var(--brand-teal)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reassign
                      <ArrowRightLeft class="w-3 h-3" stroke-width="2" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" class="w-[220px] p-1.5 rounded-[10px]">
                    <div class="px-2 pt-1 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)]">Reassign to</div>
                    <button
                      v-for="r in otherRecruiters"
                      :key="r.id"
                      type="button"
                      class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint)] transition"
                      @click="pickReassignTarget(r)"
                    >
                      <BrandAvatarInitials :initials="r.name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase()" :bg="r.avatarBg" :color="r.avatarText" size="xs" />
                      <span class="flex-1 min-w-0 truncate text-left">{{ r.name }}</span>
                    </button>
                    <p v-if="!otherRecruiters.length" class="px-2.5 py-2 text-[12.5px] text-[var(--brand-text-quiet)]">No other recruiters in the pool.</p>
                  </PopoverContent>
                </Popover>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bulk selection footer — appears at 2+ selected, per-row Reassign
           disables at the same threshold. -->
      <div
        v-if="bulkMode"
        class="flex items-center gap-3 px-7 py-3.5 border-t border-[var(--brand-border-fade)] bg-[var(--brand-canvas)] shrink-0"
      >
        <span class="text-[13px] font-semibold text-[var(--brand-text)]">{{ selectedIds.size }} selected</span>
        <button
          type="button"
          class="text-[12.5px] font-semibold text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)] transition"
          @click="selectedIds = new Set()"
        >Clear selection</button>
        <span class="flex-1" />
        <BrandButton variant="primary-teal" size="sm" @click="bulkRedistributeOpen = true">Redistribute candidates</BrandButton>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Single reassign — confirmation step before applying. -->
  <CandidateConfirmDialog
    v-model:open="reassignConfirmOpen"
    :title="`Reassign ${reassignTarget?.name ?? 'candidate'}?`"
    :description="`${reassignTarget?.name ?? 'This candidate'} will move from ${recruiter?.name} to ${reassignToRecruiter?.name}.`"
    confirm-label="Reassign"
    tone="success"
    :icon="ArrowRightLeft"
    @confirm="confirmReassign"
  />

  <!-- Bulk redistribute — shared flow, pre-scoped to the checked ids. -->
  <SmartDistributeRedistributeModal
    v-model:open="bulkRedistributeOpen"
    :source="recruiter"
    :targets="otherRecruiters"
    :candidate-ids="[...selectedIds]"
    @confirm="onBulkRedistributeConfirm"
  />
</template>
