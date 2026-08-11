<!-- Simplified 5-option date range control — Job-Level Reports tab only
     (BRD §3.4: "Last 7 days / Last 30 days / Last 90 days / Custom range /
     All time"). A segmented control, not a dropdown — small option set. -->
<script setup lang="ts">
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Input } from '~/components/ui/input'
import { BrandButton } from '~/components/brand'
import { JOB_DATE_RANGE_PRESETS } from '~/utils/dateRangePresets'
import type { DateRangeValue, JobDateRangePreset } from '~/types'

const props = defineProps<{ modelValue: DateRangeValue }>()
const emit = defineEmits<{ 'update:modelValue': [DateRangeValue] }>()

const open = ref(false)
const customFrom = ref(props.modelValue.from?.slice(0, 10) ?? '')
const customTo = ref(props.modelValue.to?.slice(0, 10) ?? '')

function pick(preset: JobDateRangePreset) {
  if (preset === 'custom') { open.value = true; return }
  emit('update:modelValue', { preset, from: null, to: null })
}
function applyCustom() {
  if (!customFrom.value || !customTo.value) return
  emit('update:modelValue', { preset: 'custom', from: customFrom.value, to: customTo.value })
  open.value = false
}
</script>

<template>
  <div class="inline-flex items-center rounded-[10px] border border-[var(--brand-border)] bg-[var(--brand-surface-white)] p-0.5">
    <button
      v-for="p in JOB_DATE_RANGE_PRESETS.filter(p => p.value !== 'custom')"
      :key="p.value"
      class="h-8 px-3 rounded-[8px] text-[13px] font-medium transition-colors"
      :class="modelValue.preset === p.value ? 'bg-[var(--brand-lime-active-bg-strong)] text-[var(--brand-olive)] font-bold' : 'text-[var(--brand-text-quiet)] hover:bg-black/[.04]'"
      @click="pick(p.value)"
    >
      {{ p.label }}
    </button>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <button
          class="h-8 px-3 rounded-[8px] text-[13px] font-medium transition-colors"
          :class="modelValue.preset === 'custom' ? 'bg-[var(--brand-lime-active-bg-strong)] text-[var(--brand-olive)] font-bold' : 'text-[var(--brand-text-quiet)] hover:bg-black/[.04]'"
          @click="pick('custom')"
        >
          Custom range
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" :side-offset="6" class="w-[300px] p-3 rounded-[10px] border-[var(--brand-border-light)] shadow-[0_8px_24px_rgba(0,20,18,0.14)]">
        <div class="flex items-center gap-2">
          <Input v-model="customFrom" type="date" class="h-9 text-[13px]" />
          <span class="text-[12px] text-[var(--brand-text-quiet)]">to</span>
          <Input v-model="customTo" type="date" class="h-9 text-[13px]" />
        </div>
        <BrandButton variant="primary-teal" size="sm" class="mt-2.5 w-full" :disabled="!customFrom || !customTo" @click="applyCustom">
          Apply
        </BrandButton>
      </PopoverContent>
    </Popover>
  </div>
</template>
