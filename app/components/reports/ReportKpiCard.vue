<!-- One KPI stat card — used across every report section's top row. -->
<script setup lang="ts">
import type { KpiCard } from '~/types'
import { BrandCard } from '~/components/brand'

defineProps<{
  kpi: KpiCard
  loading?: boolean
}>()
</script>

<template>
  <BrandCard padded class="min-w-0">
    <div v-if="loading" class="animate-pulse">
      <div class="h-3 w-24 rounded bg-[var(--brand-border-light)] mb-3" />
      <div class="h-7 w-16 rounded bg-[var(--brand-border-light)]" />
    </div>
    <template v-else>
      <p class="m-0 text-[12px] font-semibold text-[var(--brand-text-quiet)] uppercase tracking-[0.03em] truncate">
        {{ kpi.label }}
      </p>
      <p
        class="m-0 mt-1.5 text-[26px] font-bold leading-none"
        :class="kpi.danger ? 'text-[var(--brand-danger)]' : 'text-[var(--brand-text)]'"
      >
        {{ kpi.value }}
      </p>
      <p v-if="kpi.sublabel" class="m-0 mt-1.5 text-[12px] text-[var(--brand-text-quiet)]">
        {{ kpi.sublabel }}
      </p>
    </template>
  </BrandCard>
</template>
