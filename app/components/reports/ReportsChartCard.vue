<!-- One report matrix card — bold title + gray description + chart/table
     below (legacy reference's "Card per report section" pattern, carried
     forward per BRD §2.4 "One matrix per report section"). -->
<script setup lang="ts">
import { BrandCard } from '~/components/brand'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <BrandCard padded>
    <h3 class="m-0 text-[14px] font-bold text-[var(--brand-text)]">{{ title }}</h3>
    <p v-if="description" class="m-0 mt-0.5 text-[12.5px] text-[var(--brand-text-quiet)]">{{ description }}</p>
    <div class="mt-3.5">
      <slot />
    </div>
  </BrandCard>
</template>
