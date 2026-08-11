<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { Home, Users, Briefcase, BarChart3, Calendar, TrendingUp, Settings, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import { useSidebarStore } from '~/stores/sidebar.store'

const route = useRoute()
const sidebar = useSidebarStore()

// Below this width there isn't room for the full 212px labeled nav next to
// the candidates filter rail without pushing page content off-screen — so
// on narrow viewports the nav always collapses to the 64px icon rail,
// independent of the user's manual open/closed preference.
const isNarrowViewport = useMediaQuery('(max-width: 900px)')
watchEffect(() => { sidebar.isMobile = isNarrowViewport.value })
const effectiveOpen = computed(() => !sidebar.isMobile && sidebar.isOpen)

// Design sidebar (Recruitera Candidates.dc.html) — nav items only, no logo
const navItems = [
  { label: 'Home',         to: '/dashboard',    icon: Home },
  { label: 'Candidates',   to: '/candidates',   icon: Users },
  { label: 'Jobs',         to: '/jobs',         icon: Briefcase },
  { label: 'Talent pools', to: '/talent-pools', icon: BarChart3 },
  { label: 'Calendar',     to: '/interviews',   icon: Calendar },
  { label: 'Reports',      to: '/reports',      icon: TrendingUp },
]
const bottomItems = [
  { label: 'Settings', to: '/settings', icon: Settings },
]

const isActive = (to: string) => route.path === to || route.path.startsWith(to + '/')
</script>

<template>
  <nav
    class="shrink-0 flex flex-col bg-[var(--brand-canvas)] transition-[width] duration-200 ease-out px-2.5 py-2.5 gap-0.5"
    :class="effectiveOpen ? 'w-[212px]' : 'w-[64px]'"
  >
    <!-- Primary nav -->
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      :title="!effectiveOpen ? item.label : undefined"
      class="flex items-center gap-3 h-9 px-2.5 rounded-lg text-[13.5px] transition-colors whitespace-nowrap overflow-hidden"
      :class="isActive(item.to)
        ? 'bg-[var(--brand-lime-active-bg-strong)] text-[var(--brand-olive)] font-bold'
        : 'text-[var(--brand-nav-text)] font-semibold hover:bg-black/[.05]'"
    >
      <component :is="item.icon" class="w-[21px] h-[21px] shrink-0" :stroke-width="isActive(item.to) ? 1.7 : 1.6" />
      <span v-if="effectiveOpen">{{ item.label }}</span>
    </NuxtLink>

    <!-- Spacer pushes Settings + Hide to bottom -->
    <div class="flex-1" />

    <!-- Settings -->
    <NuxtLink
      v-for="item in bottomItems"
      :key="item.to"
      :to="item.to"
      :title="!effectiveOpen ? item.label : undefined"
      class="flex items-center gap-3 h-9 px-2.5 rounded-lg text-[13.5px] transition-colors whitespace-nowrap overflow-hidden"
      :class="isActive(item.to)
        ? 'bg-[var(--brand-lime-active-bg-strong)] text-[var(--brand-olive)] font-bold'
        : 'text-[var(--brand-nav-text)] font-semibold hover:bg-black/[.05]'"
    >
      <component :is="item.icon" class="w-5 h-5 shrink-0" stroke-width="1.6" />
      <span v-if="effectiveOpen">{{ item.label }}</span>
    </NuxtLink>

    <!-- Hide toggle -->
    <button
      class="flex items-center gap-3 h-9 px-2.5 rounded-lg text-[13.5px] font-semibold text-[var(--brand-text-subtle)] hover:bg-black/[.05] transition-colors border-t border-[var(--brand-border-divider)] mt-1 pt-3 whitespace-nowrap overflow-hidden"
      :title="!effectiveOpen ? 'Show sidebar' : 'Hide sidebar'"
      @click="sidebar.toggle"
    >
      <component :is="effectiveOpen ? ChevronsLeft : ChevronsRight" class="w-5 h-5 shrink-0" stroke-width="1.7" />
      <span v-if="effectiveOpen">Hide</span>
    </button>
  </nav>
</template>
