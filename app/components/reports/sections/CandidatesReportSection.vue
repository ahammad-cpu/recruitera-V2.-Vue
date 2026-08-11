<!-- General Reports — Candidates section (BRD §2.8.2, R-C01–R-C09). -->
<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import ReportKpiCard from '../ReportKpiCard.vue'
import ReportsSectionHeader from '../ReportsSectionHeader.vue'
import ReportsChartCard from '../ReportsChartCard.vue'
import DrillDownPopup from '../DrillDownPopup.vue'
import ReportLineChart from '../charts/ReportLineChart.vue'
import ReportDonutChart from '../charts/ReportDonutChart.vue'
import ReportBarChart from '../charts/ReportBarChart.vue'
import { useCandidatesReport } from '~/composables/useReports'
import { useReportsStore } from '~/stores/reports.store'
import { useReportDrillDown } from '~/composables/useReportDrillDown'
import { exportToCsv, csvFilename } from '~/utils/csvExport'
import { dateRangeSuffix } from '~/utils/dateRangePresets'

const { data, isLoading } = useCandidatesReport()
const store = useReportsStore()
const { drillDown, openDrillDown } = useReportDrillDown()

function onExport() {
  if (!data.value) return
  exportToCsv(csvFilename('Candidates Report', dateRangeSuffix(store.dateRange.preset)), data.value.qualifiedCandidatesPerJob.map(j => ({
    Job: j.jobTitle, Qualified: j.qualified, Disqualified: j.disqualified, Hired: j.hired,
  })))
}
</script>

<template>
  <div>
    <ReportsSectionHeader
      title="Candidates"
      description="Where candidates come from, their current status, and sourcing channel quality."
      :export-disabled="!data"
      @export="onExport"
    />

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <ReportKpiCard v-for="k in Object.values(data?.kpis ?? {})" :key="k.key" :kpi="k" :loading="isLoading" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ReportsChartCard title="Candidates over time by origin" description="Applied / Sourced / Referred over time.">
        <ReportLineChart
          :data="data?.candidatesOverTimeByOrigin ?? []"
          :series="[{ key: 'Applied', label: 'Applied' }, { key: 'Sourced', label: 'Sourced' }, { key: 'Referred', label: 'Referred' }]"
          @point-click="p => openDrillDown('date', p.date, 'Candidates over time by origin', p.date)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="New candidates by status" description="Qualified / Disqualified / Unassigned breakdown.">
        <ReportDonutChart
          :data="data?.newCandidatesByStatus ?? []"
          @segment-click="p => openDrillDown('stage', p.label, 'New candidates by status', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Candidates per source" description="Volume per job board / channel.">
        <ReportBarChart
          :data="data?.candidatesPerSource ?? []"
          @bar-click="p => openDrillDown('source', p.label, 'Candidates per source', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Hires per source" description="Total candidates vs hired per source — quality signal.">
        <ReportBarChart
          :stacked="data?.hiresPerSource ?? []"
          :stacked-keys="[{ key: 'total', label: 'Total' }, { key: 'hired', label: 'Hired' }]"
          @bar-click="p => openDrillDown('source', p.label, 'Hires per source', p.label)"
        />
      </ReportsChartCard>
    </div>

    <ReportsChartCard title="Qualified candidates per job" description="Job title · Qualified · Disqualified · Hired." class="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job</TableHead>
            <TableHead>Qualified</TableHead>
            <TableHead>Disqualified</TableHead>
            <TableHead>Hired</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.qualifiedCandidatesPerJob.length">
            <TableCell colspan="4" class="text-center text-[13px] text-[var(--brand-text-quiet)] py-8">No data to display</TableCell>
          </TableRow>
          <TableRow
            v-for="j in data?.qualifiedCandidatesPerJob"
            :key="j.jobId"
            class="cursor-pointer"
            @click="openDrillDown('job', j.jobTitle, 'Qualified candidates per job', j.jobTitle)"
          >
            <TableCell class="font-medium text-[var(--brand-text)]">{{ j.jobTitle }}</TableCell>
            <TableCell>{{ j.qualified }}</TableCell>
            <TableCell>{{ j.disqualified }}</TableCell>
            <TableCell>{{ j.hired }}</TableCell>
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
