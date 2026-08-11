import { defineStore } from 'pinia'
import { defaultDateRangeValue, dateRangeToParams } from '~/utils/dateRangePresets'
import type { CollarFilter, DateRangeValue } from '~/types'

/** Global filter state for the 8 General Reports sections — persists as the
 * user switches sections (R-G01), which is exactly what a page-local ref
 * can't do. Job-Level Reports (jobs/[id]/index.vue) has its own page-local
 * date range instead — the two surfaces don't share filter state (BRD §1). */
export const useReportsStore = defineStore('reports', () => {
  const dateRange = ref<DateRangeValue>(defaultDateRangeValue())
  const departments = ref<string[]>([])
  const jobIds = ref<string[]>([])
  const recruiterIds = ref<string[]>([])
  const hiringManagerIds = ref<string[]>([])
  const talentPoolIds = ref<string[]>([])
  const collar = ref<CollarFilter>('all')

  const queryParams = computed<Record<string, string>>(() => {
    const { from, to } = dateRangeToParams(dateRange.value)
    const params: Record<string, string> = {}
    if (from) params.from = from
    if (to) params.to = to
    if (departments.value.length) params.departments = departments.value.join(',')
    if (jobIds.value.length) params.jobIds = jobIds.value.join(',')
    if (recruiterIds.value.length) params.recruiterIds = recruiterIds.value.join(',')
    if (hiringManagerIds.value.length) params.hiringManagerIds = hiringManagerIds.value.join(',')
    if (talentPoolIds.value.length) params.talentPoolIds = talentPoolIds.value.join(',')
    if (collar.value !== 'all') params.collar = collar.value
    return params
  })

  const activeFilterCount = computed(() =>
    departments.value.length + jobIds.value.length + recruiterIds.value.length
    + hiringManagerIds.value.length + talentPoolIds.value.length + (collar.value !== 'all' ? 1 : 0),
  )

  function resetFilters() {
    departments.value = []
    jobIds.value = []
    recruiterIds.value = []
    hiringManagerIds.value = []
    talentPoolIds.value = []
    collar.value = 'all'
  }

  return { dateRange, departments, jobIds, recruiterIds, hiringManagerIds, talentPoolIds, collar, queryParams, activeFilterCount, resetFilters }
})
