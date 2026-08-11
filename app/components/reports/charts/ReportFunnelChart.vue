<!-- Funnel chart — Pipeline Funnel, Candidates per stage, Proceed/Drop-off
     rate per stage, Conversion rate per stage (BRD calls these "Funnel" or
     "Funnel / bar" or "Funnel table" throughout — a real funnel shape reads
     better than a bar for an ordered, narrowing pipeline). -->
<script setup lang="ts">
import VChart from 'vue-echarts'
import type { FunnelStep } from '~/types'
import { paletteColor } from '../chartPalette'

const props = withDefaults(defineProps<{
  data: FunnelStep[]
  height?: number
  /** Show proceed-rate % (default) or drop-off % as the trailing label. */
  labelMetric?: 'proceedRate' | 'dropOffRate'
}>(), { height: 320, labelMetric: 'proceedRate' })

const emit = defineEmits<{ 'stage-click': [{ stage: string }] }>()

const option = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: (p: { name: string, data: FunnelStep }) => `${p.name}<br/>${p.data.entered} candidates · ${p.data.proceedRate}% proceeded`,
  },
  series: [{
    type: 'funnel',
    left: 8,
    right: 8,
    top: 8,
    bottom: 8,
    minSize: '18%',
    maxSize: '100%',
    sort: 'none',
    gap: 3,
    label: {
      show: true,
      position: 'inside',
      color: 'var(--brand-avatar-text)',
      fontSize: 12,
      fontWeight: 600,
      formatter: (p: { name: string, data: FunnelStep }) => `${p.name}\n${p.data.entered} · ${props.labelMetric === 'dropOffRate' ? p.data.dropOffRate : p.data.proceedRate}%`,
    },
    itemStyle: { borderColor: 'var(--brand-surface-white)', borderWidth: 2 },
    data: props.data.map((d, i) => ({ name: d.stage, value: d.entered, ...d, itemStyle: { color: paletteColor(i) } })),
  }],
}))

function onClick(params: { name: string }) {
  emit('stage-click', { stage: params.name })
}
</script>

<template>
  <BrandEmptyState v-if="!data.length" title="No data to display" description="The report will show up here." />
  <VChart v-else :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>
