<script setup lang="ts">
import ReportsShell from '~/components/reports/ReportsShell.vue'
import JobsReportSection from '~/components/reports/sections/JobsReportSection.vue'

definePageMeta({ layout: 'default' })
</script>

<template>
  <ReportsShell>
    <JobsReportSection />
  </ReportsShell>
</template>
