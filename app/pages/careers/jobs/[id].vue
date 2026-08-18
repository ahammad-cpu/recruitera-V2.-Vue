<!-- Career site — JOB detail at /careers/jobs/[id]. -->
<script setup lang="ts">
definePageMeta({ layout: false })
const route = useRoute()
const jobId = computed(() => String(route.params.id))
function back() { navigateTo('/careers/opportunities') }
</script>

<template>
  <CareerShell hero-overlap>
    <CareerJob :job-id="jobId" @back="back" />
  </CareerShell>
</template>
