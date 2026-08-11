<script setup lang="ts">
// Shared by /careers/opportunities and /careers/internal-opportunities so
// filters/search/list-vs-cards logic isn't duplicated wholesale between them.
import { Clock, Filter, LayoutGrid, List, MapPin, Search, X } from 'lucide-vue-next'
import CareerSiteJobCard from '~/components/careers/CareerSiteJobCard.vue'
import GeneralApplicationCta from '~/components/careers/GeneralApplicationCta.vue'
import { collarColor, employmentTypeColor } from '~/composables/useCareerSiteTagColors'
import { CAREER_SITE_CATEGORIES, CAREER_SITE_CAREER_LEVELS, CAREER_SITE_EMPLOYMENT_TYPES } from '~/composables/useCareerSiteFilters'
import type { Job } from '~/types'

const props = defineProps<{ jobs: Job[], showGeneralApplicationCta?: boolean }>()

const site = useCareerSite()
const { t } = useCareerSiteI18n()
const { data: locationsData } = useLocations()

// Dropdown filters — apply instantly on selection (PRD Feature 5 AC).
const location = ref('')
const category = ref('')
const employmentType = ref('')
const careerLevel = ref('')
const jobType = ref<'' | 'white' | 'blue'>('')

// Search — filters live as the user types, no separate submit step.
const search = ref('')

function locationMatches(jobLocation: string | null, locationId: string) {
  if (!locationId) return true
  const loc = locationsData.value?.data.find(l => l.id === locationId)
  if (!loc || !jobLocation) return false
  if (loc.city.toLowerCase() === 'worldwide') return jobLocation.toLowerCase() === 'remote'
  return jobLocation.toLowerCase() === loc.city.toLowerCase()
}

const filteredJobs = computed(() => props.jobs.filter((j) => {
  if (location.value && !locationMatches(j.location, location.value)) return false
  if (category.value && j.category !== category.value) return false
  if (employmentType.value && j.employmentType !== employmentType.value) return false
  if (careerLevel.value && j.careerLevel !== careerLevel.value) return false
  if (jobType.value && j.collar !== jobType.value) return false
  if (search.value.trim() && !j.title.toLowerCase().includes(search.value.trim().toLowerCase())) return false
  return true
}))

const activeFilterCount = computed(() => [location.value, category.value, employmentType.value, careerLevel.value, jobType.value, search.value.trim()].filter(Boolean).length)

const mobileFiltersOpen = ref(false)
function clearFilters() {
  location.value = ''; category.value = ''; employmentType.value = ''; careerLevel.value = ''; jobType.value = ''
  search.value = ''
}

// List is the default — cards are the alternate view for browsing visually.
const viewMode = ref<'cards' | 'list'>('list')
function daysAgo(iso: string) {
  const d = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000))
  return d === 0 ? 'Today' : d === 1 ? '1d ago' : `${d}d ago`
}
</script>

<template>
  <div class="flex flex-col gap-6 sm:flex-row">
    <!-- Filters panel — desktop -->
    <aside class="hidden w-[220px] shrink-0 flex-col gap-4 sm:flex">
      <div>
        <label class="mb-1 block text-[12px] font-semibold text-[var(--brand-preview-text-label)]">{{ t('filter_location') }}</label>
        <select v-model="location" class="w-full rounded-[9px] border border-[var(--brand-preview-border)] px-2.5 py-2 text-[13px]">
          <option value="">{{ t('filter_choose_location') }}</option>
          <option v-for="loc in locationsData?.data ?? []" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-[12px] font-semibold text-[var(--brand-preview-text-label)]">{{ t('filter_job_type') }}</label>
        <select v-model="jobType" class="w-full rounded-[9px] border border-[var(--brand-preview-border)] px-2.5 py-2 text-[13px]">
          <option value="">{{ t('filter_job_type') }}</option>
          <option value="white">{{ t('filter_job_type_white') }}</option>
          <option value="blue">{{ t('filter_job_type_blue') }}</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-[12px] font-semibold text-[var(--brand-preview-text-label)]">{{ t('filter_category') }}</label>
        <select v-model="category" class="w-full rounded-[9px] border border-[var(--brand-preview-border)] px-2.5 py-2 text-[13px]">
          <option value="">{{ t('filter_choose_category') }}</option>
          <option v-for="c in CAREER_SITE_CATEGORIES" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-[12px] font-semibold text-[var(--brand-preview-text-label)]">{{ t('filter_type') }}</label>
        <select v-model="employmentType" class="w-full rounded-[9px] border border-[var(--brand-preview-border)] px-2.5 py-2 text-[13px]">
          <option value="">{{ t('filter_choose_type') }}</option>
          <option v-for="ty in CAREER_SITE_EMPLOYMENT_TYPES" :key="ty" :value="ty">{{ ty }}</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-[12px] font-semibold text-[var(--brand-preview-text-label)]">{{ t('filter_career_level') }}</label>
        <select v-model="careerLevel" class="w-full rounded-[9px] border border-[var(--brand-preview-border)] px-2.5 py-2 text-[13px]">
          <option value="">{{ t('filter_choose_level') }}</option>
          <option v-for="lv in CAREER_SITE_CAREER_LEVELS" :key="lv" :value="lv">{{ lv }}</option>
        </select>
      </div>
      <button
        type="button"
        class="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors"
        :class="activeFilterCount ? '' : 'text-[var(--brand-preview-text-muted)]'"
        :style="activeFilterCount ? { background: `${site.primaryColor}18`, color: site.primaryColor } : {}"
        @click="clearFilters"
      >
        Clear filters
        <span v-if="activeFilterCount" class="grid size-4 place-items-center rounded-full text-[10px] text-white" :style="{ background: site.primaryColor }">{{ activeFilterCount }}</span>
      </button>
    </aside>

    <!-- Mobile: filter drawer trigger -->
    <button type="button" class="inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--brand-preview-border)] px-3.5 py-2 text-[13px] font-semibold sm:hidden" @click="mobileFiltersOpen = true">
      <Filter :size="14" />Filters
      <span v-if="activeFilterCount" class="grid size-4 place-items-center rounded-full text-[10px] text-white" :style="{ background: site.primaryColor }">{{ activeFilterCount }}</span>
    </button>

    <div class="min-w-0 flex-1">
      <!-- Search — filters live as you type -->
      <div class="mb-4 flex items-center gap-2 rounded-[9px] border border-[var(--brand-preview-border)] px-3 py-2">
        <Search :size="14" class="shrink-0 text-[var(--brand-preview-text-muted)]" />
        <input v-model="search" type="text" :placeholder="t('filter_search_placeholder')" class="min-w-0 flex-1 border-none text-[13.5px] outline-none">
      </div>

      <div class="mb-3.5 flex items-center justify-between">
        <span class="text-[13px] text-[var(--brand-preview-text-muted)]">{{ t('filter_found_jobs', { n: filteredJobs.length }) }}</span>
        <div class="flex gap-0.5 rounded-lg border border-[var(--brand-preview-border)] p-0.5">
          <button type="button" class="grid size-7 place-items-center rounded-md transition-colors" :class="viewMode === 'list' ? 'shadow-sm' : 'text-[var(--brand-preview-text-muted)]'" :style="viewMode === 'list' ? { background: `${site.primaryColor}18`, color: site.primaryColor } : {}" aria-label="Show as list" @click="viewMode = 'list'">
            <List :size="14" />
          </button>
          <button type="button" class="grid size-7 place-items-center rounded-md transition-colors" :class="viewMode === 'cards' ? 'shadow-sm' : 'text-[var(--brand-preview-text-muted)]'" :style="viewMode === 'cards' ? { background: `${site.primaryColor}18`, color: site.primaryColor } : {}" aria-label="Show as cards" @click="viewMode = 'cards'">
            <LayoutGrid :size="14" />
          </button>
        </div>
      </div>

      <template v-if="filteredJobs.length">
        <div v-if="viewMode === 'cards'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CareerSiteJobCard v-for="j in filteredJobs" :key="j.id" :job="j" />
        </div>
        <div v-else class="flex flex-col gap-2.5">
          <NuxtLink
            v-for="j in filteredJobs"
            :key="j.id"
            :to="`/careers/jobs/${j.id}`"
            class="flex flex-col gap-2 rounded-2xl border border-[var(--brand-preview-border-card)] bg-white p-4 no-underline transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0 flex-1">
              <div class="mb-1 flex flex-wrap items-center gap-1.5">
                <span class="text-[14.5px] font-semibold text-[var(--brand-preview-text-heading)]">{{ j.title }}</span>
                <span class="rounded-full px-2 py-0.5 text-[10.5px] font-bold" :style="{ background: `${employmentTypeColor(j.employmentType, site.primaryColor)}18`, color: employmentTypeColor(j.employmentType, site.primaryColor) }">{{ j.employmentType || 'Full-time' }}</span>
                <span class="rounded-full px-2 py-0.5 text-[10.5px] font-bold" :style="{ background: `${collarColor(j.collar)}18`, color: collarColor(j.collar) }">{{ j.collar === 'white' ? t('filter_job_type_white') : t('filter_job_type_blue') }}</span>
              </div>
              <p class="mb-1 line-clamp-2 max-w-[560px] text-[12.5px] leading-[1.5] text-[var(--brand-preview-text-secondary)]">{{ j.description }}</p>
              <div class="flex items-center gap-3 text-[11.5px] text-[var(--brand-preview-text-muted)]">
                <span class="inline-flex items-center gap-1"><MapPin :size="11" />{{ j.location || 'Remote' }}</span>
                <span class="inline-flex items-center gap-1"><Clock :size="11" />{{ daysAgo(j.createdAt) }}</span>
              </div>
            </div>
            <span class="shrink-0 self-start rounded-lg px-4 py-2 text-[12.5px] font-bold text-white sm:self-center" :style="{ background: site.ctaColor }">{{ t('job_view_details') }} →</span>
          </NuxtLink>
        </div>
      </template>
      <div v-else class="rounded-2xl border border-dashed border-[var(--brand-preview-border-card)] px-6 py-14 text-center text-[13.5px] text-[var(--brand-preview-text-muted)]">
        {{ t('filter_no_results') }}
      </div>

      <GeneralApplicationCta v-if="props.showGeneralApplicationCta" />
    </div>
  </div>

  <!-- Mobile filter drawer -->
  <Teleport to="body">
    <div v-if="mobileFiltersOpen" class="fixed inset-0 z-50 flex sm:hidden" @click.self="mobileFiltersOpen = false">
      <div class="absolute inset-0 bg-black/40" @click="mobileFiltersOpen = false" />
      <div class="relative ml-auto flex h-full w-[86%] max-w-[340px] flex-col gap-4 overflow-y-auto bg-white p-5 shadow-2xl">
        <div class="flex items-center justify-between">
          <div class="text-[15px] font-bold">Filters</div>
          <button type="button" class="grid size-8 place-items-center rounded-md hover:bg-black/5" @click="mobileFiltersOpen = false"><X :size="16" /></button>
        </div>
        <select v-model="location" class="w-full rounded-[9px] border border-[var(--brand-preview-border)] px-2.5 py-2 text-[13px]">
          <option value="">{{ t('filter_choose_location') }}</option>
          <option v-for="loc in locationsData?.data ?? []" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
        </select>
        <select v-model="jobType" class="w-full rounded-[9px] border border-[var(--brand-preview-border)] px-2.5 py-2 text-[13px]">
          <option value="">{{ t('filter_job_type') }}</option>
          <option value="white">{{ t('filter_job_type_white') }}</option>
          <option value="blue">{{ t('filter_job_type_blue') }}</option>
        </select>
        <select v-model="category" class="w-full rounded-[9px] border border-[var(--brand-preview-border)] px-2.5 py-2 text-[13px]">
          <option value="">{{ t('filter_choose_category') }}</option>
          <option v-for="c in CAREER_SITE_CATEGORIES" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="employmentType" class="w-full rounded-[9px] border border-[var(--brand-preview-border)] px-2.5 py-2 text-[13px]">
          <option value="">{{ t('filter_choose_type') }}</option>
          <option v-for="ty in CAREER_SITE_EMPLOYMENT_TYPES" :key="ty" :value="ty">{{ ty }}</option>
        </select>
        <select v-model="careerLevel" class="w-full rounded-[9px] border border-[var(--brand-preview-border)] px-2.5 py-2 text-[13px]">
          <option value="">{{ t('filter_choose_level') }}</option>
          <option v-for="lv in CAREER_SITE_CAREER_LEVELS" :key="lv" :value="lv">{{ lv }}</option>
        </select>
        <button type="button" class="mt-2 rounded-xl px-4 py-2.5 text-[13.5px] font-bold text-white" :style="{ background: site.primaryColor }" @click="mobileFiltersOpen = false">Apply filters</button>
        <button type="button" class="text-[12.5px] font-semibold underline" :style="{ color: site.primaryColor }" @click="clearFilters">Clear filters</button>
      </div>
    </div>
  </Teleport>
</template>
