<script setup lang="ts">
import {
  LayoutGrid, Users, UserRound, Briefcase, Target, BarChart3, Calendar, FileText, Settings,
} from 'lucide-vue-next'

/**
 * AppSidebarV2 — alternate sidebar (dark, icon-only rail).
 *
 * Matches the "Jobs" reference mockup:
 *   • Fixed 72 px width, no expand/collapse
 *   • Deep-teal (near-black) background — full-bleed to the viewport edge
 *   • Lime-green R logo pill at the top
 *   • Icon-only navigation, lime-tinted on hover, lime-active pill on the current route
 *   • Settings gear pinned at the bottom with the same lime-active treatment
 *   • Search / user chrome lives in the top bar, not in the sidebar
 */

const route = useRoute()

const navItems = [
  { label: 'Home',         to: '/dashboard',    icon: LayoutGrid },
  { label: 'Candidates',   to: '/candidates',   icon: Users },
  { label: 'People',       to: '/workforce',    icon: UserRound },
  { label: 'Jobs',         to: '/jobs',         icon: Briefcase },
  { label: 'Talent pools', to: '/talent-pools', icon: Target },
  { label: 'Analytics',    to: '/analytics',    icon: BarChart3 },
  { label: 'Calendar',     to: '/interviews',   icon: Calendar },
  { label: 'Reports',      to: '/reports',      icon: FileText },
]

const isActive = (to: string) => route.path === to || route.path.startsWith(to + '/')
</script>

<template>
  <nav
    class="shrink-0 flex flex-col items-center w-[72px] bg-[var(--brand-teal)] py-4 gap-1"
    aria-label="Primary navigation"
  >
    <!-- Logo -->
    <NuxtLink
      to="/dashboard"
      class="w-11 h-11 rounded-[13px] bg-[var(--brand-lime)] flex items-center justify-center mb-3 hover:brightness-95 transition"
      aria-label="Recruitera home"
    >
      <span class="text-[19px] font-bold italic text-[var(--brand-teal)] leading-none">R</span>
    </NuxtLink>

    <!-- Primary nav (icons only) -->
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      :title="item.label"
      :aria-label="item.label"
      class="w-11 h-11 rounded-[12px] flex items-center justify-center transition-colors"
      :class="isActive(item.to)
        ? 'bg-[var(--brand-lime)] text-[var(--brand-teal)]'
        : 'text-[var(--brand-lime-tint)] hover:bg-white/[.08]'"
    >
      <component :is="item.icon" class="w-[22px] h-[22px]" :stroke-width="isActive(item.to) ? 2 : 1.7" />
    </NuxtLink>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Settings pinned at the bottom -->
    <NuxtLink
      to="/settings"
      title="Settings"
      aria-label="Settings"
      class="w-11 h-11 rounded-[12px] flex items-center justify-center transition-colors"
      :class="isActive('/settings')
        ? 'bg-[var(--brand-lime)] text-[var(--brand-teal)]'
        : 'text-[var(--brand-lime-tint)] hover:bg-white/[.08]'"
    >
      <Settings class="w-[22px] h-[22px]" :stroke-width="isActive('/settings') ? 2 : 1.7" />
    </NuxtLink>
  </nav>
</template>
