<!--
  Career site — HOME view. Rendered inside the single /career-site page.
  Emits open-job / view-all instead of routing. Driven by useCareerSite().
-->
<script setup lang="ts">
import { ArrowRight, MapPin, Clock, Briefcase, Quote as QuoteIcon, Play, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useCareerSite, valueIcon } from '~/composables/useCareerSite'
import { useCompany } from '~/composables/useCompany'
import { useJobs } from '~/composables/useJobs'
import { ccEmploymentType, ccWorkLabel, ccDaysAgo, ccBlurb, ccIsVideoFile } from '~/utils/careerJob'

const emit = defineEmits<{ 'open-job': [id: string]; 'view-all': [] }>()

const { headline, intro, values, testimonials, videoUrl, forEmployeesOn, employeeDomain, coverType, coverUrl, coverVideoUrl, syncRev } = useCareerSite()
const { data: company } = useCompany()
const { jobs } = useJobs()
const companyName = computed(() => company.value?.name || 'Your Company')

const openRoles = computed(() => jobs.value.filter(j => j.status === 'published'))
const collar = ref<'all' | 'white' | 'blue'>('all')
const featured = computed(() => openRoles.value.filter(j => collar.value === 'all' || j.collar === collar.value).slice(0, 6))
// ≤3 roles sit on a single row; 4–6 wrap into a 3-column grid.
const gridColsClass = computed(() => {
  const n = featured.value.length
  if (n <= 1) return 'grid-cols-1 max-w-[560px]'
  if (n === 2) return 'grid-cols-1 sm:grid-cols-2'
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
})

const ytId = computed(() => videoUrl.value.match(/(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/)?.[1] ?? '')
const videoPlaying = ref(false)

// Testimonials carousel — one at a time on the right, auto-advancing.
const tIndex = ref(0)
const activeT = computed(() => testimonials.value[tIndex.value] ?? testimonials.value[0] ?? { name: '', role: '', quote: '' })
function goT(dir: number) { const n = testimonials.value.length || 1; tIndex.value = (tIndex.value + dir + n) % n }
let tTimer: ReturnType<typeof setInterval> | undefined
function startT() { if (testimonials.value.length > 1 && !tTimer) tTimer = setInterval(() => goT(1), 6000) }
function stopT() { if (tTimer) { clearInterval(tTimer); tTimer = undefined } }
function onTVisibility() { if (document.hidden) stopT(); else startT() }
onMounted(() => { document.addEventListener('visibilitychange', onTVisibility); startT() })
onBeforeUnmount(() => { document.removeEventListener('visibilitychange', onTVisibility); stopT() })
// Cover video: YouTube link → embedded loop; anything else → treated as a video file (mp4/webm).
const coverYtId = computed(() => coverVideoUrl.value.match(/(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/)?.[1] ?? '')
const coverIsFile = computed(() => ccIsVideoFile(coverVideoUrl.value))
const coverHasVideo = computed(() => !!coverYtId.value || coverIsFile.value)
// Video hero (full-bleed, bottom-left text) only when the cover source is set
// to "video" and a playable video exists. Otherwise the image/gradient hero.
const heroIsVideo = computed(() => coverType.value === 'video' && coverHasVideo.value)
const heroImage = computed(() => coverType.value === 'image' && !!coverUrl.value)
function initials(name: string) { return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?' }
function scrollToJobs() { document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' }) }

// ── Values as an infinite marquee: when there are more than 3, the cards
// scroll continuously and seamlessly (CSS animation, no JS timers). The list is
// duplicated and the track animates to -50%, so the second copy lands exactly
// where the first began — a perfect loop. Pauses on hover (CSS). ──
const valuesLoop = computed(() => values.value.length > 3)
const marqueeValues = computed(() => [...values.value, ...values.value])
// Constant speed regardless of count (~6s per card).
const marqueeStyle = computed(() => ({ animationDuration: `${Math.max(18, values.value.length * 6)}s` }))
</script>

<template>
  <div>
    <!-- Hero — VIDEO: Vodafone-style. Tall (fills the screen), text bottom-left
         hugging the edge; the featured-jobs card still overlaps it. -->
    <section v-if="heroIsVideo" class="relative overflow-hidden min-h-[94vh] flex items-end bg-black">
      <div class="absolute inset-0 overflow-hidden">
        <iframe v-if="coverYtId" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full pointer-events-none"
          :src="`https://www.youtube.com/embed/${coverYtId}?autoplay=1&mute=1&loop=1&playlist=${coverYtId}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1`"
          title="Cover video" frameborder="0" allow="autoplay; encrypted-media" />
        <video v-else class="absolute inset-0 w-full h-full object-cover" :src="coverVideoUrl" autoplay muted loop playsinline />
      </div>
      <div class="absolute inset-0" style="background:linear-gradient(to top, rgba(8,14,22,.86) 0%, rgba(8,14,22,.42) 42%, rgba(8,14,22,.10) 100%)" />
      <div class="relative w-full px-6 sm:px-10 lg:px-16 pb-28 md:pb-32 text-white">
        <h1 class="text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.05] tracking-[-0.03em] max-w-[18ch] text-balance">{{ headline }}</h1>
        <p v-if="intro" class="mt-5 text-[15px] md:text-[16.5px] leading-relaxed text-white/85 max-w-[56ch]">{{ intro }}</p>
        <button type="button" class="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-[13px] bg-white text-[15px] font-bold transition duration-150 hover:brightness-95 active:scale-[0.97]" :style="{ color: 'var(--cc-primary)' }" @click="scrollToJobs">View openings <ArrowRight class="w-[18px] h-[18px]" stroke-width="2.2" /></button>
      </div>
    </section>

    <!-- Hero — IMAGE cover: whole photo at natural aspect, starting below the
         header (pt clears the header overlap so the top isn't cut off) -->
    <section v-else-if="heroImage" class="relative pt-20">
      <img :src="coverUrl" alt="" class="block w-full h-auto">
    </section>

    <!-- Hero — GRADIENT (no cover): headline + intro + CTA -->
    <section v-else class="relative overflow-hidden">
      <div class="absolute inset-0" style="background:linear-gradient(135deg, var(--cc-primary), color-mix(in srgb, var(--cc-primary) 45%, #0b1220))" />
      <div class="relative mx-auto max-w-[1160px] px-6 pt-28 pb-40 md:pt-36 md:pb-48 text-white">
        <h1 class="text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.05] tracking-[-0.03em] max-w-[18ch] text-balance">{{ headline }}</h1>
        <p class="mt-5 text-[15px] md:text-[16.5px] leading-relaxed text-white/85 max-w-[56ch]">{{ intro }}</p>
        <div class="mt-9 flex flex-wrap gap-3">
          <button type="button" class="inline-flex items-center gap-2 h-12 px-6 rounded-[13px] bg-white text-[15px] font-bold transition duration-150 hover:brightness-95 active:scale-[0.97]" :style="{ color: 'var(--cc-primary)' }" @click="scrollToJobs">View openings <ArrowRight class="w-[18px] h-[18px]" stroke-width="2.2" /></button>
        </div>
      </div>
    </section>

    <!-- Featured jobs — overlaps the hero (smaller overlap on the tall video so
         it doesn't cover the bottom-anchored text) -->
    <section id="jobs" class="relative z-10" :class="(heroIsVideo || heroImage) ? '-mt-14 md:-mt-16' : '-mt-28 md:-mt-32'">
      <div class="mx-auto max-w-[1160px] px-6">
        <div class="rounded-[22px] bg-white border border-[#eceef1] shadow-[0_28px_70px_rgba(15,23,42,0.12)] p-7 md:p-10">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div class="text-[clamp(1.3rem,2.8vw,1.7rem)] font-bold tracking-[-0.01em]" :style="{ color: 'var(--cc-primary)' }">{{ companyName }}</div>
              <h2 class="mt-2 text-[clamp(1.35rem,3vw,1.9rem)] font-semibold" :style="{ color: 'var(--cc-header)' }">Discover our featured jobs</h2>
              <p class="mt-2 text-[14.5px] leading-relaxed text-[#6b7280] max-w-[500px]">The roles we're most excited about right now at {{ companyName }} — standout positions where you can grow fast and make real impact from day one.</p>
            </div>
            <button type="button" class="inline-flex items-center gap-1.5 h-10 px-4 rounded-[11px] border-[1.5px] text-[13.5px] font-semibold transition duration-150 hover:bg-[color-mix(in_srgb,var(--cc-primary)_8%,white)] active:scale-[0.96]" :style="{ borderColor: 'var(--cc-primary)', color: 'var(--cc-primary)' }" @click="emit('view-all')">View all <ArrowRight class="w-4 h-4" stroke-width="2" /></button>
          </div>

          <div class="mt-6 flex flex-wrap gap-2.5">
            <button v-for="c in (['all','white','blue'] as const)" :key="c" type="button"
              class="h-9 px-4 rounded-full text-[13px] font-semibold transition duration-150 active:scale-[0.95]"
              :style="collar === c ? { background: 'var(--cc-primary)', color: '#fff' } : {}"
              :class="collar === c ? '' : 'bg-white border border-[#e3e6ea] text-[#4b5563] hover:border-[#c3c8cf]'"
              @click="collar = c">{{ c === 'all' ? 'All' : c === 'white' ? 'White Collar' : 'Blue Collar' }}</button>
          </div>

          <div class="mt-7 grid gap-5" :class="gridColsClass">
            <button v-for="job in featured" :key="job.id" type="button"
              class="group relative flex flex-col text-left rounded-[18px] border border-[#ececf0] bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-[color:var(--cc-primary)] hover:shadow-[0_20px_46px_rgba(15,23,42,0.10)] active:translate-y-0 active:scale-[0.99]"
              @click="emit('open-job', job.id)">
              <!-- Top row: department chip + work-mode badge -->
              <div class="flex items-center justify-between gap-3">
                <span v-if="job.department" class="inline-flex items-center h-6 px-2.5 rounded-full text-[11.5px] font-semibold" :style="{ background: 'color-mix(in srgb, var(--cc-primary) 11%, white)', color: 'var(--cc-primary)' }">{{ job.department }}</span>
                <span class="ml-auto inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border border-[#e6e8ec] text-[11.5px] font-semibold text-[#5b6472]"><span class="w-1.5 h-1.5 rounded-full" :style="{ background: 'var(--cc-primary)' }" />{{ ccWorkLabel(job.workModel) }}</span>
              </div>
              <h3 class="mt-3.5 text-[17px] font-bold leading-snug tracking-[-0.01em] transition-colors group-hover:text-[color:var(--cc-primary)]" :style="{ color: 'var(--cc-header)' }">{{ job.title }}</h3>
              <p class="mt-2 text-[13.5px] leading-relaxed text-[#727a86] line-clamp-2 flex-1">{{ ccBlurb(job) }}</p>
              <!-- Footer meta -->
              <div class="mt-5 pt-4 border-t border-[#f0f1f4] flex items-center gap-x-4 gap-y-1.5 flex-wrap text-[12.5px] font-medium text-[#727a86]">
                <span v-if="job.location" class="inline-flex items-center gap-1.5"><MapPin class="w-3.5 h-3.5" stroke-width="1.9" />{{ job.location }}</span>
                <span class="inline-flex items-center gap-1.5"><Briefcase class="w-3.5 h-3.5" stroke-width="1.9" />{{ ccEmploymentType(job) }}</span>
                <span class="ml-auto inline-flex items-center gap-1.5 text-[#9aa1ac]"><Clock class="w-3.5 h-3.5" stroke-width="1.9" />{{ ccDaysAgo(job.createdAt) }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section v-if="values.length" :key="`v-${syncRev}`" class="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
      <div class="text-center max-w-[46ch] mx-auto">
        <div class="text-[13px] font-extrabold uppercase tracking-[0.14em]" :style="{ color: 'var(--cc-primary)' }">What we stand for</div>
        <h2 class="mt-2 text-[clamp(1.8rem,3.8vw,2.6rem)] font-extrabold tracking-[-0.02em] text-balance" :style="{ color: 'var(--cc-header)' }">The principles behind how we work</h2>
      </div>
      <!-- ≤ 3: centered row -->
      <div v-if="!valuesLoop" class="mt-12 flex flex-wrap justify-center gap-5">
        <div v-for="(v, i) in values" :key="i" class="group w-full sm:w-[calc(50%-0.625rem)] lg:w-[344px] rounded-2xl border border-[#ececf0] bg-white p-6 text-center transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_46px_rgba(15,23,42,0.08)] hover:border-[color:color-mix(in_srgb,var(--cc-primary)_35%,#ececf0)]">
          <div class="w-12 h-12 mx-auto grid place-items-center rounded-[14px] transition-transform duration-200 group-hover:scale-105"
            :style="{ background: 'color-mix(in srgb, var(--cc-primary) 12%, white)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--cc-primary) 24%, white)' }">
            <component :is="valueIcon(v.icon)" class="w-[22px] h-[22px]" :style="{ color: 'var(--cc-primary)' }" stroke-width="1.9" />
          </div>
          <h3 class="mt-5 text-[17px] font-bold" :style="{ color: 'var(--cc-header)' }">{{ v.name }}</h3>
          <p class="mt-1.5 text-[14px] leading-relaxed text-[#6b7280]">{{ v.desc }}</p>
        </div>
      </div>

      <!-- > 3: infinite marquee — continuous seamless scroll -->
      <div v-else class="mt-12 cc-marquee-mask overflow-hidden">
        <div class="cc-marquee flex w-max" :style="marqueeStyle">
          <div v-for="(v, i) in marqueeValues" :key="i" class="group shrink-0 w-[300px] sm:w-[330px] mr-5 rounded-2xl border border-[#ececf0] bg-white p-6 text-center transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_46px_rgba(15,23,42,0.08)] hover:border-[color:color-mix(in_srgb,var(--cc-primary)_35%,#ececf0)]">
            <div class="w-12 h-12 mx-auto grid place-items-center rounded-[14px] transition-transform duration-200 group-hover:scale-105"
              :style="{ background: 'color-mix(in srgb, var(--cc-primary) 12%, white)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--cc-primary) 24%, white)' }">
              <component :is="valueIcon(v.icon)" class="w-[22px] h-[22px]" :style="{ color: 'var(--cc-primary)' }" stroke-width="1.9" />
            </div>
            <h3 class="mt-5 text-[17px] font-bold" :style="{ color: 'var(--cc-header)' }">{{ v.name }}</h3>
            <p class="mt-1.5 text-[14px] leading-relaxed text-[#6b7280]">{{ v.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Culture video — two-column dark block (text left, video right) -->
    <section v-if="videoUrl" :style="{ background: 'var(--cc-header)' }">
      <div class="mx-auto max-w-[1160px] px-6 py-16 md:py-24 grid gap-10 lg:gap-14 lg:grid-cols-2 lg:items-center">
        <!-- Left: copy -->
        <div>
          <div class="text-[13px] font-extrabold uppercase tracking-[0.16em]" :style="{ color: 'var(--cc-primary)' }">Inside {{ companyName }}</div>
          <h2 class="mt-4 text-[clamp(2rem,4.4vw,3.1rem)] font-extrabold leading-[1.08] tracking-[-0.025em] text-white">A look inside<br>our culture</h2>
          <p class="mt-5 text-[16px] leading-relaxed text-white/65 max-w-[46ch]">Meet the people, the pace, and the work behind what we do — no gloss, just a real look at life on our team.</p>
        </div>
        <!-- Right: video card with click-to-play -->
        <div class="relative aspect-video rounded-[20px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/10">
          <iframe v-if="videoPlaying && ytId" class="absolute inset-0 w-full h-full" :src="`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`" title="Culture video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen />
          <video v-else-if="videoPlaying" class="absolute inset-0 w-full h-full object-cover" :src="videoUrl" autoplay controls playsinline />
          <button v-else type="button" class="group absolute inset-0 w-full h-full transition active:scale-[0.995]" aria-label="Play culture video" @click="videoPlaying = true">
            <img v-if="ytId" :src="`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`" alt="" class="absolute inset-0 w-full h-full object-cover">
            <span class="absolute inset-0" :style="{ background: ytId ? 'linear-gradient(135deg, rgba(8,14,22,.55), rgba(8,14,22,.35))' : 'linear-gradient(135deg, color-mix(in srgb, var(--cc-header) 55%, #000), color-mix(in srgb, var(--cc-primary) 45%, #000))' }" />
            <span class="absolute inset-0 grid place-items-center">
              <span class="w-16 h-16 rounded-full grid place-items-center shadow-lg transition-transform duration-200 group-hover:scale-110" :style="{ background: 'var(--cc-primary)' }">
                <Play class="w-6 h-6 text-white fill-current translate-x-[2px]" />
              </span>
            </span>
          </button>
        </div>
      </div>
    </section>

    <!-- Testimonials — branded left panel + carousel on the right -->
    <section v-if="testimonials.length" :key="`t-${syncRev}`" class="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
      <div class="grid overflow-hidden rounded-[24px] border border-[#ececf0] shadow-[0_24px_64px_rgba(15,23,42,0.07)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]" @mouseenter="stopT" @mouseleave="startT">
        <!-- Left: branded intro -->
        <div class="relative flex flex-col justify-between gap-12 p-9 md:p-14 min-h-[440px] md:min-h-[500px]" :style="{ background: 'color-mix(in srgb, var(--cc-primary) 38%, white)' }">
          <QuoteIcon class="w-14 h-14 text-white/60" fill="currentColor" stroke-width="0" />
          <div>
            <h2 class="text-[clamp(1.7rem,3.4vw,2.4rem)] font-extrabold leading-[1.1] tracking-[-0.02em]" :style="{ color: 'var(--cc-header)' }">Real Stories from Real Employees</h2>
            <p class="mt-4 text-[15px] leading-relaxed" :style="{ color: 'color-mix(in srgb, var(--cc-header) 78%, white)' }">Get an inside look at our workplace culture, career growth opportunities, and team experiences through the voices of our employees.</p>
          </div>
        </div>
        <!-- Right: one testimonial at a time -->
        <div class="relative flex flex-col bg-white p-9 md:p-14">
          <Transition name="cc-fade" mode="out-in">
            <div :key="tIndex" class="flex-1">
              <div class="flex items-center gap-4">
                <img v-if="activeT.photo" :src="activeT.photo" alt="" class="w-12 h-12 rounded-full object-cover">
                <span v-else class="w-12 h-12 rounded-full grid place-items-center text-white text-[14px] font-bold shrink-0" :style="{ background: 'var(--cc-primary)' }">{{ initials(activeT.name) }}</span>
                <div>
                  <div class="text-[16px] font-bold" :style="{ color: 'var(--cc-header)' }">{{ activeT.name }}</div>
                  <div v-if="activeT.role" class="text-[13px] text-[#8a919c]">{{ activeT.role }}</div>
                </div>
              </div>
              <blockquote class="mt-6 text-[16px] md:text-[17px] leading-relaxed text-[#3f4652]">"{{ activeT.quote }}"</blockquote>
            </div>
          </Transition>
          <!-- controls -->
          <div v-if="testimonials.length > 1" class="mt-8 flex items-center gap-3">
            <button type="button" aria-label="Previous" class="w-10 h-10 rounded-full border border-[#e6e8ec] grid place-items-center transition duration-150 hover:bg-[#f7f8fa] active:scale-[0.9]" @click="goT(-1)"><ChevronLeft class="w-5 h-5" :style="{ color: 'var(--cc-header)' }" /></button>
            <button type="button" aria-label="Next" class="w-10 h-10 rounded-full border border-[#e6e8ec] grid place-items-center transition duration-150 hover:bg-[#f7f8fa] active:scale-[0.9]" @click="goT(1)"><ChevronRight class="w-5 h-5" :style="{ color: 'var(--cc-header)' }" /></button>
            <div class="ml-2 flex gap-2">
              <button v-for="(t, i) in testimonials" :key="i" type="button" :aria-label="`Testimonial ${i + 1}`" class="h-2 rounded-full transition-all" :class="tIndex === i ? 'w-6' : 'w-2 opacity-30 hover:opacity-60'" :style="{ background: 'var(--cc-primary)' }" @click="tIndex = i" />
            </div>
          </div>
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

<style scoped>
/* Infinite marquee: the list is duplicated, so translating the track to -50%
   lands the second copy exactly where the first started → a seamless loop. */
@keyframes cc-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.cc-marquee {
  animation-name: cc-marquee;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}
.cc-marquee:hover { animation-play-state: paused; }
/* Soft fade at both edges. */
.cc-marquee-mask {
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
}
@media (prefers-reduced-motion: reduce) {
  .cc-marquee { animation: none; }
}
/* Testimonial crossfade */
.cc-fade-enter-active, .cc-fade-leave-active { transition: opacity .35s ease; }
.cc-fade-enter-from, .cc-fade-leave-to { opacity: 0; }
</style>
