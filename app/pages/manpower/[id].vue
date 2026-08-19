<script setup lang="ts">
import { ArrowLeft, Building2, CalendarDays, Users, Upload, Download } from 'lucide-vue-next'
import { BrandButton } from '~/components/brand'
import ManpowerGrid from '~/components/manpower/ManpowerGrid.vue'
import { useManpowerProject } from '~/composables/useManpower'

definePageMeta({ layout: 'default' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const { data: p } = useManpowerProject(id)

const stats = computed(() => p.value ? [
  { label: 'Current employees', value: p.value.currentHeadcount },
  { label: 'Budgeted', value: p.value.budgeted },
  { label: 'Need to hire', value: p.value.needToHire, tone: 'pending' },
  { label: 'Target achieved', value: `${p.value.targetAchieved}%`, tone: 'teal' },
] : [])
</script>

<template>
  <div class="flex flex-col h-full min-w-0 overflow-hidden bg-[var(--brand-surface-white)] border-t border-[var(--brand-border)]">
    <template v-if="p">
      <div class="px-6 pt-5 pb-3 flex items-start justify-between gap-4">
        <div class="flex items-start gap-3 min-w-0">
          <button type="button" class="w-9 h-9 rounded-lg grid place-items-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-lime-tint-hover)] transition shrink-0" aria-label="Back" @click="navigateTo('/manpower')"><ArrowLeft class="w-5 h-5" /></button>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-[20px] font-bold text-[var(--brand-text)] truncate">{{ p.name }}</h1>
              <span class="text-[13px] font-medium text-[var(--brand-text-quiet)]">#{{ p.code }}</span>
              <span class="inline-flex items-center h-6 px-2 rounded-full text-[12px] font-bold bg-[var(--brand-lime-tint)] text-[var(--brand-olive)]">{{ p.kind === 'headcount' ? 'Headcount' : 'Project' }}</span>
            </div>
            <div class="flex items-center gap-3 flex-wrap mt-1 text-[12.5px] text-[var(--brand-text-quiet)]">
              <span class="inline-flex items-center gap-1.5"><Building2 class="w-3.5 h-3.5" /> {{ p.departments.join(', ') }}</span>
              <span class="inline-flex items-center gap-1.5"><CalendarDays class="w-3.5 h-3.5" /> {{ p.startDate }} → {{ p.endDate }}</span>
              <span class="inline-flex items-center gap-1.5"><Users class="w-3.5 h-3.5" /> {{ p.assignedToName }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <BrandButton variant="outline" size="md" class="gap-1.5"><Upload class="w-3.5 h-3.5" /> Monthly upload</BrandButton>
          <BrandButton variant="outline" size="md" class="gap-1.5"><Download class="w-3.5 h-3.5" /> Export</BrandButton>
        </div>
      </div>

      <div class="px-6 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div v-for="s in stats" :key="s.label" class="rounded-[12px] border border-[var(--brand-border-light)] bg-white px-4 py-3">
          <div class="text-[12px] text-[var(--brand-text-quiet)]">{{ s.label }}</div>
          <div class="text-[24px] font-bold tabular-nums mt-0.5" :class="s.tone === 'pending' ? 'text-[var(--brand-status-pending-text)]' : s.tone === 'teal' ? 'text-[var(--brand-teal)]' : 'text-[var(--brand-text)]'">{{ s.value }}</div>
        </div>
      </div>

      <div class="flex-1 overflow-auto px-6 pb-6">
        <ManpowerGrid :project="p" />
      </div>
    </template>

    <div v-else class="p-10 text-center flex-1">
      <div class="text-[15px] font-bold text-[var(--brand-text)]">Project not found</div>
      <BrandButton variant="outline" class="mt-3" @click="navigateTo('/manpower')">Back to Manpower Planning</BrandButton>
    </div>
  </div>
</template>
