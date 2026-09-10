<script setup lang="ts">
import AppSidebar from '~/components/layout/AppSidebar.vue'
import AppHeader from '~/components/layout/AppHeader.vue'
import SettingsSidebar from '~/components/layout/SettingsSidebar.vue'
import TrialBanner from '~/components/layout/TrialBanner.vue'
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-[var(--brand-canvas)]">
    <TrialBanner />
    <!-- Same top bar as the main app shell (logo + Recruitera wordmark +
         Your trial pill + search + topbar icons) so Settings feels like a
         drill-down into the app, not a separate surface. -->
    <header class="flex items-center h-[52px] bg-[var(--brand-canvas)] px-4 gap-4 flex-none">
      <AppHeader />
    </header>
    <!-- Body: app rail + settings sidebar + content -->
    <div class="flex flex-1 min-h-0 bg-[var(--brand-canvas)]">
      <AppSidebar />
      <SettingsSidebar />
      <main class="flex-1 min-w-0 overflow-y-auto bg-white border-t border-[var(--brand-border)] px-10 py-8">
        <slot />
      </main>
    </div>
  </div>
</template>
