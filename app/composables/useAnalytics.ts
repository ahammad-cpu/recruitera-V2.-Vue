import { useQuery } from '@tanstack/vue-query'
import type { Ref } from 'vue'
import { useApi } from '~/composables/useApi'
import type { AnalyticsBoard, AnalyticsBoardSummary } from '~/types'

/** Reports/Analytics — board list + per-board metrics & charts (MSW). */
export function useAnalyticsBoards() {
  const api = useApi()
  return useQuery({
    queryKey: ['analytics', 'boards'],
    queryFn: () => api.get<{ data: AnalyticsBoardSummary[] }>('/api/analytics/boards'),
  })
}

export function useAnalyticsBoard(key: Ref<string>) {
  const api = useApi()
  return useQuery({
    queryKey: ['analytics', 'board', key],
    queryFn: () => api.get<AnalyticsBoard>(`/api/analytics/boards/${key.value}`),
    placeholderData: prev => prev,
  })
}
