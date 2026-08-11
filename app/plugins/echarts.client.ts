import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart, FunnelChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DatasetComponent } from 'echarts/components'

// SVG renderer (not canvas) so chart colors are real DOM elements that can
// reference var(--brand-*) tokens directly — required by local/no-hex-colors,
// and keeps charts theme-aware without any runtime color resolution.
export default defineNuxtPlugin(() => {
  use([SVGRenderer, LineChart, BarChart, PieChart, FunnelChart, GridComponent, TooltipComponent, LegendComponent, DatasetComponent])
})
