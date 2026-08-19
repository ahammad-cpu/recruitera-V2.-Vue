<!--
  CareerShell — chrome for the public career pages (Home / Opportunities / Job).
  Applies the company theme from useCareerSite() (colors + font as CSS vars),
  renders the header (logo, nav, For Employees, language) and footer. Content
  goes in the default slot. Everything themable is driven by Settings.
-->
<script setup lang="ts">
import { Globe, Menu, X } from 'lucide-vue-next'
import { useCareerSite } from '~/composables/useCareerSite'
import { useCompany } from '~/composables/useCompany'

const { companyName: nameProp, heroOverlap = false } = defineProps<{ companyName?: string; heroOverlap?: boolean }>()
const { themeVars, forEmployeesOn, logoUrl, headerSticky, headerFullWidth } = useCareerSite()
const { data: company } = useCompany()
const route = useRoute()
const companyName = computed(() => nameProp || company.value?.name || 'Your Company')
const isHome = computed(() => !route.path.startsWith('/careers/opportunities'))
const menuOpen = ref(false)
watch(() => route.path, () => { menuOpen.value = false })
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
        <div class="mx-auto max-w-[1200px] px-4 sm:px-5 md:px-7 h-16 flex items-center gap-4 sm:gap-8">
          <NuxtLink to="/careers" class="flex items-center gap-2.5 shrink-0 min-w-0">
            <img v-if="logoUrl" :src="logoUrl" alt="" class="h-8 sm:h-9 max-w-[130px] sm:max-w-[150px] object-contain">
            <template v-else>
              <span class="w-9 h-9 rounded-[10px] inline-flex items-center justify-center font-extrabold text-[15px] text-white shrink-0" :style="{ background: 'var(--cc-primary)' }">{{ companyName.charAt(0) }}</span>
              <span class="text-[16px] sm:text-[17px] font-bold text-white tracking-[-0.01em] truncate">{{ companyName }}</span>
            </template>
          </NuxtLink>
          <nav class="hidden sm:flex items-center gap-7 text-[15px] font-semibold">
            <NuxtLink to="/careers" class="transition" :style="isHome ? { color: 'var(--cc-primary)' } : {}" :class="isHome ? '' : 'text-white/65 hover:text-white'">Home</NuxtLink>
            <NuxtLink to="/careers/opportunities" class="transition" :style="!isHome ? { color: 'var(--cc-primary)' } : {}" :class="!isHome ? '' : 'text-white/65 hover:text-white'">Opportunities</NuxtLink>
          </nav>
          <div class="ml-auto flex items-center gap-2.5">
            <!-- desktop actions -->
            <button v-if="forEmployeesOn" type="button" class="hidden sm:inline-flex items-center justify-center leading-none h-10 px-5 rounded-[999px] text-[13.5px] font-bold text-white transition duration-150 hover:brightness-110 active:scale-[0.96]" :style="{ background: 'var(--cc-primary)' }">For Employees</button>
            <button type="button" class="hidden sm:inline-flex h-10 px-3.5 rounded-[999px] border border-white/25 text-white text-[13px] font-semibold items-center gap-1.5 hover:bg-white/10 transition duration-150 active:scale-[0.96]" aria-label="Switch language"><Globe class="w-4 h-4" stroke-width="1.9" /> العربية</button>
            <!-- mobile menu button -->
            <button type="button" class="sm:hidden w-11 h-11 -mr-1.5 rounded-[12px] grid place-items-center text-white transition active:scale-90" :aria-expanded="menuOpen" aria-label="Menu" @click="menuOpen = !menuOpen">
              <X v-if="menuOpen" class="w-6 h-6" stroke-width="2" />
              <Menu v-else class="w-6 h-6" stroke-width="2" />
            </button>
          </div>
        </div>

        <!-- Mobile dropdown menu -->
        <Transition name="cc-menu">
          <nav v-if="menuOpen" class="sm:hidden border-t border-white/10 px-4 pt-2 pb-4">
            <NuxtLink to="/careers" class="flex items-center h-12 px-3 rounded-[12px] text-[16px] font-semibold transition active:scale-[0.98]" :style="isHome ? { color: 'var(--cc-primary)' } : {}" :class="isHome ? '' : 'text-white/80 hover:bg-white/5'">Home</NuxtLink>
            <NuxtLink to="/careers/opportunities" class="flex items-center h-12 px-3 rounded-[12px] text-[16px] font-semibold transition active:scale-[0.98]" :style="!isHome ? { color: 'var(--cc-primary)' } : {}" :class="!isHome ? '' : 'text-white/80 hover:bg-white/5'">Opportunities</NuxtLink>
            <div class="mt-3 flex flex-col gap-2.5">
              <button v-if="forEmployeesOn" type="button" class="flex items-center justify-center leading-none h-12 rounded-[12px] text-[15px] font-bold text-white transition active:scale-[0.98]" :style="{ background: 'var(--cc-primary)' }">For Employees</button>
              <button type="button" class="h-12 rounded-[12px] border border-white/25 text-white text-[15px] font-semibold inline-flex items-center justify-center gap-1.5 transition active:scale-[0.98]"><Globe class="w-4 h-4" stroke-width="1.9" /> العربية</button>
            </div>
          </nav>
        </Transition>
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
/* Mobile menu: materialize (fade + slight rise), gentle spring-ish ease. */
.cc-menu-enter-active, .cc-menu-leave-active { transition: opacity .2s ease, transform .24s cubic-bezier(0.22, 1, 0.36, 1); }
.cc-menu-enter-from, .cc-menu-leave-to { opacity: 0; transform: translateY(-8px); }
@media (prefers-reduced-motion: reduce) {
  .cc-menu-enter-active, .cc-menu-leave-active { transition: opacity .15s ease; }
  .cc-menu-enter-from, .cc-menu-leave-to { transform: none; }
}
</style>
