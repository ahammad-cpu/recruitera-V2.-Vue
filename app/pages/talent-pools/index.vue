<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import { Plus, FolderOpen, Sparkles, Archive } from 'lucide-vue-next'
import { BrandPageTitle, BrandSearchBar, BrandButton, BrandEmptyState } from '~/components/brand'
import TalentPoolCard from '~/components/talent-pools/TalentPoolCard.vue'
import DeleteTalentPoolDialog from '~/components/talent-pools/DeleteTalentPoolDialog.vue'
import { useTalentPools, useTalentPoolMutations } from '~/composables/useTalentPools'
import type { DeleteTalentPoolInput, TalentPool } from '~/types'

definePageMeta({ layout: 'default' })

const scope = ref<'active' | 'archived'>('active')
const filter = ref<'all' | 'followed'>('all')
const searchInput = ref('')
const debouncedSearch = refDebounced(searchInput, 300)

const query = computed(() => ({ scope: scope.value, search: debouncedSearch.value, filter: scope.value === 'active' ? filter.value : 'all' }))
const { data, isFetching } = useTalentPools(query)
const pools = computed(() => data.value?.data ?? [])
const counts = computed(() => data.value?.counts ?? { all: 0, followed: 0, archived: 0 })

const { follow, archive, retrieve, remove } = useTalentPoolMutations()

const showSkeleton = computed(() => isFetching.value && !data.value)
const hasSearch = computed(() => !!debouncedSearch.value)

const deleteTarget = ref<TalentPool | null>(null)
const deleteDestinations = computed(() => pools.value.filter(p => p.id !== deleteTarget.value?.id).map(p => ({ id: p.id, name: p.name })))
function onDelete(payload: DeleteTalentPoolInput) {
  if (deleteTarget.value) remove.mutate({ id: deleteTarget.value.id, input: payload }, { onSuccess: () => { deleteTarget.value = null } })
}
function copyFormLink(p: TalentPool) { navigator.clipboard?.writeText(`${location.origin}/apply/pool/${p.id}`).catch(() => {}) }

const FILTERS = [{ id: 'all', label: 'All', key: 'all' }, { id: 'followed', label: 'Followed', key: 'followed' }] as const
</script>

<template>
  <div class="flex flex-col h-full min-w-0 overflow-hidden bg-[var(--brand-surface-white)] border-t border-[var(--brand-border)]">
    <div class="px-6 pt-5 pb-2">
      <BrandPageTitle label="Talent Pools" />
    </div>

    <!-- Active / Archived -->
    <div class="px-6 flex items-center gap-6 border-b border-[var(--brand-border-light)]">
      <button type="button" class="flex items-center gap-1.5 pb-2.5 -mb-px text-[14px] font-semibold border-b-2 transition-colors" :class="scope === 'active' ? 'text-[var(--brand-text)] border-[var(--brand-teal)]' : 'text-[var(--brand-text-quiet)] border-transparent hover:text-[var(--brand-text)]'" @click="scope = 'active'">
        <Sparkles class="w-4 h-4" /> Active talent pools
      </button>
      <button type="button" class="flex items-center gap-1.5 pb-2.5 -mb-px text-[14px] font-semibold border-b-2 transition-colors" :class="scope === 'archived' ? 'text-[var(--brand-text)] border-[var(--brand-teal)]' : 'text-[var(--brand-text-quiet)] border-transparent hover:text-[var(--brand-text)]'" @click="scope = 'archived'">
        <Archive class="w-4 h-4" /> Archived <span class="text-[var(--brand-text-quiet)] tabular-nums">{{ counts.archived }}</span>
      </button>
    </div>

    <!-- Toolbar -->
    <div class="px-6 py-3.5 flex items-center gap-3 flex-wrap">
      <div v-if="scope === 'active'" class="inline-flex items-center rounded-[10px] border border-[var(--brand-border)] overflow-hidden">
        <button v-for="f in FILTERS" :key="f.id" type="button" class="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-semibold border-l first:border-l-0 border-[var(--brand-border)] transition-colors" :class="filter === f.id ? 'bg-[var(--brand-lime-tint-hover)] text-[var(--brand-text)]' : 'text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)]'" @click="filter = f.id">
          {{ f.label }}
          <span class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[11px] font-bold tabular-nums" :class="filter === f.id ? 'bg-white text-[var(--brand-teal)]' : 'bg-[var(--brand-canvas)] text-[var(--brand-text-muted)]'">{{ counts[f.key] }}</span>
        </button>
      </div>

      <div class="flex-1 min-w-[220px] max-w-[420px]">
        <BrandSearchBar v-model="searchInput" placeholder="Search talent pools" />
      </div>

      <div class="ml-auto">
        <BrandButton variant="primary-teal" size="md" class="gap-2" @click="navigateTo('/talent-pools/new')">
          <Plus class="w-4 h-4" /> New talent pool
        </BrandButton>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto px-6 pb-6">
      <div v-if="showSkeleton" class="space-y-3 pt-2">
        <div v-for="i in 4" :key="i" class="h-[116px] rounded-[14px] border border-[var(--brand-border-light)] bg-[var(--brand-canvas)] animate-pulse" />
      </div>

      <BrandEmptyState
        v-else-if="pools.length === 0"
        :icon="FolderOpen"
        :title="hasSearch ? 'No talent pools found' : (scope === 'archived' ? 'Nothing archived' : (filter === 'followed' ? 'No followed pools' : 'No talent pools yet'))"
        :description="hasSearch ? 'Try a different search term.' : 'Create a talent pool to start organizing candidates for future roles.'"
      >
        <BrandButton v-if="!hasSearch && scope === 'active' && filter === 'all'" variant="primary-teal" size="md" class="gap-2" @click="navigateTo('/talent-pools/new')"><Plus class="w-4 h-4" /> New talent pool</BrandButton>
      </BrandEmptyState>

      <div v-else class="pt-1 space-y-3" :class="isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'">
        <TalentPoolCard
          v-for="p in pools"
          :key="p.id"
          :pool="p"
          @open="navigateTo(`/talent-pools/${p.id}`)"
          @edit="navigateTo(`/talent-pools/${p.id}/edit`)"
          @follow="follow.mutate(p.id)"
          @form-link="copyFormLink(p)"
          @archive="archive.mutate(p.id)"
          @retrieve="retrieve.mutate(p.id)"
          @delete="deleteTarget = p"
        />
      </div>
    </div>

    <DeleteTalentPoolDialog
      :open="!!deleteTarget"
      :pool="deleteTarget"
      :destinations="deleteDestinations"
      :submitting="remove.isPending.value"
      @update:open="(o) => { if (!o) deleteTarget = null }"
      @confirm="onDelete"
    />
  </div>
</template>
