<!-- General Reports — Evaluations section (BRD §2.8.7, R-E01–R-E09). -->
<script setup lang="ts">
import ReportKpiCard from '../ReportKpiCard.vue'
import ReportsSectionHeader from '../ReportsSectionHeader.vue'
import ReportsChartCard from '../ReportsChartCard.vue'
import DrillDownPopup from '../DrillDownPopup.vue'
import ReportLineChart from '../charts/ReportLineChart.vue'
import ReportBarChart from '../charts/ReportBarChart.vue'
import ReportDonutChart from '../charts/ReportDonutChart.vue'
import { useEvaluationsReport } from '~/composables/useReports'
import { useReportsStore } from '~/stores/reports.store'
import { useReportDrillDown } from '~/composables/useReportDrillDown'
import { exportToCsv, csvFilename } from '~/utils/csvExport'
import { dateRangeSuffix } from '~/utils/dateRangePresets'

const { data, isLoading } = useEvaluationsReport()
const store = useReportsStore()
const { drillDown, openDrillDown } = useReportDrillDown()

function onExport() {
  if (!data.value) return
  exportToCsv(csvFilename('Evaluations Report', dateRangeSuffix(store.dateRange.preset)), data.value.avgScorePerTeamMember.map(r => ({
    'Team Member': r.label, 'Avg Score': r.value,
  })))
}
</script>

<template>
  <div>
    <ReportsSectionHeader
      title="Evaluations"
      description="How consistently candidates are scored and who is completing evaluations."
      :export-disabled="!data"
      @export="onExport"
    />

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <ReportKpiCard v-for="k in Object.values(data?.kpis ?? {})" :key="k.key" :kpi="k" :loading="isLoading" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ReportsChartCard title="Evaluations over time" description="Submission volume over time.">
        <ReportLineChart
          :data="data?.evaluationsOverTime ?? []"
          :series="[{ key: 'count', label: 'Evaluations' }]"
          @point-click="p => openDrillDown('date', p.date, 'Evaluations over time', p.date)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Score distribution" description="Strong Yes / Yes / Not Sure / No — count + % per bar.">
        <ReportBarChart
          :data="data?.scoreDistribution ?? []"
          show-percent-label
          @bar-click="p => openDrillDown('score-label', p.label, 'Score distribution', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Avg score per team member" description="Which evaluators score higher or lower.">
        <ReportBarChart
          :data="data?.avgScorePerTeamMember ?? []"
          @bar-click="p => openDrillDown('evaluator', p.label, 'Avg score per team member', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Evaluation request status" description="Completed / Pending / Discarded / Expired breakdown.">
        <ReportDonutChart :data="data?.requestStatus ?? []" />
      </ReportsChartCard>

      <ReportsChartCard title="Avg time to evaluate" description="Avg days from request to submission per team member.">
        <ReportBarChart
          :data="data?.avgTimeToEvaluate ?? []"
          @bar-click="p => openDrillDown('evaluator', p.label, 'Avg time to evaluate', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Avg score per source" description="Quality signal — which sources score higher.">
        <ReportBarChart
          :data="data?.avgScorePerSource ?? []"
          @bar-click="p => openDrillDown('source', p.label, 'Avg score per source', p.label)"
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
