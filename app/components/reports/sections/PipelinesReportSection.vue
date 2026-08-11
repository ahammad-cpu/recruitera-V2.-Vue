<!-- General Reports — Pipelines section (BRD §2.8.3, R-P01–R-P08). -->
<script setup lang="ts">
import ReportKpiCard from '../ReportKpiCard.vue'
import ReportsSectionHeader from '../ReportsSectionHeader.vue'
import ReportsChartCard from '../ReportsChartCard.vue'
import DrillDownPopup from '../DrillDownPopup.vue'
import ReportLineChart from '../charts/ReportLineChart.vue'
import ReportFunnelChart from '../charts/ReportFunnelChart.vue'
import ReportHorizontalBarChart from '../charts/ReportHorizontalBarChart.vue'
import { usePipelinesReport } from '~/composables/useReports'
import { useReportsStore } from '~/stores/reports.store'
import { useReportDrillDown } from '~/composables/useReportDrillDown'
import { exportToCsv, csvFilename } from '~/utils/csvExport'
import { dateRangeSuffix } from '~/utils/dateRangePresets'

const { data, isLoading } = usePipelinesReport()
const store = useReportsStore()
const { drillDown, openDrillDown } = useReportDrillDown()

const totalActiveInStages = computed(() => (data.value?.candidatesPerStage ?? []).reduce((s, c) => s + c.value, 0))
const candidatesPerStageFunnel = computed(() => (data.value?.candidatesPerStage ?? []).map(c => ({
  stage: c.label,
  entered: c.value,
  proceeded: c.value,
  proceedRate: totalActiveInStages.value ? Math.round((c.value / totalActiveInStages.value) * 1000) / 10 : 0,
  dropOffRate: 0,
})))

function onExport() {
  if (!data.value) return
  exportToCsv(csvFilename('Pipelines Report', dateRangeSuffix(store.dateRange.preset)), data.value.proceedRatePerStage.map(s => ({
    Stage: s.stage, Entered: s.entered, Proceeded: s.proceeded, 'Proceed Rate %': s.proceedRate, 'Drop-off Rate %': s.dropOffRate,
  })))
}
</script>

<template>
  <div>
    <ReportsSectionHeader
      title="Pipelines"
      description="Stage-by-stage throughput and velocity across all jobs."
      :export-disabled="!data"
      @export="onExport"
    />

    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
      <ReportKpiCard v-for="k in Object.values(data?.kpis ?? {})" :key="k.key" :kpi="k" :loading="isLoading" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ReportsChartCard title="Pipeline events over time" description="Stage entries per stage group over time.">
        <ReportLineChart
          :data="data?.pipelineEventsOverTime ?? []"
          :series="[{ key: 'Applied', label: 'Applied' }, { key: 'Active', label: 'Active' }, { key: 'Hired', label: 'Hired' }]"
          @point-click="p => openDrillDown('date', p.date, 'Pipeline events over time', p.date)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Candidates per stage" description="Count of active candidates in each stage right now.">
        <ReportFunnelChart
          :data="candidatesPerStageFunnel"
          @stage-click="p => openDrillDown('stage', p.stage, 'Candidates per stage', p.stage)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Proceed rate per stage" description="% advancing from each stage. Biggest drop-off highlighted.">
        <ReportFunnelChart
          :data="data?.proceedRatePerStage ?? []"
          @stage-click="p => openDrillDown('stage', p.stage, 'Proceed rate per stage', p.stage)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Avg time to reach stage" description="Avg days from Applied to first entering each stage.">
        <ReportHorizontalBarChart
          :data="data?.avgTimeToReachStage.map(s => ({ label: s.label, value: s.value })) ?? []"
          value-suffix="d"
          @bar-click="p => openDrillDown('stage', p.label, 'Avg time to reach stage', p.label)"
        />
      </ReportsChartCard>
    </div>

    <ReportsChartCard title="Avg time spent per stage" description="Avg days in each stage before exit." class="mt-4">
      <ReportHorizontalBarChart
        :data="data?.avgTimeSpentPerStage.map(s => ({ label: s.label, value: s.value })) ?? []"
        value-suffix="d"
        :height="220"
        @bar-click="p => openDrillDown('stage', p.label, 'Avg time spent per stage', p.label)"
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
