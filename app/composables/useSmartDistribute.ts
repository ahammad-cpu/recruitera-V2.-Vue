import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { Ref } from 'vue'
import type { SmartDistributeCandidatesResponse, SmartDistributeConfig } from '~/types'
import { useApi } from '~/composables/useApi'

export function useSmartDistributeConfig(jobId: Ref<string> | string) {
  const api = useApi()
  const id = typeof jobId === 'string' ? ref(jobId) : jobId
  return useQuery({
    queryKey: ['smart-distribute', 'config', id],
    queryFn: () => api.get<SmartDistributeConfig>(`/api/jobs/${id.value}/smart-distribute`),
  })
}

export function useSmartDistributeCandidates(jobId: Ref<string> | string, recruiterId: Ref<string | null>) {
  const api = useApi()
  const id = typeof jobId === 'string' ? ref(jobId) : jobId
  return useQuery({
    queryKey: ['smart-distribute', 'candidates', id, recruiterId],
    queryFn: () => api.get<SmartDistributeCandidatesResponse>(
      `/api/jobs/${id.value}/smart-distribute/candidates?recruiterId=${recruiterId.value}`,
    ),
    enabled: computed(() => !!recruiterId.value),
  })
}

/**
 * The one mutation every Smart Distribute ownership action funnels through
 * — Team tab redistribute/remove/reassign, Filters-tab and Pipeline-tab
 * bulk assign. `recruiterId: null` un-assigns. Invalidates both candidate
 * queries and every smart-distribute config/candidates query so all three
 * surfaces pick up the change without manual refetch wiring per call site.
 */
export function useAssignCandidates() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      candidateIds: string[]
      recruiterId: string | null
      assignmentSource?: 'manual' | 'self' | 'external'
    }) =>
      api.post<{ updated: number }>('/api/candidates/assign', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate'] })
      queryClient.invalidateQueries({ queryKey: ['smart-distribute'] })
    },
  })
}
