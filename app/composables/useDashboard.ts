import { useQuery } from '@tanstack/vue-query'
import { useApi } from '~/composables/useApi'
import type {
  DashboardRecent, DashboardNewCandidate, DashboardAppliedStats, DashboardEvaluation,
  DashboardTask, DashboardNoteGroup, DashboardActivityGroup, DashboardEvent, DashboardTag, DashboardSource,
} from '~/types'

/** Home / Overview dashboard data — all served by MSW (dashboard.handlers). */
export function useDashboardRecents() {
  const api = useApi()
  return useQuery({
    queryKey: ['dashboard', 'recents'],
    queryFn: () => api.get<{ data: DashboardRecent[] }>('/api/dashboard/recents'),
  })
}

export function useDashboardEvents() {
  const api = useApi()
  return useQuery({
    queryKey: ['dashboard', 'events'],
    queryFn: () => api.get<{ data: DashboardEvent[] }>('/api/dashboard/events'),
  })
}

export function useDashboardTags() {
  const api = useApi()
  return useQuery({
    queryKey: ['dashboard', 'tags'],
    queryFn: () => api.get<{ data: DashboardTag[] }>('/api/dashboard/tags'),
  })
}

export function useDashboardSources() {
  const api = useApi()
  return useQuery({
    queryKey: ['dashboard', 'sources'],
    queryFn: () => api.get<{ data: DashboardSource[] }>('/api/dashboard/sources'),
  })
}

export function useDashboardNewCandidates() {
  const api = useApi()
  return useQuery({
    queryKey: ['dashboard', 'new-candidates'],
    queryFn: () => api.get<{ data: DashboardNewCandidate[] }>('/api/dashboard/new-candidates'),
  })
}

export function useDashboardAppliedStats() {
  const api = useApi()
  return useQuery({
    queryKey: ['dashboard', 'applied-stats'],
    queryFn: () => api.get<DashboardAppliedStats>('/api/dashboard/applied-stats'),
  })
}

export function useDashboardEvaluations() {
  const api = useApi()
  return useQuery({
    queryKey: ['dashboard', 'evaluations'],
    queryFn: () => api.get<{ data: DashboardEvaluation[] }>('/api/dashboard/evaluations'),
  })
}

export function useDashboardTasks() {
  const api = useApi()
  return useQuery({
    queryKey: ['dashboard', 'tasks'],
    queryFn: () => api.get<{ data: DashboardTask[] }>('/api/dashboard/tasks'),
  })
}

export function useDashboardNotes() {
  const api = useApi()
  return useQuery({
    queryKey: ['dashboard', 'notes'],
    queryFn: () => api.get<{ data: DashboardNoteGroup[] }>('/api/dashboard/notes'),
  })
}

export function useDashboardActivity() {
  const api = useApi()
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => api.get<{ data: DashboardActivityGroup[] }>('/api/dashboard/activity'),
  })
}
