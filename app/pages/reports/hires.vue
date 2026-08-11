<script setup lang="ts">
import ReportsShell from '~/components/reports/ReportsShell.vue'
import HiresReportSection from '~/components/reports/sections/HiresReportSection.vue'

definePageMeta({ layout: 'default' })
</script>

<template>
  <ReportsShell>
    <HiresReportSection />
  </ReportsShell>
</template>
