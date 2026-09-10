<script setup lang="ts">
import AppSidebar from '~/components/layout/AppSidebar.vue'
import AppHeader from '~/components/layout/AppHeader.vue'
import TrialBanner from '~/components/layout/TrialBanner.vue'
import OnboardingChecklist from '~/components/onboarding/OnboardingChecklist.vue'
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-[var(--brand-canvas)]">
    <TrialBanner />
    <!-- V3 navbar: light surface, full-width bottom hairline. -->
    <header class="flex items-center h-[52px] bg-[var(--brand-surface-white)] border-b border-[var(--brand-border)] px-4 gap-4 flex-none">
      <AppHeader />
    </header>
    <!-- Body: sidebar + main content -->
    <div class="flex flex-1 min-h-0 bg-[var(--brand-canvas)]">
      <AppSidebar />
      <main class="flex-1 overflow-auto min-w-0">
        <slot />
      </main>
    </div>
    <OnboardingChecklist />
  </div>
</template>
