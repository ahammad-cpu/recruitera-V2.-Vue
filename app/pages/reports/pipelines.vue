<script setup lang="ts">
import ReportsShell from '~/components/reports/ReportsShell.vue'
import PipelinesReportSection from '~/components/reports/sections/PipelinesReportSection.vue'

definePageMeta({ layout: 'default' })
</script>

<template>
  <ReportsShell>
    <PipelinesReportSection />
  </ReportsShell>
</template>
