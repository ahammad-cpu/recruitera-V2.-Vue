<!--
  Career site — the single public page at /careers. Home, Opportunities, and
  Job detail + Apply are in-page views switched by state (no sub-routes). All
  content + colors come from useCareerSite() (Settings → Career Site).
-->
<script setup lang="ts">
definePageMeta({ layout: false })

const view = ref<'home' | 'opportunities' | 'job'>('home')
const activeJobId = ref('')

function scrollTop() { if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' }) }
function openJob(id: string) { activeJobId.value = id; view.value = 'job'; scrollTop() }
function goOpportunities() { view.value = 'opportunities'; scrollTop() }
function navigate(v: 'home' | 'opportunities') { view.value = v; scrollTop() }
</script>

<template>
  <CareerShell
    :hero-overlap="view === 'home'"
    :active="view === 'opportunities' ? 'opportunities' : 'home'"
    @navigate="navigate"
  >
    <CareerHome v-if="view === 'home'" @open-job="openJob" @view-all="goOpportunities" />
    <CareerOpportunities v-else-if="view === 'opportunities'" @open-job="openJob" />
    <CareerJob v-else :job-id="activeJobId" @back="goOpportunities" />
  </CareerShell>
</template>
