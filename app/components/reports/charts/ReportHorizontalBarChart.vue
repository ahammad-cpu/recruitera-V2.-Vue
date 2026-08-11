<!-- Horizontal bar — "Open time per job" (SLA-breach rows in red), "Avg time
     per/to stage", "Total interview hours per recruiter", etc. -->
<script setup lang="ts">
import VChart from 'vue-echarts'
import { paletteColor } from '../chartPalette'

interface Row { label: string, value: number, danger?: boolean }

const props = withDefaults(defineProps<{
  data: Row[]
  height?: number
  valueSuffix?: string
}>(), { height: 260, valueSuffix: '' })

const emit = defineEmits<{ 'bar-click': [{ label: string }] }>()

// echarts renders category axes bottom-to-top — reverse so the sorted-input
// order reads top-to-bottom as callers expect (e.g. "sorted descending").
const rows = computed(() => [...props.data].reverse())

const option = computed(() => ({
  grid: { left: 140, right: 40, top: 8, bottom: 8 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: 'var(--brand-border-light)' } },
    axisLabel: { color: 'var(--brand-text-quiet)', fontSize: 11 },
  },
  yAxis: {
    type: 'category',
    data: rows.value.map(r => r.label),
    axisLine: { lineStyle: { color: 'var(--brand-border-mid)' } },
    axisLabel: { color: 'var(--brand-text-quiet)', fontSize: 11, width: 128, overflow: 'truncate' },
    axisTick: { show: false },
  },
  series: [{
    type: 'bar',
    barMaxWidth: 20,
    data: rows.value.map((r, i) => ({ value: r.value, itemStyle: { color: r.danger ? 'var(--brand-danger)' : paletteColor(i) } })),
    label: { show: true, position: 'right', color: 'var(--brand-text-quiet)', fontSize: 11, formatter: (p: { value: number }) => `${p.value}${props.valueSuffix}` },
  }],
}))

function onClick(params: { name: string }) {
  emit('bar-click', { label: params.name })
}
</script>

<template>
  <BrandEmptyState v-if="!data.length" title="No data to display" description="The report will show up here." />
  <VChart v-else :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>
