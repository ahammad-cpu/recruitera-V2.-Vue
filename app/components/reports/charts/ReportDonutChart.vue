<!-- Donut chart — Sources, New candidates by status, Evaluation request
     status, etc. Legend lists label + count + percent per BRD's spec. -->
<script setup lang="ts">
import VChart from 'vue-echarts'
import type { CategoryValue } from '~/types'
import { paletteColor } from '../chartPalette'

const props = withDefaults(defineProps<{
  data: CategoryValue[]
  height?: number
}>(), { height: 260 })

const emit = defineEmits<{ 'segment-click': [{ label: string }] }>()

const option = computed(() => ({
  tooltip: { trigger: 'item', formatter: (p: { name: string, value: number, percent: number }) => `${p.name}: ${p.value} (${p.percent}%)` },
  legend: {
    orient: 'vertical',
    right: 8,
    top: 'middle',
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { color: 'var(--brand-text)', fontSize: 12 },
    formatter: (name: string) => {
      const row = props.data.find(d => d.label === name)
      return `${name}  ${row?.value ?? 0} (${row?.percent ?? 0}%)`
    },
  },
  series: [{
    type: 'pie',
    radius: ['48%', '72%'],
    center: ['34%', '50%'],
    avoidLabelOverlap: true,
    label: { show: false },
    data: props.data.map((d, i) => ({ name: d.label, value: d.value, itemStyle: { color: paletteColor(i) } })),
  }],
}))

function onClick(params: { name: string }) {
  emit('segment-click', { label: params.name })
}
</script>

<template>
  <BrandEmptyState v-if="!data.length" title="No data to display" description="The report will show up here." />
  <VChart v-else :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>
