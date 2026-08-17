<!--
  Career site — HOME view. Rendered inside the single /career-site page.
  Emits open-job / view-all instead of routing. Driven by useCareerSite().
-->
<script setup lang="ts">
import { ArrowRight, MapPin, Clock, Briefcase, Quote as QuoteIcon } from 'lucide-vue-next'
import { useCareerSite, valueIcon } from '~/composables/useCareerSite'
import { useCompany } from '~/composables/useCompany'
import { useJobs } from '~/composables/useJobs'
import { ccEmploymentType, ccWorkLabel, ccDaysAgo, ccBlurb } from '~/utils/careerJob'

const emit = defineEmits<{ 'open-job': [id: string]; 'view-all': [] }>()

const { headline, intro, values, testimonials, videoUrl, forEmployeesOn, employeeDomain, coverUrl } = useCareerSite()
const { data: company } = useCompany()
const { jobs } = useJobs()
const companyName = computed(() => company.value?.name || 'Your Company')

const openRoles = computed(() => jobs.value.filter(j => j.status === 'published'))
const collar = ref<'all' | 'white' | 'blue'>('all')
const featured = computed(() => openRoles.value.filter(j => collar.value === 'all' || j.collar === collar.value).slice(0, 6))

const ytId = computed(() => videoUrl.value.match(/(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/)?.[1] ?? '')
function initials(name: string) { return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?' }
function scrollToJobs() { document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' }) }
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0" :style="coverUrl
        ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, var(--cc-primary), color-mix(in srgb, var(--cc-primary) 45%, #0b1220))' }" />
      <div class="absolute inset-0" :style="{ background: coverUrl ? 'linear-gradient(90deg, rgba(8,14,22,.82), rgba(8,14,22,.45))' : 'transparent' }" />
      <div class="relative mx-auto max-w-[1160px] px-6 pt-28 pb-40 md:pt-36 md:pb-48 text-white">
        <h1 class="text-[clamp(2.5rem,6.5vw,4.8rem)] font-extrabold leading-[1.02] tracking-[-0.035em] max-w-[17ch] text-balance">{{ headline }}</h1>
        <p class="mt-6 text-[17px] md:text-[19px] leading-relaxed text-white/85 max-w-[58ch]">{{ intro }}</p>
        <div class="mt-9 flex flex-wrap gap-3">
          <button type="button" class="inline-flex items-center gap-2 h-12 px-6 rounded-[13px] bg-white text-[15px] font-bold transition hover:brightness-95" :style="{ color: 'var(--cc-primary)' }" @click="scrollToJobs">View openings <ArrowRight class="w-[18px] h-[18px]" stroke-width="2.2" /></button>
        </div>
      </div>
    </section>

    <!-- Featured jobs — overlapping card -->
    <section id="jobs" class="relative z-10 -mt-28 md:-mt-32">
      <div class="mx-auto max-w-[1160px] px-6">
        <div class="rounded-[22px] bg-white border border-[#eceef1] shadow-[0_28px_70px_rgba(15,23,42,0.12)] p-7 md:p-10">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div class="text-[clamp(1.3rem,2.8vw,1.7rem)] font-bold tracking-[-0.01em]" :style="{ color: 'var(--cc-primary)' }">{{ companyName }}</div>
              <h2 class="mt-2 text-[clamp(1.35rem,3vw,1.9rem)] font-semibold" :style="{ color: 'var(--cc-header)' }">Discover our featured jobs</h2>
              <p class="mt-2 text-[14.5px] text-[#6b7280] max-w-[490px]">Handpicked opportunities that match top talent with exciting roles — find your next career move here.</p>
            </div>
            <button type="button" class="inline-flex items-center gap-1.5 h-10 px-4 rounded-[11px] border-[1.5px] text-[13.5px] font-semibold transition hover:bg-[color-mix(in_srgb,var(--cc-primary)_8%,white)]" :style="{ borderColor: 'var(--cc-primary)', color: 'var(--cc-primary)' }" @click="emit('view-all')">View all <ArrowRight class="w-4 h-4" stroke-width="2" /></button>
          </div>

          <div class="mt-6 flex flex-wrap gap-2.5">
            <button v-for="c in (['all','white','blue'] as const)" :key="c" type="button"
              class="h-9 px-4 rounded-full text-[13px] font-semibold transition"
              :style="collar === c ? { background: 'var(--cc-primary)', color: '#fff' } : {}"
              :class="collar === c ? '' : 'bg-white border border-[#e3e6ea] text-[#4b5563] hover:border-[#c3c8cf]'"
              @click="collar = c">{{ c === 'all' ? 'All' : c === 'white' ? 'White Collar' : 'Blue Collar' }}</button>
          </div>

          <div class="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <button v-for="job in featured" :key="job.id" type="button"
              class="group flex flex-col text-left rounded-[16px] border border-[#eceef1] bg-white p-5 transition hover:border-[color:var(--cc-primary)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
              @click="emit('open-job', job.id)">
              <div class="flex items-start justify-between gap-3">
                <h3 class="text-[16.5px] font-bold leading-snug" :style="{ color: 'var(--cc-primary)' }">{{ job.title }}</h3>
                <span class="shrink-0 inline-flex items-center h-6 px-2.5 rounded-full border border-[#e3e6ea] text-[11.5px] font-semibold text-[#6b7280]">{{ ccWorkLabel(job.workModel) }}</span>
              </div>
              <p class="mt-2 text-[13.5px] leading-relaxed text-[#6b7280] line-clamp-2 flex-1">{{ ccBlurb(job) }}</p>
              <div class="mt-4 rounded-[12px] bg-[#f7f8fa] px-3.5 py-3 grid grid-cols-2 gap-y-2 text-[12.5px] text-[#6b7280]">
                <span class="inline-flex items-center gap-1.5"><Clock class="w-3.5 h-3.5" stroke-width="1.8" />{{ ccDaysAgo(job.createdAt) }}</span>
                <span class="inline-flex items-center gap-1.5"><Briefcase class="w-3.5 h-3.5" stroke-width="1.8" />{{ ccEmploymentType(job) }}</span>
                <span v-if="job.location" class="col-span-2 inline-flex items-center gap-1.5"><MapPin class="w-3.5 h-3.5" stroke-width="1.8" />{{ job.location }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section v-if="values.length" class="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
      <div class="text-center max-w-[46ch] mx-auto">
        <div class="text-[13px] font-extrabold uppercase tracking-[0.14em]" :style="{ color: 'var(--cc-primary)' }">What we stand for</div>
        <h2 class="mt-2 text-[clamp(1.8rem,3.8vw,2.6rem)] font-extrabold tracking-[-0.02em] text-balance" :style="{ color: 'var(--cc-header)' }">The principles behind how we work</h2>
      </div>
      <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="(v, i) in values" :key="i" class="rounded-[18px] border border-[#eceef1] bg-white p-7 text-center transition hover:shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div class="w-[62px] h-[64px] mx-auto relative grid place-items-center">
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 90.96 93.4" xmlns="http://www.w3.org/2000/svg"><path d="M73.11,12.33C51.41-9.1,32.93.65,29.72,17S-3.37,36.57.31,55.85s43.87,7.84,43.87,25.32,46.46,16.87,46.46-6S94.81,33.77,73.11,12.33Z" :fill="'var(--cc-primary)'" /></svg>
            <component :is="valueIcon(v.icon)" class="relative w-6 h-6 text-white" stroke-width="1.9" />
          </div>
          <h3 class="mt-4 text-[17px] font-bold" :style="{ color: 'var(--cc-header)' }">{{ v.name }}</h3>
          <p class="mt-1.5 text-[14px] leading-relaxed text-[#6b7280]">{{ v.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Culture video -->
    <section v-if="videoUrl" class="bg-[#f7f8fa]">
      <div class="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
        <div class="text-center">
          <div class="text-[13px] font-extrabold uppercase tracking-[0.14em]" :style="{ color: 'var(--cc-primary)' }">Inside {{ companyName }}</div>
          <h2 class="mt-2 text-[clamp(1.8rem,3.8vw,2.6rem)] font-extrabold tracking-[-0.02em]" :style="{ color: 'var(--cc-header)' }">A day in the life</h2>
        </div>
        <div class="mt-10 aspect-video w-full max-w-[900px] mx-auto rounded-[20px] overflow-hidden shadow-[0_28px_70px_rgba(15,23,42,0.16)] bg-black">
          <iframe v-if="ytId" class="w-full h-full" :src="`https://www.youtube.com/embed/${ytId}`" title="Culture video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen />
          <div v-else class="w-full h-full grid place-items-center text-white/60 text-[14px]">Video preview</div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section v-if="testimonials.length" class="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
      <div class="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] items-stretch">
        <div class="rounded-[22px] p-10 flex flex-col justify-between" :style="{ background: 'color-mix(in srgb, var(--cc-primary) 12%, white)' }">
          <QuoteIcon class="w-14 h-14" :style="{ color: 'var(--cc-primary)' }" fill="currentColor" stroke-width="0" />
          <div>
            <h2 class="text-[clamp(1.7rem,3.5vw,2.4rem)] font-extrabold tracking-[-0.02em] text-balance" :style="{ color: 'var(--cc-header)' }">Real stories from the team</h2>
            <p class="mt-3 text-[15px] leading-relaxed text-[#4b5563]">An inside look at the culture, the growth, and the people — in their own words.</p>
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 content-start">
          <figure v-for="(t, i) in testimonials" :key="i" class="rounded-[18px] border border-[#eceef1] bg-white p-6 flex flex-col">
            <blockquote class="text-[15px] leading-relaxed text-[#374151] flex-1">"{{ t.quote }}"</blockquote>
            <figcaption class="mt-5 flex items-center gap-3">
              <img v-if="t.photo" :src="t.photo" alt="" class="w-11 h-11 rounded-full object-cover">
              <span v-else class="w-11 h-11 rounded-full grid place-items-center text-white text-[13px] font-bold" :style="{ background: 'var(--cc-primary)' }">{{ initials(t.name) }}</span>
              <span>
                <span class="block text-[14.5px] font-bold" :style="{ color: 'var(--cc-header)' }">{{ t.name }}</span>
                <span class="block text-[12.5px] text-[#8a919c]">{{ t.role }}</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- Employee CTA -->
    <section v-if="forEmployeesOn" class="mx-auto max-w-[1160px] px-6 pb-16 md:pb-24">
      <div class="rounded-[20px] p-8 md:p-10 flex flex-wrap items-center justify-between gap-5" :style="{ background: 'var(--cc-header)' }">
        <div class="text-white">
          <div class="text-[20px] font-bold">Already part of the team?</div>
          <div class="mt-1 text-[14px] text-white/70">Access internal-only roles with your <span class="font-semibold">@{{ employeeDomain }}</span> email.</div>
        </div>
        <button type="button" class="h-12 px-6 rounded-[13px] text-[15px] font-bold text-white transition hover:brightness-110" :style="{ background: 'var(--cc-primary)' }">Sign in as employee</button>
      </div>
    </section>
  </div>
</template>
