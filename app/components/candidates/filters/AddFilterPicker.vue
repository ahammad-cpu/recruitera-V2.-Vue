<!--
  Two-step "Add filter" popover.
   1. Catalog: search + list of every filter kind
   2. Operator picker: back arrow, submenu of "by {Filter} → Is / Is not / …"
  Selecting an operator emits `add(id, op)` and closes the popover.
-->
<script setup lang="ts">
import { ArrowLeft, ChevronRight, X } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Button } from '~/components/ui/button'
import { BrandSearchBar } from '~/components/brand'
import { Filter as FilterIcon } from 'lucide-vue-next'
import { useFilterRegistry } from '~/composables/useFilterRegistry'
import type { FilterOperator } from '~/types/candidate-filter.types'

const props = defineProps<{
  assignedRecruiterOptions?: { value: string; label: string }[]
}>()
const emit = defineEmits<{ add: [id: string, op: FilterOperator] }>()

const { catalog } = useFilterRegistry(computed(() => props.assignedRecruiterOptions))

const open = ref(false)
const step = ref<'catalog' | 'operator'>('catalog')
const search = ref('')
const selectedId = ref<string | null>(null)
const selected = computed(() => catalog.value.find(f => f.id === selectedId.value))

// Reset picker every time it reopens.
watch(open, (v) => {
  if (v) { step.value = 'catalog'; search.value = ''; selectedId.value = null }
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return catalog.value
  return catalog.value.filter(f => f.name.toLowerCase().includes(q))
})

function pickFilter(id: string) {
  const entry = catalog.value.find(f => f.id === id)
  if (!entry) return
  if (entry.operators.length === 1) {
    emit('add', entry.id, entry.operators[0]!.value)
    open.value = false
    return
  }
  selectedId.value = id
  step.value = 'operator'
}

function pickOperator(op: FilterOperator) {
  if (!selectedId.value) return
  emit('add', selectedId.value, op)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        class="flex-1 h-10 rounded-lg border-[var(--brand-border)] text-[13.5px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint-hover)] gap-2"
      >
        <FilterIcon class="w-3.5 h-3.5" />
        Add filter
      </Button>
    </PopoverTrigger>
    <PopoverContent
      side="top"
      align="start"
      :side-offset="8"
      class="w-[288px] p-0 rounded-2xl shadow-[0_8px_32px_rgba(0,20,18,0.18)] border-[var(--brand-border-light)] overflow-hidden"
    >
      <!-- ── STEP 1: catalog ── -->
      <template v-if="step === 'catalog'">
        <div class="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-[var(--brand-border-fade)]">
          <span class="font-bold text-[15px] text-[var(--brand-text)]">Filter by</span>
          <button
            class="text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)] transition-colors"
            @click="open = false"
          ><X class="w-4 h-4" /></button>
        </div>
        <div class="px-2.5 pt-2">
          <BrandSearchBar v-model="search" size="sm" placeholder="Search filters" />
        </div>
        <div class="max-h-[280px] overflow-y-auto px-1.5 pb-2 pt-2">
          <button
            v-for="f in filtered"
            :key="f.id"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint)] transition-colors"
            @click="pickFilter(f.id)"
          >
            <component :is="f.icon" class="w-[17px] h-[17px] text-[var(--brand-text-quiet)] shrink-0" stroke-width="1.6" />
            <span class="flex-1 text-left">{{ f.name }}</span>
            <ChevronRight class="w-3.5 h-3.5 text-[var(--brand-text-faint)]" stroke-width="1.7" />
          </button>
          <div
            v-if="!filtered.length"
            class="text-center py-3.5 text-[13.5px] text-[var(--brand-text-quiet)]"
          >No filters found</div>
        </div>
      </template>

      <!-- ── STEP 2: operator picker ── -->
      <template v-else-if="step === 'operator' && selected">
        <div class="flex items-center gap-2 px-3 pt-3.5 pb-2.5 border-b border-[var(--brand-border-fade)] bg-[var(--brand-canvas)]">
          <button
            class="w-8 h-8 rounded-md flex items-center justify-center text-[var(--brand-text-secondary)] hover:bg-black/[.05]"
            aria-label="Back"
            @click="step = 'catalog'"
          ><ArrowLeft class="w-4 h-4" /></button>
          <span class="flex-1 text-center font-bold text-[15px] text-[var(--brand-text)]">by {{ selected.name }}</span>
          <span class="w-8" />
        </div>
        <div class="py-1">
          <button
            v-for="op in selected.operators"
            :key="op.value"
            class="w-full text-left px-4 py-3 text-[14px] text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint)] transition-colors"
            @click="pickOperator(op.value)"
          >{{ op.label }}</button>
        </div>
      </template>
    </PopoverContent>
  </Popover>
</template>
