<!--
  Smart Distribute — Redistribute flow (E3). Reused two ways:
    · voluntary, from a recruiter row's kebab menu ("Redistribute")
    · forced, as the first step of Remove when the recruiter still has
      assigned candidates (`removeAfter` — E3 UC-07: reassignment is
      required before removal can complete)

  Automatic mode is a real proportional-to-headroom split so it visibly
  respects capacity (heavier weight to recruiters with more room left,
  zero weight to anyone already at their limit); Manual mode is the
  spec'd per-recruiter numeric entry, validated to sum to the chosen count.
-->
<script setup lang="ts">
import { X, Users } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogTitle } from '~/components/ui/dialog'
import { BrandButton, BrandAvatarInitials } from '~/components/brand'
import { autoAllocate } from '~/utils/autoAllocate'
import type { TeamMember } from '~/types'

interface Target extends TeamMember {
  capacity: number | null
  unlimited: boolean
  assigned: number
}

const props = defineProps<{
  source: (TeamMember & { assigned: number }) | null
  targets: Target[]
  removeAfter?: boolean
  /** RC-1250 bulk-select mode: an explicit, already-chosen set of candidate
   * ids (from the per-recruiter candidates table's row checkboxes) instead
   * of an admin-typed count. Locks the count field to this exact size — no
   * manual edit, no "All" shortcut — since the caller already knows exactly
   * which candidates are being moved. */
  candidateIds?: string[]
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  confirm: [payload: { count: number; strategy: 'auto' | 'manual'; allocations: Record<string, number> }]
}>()

const count = ref(0)
const strategy = ref<'auto' | 'manual'>('auto')
const manualAllocations = ref<Record<string, number>>({})
const fixedCount = computed(() => props.candidateIds?.length ?? null)

watch(open, (isOpen) => {
  if (isOpen && props.source) {
    count.value = fixedCount.value ?? props.source.assigned
    strategy.value = 'auto'
    manualAllocations.value = Object.fromEntries(props.targets.map(t => [t.id, 0]))
  }
})

function setAll() {
  count.value = props.source?.assigned ?? 0
}

// Automatic preview — headroom-weighted so it's not just an even split
// into recruiters who are already full. Always sums to `count` exactly
// (see autoAllocate.ts — naive proportional rounding can zero everyone
// out for a small count against a large headroom pool).
const autoPreview = computed(() => autoAllocate(count.value, props.targets))

const manualTotal = computed(() => Object.values(manualAllocations.value).reduce((s, n) => s + (Number(n) || 0), 0))
const manualValid = computed(() => manualTotal.value === count.value && count.value > 0)
const canConfirm = computed(() =>
  props.targets.length > 0
  && count.value > 0
  && count.value <= (props.source?.assigned ?? 0)
  && (strategy.value === 'auto' || manualValid.value),
)

function confirm() {
  if (!canConfirm.value) return
  const allocations = strategy.value === 'auto'
    ? autoPreview.value
    : { ...manualAllocations.value }
  emit('confirm', { count: count.value, strategy: strategy.value, allocations })
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
            <template v-if="fixedCount !== null">Redistribute {{ fixedCount }} selected candidate{{ fixedCount === 1 ? '' : 's' }}</template>
            <template v-else-if="removeAfter">Remove {{ source?.name }}</template>
            <template v-else>Redistribute {{ source?.name }}'s candidates</template>
          </DialogTitle>
          <p class="text-[13px] text-[var(--brand-text-quiet)] mt-1.5 leading-relaxed">
            <template v-if="fixedCount !== null">
              Move the selected candidates from {{ source?.name }} to the rest of the team. Each keeps its current pipeline stage.
            </template>
            <template v-else-if="removeAfter">
              {{ source?.assigned }} candidates are still assigned to them — reassign these first, then they'll be removed from Auto-Distribute.
            </template>
            <template v-else>
              Move candidates from {{ source?.name }} to the rest of the team.
            </template>
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
        <!-- Count -->
        <div v-if="fixedCount === null">
          <label class="block text-[13px] font-bold text-[var(--brand-text)] mb-2">How many candidates?</label>
          <div class="flex items-center gap-2.5">
            <input
              v-model.number="count"
              type="number"
              min="0"
              :max="source?.assigned ?? 0"
              class="w-24 h-10 px-3 text-center text-[14px] font-bold rounded-[9px] border-[1.5px] border-[var(--brand-border)] bg-white focus:border-[var(--brand-teal)] focus:outline-none transition tabular-nums"
            >
            <button
              type="button"
              class="h-10 px-3.5 rounded-[9px] text-[12.5px] font-bold border-[1.5px] border-[var(--brand-border)] text-[var(--brand-text-secondary)] hover:border-[var(--brand-teal)] hover:bg-[var(--brand-lime-tint)] transition"
              @click="setAll"
            >All ({{ source?.assigned ?? 0 }})</button>
          </div>
        </div>
        <div v-else class="text-[13px] text-[var(--brand-text-secondary)]">
          <span class="font-bold text-[var(--brand-text)]">{{ fixedCount }}</span> candidate{{ fixedCount === 1 ? '' : 's' }} selected for redistribution.
        </div>

        <!-- Strategy -->
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
              <div class="text-[11.5px] text-[var(--brand-text-quiet)] mt-0.5">Uses the job's current distribution rules and capacity.</div>
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

        <!-- Per-recruiter breakdown -->
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
          <div v-if="!targets.length" class="text-[12.5px] text-[var(--brand-danger-text)] bg-[var(--brand-danger-bg)] rounded-[9px] px-3 py-2.5">
            No other recruiters are in the Auto-Distribute pool — add one before redistributing.
          </div>
          <div v-else class="flex flex-col gap-1.5">
            <div v-for="t in targets" :key="t.id" class="flex items-center gap-2.5 px-3 py-2 rounded-[9px] border border-[var(--brand-border-fade)]">
              <BrandAvatarInitials :initials="t.name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase()" :bg="t.avatarBg" :color="t.avatarText" size="sm" />
              <span class="flex-1 min-w-0 text-[12.5px] font-bold text-[var(--brand-text)] truncate">{{ t.name }}</span>
              <span class="text-[11px] text-[var(--brand-text-quiet)] shrink-0">{{ t.unlimited ? 'Unlimited' : `${t.assigned}/${t.capacity}` }}</span>
              <span v-if="strategy === 'auto'" class="w-10 text-right text-[13px] font-bold text-[var(--brand-teal-secondary)] tabular-nums shrink-0">
                +{{ autoPreview[t.id] ?? 0 }}
              </span>
              <input
                v-else
                v-model.number="manualAllocations[t.id]"
                type="number"
                min="0"
                class="w-16 h-8 px-2 text-center text-[12.5px] font-bold rounded-[7px] border-[1.5px] border-[var(--brand-border)] bg-white focus:border-[var(--brand-teal)] focus:outline-none transition tabular-nums shrink-0"
              >
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 px-7 py-4 border-t border-[var(--brand-border-fade)] bg-white">
        <BrandButton variant="outline" @click="open = false">Cancel</BrandButton>
        <BrandButton variant="primary-teal" :disabled="!canConfirm" @click="confirm">
          {{ removeAfter ? 'Redistribute & Remove' : 'Redistribute' }}
        </BrandButton>
      </div>
    </DialogContent>
  </Dialog>
</template>
