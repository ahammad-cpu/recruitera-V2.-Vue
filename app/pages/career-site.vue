<!--
  Public career page — the candidate-facing view of the company's career site
  (the live page behind Settings → Career Site). Renders company info + open
  roles from the app data, in a chrome-less standalone layout. Brand tokens.
-->
<script setup lang="ts">
import {
  ArrowRight, MapPin, Building2, Clock, Play, Search,
  Rocket, Heart, Target, Sparkles, Shield, TrendingUp, Quote,
} from 'lucide-vue-next'
import { useCompany } from '~/composables/useCompany'
import { useJobs } from '~/composables/useJobs'
import type { WorkModel } from '~/types'

definePageMeta({ layout: false })

const { data: company } = useCompany()
const { jobs } = useJobs()

const companyName = computed(() => company.value?.name || 'Recruitera')
const about = computed(() => company.value?.about || 'We help teams hire the people who move them forward — and we build the tools that make it happen.')

// ── Open roles (published only) ──
const openRoles = computed(() => jobs.value.filter(j => j.status === 'published'))
const departments = computed(() => {
  const set = new Set<string>()
  for (const j of openRoles.value) if (j.department) set.add(j.department)
  return ['All teams', ...Array.from(set)]
})
const activeDept = ref('All teams')
const query = ref('')
const filteredRoles = computed(() => openRoles.value.filter((j) => {
  const deptOk = activeDept.value === 'All teams' || j.department === activeDept.value
  const q = query.value.trim().toLowerCase()
  const queryOk = !q || j.title.toLowerCase().includes(q) || (j.location ?? '').toLowerCase().includes(q)
  return deptOk && queryOk
}))
const WORK_LABEL: Record<WorkModel, string> = { 'on-site': 'On-site', remote: 'Remote', hybrid: 'Hybrid' }

// ── Career content (defaults; the Settings builder configures these) ──
const VALUES = [
  { icon: Rocket, title: 'Move fast, together', body: 'We ship, learn, and iterate as one team — momentum beats perfection.' },
  { icon: Heart, title: 'Candidates first', body: 'Every decision starts with the person on the other side of the screen.' },
  { icon: Target, title: 'Own the outcome', body: 'We take real responsibility for results, not just tasks.' },
  { icon: Sparkles, title: 'Learn out loud', body: 'Curiosity is a job requirement. We share what we learn, openly.' },
  { icon: Shield, title: 'Trust by default', body: 'Autonomy and candour — we assume the best and speak plainly.' },
  { icon: TrendingUp, title: 'Grow the pie', body: 'We build so everyone wins: candidates, customers, and each other.' },
]
const TESTIMONIALS = [
  { quote: 'The most supportive team I’ve worked with. Real ownership, zero politics.', name: 'Sara El-Masry', role: 'Product Designer', initials: 'SE' },
  { quote: 'We move quickly but never at the cost of the candidate experience.', name: 'Mohamed Salem', role: 'Engineering Lead', initials: 'MS' },
  { quote: 'I’ve grown more here in a year than in the three before it.', name: 'Amr Hammad', role: 'Talent Partner', initials: 'AH' },
]

function scrollToRoles() {
  document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen bg-[var(--brand-canvas)] text-[var(--brand-text)]">
    <!-- Header -->
    <header class="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-[var(--brand-border-fade)]">
      <div class="mx-auto max-w-[1120px] px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-[10px] bg-[var(--brand-teal)] text-[var(--brand-lime)] inline-flex items-center justify-center font-extrabold text-[15px]">{{ companyName.charAt(0) }}</div>
          <span class="text-[16px] font-bold tracking-[-0.01em]">{{ companyName }}</span>
        </div>
        <button type="button" class="inline-flex items-center gap-1.5 h-10 px-4 rounded-[11px] bg-[var(--brand-teal)] text-white text-[13.5px] font-semibold hover:brightness-110 transition" @click="scrollToRoles">
          View openings <ArrowRight class="w-4 h-4" stroke-width="2" />
        </button>
      </div>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden bg-white">
      <div class="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[var(--brand-lime)] opacity-[0.16] blur-3xl" />
      <div class="pointer-events-none absolute -bottom-32 -left-16 w-[360px] h-[360px] rounded-full bg-[var(--brand-teal-secondary)] opacity-[0.10] blur-3xl" />
      <div class="relative mx-auto max-w-[1120px] px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <span class="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-[var(--brand-lime-tint)] border border-[var(--brand-lime)] text-[12.5px] font-bold text-[var(--brand-olive)]">
          <span class="w-1.5 h-1.5 rounded-full bg-[var(--brand-status-teal-green)]" /> We're hiring · {{ openRoles.length }} open {{ openRoles.length === 1 ? 'role' : 'roles' }}
        </span>
        <h1 class="mt-5 text-[clamp(2.4rem,6vw,4.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-[var(--brand-text)] text-balance max-w-[15ch]">
          Do the best work of your career at
          <span class="relative whitespace-nowrap text-[var(--brand-teal)]">{{ companyName }}<span class="absolute left-0 -bottom-1 h-[10px] w-full bg-[var(--brand-lime)] opacity-70 -z-0 rounded-sm" /></span>
        </h1>
        <p class="mt-6 text-[17px] md:text-[19px] leading-relaxed text-[var(--brand-text-secondary)] max-w-[58ch]">{{ about }}</p>
        <div class="mt-9 flex flex-wrap items-center gap-3">
          <button type="button" class="inline-flex items-center gap-2 h-12 px-6 rounded-[13px] bg-[var(--brand-teal)] text-white text-[15px] font-semibold hover:brightness-110 transition" @click="scrollToRoles">
            See open roles <ArrowRight class="w-[18px] h-[18px]" stroke-width="2" />
          </button>
          <a href="#life" class="inline-flex items-center h-12 px-6 rounded-[13px] border-[1.5px] border-[var(--brand-border)] bg-white text-[15px] font-semibold text-[var(--brand-text)] hover:border-[var(--brand-teal)] transition">Life here</a>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section id="life" class="mx-auto max-w-[1120px] px-6 py-16 md:py-24">
      <div class="max-w-[46ch]">
        <div class="text-[13px] font-extrabold uppercase tracking-[0.14em] text-[var(--brand-teal-secondary)]">What we value</div>
        <h2 class="mt-2 text-[clamp(1.7rem,3.5vw,2.6rem)] font-extrabold tracking-[-0.02em] text-balance">The principles behind how we work</h2>
      </div>
      <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="v in VALUES" :key="v.title" class="rounded-[16px] border border-[var(--brand-border-fade)] bg-white p-6 transition hover:border-[var(--brand-teal)] hover:shadow-[0_16px_40px_rgba(0,26,24,0.06)]">
          <div class="w-11 h-11 rounded-[12px] bg-[var(--brand-lime-tint)] inline-flex items-center justify-center text-[var(--brand-olive)]">
            <component :is="v.icon" class="w-5 h-5" stroke-width="1.9" />
          </div>
          <h3 class="mt-4 text-[16px] font-bold">{{ v.title }}</h3>
          <p class="mt-1.5 text-[14px] leading-relaxed text-[var(--brand-text-secondary)]">{{ v.body }}</p>
        </div>
      </div>
    </section>

    <!-- Culture video -->
    <section class="bg-[var(--brand-teal)] text-white">
      <div class="mx-auto max-w-[1120px] px-6 py-16 md:py-24 grid gap-10 lg:grid-cols-[1fr_1.1fr] items-center">
        <div>
          <div class="text-[13px] font-extrabold uppercase tracking-[0.14em] text-[var(--brand-lime)]">Inside {{ companyName }}</div>
          <h2 class="mt-2 text-[clamp(1.7rem,3.5vw,2.6rem)] font-extrabold tracking-[-0.02em] text-balance">A day in the life, in 90 seconds</h2>
          <p class="mt-4 text-[16px] leading-relaxed text-white/75 max-w-[46ch]">Meet the people, the pace, and the problems we're solving together. No corporate gloss — just how we actually work.</p>
        </div>
        <button type="button" class="group relative aspect-video w-full rounded-[18px] overflow-hidden border border-white/15 bg-[color-mix(in_srgb,var(--brand-teal)_60%,black)]" aria-label="Play culture video">
          <div class="absolute inset-0 bg-[radial-gradient(120%_120%_at_70%_20%,rgba(201,253,19,0.18),transparent_60%)]" />
          <span class="absolute inset-0 grid place-items-center">
            <span class="w-16 h-16 rounded-full bg-[var(--brand-lime)] text-[var(--brand-teal)] grid place-items-center shadow-lg transition group-hover:scale-105">
              <Play class="w-6 h-6 translate-x-[2px]" fill="currentColor" stroke-width="0" />
            </span>
          </span>
        </button>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="mx-auto max-w-[1120px] px-6 py-16 md:py-24">
      <div class="text-[13px] font-extrabold uppercase tracking-[0.14em] text-[var(--brand-teal-secondary)]">From the team</div>
      <h2 class="mt-2 text-[clamp(1.7rem,3.5vw,2.6rem)] font-extrabold tracking-[-0.02em] text-balance max-w-[20ch]">People are the whole point</h2>
      <div class="mt-10 grid gap-4 md:grid-cols-3">
        <figure v-for="t in TESTIMONIALS" :key="t.name" class="rounded-[16px] border border-[var(--brand-border-fade)] bg-white p-6 flex flex-col">
          <Quote class="w-6 h-6 text-[var(--brand-lime)]" fill="currentColor" stroke-width="0" />
          <blockquote class="mt-3 text-[15px] leading-relaxed text-[var(--brand-text)] flex-1">"{{ t.quote }}"</blockquote>
          <figcaption class="mt-5 flex items-center gap-3">
            <span class="w-10 h-10 rounded-full bg-[var(--brand-teal)] text-[var(--brand-lime)] grid place-items-center text-[12.5px] font-bold">{{ t.initials }}</span>
            <span>
              <span class="block text-[14px] font-bold leading-tight">{{ t.name }}</span>
              <span class="block text-[12.5px] text-[var(--brand-text-quiet)]">{{ t.role }}</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- Open roles -->
    <section id="roles" class="bg-white border-t border-[var(--brand-border-fade)]">
      <div class="mx-auto max-w-[1120px] px-6 py-16 md:py-24">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div class="text-[13px] font-extrabold uppercase tracking-[0.14em] text-[var(--brand-teal-secondary)]">Open roles</div>
            <h2 class="mt-2 text-[clamp(1.7rem,3.5vw,2.6rem)] font-extrabold tracking-[-0.02em]">Find your seat</h2>
          </div>
          <div class="relative w-full sm:w-[280px]">
            <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--brand-text-quiet)]" stroke-width="1.8" />
            <input v-model="query" type="text" placeholder="Search roles or locations" class="w-full h-11 pl-10 pr-3.5 rounded-[11px] border-[1.5px] border-[var(--brand-border)] bg-white text-[14px] outline-none transition focus:border-[var(--brand-teal)] placeholder:text-[var(--brand-text-quiet)]">
          </div>
        </div>

        <!-- Dept filters -->
        <div class="mt-6 flex flex-wrap gap-2">
          <button
            v-for="d in departments" :key="d" type="button"
            class="h-9 px-3.5 rounded-full border-[1.5px] text-[13px] font-semibold transition"
            :class="activeDept === d ? 'bg-[var(--brand-lime)] border-[var(--brand-lime)] text-[var(--brand-olive)]' : 'bg-white border-[var(--brand-border)] text-[var(--brand-text-secondary)] hover:border-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]'"
            @click="activeDept = d"
          >{{ d }}</button>
        </div>

        <!-- Roles list -->
        <div class="mt-8 flex flex-col gap-3">
          <a
            v-for="job in filteredRoles" :key="job.id" href="#"
            class="group flex items-center gap-4 rounded-[15px] border border-[var(--brand-border-fade)] bg-white px-5 py-4 transition hover:border-[var(--brand-teal)] hover:shadow-[0_16px_40px_rgba(0,26,24,0.06)]"
          >
            <div class="flex-1 min-w-0">
              <div class="text-[16px] font-bold text-[var(--brand-text)] group-hover:text-[var(--brand-teal)] transition">{{ job.title }}</div>
              <div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[var(--brand-text-quiet)]">
                <span v-if="job.department" class="inline-flex items-center gap-1.5"><Building2 class="w-3.5 h-3.5" stroke-width="1.8" />{{ job.department }}</span>
                <span v-if="job.location" class="inline-flex items-center gap-1.5"><MapPin class="w-3.5 h-3.5" stroke-width="1.8" />{{ job.location }}</span>
                <span class="inline-flex items-center gap-1.5"><Clock class="w-3.5 h-3.5" stroke-width="1.8" />{{ WORK_LABEL[job.workModel] }}</span>
              </div>
            </div>
            <span class="shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-[11px] bg-[var(--brand-canvas)] text-[13.5px] font-semibold text-[var(--brand-text)] group-hover:bg-[var(--brand-teal)] group-hover:text-white transition">Apply <ArrowRight class="w-4 h-4" stroke-width="2" /></span>
          </a>

          <div v-if="!filteredRoles.length" class="rounded-[15px] border border-dashed border-[var(--brand-border)] bg-[var(--brand-canvas)] px-6 py-12 text-center">
            <div class="text-[15px] font-bold text-[var(--brand-text)]">No roles match your search</div>
            <p class="mt-1 text-[13.5px] text-[var(--brand-text-quiet)]">Try another team or clear the search — new roles open often.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[var(--brand-teal)] text-white">
      <div class="mx-auto max-w-[1120px] px-6 py-14">
        <div class="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-[10px] bg-[var(--brand-lime)] text-[var(--brand-teal)] inline-flex items-center justify-center font-extrabold text-[15px]">{{ companyName.charAt(0) }}</div>
              <span class="text-[16px] font-bold">{{ companyName }}</span>
            </div>
            <p class="mt-3 text-[13.5px] text-white/65 max-w-[42ch]">{{ company?.industry || 'Building great teams' }}<span v-if="company?.foundedYear"> · Since {{ company.foundedYear }}</span></p>
          </div>
          <button type="button" class="inline-flex items-center gap-2 h-12 px-6 rounded-[13px] bg-[var(--brand-lime)] text-[var(--brand-teal)] text-[15px] font-bold hover:brightness-105 transition" @click="scrollToRoles">
            See open roles <ArrowRight class="w-[18px] h-[18px]" stroke-width="2.2" />
          </button>
        </div>
        <div class="mt-10 pt-6 border-t border-white/12 flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-white/55">
          <span>© {{ companyName }}. All rights reserved.</span>
          <span>Careers powered by Recruitera</span>
        </div>
      </div>
    </footer>
  </div>
</template>
