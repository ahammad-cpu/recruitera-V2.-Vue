<!--
  Move selected candidates to another talent pool, or into a job's pipeline.
  One dialog for both — only the copy and the destination list differ.
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { BrandButton } from '~/components/brand'
import SettingsFormModal from '~/components/settings/SettingsFormModal.vue'

export type MoveTarget = 'pool' | 'job'

export interface MoveOption {
  value: string
  label: string
  hint?: string
}

const props = defineProps<{
  modelValue: boolean
  target: MoveTarget
  /** Names of the candidates being moved — drives the singular/plural copy. */
  names: string[]
  destinations: MoveOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'confirm': [destination: string]
}>()

const destination = ref('')
const submitted = ref(false)

watch(() => props.modelValue, (open) => {
  if (!open) return
  destination.value = ''
  submitted.value = false
})

const isPool = computed(() => props.target === 'pool')
const title = computed(() => isPool.value ? 'Move to another Talent Pool' : 'Move to Job')
const label = computed(() => isPool.value ? 'Destination Pool' : 'Destination Job')

const who = computed(() =>
  props.names.length === 1
    ? props.names[0]
    : `${props.names.length} candidates`,
)

function confirm() {
  submitted.value = true
  if (!destination.value) return
  emit('confirm', destination.value)
}
</script>

<template>
  <SettingsFormModal
    :model-value="modelValue"
    :title="title"
    width="420px"
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <p class="text-[13.5px] text-[var(--brand-text-muted)] -mt-4 mb-4">
      Move <strong class="text-[var(--brand-text)]">{{ who }}</strong>
      {{ isPool ? 'to a different talent pool.' : "into an active job's pipeline." }}
    </p>

    <span class="block text-[13.5px] font-bold text-[var(--brand-text)] mb-2">
      {{ label }} <span class="text-[var(--brand-settings-danger)]">*</span>
    </span>
    <Select v-model="destination">
      <SelectTrigger class="w-full h-auto rounded-[11px] border-[1.5px] border-[var(--brand-border)] px-[13px] py-2.5 text-[14px]">
        <SelectValue :placeholder="isPool ? 'Select a talent pool…' : 'Select a job…'" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="d in destinations" :key="d.value" :value="d.value">
          {{ d.label }}<span v-if="d.hint" class="text-[var(--brand-text-quiet)]"> · {{ d.hint }}</span>
        </SelectItem>
      </SelectContent>
    </Select>
    <p v-if="submitted && !destination" class="mt-1.5 text-[12.5px] text-[var(--brand-settings-danger)]">
      Please select a destination.
    </p>

    <template #footer>
      <BrandButton variant="outline" size="md" @click="emit('update:modelValue', false)">Cancel</BrandButton>
      <BrandButton variant="primary-teal" size="md" @click="confirm">
        {{ isPool ? 'Move Candidate' : 'Move to Job' }}
      </BrandButton>
    </template>
  </SettingsFormModal>
</template>
