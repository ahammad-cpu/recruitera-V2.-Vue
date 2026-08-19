import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Ref } from 'vue'
import { useApi } from '~/composables/useApi'
import type { ManpowerProject, ManpowerResponse, NewManpowerProjectInput } from '~/types'

export function useManpowerProjects() {
  const api = useApi()
  return useQuery({
    queryKey: ['manpower', 'projects'],
    queryFn: () => api.get<ManpowerResponse>('/api/manpower/projects'),
  })
}

export function useManpowerProject(id: Ref<string>) {
  const api = useApi()
  return useQuery({
    queryKey: ['manpower', 'project', id],
    queryFn: () => api.get<ManpowerProject>(`/api/manpower/projects/${id.value}`),
  })
}

export function useManpowerMeta() {
  const api = useApi()
  return useQuery({
    queryKey: ['manpower', 'meta'],
    queryFn: () => api.get<{ departments: string[], locations: string[], members: { name: string, initials: string }[] }>('/api/manpower/meta'),
  })
}

export function useManpowerMutations() {
  const api = useApi()
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['manpower'] })
  const create = useMutation({ mutationFn: (input: NewManpowerProjectInput) => api.post<ManpowerProject>('/api/manpower/projects', input), onSuccess: invalidate })
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`/api/manpower/projects/${id}`), onSuccess: invalidate })
  return { create, remove }
}
