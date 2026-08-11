<!-- Title + description + Export CSV button — top of every report section
     (BRD §2.7: "Each section has ... Export CSV button (top right)"). -->
<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { BrandButton } from '~/components/brand'

defineProps<{
  title: string
  description: string
  exportDisabled?: boolean
}>()
const emit = defineEmits<{ export: [] }>()
</script>

<template>
  <div class="flex items-start justify-between gap-4 mb-5">
    <div>
      <h1 class="m-0 text-[20px] font-bold text-[var(--brand-text)]">{{ title }}</h1>
      <p class="m-0 mt-1 text-[13px] text-[var(--brand-text-quiet)]">{{ description }}</p>
    </div>
    <BrandButton variant="outline" size="sm" :disabled="exportDisabled" @click="emit('export')">
      <Download class="w-3.5 h-3.5 mr-1.5" stroke-width="1.8" />
      Export CSV
    </BrandButton>
  </div>
</template>
