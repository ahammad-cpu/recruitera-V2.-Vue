import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { DeleteTalentPoolInput, NewTalentPoolInput, TalentPool, TalentPoolFormField, TalentPoolsResponse, UpdateTalentPoolInput } from '~/types'

export interface TalentPoolQuery {
  scope: string // 'active' | 'archived'
  search: string
  filter: string // 'all' | 'followed'
}

export interface TalentPoolMemberOption { id: string, name: string, initials: string }

export function useTalentPoolMembers() {
  return useQuery({
    queryKey: ['talent-pool-members'],
    queryFn: async () => {
      const res = await fetch('/api/talent-pools/members')
      if (!res.ok) throw new Error('Failed to fetch members')
      return (await res.json() as { data: TalentPoolMemberOption[] }).data
    },
    staleTime: Infinity,
  })
}

export function useTalentPoolDepartments() {
  return useQuery({
    queryKey: ['talent-pool-departments'],
    queryFn: async () => {
      const res = await fetch('/api/talent-pools/departments')
      if (!res.ok) throw new Error('Failed to fetch departments')
      return (await res.json() as { data: string[] }).data
    },
    staleTime: Infinity,
  })
}

export function useTalentPool(id: MaybeRef<string>) {
  return useQuery({
    queryKey: ['talent-pool', id],
    queryFn: async () => {
      const res = await fetch(`/api/talent-pools/${unref(id)}`)
      if (!res.ok) throw new Error('Failed to fetch talent pool')
      return res.json() as Promise<TalentPool>
    },
  })
}

export function useTalentPools(query: MaybeRef<TalentPoolQuery>) {
  return useQuery({
    queryKey: ['talent-pools', query],
    queryFn: async () => {
      const q = unref(query)
      const params = new URLSearchParams({ scope: q.scope, search: q.search, filter: q.filter })
      const res = await fetch(`/api/talent-pools?${params}`)
      if (!res.ok) throw new Error('Failed to fetch talent pools')
      return res.json() as Promise<TalentPoolsResponse>
    },
    placeholderData: prev => prev,
  })
}

async function send(url: string, method: string, body?: unknown): Promise<TalentPool> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed: ${url}`)
  return res.json()
}

export function useTalentPoolMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['talent-pools'] })

  const create = useMutation({ mutationFn: (input: NewTalentPoolInput) => send('/api/talent-pools', 'POST', input), onSuccess: invalidate })
  const update = useMutation({ mutationFn: ({ id, input }: { id: string, input: UpdateTalentPoolInput }) => send(`/api/talent-pools/${id}`, 'PATCH', input), onSuccess: invalidate })
  const invalidateOne = (id: string) => { invalidate(); qc.invalidateQueries({ queryKey: ['talent-pool', id] }) }
  const saveForm = useMutation({ mutationFn: ({ id, formFields }: { id: string, formFields: TalentPoolFormField[] }) => send(`/api/talent-pools/${id}/form`, 'PATCH', { formFields }), onSuccess: (_d, v) => invalidateOne(v.id) })
  const publishForm = useMutation({ mutationFn: (id: string) => send(`/api/talent-pools/${id}/form/publish`, 'POST'), onSuccess: (_d, id) => invalidateOne(id) })
  const follow = useMutation({ mutationFn: (id: string) => send(`/api/talent-pools/${id}/follow`, 'POST'), onSuccess: invalidate })
  const archive = useMutation({ mutationFn: (id: string) => send(`/api/talent-pools/${id}/archive`, 'POST'), onSuccess: invalidate })
  const retrieve = useMutation({ mutationFn: (id: string) => send(`/api/talent-pools/${id}/retrieve`, 'POST'), onSuccess: invalidate })
  const remove = useMutation({
    mutationFn: async ({ id, input }: { id: string, input: DeleteTalentPoolInput }) => {
      const res = await fetch(`/api/talent-pools/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
      if (!res.ok) throw new Error('Failed to delete talent pool')
      return res.json()
    },
    onSuccess: invalidate,
  })

  return { create, update, saveForm, publishForm, follow, archive, retrieve, remove }
}
