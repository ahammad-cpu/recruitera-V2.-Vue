<!-- General Reports — Careers Site section (BRD §2.8.8, R-CS01–R-CS12).
     Visit/session data is aggregate-only (no tracked session records exist
     anywhere in this codebase — see spec) — drill-down only applies where a
     real candidate identity exists behind the number (applications, not raw
     visits). -->
<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import ReportKpiCard from '../ReportKpiCard.vue'
import ReportsSectionHeader from '../ReportsSectionHeader.vue'
import ReportsChartCard from '../ReportsChartCard.vue'
import DrillDownPopup from '../DrillDownPopup.vue'
import ReportLineChart from '../charts/ReportLineChart.vue'
import ReportBarChart from '../charts/ReportBarChart.vue'
import { useCareersSiteReport } from '~/composables/useReports'
import { useReportsStore } from '~/stores/reports.store'
import { useReportDrillDown } from '~/composables/useReportDrillDown'
import { exportToCsv, csvFilename } from '~/utils/csvExport'
import { dateRangeSuffix } from '~/utils/dateRangePresets'

const { data, isLoading } = useCareersSiteReport()
const store = useReportsStore()
const { drillDown, openDrillDown } = useReportDrillDown()

function onExport() {
  if (!data.value) return
  exportToCsv(csvFilename('Careers Site Report', dateRangeSuffix(store.dateRange.preset)), data.value.mostVisitedJobs.map(j => ({
    Job: j.jobTitle, Visits: j.visits, Applications: j.applications, 'Conversion %': j.conversion,
  })))
}
</script>

<template>
  <div>
    <ReportsSectionHeader
      title="Careers Site"
      description="Traffic and application conversion for the careers portal."
      :export-disabled="!data"
      @export="onExport"
    />

    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
      <ReportKpiCard v-for="k in Object.values(data?.kpis ?? {})" :key="k.key" :kpi="k" :loading="isLoading" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ReportsChartCard title="Visits over time" description="Daily / weekly traffic to the careers portal.">
        <ReportLineChart :data="data?.visitsOverTime ?? []" :series="[{ key: 'visits', label: 'Visits' }]" />
      </ReportsChartCard>

      <ReportsChartCard title="Applications over time" description="Daily / weekly portal application volume.">
        <ReportLineChart :data="data?.applicationsOverTime ?? []" :series="[{ key: 'applications', label: 'Applications' }]" />
      </ReportsChartCard>

      <ReportsChartCard title="Applications per job" description="Which jobs get the most portal applications.">
        <ReportBarChart
          :data="data?.applicationsPerJob ?? []"
          @bar-click="p => openDrillDown('job', p.label, 'Applications per job', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Visits per traffic source" description="Direct / LinkedIn / Google / Wuzzuf / Other.">
        <ReportBarChart :data="data?.visitsPerTrafficSource ?? []" />
      </ReportsChartCard>
    </div>

    <ReportsChartCard title="Applications per traffic source" description="Which source converts best to applications." class="mt-4 mb-4">
      <ReportBarChart :data="data?.applicationsPerTrafficSource ?? []" :height="220" />
    </ReportsChartCard>

    <ReportsChartCard title="Most visited jobs" description="Job title · Visits · Applications · Conversion %.">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job</TableHead>
            <TableHead>Visits</TableHead>
            <TableHead>Applications</TableHead>
            <TableHead>Conversion %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.mostVisitedJobs.length">
            <TableCell colspan="4" class="text-center text-[13px] text-[var(--brand-text-quiet)] py-8">No data to display</TableCell>
          </TableRow>
          <TableRow
            v-for="j in data?.mostVisitedJobs"
            :key="j.jobId"
            class="cursor-pointer"
            @click="openDrillDown('job', j.jobTitle, 'Most visited jobs', j.jobTitle)"
          >
            <TableCell class="font-medium text-[var(--brand-text)]">{{ j.jobTitle }}</TableCell>
            <TableCell>{{ j.visits }}</TableCell>
            <TableCell>{{ j.applications }}</TableCell>
            <TableCell>{{ j.conversion }}%</TableCell>
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
