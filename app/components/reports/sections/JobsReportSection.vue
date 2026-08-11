<!-- General Reports — Jobs section (BRD §2.8.1, R-J01–R-J11). -->
<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import ReportKpiCard from '../ReportKpiCard.vue'
import ReportsSectionHeader from '../ReportsSectionHeader.vue'
import ReportsChartCard from '../ReportsChartCard.vue'
import DrillDownPopup from '../DrillDownPopup.vue'
import ReportLineChart from '../charts/ReportLineChart.vue'
import ReportHorizontalBarChart from '../charts/ReportHorizontalBarChart.vue'
import ReportBarChart from '../charts/ReportBarChart.vue'
import { useJobsReport } from '~/composables/useReports'
import { useReportsStore } from '~/stores/reports.store'
import { useReportDrillDown } from '~/composables/useReportDrillDown'
import { exportToCsv, csvFilename } from '~/utils/csvExport'
import { dateRangeSuffix } from '~/utils/dateRangePresets'

const { data, isLoading } = useJobsReport()
const store = useReportsStore()
const { drillDown, openDrillDown } = useReportDrillDown()

const fillRateSortAsc = ref(true)
const fillRatePerJobSorted = computed(() => {
  const rows = data.value?.fillRatePerJob ?? []
  return [...rows].sort((a, b) => fillRateSortAsc.value ? a.fillRate - b.fillRate : b.fillRate - a.fillRate)
})

function onExport() {
  if (!data.value) return
  exportToCsv(csvFilename('Jobs Report', dateRangeSuffix(store.dateRange.preset)), data.value.fillRatePerJob.map(j => ({
    Job: j.jobTitle, 'Positions Needed': j.positionsNeeded, Hires: j.hires, 'Fill Rate %': j.fillRate,
  })))
}
</script>

<template>
  <div>
    <ReportsSectionHeader
      title="Jobs"
      description="Company-wide view of job health — how many jobs are published, filled, closed, and how fast."
      :export-disabled="!data"
      @export="onExport"
    />

    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
      <ReportKpiCard v-for="k in Object.values(data?.kpis ?? {})" :key="k.key" :kpi="k" :loading="isLoading" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ReportsChartCard title="Job events over time" description="Published / Filled / Closed events per day.">
        <ReportLineChart
          :data="data?.jobEventsOverTime ?? []"
          :series="[{ key: 'published', label: 'Published' }, { key: 'filled', label: 'Filled' }, { key: 'closed', label: 'Closed' }]"
          @point-click="p => openDrillDown('date', p.date, 'Job events over time', p.date)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Open time per job" description="Each open job sorted by days open. Over 60 days is flagged.">
        <ReportHorizontalBarChart
          :data="(data?.openTimePerJob ?? []).map(j => ({ label: j.jobTitle, value: j.daysOpen, danger: j.overSla }))"
          value-suffix="d"
          @bar-click="p => openDrillDown('job', p.label, 'Open time per job', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Published jobs per department" description="Distribution of active jobs by department.">
        <ReportBarChart
          :data="data?.publishedJobsPerDepartment ?? []"
          @bar-click="p => openDrillDown('department', p.label, 'Published jobs per department', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Fill rate per department" description="% of jobs filled per department within the date range.">
        <ReportBarChart
          :data="data?.fillRatePerDepartment ?? []"
          show-percent-label
          @bar-click="p => openDrillDown('department', p.label, 'Fill rate per department', p.label)"
        />
      </ReportsChartCard>
    </div>

    <ReportsChartCard title="Fill rate per job" description="Job title · Positions needed · Hires · Fill rate %." class="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job</TableHead>
            <TableHead>Positions Needed</TableHead>
            <TableHead>Hires</TableHead>
            <TableHead class="cursor-pointer select-none" @click="fillRateSortAsc = !fillRateSortAsc">
              Fill Rate % {{ fillRateSortAsc ? '↑' : '↓' }}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!fillRatePerJobSorted.length">
            <TableCell colspan="4" class="text-center text-[13px] text-[var(--brand-text-quiet)] py-8">No data to display</TableCell>
          </TableRow>
          <TableRow
            v-for="j in fillRatePerJobSorted"
            :key="j.jobId"
            class="cursor-pointer"
            @click="openDrillDown('job', j.jobTitle, 'Fill rate per job', j.jobTitle)"
          >
            <TableCell class="font-medium text-[var(--brand-text)]">{{ j.jobTitle }}</TableCell>
            <TableCell>{{ j.positionsNeeded }}</TableCell>
            <TableCell>{{ j.hires }}</TableCell>
            <TableCell>{{ j.fillRate }}%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </ReportsChartCard>

    <DrillDownPopup
      v-model:open="drillDown.open"
      :dimension="drillDown.dimension"
      :value="drillDown.value"
      :chart-name="drillDown.chartName"
      :context-line="drillDown.contextLine"
      :query-params="store.queryParams"
    />
  </div>
</template>
