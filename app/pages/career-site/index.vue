<!--
  Career site — HOME. Public landing page: hero, featured roles, culture video,
  values ("What we stand for"), testimonials ("From the team"), employee CTA.
  All content + colors come from useCareerSite() (Settings → Career Site), so
  editing the builder updates this page live. Roles come from useJobs().
-->
<script setup lang="ts">
import { ArrowRight, MapPin, Clock, Play } from 'lucide-vue-next'
import { useCareerSite, valueIcon } from '~/composables/useCareerSite'
import { useJobs } from '~/composables/useJobs'
import { ccEmploymentType, ccWorkLabel, ccDaysAgo, ccBlurb } from '~/utils/careerJob'

definePageMeta({ layout: false })

const { headline, intro, values, testimonials, videoUrl, forEmployeesOn, employeeDomain } = useCareerSite()
const { jobs } = useJobs()

const openRoles = computed(() => jobs.value.filter(j => j.status === 'published'))
const collar = ref<'all' | 'white' | 'blue'>('all')
const featured = computed(() => openRoles.value.filter(j => collar.value === 'all' || j.collar === collar.value).slice(0, 6))

function initials(name: string) { return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?' }
function scrollToJobs() { document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' }) }
</script>

<template>
  <CareerShell>
    <!-- Hero -->
    <section class="relative overflow-hidden text-white" :style="{ background: 'linear-gradient(135deg, var(--cc-primary), color-mix(in srgb, var(--cc-primary) 55%, black))' }">
      <div class="mx-auto max-w-[1160px] px-6 py-24 md:py-32">
        <span class="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/15 text-[13px] font-semibold">{{ openRoles.length }} open {{ openRoles.length === 1 ? 'role' : 'roles' }}</span>
        <h1 class="mt-6 text-[clamp(2.4rem,6vw,4.6rem)] font-extrabold leading-[1.03] tracking-[-0.03em] max-w-[16ch] text-balance">{{ headline }}</h1>
        <p class="mt-6 text-[17px] md:text-[19px] leading-relaxed text-white/85 max-w-[60ch]">{{ intro }}</p>
        <button type="button" class="mt-9 inline-flex items-center gap-2 h-12 px-6 rounded-[13px] text-[15px] font-bold bg-white transition hover:brightness-95" :style="{ color: 'var(--cc-primary)' }" @click="scrollToJobs">
          View open roles <ArrowRight class="w-[18px] h-[18px]" stroke-width="2.2" />
        </button>
      </div>
    </section>

    <!-- Featured jobs -->
    <section id="jobs" class="mx-auto max-w-[1160px] px-6 py-16 md:py-20">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-[clamp(1.7rem,3.5vw,2.4rem)] font-extrabold tracking-[-0.02em]" :style="{ color: 'var(--cc-header)' }">Featured Jobs</h2>
          <p class="mt-1 text-[14px] text-[#8a919c]">Found {{ openRoles.length }} open positions</p>
        </div>
        <NuxtLink to="/career-site/opportunities" class="inline-flex items-center gap-1.5 h-10 px-4 rounded-[11px] border-[1.5px] text-[13.5px] font-semibold transition hover:bg-[color-mix(in_srgb,var(--cc-primary)_8%,white)]" :style="{ borderColor: 'var(--cc-primary)', color: 'var(--cc-primary)' }">View all <ArrowRight class="w-4 h-4" stroke-width="2" /></NuxtLink>
      </div>

      <div class="mt-6 flex flex-wrap gap-2.5">
        <button v-for="c in (['all','white','blue'] as const)" :key="c" type="button"
          class="h-9 px-4 rounded-full text-[13px] font-semibold transition"
          :style="collar === c ? { background: 'var(--cc-primary)', color: '#fff' } : {}"
          :class="collar === c ? '' : 'bg-white border border-[#e3e6ea] text-[#4b5563] hover:border-[#c3c8cf]'"
          @click="collar = c">{{ c === 'all' ? 'All' : c === 'white' ? 'White Collar' : 'Blue Collar' }}</button>
      </div>

      <div class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink v-for="job in featured" :key="job.id" :to="`/career-site/jobs/${job.id}`"
          class="group rounded-[16px] border border-[#eceef1] bg-white p-5 transition hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
          :style="{ borderColor: 'var(--cc-hover, #eceef1)' }" @mouseenter="null">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center h-6 px-2.5 rounded-full text-[11.5px] font-bold" :style="{ background: 'color-mix(in srgb, var(--cc-primary) 12%, white)', color: 'var(--cc-primary)' }">{{ ccEmploymentType(job) }}</span>
            <span class="inline-flex items-center h-6 px-2.5 rounded-full text-[11.5px] font-bold" :class="job.collar === 'blue' ? 'bg-[#fdecec] text-[#b02a2a]' : 'bg-[#eef2ff] text-[#3b5bdb]'">{{ job.collar === 'blue' ? 'Blue Collar' : 'White Collar' }}</span>
          </div>
          <h3 class="mt-3 text-[17px] font-bold group-hover:opacity-90 transition" :style="{ color: 'var(--cc-header)' }">{{ job.title }}</h3>
          <p class="mt-1.5 text-[13.5px] leading-relaxed text-[#6b7280] line-clamp-2">{{ ccBlurb(job) }}</p>
          <div class="mt-4 pt-3 border-t border-[#f1f3f5] flex items-center gap-4 text-[12.5px] text-[#8a919c]">
            <span v-if="job.location" class="inline-flex items-center gap-1.5"><MapPin class="w-3.5 h-3.5" stroke-width="1.8" />{{ job.location }}</span>
            <span class="inline-flex items-center gap-1.5"><Clock class="w-3.5 h-3.5" stroke-width="1.8" />{{ ccDaysAgo(job.createdAt) }}</span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Culture video (optional) -->
    <section v-if="videoUrl" class="mx-auto max-w-[1160px] px-6 pb-4">
      <h2 class="text-[clamp(1.5rem,3vw,2rem)] font-extrabold text-center mb-6" :style="{ color: 'var(--cc-header)' }">Life at the company</h2>
      <div class="relative aspect-video w-full rounded-[18px] overflow-hidden bg-[#0f172a] grid place-items-center">
        <span class="w-16 h-16 rounded-full grid place-items-center text-white" :style="{ background: 'var(--cc-primary)' }"><Play class="w-6 h-6 translate-x-[2px]" fill="currentColor" stroke-width="0" /></span>
      </div>
    </section>

    <!-- Values -->
    <section v-if="values.length" class="bg-[#f7f8fa]">
      <div class="mx-auto max-w-[1160px] px-6 py-16 md:py-20">
        <h2 class="text-[clamp(1.7rem,3.5vw,2.4rem)] font-extrabold tracking-[-0.02em] text-center" :style="{ color: 'var(--cc-header)' }">What we stand for</h2>
        <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="(v, i) in values" :key="i" class="rounded-[16px] border border-[#eceef1] bg-white p-6">
            <div class="w-11 h-11 rounded-[12px] inline-flex items-center justify-center" :style="{ background: 'color-mix(in srgb, var(--cc-primary) 12%, white)', color: 'var(--cc-primary)' }">
              <component :is="valueIcon(v.icon)" class="w-5 h-5" stroke-width="1.9" />
            </div>
            <h3 class="mt-4 text-[16px] font-bold" :style="{ color: 'var(--cc-header)' }">{{ v.name }}</h3>
            <p class="mt-1.5 text-[14px] leading-relaxed text-[#6b7280]">{{ v.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section v-if="testimonials.length" class="mx-auto max-w-[1160px] px-6 py-16 md:py-20">
      <h2 class="text-[clamp(1.7rem,3.5vw,2.4rem)] font-extrabold tracking-[-0.02em]" :style="{ color: 'var(--cc-header)' }">From the team</h2>
      <div class="mt-10 grid gap-4 md:grid-cols-2">
        <figure v-for="(t, i) in testimonials" :key="i" class="rounded-[16px] border border-[#eceef1] bg-white p-6">
          <figcaption class="flex items-center gap-3">
            <img v-if="t.photo" :src="t.photo" alt="" class="w-11 h-11 rounded-full object-cover">
            <span v-else class="w-11 h-11 rounded-full grid place-items-center text-white text-[13px] font-bold" :style="{ background: 'var(--cc-primary)' }">{{ initials(t.name) }}</span>
            <span>
              <span class="block text-[15px] font-bold" :style="{ color: 'var(--cc-header)' }">{{ t.name }}</span>
              <span class="block text-[12.5px] text-[#8a919c]">{{ t.role }}</span>
            </span>
          </figcaption>
          <blockquote class="mt-4 text-[15px] leading-relaxed text-[#374151]">"{{ t.quote }}"</blockquote>
        </figure>
      </div>
    </section>

    <!-- Employee CTA -->
    <section v-if="forEmployeesOn" class="mx-auto max-w-[1160px] px-6 pb-16 md:pb-20">
      <div class="rounded-[18px] p-8 flex flex-wrap items-center justify-between gap-5" :style="{ background: 'var(--cc-header)' }">
        <div class="text-white">
          <div class="text-[19px] font-bold">Already part of the team?</div>
          <div class="mt-1 text-[14px] text-white/70">Access internal-only roles with your <span class="font-semibold">@{{ employeeDomain }}</span> email.</div>
        </div>
        <button type="button" class="h-12 px-6 rounded-[13px] text-[15px] font-bold text-white transition hover:brightness-110" :style="{ background: 'var(--cc-primary)' }">Sign in as employee</button>
      </div>
    </section>
  </CareerShell>
</template>
