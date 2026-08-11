<script setup lang="ts">
import { Mail, X } from 'lucide-vue-next'

const props = defineProps<{ fullWidth?: boolean, solid?: boolean, label?: string }>()
const emit = defineEmits<{ click: [] }>()

const site = useCareerSite()
const { t } = useCareerSiteI18n()
const { state: hub, isCompanyDomain } = useEmployeeHub()
const portal = useEmployeePortalStore()

const open = ref(false)
const step = ref<'form' | 'sent'>('form')
const localPart = ref('')
const error = ref('')
const domain = computed(() => hub.domains[0] ?? '')

function openModal() {
  step.value = 'form'
  localPart.value = ''
  error.value = ''
  open.value = true
  emit('click')
}
function closeModal() {
  open.value = false
}
function sendLink() {
  const email = `${localPart.value.trim()}@${domain.value}`
  if (!localPart.value.trim()) { error.value = t('field_required'); return }
  if (!isCompanyDomain(email)) { error.value = t('for_employees_invalid_domain'); return }
  error.value = ''
  step.value = 'sent'
}
function demoLogin() {
  const email = localPart.value.trim() ? `${localPart.value.trim()}@${domain.value}` : `employee@${domain.value || 'company.com'}`
  portal.verify(email)
  open.value = false
  navigateTo('/careers')
}
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13.5px] font-semibold"
    :class="[props.fullWidth ? 'w-full justify-start px-2' : '', props.solid ? 'shadow-sm' : 'border']"
    :style="props.solid
      ? { background: site.ctaColor, color: 'white' }
      : { color: site.primaryColor, borderColor: props.fullWidth ? 'transparent' : site.primaryColor }"
    @click="openModal"
  >
    {{ props.label ?? t('nav_for_employees') }}
  </button>

  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" @click.self="closeModal">
      <div class="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl" :style="{ fontFamily: `${site.font}, system-ui, sans-serif` }">
        <div class="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <div class="text-[15px] font-bold" :style="{ color: site.headerColor }">{{ t('for_employees_title') }}</div>
          <button type="button" class="grid size-7 place-items-center rounded-md hover:bg-black/5" aria-label="Close" @click="closeModal">
            <X :size="16" />
          </button>
        </div>

        <div class="px-5 py-5">
          <template v-if="step === 'form'">
            <p class="mb-4 text-[13px] leading-relaxed text-[var(--brand-preview-text-secondary)]">{{ t('for_employees_subtitle') }}</p>

            <div class="mb-1.5 flex items-center rounded-[9px] border-[1.5px] px-3 py-2.5" :style="{ borderColor: error ? 'var(--brand-danger)' : 'rgba(0,0,0,0.12)' }">
              <input v-model="localPart" type="text" placeholder="you" class="min-w-0 flex-1 border-none bg-transparent text-[14px] outline-none" @keydown.enter="sendLink">
              <span class="shrink-0 text-[14px] text-[var(--brand-preview-text-muted)]">@{{ domain || 'company.com' }}</span>
            </div>
            <p v-if="error" class="mb-2 text-[12px] text-[var(--brand-danger)]">{{ error }}</p>

            <button type="button" class="mt-3 w-full rounded-xl px-4 py-2.5 text-[13.5px] font-bold text-white" :style="{ background: site.primaryColor }" @click="sendLink">
              <Mail :size="14" class="mr-1.5 inline-block" :stroke-width="2" />{{ t('for_employees_send_link') }}
            </button>

            <div class="my-3 flex items-center gap-2 text-[11px] uppercase tracking-wide text-[var(--brand-preview-text-muted)]">
              <span class="h-px flex-1 bg-black/10" />or<span class="h-px flex-1 bg-black/10" />
            </div>

            <button type="button" class="w-full rounded-xl border-[1.5px] px-4 py-2.5 text-[13.5px] font-bold" :style="{ borderColor: site.primaryColor, color: site.primaryColor }" @click="demoLogin">
              {{ t('for_employees_demo') }}
            </button>
          </template>

          <template v-else>
            <p class="mb-4 text-[13.5px] leading-relaxed" :style="{ color: site.headerColor }">{{ t('for_employees_check_inbox') }}</p>
            <p class="mb-4 text-[12px] leading-relaxed text-[var(--brand-preview-text-muted)]">No real email is sent in this preview — use the demo option below to continue as a verified employee.</p>
            <button type="button" class="w-full rounded-xl px-4 py-2.5 text-[13.5px] font-bold text-white" :style="{ background: site.primaryColor }" @click="demoLogin">
              {{ t('for_employees_demo') }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
