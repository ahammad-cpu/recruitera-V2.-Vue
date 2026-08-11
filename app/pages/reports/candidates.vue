<script setup lang="ts">
import ReportsShell from '~/components/reports/ReportsShell.vue'
import CandidatesReportSection from '~/components/reports/sections/CandidatesReportSection.vue'

definePageMeta({ layout: 'default' })
</script>

<template>
  <ReportsShell>
    <CandidatesReportSection />
  </ReportsShell>
</template>
