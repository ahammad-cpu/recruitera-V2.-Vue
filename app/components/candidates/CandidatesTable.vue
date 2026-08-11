<script setup lang="ts">
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { ArrowDown, ArrowUp, ArrowDownUp, Users as UsersIcon } from 'lucide-vue-next'
import { BrandDataTable, BrandLimeCheckbox, BrandStatusBadge } from '~/components/brand'
import { useCandidatesStore } from '~/stores/candidates.store'
import {
  useCandidateColumns,
  CANDIDATE_COLUMN_LABELS,
  type CandidateColumnKey,
} from '~/composables/useCandidateColumns'
import { useCandidateSort } from '~/composables/useCandidateSort'
import { useCandidateColumnWidths } from '~/composables/useCandidateColumnWidths'
import { candidateKeywords } from '~/utils/candidateSearch'
import type { Candidate, JobStatus } from '~/types'

const props = defineProps<{ candidates: Candidate[]; isFetching?: boolean }>()

const router = useRouter()
const route = useRoute()
const store = useCandidatesStore()
const { orderedVisible } = useCandidateColumns()
const { key: sortKey, dir: sortDir, set: setSort } = useCandidateSort()

const pageIds = computed(() => props.candidates.map(c => c.id))
const allOnPageSelected = computed(() =>
  pageIds.value.length > 0 && pageIds.value.every(id => store.selectedIds.includes(id)),
)
function toggleAllOnPage(next: boolean) {
  next ? store.selectAll(pageIds.value) : store.clearSelection()
}

/** Column-key → sort-key. Not every column is sortable — nullable = not sortable. */
const SORT_MAP: Partial<Record<CandidateColumnKey, string>> = {
  'name':            'name',
  'job':             'job',
  'date-created':    'date-created',
  'talent-pool':     'talent-pool',
  'disqualified-by': 'disqualified-by',
  'stage':           'pipeline-stage',
  'evaluation-score':     'evaluation',
  'avg-evaluation-score': 'avg-eval',
  'screening-score':      'screening',
  'last-activity':        'last-activity',
  'disqualify-date':      'disqualify-date',
  'hire-date':            'hire-date',
  'start-date':           'start-date',
}

function isSortedBy(col: CandidateColumnKey) {
  return SORT_MAP[col] === sortKey.value
}
function toggleSort(col: CandidateColumnKey) {
  const k = SORT_MAP[col]
  if (k) setSort(k as never)
}

const JOB_STATUS_TONE: Record<JobStatus, 'teal-green' | 'gray'> = {
  published: 'teal-green',
  internal: 'gray',
  closed: 'gray',
  archived: 'gray',
  draft: 'gray',
}
const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  published: 'Published',
  internal: 'Internal',
  closed: 'Closed',
  archived: 'Archived',
  draft: 'Draft',
}

const { getWidth, setWidth } = useCandidateColumnWidths()

function widthStyle(col: CandidateColumnKey) {
  const w = `${getWidth(col)}px`
  return { width: w, minWidth: w }
}

/** Excel-style drag-to-resize: pointer capture on the column's right edge. */
const resizingCol = ref<CandidateColumnKey | null>(null)
let resizeStartX = 0
let resizeStartWidth = 0

function onResizeStart(col: CandidateColumnKey, e: PointerEvent) {
  resizingCol.value = col
  resizeStartX = e.clientX
  resizeStartWidth = getWidth(col)
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup', onResizeEnd)
  e.preventDefault()
}
function onResizeMove(e: PointerEvent) {
  if (!resizingCol.value) return
  setWidth(resizingCol.value, resizeStartWidth + (e.clientX - resizeStartX))
}
function onResizeEnd() {
  resizingCol.value = null
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup', onResizeEnd)
}
onBeforeUnmount(onResizeEnd)
</script>

<template>
  <BrandDataTable>
    <template #header>
    <TableHeader class="sticky top-0 z-10 bg-[var(--brand-canvas)]">
      <TableRow class="hover:bg-transparent border-b border-[var(--brand-border)]">
        <TableHead class="w-8 shrink-0">
          <BrandLimeCheckbox
            :model-value="allOnPageSelected"
            @update:model-value="toggleAllOnPage"
          />
        </TableHead>
        <TableHead
          v-for="col in orderedVisible"
          :key="col"
          class="relative text-[13px] font-semibold text-[var(--brand-text)] whitespace-nowrap border-r border-[var(--brand-border-fade)] last:border-r-0"
          :style="widthStyle(col)"
        >
          <button
            class="inline-flex items-center gap-1 group hover:text-[var(--brand-teal)]"
            :disabled="!SORT_MAP[col]"
            @click="toggleSort(col)"
          >
            {{ CANDIDATE_COLUMN_LABELS[col] }}
            <template v-if="SORT_MAP[col]">
              <component
                v-if="isSortedBy(col)"
                :is="sortDir === 'desc' ? ArrowDown : ArrowUp"
                class="w-3 h-3 text-[var(--brand-olive)]"
                stroke-width="2"
              />
              <ArrowDownUp
                v-else
                class="w-3 h-3 text-[var(--brand-text-faint)] opacity-0 group-hover:opacity-100"
                stroke-width="1.7"
              />
            </template>
          </button>
          <div
            class="absolute top-0 right-0 bottom-0 w-1.5 -mr-[3px] cursor-col-resize z-10 select-none"
            :class="resizingCol === col ? 'bg-[var(--brand-teal)]' : 'hover:bg-[var(--brand-teal)]/40'"
            @pointerdown="(e: PointerEvent) => onResizeStart(col, e)"
          />
        </TableHead>
      </TableRow>
    </TableHeader>
    </template>
    <TableBody>
      <TableRow
        v-for="(c, i) in candidates"
        :key="c.id"
        class="min-h-12 border-b border-[var(--brand-border-light)] cursor-pointer"
        :class="[
          i % 2 === 1 ? 'bg-[var(--brand-surface-table-alt)]/60' : '',
          store.selectedIds.includes(c.id) ? 'bg-[var(--brand-lime-tint)]' : 'hover:bg-[var(--brand-lime-tint)]/40',
        ]"
        @click="(e: MouseEvent) => {
          if ((e.target as HTMLElement).closest('button, a, input, label')) return
          router.push({ path: `/candidates/${c.id}`, query: { from: route.fullPath } })
        }"
      >
        <TableCell class="align-middle py-3">
          <BrandLimeCheckbox
            :model-value="store.selectedIds.includes(c.id)"
            @update:model-value="() => store.toggleSelect(c.id)"
          />
        </TableCell>

        <template v-for="col in orderedVisible" :key="col">
          <TableCell class="align-top py-3 border-r border-[var(--brand-border-fade)] last:border-r-0" :style="widthStyle(col)">
            <!-- Name -->
            <template v-if="col === 'name'">
              <div class="flex items-center gap-3">
                <Avatar class="h-8 w-8 shrink-0">
                  <AvatarFallback
                    :style="{ background: c.avatarColor }"
                    class="text-white text-[11px] font-semibold"
                  >{{ c.initials }}</AvatarFallback>
                </Avatar>
                <span class="text-[14px] font-semibold text-[var(--brand-text)]">{{ c.name }}</span>
                <Badge
                  v-if="c.isNew"
                  class="bg-[var(--brand-badge-new-bg)] text-[var(--brand-badge-new-text)] border-0 text-[10px] font-bold uppercase tracking-wider px-2"
                >New</Badge>
              </div>
            </template>

            <!-- Job (multi-stack with status dot) -->
            <template v-else-if="col === 'job'">
              <div v-if="c.jobs.length" class="flex flex-col gap-1">
                <div
                  v-for="j in c.jobs"
                  :key="j.title"
                  class="flex items-center gap-2 text-[13px]"
                >
                  <BrandStatusBadge
                    variant="dot-only"
                    :tone="JOB_STATUS_TONE[j.status]"
                    :label="JOB_STATUS_LABEL[j.status]"
                    :faded="j.status === 'archived'"
                  />
                  <a
                    href="#"
                    class="text-[var(--brand-text)] hover:text-[var(--brand-teal)] hover:underline"
                    @click.prevent
                  >{{ j.title }}</a>
                </div>
              </div>
              <span v-else class="text-[13px] text-[var(--brand-text-quiet)]">—</span>
            </template>

            <!-- Date created -->
            <template v-else-if="col === 'date-created'">
              <span class="text-[13px] text-[var(--brand-text-muted)] whitespace-nowrap">{{ c.dateCreated }}</span>
            </template>

            <!-- Keywords (continuous searchable terms, synonym-expanded) -->
            <template v-else-if="col === 'source'">
              <div
                v-if="candidateKeywords(c).length"
                class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] leading-snug text-[var(--brand-text-secondary)]"
              >
                <template v-for="(k, i) in candidateKeywords(c)" :key="k">
                  <span v-if="i > 0" class="text-[var(--brand-text-quiet)] select-none">·</span>
                  <span>{{ k }}</span>
                </template>
              </div>
              <span v-else class="text-[13px] text-[var(--brand-text-quiet)]">—</span>
            </template>

            <!-- Tag (pills) -->
            <template v-else-if="col === 'tag'">
              <div v-if="c.tags.length" class="flex flex-wrap gap-1">
                <Badge
                  v-for="t in c.tags"
                  :key="t"
                  variant="secondary"
                  class="bg-[var(--brand-surface-badge)] text-[var(--brand-text-secondary)] border-0 text-[11px] font-medium"
                >{{ t }}</Badge>
              </div>
              <span v-else class="text-[13px] text-[var(--brand-text-quiet)]">—</span>
            </template>

            <!-- Talent pool (icon + name, multi-stack) -->
            <template v-else-if="col === 'talent-pool'">
              <div v-if="c.talentPools.length" class="flex flex-col gap-1">
                <div
                  v-for="p in c.talentPools"
                  :key="p"
                  class="flex items-center gap-1.5 text-[13px] text-[var(--brand-text-secondary)]"
                >
                  <UsersIcon class="w-3.5 h-3.5 text-[var(--brand-text-quiet)] shrink-0" stroke-width="1.6" />
                  {{ p }}
                </div>
              </div>
              <span v-else class="text-[13px] text-[var(--brand-text-quiet)]">—</span>
            </template>

            <!-- Disqualified by / Text-only cells -->
            <template v-else-if="col === 'disqualified-by'">
              <span :class="c.disqualifiedBy ? 'text-[13px] text-[var(--brand-text-secondary)]' : 'text-[13px] text-[var(--brand-text-quiet)]'">
                {{ c.disqualifiedBy ?? '—' }}
              </span>
            </template>

            <template v-else-if="col === 'stage'"><span class="text-[13px] text-[var(--brand-text-quiet)]">{{ c.stage ?? '—' }}</span></template>
            <template v-else-if="col === 'evaluation-score'"><span class="text-[13px] text-[var(--brand-text-quiet)] tabular-nums">{{ c.evaluationScore ?? '—' }}</span></template>
            <template v-else-if="col === 'avg-evaluation-score'"><span class="text-[13px] text-[var(--brand-text-quiet)] tabular-nums">{{ c.averageEvaluationScore ?? '—' }}</span></template>
            <template v-else-if="col === 'screening-score'"><span class="text-[13px] text-[var(--brand-text-quiet)] tabular-nums">{{ c.screeningScore ?? '—' }}</span></template>
            <template v-else-if="col === 'work-location'"><span class="text-[13px] text-[var(--brand-text-quiet)]">{{ c.workLocation ?? '—' }}</span></template>
            <template v-else-if="col === 'disqualify-date'"><span class="text-[13px] text-[var(--brand-text-quiet)]">{{ c.disqualifyDate ?? '—' }}</span></template>
            <template v-else-if="col === 'integrations'"><span class="text-[13px] text-[var(--brand-text-quiet)]">{{ c.integrations?.join(', ') ?? '—' }}</span></template>
            <template v-else-if="col === 'last-activity'"><span class="text-[13px] text-[var(--brand-text-quiet)]">{{ c.lastActivity ?? '—' }}</span></template>
            <template v-else-if="col === 'hire-date'"><span class="text-[13px] text-[var(--brand-text-quiet)]">{{ c.hireDate ?? '—' }}</span></template>
            <template v-else-if="col === 'start-date'"><span class="text-[13px] text-[var(--brand-text-quiet)]">{{ c.startDate ?? '—' }}</span></template>
          </TableCell>
        </template>
      </TableRow>
    </TableBody>
  </BrandDataTable>
</template>
