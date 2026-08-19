<script setup lang="ts">
import { Briefcase, Users, GitBranch, Ban, BadgeCheck, CalendarDays, ThumbsUp, Globe, Plus, Pencil, MoreHorizontal, SlidersHorizontal, Lock, ChevronDown, TrendingUp, TrendingDown, Clock, Eye, Check, X, Search, Download } from 'lucide-vue-next'
import { BrandButton } from '~/components/brand'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import AnalyticsChart from '~/components/analytics/AnalyticsChart.vue'
import { useAnalyticsBoards, useAnalyticsBoard } from '~/composables/useAnalytics'

definePageMeta({ layout: 'default' })

const ICONS: Record<string, unknown> = { Briefcase, Users, GitBranch, Ban, BadgeCheck, CalendarDays, ThumbsUp, Globe }

const { data: boardsData } = useAnalyticsBoards()
const boards = computed(() => boardsData.value?.data ?? [])

const activeKey = ref('jobs')
const { data: board, isFetching } = useAnalyticsBoard(activeKey)

// ── Toolbar dropdowns ──
const DATE_PRESETS: [string, string][] = [
  ['Today', 'Yesterday'], ['This week', 'Last week'], ['This month', 'Last month'], ['This quarter', 'Last quarter'],
  ['This year', 'Last year'], ['Last 7 days', 'Last 14 days'], ['Last 30 days', 'Last 60 days'], ['Last 90 days', 'Last 365 days'],
]
const FILTER_OPTIONS = ['Department', 'Hiring manager', 'Job', 'Recruiter', 'Talent pool', 'Source', 'Stage']
const VIS_OPTIONS = [
  { key: 'everyone', icon: Eye, title: 'Everyone', desc: 'Visible to all team members' },
  { key: 'selected', icon: Users, title: 'Selected members', desc: 'Visible only to selected people and roles' },
  { key: 'me', icon: Lock, title: 'Only me', desc: 'Visible only to you' },
] as const

const dateOpen = ref(false)
const filterOpen = ref(false)
const visOpen = ref(false)
const dateRange = ref('')
const visibility = ref<'everyone' | 'selected' | 'me'>('me')
const activeFilters = ref<string[]>([])
const filterSearch = ref('')

const filteredOptions = computed(() => FILTER_OPTIONS.filter(o => o.toLowerCase().includes(filterSearch.value.toLowerCase()) && !activeFilters.value.includes(o)))
const visLabel = computed(() => visibility.value === 'me' ? 'Visible only to me' : visibility.value === 'everyone' ? 'Visible to everyone' : 'Selected members')
const visIcon = computed(() => visibility.value === 'me' ? Lock : visibility.value === 'everyone' ? Eye : Users)

function pickDate(v: string) { dateRange.value = v; dateOpen.value = false }
function addFilter(v: string) { activeFilters.value.push(v); filterSearch.value = ''; filterOpen.value = false }
function removeFilter(v: string) { activeFilters.value = activeFilters.value.filter(f => f !== v) }
function pickVisibility(v: 'everyone' | 'selected' | 'me') { visibility.value = v; visOpen.value = false }

function chartSpan(span: number) {
  if (span === 3) return 'md:col-span-2 lg:col-span-3'
  if (span === 2) return 'md:col-span-2 lg:col-span-2'
  return 'lg:col-span-1'
}
</script>

<template>
  <div class="flex h-full min-w-0 overflow-hidden bg-[var(--brand-canvas)]">
    <div class="flex-1 flex min-w-0 overflow-hidden rounded-tl-[22px] border-t border-l border-[var(--brand-border)] bg-[var(--brand-surface-white)]">
    <!-- Board sidebar -->
    <aside class="w-[248px] shrink-0 flex flex-col bg-[var(--brand-surface-white)] border-r border-[var(--brand-border-light)] overflow-y-auto">
      <div class="px-5 pt-5 pb-3">
        <h2 class="text-[18px] font-bold text-[var(--brand-text)]">Analytics</h2>
      </div>
      <nav class="px-3 pb-3 space-y-0.5 flex-1">
        <button
          v-for="b in boards"
          :key="b.key"
          type="button"
          class="w-full flex items-center gap-2.5 h-9 px-3 rounded-lg text-[13.5px] font-semibold transition-colors"
          :class="activeKey === b.key ? 'bg-[var(--brand-lime-active-bg)] text-[var(--brand-teal)]' : 'text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)]'"
          @click="activeKey = b.key"
        >
          <component :is="ICONS[b.icon] ?? Briefcase" class="w-4 h-4 shrink-0" :class="activeKey === b.key ? 'text-[var(--brand-teal)]' : 'text-[var(--brand-text-quiet)]'" stroke-width="1.9" />
          {{ b.label }}
        </button>
      </nav>
      <div class="px-3 py-3 border-t border-[var(--brand-border-fade)]">
        <button type="button" class="w-full flex items-center gap-2.5 h-9 px-3 rounded-lg text-[13.5px] font-semibold text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition-colors">
          <span class="w-6 h-6 rounded-md border border-dashed border-[var(--brand-border)] grid place-items-center"><Plus class="w-3.5 h-3.5" /></span> Add new
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--brand-surface-white)]">
      <!-- Header -->
      <div class="px-6 pt-5 pb-4 flex items-center justify-between gap-4 shrink-0 border-b border-[var(--brand-border-light)]">
        <div class="flex items-center gap-2">
          <h1 class="text-[22px] font-bold text-[var(--brand-text)]">{{ board?.label ?? '…' }}</h1>
          <Pencil class="w-4 h-4 text-[var(--brand-text-quiet)]" />
        </div>
        <div class="flex items-center gap-2">
          <BrandButton variant="primary-teal" size="md" class="gap-1.5"><Download class="w-4 h-4" /> Export</BrandButton>
          <button type="button" class="w-9 h-9 rounded-lg border border-[var(--brand-border)] grid place-items-center text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition"><MoreHorizontal class="w-4 h-4" /></button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="px-6 pt-4 pb-4 flex items-center gap-2.5 flex-wrap shrink-0">
        <!-- Select date -->
        <Popover v-model:open="dateOpen">
          <PopoverTrigger as-child>
            <button type="button" class="inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-[13px] font-semibold text-[var(--brand-text)] transition" :class="dateOpen ? 'border-[var(--brand-teal)] bg-[var(--brand-canvas)]' : 'border-[var(--brand-border)] hover:bg-[var(--brand-canvas)]'"><CalendarDays class="w-4 h-4 text-[var(--brand-text-quiet)]" /> {{ dateRange || 'Select date' }} <ChevronDown class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" /></button>
          </PopoverTrigger>
          <PopoverContent align="start" class="w-[320px] p-0 rounded-2xl overflow-hidden">
            <div class="text-center text-[13.5px] font-bold text-[var(--brand-text)] py-3 border-b border-[var(--brand-border-fade)]">Custom date range</div>
            <div class="p-1.5 grid grid-cols-2 gap-0.5">
              <button v-for="p in DATE_PRESETS.flat()" :key="p" type="button" class="text-left px-3 h-9 rounded-lg text-[13.5px] font-medium text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition" :class="dateRange === p ? 'bg-[var(--brand-lime-active-bg)] text-[var(--brand-teal)]' : ''" @click="pickDate(p)">{{ p }}</button>
            </div>
            <div class="border-t border-[var(--brand-border-fade)] p-1.5">
              <button type="button" class="w-full text-left px-3 h-9 rounded-lg text-[13.5px] font-medium text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition" @click="pickDate('Custom date range')">Custom date range</button>
              <button type="button" class="w-full text-left px-3 h-9 rounded-lg text-[13.5px] font-medium text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition" @click="pickDate('All time')">All time</button>
            </div>
          </PopoverContent>
        </Popover>

        <!-- Add filter -->
        <Popover v-model:open="filterOpen">
          <PopoverTrigger as-child>
            <button type="button" class="inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-[13px] font-semibold text-[var(--brand-text)] transition" :class="filterOpen ? 'border-[var(--brand-teal)] bg-[var(--brand-canvas)]' : 'border-[var(--brand-border)] hover:bg-[var(--brand-canvas)]'"><SlidersHorizontal class="w-4 h-4 text-[var(--brand-text-quiet)]" /> Add filter <ChevronDown class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" /></button>
          </PopoverTrigger>
          <PopoverContent align="start" class="w-[300px] p-0 rounded-2xl overflow-hidden">
            <div class="text-center text-[13.5px] font-bold text-[var(--brand-text)] py-3 border-b border-[var(--brand-border-fade)]">Choose filter</div>
            <div class="p-2.5">
              <div class="relative">
                <Search class="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--brand-text-quiet)]" />
                <input v-model="filterSearch" placeholder="Search" class="w-full h-9 pl-8 pr-3 rounded-lg border border-[var(--brand-border)] bg-white text-[13.5px] outline-none focus:border-[var(--brand-teal)]">
              </div>
            </div>
            <div class="px-1.5 pb-1.5 max-h-[240px] overflow-y-auto">
              <button v-for="o in filteredOptions" :key="o" type="button" class="w-full text-left px-3 h-9 rounded-lg text-[13.5px] font-medium text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition" @click="addFilter(o)">{{ o }}</button>
              <div v-if="!filteredOptions.length" class="px-3 py-2 text-[13px] text-[var(--brand-text-quiet)] text-center italic">No filters left</div>
            </div>
          </PopoverContent>
        </Popover>

        <!-- Active filter chips -->
        <span v-for="f in activeFilters" :key="f" class="inline-flex items-center gap-1.5 h-9 pl-3 pr-2 rounded-lg bg-[var(--brand-lime-tint)] text-[13px] font-semibold text-[var(--brand-olive)]">{{ f }}<button type="button" class="w-5 h-5 rounded grid place-items-center hover:bg-[var(--brand-lime-tint-hover)]" @click="removeFilter(f)"><X class="w-3.5 h-3.5" /></button></span>

        <!-- Visibility -->
        <Popover v-model:open="visOpen">
          <PopoverTrigger as-child>
            <button type="button" class="ml-auto inline-flex items-center gap-2 h-9 px-3 rounded-lg text-[13px] font-semibold text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition"><component :is="visIcon" class="w-4 h-4 text-[var(--brand-text-quiet)]" /> {{ visLabel }} <ChevronDown class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" /></button>
          </PopoverTrigger>
          <PopoverContent align="end" class="w-[340px] p-0 rounded-2xl overflow-hidden">
            <div class="text-center text-[13.5px] font-bold text-[var(--brand-text)] py-3 border-b border-[var(--brand-border-fade)]">Visibility options</div>
            <div class="p-1.5">
              <button v-for="o in VIS_OPTIONS" :key="o.key" type="button" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-[var(--brand-canvas)] transition" @click="pickVisibility(o.key)">
                <component :is="o.icon" class="w-5 h-5 text-[var(--brand-text)] shrink-0" stroke-width="1.9" />
                <div class="flex-1 min-w-0">
                  <div class="text-[14px] font-bold text-[var(--brand-text)]">{{ o.title }}</div>
                  <div class="text-[12.5px] text-[var(--brand-text-quiet)]">{{ o.desc }}</div>
                </div>
                <Check v-if="visibility === o.key" class="w-4 h-4 text-[var(--brand-status-approved-text)] shrink-0" stroke-width="2.5" />
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <!-- Grid -->
      <div class="flex-1 overflow-auto px-6 pb-4" :class="isFetching && !board ? 'opacity-60' : ''">
        <div v-if="board" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Metric cards -->
          <div v-for="m in board.metrics" :key="m.id" class="rounded-[14px] border border-[var(--brand-border-light)] bg-white p-5 flex flex-col min-h-[168px]">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="text-[14px] font-bold text-[var(--brand-text)]">{{ m.title }}</div>
                <div class="text-[12px] text-[var(--brand-text-quiet)] mt-0.5">{{ m.subtitle }}</div>
              </div>
              <span v-if="m.delta !== undefined" class="inline-flex items-center gap-0.5 h-6 px-1.5 rounded-full text-[11.5px] font-bold shrink-0" :class="m.delta >= 0 ? 'bg-[var(--brand-status-approved-bg)] text-[var(--brand-status-approved-text)]' : 'bg-[var(--brand-status-closed-bg)] text-[var(--brand-status-closed-text)]'">
                <component :is="m.delta >= 0 ? TrendingUp : TrendingDown" class="w-3 h-3" /> {{ Math.abs(m.delta) }}%
              </span>
            </div>
            <div class="flex-1 relative grid place-items-center my-1">
              <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-[var(--brand-border-light)]" />
              <div class="relative bg-white px-4 text-[34px] font-bold text-[var(--brand-text)] leading-none tabular-nums">{{ m.value }}</div>
            </div>
            <div class="text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-text-quiet)]">{{ m.unit }}</div>
          </div>

          <!-- Chart cards -->
          <div v-for="c in board.charts" :key="c.id" class="rounded-[14px] border border-[var(--brand-border-light)] bg-white p-5 flex flex-col" :class="chartSpan(c.span)">
            <div class="flex items-start justify-between gap-2 mb-4">
              <div class="min-w-0">
                <div class="text-[14px] font-bold text-[var(--brand-text)]">{{ c.title }}</div>
                <div class="text-[12px] text-[var(--brand-text-quiet)] mt-0.5">{{ c.subtitle }}</div>
              </div>
              <button type="button" class="w-7 h-7 rounded-md border border-[var(--brand-border)] grid place-items-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition shrink-0"><MoreHorizontal class="w-3.5 h-3.5" /></button>
            </div>
            <div class="flex-1 flex flex-col justify-center">
              <AnalyticsChart :chart="c" />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-2.5 border-t border-[var(--brand-border-fade)] text-[12px] text-[var(--brand-text-quiet)] inline-flex items-center gap-1.5 shrink-0">
        <Clock class="w-3.5 h-3.5" /> Based on {{ board?.timezone }}
      </div>
    </div>
    </div>
  </div>
</template>
