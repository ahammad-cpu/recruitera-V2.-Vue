<!-- Reports module secondary nav — 8 sections (BRD §2.7), flat list. Same
     visual language as SettingsSidebar.vue's "in-app-rail nav" component
     pattern (not a Nuxt layout — CLAUDE.md forbids new layouts). -->
<script setup lang="ts">
import { Briefcase, Users, Workflow, UserX, UserCheck, CalendarClock, ClipboardCheck, Globe } from 'lucide-vue-next'

const route = useRoute()

const items = [
  { label: 'Jobs', to: '/reports/jobs', icon: Briefcase },
  { label: 'Candidates', to: '/reports/candidates', icon: Users },
  { label: 'Pipelines', to: '/reports/pipelines', icon: Workflow },
  { label: 'Disqualifications', to: '/reports/disqualifications', icon: UserX },
  { label: 'Hires', to: '/reports/hires', icon: UserCheck },
  { label: 'Interviews', to: '/reports/interviews', icon: CalendarClock },
  { label: 'Evaluations', to: '/reports/evaluations', icon: ClipboardCheck },
  { label: 'Careers Site', to: '/reports/careers-site', icon: Globe },
]

const isActive = (to: string) => route.path === to
</script>

<template>
  <aside class="w-[212px] shrink-0 flex flex-col rounded-tl-[22px] bg-white border-t border-l border-r border-[var(--brand-border)] overflow-y-auto px-2.5 py-4">
    <p class="px-2 mb-2 text-[11px] font-bold text-[var(--brand-text-subtle)] uppercase tracking-[0.05em]">Reports</p>
    <nav class="flex flex-col gap-0.5">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-2.5 px-2 h-9 rounded-md text-[13.5px] transition-colors"
        :class="isActive(item.to)
          ? 'bg-[var(--brand-lime-active-bg)] text-[var(--brand-olive)] font-bold'
          : 'text-[var(--brand-text-secondary)] font-semibold hover:bg-black/[.04]'"
      >
        <component :is="item.icon" class="w-[17px] h-[17px] shrink-0" :stroke-width="1.6" />
        {{ item.label }}
      </NuxtLink>
    </nav>
  </aside>
</template>
