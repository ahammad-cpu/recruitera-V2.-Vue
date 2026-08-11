import { useQuery } from '@tanstack/vue-query'
import type { TalentPoolsResponse } from '~/types'

export function useTalentPools() {
  return useQuery({
    queryKey: ['talent-pools'],
    queryFn: async () => {
      const res = await fetch('/api/talent-pools')
      if (!res.ok) throw new Error('Failed to fetch talent pools')
      return res.json() as Promise<TalentPoolsResponse>
    },
  })
}
