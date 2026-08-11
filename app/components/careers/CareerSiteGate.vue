<script setup lang="ts">
// Wraps every /careers/* page. When the site is unpublished (PRD "Draft" /
// "not yet live" state — the only publish-gating concept that actually
// exists in this prototype, there's no billing/subscription model to churn),
// show a minimal unavailable screen instead of the page content.
import { Globe } from 'lucide-vue-next'

const site = useCareerSite()
const { t } = useCareerSiteI18n()
</script>

<template>
  <div v-if="!site.published" class="grid min-h-screen place-items-center bg-white px-6 text-center">
    <div>
      <Globe :size="28" class="mx-auto mb-3 text-[var(--brand-preview-text-muted)]" />
      <p class="text-[15px] font-semibold text-[var(--brand-preview-text-heading)]">{{ t('not_yet_live') }}</p>
    </div>
  </div>
  <slot v-else />
</template>
