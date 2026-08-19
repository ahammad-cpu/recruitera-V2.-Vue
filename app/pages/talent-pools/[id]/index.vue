<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import { ArrowLeft, Pin, Bookmark, Pencil, Plus, FileText } from 'lucide-vue-next'
import { BrandPageTitle, BrandSearchBar, BrandButton } from '~/components/brand'
import ErrorBoundary from '~/components/ErrorBoundary.vue'
import CandidatesFilters from '~/components/candidates/CandidatesFilters.vue'
import CandidatesTable from '~/components/candidates/CandidatesTable.vue'
import CandidatesToolbar from '~/components/candidates/CandidatesToolbar.vue'
import CandidatesTableSkeleton from '~/components/candidates/CandidatesTableSkeleton.vue'
import CandidatesEmptyState from '~/components/candidates/CandidatesEmptyState.vue'
import CandidatesPerPage from '~/components/candidates/CandidatesPerPage.vue'
import { useCandidates } from '~/composables/useCandidates'
import { useTalentPool, useTalentPoolMutations } from '~/composables/useTalentPools'

definePageMeta({ layout: 'default' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const { data: pool } = useTalentPool(id)
const { follow } = useTalentPoolMutations()

const TABS = ['Filters', 'Activity', 'Notes', 'Files']
const tab = ref('Filters')

// Candidates scoped to this pool — reuse the exact Candidates-page components.
const searchInput = ref('')
const debouncedSearch = refDebounced(searchInput, 250)
const filtersPage = ref(1)
const filtersPerPage = ref(30)
const candidatesFilters = computed<Record<string, string | number | undefined>>(() => ({
  pool: pool.value?.name,
  search: debouncedSearch.value || undefined,
  page: filtersPage.value,
  perPage: filtersPerPage.value,
}))
const { data: candidatesData, isFetching: candidatesFetching } = useCandidates(candidatesFilters)
const candidates = computed(() => candidatesData.value?.data ?? [])
const totalCands = computed(() => candidatesData.value?.total ?? 0)
const totalPages = computed(() => candidatesData.value?.totalPages ?? 1)
const candIds = computed(() => candidates.value.map(c => c.id))
function onFiltersPageChange(p: number) { filtersPage.value = p }
function onFiltersPerPageChange(n: number) { filtersPerPage.value = n; filtersPage.value = 1 }
</script>

<template>
  <div class="flex flex-col h-full min-w-0 overflow-hidden bg-[var(--brand-canvas)]">
    <template v-if="pool">
      <!-- Header -->
      <div class="px-6 pt-5 pb-3 flex items-start justify-between gap-4 bg-[var(--brand-surface-white)]">
        <div class="flex items-start gap-3 min-w-0">
          <button type="button" class="w-9 h-9 rounded-lg grid place-items-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-lime-tint-hover)] transition shrink-0" aria-label="Back" @click="navigateTo('/talent-pools')"><ArrowLeft class="w-5 h-5" /></button>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-[20px] font-bold text-[var(--brand-text)] truncate">{{ pool.name }}</h1>
              <Pin v-if="pool.pinned" class="w-4 h-4 text-[var(--brand-teal)]" fill="currentColor" />
              <span class="text-[13px] font-medium text-[var(--brand-text-quiet)] tabular-nums">#{{ pool.code }}</span>
            </div>
            <p v-if="pool.description" class="text-[13px] text-[var(--brand-text-quiet)] truncate max-w-[640px]">{{ pool.description }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" class="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-semibold transition-colors" :class="pool.following ? 'text-[var(--brand-status-approved-text)]' : 'text-[var(--brand-text-secondary)] hover:bg-[var(--brand-lime-tint-hover)]'" @click="follow.mutate(pool.id)">
            <Bookmark class="w-4 h-4" :fill="pool.following ? 'currentColor' : 'none'" /> {{ pool.following ? 'Following' : 'Follow' }}
          </button>
          <BrandButton v-if="pool.category === 'event'" variant="outline" size="md" class="gap-1.5" @click="navigateTo(`/talent-pools/${pool.id}/form`)"><FileText class="w-3.5 h-3.5" /> {{ pool.hasForm ? 'Edit form' : 'Create Form' }}</BrandButton>
          <BrandButton v-if="!pool.system" variant="outline" size="md" class="gap-1.5" @click="navigateTo(`/talent-pools/${pool.id}/edit`)"><Pencil class="w-3.5 h-3.5" /> Edit</BrandButton>
        </div>
      </div>

      <!-- Tabs -->
      <div class="px-6 flex items-center gap-6 border-b border-[var(--brand-border-light)] bg-[var(--brand-surface-white)]">
        <button v-for="t in TABS" :key="t" type="button" class="pb-2.5 -mb-px text-[14px] font-semibold border-b-2 transition-colors" :class="tab === t ? 'text-[var(--brand-text)] border-[var(--brand-teal)]' : 'text-[var(--brand-text-quiet)] border-transparent hover:text-[var(--brand-text)]'" @click="tab = t">{{ t }}</button>
      </div>

      <!-- FILTERS tab: sidebar + candidate table (same shell as jobs) -->
      <div v-if="tab === 'Filters'" class="flex-1 min-h-0 flex overflow-hidden">
        <ErrorBoundary><CandidatesFilters /></ErrorBoundary>

        <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--brand-surface-white)] border-t border-[var(--brand-border)]">
          <div class="flex items-center justify-between gap-2 px-6 pt-5 pb-3">
            <BrandPageTitle label="Candidates" />
            <BrandButton variant="primary-teal" size="md" class="gap-1.5"><Plus class="w-4 h-4" /> Add candidates</BrandButton>
          </div>
          <div class="px-6 pb-3">
            <BrandSearchBar v-model="searchInput" size="lg" placeholder="Search candidates by anything or use keywords e.g. John AND manager" />
          </div>
          <div class="px-6 pb-2">
            <CandidatesToolbar :page-ids="candIds" :total="totalCands" :current-page="filtersPage" :total-pages="totalPages" :per-page="filtersPerPage" @page-change="onFiltersPageChange" />
          </div>
          <div class="flex-1 overflow-auto px-6 pb-3">
            <ErrorBoundary>
              <CandidatesTableSkeleton v-if="candidatesFetching && !candidates.length" />
              <CandidatesEmptyState v-else-if="!candidates.length" :has-filters="!!debouncedSearch" @clear="searchInput = ''" />
              <div v-else :class="candidatesFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'">
                <CandidatesTable :candidates="candidates" :is-fetching="candidatesFetching" />
                <CandidatesPerPage :per-page="filtersPerPage" :current-page="filtersPage" :total-pages="totalPages" @change="onFiltersPerPageChange" @page-change="onFiltersPageChange" />
              </div>
            </ErrorBoundary>
          </div>
        </div>
      </div>

      <!-- Other tabs -->
      <div v-else class="flex-1 overflow-auto px-6 py-6 bg-[var(--brand-surface-white)]">
        <div class="flex flex-col items-center justify-center gap-2 py-20 text-center">
          <div class="text-[15px] font-bold text-[var(--brand-text)]">{{ tab }}</div>
          <p class="text-[13px] text-[var(--brand-text-quiet)] max-w-[380px]">The pool's {{ tab }} view is part of the next phase of the Talent Pool module.</p>
        </div>
      </div>
    </template>

    <div v-else class="p-10 text-center bg-[var(--brand-surface-white)] flex-1">
      <div class="text-[15px] font-bold text-[var(--brand-text)]">Talent pool not found</div>
      <BrandButton variant="outline" class="mt-3" @click="navigateTo('/talent-pools')">Back to talent pools</BrandButton>
    </div>
  </div>
</template>
