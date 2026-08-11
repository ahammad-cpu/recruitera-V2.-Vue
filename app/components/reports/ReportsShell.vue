<!-- Composes ReportsSidebar + ReportsFilterBar + content slot — the "app rail
     + secondary nav + content" shell, built as a component (not a Nuxt
     layout — CLAUDE.md forbids new layouts) inside the existing default
     layout, mirroring how SettingsSidebar + settings.vue prove the pattern. -->
<script setup lang="ts">
import ReportsSidebar from './ReportsSidebar.vue'
import ReportsFilterBar from './ReportsFilterBar.vue'
</script>

<template>
  <div class="flex h-full overflow-hidden">
    <ReportsSidebar />
    <div class="flex-1 min-w-0 flex flex-col bg-white border-t border-[var(--brand-border)] overflow-hidden">
      <ReportsFilterBar />
      <div class="flex-1 min-h-0 overflow-y-auto px-6 py-6">
        <slot />
      </div>
    </div>
  </div>
</template>
