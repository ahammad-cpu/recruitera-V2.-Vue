<!--
  Career site — OPPORTUNITIES view (in-page). Filters + search + list/grid.
  Emits open-job(id). Driven by useJobs() (published) + useCareerSite() theme.
-->
<script setup lang="ts">
import { Search, MapPin, Clock, ArrowRight, List, LayoutGrid } from 'lucide-vue-next'
import { useJobs } from '~/composables/useJobs'
import { ccEmploymentType, ccWorkLabel, ccDaysAgo, ccBlurb } from '~/utils/careerJob'

const emit = defineEmits<{ 'open-job': [id: string] }>()

const { jobs } = useJobs()
const openRoles = computed(() => jobs.value.filter(j => j.status === 'published'))

const query = ref('')
const fLocation = ref('')
const fCollar = ref('')
const fDept = ref('')
const fWork = ref('')
const view = ref<'list' | 'grid'>('list')

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
const selCls = 'w-full h-11 px-3 rounded-[10px] border border-[#e3e6ea] bg-white text-[14px] text-[#374151] outline-none focus:border-[color:var(--cc-primary)]'
</script>

<template>
  <div class="mx-auto max-w-[1160px] px-6 py-12">
    <h1 class="text-[clamp(1.9rem,4vw,2.6rem)] font-extrabold tracking-[-0.02em]" :style="{ color: 'var(--cc-header)' }">Opportunities</h1>

    <div class="mt-8 grid gap-8 lg:grid-cols-[260px_1fr] items-start">
      <!-- Filters -->
      <aside class="flex flex-col gap-5">
        <div>
          <label class="block text-[13px] font-semibold mb-1.5" :style="{ color: 'var(--cc-header)' }">Location</label>
          <select v-model="fLocation" :class="selCls"><option value="">Choose Location</option><option v-for="l in locations" :key="l" :value="l">{{ l }}</option></select>
        </div>
        <div>
          <label class="block text-[13px] font-semibold mb-1.5" :style="{ color: 'var(--cc-header)' }">Job Type</label>
          <select v-model="fCollar" :class="selCls"><option value="">All types</option><option value="white">White Collar</option><option value="blue">Blue Collar</option></select>
        </div>
        <div>
          <label class="block text-[13px] font-semibold mb-1.5" :style="{ color: 'var(--cc-header)' }">Category</label>
          <select v-model="fDept" :class="selCls"><option value="">Choose Category</option><option v-for="d in departments" :key="d" :value="d">{{ d }}</option></select>
        </div>
        <div>
          <label class="block text-[13px] font-semibold mb-1.5" :style="{ color: 'var(--cc-header)' }">Type</label>
          <select v-model="fWork" :class="selCls"><option value="">Choose Type</option><option value="on-site">On-site</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option></select>
        </div>
        <button type="button" class="text-[13.5px] font-semibold text-left transition hover:opacity-70" :style="{ color: 'var(--cc-primary)' }" @click="clearFilters">Clear filters</button>
      </aside>

      <!-- Results -->
      <div>
        <div class="relative">
          <Search class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa1ab]" stroke-width="1.8" />
          <input v-model="query" type="text" placeholder="Search for Job Title" class="w-full h-13 py-3.5 pl-11 pr-4 rounded-[12px] border border-[#e3e6ea] bg-white text-[14.5px] outline-none focus:border-[color:var(--cc-primary)] placeholder:text-[#9aa1ab]">
        </div>

        <div class="mt-5 flex items-center justify-between">
          <span class="text-[14px] text-[#6b7280]">Found {{ results.length }} {{ results.length === 1 ? 'Job' : 'Jobs' }}</span>
          <div class="inline-flex items-center p-0.5 rounded-[9px] bg-[#f1f3f5]">
            <button type="button" class="w-8 h-8 rounded-[7px] grid place-items-center transition" :class="view === 'list' ? 'bg-white shadow-sm' : 'text-[#8a919c]'" :style="view === 'list' ? { color: 'var(--cc-primary)' } : {}" @click="view = 'list'"><List class="w-4 h-4" stroke-width="2" /></button>
            <button type="button" class="w-8 h-8 rounded-[7px] grid place-items-center transition" :class="view === 'grid' ? 'bg-white shadow-sm' : 'text-[#8a919c]'" :style="view === 'grid' ? { color: 'var(--cc-primary)' } : {}" @click="view = 'grid'"><LayoutGrid class="w-4 h-4" stroke-width="2" /></button>
          </div>
        </div>

        <div class="mt-5" :class="view === 'grid' ? 'grid gap-4 sm:grid-cols-2' : 'flex flex-col gap-4'">
          <button v-for="job in results" :key="job.id" type="button"
            class="block text-left rounded-[16px] border border-[#eceef1] bg-white p-5 transition hover:shadow-[0_16px_40px_rgba(15,23,42,0.07)]" @click="emit('open-job', job.id)">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-[17px] font-bold" :style="{ color: 'var(--cc-header)' }">{{ job.title }}</h3>
                  <span class="inline-flex items-center h-6 px-2.5 rounded-full text-[11.5px] font-bold" :style="{ background: 'color-mix(in srgb, var(--cc-primary) 12%, white)', color: 'var(--cc-primary)' }">{{ ccEmploymentType(job) }}</span>
                  <span class="inline-flex items-center h-6 px-2.5 rounded-full text-[11.5px] font-bold" :class="job.collar === 'blue' ? 'bg-[#fdecec] text-[#b02a2a]' : 'bg-[#eef2ff] text-[#3b5bdb]'">{{ job.collar === 'blue' ? 'Blue Collar' : 'White Collar' }}</span>
                </div>
                <p class="mt-2 text-[13.5px] leading-relaxed text-[#6b7280] line-clamp-2 max-w-[70ch]">{{ ccBlurb(job) }}</p>
                <div class="mt-3 flex items-center gap-4 text-[12.5px] text-[#8a919c]">
                  <span v-if="job.location" class="inline-flex items-center gap-1.5"><MapPin class="w-3.5 h-3.5" stroke-width="1.8" />{{ job.location }}</span>
                  <span class="inline-flex items-center gap-1.5"><Clock class="w-3.5 h-3.5" stroke-width="1.8" />{{ ccDaysAgo(job.createdAt) }}</span>
                  <span>{{ ccWorkLabel(job.workModel) }}</span>
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
      </div>
    </div>
  </div>
</template>
