import type { DateRangePreset, DateRangeValue, JobDateRangePreset } from '~/types'

/** Full 18-option picker — General Reports global filter bar (BRD §2.6). */
export const DATE_RANGE_PRESETS: { value: DateRangePreset, label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This week' },
  { value: 'last_week', label: 'Last week' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_quarter', label: 'This quarter' },
  { value: 'last_quarter', label: 'Last quarter' },
  { value: 'this_year', label: 'This year' },
  { value: 'last_year', label: 'Last year' },
  { value: 'last_7', label: 'Last 7 days' },
  { value: 'last_14', label: 'Last 14 days' },
  { value: 'last_30', label: 'Last 30 days' },
  { value: 'last_60', label: 'Last 60 days' },
  { value: 'last_90', label: 'Last 90 days' },
  { value: 'last_365', label: 'Last 365 days' },
  { value: 'custom', label: 'Custom date range' },
  { value: 'all_time', label: 'All time' },
]

/** Simplified 5-option picker — Job-Level Reports tab only (BRD §3.4). */
export const JOB_DATE_RANGE_PRESETS: { value: JobDateRangePreset, label: string }[] = [
  { value: 'last_7', label: 'Last 7 days' },
  { value: 'last_30', label: 'Last 30 days' },
  { value: 'last_90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
  { value: 'all_time', label: 'All time' },
]

function startOfDay(d: Date) { const c = new Date(d); c.setHours(0, 0, 0, 0); return c }
function endOfDay(d: Date) { const c = new Date(d); c.setHours(23, 59, 59, 999); return c }
function addDays(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate() + n); return c }
function startOfWeek(d: Date) { const c = startOfDay(d); const day = c.getDay(); return addDays(c, -day) }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function startOfQuarter(d: Date) { return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1) }
function startOfYear(d: Date) { return new Date(d.getFullYear(), 0, 1) }

/** Resolves a preset (or custom bounds) into concrete inclusive from/to Dates. Null = no bound. */
export function resolveDateRange(preset: DateRangePreset | JobDateRangePreset, customFrom?: string | null, customTo?: string | null): { from: Date | null, to: Date | null } {
  const now = new Date()
  switch (preset) {
    case 'today': return { from: startOfDay(now), to: endOfDay(now) }
    case 'yesterday': { const y = addDays(now, -1); return { from: startOfDay(y), to: endOfDay(y) } }
    case 'this_week': return { from: startOfWeek(now), to: endOfDay(now) }
    case 'last_week': { const s = addDays(startOfWeek(now), -7); return { from: s, to: endOfDay(addDays(s, 6)) } }
    case 'this_month': return { from: startOfMonth(now), to: endOfDay(now) }
    case 'last_month': { const s = new Date(now.getFullYear(), now.getMonth() - 1, 1); return { from: s, to: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)) } }
    case 'this_quarter': return { from: startOfQuarter(now), to: endOfDay(now) }
    case 'last_quarter': { const s = startOfQuarter(now); const prevS = new Date(s.getFullYear(), s.getMonth() - 3, 1); return { from: prevS, to: endOfDay(addDays(s, -1)) } }
    case 'this_year': return { from: startOfYear(now), to: endOfDay(now) }
    case 'last_year': return { from: new Date(now.getFullYear() - 1, 0, 1), to: endOfDay(new Date(now.getFullYear() - 1, 11, 31)) }
    case 'last_7': return { from: startOfDay(addDays(now, -6)), to: endOfDay(now) }
    case 'last_14': return { from: startOfDay(addDays(now, -13)), to: endOfDay(now) }
    case 'last_30': return { from: startOfDay(addDays(now, -29)), to: endOfDay(now) }
    case 'last_60': return { from: startOfDay(addDays(now, -59)), to: endOfDay(now) }
    case 'last_90': return { from: startOfDay(addDays(now, -89)), to: endOfDay(now) }
    case 'last_365': return { from: startOfDay(addDays(now, -364)), to: endOfDay(now) }
    case 'custom': return { from: customFrom ? startOfDay(new Date(customFrom)) : null, to: customTo ? endOfDay(new Date(customTo)) : null }
    case 'all_time': default: return { from: null, to: null }
  }
}

export function defaultDateRangeValue(): DateRangeValue {
  return { preset: 'all_time', from: null, to: null }
}

export function dateRangeToParams(range: DateRangeValue): { from?: string, to?: string } {
  const { from, to } = resolveDateRange(range.preset, range.from, range.to)
  return { from: from?.toISOString(), to: to?.toISOString() }
}

/** Short "(Last 90 days)"-style suffix used next to KPI values throughout the module. */
export function dateRangeSuffix(preset: DateRangePreset | JobDateRangePreset): string {
  if (preset === 'all_time') return 'All time'
  const match = [...DATE_RANGE_PRESETS, ...JOB_DATE_RANGE_PRESETS].find(p => p.value === preset)
  return match?.label ?? 'All time'
}
