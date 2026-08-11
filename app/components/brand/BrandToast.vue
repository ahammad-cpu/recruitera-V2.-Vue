<!--
  Toast stack — bottom-centred, one per mutation confirmation.
  Mounted once in app/layouts/default.vue; never place it on a page.
  Push messages with useToast().success(...) / .error(...).
-->
<script setup lang="ts">
import { CheckCircle2, AlertCircle } from 'lucide-vue-next'

const { toasts, dismiss } = useToast()

const TONES = {
  success: { bg: 'var(--brand-toast-success-bg)', text: 'var(--brand-toast-success-text)' },
  error: { bg: 'var(--brand-settings-toast-bg)', text: 'var(--brand-surface-white)' },
} as const
</script>

<template>
  <div
    class="fixed bottom-7 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-[90%] max-w-[460px] pointer-events-none"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <button
        v-for="t in toasts"
        :key="t.id"
        type="button"
        class="pointer-events-auto w-full flex items-center gap-3 rounded-[14px] px-5 py-3.5 text-left text-[13.5px] font-semibold shadow-[0_8px_32px_rgba(0,0,0,0.22)]"
        :style="{ background: TONES[t.kind].bg, color: TONES[t.kind].text }"
        @click="dismiss(t.id)"
      >
        <component
          :is="t.kind === 'success' ? CheckCircle2 : AlertCircle"
          class="w-[18px] h-[18px] shrink-0"
          :stroke-width="2"
        />
        <span class="flex-1">{{ t.message }}</span>
      </button>
    </TransitionGroup>
  </div>
</template>
