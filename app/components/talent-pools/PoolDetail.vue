<!--
  One pool's candidates. Owns search, sorting and row selection locally; every
  action that mutates data is emitted up to the page, which holds the store.

  The General Application pool is read-only and shows a reduced column set —
  no stage, scores or tags, since nothing has triaged those candidates yet.
-->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  ArrowRight, Briefcase, ChevronRight, Download, Eye, FileText, Filter,
  ListFilter, MoreVertical, Pencil, Plus, RotateCcw, Trash2, UserPlus, Users, X,
} from 'lucide-vue-next'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import { BrandAvatarInitials, BrandButton, BrandDataTable, BrandEmptyState, BrandLimeCheckbox, BrandSearchBar } from '~/components/brand'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { POOL_CATEGORY, STAGE_TONE, poolCategoryDetail, poolNeedsJobTitle, scoreTone } from './poolCategory'
import type { AddCandidateMode } from './PoolAddCandidateDialog.vue'
import type { PoolCandidate, TalentPool } from '~/types'

const props = defineProps<{
  pool: TalentPool
  candidates: PoolCandidate[]
}>()

const emit = defineEmits<{
  back: []
  edit: []
  archive: []
  restore: []
  remove: []
  openForm: []
  formLink: []
  addCandidate: [mode: AddCandidateMode]
  openCandidate: [c: PoolCandidate]
  moveToPool: [ids: string[]]
  moveToJob: [ids: string[]]
  deleteCandidates: [ids: string[]]
}>()

const search = ref('')
const sortCol = ref<'name' | 'date'>('date')
const sortDir = ref<'asc' | 'desc'>('desc')
const selected = ref<string[]>([])

// Leaving the pool or filtering it away should never keep a stale selection.
watch(() => props.pool.id, () => { selected.value = []; search.value = '' })

const isSystem = computed(() => !!props.pool.system)
const showJobTitle = computed(() => poolNeedsJobTitle(props.pool))
const category = computed(() => POOL_CATEGORY[props.pool.category])

// Filter panel — a collapsible aside beside the table (ground truth: #cand-filter-panel
// in the prototype), not a popover. The prototype filters on location too, but the
// candidate records this pool is built from carry no location, so Applied Via takes
// that slot. Filtering is live on every field; "Apply Filters" just closes the panel,
// matching the prototype's own button (its filters were already live via onChange).
const filtersOpen = ref(false)
const filters = reactive({ dateFrom: '', dateTo: '', jobTitle: '', appliedVia: '', tag: '' })

const activeFilterCount = computed(() =>
  Object.values(filters).filter(Boolean).length,
)

function resetFilters() {
  filters.dateFrom = ''
  filters.dateTo = ''
  filters.jobTitle = ''
  filters.appliedVia = ''
  filters.tag = ''
}

/** Distinct, sorted values for one filter dropdown, drawn from this pool only. */
function distinct(pick: (c: PoolCandidate) => string | string[] | null) {
  const seen = new Set<string>()
  for (const c of props.candidates) {
    const v = pick(c)
    if (Array.isArray(v)) v.forEach(x => x && seen.add(x))
    else if (v) seen.add(v)
  }
  return [...seen].sort()
}

const jobTitleOptions = computed(() => distinct(c => c.jobTitle))
const appliedViaOptions = computed(() => distinct(c => c.appliedVia))
const tagOptions = computed(() => distinct(c => c.tags))

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  const rows = props.candidates.filter((c) => {
    if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false
    if (filters.dateFrom && c.date < filters.dateFrom) return false
    if (filters.dateTo && c.date > filters.dateTo) return false
    if (filters.jobTitle && c.jobTitle !== filters.jobTitle) return false
    if (filters.appliedVia && c.appliedVia !== filters.appliedVia) return false
    if (filters.tag && !c.tags.includes(filters.tag)) return false
    return true
  })
  return [...rows].sort((a, b) => {
    const av = sortCol.value === 'name' ? a.name.toLowerCase() : a.date
    const bv = sortCol.value === 'name' ? b.name.toLowerCase() : b.date
    return (av < bv ? -1 : av > bv ? 1 : 0) * (sortDir.value === 'asc' ? 1 : -1)
  })
})

function toggleSort(col: 'name' | 'date') {
  if (sortCol.value === col) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortCol.value = col; sortDir.value = 'asc' }
}

const allSelected = computed(() =>
  visible.value.length > 0 && visible.value.every(c => selected.value.includes(c.id)),
)

function toggleAll(on: boolean) {
  selected.value = on ? visible.value.map(c => c.id) : []
}

function toggleRow(id: string, on: boolean) {
  selected.value = on ? [...selected.value, id] : selected.value.filter(x => x !== id)
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatScore(v: number | null) {
  return v === null ? '—' : `${v}%`
}

const HEAD_CLASS = 'px-[18px] py-3 h-auto text-[12.5px] font-semibold text-[var(--brand-text-secondary)]'
const PILL_CLASS = 'inline-flex items-center rounded-[6px] px-2.5 py-[3px] text-[12px] font-bold'
const FILTER_LABEL = 'block mb-1.5 text-[12px] font-bold text-[var(--brand-text)]'
const FILTER_FIELD = 'w-full rounded-[9px] border-[1.5px] border-[var(--brand-border)] bg-[var(--brand-surface-white)] px-2 py-1.5 text-[12.5px] text-[var(--brand-text)] outline-none focus:border-[var(--brand-teal)]'
</script>

<template>
  <div class="p-6 flex flex-col gap-4 h-full min-h-0">
    <!-- Breadcrumb -->
    <button
      type="button"
      class="flex items-center gap-1.5 self-start text-[12.5px] text-[var(--brand-text-quiet)] outline-none hover:text-[var(--brand-text)] transition-colors"
      @click="emit('back')"
    >
      Talent Pools
      <ChevronRight class="w-3 h-3" />
      <span class="font-semibold text-[var(--brand-text)]">{{ pool.name }}</span>
    </button>

    <!-- Pool header -->
    <div class="flex items-start justify-between gap-4 pb-5 border-b border-[var(--brand-border-light)]">
      <div class="min-w-0">
        <div class="flex items-center gap-2.5">
          <span
            class="w-[38px] h-[38px] rounded-[9px] flex items-center justify-center shrink-0"
            :style="{ background: category.bg, color: category.text }"
          >
            <component :is="category.icon" class="w-[18px] h-[18px]" :stroke-width="1.7" />
          </span>
          <h2 class="text-[21px] font-extrabold text-[var(--brand-text)] truncate">{{ pool.name }}</h2>
          <span
            class="inline-flex items-center rounded-[6px] px-2.5 py-[3px] text-[11.5px] font-bold shrink-0"
            :style="{ background: category.bg, color: category.text }"
          >{{ category.label }}</span>
        </div>
        <p class="mt-1 ml-12 text-[13px] text-[var(--brand-text-quiet)]">
          {{ pool.description }}<span v-if="poolCategoryDetail(pool)"> · {{ poolCategoryDetail(pool) }}</span>
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <BrandButton v-if="pool.category === 'event'" variant="outline" size="md" @click="emit('openForm')">
          <ListFilter class="w-3.5 h-3.5" />
          {{ pool.formStatus === 'live' ? 'Edit Form' : 'Build Form' }}
        </BrandButton>
        <BrandButton v-if="!isSystem" variant="outline" size="md" @click="emit('edit')">
          <Pencil class="w-3.5 h-3.5" />
          Edit Pool
        </BrandButton>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <BrandButton variant="outline" size="icon" aria-label="Pool actions">
              <MoreVertical class="w-4 h-4" />
            </BrandButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem v-if="pool.id === 'p1'" @click="emit('formLink')">
              Form Link
            </DropdownMenuItem>
            <DropdownMenuItem v-if="!pool.archived" :disabled="isSystem" @click="emit('archive')">
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem v-else @click="emit('restore')">Restore</DropdownMenuItem>
            <DropdownMenuItem :disabled="isSystem" @click="emit('remove')">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Body: candidates column + collapsible filter panel, side by side -->
    <div class="flex-1 flex gap-5 min-h-0">
      <div class="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto">
        <!-- Toolbar -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <div class="flex-1 min-w-[200px] max-w-[420px]">
            <BrandSearchBar
              v-model="search"
              placeholder="Search by name or email…"
              class="bg-[var(--brand-surface-white)] border-[var(--brand-border)] rounded-[11px]"
            />
          </div>

          <!-- Pinned to the right edge regardless of how much the search box grows. -->
          <div class="ml-auto flex items-center gap-2.5">
            <span class="text-[13px] text-[var(--brand-text-muted)] whitespace-nowrap">
              {{ candidates.length }} candidate{{ candidates.length === 1 ? '' : 's' }}
            </span>

            <BrandButton variant="outline" size="md" @click="filtersOpen = !filtersOpen">
              <Filter class="w-3.5 h-3.5" />
              Filters
              <span
                v-if="activeFilterCount"
                class="ml-0.5 rounded-full bg-[var(--brand-olive)] px-1.5 py-px text-[10.5px] font-bold text-[var(--brand-surface-white)]"
              >{{ activeFilterCount }}</span>
            </BrandButton>

            <DropdownMenu v-if="!isSystem">
              <DropdownMenuTrigger as-child>
                <BrandButton variant="primary-teal" size="md">
                  <Plus class="w-3.5 h-3.5" :stroke-width="2.2" />
                  Add Candidate
                </BrandButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="emit('addCandidate', 'manual')">
                  <UserPlus class="w-4 h-4" /> Add Manually
                </DropdownMenuItem>
                <DropdownMenuItem @click="emit('addCandidate', 'cv')">
                  <FileText class="w-4 h-4" /> CV Upload
                </DropdownMenuItem>
                <DropdownMenuItem @click="emit('addCandidate', 'csv')">
                  <Download class="w-4 h-4" /> Import CSV File
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <!-- Bulk bar -->
        <div
          v-if="selected.length"
          class="flex items-center gap-2.5 flex-wrap rounded-[12px] border border-[var(--brand-border-mid)] bg-[var(--brand-lime-tint)] px-4 py-2.5"
        >
          <span class="flex-1 text-[13.5px] font-bold text-[var(--brand-olive)] whitespace-nowrap">
            {{ selected.length }} selected
          </span>
          <BrandButton variant="outline" size="sm" @click="emit('moveToPool', [...selected])">
            <ArrowRight class="w-3.5 h-3.5" />
            Move to another Talent Pool
          </BrandButton>
          <BrandButton variant="outline" size="sm" @click="emit('moveToJob', [...selected])">
            <Briefcase class="w-3.5 h-3.5" />
            Move to a Job
          </BrandButton>
          <BrandButton variant="danger-ghost" size="sm" @click="emit('deleteCandidates', [...selected])">
            <Trash2 class="w-3.5 h-3.5" />
            Delete
          </BrandButton>
          <BrandButton variant="ghost" size="sm" @click="selected = []">Clear selection</BrandButton>
        </div>

        <!-- Candidates -->
        <BrandDataTable v-if="visible.length" class="bg-[var(--brand-surface-white)]">
          <template #header>
            <TableHeader class="sticky top-0 z-10 bg-[var(--brand-canvas)]">
              <TableRow class="hover:bg-transparent border-b border-[var(--brand-border-light)]">
                <TableHead :class="[HEAD_CLASS, 'w-[46px]']">
                  <BrandLimeCheckbox :model-value="allSelected" @update:model-value="toggleAll" />
                </TableHead>
                <TableHead :class="[HEAD_CLASS, 'cursor-pointer select-none']" @click="toggleSort('name')">
                  Candidate Name
                  <span v-if="sortCol === 'name'" class="ml-1">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
                </TableHead>
                <template v-if="isSystem">
                  <TableHead :class="HEAD_CLASS">Job Applied For</TableHead>
                  <TableHead :class="HEAD_CLASS">Applied Via</TableHead>
                </template>
                <template v-else>
                  <TableHead :class="HEAD_CLASS">Stage</TableHead>
                  <TableHead :class="HEAD_CLASS">Applied Via</TableHead>
                  <TableHead v-if="showJobTitle" :class="HEAD_CLASS">Job Title</TableHead>
                  <TableHead :class="HEAD_CLASS">AI Score</TableHead>
                  <TableHead :class="HEAD_CLASS">Tags</TableHead>
                </template>
                <TableHead :class="[HEAD_CLASS, 'cursor-pointer select-none']" @click="toggleSort('date')">
                  Application Date
                  <span v-if="sortCol === 'date'" class="ml-1">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
                </TableHead>
                <TableHead :class="[HEAD_CLASS, 'w-[44px]']" />
              </TableRow>
            </TableHeader>
          </template>
          <TableBody>
            <TableRow
              v-for="c in visible"
              :key="c.id"
              class="border-b border-[var(--brand-border-hairline)] last:border-b-0 even:bg-[var(--brand-canvas)] hover:bg-[var(--brand-lime-tint)] [&>td]:px-[18px] [&>td]:py-3 [&>td]:align-middle [&>td]:text-[13.5px]"
            >
              <TableCell>
                <BrandLimeCheckbox
                  :model-value="selected.includes(c.id)"
                  @update:model-value="(v: boolean) => toggleRow(c.id, v)"
                />
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  class="flex items-center gap-2.5 text-left font-bold text-[var(--brand-text)] outline-none hover:underline"
                  @click="emit('openCandidate', c)"
                >
                  <BrandAvatarInitials :initials="c.initials" size="sm" :bg="c.avatarColor" />
                  {{ c.name }}
                </button>
              </TableCell>

              <template v-if="isSystem">
                <TableCell class="text-[var(--brand-text-muted)]">{{ c.jobTitle ?? '—' }}</TableCell>
                <TableCell class="text-[var(--brand-text-muted)]">{{ c.appliedVia }}</TableCell>
              </template>
              <template v-else>
                <TableCell>
                  <span :class="PILL_CLASS" :style="{ background: STAGE_TONE[c.stage].bg, color: STAGE_TONE[c.stage].text }">
                    {{ c.stage }}
                  </span>
                </TableCell>
                <TableCell class="text-[var(--brand-text-muted)]">{{ c.appliedVia }}</TableCell>
                <TableCell v-if="showJobTitle" class="text-[var(--brand-text-muted)]">{{ c.jobTitle ?? '—' }}</TableCell>
                <TableCell>
                  <span :class="PILL_CLASS" :style="{ background: scoreTone(c.aiScore).bg, color: scoreTone(c.aiScore).text }">
                    {{ formatScore(c.aiScore) }}
                  </span>
                </TableCell>
                <TableCell>
                  <span v-if="!c.tags.length" class="text-[var(--brand-text-faint)]">—</span>
                  <span v-else class="flex items-center gap-1">
                    <span class="inline-flex items-center rounded-[6px] bg-[var(--brand-badge-settings-bg)] px-2 py-[3px] text-[11.5px] font-semibold text-[var(--brand-text-secondary)]">
                      {{ c.tags[0] }}
                    </span>
                    <span
                      v-if="c.tags.length > 1"
                      class="inline-flex items-center rounded-[6px] bg-[var(--brand-canvas)] px-2 py-[3px] text-[11.5px] font-semibold text-[var(--brand-text-quiet)]"
                    >+{{ c.tags.length - 1 }}</span>
                  </span>
                </TableCell>
              </template>

              <TableCell class="text-[var(--brand-text-muted)]">{{ formatDate(c.date) }}</TableCell>
              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <BrandButton variant="ghost" size="icon" :aria-label="`Actions for ${c.name}`">
                      <MoreVertical class="w-4 h-4" />
                    </BrandButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="emit('openCandidate', c)">
                      <Eye class="w-4 h-4" /> View profile
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="emit('moveToPool', [c.id])">
                      <ArrowRight class="w-4 h-4" /> Move to another Talent Pool
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="emit('moveToJob', [c.id])">
                      <Briefcase class="w-4 h-4" /> Move to a Job
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" @click="emit('deleteCandidates', [c.id])">
                      <Trash2 class="w-4 h-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </BrandDataTable>

        <BrandEmptyState
          v-else
          :icon="Users"
          title="No candidates match."
          :description="isSystem
            ? 'Candidates who apply through the General Application form will show up here.'
            : 'Add candidates manually, via CV upload, or from a CSV file.'"
        />
      </div>

      <!-- Filter panel — collapsible aside, ground truth: #cand-filter-panel.
           Closed = 0 width; open = 28%, matching the prototype's own breakpoint. -->
      <aside
        class="shrink-0 flex flex-col bg-[var(--brand-surface-white)] rounded-[14px] shadow-[0_1px_2px_rgba(0,20,18,0.04)] border overflow-hidden transition-[flex-basis,width,border-color] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        :class="filtersOpen
          ? 'flex-[0_0_28%] w-[28%] border-[var(--brand-border-light)]'
          : 'flex-[0_0_0%] w-0 min-w-0 border-transparent'"
      >
        <div class="min-w-[260px] flex flex-col h-full">
          <div class="flex items-center justify-between px-[18px] py-4 border-b border-[var(--brand-border-hairline)] shrink-0">
            <span class="text-[14px] font-extrabold text-[var(--brand-text)] whitespace-nowrap">Filters</span>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--brand-text-muted)] outline-none hover:bg-[var(--brand-badge-settings-bg)]"
              aria-label="Collapse filters"
              @click="filtersOpen = false"
            >
              <X class="w-3.5 h-3.5" :stroke-width="2.2" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto overflow-x-hidden px-[18px] py-4">
            <span :class="FILTER_LABEL">Date of Application</span>
            <div class="mb-4 flex gap-2">
              <input v-model="filters.dateFrom" type="date" :class="FILTER_FIELD">
              <input v-model="filters.dateTo" type="date" :class="FILTER_FIELD">
            </div>

            <template
              v-for="f in ([
                { key: 'jobTitle', label: 'Job Titles', placeholder: 'Any job title', options: jobTitleOptions },
                { key: 'appliedVia', label: 'Applied Via', placeholder: 'Any source', options: appliedViaOptions },
                { key: 'tag', label: 'Tags', placeholder: 'Any tag', options: tagOptions },
              ] as const)"
              :key="f.key"
            >
              <span :class="FILTER_LABEL">{{ f.label }}</span>
              <Select v-model="filters[f.key]">
                <SelectTrigger class="mb-4 w-full h-auto py-2 text-[13px]">
                  <SelectValue :placeholder="f.placeholder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="o in f.options" :key="o" :value="o">{{ o }}</SelectItem>
                </SelectContent>
              </Select>
            </template>
          </div>

          <div class="shrink-0 flex flex-col gap-2 px-[18px] py-4 border-t border-[var(--brand-border-hairline)]">
            <BrandButton variant="primary-teal" size="md" class="w-full justify-center" @click="filtersOpen = false">
              Apply Filters
            </BrandButton>
            <BrandButton variant="outline" size="md" class="w-full justify-center" @click="resetFilters">
              <RotateCcw class="w-3.5 h-3.5" />
              Reset Filters
            </BrandButton>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
