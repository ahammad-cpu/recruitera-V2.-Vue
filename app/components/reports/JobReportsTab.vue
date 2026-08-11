<!-- Job-Level Reports tab (BRD Section 3 / PRD E5 v2.0) — analytics scoped to
     a single job. Own simple date-range filter, no drill-down popup (that's
     company-level only, §2.5) and no shared global filter store — see
     reports-module spec §1 "architecturally distinct". -->
<script setup lang="ts">
import { Printer, Download } from 'lucide-vue-next'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { BrandButton, BrandEmptyState } from '~/components/brand'
import JobDateRangePicker from './JobDateRangePicker.vue'
import ReportKpiCard from './ReportKpiCard.vue'
import ReportsChartCard from './ReportsChartCard.vue'
import ReportFunnelChart from './charts/ReportFunnelChart.vue'
import ReportHorizontalBarChart from './charts/ReportHorizontalBarChart.vue'
import ReportLineChart from './charts/ReportLineChart.vue'
import ReportDonutChart from './charts/ReportDonutChart.vue'
import ReportBarChart from './charts/ReportBarChart.vue'
import { useJobReport } from '~/composables/useReports'
import { exportToCsv, csvFilename } from '~/utils/csvExport'
import { defaultDateRangeValue, dateRangeSuffix } from '~/utils/dateRangePresets'
import type { DateRangeValue } from '~/types'

const props = defineProps<{ jobId: string }>()

const jobIdRef = computed(() => props.jobId)
const dateRange = ref<DateRangeValue>(defaultDateRangeValue())
const { data, isLoading } = useJobReport(jobIdRef, dateRange)

const hiredProgress = computed(() => {
  if (!data.value || !data.value.targetPositions) return 0
  return Math.min(100, Math.round((data.value.hiredCount / data.value.targetPositions) * 100))
})

function onExport() {
  if (!data.value) return
  exportToCsv(csvFilename(`${data.value.jobTitle} Report`, dateRangeSuffix(dateRange.value.preset)), data.value.pipelineFunnel.map(s => ({
    Stage: s.stage, Entered: s.entered, 'Proceed Rate %': s.proceedRate,
  })))
}
function onPrint() { window.print() }
</script>

<template>
  <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
    <div class="flex items-center justify-between gap-3 pb-4 flex-none">
      <JobDateRangePicker v-model="dateRange" />
      <div class="flex items-center gap-2">
        <BrandButton variant="outline" size="sm" :disabled="!data" @click="onExport">
          <Download class="w-3.5 h-3.5 mr-1.5" stroke-width="1.8" />
          Export CSV
        </BrandButton>
        <BrandButton variant="outline" size="sm" @click="onPrint">
          <Printer class="w-3.5 h-3.5 mr-1.5" stroke-width="1.8" />
          Print
        </BrandButton>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-1">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <ReportKpiCard v-for="k in Object.values(data?.kpis ?? {})" :key="k.key" :kpi="k" :loading="isLoading" />
      </div>

      <div v-if="data" class="mb-4 rounded-[14px] border border-[var(--brand-border-light)] bg-[var(--brand-surface-white)] p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[13px] font-bold text-[var(--brand-text)]">Hired vs Target</span>
          <span class="text-[13px] text-[var(--brand-text-quiet)]">{{ data.hiredCount }} of {{ data.targetPositions }} positions filled ({{ hiredProgress }}%)</span>
        </div>
        <div class="h-2.5 rounded-full bg-[var(--brand-canvas)] overflow-hidden">
          <div class="h-full rounded-full bg-[var(--brand-teal-secondary)] transition-[width]" :style="{ width: `${hiredProgress}%` }" />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportsChartCard title="Pipeline Funnel" description="% of total candidates who reached each stage.">
          <ReportFunnelChart :data="data?.pipelineFunnel ?? []" />
        </ReportsChartCard>

        <ReportsChartCard title="Conversion Rate per Stage" description="% of candidates who progressed from each stage to the next.">
          <ReportFunnelChart :data="data?.conversionRatePerStage ?? []" />
        </ReportsChartCard>

        <ReportsChartCard title="Average Time per Stage" description="Avg days per stage. Bars exceeding SLA shown in red.">
          <ReportHorizontalBarChart
            :data="(data?.avgTimePerStage ?? []).map(s => ({ label: s.stage, value: s.avgDays, danger: s.overSla }))"
            value-suffix="d"
          />
        </ReportsChartCard>

        <ReportsChartCard title="New Candidates Over Time" description="See how many new candidates applied.">
          <ReportLineChart :data="data?.newCandidatesOverTime ?? []" :series="[{ key: 'count', label: 'New candidates' }]" />
        </ReportsChartCard>

        <ReportsChartCard title="Sources" description="Compare which sources are most effective.">
          <ReportDonutChart :data="data?.sources ?? []" />
        </ReportsChartCard>

        <ReportsChartCard title="Disqualify Reasons" description="Learn why candidates get disqualified from this job's process.">
          <ReportBarChart :data="data?.disqualifyReasons ?? []" />
        </ReportsChartCard>
      </div>

      <ReportsChartCard title="SLA Breach Count per Stage" description="Stage · SLA days · avg days spent · # breaches · breach rate." class="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stage</TableHead>
              <TableHead>SLA (days)</TableHead>
              <TableHead>Avg Days Spent</TableHead>
              <TableHead># Breaches</TableHead>
              <TableHead>Breach Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="!data?.slaBreachPerStage.length">
              <TableCell colspan="5" class="text-center text-[13px] text-[var(--brand-text-quiet)] py-8">No data to display</TableCell>
            </TableRow>
            <TableRow v-for="s in data?.slaBreachPerStage" :key="s.stage">
              <TableCell class="font-medium text-[var(--brand-text)]">{{ s.stage }}</TableCell>
              <TableCell>{{ s.slaDays }}</TableCell>
              <TableCell :class="s.avgDays > s.slaDays ? 'text-[var(--brand-danger)] font-semibold' : ''">{{ s.avgDays }}</TableCell>
              <TableCell>{{ s.breaches }}</TableCell>
              <TableCell>{{ s.breachRate }}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ReportsChartCard>

      <ReportsChartCard title="Evaluation Score Distribution" description="How the team collectively rated candidates on this job." class="mt-4">
        <p v-if="data?.avgEvaluationScore != null" class="m-0 mb-3 text-[13px] text-[var(--brand-text-quiet)]">
          Average score: <span class="font-bold text-[var(--brand-text)]">{{ data.avgEvaluationScore }} / 4</span>
        </p>
        <ReportBarChart :data="data?.evaluationScoreDistribution ?? []" show-percent-label />
      </ReportsChartCard>

      <ReportsChartCard v-if="data?.hasSmartDistribute" title="Recruiter Performance" description="Visible for jobs with Smart Distribute active." class="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recruiter</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Progressed</TableHead>
              <TableHead>Hired</TableHead>
              <TableHead>Time to First Contact</TableHead>
              <TableHead>Avg Days to Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in data?.recruiterPerformance ?? []" :key="r.recruiterId">
              <TableCell class="font-medium text-[var(--brand-text)]">{{ r.recruiterName }}</TableCell>
              <TableCell>{{ r.assigned }}</TableCell>
              <TableCell>{{ r.progressed }}</TableCell>
              <TableCell>{{ r.hired }}</TableCell>
              <TableCell>{{ r.timeToFirstContact }}d</TableCell>
              <TableCell>{{ r.avgDaysToProgress }}d</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ReportsChartCard>
      <BrandEmptyState
        v-else-if="!isLoading"
        title="No Smart Distribute data"
        description="Recruiter performance shows up here once Smart Distribute is active for this job."
        class="mt-4"
      />
    </div>
  </div>
</template>
