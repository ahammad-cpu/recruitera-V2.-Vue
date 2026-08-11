<!-- 18-option date range picker — General Reports global filter bar (BRD
     §2.6/R-G02). Mirrors CandidatesFilters' DateRangeFilter.vue popover
     pattern (grid of presets + custom range), extended to the full option set. -->
<script setup lang="ts">
import { Calendar, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Input } from '~/components/ui/input'
import { BrandButton } from '~/components/brand'
import { DATE_RANGE_PRESETS, dateRangeSuffix } from '~/utils/dateRangePresets'
import type { DateRangePreset, DateRangeValue } from '~/types'

const props = defineProps<{ modelValue: DateRangeValue }>()
const emit = defineEmits<{ 'update:modelValue': [DateRangeValue] }>()

const open = ref(false)
const customFrom = ref(props.modelValue.from?.slice(0, 10) ?? '')
const customTo = ref(props.modelValue.to?.slice(0, 10) ?? '')

const label = computed(() => dateRangeSuffix(props.modelValue.preset))
const presets = computed(() => DATE_RANGE_PRESETS.filter(p => p.value !== 'custom'))

function pick(preset: DateRangePreset) {
  emit('update:modelValue', { preset, from: null, to: null })
  open.value = false
}
function applyCustom() {
  if (!customFrom.value || !customTo.value) return
  emit('update:modelValue', { preset: 'custom', from: customFrom.value, to: customTo.value })
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button class="flex items-center gap-2 h-9 px-3 rounded-[10px] border border-[var(--brand-border)] bg-[var(--brand-surface-white)] text-[13px] text-[var(--brand-text)] font-medium hover:border-[var(--brand-border-mid)] transition-colors">
        <Calendar class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" />
        {{ label }}
        <component :is="open ? ChevronUp : ChevronDown" class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" stroke-width="1.7" />
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" :side-offset="4" class="w-[380px] p-0 rounded-[10px] border-[var(--brand-border-light)] shadow-[0_8px_24px_rgba(0,20,18,0.14)] overflow-hidden max-h-[420px] overflow-y-auto">
      <div class="grid grid-cols-2">
        <button
          v-for="p in presets"
          :key="p.value"
          class="text-left px-4 py-2.5 text-[13.5px] border-r border-b border-[var(--brand-border-fade)] last:border-r-0 transition-colors"
          :class="modelValue.preset === p.value ? 'bg-[var(--brand-lime-active-bg)] text-[var(--brand-olive)] font-semibold' : 'text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint)]'"
          @click="pick(p.value)"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="p-3">
        <p class="m-0 mb-2 text-[12px] font-bold text-[var(--brand-text-subtle)] uppercase tracking-[0.03em]">Custom date range</p>
        <div class="flex items-center gap-2">
          <Input v-model="customFrom" type="date" class="h-9 text-[13px]" />
          <span class="text-[12px] text-[var(--brand-text-quiet)]">to</span>
          <Input v-model="customTo" type="date" class="h-9 text-[13px]" />
        </div>
        <BrandButton variant="primary-teal" size="sm" class="mt-2.5 w-full" :disabled="!customFrom || !customTo" @click="applyCustom">
          Apply
        </BrandButton>
      </div>
    </PopoverContent>
  </Popover>
</template>
