<!-- One compact multi-select dropdown — reused for Department/Job/Recruiter/
     Hiring Manager/Talent Pool in the global filter bar (BRD §2.6). -->
<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Checkbox } from '~/components/ui/checkbox'

const props = defineProps<{
  label: string
  options: { value: string, label: string }[]
  modelValue: string[]
}>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

function toggle(v: string) {
  const has = props.modelValue.includes(v)
  emit('update:modelValue', has ? props.modelValue.filter(x => x !== v) : [...props.modelValue, v])
}

const triggerLabel = computed(() => props.modelValue.length ? `${props.label} (${props.modelValue.length})` : props.label)
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <button
        class="flex items-center gap-1.5 h-9 px-3 rounded-[10px] border text-[13px] font-medium transition-colors"
        :class="modelValue.length
          ? 'border-[var(--brand-teal)] bg-[var(--brand-lime-tint)] text-[var(--brand-teal)]'
          : 'border-[var(--brand-border)] bg-[var(--brand-surface-white)] text-[var(--brand-text)] hover:border-[var(--brand-border-mid)]'"
      >
        {{ triggerLabel }}
        <ChevronDown class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" stroke-width="1.7" />
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" :side-offset="4" class="w-[240px] p-1.5 rounded-[10px] border border-[var(--brand-border-light)] shadow-[0_8px_24px_rgba(0,20,18,0.14)] max-h-[320px] overflow-y-auto">
      <p v-if="!options.length" class="px-2.5 py-2 text-[13px] text-[var(--brand-text-quiet)]">No options available.</p>
      <label
        v-for="opt in options"
        :key="opt.value"
        class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-[var(--brand-text)] cursor-pointer hover:bg-[var(--brand-lime-tint)]/40"
      >
        <Checkbox :model-value="modelValue.includes(opt.value)" @update:model-value="toggle(opt.value)" />
        {{ opt.label }}
      </label>
    </PopoverContent>
  </Popover>
</template>
