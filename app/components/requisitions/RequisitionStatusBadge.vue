<!-- Requisition status: uppercase solid pill (with icon) or a dot indicator. -->
<script setup lang="ts">
import { Hourglass, Check, Briefcase, X, type LucideIcon } from 'lucide-vue-next'
import { BrandStatusBadge } from '~/components/brand'
import { REQUISITION_STATUS_META, type RequisitionStatus } from '~/types'

const props = defineProps<{ status: RequisitionStatus, variant?: 'solid' | 'dot' }>()
const meta = computed(() => REQUISITION_STATUS_META[props.status])
const v = computed(() => props.variant ?? 'dot')

const SOLID: Record<RequisitionStatus, { bg: string, text: string, icon: LucideIcon | null, border?: string }> = {
  draft: { bg: 'white', text: 'var(--brand-text-muted)', icon: null, border: 'var(--brand-border)' },
  pending: { bg: 'var(--brand-status-pending-bg)', text: 'var(--brand-status-pending-text)', icon: Hourglass },
  approved: { bg: 'var(--brand-status-approved-bg)', text: 'var(--brand-status-approved-text)', icon: Check },
  filled: { bg: 'color-mix(in srgb, var(--brand-status-teal-green) 14%, white)', text: 'var(--brand-status-teal-green)', icon: Briefcase },
  rejected: { bg: 'color-mix(in srgb, var(--brand-danger) 12%, white)', text: 'var(--brand-danger)', icon: X },
  archived: { bg: 'white', text: 'var(--brand-text-muted)', icon: null, border: 'var(--brand-border)' },
}
const s = computed(() => SOLID[props.status])
</script>

<template>
  <span
    v-if="v === 'solid'"
    class="inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] text-[11px] font-bold uppercase tracking-[0.03em]"
    :style="{ background: s.bg, color: s.text, boxShadow: s.border ? `inset 0 0 0 1px ${s.border}` : undefined }"
  >
    <component :is="s.icon" v-if="s.icon" class="w-3 h-3" stroke-width="2.4" />
    {{ meta.label }}
  </span>
  <BrandStatusBadge v-else :label="meta.label" :tone="meta.tone" variant="dot" />
</template>
