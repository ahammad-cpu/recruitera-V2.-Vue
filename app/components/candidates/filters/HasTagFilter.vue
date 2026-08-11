<!--
  has-tag: Source tag / Tag / Talent pool / Pipeline stage. Renders a
  "Add {name}" dropdown; clicking opens a search + option list (design screens
  7-8, 3-4 mirror this pattern for Disqualify reason too).
-->
<script setup lang="ts">
import { ChevronDown, ChevronUp, X } from 'lucide-vue-next'
import type { FilterCatalogEntry, ActiveFilter } from '~/types/candidate-filter.types'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { BrandSearchBar, BrandFilterGroup, BrandLimeCheckbox } from '~/components/brand'

const props = defineProps<{ entry: FilterCatalogEntry; active: ActiveFilter }>()
const emit = defineEmits<{ remove: []; update: [patch: Partial<ActiveFilter>] }>()

const operatorLabel = computed(() =>
  props.entry.operators.find(o => o.value === props.active.op)?.label ?? props.entry.name,
)

const open = ref(false)
const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const opts = props.entry.options ?? []
  return q ? opts.filter(o => o.label.toLowerCase().includes(q)) : opts
})

function pick(v: string) {
  const cur = props.active.values ?? []
  const next = cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]
  emit('update', { values: next })
}

const selectedLabels = computed(() => {
  const cur = props.active.values ?? []
  const opts = props.entry.options ?? []
  return cur.map(v => opts.find(o => o.value === v)?.label ?? v)
})
</script>

<template>
  <BrandFilterGroup :title="operatorLabel" @clear="$emit('remove')">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <button
          type="button"
          class="w-full flex items-center gap-2 px-3 rounded-[10px] border border-[var(--brand-border)] bg-white text-[13.5px] text-[var(--brand-text-quiet)] hover:border-[var(--brand-border-mid)] transition-colors"
          :class="entry.chips && selectedLabels.length ? 'min-h-10 py-1.5' : 'h-10'"
        >
          <span v-if="!selectedLabels.length" class="flex-1 text-left truncate">Add {{ entry.name.toLowerCase() }}</span>
          <span v-else-if="!entry.chips" class="flex-1 text-left truncate">{{ selectedLabels.join(', ') }}</span>
          <span v-else class="flex-1 flex flex-wrap gap-1.5">
            <span
              v-for="(label, i) in selectedLabels"
              :key="active.values![i]"
              class="inline-flex items-center gap-1.5 h-[26px] pl-2.5 pr-1.5 rounded-full bg-[var(--brand-lime-tint)] text-[12.5px] font-semibold text-[var(--brand-teal-secondary)]"
            >
              {{ label }}
              <X
                class="w-3.5 h-3.5 text-[var(--brand-teal-secondary)] hover:text-[var(--brand-danger)] cursor-pointer shrink-0"
                stroke-width="2"
                @click.stop="pick(active.values![i]!)"
              />
            </span>
          </span>
          <component :is="open ? ChevronUp : ChevronDown" class="w-3.5 h-3.5 shrink-0" stroke-width="1.7" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        :side-offset="4"
        class="w-[240px] p-0 rounded-[10px] border-[var(--brand-border-light)] shadow-[0_8px_24px_rgba(0,20,18,0.12)] overflow-hidden"
      >
        <div class="p-2">
          <BrandSearchBar v-model="search" size="sm" :placeholder="`Search ${entry.name.toLowerCase()}s`" />
        </div>
        <div class="max-h-[240px] overflow-y-auto pb-2">
          <button
            v-for="o in filtered"
            :key="o.value"
            class="w-full text-left px-3 py-2 text-[14px] text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint)] transition-colors flex items-center gap-2.5"
            :class="(active.values ?? []).includes(o.value) ? 'bg-[var(--brand-lime-tint)] font-semibold' : ''"
            @click="pick(o.value)"
          >
            <BrandLimeCheckbox
              v-if="entry.chips"
              :model-value="(active.values ?? []).includes(o.value)"
              class="pointer-events-none shrink-0"
            />
            <div class="flex flex-col">
              <span>{{ o.label }}</span>
              <span v-if="o.count !== undefined" class="text-[13px] text-[var(--brand-text-quiet)]">({{ o.count }})</span>
            </div>
          </button>
          <div v-if="!filtered.length" class="px-3 py-3 text-[13px] text-[var(--brand-text-quiet)] text-center">
            No matches
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </BrandFilterGroup>
</template>
