/** Local per-section drill-down popup state (BRD §2.5) — every General
 * Reports section wires its charts' click events through this the same way. */
export function useReportDrillDown() {
  const state = reactive({
    open: false,
    dimension: '',
    value: '',
    chartName: '',
    contextLine: '',
  })

  function openDrillDown(dimension: string, value: string, chartName: string, contextLine?: string) {
    state.dimension = dimension
    state.value = value
    state.chartName = chartName
    state.contextLine = contextLine ?? value
    state.open = true
  }

  return { drillDown: state, openDrillDown }
}
