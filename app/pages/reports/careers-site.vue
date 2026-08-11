<script setup lang="ts">
import ReportsShell from '~/components/reports/ReportsShell.vue'
import CareersSiteReportSection from '~/components/reports/sections/CareersSiteReportSection.vue'

definePageMeta({ layout: 'default' })
</script>

<template>
  <ReportsShell>
    <CareersSiteReportSection />
  </ReportsShell>
</template>
