<script setup lang="ts">
import AppSidebar from '~/components/layout/AppSidebar.vue'
import AppHeader from '~/components/layout/AppHeader.vue'
import TrialBanner from '~/components/layout/TrialBanner.vue'
import { BrandToast } from '~/components/brand'
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-[var(--brand-canvas)]">
    <TrialBanner />
    <!-- Top bar spans full width, canvas bg matches sidebar for seamless look.
         No border-b here: it would cross the sidebar column under the logo.
         The divider lives on <main> instead, so it only runs under the content column. -->
    <header class="flex items-center h-[52px] bg-[var(--brand-canvas)] px-4 gap-4 flex-none">
      <AppHeader />
    </header>
    <!-- Body: sidebar + main content -->
    <div class="flex flex-1 min-h-0 bg-[var(--brand-canvas)]">
      <AppSidebar />
      <main class="flex-1 overflow-auto min-w-0">
        <slot />
      </main>
    </div>
    <BrandToast />
  </div>
</template>
