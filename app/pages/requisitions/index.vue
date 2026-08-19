<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import { Plus, ClipboardList, ChevronDown, Rows3, Columns3, Sparkles, ArrowDownUp, Users, CalendarRange } from 'lucide-vue-next'
import { BrandSearchBar, BrandButton, BrandEmptyState } from '~/components/brand'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '~/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import RequisitionCard from '~/components/requisitions/RequisitionCard.vue'
import RequisitionBoardCard from '~/components/requisitions/RequisitionBoardCard.vue'
import RequisitionWorkloadTable from '~/components/requisitions/RequisitionWorkloadTable.vue'
import RequisitionTimeline from '~/components/requisitions/RequisitionTimeline.vue'
import NewRequisitionDialog from '~/components/requisitions/NewRequisitionDialog.vue'
import { useRequisitions, useRequisitionMutations, useRequisitionProjects, useRequisitionWorkload } from '~/composables/useRequisitions'
import { REQUISITION_STATUS_META, type NewRequisitionInput, type Requisition, type RequisitionFilter, type RequisitionView } from '~/types'

definePageMeta({ layout: 'default' })

// Top tabs: Active list · Hiring Timeline · Team-Lead Workload.
const topTab = ref<'active' | 'timeline' | 'workload'>('active')
const filter = ref<RequisitionFilter>('all')
const view = ref<RequisitionView>('list')
const searchInput = ref('')
const debouncedSearch = refDebounced(searchInput, 300)

const query = computed(() => ({
  scope: 'active',
  filter: topTab.value === 'active' ? filter.value : 'all',
  search: topTab.value === 'active' ? debouncedSearch.value : '',
}))
const { data, isFetching } = useRequisitions(query)
const counts = computed(() => data.value?.counts ?? { all: 0, approval: 0, mine: 0, assigned: 0 })

// Workload dashboard + timeline
const { data: workloadData } = useRequisitionWorkload()
const workload = computed(() => workloadData.value?.data ?? [])
const timelineReqs = computed(() => (data.value?.groups ?? []).flatMap(g => g.items))
const total = computed(() => data.value?.total ?? 0)
const currentUserId = computed(() => data.value?.currentUserId ?? '')

// Sort within groups
const SORT_OPTIONS = [{ key: 'status', label: 'Status' }, { key: 'updated', label: 'Last updated' }, { key: 'title', label: 'A–Z' }] as const
const sortKey = ref<'status' | 'updated' | 'title'>('status')
const sortLabel = computed(() => SORT_OPTIONS.find(o => o.key === sortKey.value)!.label)
const groups = computed(() => (data.value?.groups ?? []).map(g => ({
  ...g,
  items: sortKey.value === 'title'
    ? [...g.items].sort((a, b) => a.title.localeCompare(b.title))
    : sortKey.value === 'updated'
      ? [...g.items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      : g.items,
})))

const { data: projects } = useRequisitionProjects()
const { create, follow, duplicate, archive, remove } = useRequisitionMutations()

const showSkeleton = computed(() => isFetching.value && !data.value)
const hasSearchOrFilter = computed(() => !!debouncedSearch.value || filter.value !== 'all')

const collapsed = reactive<Record<string, boolean>>({})
function toggleGroup(status: string) { collapsed[status] = !collapsed[status] }

const newOpen = ref(false)
const confirmDeleteId = ref<string | null>(null)

const FILTERS: { id: RequisitionFilter, label: string, key: 'all' | 'approval' | 'mine' | 'assigned' }[] = [
  { id: 'all', label: 'All', key: 'all' },
  { id: 'approval', label: 'Need my approval', key: 'approval' },
  { id: 'mine', label: 'Requested by me', key: 'mine' },
  { id: 'assigned', label: 'Assigned to me', key: 'assigned' },
]

function openDetail(r: Requisition) { navigateTo(`/requisitions/${r.id}`) }
function onCreate(payload: NewRequisitionInput) {
  create.mutate(payload, { onSuccess: (created) => { newOpen.value = false; navigateTo(`/requisitions/${created.id}`) } })
}
function doDelete() { if (confirmDeleteId.value) remove.mutate(confirmDeleteId.value, { onSuccess: () => { confirmDeleteId.value = null } }) }
function statusMeta(s: string) { return REQUISITION_STATUS_META[s as keyof typeof REQUISITION_STATUS_META] }

// Kanban column dot colours, one per status.
const STATUS_DOT: Record<string, string> = {
  draft: 'var(--brand-text-quiet)',
  pending: 'var(--brand-status-pending-text)',
  approved: 'var(--brand-status-approved-text)',
  filled: 'var(--brand-status-teal-green)',
  rejected: 'var(--brand-danger)',
}
</script>

<template>
  <div class="flex flex-col h-full min-w-0 overflow-hidden bg-[var(--brand-surface-white)] border-t border-[var(--brand-border)]">
    <!-- Active / Archived / Workload -->
    <div class="px-6 pt-5 flex items-center gap-6 border-b border-[var(--brand-border-light)]">
      <button type="button" class="flex items-center gap-1.5 pb-2.5 -mb-px text-[14.5px] font-semibold border-b-2 transition-colors" :class="topTab === 'active' ? 'text-[var(--brand-text)] border-[var(--brand-teal)]' : 'text-[var(--brand-text-quiet)] border-transparent hover:text-[var(--brand-text)]'" @click="topTab = 'active'">
        <Sparkles class="w-4 h-4" /> Active requisitions
      </button>
      <button type="button" class="flex items-center gap-1.5 pb-2.5 -mb-px text-[14.5px] font-semibold border-b-2 transition-colors" :class="topTab === 'timeline' ? 'text-[var(--brand-text)] border-[var(--brand-teal)]' : 'text-[var(--brand-text-quiet)] border-transparent hover:text-[var(--brand-text)]'" @click="topTab = 'timeline'">
        <CalendarRange class="w-4 h-4" /> Hiring Timeline
      </button>
      <button type="button" class="flex items-center gap-1.5 pb-2.5 -mb-px text-[14.5px] font-semibold border-b-2 transition-colors" :class="topTab === 'workload' ? 'text-[var(--brand-text)] border-[var(--brand-teal)]' : 'text-[var(--brand-text-quiet)] border-transparent hover:text-[var(--brand-text)]'" @click="topTab = 'workload'">
        <Users class="w-4 h-4" /> Workload
      </button>
    </div>

    <!-- Toolbar (active list only) -->
    <div v-if="topTab === 'active'" class="px-6 py-3.5 flex items-center gap-3 flex-wrap">
      <!-- Filter pill group -->
      <div v-if="topTab === 'active'" class="inline-flex items-center rounded-[10px] border border-[var(--brand-border)] overflow-hidden">
        <button v-for="f in FILTERS" :key="f.id" type="button" class="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-semibold border-l first:border-l-0 border-[var(--brand-border)] transition-colors" :class="filter === f.id ? 'bg-[var(--brand-lime-tint-hover)] text-[var(--brand-text)]' : 'text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)]'" @click="filter = f.id">
          {{ f.label }}
          <span class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[11px] font-bold tabular-nums" :class="filter === f.id ? 'bg-white text-[var(--brand-teal)]' : 'bg-[var(--brand-canvas)] text-[var(--brand-text-muted)]'">{{ counts[f.key] }}</span>
        </button>
      </div>

      <div class="flex-1 min-w-[200px]">
        <BrandSearchBar v-model="searchInput" placeholder="Search requisitions" />
      </div>

      <BrandButton variant="primary-teal" size="md" class="gap-2" @click="newOpen = true">
        <Plus class="w-4 h-4" /> New requisition
      </BrandButton>

      <!-- Status sort -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button type="button" class="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--brand-border)] text-[13px] font-semibold text-[var(--brand-text-secondary)] hover:bg-[var(--brand-lime-tint-hover)] transition-colors">
            <ArrowDownUp class="w-3.5 h-3.5" /> {{ sortLabel }} <ChevronDown class="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-44">
          <DropdownMenuItem v-for="o in SORT_OPTIONS" :key="o.key" class="text-[13.5px] cursor-pointer" :class="sortKey === o.key ? 'font-semibold text-[var(--brand-text)]' : 'text-[var(--brand-text-secondary)]'" @click="sortKey = o.key">{{ o.label }}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- View toggle -->
      <div class="flex items-center rounded-lg border border-[var(--brand-border)] overflow-hidden">
        <button type="button" class="w-9 h-9 grid place-items-center transition-colors" :class="view === 'list' ? 'bg-[var(--brand-teal)] text-white' : 'text-[var(--brand-text-quiet)] hover:bg-[var(--brand-lime-tint-hover)]'" aria-label="List view" @click="view = 'list'"><Rows3 class="w-4 h-4" /></button>
        <button type="button" class="w-9 h-9 grid place-items-center transition-colors" :class="view === 'board' ? 'bg-[var(--brand-teal)] text-white' : 'text-[var(--brand-text-quiet)] hover:bg-[var(--brand-lime-tint-hover)]'" aria-label="Board view" @click="view = 'board'"><Columns3 class="w-4 h-4" /></button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto px-6 pb-6" :class="view === 'board' && total > 0 && topTab === 'active' ? 'pt-4' : ''">
      <!-- WORKLOAD dashboard -->
      <div v-if="topTab === 'workload'" class="pt-2">
        <p class="text-[13px] text-[var(--brand-text-quiet)] mb-3">Requisitions assigned to each recruiter. Click a row to see their assigned requisitions.</p>
        <RequisitionWorkloadTable :workload="workload" :current-user-id="currentUserId" @open="(id) => navigateTo(`/requisitions/${id}`)" />
      </div>

      <!-- HIRING TIMELINE -->
      <div v-else-if="topTab === 'timeline'" class="pt-2">
        <p class="text-[13px] text-[var(--brand-text-quiet)] mb-3">Each requisition is placed at its target joining month; the dark fill shows fulfillment (hires / openings).</p>
        <RequisitionTimeline :requisitions="timelineReqs" @open="(id) => navigateTo(`/requisitions/${id}`)" />
      </div>

      <div v-else-if="showSkeleton" class="space-y-3 pt-2">
        <div v-for="i in 5" :key="i" class="h-[104px] rounded-[14px] border border-[var(--brand-border-light)] bg-[var(--brand-canvas)] animate-pulse" />
      </div>

      <BrandEmptyState
        v-else-if="total === 0"
        :icon="ClipboardList"
        title="No requisitions"
        :description="hasSearchOrFilter ? 'No requisitions match your search or filter.' : 'Raise a new requisition to start the approval workflow.'"
      >
        <BrandButton v-if="!hasSearchOrFilter && topTab === 'active'" variant="primary-teal" size="md" class="gap-2" @click="newOpen = true">
          <Plus class="w-4 h-4" /> New requisition
        </BrandButton>
      </BrandEmptyState>

      <!-- LIST view -->
      <div v-else-if="view === 'list'" class="pt-2" :class="isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'">
        <section v-for="g in groups" :key="g.status" class="mb-5">
          <button type="button" class="flex items-center gap-2 mb-2.5" @click="toggleGroup(g.status)">
            <span class="text-[14px] font-bold text-[var(--brand-text)]">{{ statusMeta(g.status).label }}</span>
            <span class="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md border border-[var(--brand-border-light)] text-[12px] font-semibold text-[var(--brand-text-muted)] tabular-nums">{{ g.count }}</span>
            <ChevronDown class="w-4 h-4 text-[var(--brand-text-quiet)] transition-transform" :class="collapsed[g.status] ? '' : 'rotate-180'" />
          </button>
          <div v-show="!collapsed[g.status]" class="space-y-3">
            <RequisitionCard v-for="r in g.items" :key="r.id" :requisition="r" :current-user-id="currentUserId" @open="openDetail(r)" @follow="follow.mutate(r.id)" @duplicate="duplicate.mutate(r.id)" @archive="archive.mutate(r.id)" @delete="confirmDeleteId = r.id" />
          </div>
        </section>
      </div>

      <!-- BOARD view — kanban columns, styled like the jobs pipeline -->
      <div v-else class="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 items-stretch" :class="isFetching ? 'opacity-60' : ''">
        <section
          v-for="g in groups"
          :key="g.status"
          class="flex-none w-[300px] flex flex-col rounded-[14px] px-3 pt-[14px] pb-3 min-h-[440px] bg-[var(--brand-surface-listview)]"
        >
          <header class="flex items-center gap-[9px] px-1 pb-3">
            <span class="w-[9px] h-[9px] rounded-full shrink-0" :style="{ background: STATUS_DOT[g.status] }" />
            <span class="text-[14px] font-semibold text-[var(--brand-text)]">{{ statusMeta(g.status).label }}</span>
            <span class="text-[12px] font-bold rounded-md px-2 inline-flex items-center h-[19px] bg-[var(--brand-canvas)] text-[var(--brand-text-secondary)] tabular-nums">{{ g.count }}</span>
            <span class="flex-1" />
          </header>
          <div class="flex flex-col gap-3">
            <RequisitionBoardCard v-for="r in g.items" :key="r.id" :requisition="r" :current-user-id="currentUserId" @open="openDetail(r)" @follow="follow.mutate(r.id)" @duplicate="duplicate.mutate(r.id)" @archive="archive.mutate(r.id)" @delete="confirmDeleteId = r.id" />
          </div>
        </section>
      </div>
    </div>

    <NewRequisitionDialog v-model:open="newOpen" :projects="projects ?? []" :submitting="create.isPending.value" @create="onCreate" />

    <Dialog :open="!!confirmDeleteId" @update:open="(o) => { if (!o) confirmDeleteId = null }">
      <DialogContent class="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Delete requisition?</DialogTitle>
          <DialogDescription>This can't be undone. The requisition and its approval history will be removed.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <BrandButton variant="outline" @click="confirmDeleteId = null">Cancel</BrandButton>
          <BrandButton variant="danger" :disabled="remove.isPending.value" @click="doDelete">Delete</BrandButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
