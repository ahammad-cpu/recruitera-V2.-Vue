<!-- Global chart drill-down popup (BRD §2.5 / R-G09). Company-level reports
     only — the Job-Level Reports tab has no drill-down per its own spec. -->
<script setup lang="ts">
import { Download, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { BrandAvatarInitials } from '~/components/brand'
import { useApi } from '~/composables/useApi'
import { exportToCsv } from '~/utils/csvExport'
import type { DrillDownResponse } from '~/types'

const props = defineProps<{
  open: boolean
  dimension: string
  value: string
  chartName: string
  contextLine?: string
  queryParams: Record<string, string>
}>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const api = useApi()
const page = ref(1)
const perPage = 10
const data = ref<DrillDownResponse | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  const params = new URLSearchParams({
    ...props.queryParams,
    dimension: props.dimension,
    value: props.value,
    chartName: props.chartName,
    contextLine: props.contextLine ?? props.value,
    page: String(page.value),
    perPage: String(perPage),
  })
  data.value = await api.get<DrillDownResponse>(`/api/reports/drilldown?${params}`)
  loading.value = false
}

watch(() => [props.open, props.dimension, props.value] as const, ([isOpen]) => {
  if (isOpen) { page.value = 1; load() }
})
watch(page, () => { if (props.open) load() })

function onExport() {
  if (!data.value) return
  exportToCsv(`${props.chartName}-drilldown`, data.value.candidates.map(c => ({
    Name: c.name, Job: c.job, Stage: c.stage, 'Evaluation Score': c.evaluationScore ?? '', 'Date Created': c.dateCreated,
  })))
}

const rangeLabel = computed(() => {
  if (!data.value) return ''
  const start = (page.value - 1) * perPage + 1
  const end = Math.min(page.value * perPage, data.value.total)
  return data.value.total ? `${start}–${end} of ${data.value.total}` : '0 of 0'
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-[640px] p-0 rounded-[14px] border border-[var(--brand-border-light)] shadow-[0_16px_48px_rgba(0,20,18,0.22)] gap-0">
      <DialogHeader class="flex-row items-start justify-between px-5 pt-5 pb-3 border-b border-[var(--brand-border-fade)] space-y-0">
        <div>
          <DialogTitle class="text-[16px] font-bold text-[var(--brand-text)]">{{ chartName }}</DialogTitle>
          <p class="m-0 mt-1 text-[12.5px] text-[var(--brand-text-quiet)]">{{ data?.contextLine ?? contextLine }}</p>
        </div>
        <button
          type="button"
          title="Export CSV"
          class="flex items-center justify-center w-8 h-8 rounded-md text-[var(--brand-text-quiet)] hover:bg-black/[.05] hover:text-[var(--brand-text)] transition-colors shrink-0"
          @click="onExport"
        >
          <Download class="w-4 h-4" />
        </button>
      </DialogHeader>

      <div class="max-h-[420px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Evaluation Score</TableHead>
              <TableHead>Date Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="loading">
              <TableCell colspan="5" class="text-center text-[13px] text-[var(--brand-text-quiet)] py-8">Loading…</TableCell>
            </TableRow>
            <TableRow v-else-if="!data?.candidates.length">
              <TableCell colspan="5" class="text-center text-[13px] text-[var(--brand-text-quiet)] py-8">No candidates match this data point.</TableCell>
            </TableRow>
            <TableRow v-for="c in data?.candidates" v-else :key="c.id">
              <TableCell>
                <div class="flex items-center gap-2">
                  <BrandAvatarInitials :initials="c.initials" :bg="c.avatarColor" size="sm" />
                  <span class="text-[13px] font-medium text-[var(--brand-text)]">{{ c.name }}</span>
                </div>
              </TableCell>
              <TableCell class="text-[13px] text-[var(--brand-text-quiet)]">{{ c.job }}</TableCell>
              <TableCell class="text-[13px] text-[var(--brand-text-quiet)]">{{ c.stage }}</TableCell>
              <TableCell class="text-[13px] text-[var(--brand-text-quiet)]">{{ c.evaluationScore ?? '—' }}</TableCell>
              <TableCell class="text-[13px] text-[var(--brand-text-quiet)]">{{ c.dateCreated }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div class="flex items-center justify-between px-5 py-3 border-t border-[var(--brand-border-fade)]">
        <span class="text-[12px] text-[var(--brand-text-quiet)]">{{ rangeLabel }}</span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="flex items-center justify-center w-7 h-7 rounded-md text-[var(--brand-text-quiet)] hover:bg-black/[.05] disabled:opacity-40 disabled:hover:bg-transparent"
            :disabled="page <= 1"
            @click="page--"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="flex items-center justify-center w-7 h-7 rounded-md text-[var(--brand-text-quiet)] hover:bg-black/[.05] disabled:opacity-40 disabled:hover:bg-transparent"
            :disabled="!data || page * perPage >= data.total"
            @click="page++"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
