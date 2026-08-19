<!--
  Hiring Timeline (E6). Real date logic per requisition:
    • bar START  = createdAt  (when the requisition was requested)
    • ◆ milestone = expectedJoinDate ("expected to join")
    • ✓ milestone = fulfilledAt ("joined" — actual, filled reqs only)
  The month axis is computed from the data range; a dark segment (request → joined)
  shows how far along the hire is.
-->
<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import RequisitionStatusBadge from './RequisitionStatusBadge.vue'
import type { Requisition } from '~/types'

const props = defineProps<{ requisitions: Requisition[] }>()
const emit = defineEmits<{ open: [id: string] }>()

const DOT: Record<string, string> = {
  draft: 'var(--brand-text-quiet)', pending: 'var(--brand-status-pending-text)',
  approved: 'var(--brand-status-approved-text)', filled: 'var(--brand-status-teal-green)',
  rejected: 'var(--brand-danger)', archived: 'var(--brand-text-quiet)',
}

const items = computed(() => props.requisitions
  .filter(r => r.expectedJoinDate)
  .map(r => ({ r, color: DOT[r.status], req: Date.parse(r.createdAt), exp: Date.parse(r.expectedJoinDate), done: r.fulfilledAt ? Date.parse(r.fulfilledAt) : null }))
  .sort((a, b) => a.exp - b.exp))

const range = computed(() => {
  if (!items.value.length) return null
  let min = Infinity, max = -Infinity
  for (const it of items.value) { min = Math.min(min, it.req); max = Math.max(max, it.exp, it.done ?? it.exp) }
  const s = new Date(min); const e = new Date(max)
  return { start: Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1), end: Date.UTC(e.getUTCFullYear(), e.getUTCMonth() + 1, 1) }
})
function pct(ms: number) { const r = range.value!; return ((ms - r.start) / (r.end - r.start)) * 100 }

const months = computed(() => {
  if (!range.value) return []
  const out: { key: string, label: string, year: number, left: number, showYear: boolean }[] = []
  let y = new Date(range.value.start).getUTCFullYear(), m = new Date(range.value.start).getUTCMonth()
  while (Date.UTC(y, m, 1) < range.value.end) {
    const t = Date.UTC(y, m, 1)
    out.push({ key: `${y}-${m}`, label: new Date(t).toLocaleDateString('en-US', { month: 'short' }), year: y, left: pct(t), showYear: m === 0 || out.length === 0 })
    m++; if (m > 11) { m = 0; y++ }
  }
  return out
})

const todayLeft = computed(() => {
  const now = Date.now()
  if (!range.value || now < range.value.start || now > range.value.end) return null
  return pct(now)
})
function fmtD(ms: number) { return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
</script>

<template>
  <div class="rounded-[14px] border border-[var(--brand-border-light)] overflow-hidden bg-white">
    <template v-if="items.length">
      <!-- Month header -->
      <div class="flex bg-[var(--brand-surface-listview)] border-b border-[var(--brand-border-light)]">
        <div class="w-[240px] shrink-0 px-4 py-2.5 text-[12.5px] font-semibold text-[var(--brand-text-quiet)] uppercase tracking-wide">Requisition</div>
        <div class="flex-1 relative h-9">
          <div v-for="mo in months" :key="mo.key" class="absolute top-2.5 text-[12px] font-semibold text-[var(--brand-text-quiet)] whitespace-nowrap" :style="{ left: `${mo.left}%` }">
            <span class="pl-1.5">{{ mo.label }}<span v-if="mo.showYear" class="text-[var(--brand-text-faint)]"> ’{{ String(mo.year).slice(2) }}</span></span>
          </div>
        </div>
      </div>

      <!-- Body -->
      <div class="relative">
        <!-- gridlines + today line span all rows -->
        <div class="pointer-events-none absolute left-[240px] right-0 top-0 bottom-0 z-0">
          <div v-for="mo in months" :key="mo.key" class="absolute top-0 bottom-0 w-px bg-[var(--brand-border-fade)]" :style="{ left: `${mo.left}%` }" />
          <div v-if="todayLeft != null" class="absolute top-0 bottom-0 w-px bg-[color-mix(in_srgb,var(--brand-teal)_55%,white)]" :style="{ left: `${todayLeft}%` }" />
        </div>

        <button
          v-for="it in items"
          :key="it.r.id"
          type="button"
          class="relative z-10 flex items-stretch w-full text-left border-t border-[var(--brand-border-fade)] transition hover:bg-[var(--brand-canvas)]/50"
          @click="emit('open', it.r.id)"
        >
          <div class="w-[240px] shrink-0 px-4 py-2.5 min-w-0">
            <div class="text-[13.5px] font-semibold text-[var(--brand-text)] truncate">{{ it.r.title }}</div>
            <div class="flex items-center gap-2 mt-0.5">
              <RequisitionStatusBadge :status="it.r.status" variant="dot" />
              <span class="text-[11.5px] text-[var(--brand-text-quiet)] tabular-nums">{{ it.r.hiresCount }}/{{ it.r.openingsTotal }} hired</span>
            </div>
          </div>
          <div class="flex-1 relative min-h-[54px]">
            <!-- planned connector: request → expected -->
            <div class="absolute top-1/2 -translate-y-1/2 h-[3px] rounded-full" :style="{ left: `${pct(it.req)}%`, width: `${pct(it.exp) - pct(it.req)}%`, background: `color-mix(in srgb, ${it.color} 30%, white)` }" />
            <!-- actual connector: request → joined -->
            <div v-if="it.done != null" class="absolute top-1/2 -translate-y-1/2 h-[3px] rounded-full" :style="{ left: `${pct(it.req)}%`, width: `${pct(it.done) - pct(it.req)}%`, background: it.color }" />
            <!-- request start dot -->
            <span class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ring-2 ring-white" :style="{ left: `${pct(it.req)}%`, background: it.color }" :title="`Requested · ${fmtD(it.req)}`" />
            <!-- expected-to-join diamond -->
            <span class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[11px] h-[11px] rotate-45 bg-white ring-2" :style="{ left: `${pct(it.exp)}%`, '--tw-ring-color': it.color }" :title="`Expected to join · ${fmtD(it.exp)}`" />
            <!-- joined check -->
            <span v-if="it.done != null" class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full grid place-items-center ring-2 ring-white" style="background: var(--brand-status-teal-green)" :title="`Joined · ${fmtD(it.done)}`">
              <Check class="w-2.5 h-2.5 text-white" stroke-width="3.5" />
            </span>
          </div>
        </button>
      </div>

      <!-- Legend -->
      <div class="flex items-center flex-wrap gap-x-5 gap-y-1.5 px-4 py-3 border-t border-[var(--brand-border-light)] bg-[var(--brand-surface-listview)] text-[12px] text-[var(--brand-text-secondary)]">
        <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[var(--brand-text-secondary)] ring-2 ring-white" /> Requested (start)</span>
        <span class="inline-flex items-center gap-1.5"><span class="w-[11px] h-[11px] rotate-45 bg-white ring-2" style="--tw-ring-color: var(--brand-text-secondary)" /> Expected to join</span>
        <span class="inline-flex items-center gap-1.5"><span class="w-4 h-4 rounded-full grid place-items-center" style="background: var(--brand-status-teal-green)"><Check class="w-2.5 h-2.5 text-white" stroke-width="3.5" /></span> Joined</span>
        <span v-if="todayLeft != null" class="inline-flex items-center gap-1.5"><span class="w-px h-3.5 bg-[color-mix(in_srgb,var(--brand-teal)_55%,white)]" /> Today</span>
      </div>
    </template>

    <div v-else class="px-6 py-16 text-center">
      <div class="text-[14px] font-bold text-[var(--brand-text)]">Nothing to plot yet</div>
      <div class="text-[13px] text-[var(--brand-text-quiet)] mt-1">Requisitions appear once they have a target joining month.</div>
    </div>
  </div>
</template>
