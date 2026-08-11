<!--
  Adding candidates to a pool. One dialog, three modes: type someone in by hand,
  drop a CV, or import a CSV. Only `manual` collects fields; the rest are file drops.
-->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Download, FileText, UploadCloud } from 'lucide-vue-next'
import { BrandButton } from '~/components/brand'
import SettingsFormModal from '~/components/settings/SettingsFormModal.vue'

export type AddCandidateMode = 'manual' | 'cv' | 'csv'

const props = defineProps<{
  modelValue: boolean
  mode: AddCandidateMode
  poolName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'add': [payload: { name: string; email: string; phone: string | null }]
  'import': [payload: { mode: AddCandidateMode; fileNames: string[] }]
}>()

const TITLES: Record<AddCandidateMode, string> = {
  'manual': 'Add Candidate Manually',
  'cv': 'Upload CV',
  'csv': 'Import CSV File',
}

const HINTS: Record<AddCandidateMode, string> = {
  'manual': '',
  'cv': 'PDF or Word, up to 10 MB.',
  'csv': 'One row per candidate. Download the template to see the expected columns.',
}

const form = reactive({ name: '', email: '', phone: '' })
const files = ref<string[]>([])
const submitted = ref(false)

watch(() => props.modelValue, (open) => {
  if (!open) return
  submitted.value = false
  files.value = []
  form.name = ''
  form.email = ''
  form.phone = ''
})

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
const errors = computed(() => ({
  name: !form.name.trim(),
  email: !emailValid.value,
}))

function onFiles(e: Event) {
  const picked = (e.target as HTMLInputElement).files
  files.value = picked ? [...picked].map(f => f.name) : []
}

function downloadTemplate() {
  const csv = 'Full Name,Email,Phone,Job Title,Location\nJane Doe,jane.doe@example.com,+20 100 000 0000,Product Designer,Cairo\n'
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'talent-pool-candidates-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function submit() {
  submitted.value = true
  if (props.mode === 'manual') {
    if (errors.value.name || errors.value.email) return
    emit('add', {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
    })
    return
  }
  if (!files.value.length) return
  emit('import', { mode: props.mode, fileNames: [...files.value] })
}

const FIELD_CLASS = 'w-full rounded-[11px] border-[1.5px] border-[var(--brand-border)] bg-[var(--brand-surface-white)] px-[13px] py-2.5 text-[14px] text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-quiet)] focus:border-[var(--brand-teal)]'
const LABEL_CLASS = 'block text-[13.5px] font-bold text-[var(--brand-text)] mb-2'
</script>

<template>
  <SettingsFormModal
    :model-value="modelValue"
    :title="TITLES[mode]"
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <p class="text-[13px] text-[var(--brand-text-quiet)] -mt-4 mb-5">
      Adding to <strong class="text-[var(--brand-text)]">{{ poolName }}</strong>.
      <span v-if="HINTS[mode]">{{ HINTS[mode] }}</span>
    </p>

    <template v-if="mode === 'manual'">
      <div class="mb-4">
        <label for="add-name" :class="LABEL_CLASS">
          Full Name <span class="text-[var(--brand-settings-danger)]">*</span>
        </label>
        <input id="add-name" v-model="form.name" type="text" placeholder="e.g. Jane Doe" :class="FIELD_CLASS">
        <p v-if="submitted && errors.name" class="mt-1.5 text-[12.5px] text-[var(--brand-settings-danger)]">
          This field is required.
        </p>
      </div>

      <div class="mb-4">
        <label for="add-email" :class="LABEL_CLASS">
          Email <span class="text-[var(--brand-settings-danger)]">*</span>
        </label>
        <input id="add-email" v-model="form.email" type="email" placeholder="jane.doe@example.com" :class="FIELD_CLASS">
        <p v-if="submitted && errors.email" class="mt-1.5 text-[12.5px] text-[var(--brand-settings-danger)]">
          Enter a valid email address.
        </p>
      </div>

      <div>
        <label for="add-phone" :class="LABEL_CLASS">
          Phone <span class="font-medium text-[13px] text-[var(--brand-text-quiet)]">(optional)</span>
        </label>
        <input id="add-phone" v-model="form.phone" type="tel" placeholder="+20 100 000 0000" :class="FIELD_CLASS">
      </div>
    </template>

    <template v-else>
      <label
        class="flex flex-col items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-dashed border-[var(--brand-border)] bg-[var(--brand-surface-white)] px-6 py-9 text-center cursor-pointer hover:bg-[var(--brand-lime-tint-hover)] transition-colors"
      >
        <component
          :is="mode === 'csv' ? FileText : UploadCloud"
          class="w-7 h-7 text-[var(--brand-text-quiet)]"
          :stroke-width="1.5"
        />
        <span class="text-[13.5px] font-bold text-[var(--brand-text)]">Choose a file</span>
        <span class="text-[12.5px] text-[var(--brand-text-quiet)]">or drag and drop it here</span>
        <input
          type="file"
          class="sr-only"
          :accept="mode === 'csv' ? '.csv' : '.pdf,.doc,.docx'"
          @change="onFiles"
        >
      </label>

      <ul v-if="files.length" class="mt-3 space-y-1">
        <li v-for="f in files" :key="f" class="text-[13px] text-[var(--brand-text-muted)] truncate">
          {{ f }}
        </li>
      </ul>
      <p v-else-if="submitted" class="mt-2 text-[12.5px] text-[var(--brand-settings-danger)]">
        Choose a file.
      </p>

      <BrandButton v-if="mode === 'csv'" variant="ghost" size="sm" class="mt-3" @click="downloadTemplate">
        <Download class="w-3.5 h-3.5" />
        Download CSV template
      </BrandButton>
    </template>

    <template #footer>
      <BrandButton variant="outline" size="md" @click="emit('update:modelValue', false)">Cancel</BrandButton>
      <BrandButton variant="primary-teal" size="md" @click="submit">
        {{ mode === 'manual' ? 'Add Candidate' : mode === 'csv' ? 'Import' : 'Upload' }}
      </BrandButton>
    </template>
  </SettingsFormModal>
</template>
