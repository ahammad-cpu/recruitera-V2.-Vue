<script setup lang="ts">
import ReportsShell from '~/components/reports/ReportsShell.vue'
import EvaluationsReportSection from '~/components/reports/sections/EvaluationsReportSection.vue'

definePageMeta({ layout: 'default' })
</script>

<template>
  <ReportsShell>
    <EvaluationsReportSection />
  </ReportsShell>
</template>
