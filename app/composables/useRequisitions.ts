import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { NewRequisitionInput, Requisition, RequisitionsResponse, UpdateRequisitionInput } from '~/types'

export interface RequisitionQuery {
  scope: string // 'active' | 'archived'
  filter: string // 'all' | 'approval' | 'mine'
  search: string
}

export interface RequisitionMember { id: string, name: string, initials: string, role: string }

export function useRequisitionMembers() {
  return useQuery({
    queryKey: ['requisition-members'],
    queryFn: async () => {
      const res = await fetch('/api/requisitions/members')
      if (!res.ok) throw new Error('Failed to fetch members')
      return (await res.json() as { data: RequisitionMember[] }).data
    },
    staleTime: Infinity,
  })
}

export function useRequisitionWorkload() {
  return useQuery({
    queryKey: ['requisition-workload'],
    queryFn: async () => {
      const res = await fetch('/api/requisitions/workload')
      if (!res.ok) throw new Error('Failed to fetch workload')
      return res.json() as Promise<import('~/types').RequisitionWorkloadResponse>
    },
  })
}

export function useRequisitionCurrentUser() {
  return useQuery({
    queryKey: ['requisition-me'],
    queryFn: async () => {
      const res = await fetch('/api/requisitions/me')
      if (!res.ok) throw new Error('Failed to fetch current user')
      return res.json() as Promise<{ id: string, name: string, initials: string }>
    },
    staleTime: Infinity,
  })
}

export function useRequisitionProjects() {
  return useQuery({
    queryKey: ['requisition-projects'],
    queryFn: async () => {
      const res = await fetch('/api/requisitions/projects')
      if (!res.ok) throw new Error('Failed to fetch projects')
      return (await res.json() as { data: string[] }).data
    },
    staleTime: Infinity,
  })
}

export function useRequisitions(query: MaybeRef<RequisitionQuery>) {
  return useQuery({
    queryKey: ['requisitions', query],
    queryFn: async () => {
      const q = unref(query)
      const params = new URLSearchParams({ scope: q.scope, filter: q.filter, search: q.search })
      const res = await fetch(`/api/requisitions?${params}`)
      if (!res.ok) throw new Error('Failed to fetch requisitions')
      return res.json() as Promise<RequisitionsResponse>
    },
    placeholderData: prev => prev,
  })
}

export function useRequisition(id: MaybeRef<string>) {
  return useQuery({
    queryKey: ['requisition', id],
    queryFn: async () => {
      const res = await fetch(`/api/requisitions/${unref(id)}`)
      if (!res.ok) throw new Error('Failed to fetch requisition')
      return res.json() as Promise<Requisition>
    },
  })
}

async function req(url: string, method = 'POST', body?: unknown): Promise<Requisition> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const msg = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(msg.error || `Request failed: ${url}`)
  }
  return res.json()
}

export function useRequisitionMutations() {
  const qc = useQueryClient()
  const invalidate = (id?: string) => {
    qc.invalidateQueries({ queryKey: ['requisitions'] })
    qc.invalidateQueries({ queryKey: ['requisition-workload'] })
    if (id) qc.invalidateQueries({ queryKey: ['requisition', id] })
  }

  const create = useMutation({
    mutationFn: (input: NewRequisitionInput) => req('/api/requisitions', 'POST', input),
    onSuccess: () => invalidate(),
  })
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string, input: UpdateRequisitionInput }) => req(`/api/requisitions/${id}`, 'PATCH', input),
    onSuccess: (_d, v) => invalidate(v.id),
  })
  const submit = useMutation({
    mutationFn: (id: string) => req(`/api/requisitions/${id}/submit`),
    onSuccess: (_d, id) => invalidate(id),
  })
  const approve = useMutation({
    mutationFn: ({ id, note }: { id: string, note?: string }) => req(`/api/requisitions/${id}/approve`, 'POST', { note }),
    onSuccess: (_d, v) => invalidate(v.id),
  })
  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string, note?: string }) => req(`/api/requisitions/${id}/reject`, 'POST', { note }),
    onSuccess: (_d, v) => invalidate(v.id),
  })
  const follow = useMutation({
    mutationFn: (id: string) => req(`/api/requisitions/${id}/follow`),
    onSuccess: (_d, id) => invalidate(id),
  })
  const archive = useMutation({
    mutationFn: (id: string) => req(`/api/requisitions/${id}/archive`),
    onSuccess: (_d, id) => invalidate(id),
  })
  const duplicate = useMutation({
    mutationFn: (id: string) => req(`/api/requisitions/${id}/duplicate`),
    onSuccess: () => invalidate(),
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/requisitions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete requisition')
      return res.json()
    },
    onSuccess: () => invalidate(),
  })

  return { create, update, submit, approve, reject, follow, archive, duplicate, remove }
}
