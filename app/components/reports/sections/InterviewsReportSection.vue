<!-- General Reports — Interviews section (BRD §2.8.6, R-I01–R-I08). -->
<script setup lang="ts">
import ReportKpiCard from '../ReportKpiCard.vue'
import ReportsSectionHeader from '../ReportsSectionHeader.vue'
import ReportsChartCard from '../ReportsChartCard.vue'
import DrillDownPopup from '../DrillDownPopup.vue'
import ReportLineChart from '../charts/ReportLineChart.vue'
import ReportDonutChart from '../charts/ReportDonutChart.vue'
import ReportBarChart from '../charts/ReportBarChart.vue'
import { useInterviewsReport } from '~/composables/useReports'
import { useReportsStore } from '~/stores/reports.store'
import { useReportDrillDown } from '~/composables/useReportDrillDown'
import { exportToCsv, csvFilename } from '~/utils/csvExport'
import { dateRangeSuffix } from '~/utils/dateRangePresets'

const { data, isLoading } = useInterviewsReport()
const store = useReportsStore()
const { drillDown, openDrillDown } = useReportDrillDown()

function onExport() {
  if (!data.value) return
  exportToCsv(csvFilename('Interviews Report', dateRangeSuffix(store.dateRange.preset)), data.value.interviewsPerRecruiter.map(r => ({
    Recruiter: r.label, Interviews: r.value,
  })))
}
</script>

<template>
  <div>
    <ReportsSectionHeader
      title="Interviews"
      description="Interview activity, load distribution, and team time investment."
      :export-disabled="!data"
      @export="onExport"
    />

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <ReportKpiCard v-for="k in Object.values(data?.kpis ?? {})" :key="k.key" :kpi="k" :loading="isLoading" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ReportsChartCard title="Interviews over time" description="Daily / weekly completed interview volume.">
        <ReportLineChart
          :data="data?.interviewsOverTime ?? []"
          :series="[{ key: 'count', label: 'Interviews' }]"
          @point-click="p => openDrillDown('date', p.date, 'Interviews over time', p.date)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Interviews by type" description="Online vs. On-site breakdown.">
        <ReportDonutChart
          :data="data?.interviewsByType ?? []"
          @segment-click="p => openDrillDown('interview-type', p.label, 'Interviews by type', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Interviews by duration" description="Buckets: 0–30 / 30–60 / 60–90 / 90+ min.">
        <ReportBarChart
          :data="data?.interviewsByDuration ?? []"
          @bar-click="p => openDrillDown('interview-duration', p.label, 'Interviews by duration', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Interviews per recruiter" description="Who is conducting the most interviews.">
        <ReportBarChart
          :data="data?.interviewsPerRecruiter ?? []"
          @bar-click="p => openDrillDown('recruiter', p.label, 'Interviews per recruiter', p.label)"
        />
      </ReportsChartCard>
    </div>

    <ReportsChartCard title="Total interview hours per recruiter" description="Workload signal — time investment per team member." class="mt-4">
      <ReportBarChart
        :data="data?.interviewHoursPerRecruiter ?? []"
        :height="240"
        @bar-click="p => openDrillDown('recruiter', p.label, 'Total interview hours per recruiter', p.label)"
      />
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
