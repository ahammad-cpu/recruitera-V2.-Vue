<!-- Global filter bar — applies across all 8 General Reports sections
     simultaneously, selections persist via reports.store.ts (BRD §2.6). -->
<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next'
import GlobalDateRangePicker from './GlobalDateRangePicker.vue'
import ReportsMultiSelectFilter from './ReportsMultiSelectFilter.vue'
import { useReportsStore } from '~/stores/reports.store'
import { useReportFilterOptions } from '~/composables/useReports'

const store = useReportsStore()
const { data: options } = useReportFilterOptions()

const departmentOptions = computed(() => (options.value?.departments ?? []).map(d => ({ value: d, label: d })))
const jobOptions = computed(() => (options.value?.jobs ?? []).map(j => ({ value: j.id, label: j.title })))
const recruiterOptions = computed(() => (options.value?.recruiters ?? []).map(r => ({ value: r.id, label: r.name })))
const hiringManagerOptions = computed(() => (options.value?.hiringManagers ?? []).map(r => ({ value: r.id, label: r.name })))
const talentPoolOptions = computed(() => (options.value?.talentPools ?? []).map(t => ({ value: t, label: t })))
const showCollarToggle = computed(() => (options.value?.hasBlueCollar && options.value?.hasWhiteCollar) ?? false)
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap px-6 py-3 border-b border-[var(--brand-border-fade)] bg-[var(--brand-canvas)]">
    <GlobalDateRangePicker v-model="store.dateRange" />
    <ReportsMultiSelectFilter v-model="store.departments" label="Department" :options="departmentOptions" />
    <ReportsMultiSelectFilter v-model="store.jobIds" label="Job" :options="jobOptions" />
    <ReportsMultiSelectFilter v-model="store.recruiterIds" label="Recruiter" :options="recruiterOptions" />
    <ReportsMultiSelectFilter v-model="store.hiringManagerIds" label="Hiring Manager" :options="hiringManagerOptions" />
    <ReportsMultiSelectFilter v-model="store.talentPoolIds" label="Talent Pool" :options="talentPoolOptions" />

    <div v-if="showCollarToggle" class="inline-flex items-center rounded-[10px] border border-[var(--brand-border)] bg-[var(--brand-surface-white)] p-0.5">
      <button
        v-for="opt in (['all', 'white', 'blue'] as const)"
        :key="opt"
        class="h-8 px-3 rounded-[8px] text-[13px] font-medium capitalize transition-colors"
        :class="store.collar === opt ? 'bg-[var(--brand-lime-active-bg-strong)] text-[var(--brand-olive)] font-bold' : 'text-[var(--brand-text-quiet)] hover:bg-black/[.04]'"
        @click="store.collar = opt"
      >
        {{ opt === 'all' ? 'All' : `${opt} collar` }}
      </button>
    </div>

    <button
      v-if="store.activeFilterCount > 0"
      class="flex items-center gap-1.5 h-9 px-2.5 rounded-[10px] text-[13px] font-medium text-[var(--brand-text-quiet)] hover:bg-black/[.04] transition-colors"
      @click="store.resetFilters()"
    >
      <RotateCcw class="w-3.5 h-3.5" />
      Clear filters
    </button>
  </div>
</template>
