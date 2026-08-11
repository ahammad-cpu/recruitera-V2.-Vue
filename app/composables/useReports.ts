import { useQuery } from '@tanstack/vue-query'
import type { Ref } from 'vue'
import type {
  CandidatesReportResponse, CareersSiteReportResponse, DateRangeValue, DisqualificationsReportResponse,
  EvaluationsReportResponse, HiresReportResponse, InterviewsReportResponse, JobReportResponse,
  JobsReportResponse, PipelinesReportResponse, ReportFilterOptions,
} from '~/types'
import { useApi } from '~/composables/useApi'
import { useReportsStore } from '~/stores/reports.store'
import { dateRangeToParams } from '~/utils/dateRangePresets'

/** One query per General Reports section, all sharing the same reactive
 * global-filter query string from reports.store.ts (persists across section
 * switches — R-G01). Reports is one domain -> one composable file. */
function useReportQuery<T>(key: string, path: string) {
  const api = useApi()
  const store = useReportsStore()
  const params = computed(() => store.queryParams)
  return useQuery({
    queryKey: [key, params],
    queryFn: () => api.get<T>(`${path}?${new URLSearchParams(params.value)}`),
  })
}

export function useReportFilterOptions() {
  const api = useApi()
  return useQuery({
    queryKey: ['reports-filter-options'],
    queryFn: () => api.get<ReportFilterOptions>('/api/reports/filter-options'),
  })
}

export function useJobsReport() { return useReportQuery<JobsReportResponse>('reports-jobs', '/api/reports/jobs') }
export function useCandidatesReport() { return useReportQuery<CandidatesReportResponse>('reports-candidates', '/api/reports/candidates') }
export function usePipelinesReport() { return useReportQuery<PipelinesReportResponse>('reports-pipelines', '/api/reports/pipelines') }
export function useDisqualificationsReport() { return useReportQuery<DisqualificationsReportResponse>('reports-disqualifications', '/api/reports/disqualifications') }
export function useHiresReport() { return useReportQuery<HiresReportResponse>('reports-hires', '/api/reports/hires') }
export function useInterviewsReport() { return useReportQuery<InterviewsReportResponse>('reports-interviews', '/api/reports/interviews') }
export function useEvaluationsReport() { return useReportQuery<EvaluationsReportResponse>('reports-evaluations', '/api/reports/evaluations') }
export function useCareersSiteReport() { return useReportQuery<CareersSiteReportResponse>('reports-careers-site', '/api/reports/careers-site') }

/** Job-Level Reports tab — its own page-local date range, not the global store. */
export function useJobReport(jobId: Ref<string>, dateRange: Ref<DateRangeValue>) {
  const api = useApi()
  return useQuery({
    queryKey: ['reports-job', jobId, dateRange],
    queryFn: () => {
      const { from, to } = dateRangeToParams(dateRange.value)
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      return api.get<JobReportResponse>(`/api/reports/jobs/${jobId.value}?${params}`)
    },
  })
}
