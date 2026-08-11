<script setup lang="ts">
import CareerSiteGate from '~/components/careers/CareerSiteGate.vue'
import CareerSiteHeader from '~/components/careers/CareerSiteHeader.vue'
import CareerSiteFooter from '~/components/careers/CareerSiteFooter.vue'

definePageMeta({ layout: false })

const site = useCareerSite()
const { t } = useCareerSiteI18n()
const portal = useEmployeePortalStore()
onMounted(() => portal.restore())

const { forEmployee } = useReferrals()
const myReferrals = computed(() => forEmployee(portal.email ?? '').value)

const STATUS_TONE: Record<string, string> = {
  Submitted: 'var(--brand-status-pending-text)',
  Reviewing: 'var(--brand-status-pending-text)',
  Interviewing: 'var(--brand-status-pending-text)',
  Hired: 'var(--brand-status-approved-text)',
  'Bonus Paid': 'var(--brand-status-approved-text)',
  Ineligible: 'var(--brand-status-closed-text)',
}
</script>

<template>
  <CareerSiteGate>
    <div class="min-h-screen bg-white" :style="{ fontFamily: `${site.font}, system-ui, sans-serif` }">
      <CareerSiteHeader />

      <div v-if="!portal.isVerified" class="mx-auto max-w-[520px] px-6 py-16 text-center">
        <p class="text-[15px] font-semibold text-[var(--brand-preview-text-heading)]">This page is only visible to verified employees.</p>
        <NuxtLink to="/careers" class="mt-3 inline-block text-[13px] font-semibold no-underline" :style="{ color: site.primaryColor }">{{ t('nav_home') }} →</NuxtLink>
      </div>

      <template v-else>
        <div class="mx-auto max-w-[1200px] px-6 py-10">
          <p class="mb-1 text-[12.5px] font-semibold uppercase tracking-wide text-[var(--brand-preview-text-muted)]">Signed in as</p>
          <p class="mb-8 text-[14px] font-semibold text-[var(--brand-preview-text-secondary)]">{{ portal.email }}</p>

          <section id="referrals">
            <h1 class="mb-4 text-[22px] font-extrabold text-[var(--brand-preview-text-heading)]">{{ t('nav_my_referrals') }}</h1>
            <p v-if="myReferrals.some(r => r.isDemo)" class="mb-2.5 text-[12px] italic text-[var(--brand-preview-text-muted)]">Rows marked "(Demo)" are illustrative — they show what this list looks like once referrals exist.</p>
            <div v-if="myReferrals.length" class="overflow-hidden rounded-2xl border border-[var(--brand-preview-border-card)]">
              <table class="w-full text-left text-[13px]">
                <thead class="bg-[var(--brand-preview-surface-section)] text-[12px] text-[var(--brand-preview-text-label)]">
                  <tr>
                    <th class="px-4 py-2.5 font-semibold">Candidate</th>
                    <th class="px-4 py-2.5 font-semibold">Job</th>
                    <th class="px-4 py-2.5 font-semibold">Mode</th>
                    <th class="px-4 py-2.5 font-semibold">Status</th>
                    <th class="px-4 py-2.5 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in myReferrals" :key="r.id" class="border-t border-[var(--brand-preview-border-card)]">
                    <td class="px-4 py-2.5 font-medium text-[var(--brand-preview-text-heading)]">{{ r.candidateName }}</td>
                    <td class="px-4 py-2.5">{{ r.jobTitle }}</td>
                    <td class="px-4 py-2.5">{{ r.mode }}</td>
                    <td class="px-4 py-2.5 font-semibold" :style="{ color: STATUS_TONE[r.status] }">{{ r.status }}</td>
                    <td class="px-4 py-2.5 text-[var(--brand-preview-text-muted)]">{{ new Date(r.createdAt).toLocaleDateString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="text-[13.5px] text-[var(--brand-preview-text-muted)]">You haven't referred anyone yet. Open a job and click "Refer Someone" or copy your referral link to get started.</p>
          </section>
        </div>
      </template>

      <CareerSiteFooter />
    </div>
  </CareerSiteGate>
</template>
