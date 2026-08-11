<script setup lang="ts">
import ReportsShell from '~/components/reports/ReportsShell.vue'
import InterviewsReportSection from '~/components/reports/sections/InterviewsReportSection.vue'

definePageMeta({ layout: 'default' })
</script>

<template>
  <ReportsShell>
    <InterviewsReportSection />
  </ReportsShell>
</template>
