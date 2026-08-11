<script setup lang="ts">
import { Check, Upload } from 'lucide-vue-next'
import CareerSiteGate from '~/components/careers/CareerSiteGate.vue'
import CareerSiteHeader from '~/components/careers/CareerSiteHeader.vue'
import CareerSiteFooter from '~/components/careers/CareerSiteFooter.vue'
import { addGeneralApplication } from '~/mocks/handlers/talent-pools.handlers'

definePageMeta({ layout: false })

const site = useCareerSite()
const { t } = useCareerSiteI18n()

const fullName = ref('')
const email = ref('')
const jobTitle = ref('')
const resumeName = ref('')
const errors = reactive<{ fullName?: string, email?: string, jobTitle?: string, cv?: string }>({})
const submitting = ref(false)
const submitted = ref(false)
const submitError = ref('')

const heroBackground = computed(() => `linear-gradient(135deg, ${site.primaryColor} 0%, ${site.headerColor} 130%)`)

function onResume(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  resumeName.value = file?.name ?? ''
}

async function submit() {
  errors.fullName = fullName.value.trim() ? undefined : t('field_required')
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())
  errors.email = !email.value.trim() ? t('field_required') : !emailOk ? t('field_invalid_email') : undefined
  errors.jobTitle = jobTitle.value.trim() ? undefined : t('field_required')
  errors.cv = resumeName.value ? undefined : t('field_required')
  if (errors.fullName || errors.email || errors.jobTitle || errors.cv) return

  submitting.value = true
  submitError.value = ''
  try {
    addGeneralApplication({ fullName: fullName.value, email: email.value, jobTitle: jobTitle.value })
    submitted.value = true
  }
  catch {
    submitError.value = 'Unable to submit application. Please try again.'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <CareerSiteGate>
    <div class="min-h-screen" :style="{ background: 'var(--brand-preview-surface-section)', fontFamily: `${site.font}, system-ui, sans-serif` }">
      <CareerSiteHeader />

      <div class="mx-auto max-w-[560px] px-6 py-12">
        <template v-if="!submitted">
          <div class="mb-6 rounded-2xl p-7 text-white" :style="{ background: heroBackground }">
            <h1 class="mb-2 text-[24px] font-extrabold leading-tight">{{ t('general_app_title') }}</h1>
            <p class="text-[13.5px] leading-relaxed text-white/85">{{ t('general_app_cta') }}</p>
          </div>

          <div class="rounded-2xl border border-[var(--brand-preview-border-card)] bg-white p-7 shadow-sm">
          <label class="mb-4 block">
            <span class="mb-1.5 block text-[13px] font-semibold text-[var(--brand-preview-text-label)]">{{ t('general_app_full_name') }} *</span>
            <input v-model="fullName" type="text" class="w-full rounded-[9px] border px-3 py-2.5 text-[14px] outline-none" :style="{ borderColor: errors.fullName ? 'var(--brand-danger)' : 'var(--brand-preview-border)' }">
            <span v-if="errors.fullName" class="mt-1 block text-[12px] text-[var(--brand-danger)]">{{ errors.fullName }}</span>
          </label>
          <label class="mb-4 block">
            <span class="mb-1.5 block text-[13px] font-semibold text-[var(--brand-preview-text-label)]">{{ t('general_app_email') }} *</span>
            <input v-model="email" type="email" class="w-full rounded-[9px] border px-3 py-2.5 text-[14px] outline-none" :style="{ borderColor: errors.email ? 'var(--brand-danger)' : 'var(--brand-preview-border)' }">
            <span v-if="errors.email" class="mt-1 block text-[12px] text-[var(--brand-danger)]">{{ errors.email }}</span>
          </label>
          <label class="mb-4 block">
            <span class="mb-1.5 block text-[13px] font-semibold text-[var(--brand-preview-text-label)]">{{ t('general_app_job_title') }} *</span>
            <input v-model="jobTitle" type="text" placeholder="e.g. Product Manager" class="w-full rounded-[9px] border px-3 py-2.5 text-[14px] outline-none" :style="{ borderColor: errors.jobTitle ? 'var(--brand-danger)' : 'var(--brand-preview-border)' }">
            <span v-if="errors.jobTitle" class="mt-1 block text-[12px] text-[var(--brand-danger)]">{{ errors.jobTitle }}</span>
          </label>
          <label class="mb-5 flex cursor-pointer flex-col items-center gap-1.5 rounded-[9px] border-[1.5px] border-dashed px-4 py-6 text-center" :style="{ borderColor: errors.cv ? 'var(--brand-danger)' : 'var(--brand-preview-border)' }">
            <Upload :size="20" class="text-[var(--brand-preview-text-muted)]" />
            <span class="text-[13px] font-semibold" :style="{ color: site.primaryColor }">{{ resumeName || t('general_app_cv') }}</span>
            <span class="text-[11.5px] text-[var(--brand-preview-text-muted)]">PDF, Word up to 10MB</span>
            <input type="file" accept=".pdf,.doc,.docx" class="hidden" @change="onResume">
          </label>
          <span v-if="errors.cv" class="-mt-4 mb-4 block text-[12px] text-[var(--brand-danger)]">{{ errors.cv }}</span>

          <p v-if="submitError" class="mb-3 text-[12.5px] text-[var(--brand-danger)]">{{ submitError }}</p>

          <button type="button" class="w-full rounded-xl px-4 py-3 text-[14px] font-bold text-white disabled:opacity-60" :style="{ background: site.ctaColor }" :disabled="submitting" @click="submit">
            {{ t('general_app_submit') }}
          </button>
          </div>
        </template>

        <div v-else class="rounded-2xl border border-[var(--brand-preview-border-card)] bg-white px-6 py-14 text-center shadow-sm">
          <div class="mx-auto mb-4 grid size-14 place-items-center rounded-full" style="background:var(--brand-status-approved-bg)">
            <Check :size="26" style="color:var(--brand-status-approved-text)" />
          </div>
          <div class="mb-2 text-[18px] font-bold" :style="{ color: site.headerColor }">{{ t('general_app_success') }}</div>
          <p class="mb-6 text-[13.5px] text-[var(--brand-preview-text-muted)]">Thanks, {{ fullName }} — we'll reach out if a matching role opens up.</p>
          <NuxtLink to="/careers" class="inline-block rounded-xl border-[1.5px] px-5 py-2.5 text-[13px] font-bold no-underline" :style="{ borderColor: site.primaryColor, color: site.primaryColor }">{{ t('nav_home') }}</NuxtLink>
        </div>
      </div>

      <CareerSiteFooter />
    </div>
  </CareerSiteGate>
</template>
