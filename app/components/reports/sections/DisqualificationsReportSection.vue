<!-- General Reports — Disqualifications section (BRD §2.8.4, R-D01–R-D08). -->
<script setup lang="ts">
import ReportKpiCard from '../ReportKpiCard.vue'
import ReportsSectionHeader from '../ReportsSectionHeader.vue'
import ReportsChartCard from '../ReportsChartCard.vue'
import DrillDownPopup from '../DrillDownPopup.vue'
import ReportLineChart from '../charts/ReportLineChart.vue'
import ReportBarChart from '../charts/ReportBarChart.vue'
import ReportFunnelChart from '../charts/ReportFunnelChart.vue'
import { useDisqualificationsReport } from '~/composables/useReports'
import { useReportsStore } from '~/stores/reports.store'
import { useReportDrillDown } from '~/composables/useReportDrillDown'
import { exportToCsv, csvFilename } from '~/utils/csvExport'
import { dateRangeSuffix } from '~/utils/dateRangePresets'

const { data, isLoading } = useDisqualificationsReport()
const store = useReportsStore()
const { drillDown, openDrillDown } = useReportDrillDown()

function onExport() {
  if (!data.value) return
  exportToCsv(csvFilename('Disqualifications Report', dateRangeSuffix(store.dateRange.preset)), data.value.disqualificationReasonsOverview.map(r => ({
    Reason: r.label, Count: r.value, 'Percent of Total': `${r.percent}%`,
  })))
}
</script>

<template>
  <div>
    <ReportsSectionHeader
      title="Disqualifications"
      description="Why candidates are rejected, at which stage, from which sources, and how quickly."
      :export-disabled="!data"
      @export="onExport"
    />

    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
      <ReportKpiCard v-for="k in Object.values(data?.kpis ?? {})" :key="k.key" :kpi="k" :loading="isLoading" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ReportsChartCard title="Disqualifications over time" description="Daily / weekly disqualification volume.">
        <ReportLineChart
          :data="data?.disqualificationsOverTime ?? []"
          :series="[{ key: 'count', label: 'Disqualifications' }]"
          @point-click="p => openDrillDown('date', p.date, 'Disqualifications over time', p.date)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Disqualifications per stage" description="Which stages produce the most rejections.">
        <ReportBarChart
          :data="data?.disqualificationsPerStage ?? []"
          @bar-click="p => openDrillDown('stage', p.label, 'Disqualifications per stage', p.label)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Drop-off rate per stage" description="% disqualified at each stage vs. all who entered.">
        <ReportFunnelChart
          :data="data?.dropOffRatePerStage ?? []"
          label-metric="dropOffRate"
          @stage-click="p => openDrillDown('stage', p.stage, 'Drop-off rate per stage', p.stage)"
        />
      </ReportsChartCard>

      <ReportsChartCard title="Disqualifications per source" description="Which sources produce the most rejected candidates.">
        <ReportBarChart
          :data="data?.disqualificationsPerSource ?? []"
          @bar-click="p => openDrillDown('source', p.label, 'Disqualifications per source', p.label)"
        />
      </ReportsChartCard>
    </div>

    <ReportsChartCard title="Disqualification reasons overview" description="Reason + count + % of total, sorted descending." class="mt-4">
      <ReportBarChart
        :data="data?.disqualificationReasonsOverview ?? []"
        show-percent-label
        :height="240"
        @bar-click="p => openDrillDown('reason', p.label, 'Disqualification reasons overview', p.label)"
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
