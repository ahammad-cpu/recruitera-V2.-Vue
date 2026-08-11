<!--
  Delete a talent pool. The candidates inside it have to go somewhere, so the caller
  picks between removing them with the pool or relocating them to another pool or job.
  Destinations are supplied by the page — this dialog stays unaware of where they came from.
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Trash2, X } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '~/components/ui/dialog'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '~/components/ui/select'
import { BrandButton } from '~/components/brand'

export interface DeleteDestination {
  value: string
  label: string
  group: 'Talent Pools' | 'Jobs'
}

type DeleteMode = 'all' | 'move'

const props = defineProps<{
  modelValue: boolean
  poolName: string
  destinations: DeleteDestination[]
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'confirm': [payload: { mode: DeleteMode; destination: string | null }]
}>()

const mode = ref<DeleteMode>('all')
const destination = ref('')
const submitted = ref(false)

watch(() => props.modelValue, (open) => {
  if (!open) return
  mode.value = 'all'
  destination.value = ''
  submitted.value = false
})

const groups = computed(() => {
  const names: DeleteDestination['group'][] = ['Talent Pools', 'Jobs']
  return names
    .map(g => ({ name: g, items: props.destinations.filter(d => d.group === g) }))
    .filter(g => g.items.length > 0)
})

const destinationMissing = computed(() => mode.value === 'move' && !destination.value)

function confirm() {
  submitted.value = true
  if (destinationMissing.value) return
  emit('confirm', {
    mode: mode.value,
    destination: mode.value === 'move' ? destination.value : null,
  })
}

const OPTIONS = [
  {
    value: 'all' as const,
    title: 'Delete Talent Pool with all candidates',
    hint: 'Candidates in this pool will be permanently removed.',
  },
  {
    value: 'move' as const,
    title: 'Delete Talent Pool and move candidates to another Talent Pool or Job',
    hint: '',
  },
]
</script>

<template>
  <Dialog :open="modelValue" @update:open="v => emit('update:modelValue', v)">
    <DialogContent
      :show-close-button="false"
      class="p-0 border-none shadow-none bg-transparent sm:max-w-none"
      :style="{ width: '460px', maxWidth: '92vw' }"
    >
      <div class="bg-[var(--brand-surface-white)] rounded-[20px] p-7 shadow-[var(--brand-settings-modal-shadow)]">
        <div class="flex items-start justify-between mb-4">
          <div
            class="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
            :style="{ background: 'var(--brand-settings-danger-hover-bg)', color: 'var(--brand-settings-danger)' }"
          >
            <Trash2 class="w-5 h-5" :stroke-width="1.8" />
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center w-9 h-9 rounded-[10px] border-[1.5px] border-[var(--brand-border-light)] bg-[var(--brand-surface-white)] text-[var(--brand-text-muted)] shrink-0 outline-none hover:bg-[var(--brand-lime-tint-hover)] transition-colors"
            aria-label="Close"
            @click="emit('update:modelValue', false)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <DialogTitle class="block text-[17px] font-bold text-[var(--brand-text)] mb-2">
          Delete {{ poolName }}?
        </DialogTitle>
        <DialogDescription class="text-[13.5px] leading-relaxed text-[var(--brand-text-muted)] mb-4">
          Choose what happens to the candidates in this pool.
        </DialogDescription>

        <div class="rounded-[12px] border border-[var(--brand-border-light)] divide-y divide-[var(--brand-border-hairline)]">
          <label
            v-for="opt in OPTIONS"
            :key="opt.value"
            class="flex items-start gap-3 p-3.5 cursor-pointer"
          >
            <input
              v-model="mode"
              type="radio"
              name="pool-delete-mode"
              :value="opt.value"
              class="mt-0.5 w-4 h-4 shrink-0 accent-[var(--brand-teal)]"
            >
            <span class="flex-1 min-w-0">
              <span class="block text-[13.5px] font-bold text-[var(--brand-text)]">{{ opt.title }}</span>
              <span v-if="opt.hint" class="block mt-0.5 text-[12.5px] text-[var(--brand-text-quiet)]">{{ opt.hint }}</span>

              <span v-if="opt.value === 'move' && mode === 'move'" class="block mt-2.5">
                <Select v-model="destination">
                  <SelectTrigger class="w-full h-auto py-2.5 text-[13.5px]">
                    <SelectValue placeholder="Select a destination…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup v-for="g in groups" :key="g.name">
                      <SelectLabel>{{ g.name }}</SelectLabel>
                      <SelectItem v-for="d in g.items" :key="d.value" :value="d.value">{{ d.label }}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <span v-if="submitted && destinationMissing" class="block mt-1.5 text-[12.5px] text-[var(--brand-settings-danger)]">
                  Please select a destination.
                </span>
              </span>
            </span>
          </label>
        </div>

        <div class="flex items-center justify-end gap-2.5 mt-6">
          <BrandButton variant="outline" size="md" @click="emit('update:modelValue', false)">Cancel</BrandButton>
          <BrandButton variant="danger" size="md" @click="confirm">Delete Talent Pool</BrandButton>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
