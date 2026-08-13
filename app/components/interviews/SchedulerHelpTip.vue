<!--
  SchedulerHelpTip — the "?" help icon used across the Event scheduler dialog.
  Brand-tokened tooltip (teal bubble). Requires a <TooltipProvider> ancestor.
-->
<script setup lang="ts">
import { HelpCircle } from 'lucide-vue-next'
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui/tooltip'

defineProps<{ text: string }>()
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <button
        type="button"
        class="inline-flex text-[var(--brand-text-quiet)] hover:text-[var(--brand-text-secondary)] transition align-middle"
        :aria-label="text"
      >
        <HelpCircle class="w-3.5 h-3.5" stroke-width="1.8" />
      </button>
    </TooltipTrigger>
    <TooltipContent
      :side-offset="6"
      class="max-w-[250px] bg-[var(--brand-teal)] text-white text-[12px] leading-[1.45] rounded-[9px] px-3 py-2 shadow-[0_10px_28px_rgba(0,20,18,0.28)]"
    >
      {{ text }}
    </TooltipContent>
  </Tooltip>
</template>
