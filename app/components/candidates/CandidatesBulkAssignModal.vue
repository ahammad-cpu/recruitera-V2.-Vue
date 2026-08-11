<!--
  Bulk "Assign to recruiters" (E5) — triggered from CandidatesToolbar's
  More menu when candidates are selected on a job with Smart Distribute
  enabled. Reuses the same Automatic/Manual shape as
  SmartDistributeRedistributeModal (the spec explicitly calls for reusing
  that modal's UI "with descriptions rewritten for assigning, not
  redistributing") but targets unassigned candidates instead of an
  existing recruiter's pool.
-->
<script setup lang="ts">
import { X, Users } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogTitle } from '~/components/ui/dialog'
import { BrandButton, BrandAvatarInitials } from '~/components/brand'
import { useAssignCandidates, useSmartDistributeConfig } from '~/composables/useSmartDistribute'
import { useTeamMembers } from '~/composables/useTeam'
import { autoAllocate } from '~/utils/autoAllocate'
import type { TeamMember } from '~/types'

const props = defineProps<{
  jobId: string
  candidateIds: string[]
}>()
const count = computed(() => props.candidateIds.length)
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  assigned: []
}>()

const { data: teamData } = useTeamMembers()
const { data: distConfig } = useSmartDistributeConfig(props.jobId)
const assignMutation = useAssignCandidates()

const recruiters = computed(() => {
  const roster = teamData.value?.data ?? []
  const rows = distConfig.value?.recruiters ?? []
  return rows
    .map(r => ({ ...roster.find(m => m.id === r.teamMemberId), ...r }))
    .filter((r): r is TeamMember & typeof rows[number] => !!r.name)
})

const strategy = ref<'auto' | 'manual'>('auto')
const manualAllocations = ref<Record<string, number>>({})
watch(open, (isOpen) => {
  if (isOpen) {
    strategy.value = 'auto'
    manualAllocations.value = Object.fromEntries(recruiters.value.map(r => [r.teamMemberId, 0]))
  }
})

// Automatic — headroom-weighted, same idea as the Redistribute modal so
// the two "split N candidates across the team" experiences feel the
// same (and share the same sums-to-exactly-`count` guarantee — see
// autoAllocate.ts).
const autoPreview = computed(() => autoAllocate(
  count.value,
  recruiters.value.map(r => ({ id: r.teamMemberId, unlimited: r.unlimited, capacity: r.capacity, assigned: r.assigned })),
))

const manualTotal = computed(() => Object.values(manualAllocations.value).reduce((s, n) => s + (Number(n) || 0), 0))
const manualValid = computed(() => manualTotal.value === count.value && count.value > 0)
const canConfirm = computed(() =>
  recruiters.value.length > 0
  && count.value > 0
  && (strategy.value === 'auto' || manualValid.value),
)

async function confirm() {
  if (!canConfirm.value) return
  const allocations = strategy.value === 'auto'
    ? autoPreview.value
    : { ...manualAllocations.value }
  let cursor = 0
  for (const [recruiterId, n] of Object.entries(allocations)) {
    if (!n) continue
    const slice = props.candidateIds.slice(cursor, cursor + n)
    cursor += n
    if (slice.length) await assignMutation.mutateAsync({ candidateIds: slice, recruiterId })
  }
  emit('assigned')
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      :show-close-button="false"
      class="p-0 gap-0 border-0 rounded-[20px] max-w-[520px] w-[92vw] shadow-[0_24px_64px_rgba(0,20,18,0.22)] bg-white overflow-hidden"
    >
      <div class="flex items-start gap-3 px-7 pt-6 pb-5">
        <div class="flex-1 min-w-0">
          <DialogTitle class="text-[18px] font-bold text-[var(--brand-text)] leading-tight">
            Assign {{ count }} candidate{{ count === 1 ? '' : 's' }} to recruiters
          </DialogTitle>
          <p class="text-[13px] text-[var(--brand-text-quiet)] mt-1.5 leading-relaxed">
            Uses this job's Auto-Distribute pool. Selected candidates keep their current stage.
          </p>
        </div>
        <button
          type="button"
          class="w-8 h-8 rounded-[8px] inline-flex items-center justify-center bg-[var(--brand-canvas)] text-[var(--brand-text-secondary)] hover:bg-[var(--brand-lime-tint)] hover:text-[var(--brand-text)] transition shrink-0"
          aria-label="Close"
          @click="open = false"
        >
          <X class="w-4 h-4" stroke-width="2" />
        </button>
      </div>

      <div class="h-px bg-[var(--brand-border-fade)]" />

      <div class="px-7 py-6 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">
        <div v-if="!recruiters.length" class="text-[12.5px] text-[var(--brand-danger-text)] bg-[var(--brand-danger-bg)] rounded-[9px] px-3 py-2.5">
          This job has no recruiters in its Auto-Distribute pool yet — add some from the Team tab first.
        </div>
        <template v-else>
          <div>
            <label class="block text-[13px] font-bold text-[var(--brand-text)] mb-2">Strategy</label>
            <div class="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                class="text-left rounded-[10px] border-[1.5px] p-3.5 transition"
                :class="strategy === 'auto' ? 'border-[var(--brand-teal)] bg-[var(--brand-lime-tint)]' : 'border-[var(--brand-border)] bg-white hover:border-[var(--brand-teal)]'"
                @click="strategy = 'auto'"
              >
                <div class="text-[13px] font-bold text-[var(--brand-text)]">Automatic</div>
                <div class="text-[11.5px] text-[var(--brand-text-quiet)] mt-0.5">Split using each recruiter's current capacity.</div>
              </button>
              <button
                type="button"
                class="text-left rounded-[10px] border-[1.5px] p-3.5 transition"
                :class="strategy === 'manual' ? 'border-[var(--brand-teal)] bg-[var(--brand-lime-tint)]' : 'border-[var(--brand-border)] bg-white hover:border-[var(--brand-teal)]'"
                @click="strategy = 'manual'"
              >
                <div class="text-[13px] font-bold text-[var(--brand-text)]">Manual</div>
                <div class="text-[11.5px] text-[var(--brand-text-quiet)] mt-0.5">Choose exactly how many each recruiter gets.</div>
              </button>
            </div>
          </div>

          <div>
            <div class="flex items-center gap-2 mb-2.5">
              <Users class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" stroke-width="2" />
              <span class="text-[12px] font-bold text-[var(--brand-text-secondary)]">
                {{ strategy === 'auto' ? 'Preview' : 'Enter amounts' }}
              </span>
              <span
                v-if="strategy === 'manual'"
                class="ml-auto text-[11.5px] font-bold tabular-nums"
                :class="manualValid ? 'text-[var(--brand-success)]' : 'text-[var(--brand-danger-text)]'"
              >{{ manualTotal }} / {{ count }}</span>
            </div>
            <div class="flex flex-col gap-1.5">
              <div v-for="r in recruiters" :key="r.teamMemberId" class="flex items-center gap-2.5 px-3 py-2 rounded-[9px] border border-[var(--brand-border-fade)]">
                <BrandAvatarInitials :initials="r.name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase()" :bg="r.avatarBg" :color="r.avatarText" size="sm" />
                <span class="flex-1 min-w-0 text-[12.5px] font-bold text-[var(--brand-text)] truncate">{{ r.name }}</span>
                <span class="text-[11px] text-[var(--brand-text-quiet)] shrink-0">{{ r.unlimited ? 'Unlimited' : `${r.assigned}/${r.capacity}` }}</span>
                <span v-if="strategy === 'auto'" class="w-10 text-right text-[13px] font-bold text-[var(--brand-teal-secondary)] tabular-nums shrink-0">
                  +{{ autoPreview[r.teamMemberId] ?? 0 }}
                </span>
                <input
                  v-else
                  v-model.number="manualAllocations[r.teamMemberId]"
                  type="number"
                  min="0"
                  class="w-16 h-8 px-2 text-center text-[12.5px] font-bold rounded-[7px] border-[1.5px] border-[var(--brand-border)] bg-white focus:border-[var(--brand-teal)] focus:outline-none transition tabular-nums shrink-0"
                >
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="flex items-center justify-end gap-2 px-7 py-4 border-t border-[var(--brand-border-fade)] bg-white">
        <BrandButton variant="outline" @click="open = false">Cancel</BrandButton>
        <BrandButton variant="primary-teal" :disabled="!canConfirm" @click="confirm">Assign</BrandButton>
      </div>
    </DialogContent>
  </Dialog>
</template>
