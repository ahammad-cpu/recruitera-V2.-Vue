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

const { companyName: nameProp, heroOverlap = false } = defineProps<{ companyName?: string; heroOverlap?: boolean }>()
const { themeVars, forEmployeesOn, logoUrl, headerSticky, headerFullWidth } = useCareerSite()
const { data: company } = useCompany()
const route = useRoute()
const companyName = computed(() => nameProp || company.value?.name || 'Your Company')
const isHome = computed(() => !route.path.startsWith('/careers/opportunities'))
</script>

<template>
  <div class="cc-root relative min-h-screen bg-white text-[color-mix(in_srgb,var(--cc-header)_92%,transparent)]" :style="themeVars">
    <!-- Header — full-width bar or floating rounded pill, sticky or static
         (both driven by Settings). Overlaps the hero on home so the cover
         shows around/behind it. -->
    <header
      class="z-40"
      :class="[
        headerSticky ? 'sticky top-0' : 'relative',
        headerFullWidth ? '' : 'px-4 pt-4',
        heroOverlap ? (headerFullWidth ? '-mb-16' : '-mb-[80px]') : '',
      ]">
      <div
        :class="headerFullWidth
          ? 'shadow-[0_2px_16px_rgba(0,0,0,0.14)]'
          : 'mx-auto max-w-[1200px] rounded-[22px] overflow-hidden shadow-[0_14px_38px_rgba(10,15,25,0.28)]'"
        :style="{ background: 'var(--cc-header)' }">
        <div class="mx-auto max-w-[1200px] px-5 md:px-7 h-16 flex items-center gap-8">
          <NuxtLink to="/careers" class="flex items-center gap-2.5 shrink-0">
            <img v-if="logoUrl" :src="logoUrl" alt="" class="h-9 max-w-[150px] object-contain">
            <template v-else>
              <span class="w-9 h-9 rounded-[10px] inline-flex items-center justify-center font-extrabold text-[15px] text-white" :style="{ background: 'var(--cc-primary)' }">{{ companyName.charAt(0) }}</span>
              <span class="text-[17px] font-bold text-white tracking-[-0.01em]">{{ companyName }}</span>
            </template>
          </NuxtLink>
          <nav class="hidden sm:flex items-center gap-7 text-[15px] font-semibold">
            <NuxtLink to="/careers" class="transition" :style="isHome ? { color: 'var(--cc-primary)' } : {}" :class="isHome ? '' : 'text-white/65 hover:text-white'">Home</NuxtLink>
            <NuxtLink to="/careers/opportunities" class="transition" :style="!isHome ? { color: 'var(--cc-primary)' } : {}" :class="!isHome ? '' : 'text-white/65 hover:text-white'">Opportunities</NuxtLink>
          </nav>
          <div class="ml-auto flex items-center gap-2.5">
            <button v-if="forEmployeesOn" type="button" class="h-10 px-5 rounded-[999px] text-[13.5px] font-bold text-white transition duration-150 hover:brightness-110 active:scale-[0.96]" :style="{ background: 'var(--cc-primary)' }">For Employees</button>
            <button type="button" class="h-10 px-3.5 rounded-[999px] border border-white/25 text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-white/10 transition duration-150 active:scale-[0.96]" aria-label="Switch language"><Globe class="w-4 h-4" stroke-width="1.9" /> العربية</button>
          </div>
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
