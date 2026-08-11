<!--
  Confirm prompt with a tone-coloured icon tile (archive / restore / delete).
  Body copy comes from the default slot so each caller can highlight the pool name.
-->
<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '~/components/ui/dialog'
import { BrandButton } from '~/components/brand'

type Tone = 'warning' | 'success' | 'danger'

const props = withDefaults(defineProps<{
  modelValue: boolean
  tone: Tone
  icon: Component
  title: string
  confirmLabel: string
  width?: string
}>(), { width: '420px' })

const emit = defineEmits<{ 'update:modelValue': [boolean]; confirm: [] }>()

const TONES: Record<Tone, { fg: string; bg: string }> = {
  warning: { fg: 'var(--brand-warning)', bg: 'var(--brand-warning-bg)' },
  success: { fg: 'var(--brand-success)', bg: 'var(--brand-success-bg)' },
  danger: { fg: 'var(--brand-settings-danger)', bg: 'var(--brand-settings-danger-hover-bg)' },
}

const tile = computed(() => TONES[props.tone])
</script>

<template>
  <Dialog :open="modelValue" @update:open="v => emit('update:modelValue', v)">
    <DialogContent
      :show-close-button="false"
      class="p-0 border-none shadow-none bg-transparent sm:max-w-none"
      :style="{ width, maxWidth: '92vw' }"
    >
      <div class="bg-[var(--brand-surface-white)] rounded-[20px] p-7 shadow-[var(--brand-settings-modal-shadow)]">
        <div class="flex items-start justify-between mb-4">
          <div
            class="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
            :style="{ background: tile.bg, color: tile.fg }"
          >
            <component :is="icon" class="w-5 h-5" :stroke-width="1.8" />
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
          {{ title }}
        </DialogTitle>

        <DialogDescription class="text-[13.5px] leading-relaxed text-[var(--brand-text-muted)]">
          <slot />
        </DialogDescription>

        <div class="flex items-center justify-end gap-2.5 mt-6">
          <BrandButton variant="outline" size="md" @click="emit('update:modelValue', false)">
            Cancel
          </BrandButton>
          <BrandButton
            :variant="tone === 'danger' ? 'danger' : 'primary-teal'"
            size="md"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </BrandButton>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
