<script setup lang="ts">
import { Check, ChevronDown, Phone, AlertTriangle, Users, Sparkles } from 'lucide-vue-next'
import SettingsPageHeader from '~/components/settings/SettingsPageHeader.vue'
import { BrandButton } from '~/components/brand'

definePageMeta({ layout: 'settings' })

interface Plan {
  id: string
  name: string
  tag: string
  badge?: string
  users: string
  annual: number | null // EGP/year; null = custom
  inherits?: string // "Everything in X, plus:"
  features: string[]
  support: string[]
  cta: string
}
const PLANS: Plan[] = [
  {
    id: 'basic', name: 'Basic', tag: 'Perfect for small teams looking for an easy-to-use ATS to organize hiring and manage candidates efficiently.',
    users: 'Up to 5 users', annual: 55000,
    features: ['Unlimited jobs', 'Post to multi job boards', 'Multi-channel job posting', 'Referral system', 'Standard career page', 'Team collaboration', 'Pipeline automation', 'AI-generated templates', 'Scheduling and interviews'],
    support: ['1 onboarding session', 'Email support'], cta: 'Choose Basic',
  },
  {
    id: 'pro', name: 'Pro', tag: 'Best for growing teams that need stronger workflows, collaboration, automation, and better hiring visibility.',
    badge: 'Most popular', users: 'Up to 25 users', annual: 96000, inherits: 'Everything in Basic, plus:',
    features: ['Chrome extension', 'Candidate CRM', 'Talent pool management', 'Knock-out questions', 'Questionnaire', 'Offer management', 'Custom special roles'],
    support: ['2 onboarding sessions', 'Monthly check-ins'], cta: 'Choose Pro',
  },
  {
    id: 'enterprise', name: 'Enterprise', tag: 'Ideal for complex hiring that requires structure, automation, reporting, and scalable team management.',
    users: 'Unlimited users', annual: null, inherits: 'Everything in Pro, plus:',
    features: ['Manpower Plan Module', 'Requisition management', 'AI-score weight adjustment', 'Custom integration', 'BI connector', 'Custom-made career page', 'Company website integration'],
    support: ['4 onboarding sessions', 'Dedicated CS manager', 'Bi-monthly check-ins'], cta: 'Contact sales',
  },
]
const ADDONS = ['WhatsApp integration', 'Extra LinkedIn credits', 'Extra WUZZUF credits', 'Extra Chrome extension credits']

const egp = (n: number) => `EGP ${n.toLocaleString('en-US')}`
const perMonth = (annual: number) => `EGP ${Math.round(annual / 12).toLocaleString('en-US')}`

// Feature comparison — B / P / E
const breakdownOpen = ref(false)
interface Row { label: string, b: boolean, p: boolean, e: boolean }
const FEATURES: { category: string, rows: Row[] }[] = [
  { category: 'Core ATS', rows: [
    { label: 'Unlimited jobs', b: true, p: true, e: true },
    { label: 'Multi-channel job posting', b: true, p: true, e: true },
    { label: 'Referral system', b: true, p: true, e: true },
    { label: 'Standard career page', b: true, p: true, e: true },
    { label: 'Team collaboration', b: true, p: true, e: true },
    { label: 'Pipeline automation', b: true, p: true, e: true },
    { label: 'AI-generated templates', b: true, p: true, e: true },
    { label: 'Scheduling and interviews', b: true, p: true, e: true },
  ] },
  { category: 'Growth', rows: [
    { label: 'Chrome extension', b: false, p: true, e: true },
    { label: 'Candidate CRM', b: false, p: true, e: true },
    { label: 'Talent pool management', b: false, p: true, e: true },
    { label: 'Knock-out questions', b: false, p: true, e: true },
    { label: 'Questionnaire', b: false, p: true, e: true },
    { label: 'Offer management', b: false, p: true, e: true },
    { label: 'Custom special roles', b: false, p: true, e: true },
  ] },
  { category: 'Enterprise', rows: [
    { label: 'Manpower Plan Module', b: false, p: false, e: true },
    { label: 'Requisition management', b: false, p: false, e: true },
    { label: 'AI-score weight adjustment', b: false, p: false, e: true },
    { label: 'Custom integration', b: false, p: false, e: true },
    { label: 'BI connector', b: false, p: false, e: true },
    { label: 'Custom-made career page', b: false, p: false, e: true },
    { label: 'Company website integration', b: false, p: false, e: true },
  ] },
  { category: 'Onboarding & support', rows: [
    { label: 'Onboarding sessions (1 / 2 / 4)', b: true, p: true, e: true },
    { label: 'Email support', b: true, p: true, e: true },
    { label: 'Monthly check-ins', b: false, p: true, e: true },
    { label: 'Dedicated CS manager', b: false, p: false, e: true },
  ] },
]

const requestSent = ref(false)
const closeOpen = ref(false)
const agree = ref(false)
</script>

<template>
  <div class="max-w-[1180px]">
    <SettingsPageHeader title="My Plan" subtitle="View your current plan, compare options, and manage your subscription." />

    <!-- Current plan -->
    <div class="text-[12px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)] mb-3">Your current plan</div>
    <div class="flex flex-col lg:flex-row gap-4 mb-8">
      <div class="flex-1 rounded-2xl border border-[var(--brand-border-light)] bg-white p-6">
        <h2 class="text-[26px] font-bold text-[var(--brand-text)]">Free Plan</h2>
        <div class="my-4 border-t border-[var(--brand-border-fade)]" />
        <div class="rounded-xl bg-[var(--brand-lime-tint)] p-4">
          <div class="text-[14px] font-bold text-[var(--brand-text)]">Upgrade to a paid plan</div>
          <div class="text-[13px] text-[var(--brand-text-secondary)] mt-0.5">Upgrade your plan to unlock more of Recruitera, including:</div>
          <ul class="mt-2 space-y-1 text-[13px] text-[var(--brand-text-secondary)] list-disc pl-5">
            <li>Unlimited jobs, multi-channel posting and referrals</li>
            <li>Candidate CRM, talent pools and offer management</li>
            <li>Manpower planning, requisitions and BI connectors</li>
          </ul>
        </div>
        <div class="mt-5 flex items-center justify-between">
          <span class="text-[26px] font-bold text-[var(--brand-text)]">Total</span>
          <span class="text-[26px] font-bold text-[var(--brand-text)]">EGP 0</span>
        </div>
      </div>

      <div class="lg:w-[320px] shrink-0 rounded-2xl border border-[var(--brand-border-light)] bg-white p-6 flex flex-col">
        <span class="w-14 h-14 rounded-full bg-[var(--brand-lime-tint)] grid place-items-center mb-4"><Phone class="w-6 h-6 text-[var(--brand-teal)]" /></span>
        <div class="text-[15px] font-bold text-[var(--brand-text)]">Questions about plan options?</div>
        <div class="text-[13px] text-[var(--brand-text-quiet)] mt-1 mb-4">Request a call and we'll be in touch soon.</div>
        <BrandButton :variant="requestSent ? 'ghost' : 'outline'" size="md" class="w-full" :disabled="requestSent" @click="requestSent = true">{{ requestSent ? 'Request sent' : 'Request a call' }}</BrandButton>
        <div class="mt-4 text-[13px] text-[var(--brand-text-quiet)]">Have other questions?</div>
        <a href="#" class="text-[13px] font-semibold text-[var(--brand-teal)] hover:underline">Talk to Support</a>
      </div>
    </div>

    <!-- Upgrade options -->
    <div class="text-[12px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)] mb-3">Upgrade plan options</div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 items-stretch">
      <div v-for="p in PLANS" :key="p.id" class="relative rounded-2xl border bg-white p-5 flex flex-col" :class="p.badge ? 'border-[var(--brand-teal)] pt-8' : 'border-[var(--brand-border-light)]'">
        <span v-if="p.badge" class="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 h-6 px-3 rounded-full bg-[var(--brand-text)] text-white text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"><Sparkles class="w-3 h-3" /> {{ p.badge }}</span>

        <h3 class="text-[26px] font-bold text-[var(--brand-text)]">{{ p.name }}</h3>
        <p class="text-[12.5px] text-[var(--brand-text-quiet)] leading-snug mt-1 min-h-[48px]">{{ p.tag }}</p>

        <div class="mt-3 inline-flex items-center gap-1.5 self-start h-7 px-2.5 rounded-full bg-[var(--brand-canvas)] text-[12.5px] font-semibold text-[var(--brand-text-secondary)]"><Users class="w-3.5 h-3.5" /> {{ p.users }}</div>

        <div class="mt-4">
          <template v-if="p.annual !== null">
            <div class="text-[28px] font-bold text-[var(--brand-text)] leading-none">{{ egp(p.annual) }}<span class="text-[14px] font-medium text-[var(--brand-text-quiet)]">/year</span></div>
            <div class="text-[12.5px] text-[var(--brand-text-quiet)] mt-1">≈ {{ perMonth(p.annual) }} / month, billed annually</div>
          </template>
          <template v-else>
            <div class="text-[28px] font-bold text-[var(--brand-text)] leading-none">Custom</div>
            <div class="text-[12.5px] text-[var(--brand-text-quiet)] mt-1">Tailored to your organization</div>
          </template>
        </div>

        <div class="my-4 border-t border-[var(--brand-border-fade)]" />

        <div class="flex-1">
          <div v-if="p.inherits" class="text-[13px] font-bold text-[var(--brand-text)] mb-2">{{ p.inherits }}</div>
          <ul class="space-y-1.5">
            <li v-for="f in p.features" :key="f" class="flex items-start gap-2 text-[13px] text-[var(--brand-text-secondary)]"><Check class="w-3.5 h-3.5 text-[var(--brand-status-approved-text)] shrink-0 mt-0.5" stroke-width="2.5" /> {{ f }}</li>
          </ul>
          <div class="mt-3 pt-3 border-t border-[var(--brand-border-fade)] space-y-1.5">
            <div v-for="s in p.support" :key="s" class="flex items-start gap-2 text-[12.5px] text-[var(--brand-text-quiet)]"><Check class="w-3.5 h-3.5 text-[var(--brand-text-faint)] shrink-0 mt-0.5" stroke-width="2.5" /> {{ s }}</div>
          </div>
        </div>

        <button type="button" class="mt-5 w-full h-11 rounded-lg text-[14px] font-bold transition" :class="p.badge ? 'bg-[var(--brand-teal)] text-white hover:brightness-110' : 'border border-[var(--brand-teal)] text-[var(--brand-teal)] hover:bg-[var(--brand-lime-tint-hover)]'">{{ p.cta }}</button>
      </div>
    </div>

    <!-- Add-ons -->
    <div class="rounded-2xl border border-[var(--brand-border-light)] bg-white p-5 mb-8">
      <div class="text-[14px] font-bold text-[var(--brand-text)]">Add-ons</div>
      <div class="text-[13px] text-[var(--brand-text-quiet)] mb-3">Extend any paid plan with usage-based add-ons.</div>
      <div class="flex flex-wrap gap-2">
        <span v-for="a in ADDONS" :key="a" class="inline-flex items-center h-8 px-3 rounded-lg border border-[var(--brand-border)] text-[13px] font-semibold text-[var(--brand-text-secondary)]">{{ a }}</span>
      </div>
    </div>

    <!-- Feature breakdown -->
    <div class="rounded-2xl border border-[var(--brand-border-light)] bg-white overflow-hidden mb-8">
      <button type="button" class="w-full flex items-center justify-between px-6 py-4" @click="breakdownOpen = !breakdownOpen">
        <div><div class="text-[15px] font-bold text-[var(--brand-text)]">Full feature breakdown</div><div class="text-[13px] text-[var(--brand-text-quiet)]">View which features are included in each plan.</div></div>
        <span class="w-9 h-9 rounded-lg bg-[var(--brand-canvas)] grid place-items-center"><ChevronDown class="w-4.5 h-4.5 text-[var(--brand-text-secondary)] transition-transform" :class="breakdownOpen ? 'rotate-180' : ''" /></span>
      </button>
      <div v-if="breakdownOpen" class="border-t border-[var(--brand-border-light)]">
        <div class="grid px-6 py-2.5 border-b border-[var(--brand-border-light)] text-[12px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)]" style="grid-template-columns:1fr 130px 130px 130px">
          <div>Feature category</div><div class="text-center">Basic</div><div class="text-center">Pro</div><div class="text-center">Enterprise</div>
        </div>
        <template v-for="cat in FEATURES" :key="cat.category">
          <div class="px-6 py-2.5 bg-[color-mix(in_srgb,var(--brand-pipeline-blue)_7%,white)] text-[13.5px] font-bold text-[var(--brand-text)]">{{ cat.category }}</div>
          <div v-for="r in cat.rows" :key="r.label" class="grid items-center px-6 py-2.5 border-b border-[var(--brand-border-fade)] text-[13.5px]" style="grid-template-columns:1fr 130px 130px 130px">
            <div class="text-[var(--brand-text)]">{{ r.label }}</div>
            <div v-for="cell in [r.b, r.p, r.e]" :key="String(cell)" class="grid place-items-center">
              <Check v-if="cell" class="w-4.5 h-4.5 text-[var(--brand-status-approved-text)]" stroke-width="2.5" />
              <span v-else class="text-[var(--brand-text-faint)]">—</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Close account -->
    <div class="rounded-2xl border border-[var(--brand-border-light)] bg-white p-6 mb-10">
      <div class="text-center text-[13.5px] text-[var(--brand-text-secondary)]">You can also <button type="button" class="font-semibold text-[var(--brand-teal)] hover:underline" @click="closeOpen = !closeOpen">close your account</button></div>
      <div v-if="closeOpen" class="mt-5">
        <div class="rounded-xl border border-[var(--brand-danger)]/40 bg-[var(--brand-status-closed-bg)] p-4">
          <div class="flex items-center gap-2 text-[14px] font-bold text-[var(--brand-status-closed-text)]"><AlertTriangle class="w-4.5 h-4.5" /> Warning!</div>
          <p class="text-[13px] text-[var(--brand-text-secondary)] mt-1.5">Be aware that closing your account will delete your data and this cannot be undone. If you wish to use Recruitera in the future, there will be no way to retrieve the data from this account.</p>
        </div>
        <label class="flex items-center gap-2 mt-4 mb-5 text-[13.5px] text-[var(--brand-text)] cursor-pointer"><input v-model="agree" type="checkbox" class="accent-[var(--brand-danger)]"> I understand my data will be deleted</label>
        <div class="border-t border-[var(--brand-border-light)] -mx-6 px-6 pt-5 flex items-center gap-4">
          <button type="button" class="h-11 px-5 rounded-lg text-[13.5px] font-bold text-white transition" :class="agree ? 'hover:brightness-110 cursor-pointer' : 'cursor-not-allowed'" :style="{ backgroundColor: agree ? 'var(--brand-danger)' : '#eda69c' }" :disabled="!agree">Permanently close my account</button>
          <button type="button" class="text-[13.5px] font-semibold text-[var(--brand-text-secondary)] hover:text-[var(--brand-text)] transition" @click="closeOpen = false; agree = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
