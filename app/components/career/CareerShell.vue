<!--
  CareerShell — chrome for the public career pages (Home / Opportunities / Job).
  Applies the company theme from useCareerSite() (colors + font as CSS vars),
  renders the header (logo, nav, For Employees, language) and footer. Content
  goes in the default slot. Everything themable is driven by Settings.
-->
<script setup lang="ts">
import { Globe } from 'lucide-vue-next'
import { useCareerSite } from '~/composables/useCareerSite'
import { useCompany } from '~/composables/useCompany'

const { companyName: nameProp } = defineProps<{ companyName?: string }>()
const { themeVars, forEmployeesOn, logoUrl } = useCareerSite()
const { data: company } = useCompany()
const companyName = computed(() => nameProp || company.value?.name || 'Your Company')
const route = useRoute()
const isHome = computed(() => route.path === '/career-site')
</script>

<template>
  <div class="cc-root min-h-screen bg-white text-[color-mix(in_srgb,var(--cc-header)_92%,transparent)]" :style="themeVars">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[#eceef1]">
      <div class="mx-auto max-w-[1160px] px-6 h-[68px] flex items-center gap-8">
        <NuxtLink to="/career-site" class="flex items-center gap-2.5 shrink-0">
          <img v-if="logoUrl" :src="logoUrl" alt="" class="w-9 h-9 rounded-[10px] object-cover">
          <span v-else class="w-9 h-9 rounded-[10px] inline-flex items-center justify-center font-extrabold text-[15px] text-white" :style="{ background: 'var(--cc-primary)' }">{{ companyName.charAt(0) }}</span>
          <span class="text-[17px] font-bold tracking-[-0.01em]" :style="{ color: 'var(--cc-header)' }">{{ companyName }}</span>
        </NuxtLink>
        <nav class="hidden sm:flex items-center gap-7 text-[15px] font-semibold">
          <NuxtLink to="/career-site" class="transition" :style="isHome ? { color: 'var(--cc-primary)' } : {}" :class="isHome ? '' : 'text-[#4b5563] hover:opacity-70'">Home</NuxtLink>
          <NuxtLink to="/career-site/opportunities" class="transition" :style="!isHome ? { color: 'var(--cc-primary)' } : {}" :class="!isHome ? '' : 'text-[#4b5563] hover:opacity-70'">Opportunities</NuxtLink>
        </nav>
        <div class="ml-auto flex items-center gap-3">
          <button v-if="forEmployeesOn" type="button" class="h-10 px-4 rounded-[11px] border-[1.5px] text-[13.5px] font-semibold transition hover:bg-[color-mix(in_srgb,var(--cc-primary)_8%,white)]" :style="{ borderColor: 'var(--cc-primary)', color: 'var(--cc-primary)' }">For Employees</button>
          <button type="button" class="h-10 px-3.5 rounded-[11px] text-white text-[13px] font-semibold inline-flex items-center gap-1.5" :style="{ background: 'var(--cc-header)' }" aria-label="Switch language"><Globe class="w-4 h-4" stroke-width="1.9" /> العربية</button>
        </div>
      </div>
    </header>

    <slot />

    <!-- Footer -->
    <footer class="border-t border-[#eceef1] bg-white">
      <div class="mx-auto max-w-[1160px] px-6 py-10 text-center">
        <div class="text-[15px] font-bold" :style="{ color: 'var(--cc-header)' }">{{ companyName }}</div>
        <div class="mt-1 text-[12.5px] text-[#8a919c]">© {{ companyName }} · Careers powered by Recruitera</div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.cc-root{ font-family: var(--cc-font), -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
</style>
