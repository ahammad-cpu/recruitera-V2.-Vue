<script setup lang="ts">
import { Briefcase, Check, Clock, Copy, MapPin } from 'lucide-vue-next'
import CareerSiteGate from '~/components/careers/CareerSiteGate.vue'
import CareerSiteHeader from '~/components/careers/CareerSiteHeader.vue'
import CareerSiteFooter from '~/components/careers/CareerSiteFooter.vue'
import CareerSiteJobCard from '~/components/careers/CareerSiteJobCard.vue'
import GeneralApplicationCta from '~/components/careers/GeneralApplicationCta.vue'
import JobApplicationForm from '~/components/careers/JobApplicationForm.vue'
import ReferSomeoneForm from '~/components/careers/ReferSomeoneForm.vue'

definePageMeta({ layout: false })

const site = useCareerSite()
const { t } = useCareerSiteI18n()
const route = useRoute()
const { jobs: allJobs } = useJobs()
const portal = useEmployeePortalStore()
onMounted(() => portal.restore())

const job = computed(() => allJobs.value.find(j => j.id === route.params.id))
const isAccessible = computed(() => {
  if (!job.value) return false
  if (job.value.status === 'published') return true
  if (job.value.status === 'internal') return portal.isVerified
  return false
})
const isClosed = computed(() => job.value && !isAccessible.value && ['closed', 'archived', 'draft'].includes(job.value.status))

const recommendations = computed(() => {
  if (!job.value) return []
  return allJobs.value.filter(j => j.status === 'published' && j.department === job.value!.department && j.id !== job.value!.id).slice(0, 6)
})

function daysAgo(iso: string) {
  const d = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000))
  return d === 0 ? 'Today' : d === 1 ? '1d ago' : `${d}d ago`
}

const activeTab = ref<'overview' | 'application' | 'refer'>('overview')
const { referralLink } = useReferrals()
const linkCopied = ref(false)
async function copyReferralLink() {
  if (!job.value || !portal.email) return
  try { await navigator.clipboard.writeText(referralLink(job.value.id, portal.email)) } catch { /* clipboard unavailable */ }
  linkCopied.value = true
  setTimeout(() => { linkCopied.value = false }, 2000)
}
</script>

<template>
  <CareerSiteGate>
    <div class="min-h-screen bg-white" :style="{ fontFamily: `${site.font}, system-ui, sans-serif` }">
      <CareerSiteHeader />

      <div v-if="!job" class="mx-auto max-w-[720px] px-6 py-20 text-center">
        <p class="text-[15px] font-semibold text-[var(--brand-preview-text-heading)]">Job not found.</p>
        <NuxtLink to="/careers/opportunities" class="mt-3 inline-block text-[13px] font-semibold no-underline" :style="{ color: site.primaryColor }">{{ t('nav_opportunities') }} →</NuxtLink>
      </div>

      <div v-else-if="!isAccessible" class="mx-auto max-w-[720px] px-6 py-16">
        <div v-if="isClosed" class="text-center">
          <p class="mb-6 text-[16px] font-semibold text-[var(--brand-preview-text-heading)]">{{ t('job_closed_title') }}</p>
          <template v-if="recommendations.length">
            <div class="mb-6 text-[13px] font-semibold text-[var(--brand-preview-text-label)]">{{ t('job_closed_recommendations') }}</div>
            <div class="grid grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
              <CareerSiteJobCard v-for="j in recommendations" :key="j.id" :job="j" />
            </div>
          </template>
        </div>
        <div v-else class="text-center">
          <p class="text-[15px] font-semibold text-[var(--brand-preview-text-heading)]">This role is only visible to verified employees.</p>
        </div>
      </div>

      <template v-else>
        <div class="mx-auto max-w-[820px] px-6 py-10">
          <NuxtLink to="/careers/opportunities" class="mb-4 inline-block text-[12.5px] font-semibold no-underline" :style="{ color: site.primaryColor }">← {{ t('job_back') }}</NuxtLink>

          <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <div class="mb-2 flex flex-wrap gap-1.5">
                <span class="rounded-full px-2.5 py-0.5 text-[11px] font-bold" :style="{ background: `${site.primaryColor}18`, color: site.primaryColor }">{{ job.employmentType }}</span>
                <span class="rounded-full px-2.5 py-0.5 text-[11px] font-bold" :style="{ background: `${site.headerColor}14`, color: site.headerColor }">{{ job.collar === 'white' ? t('filter_job_type_white') : t('filter_job_type_blue') }}</span>
                <span v-if="job.status === 'internal'" class="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" :style="{ background: site.headerColor }">{{ t('nav_internal_opportunities') }}</span>
              </div>
              <h1 class="mb-2 text-[26px] font-extrabold text-[var(--brand-preview-text-heading)]">{{ job.title }}</h1>
              <div class="flex flex-wrap items-center gap-4 text-[13px] text-[var(--brand-preview-text-muted)]">
                <span class="inline-flex items-center gap-1.5"><MapPin :size="13" />{{ job.location || 'Remote' }}</span>
                <span class="inline-flex items-center gap-1.5"><Clock :size="13" />{{ daysAgo(job.createdAt) }}</span>
                <span class="inline-flex items-center gap-1.5"><Briefcase :size="13" />{{ job.department }}</span>
              </div>
            </div>

            <div class="flex shrink-0 flex-col gap-2 sm:w-[220px]">
              <button type="button" class="w-full rounded-xl border-[1.5px] border-transparent px-4 py-2.5 text-[13px] font-bold text-white" :style="{ background: site.ctaColor }" @click="activeTab = 'application'">{{ t('job_apply') }}</button>
              <div v-if="portal.isVerified" class="flex w-full items-center gap-2">
                <button type="button" class="flex-1 rounded-xl border-[1.5px] px-4 py-2.5 text-[13px] font-bold" :style="{ borderColor: site.primaryColor, color: site.primaryColor }" @click="activeTab = 'refer'">{{ t('job_refer_someone') }}</button>
                <div class="group relative shrink-0">
                  <button type="button" class="grid size-9 place-items-center rounded-xl border-[1.5px]" :style="{ borderColor: site.primaryColor, color: site.primaryColor }" :aria-label="t('job_copy_referral_link')" @click="copyReferralLink">
                    <Check v-if="linkCopied" :size="14" /><Copy v-else :size="14" />
                  </button>
                  <span class="pointer-events-none absolute right-0 top-full z-10 mt-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100" :style="{ background: site.headerColor }">
                    {{ linkCopied ? 'Copied!' : t('job_copy_referral_link') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="mb-6 flex gap-6 border-b border-[var(--brand-preview-border-card)]">
            <button
              type="button"
              class="-mb-px border-b-2 px-1 pb-3 text-[13.5px] font-semibold transition-colors"
              :class="activeTab === 'overview' ? '' : 'border-transparent text-[var(--brand-preview-text-muted)]'"
              :style="activeTab === 'overview' ? { borderColor: site.primaryColor, color: site.primaryColor } : {}"
              @click="activeTab = 'overview'"
            >Overview</button>
            <button
              type="button"
              class="-mb-px border-b-2 px-1 pb-3 text-[13.5px] font-semibold transition-colors"
              :class="activeTab === 'application' ? '' : 'border-transparent text-[var(--brand-preview-text-muted)]'"
              :style="activeTab === 'application' ? { borderColor: site.primaryColor, color: site.primaryColor } : {}"
              @click="activeTab = 'application'"
            >Application Form</button>
            <button
              v-if="portal.isVerified"
              type="button"
              class="-mb-px border-b-2 px-1 pb-3 text-[13.5px] font-semibold transition-colors"
              :class="activeTab === 'refer' ? '' : 'border-transparent text-[var(--brand-preview-text-muted)]'"
              :style="activeTab === 'refer' ? { borderColor: site.primaryColor, color: site.primaryColor } : {}"
              @click="activeTab = 'refer'"
            >{{ t('job_refer_someone') }}</button>
          </div>

          <template v-if="activeTab === 'overview'">
            <section class="mb-6">
              <h2 class="mb-2 text-[16px] font-bold text-[var(--brand-preview-text-heading)]">{{ t('job_description') }}</h2>
              <p class="text-[14px] leading-[1.7] text-[var(--brand-preview-text-body)]">{{ job.description }}</p>
            </section>
            <section v-if="job.responsibilities?.length" class="mb-6">
              <h2 class="mb-2 text-[16px] font-bold text-[var(--brand-preview-text-heading)]">{{ t('job_responsibilities') }}</h2>
              <ul class="list-disc space-y-1.5 pl-5 text-[14px] leading-[1.6] text-[var(--brand-preview-text-body)]">
                <li v-for="(r, i) in job.responsibilities" :key="i">{{ r }}</li>
              </ul>
            </section>
            <section v-if="job.requirements?.length" class="mb-6">
              <h2 class="mb-2 text-[16px] font-bold text-[var(--brand-preview-text-heading)]">{{ t('job_requirements') }}</h2>
              <ul class="list-disc space-y-1.5 pl-5 text-[14px] leading-[1.6] text-[var(--brand-preview-text-body)]">
                <li v-for="(r, i) in job.requirements" :key="i">{{ r }}</li>
              </ul>
            </section>
          </template>

          <JobApplicationForm v-else-if="activeTab === 'application'" :job="job" :internal="portal.isVerified" />
          <ReferSomeoneForm v-else :job="job" />
        </div>
      </template>

      <GeneralApplicationCta v-if="job && isClosed" />

      <CareerSiteFooter />
    </div>
  </CareerSiteGate>
</template>
