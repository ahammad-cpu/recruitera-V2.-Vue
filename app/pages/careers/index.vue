<!--
  Career site — HOME at /careers. Opportunities and Job detail are real
  sub-routes (/careers/opportunities, /careers/jobs/[id]).
-->
<script setup lang="ts">
definePageMeta({ layout: false })
function goJob(id: string) { navigateTo(`/careers/jobs/${id}`) }
function goOpp() { navigateTo('/careers/opportunities') }
</script>

<template>
  <CareerShell hero-overlap>
    <CareerHome @open-job="goJob" @view-all="goOpp" />
  </CareerShell>
</template>
