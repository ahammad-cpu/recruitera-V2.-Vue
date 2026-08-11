<script setup lang="ts">
import { Clock, MapPin } from 'lucide-vue-next'
import { collarColor, employmentTypeColor } from '~/composables/useCareerSiteTagColors'
import type { Job } from '~/types'

const props = defineProps<{ job: Job }>()

const site = useCareerSite()
const { t } = useCareerSiteI18n()
const typeColor = computed(() => employmentTypeColor(props.job.employmentType, site.primaryColor))
const collarTint = computed(() => collarColor(props.job.collar))

function daysAgo(iso: string) {
  const d = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000))
  return d === 0 ? 'Today' : d === 1 ? '1d ago' : `${d}d ago`
}
</script>

<template>
  <NuxtLink
    :to="`/careers/jobs/${props.job.id}`"
    class="block rounded-2xl border border-[var(--brand-preview-border-card)] bg-white p-4 no-underline transition-shadow hover:shadow-md"
  >
    <div class="mb-2 flex flex-wrap gap-1.5">
      <span class="rounded-full px-2.5 py-0.5 text-[10.5px] font-bold" :style="{ background: `${typeColor}18`, color: typeColor }">{{ props.job.employmentType || 'Full-time' }}</span>
      <span class="rounded-full px-2.5 py-0.5 text-[10.5px] font-bold" :style="{ background: `${collarTint}18`, color: collarTint }">{{ props.job.collar === 'white' ? t('filter_job_type_white') : t('filter_job_type_blue') }}</span>
    </div>
    <div class="mb-1 text-[14.5px] font-semibold text-[var(--brand-preview-text-heading)]">{{ props.job.title }}</div>
    <div class="mb-2.5 line-clamp-1 text-[12.5px] leading-[1.5] text-[var(--brand-preview-text-secondary)]">{{ props.job.description }}</div>
    <div class="flex items-center gap-3 border-t border-[var(--brand-preview-surface-alt)] pt-2 text-[11.5px] text-[var(--brand-preview-text-muted)]">
      <span class="inline-flex items-center gap-1"><MapPin :size="11" />{{ props.job.location || 'Remote' }}</span>
      <span class="inline-flex items-center gap-1"><Clock :size="11" />{{ daysAgo(props.job.createdAt) }}</span>
    </div>
  </NuxtLink>
</template>
