<!--
  Career site — OPPORTUNITIES view. Cover banner + overlapping filter/search
  card + jobs list. Emits open-job(id). Driven by useJobs() + useCareerSite().
-->
<script setup lang="ts">
import { Search, MapPin, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useJobs } from '~/composables/useJobs'
import { useCareerSite } from '~/composables/useCareerSite'
import { ccEmploymentType, ccWorkLabel, ccBlurb } from '~/utils/careerJob'

const emit = defineEmits<{ 'open-job': [id: string] }>()

const { jobs } = useJobs()
const { coverType, coverUrl } = useCareerSite()
const isImageCover = computed(() => coverType.value === 'image' && !!coverUrl.value)

const openRoles = computed(() => jobs.value.filter(j => j.status === 'published'))

const query = ref('')
const fLocation = ref('')
const fCollar = ref('')
const fDept = ref('')
const fWork = ref('')

const locations = computed(() => [...new Set(openRoles.value.map(j => j.location).filter(Boolean))] as string[])
const departments = computed(() => [...new Set(openRoles.value.map(j => j.department).filter(Boolean))] as string[])

const results = computed(() => openRoles.value.filter((j) => {
  const q = query.value.trim().toLowerCase()
  return (!q || j.title.toLowerCase().includes(q))
    && (!fLocation.value || j.location === fLocation.value)
    && (!fCollar.value || j.collar === fCollar.value)
    && (!fDept.value || j.department === fDept.value)
    && (!fWork.value || j.workModel === fWork.value)
}))

function clearFilters() { query.value = ''; fLocation.value = ''; fCollar.value = ''; fDept.value = ''; fWork.value = '' }
const selCls = 'w-full h-11 px-3 rounded-[10px] border border-[#e3e6ea] bg-white text-[14px] text-[#374151] outline-none transition focus:border-[color:var(--cc-primary)]'

// Pagination — keeps the list fast/readable for hundreds of roles.
const PAGE_SIZE = 12
const page = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(results.value.length / PAGE_SIZE)))
const pagedResults = computed(() => results.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
watch(results, () => { page.value = 1 })
// Windowed page numbers: 1 … cur-1 cur cur+1 … last (gaps become "…")
const pageNumbers = computed(() => {
  const total = totalPages.value, cur = page.value
  const set = new Set<number>([1, 2, total, total - 1, cur, cur - 1, cur + 1])
  return [...set].filter(n => n >= 1 && n <= total).sort((a, b) => a - b)
})
function goPage(p: number) {
  page.value = Math.min(totalPages.value, Math.max(1, p))
  if (import.meta.client) document.getElementById('jobs-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div>
    <!-- Cover banner: framed image (blurred fill) or gradient -->
    <section v-if="isImageCover" class="relative overflow-hidden">
      <img :src="coverUrl" alt="" aria-hidden="true" class="absolute inset-0 h-full w-full object-cover scale-125 blur-2xl">
      <div class="relative mx-auto max-w-[1520px] px-2 pt-[86px]">
        <img :src="coverUrl" alt="" class="block w-full h-auto rounded-t-[24px] shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
      </div>
    </section>
    <section v-else class="relative pt-28 pb-16 md:pt-32" style="background:linear-gradient(135deg, var(--cc-primary), color-mix(in srgb, var(--cc-primary) 45%, #0b1220))">
      <div class="mx-auto max-w-[1160px] px-6">
        <h1 class="text-[clamp(2rem,4.5vw,3rem)] font-extrabold tracking-[-0.02em] text-white">Job Opportunities</h1>
      </div>
    </section>

    <!-- Overlapping content -->
    <div class="relative z-10 mx-auto max-w-[1160px] px-6 pb-20" :class="isImageCover ? '-mt-10' : '-mt-10'">
      <div class="grid gap-6 lg:grid-cols-[300px_1fr] items-start">
        <!-- Filters card -->
        <aside class="rounded-[20px] bg-white border border-[#eceef1] shadow-[0_18px_50px_rgba(15,23,42,0.10)] p-6">
          <h3 class="text-[18px] font-bold" :style="{ color: 'var(--cc-header)' }">Filters</h3>
          <div class="mt-5 flex flex-col gap-4">
            <div>
              <label class="block text-[12.5px] font-semibold mb-1.5 text-[#6b7280]">Department</label>
              <select v-model="fDept" :class="selCls"><option value="">Choose Department</option><option v-for="d in departments" :key="d" :value="d">{{ d }}</option></select>
            </div>
            <div>
              <label class="block text-[12.5px] font-semibold mb-1.5 text-[#6b7280]">Work Type</label>
              <select v-model="fWork" :class="selCls"><option value="">Choose Work Type</option><option value="on-site">On-site</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option></select>
            </div>
            <div>
              <label class="block text-[12.5px] font-semibold mb-1.5 text-[#6b7280]">Job Type</label>
              <select v-model="fCollar" :class="selCls"><option value="">Choose Job Type</option><option value="white">White Collar</option><option value="blue">Blue Collar</option></select>
            </div>
          </div>
          <button type="button" class="mt-5 text-[13.5px] font-semibold transition hover:opacity-70" :style="{ color: 'var(--cc-primary)' }" @click="clearFilters">Clear filters</button>
        </aside>

        <!-- Right column: search bar + jobs -->
        <div>
          <div class="rounded-[20px] bg-white border border-[#eceef1] shadow-[0_18px_50px_rgba(15,23,42,0.10)] p-4 md:p-5 grid gap-3 sm:grid-cols-[1fr_minmax(0,220px)_auto] items-end">
            <div>
              <label class="block text-[12.5px] font-semibold mb-1.5 text-[#6b7280]">Search</label>
              <div class="relative">
                <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa1ab]" stroke-width="1.8" />
                <input v-model="query" type="text" placeholder="Search for Job Title" class="w-full h-11 pl-10 pr-3 rounded-[10px] border border-[#e3e6ea] bg-white text-[14px] outline-none transition focus:border-[color:var(--cc-primary)] placeholder:text-[#9aa1ab]">
              </div>
            </div>
            <div>
              <label class="block text-[12.5px] font-semibold mb-1.5 text-[#6b7280]">Location</label>
              <select v-model="fLocation" :class="selCls"><option value="">Choose Location</option><option v-for="l in locations" :key="l" :value="l">{{ l }}</option></select>
            </div>
            <button type="button" class="h-11 px-7 rounded-[10px] text-white text-[14px] font-bold transition duration-150 hover:brightness-110 active:scale-[0.97]" :style="{ background: 'var(--cc-primary)' }">Find</button>
          </div>

          <!-- Jobs -->
          <div id="jobs-top" class="mt-8 scroll-mt-24">
            <h2 class="text-[22px] font-extrabold tracking-[-0.01em]" :style="{ color: 'var(--cc-header)' }">Jobs</h2>
            <div class="mt-1 text-[14px] text-[#6b7280]">Found {{ results.length }} {{ results.length === 1 ? 'Job' : 'Jobs' }}</div>
            <div class="mt-4 text-[13px] font-medium text-[#9aa1ac]">Search Results</div>

            <div class="mt-4 flex flex-col gap-4">
              <button v-for="job in pagedResults" :key="job.id" type="button"
                class="block text-left rounded-[16px] border border-[#eceef1] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] hover:border-[color:var(--cc-primary)] active:scale-[0.995]" @click="emit('open-job', job.id)">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <h3 class="text-[17px] font-bold" :style="{ color: 'var(--cc-primary)' }">{{ job.title }}</h3>
                    <p class="mt-2 text-[13.5px] leading-relaxed text-[#6b7280] line-clamp-2 max-w-[70ch]">{{ ccBlurb(job) }}</p>
                    <!-- Full-time · On-site · location, all on one line -->
                    <div class="mt-3 flex flex-wrap items-center gap-2.5">
                      <span class="inline-flex items-center h-6 px-2.5 rounded-full text-[11.5px] font-bold" :style="{ background: 'color-mix(in srgb, var(--cc-primary) 12%, white)', color: 'var(--cc-primary)' }">{{ ccEmploymentType(job) }}</span>
                      <span class="inline-flex items-center h-6 px-2.5 rounded-full border border-[#e6e8ec] text-[11.5px] font-semibold text-[#5b6472]">{{ ccWorkLabel(job.workModel) }}</span>
                      <span v-if="job.location" class="inline-flex items-center gap-1.5 text-[12.5px] text-[#8a919c]"><MapPin class="w-3.5 h-3.5" stroke-width="1.8" />{{ job.location }}</span>
                    </div>
                  </div>
                  <span class="shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-[11px] text-white text-[13.5px] font-semibold" :style="{ background: 'var(--cc-primary)' }">View Details <ArrowRight class="w-4 h-4" stroke-width="2" /></span>
                </div>
              </button>

              <div v-if="!results.length" class="rounded-[16px] border border-dashed border-[#dfe3e8] bg-[#f7f8fa] px-6 py-16 text-center">
                <div class="text-[15px] font-bold" :style="{ color: 'var(--cc-header)' }">No jobs match your filters</div>
                <p class="mt-1 text-[13.5px] text-[#8a919c]">Try clearing a filter — new roles open often.</p>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="mt-8 flex items-center justify-center gap-1.5">
              <button type="button" :disabled="page === 1" class="w-10 h-10 rounded-[10px] border border-[#e3e6ea] grid place-items-center transition disabled:opacity-40 hover:bg-[#f7f8fa] active:scale-95" @click="goPage(page - 1)"><ChevronLeft class="w-[18px] h-[18px]" :style="{ color: 'var(--cc-header)' }" /></button>
              <template v-for="(n, i) in pageNumbers" :key="n">
                <span v-if="i > 0 && n - (pageNumbers[i - 1] ?? 0) > 1" class="px-1 text-[#9aa1ac]">…</span>
                <button type="button" class="min-w-10 h-10 px-3 rounded-[10px] text-[14px] font-semibold transition active:scale-95" :class="n === page ? 'text-white' : 'border border-[#e3e6ea] text-[#4b5563] hover:bg-[#f7f8fa]'" :style="n === page ? { background: 'var(--cc-primary)' } : {}" @click="goPage(n)">{{ n }}</button>
              </template>
              <button type="button" :disabled="page === totalPages" class="w-10 h-10 rounded-[10px] border border-[#e3e6ea] grid place-items-center transition disabled:opacity-40 hover:bg-[#f7f8fa] active:scale-95" @click="goPage(page + 1)"><ChevronRight class="w-[18px] h-[18px]" :style="{ color: 'var(--cc-header)' }" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- General application CTA -->
    <CareerApplyCta />
  </div>
</template>
