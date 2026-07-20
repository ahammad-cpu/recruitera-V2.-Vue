<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import {
  Home, Users, Briefcase, BarChart3, Calendar, TrendingUp, Settings,
  ChevronsLeft, ChevronsRight, ChevronDown, MessageCircle, FileCheck2,
  HandCoins, PieChart, Bell, Search, Plus,
} from 'lucide-vue-next'
import { useSidebarStore } from '~/stores/sidebar.store'

/**
 * AppSidebarV2 — alternate sidebar design (Option B).
 *
 * Differences from AppSidebar:
 *   • Workspace switcher pill at the top (logo + company name + chevron)
 *   • Wider (240px) with inline search
 *   • Grouped sections with uppercase labels ("MAIN", "HIRING", "ANALYZE")
 *   • Count badges on items with pending work
 *   • User profile card pinned at the bottom
 *   • Same lime-active pill treatment for active state (design continuity)
 */

const route = useRoute()
const sidebar = useSidebarStore()

const isNarrowViewport = useMediaQuery('(max-width: 900px)')
watchEffect(() => { sidebar.isMobile = isNarrowViewport.value })
const effectiveOpen = computed(() => !sidebar.isMobile && sidebar.isOpen)

const sections = [
  {
    label: 'Main',
    items: [
      { label: 'Home',       to: '/dashboard',    icon: Home,      badge: null },
      { label: 'Candidates', to: '/candidates',   icon: Users,     badge: null },
      { label: 'Jobs',       to: '/jobs',         icon: Briefcase, badge: null },
    ],
  },
  {
    label: 'Hiring',
    items: [
      { label: 'Interviews',   to: '/interviews',   icon: Calendar,  badge: 3 },
      { label: 'Offers',       to: '/offers',       icon: HandCoins, badge: null },
      { label: 'Approvals',    to: '/approvals',    icon: FileCheck2, badge: 5 },
      { label: 'Talent pools', to: '/talent-pools', icon: BarChart3, badge: null },
    ],
  },
  {
    label: 'Analyze',
    items: [
      { label: 'Analytics', to: '/analytics', icon: TrendingUp, badge: null },
      { label: 'Reports',   to: '/reports',   icon: PieChart,   badge: null },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'WhatsApp', to: '/whatsapp', icon: MessageCircle, badge: 'live' as const },
    ],
  },
]

const isActive = (to: string) => route.path === to || route.path.startsWith(to + '/')
</script>

<template>
  <nav
    class="shrink-0 flex flex-col bg-[var(--brand-canvas)] transition-[width] duration-200 ease-out"
    :class="effectiveOpen ? 'w-[240px]' : 'w-[64px]'"
  >
    <!-- Workspace switcher -->
    <div class="px-2.5 pt-2.5 pb-2">
      <button
        class="w-full flex items-center gap-2 h-11 px-2 rounded-lg hover:bg-black/[.04] transition-colors"
        :title="!effectiveOpen ? 'iCareer workspace' : undefined"
      >
        <div class="w-8 h-8 rounded-[9px] bg-[var(--brand-lime)] flex items-center justify-center shrink-0">
          <span class="text-[13px] font-bold text-[var(--brand-olive)]">iC</span>
        </div>
        <template v-if="effectiveOpen">
          <div class="flex-1 min-w-0 text-left">
            <div class="text-[13px] font-bold text-[var(--brand-text)] truncate">iCareer</div>
            <div class="text-[11px] text-[var(--brand-text-quiet)] truncate">Recruiting workspace</div>
          </div>
          <ChevronDown class="w-4 h-4 shrink-0 text-[var(--brand-icon-muted)]" stroke-width="1.7" />
        </template>
      </button>
    </div>

    <!-- Inline search -->
    <div v-if="effectiveOpen" class="px-2.5 pb-2">
      <div class="relative">
        <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--brand-icon-muted)]" />
        <input
          type="text"
          placeholder="Quick find…"
          class="w-full h-8 pl-8 pr-9 rounded-lg text-[12.5px] bg-[var(--brand-surface-white)] border border-[var(--brand-border-light)] text-[var(--brand-text)] placeholder:text-[var(--brand-text-quiet)] outline-none focus:border-[var(--brand-teal)] transition-colors"
        >
        <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[var(--brand-text-quiet)] bg-[var(--brand-lime-tint-hover)] px-1.5 py-0.5 rounded">⌘K</span>
      </div>
    </div>

    <!-- Nav sections -->
    <div class="flex-1 overflow-y-auto px-2.5 pb-2">
      <div v-for="(section, i) in sections" :key="section.label" class="mb-2">
        <div
          v-if="effectiveOpen"
          class="px-2.5 mb-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--brand-text-quiet)]"
        >
          {{ section.label }}
        </div>
        <div
          v-else-if="i > 0"
          class="h-px bg-[var(--brand-border-divider)] my-1 mx-2"
        />

        <NuxtLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          :title="!effectiveOpen ? item.label : undefined"
          class="flex items-center gap-3 h-9 px-2.5 rounded-lg text-[13.5px] transition-colors whitespace-nowrap overflow-hidden"
          :class="isActive(item.to)
            ? 'bg-[var(--brand-lime-active-bg-strong)] text-[var(--brand-olive)] font-bold'
            : 'text-[var(--brand-nav-text)] font-semibold hover:bg-black/[.05]'"
        >
          <component :is="item.icon" class="w-[21px] h-[21px] shrink-0" :stroke-width="isActive(item.to) ? 1.7 : 1.6" />
          <template v-if="effectiveOpen">
            <span class="flex-1">{{ item.label }}</span>
            <span
              v-if="item.badge === 'live'"
              class="w-1.5 h-1.5 rounded-full bg-[var(--brand-whatsapp)] shrink-0"
              aria-label="live"
            />
            <span
              v-else-if="typeof item.badge === 'number'"
              class="text-[11px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--brand-teal)] text-[var(--brand-lime)] shrink-0"
            >
              {{ item.badge }}
            </span>
          </template>
        </NuxtLink>
      </div>

      <!-- Quick action -->
      <button
        v-if="effectiveOpen"
        class="w-full mt-2 flex items-center gap-2 h-9 px-2.5 rounded-lg text-[13px] font-bold text-[var(--brand-teal)] border border-dashed border-[var(--brand-border)] hover:bg-[var(--brand-lime-tint-hover)] transition-colors"
      >
        <Plus class="w-4 h-4" stroke-width="2" />
        New job
      </button>
    </div>

    <!-- Bottom: Settings + user card -->
    <div class="px-2.5 pt-2 pb-2.5 border-t border-[var(--brand-border-divider)]">
      <NuxtLink
        to="/settings"
        :title="!effectiveOpen ? 'Settings' : undefined"
        class="flex items-center gap-3 h-9 px-2.5 rounded-lg text-[13.5px] transition-colors whitespace-nowrap overflow-hidden mb-1"
        :class="isActive('/settings')
          ? 'bg-[var(--brand-lime-active-bg-strong)] text-[var(--brand-olive)] font-bold'
          : 'text-[var(--brand-nav-text)] font-semibold hover:bg-black/[.05]'"
      >
        <Settings class="w-5 h-5 shrink-0" stroke-width="1.6" />
        <span v-if="effectiveOpen">Settings</span>
      </NuxtLink>

      <!-- User card -->
      <div
        v-if="effectiveOpen"
        class="mt-2 flex items-center gap-2.5 p-2 rounded-lg bg-[var(--brand-surface-white)] border border-[var(--brand-border-light)]"
      >
        <div class="w-8 h-8 rounded-full bg-[var(--brand-teal)] flex items-center justify-center shrink-0">
          <span class="text-[11.5px] font-bold text-[var(--brand-lime)]">AH</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[12.5px] font-bold text-[var(--brand-text)] truncate">Ahmed Hammad</div>
          <div class="text-[10.5px] text-[var(--brand-text-quiet)] truncate">Admin · iCareer</div>
        </div>
        <button
          class="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--brand-lime-tint-hover)] transition-colors shrink-0 relative"
          title="Notifications"
        >
          <Bell class="w-4 h-4 text-[var(--brand-icon-default)]" stroke-width="1.7" />
          <span class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--brand-danger)]" />
        </button>
      </div>
      <div
        v-else
        class="mt-2 mx-auto w-8 h-8 rounded-full bg-[var(--brand-teal)] flex items-center justify-center"
        title="Ahmed Hammad — Admin"
      >
        <span class="text-[11.5px] font-bold text-[var(--brand-lime)]">AH</span>
      </div>

      <!-- Hide toggle -->
      <button
        class="w-full mt-2 flex items-center gap-3 h-8 px-2.5 rounded-lg text-[12px] font-semibold text-[var(--brand-text-subtle)] hover:bg-black/[.05] transition-colors whitespace-nowrap overflow-hidden"
        :title="!effectiveOpen ? 'Show sidebar' : 'Hide sidebar'"
        @click="sidebar.toggle"
      >
        <component :is="effectiveOpen ? ChevronsLeft : ChevronsRight" class="w-4 h-4 shrink-0" stroke-width="1.7" />
        <span v-if="effectiveOpen">Hide</span>
      </button>
    </div>
  </nav>
</template>
