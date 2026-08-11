<script setup lang="ts">
import ReportsShell from '~/components/reports/ReportsShell.vue'
import DisqualificationsReportSection from '~/components/reports/sections/DisqualificationsReportSection.vue'

definePageMeta({ layout: 'default' })
</script>

<template>
  <ReportsShell>
    <DisqualificationsReportSection />
  </ReportsShell>
</template>
