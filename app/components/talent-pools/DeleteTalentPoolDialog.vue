<!-- Delete a pool: remove all candidates, or reassign them to another pool first. -->
<script setup lang="ts">
import { BrandButton } from '~/components/brand'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog'
import type { DeleteTalentPoolInput, TalentPool } from '~/types'

const props = defineProps<{ open: boolean, pool: TalentPool | null, destinations: { id: string, name: string }[], submitting?: boolean }>()
const emit = defineEmits<{ 'update:open': [v: boolean]; confirm: [payload: DeleteTalentPoolInput] }>()

const mode = ref<'all' | 'reassign'>('all')
const destinationId = ref('')
const touched = ref(false)
watch(() => props.open, (o) => { if (o) { mode.value = 'all'; destinationId.value = ''; touched.value = false } })

const destErr = computed(() => touched.value && mode.value === 'reassign' && !destinationId.value)
function confirm() {
  touched.value = true
  if (mode.value === 'reassign' && !destinationId.value) return
  emit('confirm', { mode: mode.value, destinationId: mode.value === 'reassign' ? destinationId.value : undefined })
}
const optCls = 'flex items-start gap-3 rounded-xl border-[1.5px] p-3.5 cursor-pointer transition'
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>Delete “{{ pool?.name }}”?</DialogTitle>
        <DialogDescription>Choose what happens to the {{ pool?.talentsCount ?? 0 }} candidate{{ pool?.talentsCount === 1 ? '' : 's' }} in this pool.</DialogDescription>
      </DialogHeader>

      <div class="space-y-2.5 py-1">
        <label :class="[optCls, mode === 'all' ? 'border-[var(--brand-teal)] bg-[var(--brand-lime-tint-hover)]' : 'border-[var(--brand-border-light)]']">
          <input v-model="mode" type="radio" value="all" class="mt-1 accent-[var(--brand-teal)]">
          <span>
            <span class="block text-[14px] font-semibold text-[var(--brand-text)]">Delete pool with all candidates</span>
            <span class="block text-[12.5px] text-[var(--brand-text-quiet)]">Candidates are removed from this pool.</span>
          </span>
        </label>
        <label :class="[optCls, mode === 'reassign' ? 'border-[var(--brand-teal)] bg-[var(--brand-lime-tint-hover)]' : 'border-[var(--brand-border-light)]']">
          <input v-model="mode" type="radio" value="reassign" class="mt-1 accent-[var(--brand-teal)]">
          <span class="flex-1">
            <span class="block text-[14px] font-semibold text-[var(--brand-text)]">Move candidates to another pool, then delete</span>
            <span class="block text-[12.5px] text-[var(--brand-text-quiet)] mb-2">Candidates are reassigned before the pool is removed.</span>
            <select v-if="mode === 'reassign'" v-model="destinationId" class="w-full h-9 rounded-lg border bg-white px-2.5 text-[13.5px] outline-none focus:border-[var(--brand-teal)]" :class="destErr ? 'border-[var(--brand-danger)]' : 'border-[var(--brand-border)]'" @click.prevent>
              <option value="">Select a destination</option>
              <option v-for="d in destinations" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
            <span v-if="destErr" class="block mt-1 text-[12px] text-[var(--brand-danger)]">Please select a destination.</span>
          </span>
        </label>
      </div>

      <DialogFooter>
        <BrandButton variant="outline" @click="emit('update:open', false)">Cancel</BrandButton>
        <BrandButton variant="danger" :disabled="submitting" @click="confirm">Delete pool</BrandButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
