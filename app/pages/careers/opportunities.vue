<script setup lang="ts">
import CareerSiteGate from '~/components/careers/CareerSiteGate.vue'
import CareerSiteHeader from '~/components/careers/CareerSiteHeader.vue'
import CareerSiteFooter from '~/components/careers/CareerSiteFooter.vue'
import JobsBrowser from '~/components/careers/JobsBrowser.vue'

definePageMeta({ layout: false })

const site = useCareerSite()
const { t } = useCareerSiteI18n()
const { jobs: allJobs } = useJobs()
const publishedJobs = computed(() => allJobs.value.filter(j => j.status === 'published'))
const portal = useEmployeePortalStore()
onMounted(() => portal.restore())
</script>

<template>
  <CareerSiteGate>
    <div class="min-h-screen bg-white" :style="{ fontFamily: `${site.font}, system-ui, sans-serif` }">
      <CareerSiteHeader />

      <div class="mx-auto max-w-[1200px] px-6 py-8">
        <h1 class="mb-5 text-[24px] font-extrabold text-[var(--brand-preview-text-heading)]">{{ t('nav_opportunities') }}</h1>
        <JobsBrowser :jobs="publishedJobs" show-general-application-cta />
      </div>

      <CareerSiteFooter />
    </div>
  </CareerSiteGate>
</template>
