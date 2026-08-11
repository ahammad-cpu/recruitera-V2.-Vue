<!--
  The public application form an event pool publishes. Full Name and Email are
  always on it and locked; phone and résumé are opt-in; everything else is a custom
  question. Preview renders exactly what an applicant would see.
-->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { FileText, Lock, Mail, Phone, Plus, Trash2, User } from 'lucide-vue-next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { BrandButton } from '~/components/brand'
import SettingsFormModal from '~/components/settings/SettingsFormModal.vue'
import type { PoolFormConfig, PoolFormQuestionType, TalentPool } from '~/types'

const props = defineProps<{
  modelValue: boolean
  pool: TalentPool
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'publish': [config: PoolFormConfig]
}>()

const QUESTION_TYPES: PoolFormQuestionType[] = [
  'Short Text', 'Long Text', 'Single Select', 'Multi Select', 'Yes / No', 'Number',
]

const STANDARD = [
  { label: 'Full Name', icon: User },
  { label: 'Email', icon: Mail },
]

const OPTIONAL = [
  { key: 'phone' as const, label: 'Phone Number', icon: Phone },
  { key: 'resume' as const, label: 'Resume / CV Upload', icon: FileText },
]

const draft = reactive<PoolFormConfig>({ optional: { phone: false, resume: false }, questions: [] })
const previewing = ref(false)

watch(() => props.modelValue, (open) => {
  if (!open) return
  previewing.value = false
  draft.optional = { ...(props.pool.form?.optional ?? { phone: false, resume: false }) }
  draft.questions = (props.pool.form?.questions ?? []).map(q => ({ ...q }))
}, { immediate: true })

function addQuestion() {
  draft.questions.push({
    id: `q-${Date.now()}-${draft.questions.length}`,
    label: '',
    type: 'Short Text',
    required: false,
  })
}

function removeQuestion(id: string) {
  draft.questions = draft.questions.filter(q => q.id !== id)
}

/** A question with no label would render as an unlabelled input — drop those on publish. */
const publishable = computed<PoolFormConfig>(() => ({
  optional: { ...draft.optional },
  questions: draft.questions.filter(q => q.label.trim()).map(q => ({ ...q, label: q.label.trim() })),
}))

const ROW = 'flex items-center gap-3 rounded-[10px] border border-[var(--brand-border-light)] bg-[var(--brand-surface-white)] px-3.5 py-3'
const FIELD = 'w-full rounded-[10px] border-[1.5px] border-[var(--brand-border)] bg-[var(--brand-surface-white)] px-3 py-2 text-[13.5px] text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-quiet)] focus:border-[var(--brand-teal)]'
</script>

<template>
  <SettingsFormModal
    :model-value="modelValue"
    :title="previewing ? 'Form Preview' : 'Application Form'"
    scrollable
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <!-- ── Preview ── -->
    <template v-if="previewing">
      <p class="text-[13px] text-[var(--brand-text-quiet)] -mt-4 mb-5">
        What an applicant sees at <strong class="text-[var(--brand-text)]">{{ pool.name }}</strong>.
      </p>
      <div class="rounded-[12px] border border-[var(--brand-border-light)] bg-[var(--brand-canvas)] p-5">
        <div v-for="f in STANDARD" :key="f.label" class="mb-4">
          <span class="block text-[13px] font-bold text-[var(--brand-text)] mb-1.5">
            {{ f.label }} <span class="text-[var(--brand-settings-danger)]">*</span>
          </span>
          <div :class="FIELD" class="text-[var(--brand-text-quiet)]">{{ f.label }}</div>
        </div>
        <div v-for="o in OPTIONAL.filter(x => draft.optional[x.key])" :key="o.key" class="mb-4">
          <span class="block text-[13px] font-bold text-[var(--brand-text)] mb-1.5">{{ o.label }}</span>
          <div :class="FIELD" class="text-[var(--brand-text-quiet)]">{{ o.label }}</div>
        </div>
        <div v-for="q in publishable.questions" :key="q.id" class="mb-4">
          <span class="block text-[13px] font-bold text-[var(--brand-text)] mb-1.5">
            {{ q.label }} <span v-if="q.required" class="text-[var(--brand-settings-danger)]">*</span>
          </span>
          <div :class="FIELD" class="text-[var(--brand-text-quiet)]">{{ q.type }}</div>
        </div>
      </div>
    </template>

    <!-- ── Builder ── -->
    <template v-else>
      <p class="text-[13px] text-[var(--brand-text-quiet)] -mt-4 mb-5">
        Applicants reach this form from the event link for
        <strong class="text-[var(--brand-text)]">{{ pool.name }}</strong>.
      </p>

      <span class="block text-[13.5px] font-bold text-[var(--brand-text)] mb-2">Standard fields</span>
      <div v-for="f in STANDARD" :key="f.label" :class="[ROW, 'mb-2']">
        <component :is="f.icon" class="w-4 h-4 shrink-0 text-[var(--brand-text-quiet)]" :stroke-width="1.7" />
        <span class="flex-1 text-[13.5px] font-semibold text-[var(--brand-text)]">{{ f.label }}</span>
        <Lock class="w-3.5 h-3.5 text-[var(--brand-text-faint)]" :stroke-width="1.7" />
      </div>

      <span class="block mt-5 text-[13.5px] font-bold text-[var(--brand-text)] mb-2">Optional fields</span>
      <div v-for="o in OPTIONAL" :key="o.key" :class="[ROW, 'mb-2']">
        <component :is="o.icon" class="w-4 h-4 shrink-0 text-[var(--brand-text-quiet)]" :stroke-width="1.7" />
        <span class="flex-1 text-[13.5px] font-semibold text-[var(--brand-text)]">{{ o.label }}</span>
        <Switch v-model="draft.optional[o.key]" :aria-label="`Include ${o.label}`" />
      </div>

      <div class="mt-5 mb-2 flex items-center justify-between">
        <span class="text-[13.5px] font-bold text-[var(--brand-text)]">Custom questions</span>
        <BrandButton variant="outline" size="sm" @click="addQuestion">
          <Plus class="w-3.5 h-3.5" :stroke-width="2.2" />
          Add question
        </BrandButton>
      </div>

      <p v-if="!draft.questions.length" class="rounded-[10px] border border-dashed border-[var(--brand-border)] px-3.5 py-5 text-center text-[13px] text-[var(--brand-text-quiet)]">
        No custom questions yet.
      </p>

      <div
        v-for="q in draft.questions"
        :key="q.id"
        class="mb-2.5 rounded-[10px] border border-[var(--brand-border-light)] bg-[var(--brand-preview-surface-section)] p-3.5"
      >
        <div class="mb-2.5 flex items-center gap-2.5">
          <input v-model="q.label" type="text" placeholder="Question label" :class="FIELD">
          <button
            type="button"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--brand-text-muted)] outline-none hover:bg-[var(--brand-badge-settings-bg)] hover:text-[var(--brand-settings-danger)]"
            :aria-label="`Delete question ${q.label || ''}`"
            @click="removeQuestion(q.id)"
          >
            <Trash2 class="w-4 h-4" :stroke-width="1.8" />
          </button>
        </div>
        <div class="flex items-center gap-3.5">
          <Select v-model="q.type">
            <SelectTrigger class="h-auto flex-1 rounded-[10px] border-[1.5px] border-[var(--brand-border)] px-3 py-2 text-[13.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="t in QUESTION_TYPES" :key="t" :value="t">{{ t }}</SelectItem>
            </SelectContent>
          </Select>
          <label class="flex shrink-0 items-center gap-2 text-[12.5px] font-semibold text-[var(--brand-text-muted)]">
            <Switch v-model="q.required" :aria-label="`Make ${q.label || 'question'} required`" />
            Required
          </label>
        </div>
      </div>
    </template>

    <template #footer>
      <BrandButton variant="outline" size="md" @click="previewing = !previewing">
        {{ previewing ? 'Back to editing' : 'Preview' }}
      </BrandButton>
      <BrandButton variant="primary-teal" size="md" @click="emit('publish', publishable)">
        {{ pool.formStatus === 'live' ? 'Save Form' : 'Publish Form' }}
      </BrandButton>
    </template>
  </SettingsFormModal>
</template>
