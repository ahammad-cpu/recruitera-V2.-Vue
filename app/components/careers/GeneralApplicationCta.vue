<script setup lang="ts">
// Only for external candidates — an employee is already inside the ATS's
// reach (internal application / referral paths), General Application isn't
// meant for them.
const site = useCareerSite()
const { t } = useCareerSiteI18n()
const portal = useEmployeePortalStore()
</script>

<template>
  <section v-if="site.generalApplicationOn && !portal.isVerified" class="mx-auto max-w-[1200px] px-6 py-10">
    <div class="flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-dashed px-5 py-4 text-center sm:flex-row sm:justify-between sm:text-left" :style="{ borderColor: `${site.primaryColor}55`, background: `${site.primaryColor}0a` }">
      <div>
        <p class="text-[14px] font-bold text-[var(--brand-preview-text-heading)]">{{ t('general_app_cta') }}</p>
        <p class="max-w-[440px] text-[12px] leading-[1.5] text-[var(--brand-preview-text-secondary)]">{{ t('general_app_cta_sub') }}</p>
      </div>
      <NuxtLink
        to="/careers/apply/general"
        class="shrink-0 whitespace-nowrap rounded-xl px-5 py-2.5 text-[13.5px] font-bold text-white no-underline"
        :style="{ background: site.ctaColor }"
      >
        {{ t('general_app_apply_now') }} →
      </NuxtLink>
    </div>
  </section>
</template>
