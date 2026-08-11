<script setup lang="ts">
import { useLocalStorage, useMediaQuery } from '@vueuse/core'
import { useCandidateFilterCounts, useCandidates } from '~/composables/useCandidates'
import { useCandidateFilters } from '~/composables/useCandidateFilters'
import { useFilterRegistry } from '~/composables/useFilterRegistry'
import { useActiveFilters } from '~/composables/useActiveFilters'
import { useFavoritesOrder } from '~/composables/useFavoritesOrder'
import {
  Trash2, UserCheck, UserPlus, MessageSquare, Star,
  ChevronLeft, ChevronRight, ChevronUp,
  Clock, Home as HomeIcon, Columns2,
} from 'lucide-vue-next'

import { Button } from '~/components/ui/button'
import {
  BrandSectionTitle,
  BrandFavoriteItem,
} from '~/components/brand'
import AddFilterPicker from './filters/AddFilterPicker.vue'
import CheckboxMultiFilter from './filters/CheckboxMultiFilter.vue'
import HasTagFilter from './filters/HasTagFilter.vue'
import NumberRangeFilter from './filters/NumberRangeFilter.vue'
import TextContainsFilter from './filters/TextContainsFilter.vue'
import DateRangeFilter from './filters/DateRangeFilter.vue'
import RadioFilter from './filters/RadioFilter.vue'
import EventScheduledFilter from './filters/EventScheduledFilter.vue'

const props = defineProps<{
  /** Job-scoped Smart Distribute pool — see useFilterRegistry.ts. Omitted
   * on the global /candidates page (no single job context there). */
  assignedRecruiterOptions?: { value: string; label: string }[]
}>()

const { data: counts } = useCandidateFilterCounts()
const emptyFilters = ref<Record<string, string | number>>({ perPage: 500 })
useCandidates(emptyFilters)   // preload for count derivation

const assignedRecruiterOptionsRef = computed(() => props.assignedRecruiterOptions)
const { get: getRegistryEntry } = useFilterRegistry(assignedRecruiterOptionsRef)
const activeFilters = useActiveFilters()
const { clearFilters: clearBuiltInFilters } = useCandidateFilters()

// ─────────── Collapse state ───────────
// Below this breakpoint there isn't room for a 288px panel to live in normal
// flex flow alongside the nav rail without pushing the table off-screen — so
// on narrow viewports the full panel always renders as a floating overlay
// (never adds to layout width) and opens/closes via tap.
//
// On desktop, expanding always docks the panel in normal flex flow (pushing
// the table right) rather than floating over it — an earlier hover-preview
// flyout looked identical to the mobile overflow bug (content half-covered,
// cut off at the edge) and was confusing for the same reason, so it's gone.
const isMobile = useMediaQuery('(max-width: 900px)')
const collapsed = useLocalStorage('recruitera:candidates:filter-collapsed', false)
const mobileOpen = ref(false)
const showFullPanel = computed(() =>
  isMobile.value ? mobileOpen.value : !collapsed.value,
)
function openPanel() {
  if (isMobile.value) mobileOpen.value = true
  else collapsed.value = false
}
function closePanel() {
  if (isMobile.value) mobileOpen.value = false
  else collapsed.value = true
}

// ─────────── Favorites ───────────
type Fav = { key: string; label: string; icon: unknown; count: number; extra?: boolean }
const FAVORITE_KEYS = [
  'recently-deleted', 'qualified', 'new', 'not-contacted', 'followed', 'overdue', 'hires',
] as const

const baseFavorites = computed<Fav[]>(() => [
  { key: 'recently-deleted', label: 'Recently deleted',     icon: Trash2,        count: counts.value?.recentlyDeleted ?? 0 },
  { key: 'qualified',        label: 'Qualified candidates', icon: UserCheck,     count: counts.value?.qualifiedCandidates ?? 0 },
  { key: 'new',              label: 'New candidates',       icon: UserPlus,      count: counts.value?.newCandidates ?? 0 },
  { key: 'not-contacted',    label: 'Not contacted',        icon: MessageSquare, count: counts.value?.notContacted ?? 0 },
  { key: 'followed',         label: 'Followed candidates',  icon: Star,          count: counts.value?.followedCandidates ?? 0 },
  { key: 'overdue',          label: 'Overdue',              icon: Clock,         count: 0, extra: true },
  { key: 'hires',            label: 'Hires',                icon: HomeIcon,      count: 1, extra: true },
])
const { move: moveFavorite, applyOrder } = useFavoritesOrder([...FAVORITE_KEYS])
const favorites = computed<Fav[]>(() => applyOrder(baseFavorites.value))
const railFavorites = computed(() => favorites.value.slice(0, 5))

/** Drag state for the favorites list. */
const dragFromIndex = ref<number | null>(null)
function onFavDragStart(i: number) { dragFromIndex.value = i }
function onFavDrop(i: number) {
  if (dragFromIndex.value === null) return
  moveFavorite(dragFromIndex.value, i)
  dragFromIndex.value = null
}
function onFavDragEnd() { dragFromIndex.value = null }

const showExtras = ref(false)
const activeFav = ref<string | null>(null)

/** Hires favorite pre-populates the panel with the three hire-related filters. */
const HIRES_FILTERS = ['hire-date', 'start-date', 'hiring-status'] as const
function selectFavorite(key: string) {
  const wasActive = activeFav.value === key
  activeFav.value = wasActive ? null : key
  if (key === 'hires') {
    if (wasActive) {
      activeFilters.removeMany([...HIRES_FILTERS])
    }
    else {
      activeFilters.addMany(HIRES_FILTERS.map((id) => {
        const entry = getRegistryEntry(id)
        return { id, op: entry?.operators[0]!.value ?? 'is' }
      }))
    }
  }
}

/** Dispatch table for the filter component that owns each `type`. */
const RENDERER = {
  'checkbox-multi':   CheckboxMultiFilter,
  'has-tag':          HasTagFilter,
  'has-dropdown':     HasTagFilter,
  'number-range':     NumberRangeFilter,
  'text-contains':    TextContainsFilter,
  'date-range':       DateRangeFilter,
  'radio':            RadioFilter,
  'event-scheduled':  EventScheduledFilter,
} as const

function clearAll() {
  activeFilters.clear()
  clearBuiltInFilters()
  activeFav.value = null
}

/** Filter groups shown out of the box, matching the reference design.
 *  Re-seeded on every load with no filters in the URL — a fresh visit (or a
 *  fully cleared panel) always starts from this default set. Assigned
 *  Recruiter joins the set whenever the parent has resolved a job pool for
 *  it — same "out of the box, removable" contract as the rest.
 *
 *  This has to be exactly one `addMany` (one router.push): the parent
 *  gates this component's mount behind Smart Distribute's query settling
 *  (see jobs/[id]/index.vue's `filtersPanelReady`), so
 *  assignedRecruiterOptions is already final by the time onMounted runs —
 *  a second, later push here (e.g. from a reactive watcher firing after
 *  this one lands) was observed to race the URL update and get silently
 *  dropped. */
const DEFAULT_FILTER_IDS = ['job-status', 'candidate-status', 'collar-type', 'job', 'pipeline-stage'] as const

onMounted(() => {
  const ids: string[] = [...DEFAULT_FILTER_IDS]
  if (props.assignedRecruiterOptions?.length) ids.push('assigned-recruiter')

  if (!activeFilters.active.value.length) {
    activeFilters.addMany(ids.map((id) => {
      const entry = getRegistryEntry(id)
      return { id, op: entry?.operators[0]!.value ?? 'is' }
    }))
  }
  else if (props.assignedRecruiterOptions?.length && !activeFilters.isActive('assigned-recruiter')) {
    // URL already carried filters (e.g. a shared link) — still default
    // Assigned Recruiter on, without touching whatever else is there.
    activeFilters.add('assigned-recruiter', 'is')
  }
})
</script>

<template>
  <div
    class="relative shrink-0 h-full"
    :style="{ width: (isMobile || collapsed) ? '60px' : '288px' }"
  >
    <!-- ─────────── COLLAPSED RAIL ─────────── -->
    <!-- Design (Recruitera Candidates.dc.html line 84): filter panel is a
         SINGLE full-height card sharing borders on top / left / right with a
         16px top-left curve — collapsed just narrows width from 288 → 60.
         On mobile the rail is always shown (never in-flow at 288px — see
         `isMobile` in showFullPanel) so the panel can't push the table
         off-screen; tapping the expand buttons opens it as an overlay. -->
    <aside
      v-if="isMobile ? !mobileOpen : collapsed"
      class="w-[60px] h-full flex flex-col items-center gap-0.5 pt-2.5 rounded-tl-[22px] bg-white border-t border-l border-r border-[var(--brand-border)]"
    >
      <button
        v-for="f in railFavorites"
        :key="f.key"
        class="w-10 h-9 rounded-lg flex items-center justify-center text-[var(--brand-text-subtle)] hover:bg-[var(--brand-surface-hover)] transition-colors"
        :title="f.label"
      >
        <component :is="f.icon" class="w-[19px] h-[19px]" stroke-width="1.6" />
      </button>
      <button
        class="w-10 h-9 rounded-lg flex items-center justify-center text-[var(--brand-icon-muted)] hover:bg-[var(--brand-surface-hover)] transition-colors"
        title="Show more"
        @click="openPanel"
      >
        <ChevronUp class="w-3.5 h-3.5" stroke-width="2" />
      </button>
      <div class="flex-1" />
      <button
        class="w-10 h-9 mb-2 rounded-lg flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-surface-hover)] transition-colors"
        title="Expand filter panel"
        @click="openPanel"
      >
        <ChevronRight class="w-3.5 h-3.5" stroke-width="2" />
      </button>
    </aside>

    <!-- Backdrop — mobile overlay only, tap outside to close -->
    <div
      v-if="isMobile && mobileOpen"
      class="fixed inset-0 z-30 bg-black/30"
      @click="closePanel"
    />

    <!-- ─────────── FULL PANEL ─────────── -->
    <aside
      v-if="showFullPanel"
      class="relative w-[288px] flex flex-col rounded-tl-[22px] bg-white border-t border-l border-r border-[var(--brand-border)] overflow-hidden"
      :class="isMobile && mobileOpen
        ? 'absolute inset-y-0 left-0 z-40 shadow-[0_16px_48px_rgba(0,20,18,0.18)]'
        : 'h-full'"
    >
      <!-- Scroll area -->
      <div class="flex-1 overflow-y-auto px-2.5">
        <BrandSectionTitle label="Favorites" />
        <div class="flex flex-col gap-px">
          <template v-for="(f, i) in favorites" :key="f.key">
            <BrandFavoriteItem
              v-if="!f.extra || showExtras"
              :label="f.label"
              :count="f.count"
              :icon="f.icon"
              :active="activeFav === f.key"
              draggable
              @select="selectFavorite(f.key)"
              @dragstart="onFavDragStart(i)"
              @drop="onFavDrop(i)"
              @dragend="onFavDragEnd"
            />
          </template>
        </div>

        <button
          class="text-[13px] text-[var(--brand-text-quiet)] hover:text-[var(--brand-text-secondary)] px-2 pt-2 pb-0.5 font-medium"
          @click="showExtras = !showExtras"
        >{{ showExtras ? 'Show less' : 'Show more' }}</button>

        <div class="h-px bg-[var(--brand-border-fade)] mx-1 my-2" />

        <BrandSectionTitle label="Filters" />

        <!-- Dynamic active filters. Type dispatch → correct renderer. -->
        <template
          v-for="af in activeFilters.active.value"
          :key="af.id"
        >
          <component
            :is="RENDERER[getRegistryEntry(af.id)?.type as keyof typeof RENDERER]"
            v-if="getRegistryEntry(af.id)"
            :entry="getRegistryEntry(af.id)!"
            :active="af"
            @remove="activeFilters.remove(af.id)"
            @update="(patch) => activeFilters.update(af.id, patch)"
          />
        </template>

        <div
          v-if="!activeFilters.active.value.length"
          class="text-[13px] text-[var(--brand-text-quiet)] px-2 py-3"
        >
          Click <span class="font-semibold">Add filter</span> to narrow the list.
        </div>
      </div>

      <!-- Add filter footer -->
      <div class="flex-none border-t border-[var(--brand-border-fade)] p-3 flex gap-2.5 bg-white">
        <AddFilterPicker :assigned-recruiter-options="assignedRecruiterOptions" @add="(id, op) => activeFilters.add(id, op)" />
        <Button
          variant="ghost"
          class="text-[13.5px] font-semibold text-[var(--brand-text-quiet)] hover:bg-[var(--brand-lime-tint-hover)] h-10 px-3.5"
          @click="clearAll"
        >Clear</Button>
      </div>

      <!-- Bottom bar: [<] · Show/hide columns · [>] — ported from design
           (Recruitera Candidates.dc.html line 258, .panel-bottom-bar). -->
      <div class="flex-none border-t border-[var(--brand-border-fade)] h-11 flex items-center px-1 bg-white gap-0">
        <button
          class="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--brand-text-subtle)] hover:bg-[var(--brand-surface-hover)] transition-colors"
          title="Collapse filter panel"
          @click="closePanel"
        >
          <ChevronLeft class="w-3.5 h-3.5" stroke-width="2" />
        </button>
        <button
          class="flex-1 h-9 rounded-lg flex items-center gap-2 px-2 text-[13px] font-medium text-[var(--brand-text-subtle)] hover:bg-[var(--brand-surface-hover)] transition-colors"
          title="Show/hide columns"
        >
          <Columns2 class="w-4 h-4" stroke-width="1.7" />
          Show/hide
        </button>
        <button
          class="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--brand-text-faint)] hover:bg-[var(--brand-surface-hover)] transition-colors"
          title="Expand columns"
        >
          <ChevronRight class="w-3.5 h-3.5" stroke-width="2" />
        </button>
      </div>
    </aside>
  </div>
</template>
