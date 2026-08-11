<script setup lang="ts">
import { Play, Quote } from 'lucide-vue-next'
import CareerSiteGate from '~/components/careers/CareerSiteGate.vue'
import CareerSiteHeader from '~/components/careers/CareerSiteHeader.vue'
import CareerSiteFooter from '~/components/careers/CareerSiteFooter.vue'
import CareerSiteJobCard from '~/components/careers/CareerSiteJobCard.vue'
import CareerSiteValueIcon from '~/components/careers/CareerSiteValueIcon.vue'
import GeneralApplicationCta from '~/components/careers/GeneralApplicationCta.vue'
import ForEmployeesTrigger from '~/components/careers/ForEmployeesTrigger.vue'

definePageMeta({ layout: false })

const site = useCareerSite()
const { data: companyData } = useCompany()
const companyName = computed(() => companyData.value?.name || 'Your Company')
const { t } = useCareerSiteI18n()
const portal = useEmployeePortalStore()
onMounted(() => portal.restore())

const { jobs: allJobs } = useJobs()
const publishedJobs = computed(() => allJobs.value.filter(j => j.status === 'published'))
const jobFilter = ref<'' | 'white' | 'blue'>('')
const featuredJobs = computed(() => {
  const list = jobFilter.value ? publishedJobs.value.filter(j => j.collar === jobFilter.value) : publishedJobs.value
  return list.slice(0, 6)
})

const heroBackground = computed(() => `linear-gradient(135deg, ${site.primaryColor} 0%, ${site.headerColor} 130%)`)
const videoBackground = computed(() => `linear-gradient(135deg, ${site.headerColor}, ${site.primaryColor})`)

function initials(name: string) {
  return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'
}
</script>

<template>
  <CareerSiteGate>
    <div class="min-h-screen bg-white" :style="{ fontFamily: `${site.font}, system-ui, sans-serif` }">
      <CareerSiteHeader />

      <!-- Hero -->
      <section class="relative flex flex-col items-start justify-center gap-4 overflow-hidden px-6 py-16 sm:py-24">
        <img v-if="site.coverUrl" :src="site.coverUrl" alt="" class="absolute inset-0 h-full w-full object-cover">
        <div class="absolute inset-0" :style="{ background: heroBackground, opacity: site.coverUrl ? 0.82 : 1 }" />
        <div class="relative mx-auto flex w-full max-w-[1200px] flex-col items-start gap-4">
          <span class="rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur">{{ publishedJobs.length }} {{ t('hero_hiring_badge') }}</span>
          <h1 class="max-w-[620px] text-[32px] font-extrabold leading-[1.15] text-white sm:text-[42px]">{{ site.headline }}</h1>
          <p class="max-w-[520px] text-[15px] leading-[1.7] text-white/85">{{ site.intro }}</p>
          <NuxtLink to="/careers/opportunities" class="rounded-xl px-5 py-3 text-[14px] font-bold text-white no-underline shadow-lg" :style="{ background: site.ctaColor }">{{ t('hero_view_roles') }} →</NuxtLink>
        </div>
      </section>

      <!-- Featured jobs -->
      <section class="mx-auto max-w-[1200px] px-6 py-12">
        <div class="mb-1 flex items-baseline justify-between">
          <h2 class="text-[24px] font-extrabold text-[var(--brand-preview-text-heading)]">{{ t('section_opportunities') }}</h2>
          <NuxtLink to="/careers/opportunities" class="shrink-0 rounded-lg border-[1.5px] px-3.5 py-1.5 text-[13px] font-bold no-underline" :style="{ borderColor: site.primaryColor, color: site.primaryColor }">{{ t('section_view_all') }} →</NuxtLink>
        </div>
        <p class="mb-4 text-[13px] text-[var(--brand-preview-text-muted)]">{{ t('section_found_positions', { n: featuredJobs.length }) }}</p>

        <div class="mb-5 flex flex-wrap gap-1.5">
          <button
            v-for="opt in [{ v: '', l: t('filter_job_type_all') }, { v: 'white', l: t('filter_job_type_white') }, { v: 'blue', l: t('filter_job_type_blue') }]"
            :key="opt.v"
            type="button"
            class="rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors"
            :class="jobFilter === opt.v ? 'text-white' : 'border border-[var(--brand-preview-border)] text-[var(--brand-preview-text-label)]'"
            :style="jobFilter === opt.v ? { background: site.primaryColor } : {}"
            @click="jobFilter = opt.v as typeof jobFilter"
          >{{ opt.l }}</button>
        </div>

        <div v-if="featuredJobs.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CareerSiteJobCard v-for="j in featuredJobs" :key="j.id" :job="j" />
        </div>
        <p v-else class="rounded-2xl border border-dashed border-[var(--brand-preview-border-card)] px-6 py-10 text-center text-[13.5px] text-[var(--brand-preview-text-muted)]">{{ t('filter_no_results') }}</p>
      </section>

      <GeneralApplicationCta />

      <!-- Culture video -->
      <section v-if="site.videoUrl" class="mx-auto max-w-[1200px] px-6 py-8">
        <h2 class="mb-4 text-[22px] font-extrabold text-[var(--brand-preview-text-heading)]">{{ t('section_life_at') }} {{ companyName }}</h2>
        <a :href="site.videoUrl" target="_blank" rel="noopener" class="relative grid aspect-video w-full max-w-[720px] place-items-center overflow-hidden rounded-2xl" :style="{ background: videoBackground }">
          <div class="grid size-16 place-items-center rounded-full bg-white/90 shadow-xl">
            <Play :size="26" class="fill-current text-[var(--brand-preview-text-heading)]" />
          </div>
        </a>
      </section>

      <!-- Values -->
      <section v-if="site.values.length" class="px-6 py-14" style="background:var(--brand-preview-surface-section)">
        <div class="mx-auto max-w-[1200px]">
          <h2 class="mb-7 text-center text-[24px] font-extrabold text-[var(--brand-preview-text-heading)]">{{ t('section_values') }}</h2>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="(v, i) in site.values" :key="i" class="flex h-full flex-col gap-3 rounded-2xl border border-[var(--brand-preview-border-card)] bg-white p-5">
              <div class="flex items-center gap-3">
                <div class="grid size-11 shrink-0 place-items-center rounded-xl" :style="{ background: `${site.primaryColor}18` }">
                  <CareerSiteValueIcon :index="v.icon" :color="site.primaryColor" />
                </div>
                <div class="text-[17px] font-bold leading-tight text-[var(--brand-preview-text-heading)]">{{ v.name }}</div>
              </div>
              <div class="flex-1 text-[14px] leading-[1.6] text-[var(--brand-preview-text-secondary)]">{{ v.desc }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section v-if="site.testimonials.length" class="mx-auto max-w-[1200px] px-6 py-14">
        <h2 class="mb-7 text-[24px] font-extrabold text-[var(--brand-preview-text-heading)]">{{ t('section_from_team') }}</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <figure v-for="(tst, i) in site.testimonials" :key="i" class="flex h-full flex-col gap-3 rounded-2xl border border-[var(--brand-preview-border-card)] bg-white p-5">
            <figcaption class="flex items-center justify-between gap-3">
              <div class="flex min-w-0 items-center gap-2.5">
                <div class="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full text-[13px] font-semibold text-white" :style="!tst.photo ? { background: site.primaryColor } : {}">
                  <img v-if="tst.photo" :src="tst.photo" alt="" class="absolute inset-0 h-full w-full object-cover">
                  <span v-else>{{ initials(tst.name) }}</span>
                </div>
                <div class="min-w-0">
                  <div class="truncate text-[13.5px] font-semibold text-[var(--brand-preview-text-heading)]">{{ tst.name }}</div>
                  <div class="truncate text-[12px] text-[var(--brand-preview-text-muted)]">{{ tst.role }}</div>
                </div>
              </div>
              <Quote :size="20" class="shrink-0" :style="{ color: site.primaryColor }" />
            </figcaption>
            <blockquote class="flex-1 text-[14px] leading-[1.6] text-[var(--brand-preview-text-body)]">"{{ tst.quote }}"</blockquote>
          </figure>
        </div>
      </section>

      <!-- For Employees promo -->
      <section v-if="site.forEmployeesOn && !portal.isVerified" class="mx-auto max-w-[1200px] px-6 pb-14">
        <div class="flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between" :style="{ background: site.headerColor }">
          <div>
            <div class="text-[16px] font-semibold text-white">Already part of the team?</div>
            <div class="text-[13px] text-white/70">Access internal-only roles with your company email.</div>
          </div>
          <ForEmployeesTrigger solid :label="t('for_employees_sign_in')" />
        </div>
      </section>

      <CareerSiteFooter />
    </div>
  </CareerSiteGate>
</template>
