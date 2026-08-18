<!-- Career site — OPPORTUNITIES at /careers/opportunities. -->
<script setup lang="ts">
definePageMeta({ layout: false })
function goJob(id: string) { navigateTo(`/careers/jobs/${id}`) }
</script>

<template>
  <CareerShell hero-overlap>
    <CareerOpportunities @open-job="goJob" />
  </CareerShell>
</template>
