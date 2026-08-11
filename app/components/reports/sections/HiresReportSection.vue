<!-- General Reports — Hires section (BRD §2.8.5, R-H01–R-H10). Blue/White
     Collar split is the global filter-bar toggle (BRD §2.6), not a
     per-section control — see reports-module spec's open-question defaults. -->
<script setup lang="ts">
import ReportKpiCard from '../ReportKpiCard.vue'
import ReportsSectionHeader from '../ReportsSectionHeader.vue'
import ReportsChartCard from '../ReportsChartCard.vue'
import DrillDownPopup from '../DrillDownPopup.vue'
import ReportLineChart from '../charts/ReportLineChart.vue'
import ReportBarChart from '../charts/ReportBarChart.vue'
import { useHiresReport } from '~/composables/useReports'
import { useReportsStore } from '~/stores/reports.store'
import { useReportDrillDown } from '~/composables/useReportDrillDown'
import { exportToCsv, csvFilename } from '~/utils/csvExport'
import { dateRangeSuffix } from '~/utils/dateRangePresets'

const { data, isLoading } = useHiresReport()
const store = useReportsStore()
const { drillDown, openDrillDown } = useReportDrillDown()

function onExport() {
  if (!data.value) return
  exportToCsv(csvFilename('Hires Report', dateRangeSuffix(store.dateRange.preset)), data.value.hiresPerRecruiter.map(r => ({
    Recruiter: r.label, Hires: r.value,
  })))
}
</script>

<template>
  <div>
    <ReportsSectionHeader
      title="Hires"
      description="Who was hired, how fast, via which channel, by which recruiter."
      :export-disabled="!data"
      @export="onExport"
    />

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <ReportKpiCard v-for="k in Object.values(data?.kpis ?? {})" :key="k.key" :kpi="k" :loading="isLoading" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ReportsChartCard title="Hires over time" description="Daily / weekly hire volume.">
        <ReportLineChart
          :data="data?.hiresOverTime ?? []"
          :series="[{ key: 'count', label: 'Hires' }]"
          @point-click="p => openDrillDown('date', p.date, 'Hires over time', p.date)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Hires per job" description="Hires produced by each job.">
        <ReportBarChart
          :data="data?.hiresPerJob ?? []"
          @bar-click="p => openDrillDown('job', p.label, 'Hires per job', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Hires per department" description="Hire volume by department.">
        <ReportBarChart
          :data="data?.hiresPerDepartment ?? []"
          @bar-click="p => openDrillDown('department', p.label, 'Hires per department', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Hires per source" description="Which channels produced confirmed hires.">
        <ReportBarChart
          :data="data?.hiresPerSource ?? []"
          @bar-click="p => openDrillDown('source', p.label, 'Hires per source', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Hires per recruiter" description="Each recruiter's total hires.">
        <ReportBarChart
          :data="data?.hiresPerRecruiter ?? []"
          @bar-click="p => openDrillDown('recruiter', p.label, 'Hires per recruiter', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Avg TTH per recruiter" description="Time-to-hire efficiency comparison across recruiters.">
        <ReportBarChart
          :data="data?.avgTthPerRecruiter ?? []"
          @bar-click="p => openDrillDown('recruiter', p.label, 'Avg TTH per recruiter', p.label)"
        />
      </ReportsChartCard>
    </div>

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
