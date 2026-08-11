<!--
  Wraps vue-echarts for line/stacked-line charts (New Candidates, Candidates
  over time by origin, Hires over time, etc.). Keeps ECharts specifics out of
  every report section — sections just pass data + series definitions.
-->
<script setup lang="ts">
import VChart from 'vue-echarts'
import type { SeriesPoint } from '~/types'
import { paletteColor } from '../chartPalette'

const props = withDefaults(defineProps<{
  data: SeriesPoint[]
  series: { key: string, label: string }[]
  height?: number
}>(), { height: 260 })

const emit = defineEmits<{ 'point-click': [{ date: string, key: string }] }>()

const option = computed(() => ({
  grid: { left: 44, right: 16, top: props.series.length > 1 ? 36 : 16, bottom: 28 },
  tooltip: { trigger: 'axis' },
  legend: props.series.length > 1
    ? { top: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: 'var(--brand-text-quiet)', fontSize: 12 } }
    : undefined,
  xAxis: {
    type: 'category',
    data: props.data.map(d => d.date),
    axisLine: { lineStyle: { color: 'var(--brand-border-mid)' } },
    axisLabel: { color: 'var(--brand-text-quiet)', fontSize: 11 },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: 'var(--brand-border-light)' } },
    axisLabel: { color: 'var(--brand-text-quiet)', fontSize: 11 },
  },
  series: props.series.map((s, i) => ({
    name: s.label,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    showSymbol: props.data.length <= 40,
    data: props.data.map(d => Number(d[s.key] ?? 0)),
    itemStyle: { color: paletteColor(i) },
    lineStyle: { color: paletteColor(i), width: 2 },
  })),
}))

function onClick(params: { dataIndex: number, seriesIndex?: number }) {
  const key = props.series[params.seriesIndex ?? 0]?.key ?? props.series[0]?.key ?? ''
  const date = props.data[params.dataIndex]?.date
  if (date) emit('point-click', { date: String(date), key })
}
</script>

<template>
  <BrandEmptyState v-if="!data.length" title="No data to display" description="The report will show up here." />
  <VChart v-else :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>
