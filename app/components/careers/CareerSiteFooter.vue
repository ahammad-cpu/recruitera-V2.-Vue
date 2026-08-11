<script setup lang="ts">
const site = useCareerSite()
const { data: companyData } = useCompany()
const companyName = computed(() => companyData.value?.name || 'Your Company')
</script>

<template>
  <footer class="border-t border-black/5 px-6 py-6 text-center" :style="{ fontFamily: `${site.font}, system-ui, sans-serif` }">
    <div class="text-[13px] font-medium" :style="{ color: site.headerColor }">{{ companyName }}</div>
    <div class="text-[11.5px] text-[var(--brand-preview-text-muted)]">{{ site.subdomain }}.recruitera.ai · © 2026 · Powered by Recruitera</div>
  </footer>
</template>
