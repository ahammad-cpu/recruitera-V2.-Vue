<script setup lang="ts">
// Inline (not a popup) — application forms can run long, and a modal makes
// them cramped. Shared by public Apply and Internal Application (PRD: "no
// new form, same form schema" for internal applicants — only the resulting
// tag/source differs). Writes a real candidate via findOrCreateCandidate —
// same mechanism General Application uses.
import { Check, Sparkles, Upload } from 'lucide-vue-next'
import { findOrCreateCandidate } from '~/mocks/handlers/candidates.handlers'
import { PHONE_COUNTRIES } from '~/composables/useCareerSitePhoneCodes'
import type { Job } from '~/types'

const props = defineProps<{ job: Job, internal?: boolean }>()
const emit = defineEmits<{ submitted: [] }>()

const site = useCareerSite()
const { t } = useCareerSiteI18n()
const portal = useEmployeePortalStore()

const fullName = ref('')
const gender = ref('')
const email = ref(props.internal && portal.email ? portal.email : '')
const phoneDial = ref(PHONE_COUNTRIES[0]!.dial)
const phone = ref('')
const resumeName = ref('')
const profilePicName = ref('')
const errors = reactive<{ fullName?: string, email?: string }>({})
const submitted = ref(false)

// Illustrative — recruiters can attach custom screening questions to a job
// (Jobs → Application tab in the wizard), but that step isn't wired to any
// per-job data yet (see the audit in this session), so these demo the
// candidate-facing rendering rather than reading a specific job's real set.
const SCREENING_QUESTIONS = [
  { id: 'sq1', text: 'Are you legally authorized to work in this location?', type: 'yesno' as const },
  { id: 'sq2', text: 'Which of these best describes your strongest area?', type: 'single-choice' as const, options: ['Execution', 'Strategy', 'People management', 'Technical depth'] },
  { id: 'sq3', text: 'What is your earliest available start date?', type: 'text' as const },
]
const screeningAnswers = reactive<Record<string, string>>({})

function onResume(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  resumeName.value = file?.name ?? ''
}
function onProfilePic(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  profilePicName.value = file?.name ?? ''
}
function submit() {
  errors.fullName = fullName.value.trim() ? undefined : t('field_required')
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())
  errors.email = !email.value.trim() ? t('field_required') : !emailOk ? t('field_invalid_email') : undefined
  if (errors.fullName || errors.email) return
  findOrCreateCandidate({
    name: fullName.value,
    source: props.internal ? 'Internal Application' : 'Careers site',
    tags: props.internal ? ['Internal'] : [],
    jobTitle: props.job.title,
    jobStatus: props.job.status,
  })
  submitted.value = true
  emit('submitted')
}
</script>

<template>
  <div :style="{ fontFamily: `${site.font}, system-ui, sans-serif` }">
    <template v-if="!submitted">
      <!-- Autofill — no OCR/parsing backend in this prototype, so this just feeds the same resume field below. -->
      <div class="mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-[var(--brand-preview-border-card)] p-5 sm:flex-row sm:items-center">
        <div>
          <div class="mb-1 flex items-center gap-1.5 text-[14.5px] font-bold text-[var(--brand-preview-text-heading)]">
            <Sparkles :size="15" :style="{ color: site.primaryColor }" />Autofill Application
          </div>
          <p class="text-[12.5px] text-[var(--brand-preview-text-muted)]">Quickly fill your application from your resume to save time.</p>
        </div>
        <label class="shrink-0 cursor-pointer rounded-xl border-[1.5px] px-4 py-2 text-[13px] font-bold" :style="{ borderColor: site.primaryColor, color: site.primaryColor }">
          {{ resumeName || 'Import Your Resume' }}
          <input type="file" accept=".pdf,.doc,.docx" class="hidden" @change="onResume">
        </label>
      </div>

      <h2 class="mb-3.5 text-[15px] font-bold text-[var(--brand-preview-text-heading)]">Personal Information</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1.5 block text-[13px] font-semibold text-[var(--brand-preview-text-label)]">Full Name *</span>
          <input v-model="fullName" type="text" placeholder="Write Full Name" class="w-full rounded-[9px] border px-3 py-2.5 text-[14px] outline-none" :style="{ borderColor: errors.fullName ? 'var(--brand-danger)' : 'var(--brand-preview-border)' }">
          <span v-if="errors.fullName" class="mt-1 block text-[12px] text-[var(--brand-danger)]">{{ errors.fullName }}</span>
        </label>
        <label class="block">
          <span class="mb-1.5 block text-[13px] font-semibold text-[var(--brand-preview-text-label)]">Gender <span class="font-normal text-[var(--brand-preview-text-muted)]">(Optional)</span></span>
          <select v-model="gender" class="w-full rounded-[9px] border border-[var(--brand-preview-border)] px-3 py-2.5 text-[14px] outline-none">
            <option value="">Choose an option…</option>
            <option>Female</option>
            <option>Male</option>
            <option>Prefer not to say</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-1.5 block text-[13px] font-semibold text-[var(--brand-preview-text-label)]">Email *</span>
          <input v-model="email" type="email" placeholder="Write Email" class="w-full rounded-[9px] border px-3 py-2.5 text-[14px] outline-none" :style="{ borderColor: errors.email ? 'var(--brand-danger)' : 'var(--brand-preview-border)' }">
          <span v-if="errors.email" class="mt-1 block text-[12px] text-[var(--brand-danger)]">{{ errors.email }}</span>
        </label>
        <label class="block">
          <span class="mb-1.5 block text-[13px] font-semibold text-[var(--brand-preview-text-label)]">Phone Number</span>
          <div class="flex items-center rounded-[9px] border border-[var(--brand-preview-border)] focus-within:border-current">
            <select v-model="phoneDial" class="shrink-0 rounded-l-[9px] border-r border-[var(--brand-preview-border)] bg-[var(--brand-preview-surface-section)] py-2.5 pl-2.5 pr-1 text-[13px] outline-none">
              <option v-for="c in PHONE_COUNTRIES" :key="c.dial + c.name" :value="c.dial">{{ c.flag }} {{ c.dial }}</option>
            </select>
            <input v-model="phone" type="tel" placeholder="Write Phone Number" class="min-w-0 flex-1 rounded-r-[9px] border-none px-3 py-2.5 text-[14px] outline-none">
          </div>
        </label>
      </div>

      <label class="mt-4 mb-4 flex cursor-pointer flex-col items-center gap-1.5 rounded-[9px] border-[1.5px] border-dashed border-[var(--brand-preview-border)] px-4 py-6 text-center">
        <Upload :size="18" class="text-[var(--brand-preview-text-muted)]" />
        <span class="text-[13px] font-semibold" :style="{ color: site.primaryColor }">{{ resumeName || 'Upload a file' }} <span class="font-normal text-[var(--brand-preview-text-muted)]">or drag and drop</span></span>
        <span class="text-[11.5px] text-[var(--brand-preview-text-muted)]">PDF, Word up to 10MB</span>
        <input type="file" accept=".pdf,.doc,.docx" class="hidden" @change="onResume">
      </label>

      <label class="mb-6 block">
        <span class="mb-1.5 block text-[13px] font-semibold text-[var(--brand-preview-text-label)]">Profile Picture <span class="font-normal text-[var(--brand-preview-text-muted)]">(Optional)</span></span>
        <label class="flex cursor-pointer items-center gap-2 rounded-[9px] border-[1.5px] border-dashed border-[var(--brand-preview-border)] px-4 py-3 text-[13px] font-semibold" :style="{ color: site.primaryColor }">
          <Upload :size="15" />{{ profilePicName || 'Upload a photo' }}
          <input type="file" accept="image/*" class="hidden" @change="onProfilePic">
        </label>
      </label>

      <h2 class="mb-1 text-[15px] font-bold text-[var(--brand-preview-text-heading)]">Screening Questions</h2>
      <p class="mb-3.5 text-[12px] italic text-[var(--brand-preview-text-muted)]">Set by the hiring team for this role — shown here as a demo.</p>
      <div class="mb-6 flex flex-col gap-4">
        <label v-for="q in SCREENING_QUESTIONS" :key="q.id" class="block">
          <span class="mb-1.5 block text-[13px] font-semibold text-[var(--brand-preview-text-label)]">{{ q.text }}</span>
          <div v-if="q.type === 'yesno'" class="flex gap-2">
            <button
              v-for="opt in ['Yes', 'No']"
              :key="opt"
              type="button"
              class="rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-semibold"
              :class="screeningAnswers[q.id] === opt ? 'text-white' : 'text-[var(--brand-preview-text-label)]'"
              :style="screeningAnswers[q.id] === opt ? { background: site.primaryColor, borderColor: site.primaryColor } : { borderColor: 'var(--brand-preview-border)' }"
              @click="screeningAnswers[q.id] = opt"
            >{{ opt }}</button>
          </div>
          <select v-else-if="q.type === 'single-choice'" v-model="screeningAnswers[q.id]" class="w-full rounded-[9px] border border-[var(--brand-preview-border)] px-3 py-2.5 text-[14px] outline-none">
            <option value="">Choose an option…</option>
            <option v-for="opt in q.options" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <input v-else v-model="screeningAnswers[q.id]" type="text" class="w-full rounded-[9px] border border-[var(--brand-preview-border)] px-3 py-2.5 text-[14px] outline-none">
        </label>
      </div>

      <button type="button" class="w-full rounded-xl px-4 py-3 text-[14px] font-bold text-white sm:w-auto" :style="{ background: site.ctaColor }" @click="submit">
        {{ t('job_apply') }}
      </button>
    </template>

    <div v-else class="rounded-2xl border border-[var(--brand-preview-border-card)] px-6 py-14 text-center">
      <div class="mx-auto mb-4 grid size-14 place-items-center rounded-full" style="background:var(--brand-status-approved-bg)">
        <Check :size="26" style="color:var(--brand-status-approved-text)" />
      </div>
      <div class="mb-2 text-[16px] font-bold" :style="{ color: site.headerColor }">{{ t('general_app_success') }}</div>
      <p class="text-[13px] text-[var(--brand-preview-text-muted)]">{{ fullName }}, we'll be in touch about {{ props.job.title }}.</p>
    </div>
  </div>
</template>
