<!--
  Overview tab of the Home dashboard — greeting + widget grid. All data is
  served over MSW: recents / new-candidates / applied-stats via useDashboard*,
  jobs via the existing useJobs module, greeting name via useTeamMembers.
  Reuses BrandAvatarInitials + BrandEmptyState. Colors are --brand-* tokens
  only (never hardcoded hex).
-->
<script setup lang="ts">
import {
  ChevronRight, ChevronLeft, ChevronDown, Filter, Settings, Calendar, CalendarPlus,
  Briefcase, Tag, CalendarX, GripVertical,
} from 'lucide-vue-next'
import { useLocalStorage } from '@vueuse/core'
import { BrandAvatarInitials, BrandEmptyState } from '~/components/brand'
import { useJobs } from '~/composables/useJobs'
import { useTeamMembers } from '~/composables/useTeam'
import { useDashboardRecents, useDashboardNewCandidates, useDashboardAppliedStats, useDashboardEvents, useDashboardTags, useDashboardSources } from '~/composables/useDashboard'
import type { Job } from '~/types'

const { data: teamData } = useTeamMembers()
const firstName = computed(() => (teamData.value?.data?.[0]?.name ?? 'there').split(/\s+/)[0])

const { data: eventsData } = useDashboardEvents()
const allEvents = computed(() => eventsData.value?.data ?? [])
const scopedEvents = computed(() => {
  const s = eventScope.value
  if (s === 'Today') return allEvents.value.filter(e => e.scope === 'today')
  if (s === 'Past events') return allEvents.value.filter(e => e.scope === 'past')
  return allEvents.value.filter(e => e.scope !== 'past') // This week
})
function eventCount(s: 'This week' | 'Today' | 'Past events') {
  if (s === 'Today') return allEvents.value.filter(e => e.scope === 'today').length
  if (s === 'Past events') return allEvents.value.filter(e => e.scope === 'past').length
  return allEvents.value.filter(e => e.scope !== 'past').length
}
const { data: tagsData } = useDashboardTags()
const tagList = computed(() => tagsData.value?.data ?? [])
const { data: sourcesData } = useDashboardSources()
const sourceList = computed(() => sourcesData.value?.data ?? [])

const { data: recentsData, isPending: recentsLoading } = useDashboardRecents()
const recents = computed(() => recentsData.value?.data ?? [])

// Recents row — horizontal scroll with ‹ / › arrows (shown only when scrollable).
const recentsRow = ref<HTMLElement | null>(null)
// Function ref — the element lives inside a v-for, where a string ref won't bind.
function setRecentsRow(el: unknown) {
  recentsRow.value = (el as HTMLElement) ?? null
  scheduleArrows()
}
const canLeft = ref(false)
const canRight = ref(false)
function updateArrows() {
  const el = recentsRow.value
  if (!el) { canLeft.value = false; canRight.value = false; return }
  canLeft.value = el.scrollLeft > 4
  canRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}
function scheduleArrows() {
  if (!import.meta.client) return
  nextTick(() => requestAnimationFrame(updateArrows))
}
function scrollRow(dir: number) { recentsRow.value?.scrollBy({ left: dir * 320, behavior: 'smooth' }) }
watch(recents, scheduleArrows, { immediate: true })
onMounted(() => { scheduleArrows(); setTimeout(updateArrows, 400); window.addEventListener('resize', updateArrows) })
onBeforeUnmount(() => window.removeEventListener('resize', updateArrows))

const { data: newCandData, isPending: newCandLoading } = useDashboardNewCandidates()
const newCandidates = computed(() => newCandData.value?.data ?? [])

const { data: statsData, isPending: statsLoading } = useDashboardAppliedStats()
const appliedCards = computed(() => statsData.value?.cards ?? [])
const series = computed(() => statsData.value?.series ?? [])
const seriesMax = computed(() => Math.max(1, ...series.value))
const totalApplied = computed(() => series.value.reduce((a, b) => a + b, 0))
// X-axis range labels for the 30-day chart (oldest → today). Reuses `now`
// declared in the calendar block below (computeds evaluate lazily).
function fmtDay(daysAgo: number) {
  const d = new Date(now); d.setDate(now.getDate() - daysAgo)
  return d.toLocaleString('en-US', { day: 'numeric', month: 'short' })
}
const chartXStart = computed(() => fmtDay(series.value.length - 1))
const chartXEnd = computed(() => fmtDay(0))

const { jobs } = useJobs()
const jobList = computed<Job[]>(() => jobs.value.slice(0, 5))
function jobDot(status: Job['status']) {
  switch (status) {
    case 'published': return 'var(--brand-success)'
    case 'internal': return 'var(--brand-pipeline-blue)'
    case 'closed': return 'var(--brand-status-closed-text)'
    default: return 'var(--brand-text-faint)'
  }
}

const now = new Date()
const calMonthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' }).replace(' ', ', ')
const calCells = computed(() => {
  const y = now.getFullYear(); const m = now.getMonth()
  const firstOffset = (new Date(y, m, 1).getDay() + 6) % 7 // Monday-first
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const prevDays = new Date(y, m, 0).getDate()
  const cells: Array<{ day: number; inMonth: boolean; today: boolean }> = []
  // Trailing days of the previous month.
  for (let i = firstOffset - 1; i >= 0; i--) cells.push({ day: prevDays - i, inMonth: false, today: false })
  // This month.
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inMonth: true, today: d === now.getDate() })
  // Leading days of the next month — pad to a full 6-week grid.
  let next = 1
  while (cells.length < 42) cells.push({ day: next++, inMonth: false, today: false })
  return cells
})
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const eventScope = ref<'This week' | 'Today' | 'Past events'>('This week')

const AVATAR_TEXT = 'var(--brand-avatar-text)'

// ── Reorderable widgets ────────────────────────────────────────
// Order is persisted per-user in localStorage. Drag a widget by its grip
// handle to reposition it; native HTML5 DnD, no extra dependency.
type WidgetKey = 'recents' | 'events' | 'applied' | 'new' | 'overdue' | 'jobs' | 'tags'
const DEFAULT_ORDER: WidgetKey[] = ['recents', 'events', 'applied', 'new', 'overdue', 'jobs', 'tags']
const widgetOrder = useLocalStorage<WidgetKey[]>('dashboard-widget-order', DEFAULT_ORDER)
// Heal against added/removed widgets across releases.
watchEffect(() => {
  const valid = widgetOrder.value.filter(k => DEFAULT_ORDER.includes(k))
  const missing = DEFAULT_ORDER.filter(k => !valid.includes(k))
  if (valid.length + missing.length !== widgetOrder.value.length || missing.length) {
    widgetOrder.value = [...valid, ...missing]
  }
})
function spanClass(k: WidgetKey) {
  return k === 'recents' || k === 'events' || k === 'applied' ? 'lg:col-span-2' : ''
}

const armed = ref(false)             // handle pressed → this widget may start dragging
const dragKey = ref<WidgetKey | null>(null)
const overKey = ref<WidgetKey | null>(null)
function onDragStart(key: WidgetKey, e: DragEvent) {
  if (!armed.value) { e.preventDefault(); return }
  dragKey.value = key
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', key)
}
function onDrop(target: WidgetKey) {
  const from = dragKey.value
  if (from && from !== target) {
    const arr = [...widgetOrder.value]
    arr.splice(arr.indexOf(from), 1)
    arr.splice(arr.indexOf(target), 0, from)
    widgetOrder.value = arr
  }
  resetDrag()
}
function resetDrag() { armed.value = false; dragKey.value = null; overKey.value = null }
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-6 py-6">
    <!-- Greeting -->
    <div class="mb-5">
      <div class="text-[20px] text-[var(--brand-text)]">
        <span class="font-bold">Hello {{ firstName }} 👋</span>
        <span class="text-[var(--brand-text-muted)]">&nbsp; you recently worked on:</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        v-for="key in widgetOrder"
        :key="key"
        class="relative group/w"
        :class="[spanClass(key), dragKey === key ? 'opacity-40' : '', overKey === key && dragKey && dragKey !== key ? 'rounded-[16px] ring-2 ring-[var(--brand-teal)] ring-offset-2' : '']"
        draggable="true"
        @dragstart="onDragStart(key, $event)"
        @dragenter.prevent="overKey = key"
        @dragover.prevent
        @drop.prevent="onDrop(key)"
        @dragend="resetDrag"
      >
        <!-- Drag handle (grip) — sits in the left gutter, faint by default and
             solid on hover. Press and drag a widget onto another to reorder;
             the order persists in localStorage. -->
        <button
          type="button"
          title="Drag to reorder"
          aria-label="Drag to reorder"
          class="absolute -left-6 top-4 z-10 inline-flex w-5 h-7 items-center justify-center rounded-md text-[var(--brand-text-faint)] opacity-40 group-hover/w:opacity-100 hover:!text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] cursor-grab active:cursor-grabbing transition"
          @mousedown="armed = true"
        ><GripVertical class="w-4 h-4" stroke-width="2" /></button>

      <!-- Recents — single horizontal, scrollable row with ‹ / › arrows -->
      <div v-if="key === 'recents'" class="relative">
        <button v-if="canLeft" type="button" aria-label="Scroll left" class="absolute left-0.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[var(--brand-border)] shadow-[0_2px_10px_rgba(0,20,18,0.14)] grid place-items-center text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition" @click="scrollRow(-1)"><ChevronLeft class="w-4 h-4" stroke-width="2" /></button>
        <button v-if="canRight" type="button" aria-label="Scroll right" class="absolute right-0.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[var(--brand-border)] shadow-[0_2px_10px_rgba(0,20,18,0.14)] grid place-items-center text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition" @click="scrollRow(1)"><ChevronRight class="w-4 h-4" stroke-width="2" /></button>
        <div :ref="setRecentsRow" class="flex gap-3 overflow-x-auto pb-1 -mx-0.5 px-0.5 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" @scroll="updateArrows">
        <!-- Skeletons reserve height while MSW loads (no layout shift). -->
        <template v-if="recentsLoading">
          <div v-for="n in 4" :key="n" class="w-[190px] shrink-0 flex flex-col gap-2 p-3.5 rounded-[14px] border border-[var(--brand-border-light)] bg-[var(--brand-surface-white)]">
            <div class="w-8 h-8 rounded-[9px] bg-[var(--brand-canvas)] animate-pulse" />
            <div class="w-2/3 h-3.5 rounded bg-[var(--brand-canvas)] animate-pulse" />
            <div class="w-1/2 h-3 rounded bg-[var(--brand-canvas)] animate-pulse" />
          </div>
        </template>
        <NuxtLink v-for="r in recents" v-else :key="r.id" :to="r.kind === 'candidate' ? '/candidates' : '/jobs'" class="w-[190px] shrink-0 flex flex-col gap-2 p-3.5 rounded-[14px] border border-[var(--brand-border-light)] bg-[var(--brand-surface-white)] hover:bg-[var(--brand-canvas)] hover:border-[var(--brand-border)] transition-colors">
          <BrandAvatarInitials v-if="r.kind === 'candidate'" :initials="r.initial!" :bg="r.bg!" :color="AVATAR_TEXT" size="md" />
          <span v-else class="w-8 h-8 rounded-[9px] inline-flex items-center justify-center" style="background:color-mix(in_srgb,var(--brand-teal-secondary) 14%,var(--brand-surface-white))">
            <Briefcase class="w-[18px] h-[18px] text-[var(--brand-teal-secondary)]" stroke-width="1.8" />
          </span>
          <div class="min-w-0">
            <div class="text-[13.5px] font-semibold text-[var(--brand-text)] truncate">{{ r.title }}</div>
            <div class="text-[12px] text-[var(--brand-text-muted)] truncate">{{ r.sub }}</div>
          </div>
        </NuxtLink>
        </div>
      </div>

      <!-- Upcoming events -->
      <div v-else-if="key === 'events'" class="rounded-[14px] border border-[var(--brand-border-light)] bg-[var(--brand-surface-white)] overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 bg-[var(--brand-lime-tint)] border-b border-[var(--brand-border-fade)]">
          <div class="flex-1 min-w-0">
            <div class="text-[14px] font-bold text-[var(--brand-text)]">Your calendar is not connected yet</div>
            <div class="text-[13px] text-[var(--brand-text-muted)]">Add your availability for faster scheduling and manage your interviews in one place.</div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button type="button" class="inline-flex items-center gap-2 h-9 px-3 rounded-[9px] border border-[var(--brand-border)] bg-[var(--brand-surface-white)] text-[13px] font-semibold text-[var(--brand-text)] hover:border-[var(--brand-teal)] transition">
              <CalendarPlus class="w-4 h-4 text-[var(--brand-teal-secondary)]" stroke-width="1.8" /> Google
            </button>
            <button type="button" class="inline-flex items-center gap-2 h-9 px-3 rounded-[9px] border border-[var(--brand-border)] bg-[var(--brand-surface-white)] text-[13px] font-semibold text-[var(--brand-text)] hover:border-[var(--brand-teal)] transition">
              <CalendarPlus class="w-4 h-4 text-[var(--brand-teal-secondary)]" stroke-width="1.8" /> Outlook
            </button>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-[1fr_260px]">
          <div class="p-5 md:border-r border-[var(--brand-border-fade)]">
            <div class="flex items-center justify-between gap-3 mb-3">
              <div class="flex items-center gap-4">
                <button v-for="s in (['This week','Today','Past events'] as const)" :key="s" type="button" class="pb-1.5 text-[13.5px] border-b-2 transition inline-flex items-center gap-1.5" :class="eventScope === s ? 'border-[var(--brand-teal)] text-[var(--brand-text)] font-semibold' : 'border-transparent text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]'" @click="eventScope = s">{{ s }} <span v-if="eventCount(s)" class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--brand-badge-settings-bg)] text-[10px] font-bold text-[var(--brand-badge-settings-text)]">{{ eventCount(s) }}</span></button>
              </div>
              <button type="button" class="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--brand-text-secondary)] hover:text-[var(--brand-text)]">
                <Filter class="w-3.5 h-3.5" stroke-width="1.8" /> Everyone's events <ChevronDown class="w-3.5 h-3.5" stroke-width="2" />
              </button>
            </div>
            <div v-if="scopedEvents.length" class="space-y-3.5">
              <div v-for="e in scopedEvents" :key="e.id" class="flex items-start gap-3">
                <BrandAvatarInitials :initials="e.initials" :bg="e.bg" :color="AVATAR_TEXT" size="md" />
                <div class="min-w-0 flex-1">
                  <div class="text-[12.5px] text-[var(--brand-text-quiet)] tabular-nums">{{ e.date }} · {{ e.time }}</div>
                  <div class="text-[14px] font-semibold text-[var(--brand-text)] flex items-center gap-2 flex-wrap">{{ e.candidate }} <span class="inline-flex items-center gap-1 text-[12.5px] font-normal text-[var(--brand-text-muted)]"><span class="w-2 h-2 rounded-full" :style="{ background: e.jobDot }" />{{ e.job }}</span></div>
                  <div class="text-[13px] text-[var(--brand-text-secondary)]">{{ e.title }}</div>
                </div>
                <span class="text-[12px] text-[var(--brand-text-quiet)] shrink-0 hidden sm:block">{{ e.role }}</span>
              </div>
              <div class="text-[12.5px] text-[var(--brand-text-quiet)] pt-1">You have {{ scopedEvents.length }} event{{ scopedEvents.length === 1 ? '' : 's' }} {{ eventScope === 'Past events' ? 'in the past' : eventScope.toLowerCase() }}.</div>
            </div>
            <BrandEmptyState v-else :icon="CalendarX" title="No events yet" />
          </div>
          <div class="p-5">
            <div class="flex items-center justify-between mb-3">
              <button type="button" class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-subtle)] hover:bg-[var(--brand-canvas)] transition" aria-label="Previous month"><ChevronLeft class="w-4 h-4" stroke-width="2" /></button>
              <span class="text-[14px] font-bold text-[var(--brand-text)]">{{ calMonthLabel }}</span>
              <button type="button" class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-subtle)] hover:bg-[var(--brand-canvas)] transition" aria-label="Next month"><ChevronRight class="w-4 h-4" stroke-width="2" /></button>
            </div>
            <div class="grid grid-cols-7 text-center">
              <span v-for="w in WEEKDAYS" :key="w" class="text-[12px] font-bold text-[var(--brand-text)] pb-2">{{ w }}</span>
              <div v-for="(c, i) in calCells" :key="i" class="flex items-center justify-center py-0.5">
                <span
                  class="w-8 h-8 inline-flex items-center justify-center rounded-full text-[13px] cursor-pointer transition"
                  :class="c.today
                    ? 'bg-[var(--brand-lime-active-bg)] text-[var(--brand-teal)] font-bold'
                    : c.inMonth
                      ? 'text-[var(--brand-text)] font-medium hover:bg-[var(--brand-canvas)]'
                      : 'text-[var(--brand-text-faint)] hover:bg-[var(--brand-canvas)]'"
                >{{ c.day }}</span>
              </div>
            </div>
            <div class="flex flex-col gap-2 mt-4">
              <button type="button" class="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-[9px] border border-[var(--brand-border)] bg-[var(--brand-surface-white)] text-[13px] font-semibold text-[var(--brand-text)] hover:border-[var(--brand-teal)] transition">
                <Calendar class="w-4 h-4" stroke-width="1.8" /> Open full calendar
              </button>
              <button type="button" class="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-[9px] bg-[var(--brand-lime-tint)] text-[13px] font-semibold text-[var(--brand-olive)] hover:bg-[var(--brand-lime-tint-hover)] transition">
                <CalendarPlus class="w-4 h-4" stroke-width="1.8" /> Schedule an event
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Applied candidates -->
      <div v-else-if="key === 'applied'" class="rounded-[14px] border border-[var(--brand-border-light)] bg-[var(--brand-surface-white)] overflow-hidden">
        <div class="flex items-center gap-2 px-5 py-4 border-b border-[var(--brand-border-fade)]">
          <span class="text-[15px] font-bold text-[var(--brand-text)]">Candidates</span>
          <span class="text-[13px] text-[var(--brand-text-quiet)]">·</span>
          <button type="button" class="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--brand-text-secondary)] hover:text-[var(--brand-text)]">Last 30 days <ChevronDown class="w-3.5 h-3.5" stroke-width="2" /></button>
        </div>
        <!-- Chart: y-axis (0 / max) + bars + x-axis date range. Each bar has a
             native tooltip; the whole plot has a text alternative for SR users. -->
        <div class="px-5 pt-5">
          <div v-if="statsLoading" class="h-[120px] rounded-[8px] bg-[var(--brand-canvas)] animate-pulse" />
          <div v-else class="flex gap-2" role="img" :aria-label="`${totalApplied} candidates added in the last 30 days`">
            <div class="flex flex-col justify-between items-end w-5 h-[120px] py-0.5 text-[11px] text-[var(--brand-text-muted)] tabular-nums">
              <span>{{ seriesMax }}</span>
              <span>0</span>
            </div>
            <div class="flex-1 flex items-end gap-[3px] h-[120px] border-l border-b border-[var(--brand-border-fade)] pl-1 pb-px">
              <div
                v-for="(v, i) in series"
                :key="i"
                class="flex-1 rounded-t-[3px] hover:opacity-80 transition-opacity"
                :title="`${fmtDay(series.length - 1 - i)}: ${v} candidate${v === 1 ? '' : 's'}`"
                :style="{ height: `${Math.max(2, (v / seriesMax) * 100)}%`, background: v > 0 ? 'var(--brand-teal-secondary)' : 'var(--brand-border-fade)' }"
              />
            </div>
          </div>
          <div v-if="!statsLoading" class="flex items-center justify-between pl-7 mt-1.5 text-[11px] text-[var(--brand-text-muted)]">
            <span>{{ chartXStart }}</span>
            <span>{{ chartXEnd }}</span>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-[var(--brand-border-fade)] mt-5">
          <NuxtLink v-for="c in appliedCards" :key="c.key" :to="`/candidates?source=${c.key}`" class="flex items-center justify-between gap-2 bg-[var(--brand-surface-white)] px-4 py-3.5 hover:bg-[var(--brand-canvas)] transition">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 text-[12px] text-[var(--brand-text-muted)] truncate">
                <span class="w-2 h-2 rounded-full bg-[var(--brand-teal-secondary)] shrink-0" /> {{ c.label }}
              </div>
              <div class="text-[20px] font-bold text-[var(--brand-text)] tabular-nums mt-0.5">{{ c.value }}</div>
            </div>
            <ChevronRight class="w-4 h-4 text-[var(--brand-text-faint)] shrink-0" stroke-width="1.8" />
          </NuxtLink>
        </div>
      </div>

      <!-- New candidates -->
      <div v-else-if="key === 'new'" class="rounded-[14px] border border-[var(--brand-border-light)] bg-[var(--brand-surface-white)] flex flex-col">
        <div class="flex items-center justify-between gap-2 px-5 py-4 border-b border-[var(--brand-border-fade)]">
          <div class="flex items-center gap-2">
            <span class="text-[15px] font-bold text-[var(--brand-text)]">New candidates</span>
            <span class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--brand-badge-settings-bg)] text-[11px] font-bold text-[var(--brand-badge-settings-text)]">{{ newCandidates.length }}</span>
          </div>
          <button type="button" class="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--brand-text-secondary)] hover:text-[var(--brand-text)]">All departments <ChevronDown class="w-3.5 h-3.5" stroke-width="2" /></button>
        </div>
        <div class="flex-1 px-5 py-2">
          <template v-if="newCandLoading">
            <div v-for="n in 2" :key="n" class="flex items-center gap-2.5 py-2.5">
              <div class="w-8 h-8 rounded-full bg-[var(--brand-canvas)] animate-pulse" />
              <div class="w-1/2 h-3.5 rounded bg-[var(--brand-canvas)] animate-pulse" />
            </div>
          </template>
          <NuxtLink v-for="c in newCandidates" v-else :key="c.id" to="/candidates" class="flex items-center justify-between gap-3 py-2.5 -mx-2 px-2 rounded-lg hover:bg-[var(--brand-canvas)] transition-colors">
            <div class="flex items-center gap-2.5 min-w-0">
              <BrandAvatarInitials :initials="c.initial" :bg="c.bg" :color="AVATAR_TEXT" size="md" />
              <span class="text-[14px] font-semibold text-[var(--brand-text)] truncate">{{ c.name }}</span>
            </div>
            <span class="text-[12.5px] text-[var(--brand-text-muted)] shrink-0">{{ c.when }}</span>
          </NuxtLink>
        </div>
        <div class="px-5 py-3 border-t border-[var(--brand-border-fade)]">
          <NuxtLink to="/candidates" class="text-[13px] font-semibold text-[var(--brand-teal-secondary)] hover:text-[var(--brand-teal)]">Show more</NuxtLink>
        </div>
      </div>

      <!-- Overdue candidates -->
      <div v-else-if="key === 'overdue'" class="rounded-[14px] border border-[var(--brand-border-light)] bg-[var(--brand-surface-white)] flex flex-col">
        <div class="flex items-center justify-between gap-2 px-5 py-4 border-b border-[var(--brand-border-fade)]">
          <span class="text-[15px] font-bold text-[var(--brand-text)]">Overdue candidates</span>
          <button type="button" class="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--brand-text-secondary)] hover:text-[var(--brand-text)]">All departments <ChevronDown class="w-3.5 h-3.5" stroke-width="2" /></button>
        </div>
        <div class="flex-1 flex items-center justify-center">
          <BrandEmptyState :icon="CalendarX" title="No overdue candidates" description="You don't have any overdue candidates." />
        </div>
        <div class="px-5 py-3 border-t border-[var(--brand-border-fade)]">
          <NuxtLink to="/candidates" class="text-[13px] font-semibold text-[var(--brand-teal-secondary)] hover:text-[var(--brand-teal)]">View all</NuxtLink>
        </div>
      </div>

      <!-- Jobs -->
      <div v-else-if="key === 'jobs'" class="rounded-[14px] border border-[var(--brand-border-light)] bg-[var(--brand-surface-white)] flex flex-col">
        <div class="flex items-center justify-between gap-2 px-5 py-4 border-b border-[var(--brand-border-fade)]">
          <div class="flex items-center gap-2">
            <span class="text-[15px] font-bold text-[var(--brand-text)]">Jobs</span>
            <span class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--brand-badge-settings-bg)] text-[11px] font-bold text-[var(--brand-badge-settings-text)]">{{ jobList.length }}</span>
          </div>
          <button type="button" class="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--brand-text-secondary)] hover:text-[var(--brand-text)]">All departments <ChevronDown class="w-3.5 h-3.5" stroke-width="2" /></button>
        </div>
        <div class="flex-1 px-5 py-1">
          <NuxtLink v-for="j in jobList" :key="j.id" to="/jobs" class="flex items-center justify-between gap-3 py-2.5 -mx-2 px-2 rounded-lg hover:bg-[var(--brand-canvas)] transition-colors group">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: jobDot(j.status) }" />
              <span class="text-[14px] font-semibold text-[var(--brand-text)] truncate group-hover:underline">{{ j.title }}</span>
            </div>
            <span class="text-[12.5px] text-[var(--brand-text-muted)] shrink-0">{{ j.location }}</span>
          </NuxtLink>
        </div>
        <div class="px-5 py-3 border-t border-[var(--brand-border-fade)]">
          <NuxtLink to="/jobs" class="text-[13px] font-semibold text-[var(--brand-teal-secondary)] hover:text-[var(--brand-teal)]">Show more</NuxtLink>
        </div>
      </div>

      <!-- Tags & sources -->
      <div v-else-if="key === 'tags'" class="rounded-[14px] border border-[var(--brand-border-light)] bg-[var(--brand-surface-white)] flex flex-col">
        <!-- Tags -->
        <div>
          <div class="flex items-center justify-between gap-2 px-5 py-4">
            <div class="flex items-center gap-2">
              <span class="text-[15px] font-bold text-[var(--brand-text)]">Tags</span>
              <span class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--brand-badge-settings-bg)] text-[11px] font-bold text-[var(--brand-badge-settings-text)]">{{ tagList.length }}</span>
            </div>
            <button type="button" class="w-8 h-8 rounded-[8px] border border-[var(--brand-border)] inline-flex items-center justify-center text-[var(--brand-text-subtle)] hover:border-[var(--brand-teal)] transition" aria-label="Settings"><Settings class="w-4 h-4" stroke-width="1.8" /></button>
          </div>
          <div v-if="tagList.length" class="px-5 pb-4 flex flex-wrap gap-2">
            <span v-for="t in tagList" :key="t.label" class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-[var(--brand-border)] text-[12.5px] font-semibold text-[var(--brand-text)]">{{ t.label }} <span v-if="t.count" class="text-[var(--brand-text-quiet)] tabular-nums">{{ t.count }}</span></span>
          </div>
          <BrandEmptyState v-else :icon="Tag" title="No tags" description="Candidate tags will appear here." />
        </div>
        <!-- Sources -->
        <div class="border-t border-[var(--brand-border-fade)]">
          <div class="flex items-center justify-between gap-2 px-5 py-4">
            <div class="flex items-center gap-2">
              <span class="text-[15px] font-bold text-[var(--brand-text)]">Sources</span>
              <span class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--brand-badge-settings-bg)] text-[11px] font-bold text-[var(--brand-badge-settings-text)]">{{ sourceList.length }}</span>
            </div>
            <button type="button" class="w-8 h-8 rounded-[8px] border border-[var(--brand-border)] inline-flex items-center justify-center text-[var(--brand-text-subtle)] hover:border-[var(--brand-teal)] transition" aria-label="Settings"><Settings class="w-4 h-4" stroke-width="1.8" /></button>
          </div>
          <div v-if="sourceList.length" class="px-5 pb-4 flex flex-wrap gap-2">
            <span v-for="s in sourceList" :key="s.label" class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-[var(--brand-border)] text-[12.5px] font-semibold text-[var(--brand-text)]">{{ s.label }} <span v-if="s.count" class="text-[var(--brand-text-quiet)] tabular-nums">{{ s.count }}</span></span>
          </div>
          <BrandEmptyState v-else :icon="Tag" title="No sources" description="Candidate sources will appear here." />
        </div>
      </div>
      </div>
    </div>
  </div>
</template>
