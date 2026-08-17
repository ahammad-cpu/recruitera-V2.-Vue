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

const { companyName: nameProp, heroOverlap = false, active = 'home' } = defineProps<{ companyName?: string; heroOverlap?: boolean; active?: 'home' | 'opportunities' }>()
const emit = defineEmits<{ navigate: [view: 'home' | 'opportunities'] }>()
const { themeVars, forEmployeesOn, logoUrl } = useCareerSite()
const { data: company } = useCompany()
const companyName = computed(() => nameProp || company.value?.name || 'Your Company')
const isHome = computed(() => active === 'home')
</script>

<template>
  <div class="cc-root relative min-h-screen bg-white text-[color-mix(in_srgb,var(--cc-header)_92%,transparent)]" :style="themeVars">
    <!-- Header — floating rounded pill (dark bar, primary CTA). Overlaps the
         hero on home so the cover shows around it; floats on light pages otherwise. -->
    <header class="sticky top-0 z-40 px-4 pt-4" :class="heroOverlap ? '-mb-[80px]' : ''">
      <div class="mx-auto max-w-[1200px]">
        <div class="rounded-[22px] px-5 md:px-7 h-16 flex items-center gap-8 shadow-[0_14px_38px_rgba(10,15,25,0.28)]" :style="{ background: 'var(--cc-header)' }">
          <button type="button" class="flex items-center gap-2.5 shrink-0" @click="emit('navigate', 'home')">
            <img v-if="logoUrl" :src="logoUrl" alt="" class="h-9 max-w-[150px] object-contain">
            <template v-else>
              <span class="w-9 h-9 rounded-[10px] inline-flex items-center justify-center font-extrabold text-[15px] text-white" :style="{ background: 'var(--cc-primary)' }">{{ companyName.charAt(0) }}</span>
              <span class="text-[17px] font-bold text-white tracking-[-0.01em]">{{ companyName }}</span>
            </template>
          </button>
          <nav class="hidden sm:flex items-center gap-7 text-[15px] font-semibold">
            <button type="button" class="transition" :style="isHome ? { color: 'var(--cc-primary)' } : {}" :class="isHome ? '' : 'text-white/65 hover:text-white'" @click="emit('navigate', 'home')">Home</button>
            <button type="button" class="transition" :style="!isHome ? { color: 'var(--cc-primary)' } : {}" :class="!isHome ? '' : 'text-white/65 hover:text-white'" @click="emit('navigate', 'opportunities')">Opportunities</button>
          </nav>
          <div class="ml-auto flex items-center gap-2.5">
            <button v-if="forEmployeesOn" type="button" class="h-10 px-5 rounded-[999px] text-[13.5px] font-bold text-white transition hover:brightness-110" :style="{ background: 'var(--cc-primary)' }">For Employees</button>
            <button type="button" class="h-10 px-3.5 rounded-[999px] border border-white/25 text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-white/10 transition" aria-label="Switch language"><Globe class="w-4 h-4" stroke-width="1.9" /> العربية</button>
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
