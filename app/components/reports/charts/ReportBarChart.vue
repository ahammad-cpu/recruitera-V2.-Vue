<!-- Vertical bar chart — single series of CategoryValue[], with an optional
     stacked "values" record (Hires per source: total vs hired). -->
<script setup lang="ts">
import VChart from 'vue-echarts'
import type { CategoryValue, StackedCategoryValue } from '~/types'
import { paletteColor } from '../chartPalette'

const props = withDefaults(defineProps<{
  data?: CategoryValue[]
  stacked?: StackedCategoryValue[]
  stackedKeys?: { key: string, label: string }[]
  height?: number
  showPercentLabel?: boolean
}>(), { height: 260, data: () => [], stacked: undefined, stackedKeys: undefined })

const emit = defineEmits<{ 'bar-click': [{ label: string }] }>()

const labels = computed(() => props.stacked ? props.stacked.map(s => s.label) : props.data!.map(d => d.label))

const option = computed(() => ({
  grid: { left: 44, right: 16, top: props.stackedKeys ? 36 : 16, bottom: 44 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: props.stackedKeys ? { top: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: 'var(--brand-text-quiet)', fontSize: 12 } } : undefined,
  xAxis: {
    type: 'category',
    data: labels.value,
    axisLine: { lineStyle: { color: 'var(--brand-border-mid)' } },
    axisLabel: { color: 'var(--brand-text-quiet)', fontSize: 11, interval: 0, rotate: labels.value.length > 6 ? 28 : 0 },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: 'var(--brand-border-light)' } },
    axisLabel: { color: 'var(--brand-text-quiet)', fontSize: 11 },
  },
  series: props.stackedKeys
    ? props.stackedKeys.map((sk, i) => ({
        name: sk.label,
        type: 'bar',
        stack: 'total',
        barMaxWidth: 34,
        data: props.stacked!.map(s => s.values[sk.key] ?? 0),
        itemStyle: { color: paletteColor(i) },
      }))
    : [{
        type: 'bar',
        barMaxWidth: 34,
        data: props.data!.map((d, i) => ({ value: d.value, itemStyle: { color: paletteColor(i) } })),
        label: props.showPercentLabel
          ? { show: true, position: 'top', color: 'var(--brand-text-quiet)', fontSize: 11, formatter: (p: { dataIndex: number }) => { const d = props.data![p.dataIndex]; return `${d?.percent ?? d?.value ?? 0}%` } }
          : undefined,
      }],
}))

function onClick(params: { name: string }) {
  emit('bar-click', { label: params.name })
}
</script>

<template>
  <BrandEmptyState v-if="!labels.length" title="No data to display" description="The report will show up here." />
  <VChart v-else :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>
