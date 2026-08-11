<script setup lang="ts">
import CareerSiteGate from '~/components/careers/CareerSiteGate.vue'
import CareerSiteHeader from '~/components/careers/CareerSiteHeader.vue'
import CareerSiteFooter from '~/components/careers/CareerSiteFooter.vue'
import JobsBrowser from '~/components/careers/JobsBrowser.vue'

definePageMeta({ layout: false })

const site = useCareerSite()
const { t } = useCareerSiteI18n()
const { jobs: allJobs } = useJobs()
const internalJobs = computed(() => allJobs.value.filter(j => j.status === 'internal'))

const portal = useEmployeePortalStore()
onMounted(() => portal.restore())
</script>

<template>
  <CareerSiteGate>
    <div class="min-h-screen bg-white" :style="{ fontFamily: `${site.font}, system-ui, sans-serif` }">
      <CareerSiteHeader />

      <div v-if="!portal.isVerified" class="mx-auto max-w-[520px] px-6 py-16 text-center">
        <p class="text-[15px] font-semibold text-[var(--brand-preview-text-heading)]">This page is only visible to verified employees.</p>
        <NuxtLink to="/careers" class="mt-3 inline-block text-[13px] font-semibold no-underline" :style="{ color: site.primaryColor }">{{ t('nav_home') }} →</NuxtLink>
      </div>

      <div v-else class="mx-auto max-w-[1200px] px-6 py-8">
        <h1 class="mb-5 text-[24px] font-extrabold text-[var(--brand-preview-text-heading)]">{{ t('nav_internal_opportunities') }}</h1>
        <JobsBrowser :jobs="internalJobs" />
      </div>

      <CareerSiteFooter />
    </div>
  </CareerSiteGate>
</template>
