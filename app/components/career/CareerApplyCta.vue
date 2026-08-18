<!-- General Application / Talent Pool CTA — shared by Home and Opportunities. -->
<script setup lang="ts">
import { useCareerSite } from '~/composables/useCareerSite'
const { forEmployeesOn } = useCareerSite()
</script>

<template>
  <section v-if="forEmployeesOn" class="mx-auto max-w-[1160px] px-6 pb-16 md:pb-24">
    <div class="rounded-[20px] p-8 md:p-10 flex flex-wrap items-center justify-between gap-5" :style="{ background: 'var(--cc-header)' }">
      <div class="text-white">
        <div class="text-[20px] font-bold">Can't find your desired job?</div>
        <div class="mt-1 text-[14px] text-white/70">Apply through General Application and join our Talent Pool for future hiring.</div>
      </div>
      <button type="button" class="h-12 px-6 rounded-[13px] text-[15px] font-bold text-white transition duration-150 hover:brightness-110 active:scale-[0.97]" :style="{ background: 'var(--cc-primary)' }">Join Talent Pool</button>
    </div>
  </section>
</template>
