<!--
  Toolbar row. Transforms in place when rows are selected (Recruitee pattern) —
  bulk-action buttons replace the sort/view controls; the pagination + add-button
  on the right stay put. No floating bottom bar.
-->
<script setup lang="ts">
import {
  ChevronDown, Tag, Share2, X, Minus, MoreHorizontal,
  Trash2, Mail, MessageCircle, Ban, RotateCcw, Download,
  CheckSquare, UserPlus, ArrowUpRight, Bookmark, BookmarkX,
  GitMerge, Copy,
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { BrandLimeCheckbox } from '~/components/brand'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import CandidatesPagination from './CandidatesPagination.vue'
import SortByDropdown from './SortByDropdown.vue'
import CandidatesColumnToggle from './CandidatesColumnToggle.vue'
import AddCandidatesModal from './AddCandidatesModal.vue'
import CandidateBulkEmailModal from './CandidateBulkEmailModal.vue'
import CandidatesBulkAssignModal from './CandidatesBulkAssignModal.vue'
import { useCandidatesStore } from '~/stores/candidates.store'
import { useSmartDistributeConfig } from '~/composables/useSmartDistribute'
import { usePreviewRoleStore } from '~/stores/previewRole.store'

const props = defineProps<{
  pageIds: string[]      // ids of rows currently on the page
  total: number
  currentPage: number
  totalPages: number
  perPage: number
  /** Job context (E5's "Assign to recruiters" only applies inside a job
   * with Smart Distribute on — omit on the global /candidates page). */
  jobId?: string | null
}>()

const emit = defineEmits<{ pageChange: [n: number] }>()

const store = useCandidatesStore()

// "Assign to recruiters" (E5) — only meaningful with a job context whose
// Auto-Distribute is on. useSmartDistributeConfig always needs a jobId, so
// fall back to a harmless placeholder when there isn't one; the computed
// below is what actually gates visibility.
const { data: smartDistributeConfig } = useSmartDistributeConfig(computed(() => props.jobId ?? '__none__'))
const previewRoleStore = usePreviewRoleStore()
const canBulkAssign = computed(() =>
  !!props.jobId && !!smartDistributeConfig.value?.enabled && previewRoleStore.canManageSmartDistribute,
)
const bulkAssignDisabledReason = computed(() => {
  if (!props.jobId) return 'Only available on a job with Auto-Distribute on'
  if (!smartDistributeConfig.value?.enabled) return 'Auto-Distribute is off for this job'
  if (!previewRoleStore.canManageSmartDistribute) return "You don't have permission to manage Smart Distribute"
  return ''
})
const bulkAssignOpen = ref(false)
const assignToast = ref<string | null>(null)
function onBulkAssigned() {
  const n = store.selectedCount
  bulkAssignOpen.value = false
  store.clearSelection()
  assignToast.value = `${n} candidate${n === 1 ? '' : 's'} assigned`
  setTimeout(() => { assignToast.value = null }, 2600)
}

const allOnPageSelected = computed(() =>
  props.pageIds.length > 0 && props.pageIds.every(id => store.selectedIds.includes(id)),
)

function toggleAllOnPage(next: boolean) {
  if (next) store.selectAll(props.pageIds)
  else store.clearSelection()
}

// Bulk "Send email" — opens the shared email composer for the current selection.
const bulkEmailOpen = ref(false)
</script>

<template>
  <div class="flex items-center gap-3 py-2 flex-wrap">
    <!-- Checkbox + dropdown -->
    <div class="inline-flex items-center h-9 border border-[var(--brand-border)] rounded-lg overflow-hidden bg-white">
      <span class="flex items-center justify-center h-full px-2 hover:bg-[var(--brand-lime-tint-hover)] transition-colors">
        <BrandLimeCheckbox
          :model-value="allOnPageSelected"
          class="size-[18px] rounded-[5px]"
          @update:model-value="toggleAllOnPage"
        />
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button class="flex items-center justify-center h-full px-1.5 border-l border-[var(--brand-border)] text-[var(--brand-text-subtle)] hover:bg-[var(--brand-lime-tint-hover)] transition-colors">
            <ChevronDown class="w-3 h-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="w-28">
          <DropdownMenuItem @click="store.selectAll(pageIds)">All</DropdownMenuItem>
          <DropdownMenuItem @click="store.clearSelection()">None</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- SELECTION MODE -->
    <template v-if="store.hasSelection">
      <Button
        variant="outline"
        size="sm"
        class="h-8 gap-1.5 text-[13px] border-[var(--brand-border)] text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint-hover)]"
      >
        <Tag class="w-3.5 h-3.5" />
        Add tag
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="h-8 gap-1.5 text-[13px] border-[var(--brand-border)] text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint-hover)]"
      >
        <Share2 class="w-3.5 h-3.5" />
        Share
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="outline"
            size="sm"
            class="h-8 gap-1.5 text-[13px] border-[var(--brand-border)] text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint-hover)]"
          >
            More…
            <ChevronDown class="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-52">
          <DropdownMenuItem><CheckSquare class="w-3.5 h-3.5 mr-2" />Add task</DropdownMenuItem>
          <DropdownMenuItem><Ban class="w-3.5 h-3.5 mr-2" />Disqualify</DropdownMenuItem>
          <DropdownMenuItem><RotateCcw class="w-3.5 h-3.5 mr-2" />Requalify</DropdownMenuItem>
          <DropdownMenuItem @click="bulkEmailOpen = true"><Mail class="w-3.5 h-3.5 mr-2" />Send email</DropdownMenuItem>
          <DropdownMenuItem><MessageCircle class="w-3.5 h-3.5 mr-2" />Send WhatsApp</DropdownMenuItem>
          <DropdownMenuItem
            :disabled="!canBulkAssign"
            :title="bulkAssignDisabledReason"
            @click="canBulkAssign && (bulkAssignOpen = true)"
          ><UserPlus class="w-3.5 h-3.5 mr-2" />Assign to recruiters</DropdownMenuItem>
          <DropdownMenuItem><Minus class="w-3.5 h-3.5 mr-2" />Remove</DropdownMenuItem>
          <DropdownMenuItem><ArrowUpRight class="w-3.5 h-3.5 mr-2" />Add source</DropdownMenuItem>
          <DropdownMenuItem><Bookmark class="w-3.5 h-3.5 mr-2" />Follow</DropdownMenuItem>
          <DropdownMenuItem><BookmarkX class="w-3.5 h-3.5 mr-2" />Unfollow</DropdownMenuItem>
          <DropdownMenuItem><GitMerge class="w-3.5 h-3.5 mr-2" />Merge</DropdownMenuItem>
          <DropdownMenuItem><Copy class="w-3.5 h-3.5 mr-2" />Copy to other job</DropdownMenuItem>
          <DropdownMenuItem><Download class="w-3.5 h-3.5 mr-2" />Export CSV</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-[var(--brand-danger)] focus:text-[var(--brand-danger)]">
            <Trash2 class="w-3.5 h-3.5 mr-2" />Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8 text-[var(--brand-text-quiet)]"
        aria-label="Clear selection"
        @click="store.clearSelection()"
      >
        <X class="w-4 h-4" />
      </Button>
    </template>

    <!-- Right side: count/pagination · Add candidates · Sort · Columns · More
         In selection mode the bulk action buttons appear on the LEFT above
         (via the template above), and the count replaces pagination here. -->
    <div class="ml-auto flex items-center gap-2">
      <span
        v-if="store.hasSelection"
        class="text-[13px] text-[var(--brand-text-muted)] tabular-nums whitespace-nowrap mr-1"
      >
        {{ store.selectedCount }} selected
      </span>
      <CandidatesPagination
        v-else
        :current-page="currentPage"
        :total-pages="totalPages"
        :total="total"
        :per-page="perPage"
        @change="(p) => emit('pageChange', p)"
      />
      <AddCandidatesModal />
      <SortByDropdown />
      <CandidatesColumnToggle />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="outline"
            size="icon"
            class="h-9 w-9 rounded-lg border-[var(--brand-border)] text-[var(--brand-text-subtle)] hover:bg-[var(--brand-lime-tint-hover)]"
            aria-label="More"
          >
            <MoreHorizontal class="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-48">
          <DropdownMenuItem><Download class="w-3.5 h-3.5 mr-2" />Export to CSV</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Bulk email composer (shared EmailComposer) -->
    <CandidateBulkEmailModal v-model:open="bulkEmailOpen" :count="store.selectedCount" @sent="store.clearSelection()" />

    <!-- Bulk "Assign to recruiters" (E5) -->
    <CandidatesBulkAssignModal
      v-if="jobId"
      v-model:open="bulkAssignOpen"
      :job-id="jobId"
      :candidate-ids="store.selectedIds"
      @assigned="onBulkAssigned"
    />

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="assignToast"
        class="fixed bottom-7 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2.5 rounded-[12px] px-5 py-3.5 text-[13.5px] font-semibold shadow-[0_8px_32px_rgba(0,0,0,0.22)]"
        style="background: var(--brand-toast-success-bg); color: var(--brand-toast-success-text)"
      >
        <CheckSquare class="w-4 h-4 shrink-0" stroke-width="2.5" />
        {{ assignToast }}
      </div>
    </Transition>
  </div>
</template>
