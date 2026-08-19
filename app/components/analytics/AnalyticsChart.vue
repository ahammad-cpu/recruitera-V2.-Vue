<!--
  Lightweight analytics chart — no external chart lib. Supports:
   • hbars  — horizontal bars (distributions, funnels, "by X")
   • bars   — vertical bars (counts over categories)
   • area   — area line, 1 or 2 series (trends over time)
  All colors are --brand-* tokens.
-->
<script setup lang="ts">
import type { AnalyticsChart } from '~/types'

const props = defineProps<{ chart: AnalyticsChart }>()

const points = computed(() => props.chart.points)
const max = computed(() => Math.max(1, ...points.value.flatMap(p => [p.value, p.value2 ?? 0])))
const unit = computed(() => props.chart.unit ?? '')

const C1 = 'var(--brand-teal-secondary)'
const C2 = 'color-mix(in srgb, var(--brand-teal-secondary) 35%, white)'

function pct(v: number) { return Math.round((v / max.value) * 100) }

// area geometry (viewBox 0 0 100 40) — smooth Catmull-Rom → cubic-bézier curve
function coords(series: 'value' | 'value2') {
  const n = points.value.length
  return points.value.map((p, i) => ({
    x: n === 1 ? 50 : (i / (n - 1)) * 100,
    y: 40 - ((p[series] ?? 0) / max.value) * 37 - 1.5,
  }))
}
function curveCmds(pts: { x: number, y: number }[]) {
  let d = ''
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}
function linePath(series: 'value' | 'value2') {
  const pts = coords(series)
  if (pts.length < 2) return pts.length ? `M ${pts[0]!.x} ${pts[0]!.y}` : ''
  return `M ${pts[0]!.x.toFixed(2)} ${pts[0]!.y.toFixed(2)}${curveCmds(pts)}`
}
function areaPath(series: 'value' | 'value2') {
  const pts = coords(series)
  if (pts.length < 2) return ''
  return `M ${pts[0]!.x.toFixed(2)} 40 L ${pts[0]!.x.toFixed(2)} ${pts[0]!.y.toFixed(2)}${curveCmds(pts)} L ${pts[pts.length - 1]!.x.toFixed(2)} 40 Z`
}
const hasSecond = computed(() => points.value.some(p => p.value2 !== undefined))
</script>

<template>
  <!-- Horizontal bars -->
  <div v-if="chart.type === 'hbars'" class="space-y-2.5 pt-1">
    <div v-for="p in points" :key="p.label" class="flex items-center gap-3">
      <div class="w-[128px] shrink-0 text-[12.5px] text-[var(--brand-text-secondary)] truncate" :title="p.label">{{ p.label }}</div>
      <div class="flex-1 h-2.5 rounded-full bg-[var(--brand-canvas)] overflow-hidden">
        <div class="h-full rounded-full transition-[width]" :style="{ width: `${pct(p.value)}%`, background: C1 }" />
      </div>
      <div class="w-14 text-right text-[12.5px] font-bold text-[var(--brand-text)] tabular-nums">{{ p.value }}{{ unit }}</div>
    </div>
  </div>

  <!-- Vertical bars -->
  <div v-else-if="chart.type === 'bars'">
    <div class="flex items-end gap-3 h-[168px]">
      <div v-for="p in points" :key="p.label" class="flex-1 flex flex-col justify-end items-center h-full">
        <span class="text-[11px] font-semibold text-[var(--brand-text-muted)] tabular-nums mb-1">{{ p.value }}</span>
        <div class="w-full max-w-[46px] rounded-t-[5px] transition-[height]" :style="{ height: `${Math.max(2, pct(p.value))}%`, background: C1 }" />
      </div>
    </div>
    <div class="flex gap-3 mt-2">
      <div v-for="p in points" :key="p.label" class="flex-1 text-center text-[11px] text-[var(--brand-text-quiet)] truncate">{{ p.label }}</div>
    </div>
  </div>

  <!-- Area / trend -->
  <div v-else>
    <div class="relative">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" class="w-full h-[168px]">
        <line v-for="g in [10, 20, 30]" :key="g" x1="0" :y1="g" x2="100" :y2="g" stroke="var(--brand-border-fade)" stroke-width="0.5" vector-effect="non-scaling-stroke" />
        <path v-if="hasSecond" :d="areaPath('value2')" :fill="C2" opacity="0.5" />
        <path v-if="hasSecond" :d="linePath('value2')" fill="none" :stroke="C2" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round" />
        <path :d="areaPath('value')" :fill="C1" opacity="0.14" />
        <path :d="linePath('value')" fill="none" :stroke="C1" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round" />
      </svg>
    </div>
    <div class="flex mt-2">
      <div v-for="p in points" :key="p.label" class="flex-1 text-center text-[11px] text-[var(--brand-text-quiet)]">{{ p.label }}</div>
    </div>
    <div v-if="chart.seriesLabels" class="flex items-center gap-4 mt-3 text-[11.5px] text-[var(--brand-text-secondary)]">
      <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" :style="{ background: C1 }" /> {{ chart.seriesLabels[0] }}</span>
      <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" :style="{ background: C2 }" /> {{ chart.seriesLabels[1] }}</span>
    </div>
  </div>
</template>
