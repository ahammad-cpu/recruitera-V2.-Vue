<!--
  Planning grid — grouped Department → Sub-Department → Job Title, showing
  Current HC / Budgeted / Need to Hire (total) with an expandable monthly panel.
-->
<script setup lang="ts">
import { ChevronRight, MapPin } from 'lucide-vue-next'
import type { ManpowerProject } from '~/types'

const props = defineProps<{ project: ManpowerProject }>()
const expanded = reactive<Record<string, boolean>>({})
function toggle(id: string) { expanded[id] = !expanded[id] }

function pct(l: { currentHC: number, budgeted: number }) {
  return l.budgeted ? Math.min(100, Math.round((l.currentHC / l.budgeted) * 100)) : 0
}
</script>

<template>
  <div class="rounded-[14px] border border-[var(--brand-border-light)] overflow-hidden bg-white">
    <!-- Column header -->
    <div class="grid gap-2 px-4 py-2.5 bg-[var(--brand-surface-listview)] border-b border-[var(--brand-border-light)] text-[12px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)]" style="grid-template-columns:1fr 110px 110px 110px 150px">
      <div>Job title</div>
      <div class="text-center">Current HC</div>
      <div class="text-center">Budgeted</div>
      <div class="text-center">Need to hire</div>
      <div>Target achieved</div>
    </div>

    <template v-for="g in project.groups" :key="g.id">
      <!-- Group header -->
      <div class="px-4 py-2 bg-[var(--brand-canvas)] border-b border-[var(--brand-border-fade)] text-[12.5px] font-bold text-[var(--brand-text-secondary)]">
        {{ g.department }} <span class="text-[var(--brand-text-quiet)] font-medium">· {{ g.subDepartment }}</span>
      </div>

      <template v-for="l in g.lines" :key="l.id">
        <div class="grid gap-2 items-center px-4 py-2.5 border-b border-[var(--brand-border-fade)] hover:bg-[var(--brand-canvas)]/40 transition cursor-pointer" style="grid-template-columns:1fr 110px 110px 110px 150px" @click="toggle(l.id)">
          <div class="flex items-center gap-2 min-w-0">
            <ChevronRight class="w-4 h-4 text-[var(--brand-text-quiet)] shrink-0 transition-transform" :class="expanded[l.id] ? 'rotate-90' : ''" />
            <div class="min-w-0">
              <div class="text-[13.5px] font-semibold text-[var(--brand-text)] truncate">{{ l.jobTitle }}</div>
              <div class="text-[11.5px] text-[var(--brand-text-quiet)] inline-flex items-center gap-1"><MapPin class="w-3 h-3" /> {{ l.location }}</div>
            </div>
          </div>
          <div class="text-center text-[14px] font-bold text-[var(--brand-text)] tabular-nums">{{ l.currentHC }}</div>
          <div class="text-center text-[14px] font-bold text-[var(--brand-text)] tabular-nums">{{ l.budgeted }}</div>
          <div class="text-center">
            <span class="inline-flex items-center justify-center min-w-[26px] h-6 px-2 rounded-full text-[12.5px] font-bold tabular-nums" :class="l.needToHire > 0 ? 'bg-[var(--brand-status-pending-bg)] text-[var(--brand-status-pending-text)]' : 'bg-[var(--brand-status-approved-bg)] text-[var(--brand-status-approved-text)]'">{{ l.needToHire }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 rounded-full bg-[var(--brand-canvas)] overflow-hidden">
              <div class="h-full rounded-full bg-[var(--brand-teal-secondary)]" :style="{ width: `${pct(l)}%` }" />
            </div>
            <span class="text-[12px] font-semibold text-[var(--brand-text-secondary)] tabular-nums w-9 text-right">{{ pct(l) }}%</span>
          </div>
        </div>

        <!-- Monthly breakdown -->
        <div v-if="expanded[l.id]" class="px-4 py-3 bg-[var(--brand-canvas)] border-b border-[var(--brand-border-fade)]">
          <div class="rounded-lg border border-[var(--brand-border-light)] overflow-hidden bg-white">
            <div class="grid grid-cols-4 gap-2 px-3 py-1.5 bg-[var(--brand-surface-listview)] text-[11px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)]">
              <div>Month</div><div class="text-center">Budgeted</div><div class="text-center">Current</div><div class="text-center">Need to hire</div>
            </div>
            <div v-for="m in l.monthly" :key="m.month" class="grid grid-cols-4 gap-2 px-3 py-1.5 border-t border-[var(--brand-border-fade)] text-[12.5px]">
              <div class="font-semibold text-[var(--brand-text)]">{{ m.month }}</div>
              <div class="text-center tabular-nums text-[var(--brand-text-secondary)]">{{ m.budgeted }}</div>
              <div class="text-center tabular-nums text-[var(--brand-text-secondary)]">{{ m.current }}</div>
              <div class="text-center tabular-nums font-semibold" :class="m.needToHire > 0 ? 'text-[var(--brand-status-pending-text)]' : 'text-[var(--brand-text-quiet)]'">{{ m.needToHire }}</div>
            </div>
          </div>
        </div>
      </template>
    </template>

    <div v-if="!project.groups.length" class="px-6 py-12 text-center">
      <div class="text-[14px] font-bold text-[var(--brand-text)]">No plan lines yet</div>
      <div class="text-[13px] text-[var(--brand-text-quiet)] mt-1">Bulk-upload job titles &amp; allocations to build this plan.</div>
    </div>
  </div>
</template>
