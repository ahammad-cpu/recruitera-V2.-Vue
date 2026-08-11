<script setup lang="ts">
import {
  Check,
  ChevronDown,
  Clock,
  Copy,
  ExternalLink,
  Gem,
  Globe,
  IdCard,
  Image as ImageIcon,
  Inbox,
  LayoutTemplate,
  Lock,
  MapPin,
  Monitor,
  Palette,
  Pencil,
  Play,
  Quote,
  Smartphone,
  Trash2,
  Upload,
  X,
  Youtube,
} from 'lucide-vue-next'
import { onBeforeRouteLeave } from 'vue-router'
import { BrandButton, BrandStatusBadge } from '~/components/brand'
import { Switch } from '~/components/ui/switch'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Dialog, DialogScrollContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import SettingsConfirmDialog from '~/components/settings/SettingsConfirmDialog.vue'
import { CAREER_SITE_VALUE_ICONS } from '~/composables/useCareerSite'
import type { CareerSiteTestimonial, CareerSiteValue } from '~/composables/useCareerSite'

definePageMeta({ layout: 'settings' })

// Shared with the public /careers/* site and this preview — editing here is
// what "live site reflects branding immediately" (PRD UC-01) means in a
// no-backend prototype: there's one copy of the config, not a draft + a fetch.
const site = useCareerSite()
const {
  generalApplicationOn, forEmployeesOn, published,
  primaryColor, headerColor, btnColor, ctaColor, font,
  headline, intro, videoUrl, values, testimonials, subdomain, coverUrl,
} = toRefs(site)

const { data: companyData } = useCompany()
const companyName = computed(() => companyData.value?.name || 'Your Company')
const companyInitials = computed(() => companyName.value.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?')

function onCoverChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { coverUrl.value = String(reader.result) }
  reader.readAsDataURL(file)
}
const removeCoverConfirmOpen = ref(false)
function confirmRemoveCover() {
  coverUrl.value = ''
  removeCoverConfirmOpen.value = false
}

// ─────────────── Accordions ───────────────
type AccordionKey = 'branding' | 'hero' | 'video' | 'values' | 'testimonials' | 'employees' | 'publish'
const openAccordions = reactive<Record<AccordionKey, boolean>>({
  branding: true,
  hero: false,
  video: false,
  values: false,
  testimonials: false,
  employees: false,
  publish: false,
})
function toggleAccordion(key: AccordionKey) {
  openAccordions[key] = !openAccordions[key]
}

const SECTIONS: { key: AccordionKey, label: string, icon: any }[] = [
  { key: 'branding', label: 'Branding', icon: Palette },
  { key: 'hero', label: 'Hero', icon: LayoutTemplate },
  { key: 'video', label: 'Culture video', icon: Youtube },
  { key: 'values', label: 'Values', icon: Gem },
  { key: 'testimonials', label: 'Testimonials', icon: Quote },
  { key: 'employees', label: 'For Employees', icon: IdCard },
  { key: 'publish', label: 'Publish & URL', icon: Globe },
]

function onPrimaryChange(v: string) {
  primaryColor.value = v
  ctaColor.value = v
}
function onBtnChange(v: string) {
  btnColor.value = v
  ctaColor.value = v
}
function hexInput(v: string, setter: (v: string) => void) {
  if (/^#[0-9a-fA-F]{6}$/.test(v)) setter(v)
}

const FONTS = ['Geist', 'Inter', 'Lato', 'Manrope', 'DM Sans', 'Plus Jakarta Sans']

// ─────────────── Values ───────────────
const VALUE_ICONS = CAREER_SITE_VALUE_ICONS
function removeValue(i: number) {
  values.value.splice(i, 1)
}
// Add/Edit Value — pop-up dialog
const valueModalOpen = ref(false)
const editingValueIndex = ref<number | null>(null)
const valueDraft = reactive<CareerSiteValue>({ icon: 0, name: '', desc: '' })
const valueValid = computed(() => valueDraft.name.trim().length > 0)
function openAddValue() {
  editingValueIndex.value = null
  Object.assign(valueDraft, { icon: 0, name: '', desc: '' })
  valueModalOpen.value = true
}
function openEditValue(i: number) {
  editingValueIndex.value = i
  Object.assign(valueDraft, JSON.parse(JSON.stringify(values.value[i])))
  valueModalOpen.value = true
}
function saveValue() {
  if (!valueValid.value) return
  const v: CareerSiteValue = { icon: valueDraft.icon, name: valueDraft.name.trim(), desc: valueDraft.desc.trim() }
  if (editingValueIndex.value === null) values.value.push(v)
  else values.value[editingValueIndex.value] = v
  valueModalOpen.value = false
}

// ─────────────── Testimonials ───────────────
function removeTestimonial(i: number) {
  testimonials.value.splice(i, 1)
}
// Add/Edit Testimonial — pop-up dialog
const testimonialModalOpen = ref(false)
const editingTestimonialIndex = ref<number | null>(null)
const testimonialDraft = reactive<CareerSiteTestimonial>({ name: '', role: '', quote: '', photo: '' })
const testimonialValid = computed(() => testimonialDraft.name.trim().length > 0 && testimonialDraft.quote.trim().length > 0)
function openAddTestimonial() {
  editingTestimonialIndex.value = null
  Object.assign(testimonialDraft, { name: '', role: '', quote: '', photo: '' })
  testimonialModalOpen.value = true
}
function openEditTestimonial(i: number) {
  editingTestimonialIndex.value = i
  Object.assign(testimonialDraft, { photo: '', ...JSON.parse(JSON.stringify(testimonials.value[i])) })
  testimonialModalOpen.value = true
}
function onTestimonialPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { testimonialDraft.photo = String(reader.result) }
  reader.readAsDataURL(file)
}
function saveTestimonial() {
  if (!testimonialValid.value) return
  const t: CareerSiteTestimonial = { name: testimonialDraft.name.trim(), role: testimonialDraft.role.trim(), quote: testimonialDraft.quote.trim(), photo: testimonialDraft.photo || '' }
  if (editingTestimonialIndex.value === null) testimonials.value.push(t)
  else testimonials.value[editingTestimonialIndex.value] = t
  testimonialModalOpen.value = false
}
function initials(name: string) {
  return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'
}

// ─────────────── Employees domain ───────────────
// Cosmetic here — the real, multi-domain source of truth for "For Employees"
// verification lives in Settings → Employee Hub (useEmployeeHub()).
const employeeDomain = ref('acme.co')

// ─────────────── Publish & URL ───────────────
// Cosmetic marketing text shown inside the browser-chrome mockup. The real
// "Visit site" / "Copy link" targets are the in-app /careers route below —
// there's no DNS in this prototype to resolve a real subdomain.
const previewDomain = computed(() => `${subdomain.value}.recruitera.ai`)
const publicSiteUrl = computed(() => `${typeof window !== 'undefined' ? window.location.origin : ''}/careers`)

const copied = ref(false)
async function copyLink() {
  try { await navigator.clipboard.writeText(publicSiteUrl.value) } catch {}
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

// ─────────────── Contrast (WCAG) helpers ───────────────
function _rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const s = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const n = parseInt(s, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function _lum(hex: string) {
  const a = _rgb(hex).map((v) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
}
function contrast(a: string, b: string) {
  if (!/^#[0-9a-fA-F]{6}$/.test(a) || !/^#[0-9a-fA-F]{6}$/.test(b)) return 0
  const l1 = _lum(a); const l2 = _lum(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
const cPrimaryOnWhite = computed(() => contrast(primaryColor.value, '#ffffff'))
const cHeaderOnWhite = computed(() => contrast(headerColor.value, '#ffffff'))
const cLabelOnBtn = computed(() => contrast('#ffffff', btnColor.value))
const cBtnOnHero = computed(() => contrast(btnColor.value, primaryColor.value))

// ─────────────── Save / dirty / discard ───────────────
function snapshot() {
  return JSON.stringify({
    g: generalApplicationOn.value, fe: forEmployeesOn.value, pub: published.value,
    pc: primaryColor.value, hc: headerColor.value, bc: btnColor.value, cc: ctaColor.value,
    font: font.value, hl: headline.value, intro: intro.value, video: videoUrl.value, cover: coverUrl.value,
    values: values.value, testimonials: testimonials.value, ed: employeeDomain.value, sub: subdomain.value,
  })
}
const savedSnapshot = ref('')
const dirty = computed(() => savedSnapshot.value !== '' && snapshot() !== savedSnapshot.value)

const saved = ref(false)
function saveChanges() {
  if (!dirty.value) return
  savedSnapshot.value = snapshot()
  saved.value = true
  setTimeout(() => { saved.value = false }, 1800)
}
function discardChanges() {
  if (!savedSnapshot.value) return
  const s = JSON.parse(savedSnapshot.value)
  generalApplicationOn.value = s.g; forEmployeesOn.value = s.fe; published.value = s.pub
  primaryColor.value = s.pc; headerColor.value = s.hc; btnColor.value = s.bc; ctaColor.value = s.cc
  font.value = s.font; headline.value = s.hl; intro.value = s.intro; videoUrl.value = s.video; coverUrl.value = s.cover ?? ''
  values.value = JSON.parse(JSON.stringify(s.values)); testimonials.value = JSON.parse(JSON.stringify(s.testimonials))
  employeeDomain.value = s.ed; subdomain.value = s.sub
}

// Warn before leaving with unsaved changes (route change + full page unload).
onBeforeRouteLeave(() => (dirty.value ? window.confirm('You have unsaved changes. Leave without saving?') : true))
function beforeUnload(e: BeforeUnloadEvent) { if (dirty.value) { e.preventDefault(); e.returnValue = '' } }
onMounted(() => {
  savedSnapshot.value = snapshot()
  window.addEventListener('beforeunload', beforeUnload)
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

// ─────────────── Preview device (mobile-first) ───────────────
const previewMode = ref<'desktop' | 'mobile'>('desktop')

// ─────────────── Jobs — same published jobs the public site shows ───────────────
// Pulls from the real Jobs module (useJobs) rather than an invented list, so this
// preview and the public /careers site can never drift from what recruiters see.
const { jobs: allJobs } = useJobs()
function daysAgo(iso: string) {
  const d = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000))
  return d === 0 ? 'Today' : d === 1 ? '1d ago' : `${d}d ago`
}
const publishedJobs = computed(() => allJobs.value
  .filter(j => j.status === 'published')
  .map(j => ({
    title: j.title,
    type: j.collar as 'white' | 'blue',
    desc: j.description ?? '',
    location: j.location ?? 'Remote',
    posted: daysAgo(j.createdAt),
    employment: j.employmentType ?? 'Full-time',
  })))
const jobFilter = ref<'all' | 'white' | 'blue'>('all')
const filteredJobs = computed(() => jobFilter.value === 'all' ? publishedJobs.value : publishedJobs.value.filter(j => j.type === jobFilter.value))

// ─────────────── Preview computed styles ───────────────
const heroBackground = computed(() => `linear-gradient(135deg, ${primaryColor.value} 0%, ${headerColor.value} 130%)`)
const videoBackground = computed(() => `linear-gradient(135deg, ${headerColor.value}, ${primaryColor.value})`)
const previewWidth = computed(() => (previewMode.value === 'desktop' ? '1200px' : '320px'))
const jobsGridClass = computed(() => (previewMode.value === 'desktop' ? 'grid-cols-3' : 'grid-cols-1'))
const valuesGridClass = computed(() => (previewMode.value === 'desktop' ? 'grid-cols-3' : 'grid-cols-1'))
const testimonialsGridClass = computed(() => (previewMode.value === 'desktop' ? 'grid-cols-2' : 'grid-cols-1'))
</script>

<template>
  <div style="margin:-32px -40px;height:calc(100% + 64px);overflow:hidden;display:flex" class="bg-[var(--brand-canvas)]">
    <!-- LEFT SETTINGS PANEL -->
    <div class="w-[460px] shrink-0 flex flex-col border-r border-[var(--brand-border-light)] bg-[var(--brand-surface-white)]">
      <div class="shrink-0 px-5 pt-[22px] pb-4 border-b border-[var(--brand-border-light)]">
        <div class="flex items-center gap-2.5 mb-3.5">
          <div class="text-[20px] font-extrabold text-[var(--brand-text)] tracking-tight">Career Site</div>
          <span
            v-if="dirty"
            class="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--brand-status-pending-text)] bg-[var(--brand-status-pending-bg)] px-2 py-0.5 rounded-full"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-[var(--brand-status-pending-text)]" />Unsaved changes
          </span>
        </div>
        <div class="flex gap-2">
          <a
            :href="publicSiteUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-[10px] border border-[var(--brand-border)] bg-[var(--brand-surface-white)] text-[13.5px] font-semibold text-[var(--brand-text)] no-underline hover:bg-[var(--brand-lime-tint)] transition-colors"
          >
            <ExternalLink :size="13" :stroke-width="1.9" />
            Visit site
          </a>
          <BrandButton v-if="dirty" variant="outline" @click="discardChanges">Discard</BrandButton>
          <BrandButton
            variant="primary-teal"
            class="flex-1"
            :disabled="!dirty && !saved"
            :class="saved ? 'bg-[var(--brand-status-teal-green)] hover:bg-[var(--brand-status-teal-green)]' : ''"
            @click="saveChanges"
          >
            {{ saved ? '✓ Saved!' : 'Save changes' }}
          </BrandButton>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-2 overscroll-contain">
        <!-- General application -->
        <div class="rounded-xl border border-[var(--brand-border-light)] p-3.5">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <Inbox class="w-[15px] h-[15px] text-[var(--brand-icon-default)] shrink-0" />
              <span class="text-[14px] font-bold text-[var(--brand-text)]">General application</span>
            </div>
            <Switch v-model="generalApplicationOn" class="shrink-0 data-[state=checked]:bg-[var(--brand-teal)]" />
          </div>
          <div class="text-[12.5px] text-[var(--brand-text-quiet)] leading-[1.5] mt-1.5 pl-[23px]">Show a CTA that routes open applications to a pinned Talent Pool.</div>
        </div>

        <!-- Accordions -->
        <div v-for="s in SECTIONS" :key="s.key" class="rounded-xl border border-[var(--brand-border-light)] overflow-hidden">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-[var(--brand-lime-tint)]"
            @click="toggleAccordion(s.key)"
          >
            <component :is="s.icon" class="w-[15px] h-[15px] text-[var(--brand-icon-default)] shrink-0" />
            <span class="flex-1 text-[14px] font-bold text-[var(--brand-text)]">{{ s.label }}</span>
            <ChevronDown class="w-[14px] h-[14px] text-[var(--brand-icon-muted)] shrink-0 transition-transform" :class="{ 'rotate-180': openAccordions[s.key] }" />
          </button>

          <!-- Branding -->
          <div v-if="s.key === 'branding'" v-show="openAccordions.branding" class="space-y-4 border-t border-[var(--brand-border-fade)] px-3.5 py-4">
            <div class="flex gap-4">
              <div class="space-y-1.5">
                <div class="text-[12px] font-semibold text-[var(--brand-text-secondary)]">Logo</div>
                <label class="group relative grid size-16 cursor-pointer place-items-center overflow-hidden rounded-lg border border-[var(--brand-border)] bg-[var(--brand-canvas)] transition-colors hover:border-[var(--brand-teal)]/60">
                  <ImageIcon class="w-[20px] h-[20px] text-[var(--brand-icon-muted)]" />
                  <div class="absolute inset-0 grid place-items-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload class="w-[16px] h-[16px] text-white" />
                  </div>
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml" class="sr-only">
                </label>
              </div>
              <div class="flex-1 space-y-1.5">
                <div class="text-[12px] font-semibold text-[var(--brand-text-secondary)]">Cover image <span class="text-[var(--brand-text-faint)] font-normal">(4:1)</span></div>
                <div class="relative">
                  <label class="group relative flex h-16 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg border border-[var(--brand-border)] bg-[var(--brand-canvas)] transition-colors hover:border-[var(--brand-teal)]/60">
                    <img v-if="coverUrl" :src="coverUrl" alt="" class="absolute inset-0 h-full w-full object-cover">
                    <template v-else>
                      <Upload class="w-[15px] h-[15px] text-[var(--brand-icon-muted)]" />
                      <span class="text-[13px] text-[var(--brand-text-muted)]">Upload cover</span>
                    </template>
                    <div class="absolute inset-0 grid place-items-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload class="w-[16px] h-[16px] text-white" />
                    </div>
                    <input type="file" accept="image/png,image/jpeg" class="sr-only" @change="onCoverChange">
                  </label>
                  <button
                    v-if="coverUrl"
                    type="button"
                    class="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-white text-[var(--brand-settings-danger)] shadow-[0_1px_4px_rgba(0,20,18,0.25)] hover:bg-[var(--brand-settings-danger-hover-bg)]"
                    aria-label="Remove cover image"
                    @click="removeCoverConfirmOpen = true"
                  >
                    <X class="w-3 h-3" :stroke-width="2.5" />
                  </button>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-[13px] text-[var(--brand-text)]">Primary color</span>
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                  :class="cPrimaryOnWhite >= 4.5 ? 'bg-[var(--brand-status-approved-bg)] text-[var(--brand-status-approved-text)]' : 'bg-[var(--brand-status-closed-bg)] text-[var(--brand-status-closed-text)]'"
                  :title="`Contrast on white: ${cPrimaryOnWhite.toFixed(1)}:1 · AA needs 4.5:1`"
                >AA {{ cPrimaryOnWhite >= 4.5 ? '✓' : '✗' }}</span>
                <input type="color" :value="primaryColor" class="size-8 cursor-pointer rounded border border-[var(--brand-border)]" @input="onPrimaryChange(($event.target as HTMLInputElement).value)">
                <Input :model-value="primaryColor" maxlength="7" class="h-8 w-24 font-mono text-xs" @update:model-value="v => hexInput(String(v), onPrimaryChange)" />
              </div>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-[13px] text-[var(--brand-text)]">Header / text color</span>
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                  :class="cHeaderOnWhite >= 4.5 ? 'bg-[var(--brand-status-approved-bg)] text-[var(--brand-status-approved-text)]' : 'bg-[var(--brand-status-closed-bg)] text-[var(--brand-status-closed-text)]'"
                  :title="`Text contrast on white: ${cHeaderOnWhite.toFixed(1)}:1 · AA needs 4.5:1`"
                >AA {{ cHeaderOnWhite >= 4.5 ? '✓' : '✗' }}</span>
                <input type="color" :value="headerColor" class="size-8 cursor-pointer rounded border border-[var(--brand-border)]" @input="headerColor = ($event.target as HTMLInputElement).value">
                <Input :model-value="headerColor" maxlength="7" class="h-8 w-24 font-mono text-xs" @update:model-value="v => hexInput(String(v), (nv) => headerColor = nv)" />
              </div>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-[13px] text-[var(--brand-text)]">Buttons color</span>
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                  :class="cLabelOnBtn >= 4.5 ? 'bg-[var(--brand-status-approved-bg)] text-[var(--brand-status-approved-text)]' : 'bg-[var(--brand-status-closed-bg)] text-[var(--brand-status-closed-text)]'"
                  :title="`White label on button: ${cLabelOnBtn.toFixed(1)}:1 · AA needs 4.5:1`"
                >AA {{ cLabelOnBtn >= 4.5 ? '✓' : '✗' }}</span>
                <input type="color" :value="btnColor" class="size-8 cursor-pointer rounded border border-[var(--brand-border)]" @input="onBtnChange(($event.target as HTMLInputElement).value)">
                <Input :model-value="btnColor" maxlength="7" class="h-8 w-24 font-mono text-xs" @update:model-value="v => hexInput(String(v), onBtnChange)" />
              </div>
            </div>

            <!-- Button-on-hero contrast warning (CTA can vanish into the hero gradient) -->
            <div
              v-if="cBtnOnHero < 3"
              class="flex items-start gap-2 rounded-lg bg-[var(--brand-status-pending-bg)] px-3 py-2 text-[12px] leading-[1.45] text-[var(--brand-status-pending-text)]"
            >
              <span class="shrink-0">⚠</span>
              <span>The button color blends into the hero background ({{ cBtnOnHero.toFixed(1) }}:1). Pick a lighter or contrasting button color so the CTA stands out.</span>
            </div>

            <div class="space-y-1.5">
              <div class="text-[12px] font-semibold text-[var(--brand-text-secondary)]">Font</div>
              <Select v-model="font">
                <SelectTrigger class="w-full">
                  <SelectValue :placeholder="font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="f in FONTS" :key="f" :value="f">{{ f }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Hero -->
          <div v-else-if="s.key === 'hero'" v-show="openAccordions.hero" class="space-y-4 border-t border-[var(--brand-border-fade)] px-3.5 py-4">
            <div class="space-y-1.5">
              <div class="text-[12px] font-semibold text-[var(--brand-text-secondary)]">Headline</div>
              <Input v-model="headline" type="text" class="w-full" />
            </div>
            <div class="space-y-1.5">
              <div class="text-[12px] font-semibold text-[var(--brand-text-secondary)]">Intro copy</div>
              <textarea v-model="intro" rows="4" class="w-full box-border resize-y rounded-[9px] border-[1.5px] border-[var(--brand-border)] px-3 py-2.5 text-[14px] text-[var(--brand-text)] leading-[1.6] outline-none focus:border-[var(--brand-teal)] transition-colors" />
            </div>
          </div>

          <!-- Culture video -->
          <div v-else-if="s.key === 'video'" v-show="openAccordions.video" class="space-y-2 border-t border-[var(--brand-border-fade)] px-3.5 py-4">
            <div class="text-[12px] font-semibold text-[var(--brand-text-secondary)]">YouTube URL</div>
            <Input v-model="videoUrl" type="text" placeholder="https://youtube.com/watch?v=…" class="w-full" />
            <div class="text-[12px] text-[var(--brand-text-quiet)]">Shown as a culture video on the homepage.</div>
          </div>

          <!-- Values -->
          <div v-else-if="s.key === 'values'" v-show="openAccordions.values" class="space-y-2 border-t border-[var(--brand-border-fade)] px-3.5 py-4">
            <div
              v-for="(v, i) in values"
              :key="i"
              class="group flex items-center gap-3 rounded-[10px] border border-[var(--brand-border-light)] px-3 py-2.5"
            >
              <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--brand-lime-tint)]">
                <component :is="VALUE_ICONS[v.icon]" class="w-[15px] h-[15px] text-[var(--brand-text)]" />
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-[13.5px] font-semibold text-[var(--brand-text)] truncate">{{ v.name || 'Untitled value' }}</div>
                <div class="text-[12px] text-[var(--brand-text-quiet)] truncate">{{ v.desc || 'No description' }}</div>
              </div>
              <button type="button" class="shrink-0 grid size-7 place-items-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-teal)] hover:bg-[var(--brand-lime-tint)]" title="Edit" @click="openEditValue(i)">
                <Pencil class="w-[14px] h-[14px]" />
              </button>
              <button type="button" class="shrink-0 grid size-7 place-items-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-settings-danger)] hover:bg-[var(--brand-settings-danger-hover-bg)]" title="Remove" @click="removeValue(i)">
                <Trash2 class="w-[14px] h-[14px]" />
              </button>
            </div>
            <BrandButton
              v-if="values.length < 6"
              variant="outline"
              class="w-full border-dashed border-[1.5px] hover:border-[var(--brand-teal)]"
              @click="openAddValue"
            >
              + Add value ({{ values.length }}/6)
            </BrandButton>
          </div>

          <!-- Testimonials -->
          <div v-else-if="s.key === 'testimonials'" v-show="openAccordions.testimonials" class="space-y-2 border-t border-[var(--brand-border-fade)] px-3.5 py-4">
            <div
              v-for="(t, i) in testimonials"
              :key="i"
              class="group flex items-center gap-3 rounded-[10px] border border-[var(--brand-border-light)] px-3 py-2.5"
            >
              <div class="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full text-[12px] font-bold text-white" :style="!t.photo ? { background: primaryColor } : {}">
                <img v-if="t.photo" :src="t.photo" alt="" class="absolute inset-0 h-full w-full object-cover">
                <span v-else>{{ initials(t.name) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[13.5px] font-semibold text-[var(--brand-text)] truncate">{{ t.name || 'Unnamed' }}</div>
                <div class="text-[12px] text-[var(--brand-text-quiet)] truncate">{{ t.role || t.quote || 'No details' }}</div>
              </div>
              <button type="button" class="shrink-0 grid size-7 place-items-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-teal)] hover:bg-[var(--brand-lime-tint)]" title="Edit" @click="openEditTestimonial(i)">
                <Pencil class="w-[14px] h-[14px]" />
              </button>
              <button type="button" class="shrink-0 grid size-7 place-items-center rounded-md text-[var(--brand-icon-muted)] hover:text-[var(--brand-settings-danger)] hover:bg-[var(--brand-settings-danger-hover-bg)]" title="Remove" @click="removeTestimonial(i)">
                <Trash2 class="w-[14px] h-[14px]" />
              </button>
            </div>
            <BrandButton
              v-if="testimonials.length < 5"
              variant="outline"
              class="w-full border-dashed border-[1.5px] hover:border-[var(--brand-teal)]"
              @click="openAddTestimonial"
            >
              + New testimonial ({{ testimonials.length }}/5)
            </BrandButton>
          </div>

          <!-- For Employees -->
          <div v-else-if="s.key === 'employees'" v-show="openAccordions.employees" class="space-y-4 border-t border-[var(--brand-border-fade)] px-3.5 py-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <div class="text-[13.5px] font-semibold text-[var(--brand-text)] mb-0.5">Enable "For Employees"</div>
                <div class="text-[12.5px] text-[var(--brand-text-quiet)]">Internal jobs via company-email magic link.</div>
              </div>
              <Switch v-model="forEmployeesOn" class="shrink-0 mt-0.5 data-[state=checked]:bg-[var(--brand-teal)]" />
            </div>
            <div class="space-y-1.5">
              <div class="text-[12px] font-semibold text-[var(--brand-text-secondary)]">Company email domain</div>
              <div class="flex items-center rounded-[9px] border-[1.5px] border-[var(--brand-border)] overflow-hidden bg-[var(--brand-surface-white)] focus-within:border-[var(--brand-teal)] transition-colors">
                <span class="pl-3 pr-1 text-[14px] text-[var(--brand-text-muted)]">@</span>
                <input v-model="employeeDomain" type="text" class="flex-1 border-none outline-none text-[14px] text-[var(--brand-text)] py-2.5 pr-3 bg-transparent">
              </div>
            </div>
          </div>

          <!-- Publish & URL -->
          <div v-else-if="s.key === 'publish'" v-show="openAccordions.publish" class="space-y-4 border-t border-[var(--brand-border-fade)] px-3.5 py-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <div class="text-[13.5px] font-semibold text-[var(--brand-text)] mb-0.5">Status</div>
                <div class="text-[12.5px] text-[var(--brand-text-quiet)]">Toggle publish from the bar above the preview.</div>
              </div>
              <span
                class="shrink-0 mt-0.5 inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full"
                :class="published ? 'bg-[var(--brand-status-approved-bg)] text-[var(--brand-status-approved-text)]' : 'bg-[var(--brand-surface-badge)] text-[var(--brand-text-quiet)]'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="published ? 'bg-[var(--brand-status-approved-text)]' : 'bg-[var(--brand-text-quiet)]'" />
                {{ published ? 'Published' : 'Draft' }}
              </span>
            </div>
            <div class="space-y-1.5">
              <div class="text-[12px] font-semibold text-[var(--brand-text-secondary)]">Subdomain</div>
              <div class="flex items-center rounded-[9px] border-[1.5px] border-[var(--brand-border)] overflow-hidden bg-[var(--brand-surface-white)] focus-within:border-[var(--brand-teal)] transition-colors">
                <input v-model="subdomain" type="text" class="flex-1 border-none outline-none text-[14px] text-[var(--brand-text)] px-3 py-2.5 bg-transparent">
                <span class="px-3 py-2.5 text-[14px] text-[var(--brand-text-muted)] bg-[var(--brand-canvas)] border-l-[1.5px] border-[var(--brand-border)] whitespace-nowrap">.recruitera.ai</span>
              </div>
            </div>
            <BrandButton variant="outline" class="w-full gap-2" @click="copyLink">
              <Check v-if="copied" :size="14" :stroke-width="1.8" />
              <Copy v-else :size="14" :stroke-width="1.8" />
              {{ copied ? 'Copied!' : 'Copy link' }}
            </BrandButton>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT PREVIEW PANEL -->
    <div class="flex-1 flex flex-col overflow-hidden min-w-0 bg-[var(--brand-canvas)]">
      <div class="shrink-0 px-5 py-2.5 bg-[var(--brand-surface-white)] border-b border-[var(--brand-border-light)] flex items-center gap-3">
        <BrandStatusBadge variant="solid" :tone="published ? 'approved' : 'neutral'" :label="published ? 'Published' : 'Draft'" />
        <Globe class="w-[14px] h-[14px] text-[var(--brand-icon-muted)] shrink-0" />
        <span class="text-[13px] text-[var(--brand-text)] font-semibold">{{ previewDomain }}</span>
        <Copy class="cursor-pointer shrink-0 w-[13px] h-[13px] text-[var(--brand-icon-muted)]" @click="copyLink" />
        <span class="flex-1" />
        <span class="text-[13px] text-[var(--brand-text)] font-semibold mr-1.5">Published</span>
        <Switch v-model="published" class="shrink-0 data-[state=checked]:bg-[var(--brand-teal)]" />
      </div>
      <div class="shrink-0 px-5 py-2 bg-[var(--brand-surface-white)] border-b border-[var(--brand-border-light)] flex items-center gap-2.5">
        <Lock class="w-[13px] h-[13px] text-[var(--brand-icon-muted)] shrink-0" />
        <span class="flex-1 text-[13px] text-[var(--brand-text-secondary)]">{{ previewDomain }}</span>
        <div class="flex gap-0.5 bg-[var(--brand-canvas)] border border-[var(--brand-border-light)] rounded-lg p-0.5">
          <button
            type="button"
            class="px-2.5 py-1 rounded-md flex items-center transition-colors"
            :class="previewMode === 'desktop' ? 'bg-[var(--brand-surface-white)] shadow-sm text-[var(--brand-text)]' : 'text-[var(--brand-icon-muted)]'"
            @click="previewMode = 'desktop'"
          >
            <Monitor :size="14" :stroke-width="1.8" />
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-md flex items-center transition-colors"
            :class="previewMode === 'mobile' ? 'bg-[var(--brand-surface-white)] shadow-sm text-[var(--brand-text)]' : 'text-[var(--brand-icon-muted)]'"
            @click="previewMode = 'mobile'"
          >
            <Smartphone :size="14" :stroke-width="1.8" />
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto flex justify-center items-start p-5">
        <div
          class="bg-white rounded-[10px] shadow-2xl overflow-hidden transition-[width] duration-300"
          :style="{ width: previewWidth, maxWidth: '100%' }"
        >
          <div class="bg-[var(--brand-preview-chrome-bg)] border-b border-black/5 px-3.5 py-2.5 flex items-center gap-2">
            <span class="size-3 rounded-full bg-[var(--brand-preview-dot-red)] inline-block shrink-0" />
            <span class="size-3 rounded-full bg-[var(--brand-preview-dot-yellow)] inline-block shrink-0" />
            <span class="size-3 rounded-full bg-[var(--brand-preview-dot-green)] inline-block shrink-0" />
            <span class="flex-1 bg-white rounded-md px-3 py-1 text-[11.5px] text-[var(--brand-preview-text-secondary)] ml-1.5">{{ previewDomain }}</span>
          </div>

          <div :style="{ fontFamily: `${font}, system-ui, sans-serif` }">
            <!-- Header -->
            <header class="flex items-center justify-between border-b border-black/5 px-6 py-3.5">
              <div class="flex items-center gap-2.5">
                <div class="grid size-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white" :style="{ background: primaryColor }">{{ companyInitials }}</div>
                <span class="text-[15px] font-semibold" :style="{ color: headerColor }">{{ companyName }}</span>
              </div>
              <nav v-if="previewMode === 'desktop'" class="flex items-center gap-6 text-[13px] font-medium">
                <span class="text-[var(--brand-preview-text-heading)]">Home</span>
                <span :style="{ color: primaryColor }">Opportunities</span>
                <span v-if="forEmployeesOn" class="rounded-lg border px-3 py-1.5" :style="{ color: primaryColor, borderColor: primaryColor }">For Employees</span>
              </nav>
              <!-- mobile: collapse nav into a menu button so it never overflows the phone -->
              <span v-else class="grid size-8 place-items-center" aria-label="Menu">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" :style="{ color: headerColor }">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </span>
            </header>

            <!-- Hero -->
            <section class="relative flex flex-col items-start justify-center gap-4 overflow-hidden px-6" style="padding-top:56px;padding-bottom:56px;min-height:300px">
              <img v-if="coverUrl" :src="coverUrl" alt="" class="absolute inset-0 h-full w-full object-cover">
              <div class="absolute inset-0" :style="{ background: heroBackground, opacity: coverUrl ? 0.82 : 1 }" />
              <span class="relative bg-white/15 backdrop-blur text-white text-[11.5px] font-semibold px-3 py-1 rounded-full">We're hiring · {{ publishedJobs.length }} open roles</span>
              <h1 class="relative font-extrabold text-white leading-[1.18] max-w-[560px]" style="font-size:34px">{{ headline }}</h1>
              <p class="relative text-white/85 max-w-[440px] leading-[1.7]" style="font-size:14px">{{ intro }}</p>
              <button type="button" class="relative text-white rounded-xl px-5 py-2.5 text-[13.5px] font-bold shadow-lg" :style="{ background: ctaColor }">View open roles →</button>
            </section>

            <!-- Opportunities -->
            <section class="px-6 py-8">
              <div class="flex items-baseline justify-between mb-1">
                <div class="font-extrabold text-[var(--brand-preview-text-heading)]" style="font-size:22px">Opportunities</div>
                <span class="text-[12.5px] font-semibold cursor-pointer" :style="{ color: primaryColor }">View all →</span>
              </div>
              <div class="text-[12px] text-[var(--brand-preview-text-muted)] mb-3.5">Found {{ filteredJobs.length }} open positions</div>
              <div class="flex flex-wrap items-center gap-2 mb-4">
                <span class="text-[12px] text-[var(--brand-preview-text-secondary)] mr-0.5">Job type:</span>
                <button
                  type="button"
                  class="rounded-full px-3 py-1 text-[12px] font-bold transition-colors"
                  :class="jobFilter === 'all' ? 'text-white' : 'border border-[var(--brand-preview-border)] text-[var(--brand-preview-text-label)]'"
                  :style="jobFilter === 'all' ? { background: primaryColor } : {}"
                  @click="jobFilter = 'all'"
                >All</button>
                <button
                  type="button"
                  class="rounded-full px-3 py-1 text-[12px] font-bold transition-colors"
                  :class="jobFilter === 'white' ? 'text-white' : 'border border-[var(--brand-preview-border)] text-[var(--brand-preview-text-label)]'"
                  :style="jobFilter === 'white' ? { background: primaryColor } : {}"
                  @click="jobFilter = 'white'"
                >White Collar</button>
                <button
                  type="button"
                  class="rounded-full px-3 py-1 text-[12px] font-bold transition-colors"
                  :class="jobFilter === 'blue' ? 'text-white' : 'border border-[var(--brand-preview-border)] text-[var(--brand-preview-text-label)]'"
                  :style="jobFilter === 'blue' ? { background: primaryColor } : {}"
                  @click="jobFilter = 'blue'"
                >Blue Collar</button>
                <span class="ml-1 flex items-center gap-1 rounded-full border border-[var(--brand-preview-border)] px-3 py-1 text-[12px] text-[var(--brand-preview-text-label)]">
                  Employment type
                  <ChevronDown class="w-[12px] h-[12px]" />
                </span>
              </div>
              <div class="grid gap-3" :class="jobsGridClass">
                <div v-for="j in filteredJobs" :key="j.title" class="rounded-2xl border border-[var(--brand-preview-border-card)] p-3.5" :style="{ boxShadow: `0 1px 3px var(--brand-preview-card-shadow)` }">
                  <div class="flex gap-1.5 mb-2">
                    <span class="rounded-md px-2 py-0.5 text-[10.5px] font-bold" :style="{ background: `${primaryColor}18`, color: primaryColor }">{{ j.employment }}</span>
                    <span class="rounded-md px-2 py-0.5 text-[10.5px] font-bold bg-[var(--brand-preview-surface-alt)] text-[var(--brand-preview-text-label)]">{{ j.type === 'white' ? 'White Collar' : 'Blue Collar' }}</span>
                  </div>
                  <div class="text-[14px] font-semibold text-[var(--brand-preview-text-heading)] mb-1">{{ j.title }}</div>
                  <div class="text-[12px] text-[var(--brand-preview-text-secondary)] leading-[1.5] mb-2 line-clamp-2">{{ j.desc }}</div>
                  <div class="flex items-center gap-3 text-[11.5px] text-[var(--brand-preview-text-muted)] border-t border-[var(--brand-preview-surface-alt)] pt-2">
                    <span class="inline-flex items-center gap-1"><MapPin class="w-[11px] h-[11px]" />{{ j.location }}</span>
                    <span class="inline-flex items-center gap-1"><Clock class="w-[11px] h-[11px]" />{{ j.posted }}</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Culture video -->
            <section class="px-6 pb-8">
              <div class="font-extrabold text-[var(--brand-preview-text-heading)] mb-3" style="font-size:22px">Life at {{ companyName }}</div>
              <div class="relative grid aspect-video w-full place-items-center overflow-hidden rounded-2xl" :style="{ background: videoBackground }">
                <div class="grid size-14 place-items-center rounded-full bg-white/90 shadow-xl">
                  <Play class="w-[22px] h-[22px] text-[var(--brand-preview-text-heading)] fill-current" />
                </div>
                <span v-if="!videoUrl" class="absolute bottom-3 left-3 text-[12px] text-white/80">Add a YouTube URL to embed your culture video</span>
              </div>
            </section>

            <!-- Values -->
            <section class="px-6 py-8" style="background:var(--brand-preview-surface-section)">
              <div class="text-center font-extrabold text-[var(--brand-preview-text-heading)] mb-5" style="font-size:22px">What we stand for</div>
              <div class="grid gap-3.5" :class="valuesGridClass">
                <div v-for="(v, i) in values" :key="i" class="rounded-2xl border border-[var(--brand-preview-border-card)] bg-white p-4">
                  <div class="grid size-10 place-items-center rounded-xl mb-2.5" :style="{ background: `${primaryColor}18` }">
                    <component :is="VALUE_ICONS[v.icon]" class="w-[18px] h-[18px]" :style="{ color: primaryColor }" />
                  </div>
                  <div class="text-[15px] font-semibold text-[var(--brand-preview-text-heading)] mb-1">{{ v.name || 'Value name' }}</div>
                  <div class="text-[13px] text-[var(--brand-preview-text-secondary)] leading-[1.5]">{{ v.desc || 'Description' }}</div>
                </div>
              </div>
            </section>

            <!-- Testimonials -->
            <section class="px-6 py-8">
              <div class="font-extrabold text-[var(--brand-preview-text-heading)] mb-5" style="font-size:22px">From the team</div>
              <div class="grid gap-3.5" :class="testimonialsGridClass">
                <figure v-for="(t, i) in testimonials" :key="i" class="rounded-2xl border border-[var(--brand-preview-border-card)] bg-white p-4">
                  <Quote class="w-[16px] h-[16px] mb-2" :style="{ color: primaryColor }" />
                  <blockquote class="text-[13.5px] text-[var(--brand-preview-text-body)] leading-[1.6] mb-3">"{{ t.quote || 'Quote' }}"</blockquote>
                  <figcaption class="flex items-center gap-2.5">
                    <div class="grid size-9 place-items-center rounded-full text-[12px] font-semibold text-white" :style="{ background: primaryColor }">{{ initials(t.name) }}</div>
                    <div>
                      <div class="text-[13px] font-semibold text-[var(--brand-preview-text-heading)]">{{ t.name || 'Name' }}</div>
                      <div class="text-[11.5px] text-[var(--brand-preview-text-muted)]">{{ t.role || 'Role' }}</div>
                    </div>
                  </figcaption>
                </figure>
              </div>
            </section>

            <!-- Employees CTA -->
            <section v-if="forEmployeesOn" class="px-6 pb-8">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5" :style="{ background: headerColor }">
                <div>
                  <div class="text-[15px] font-semibold text-white">Already part of the team?</div>
                  <div class="text-[12.5px] text-white/70">Access internal-only roles with your <strong>@{{ employeeDomain }}</strong> email.</div>
                </div>
                <button type="button" class="rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold shrink-0" :style="{ color: headerColor }">For Employees →</button>
              </div>
            </section>

            <!-- Footer -->
            <footer class="border-t border-black/5 px-6 py-5 text-center">
              <div class="text-[13px] font-medium" :style="{ color: headerColor }">{{ companyName }}</div>
              <div class="text-[11.5px] text-[var(--brand-preview-text-muted)]">{{ previewDomain }} · © 2026 · Powered by Recruitera</div>
            </footer>
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit Value modal -->
    <Dialog v-model:open="valueModalOpen">
      <DialogScrollContent class="max-w-[460px] p-0 gap-0 overflow-hidden">
        <DialogHeader class="px-6 py-5 border-b border-[var(--brand-border-hairline)] text-left space-y-1">
          <DialogTitle class="text-[18px] font-bold text-[var(--brand-text)]">{{ editingValueIndex === null ? 'Add value' : 'Edit value' }}</DialogTitle>
        </DialogHeader>
        <div class="px-6 py-5 space-y-4">
          <div>
            <span class="block text-[13px] font-semibold text-[var(--brand-text-secondary)] mb-2">Value icon</span>
            <!-- selected-icon preview -->
            <div class="mb-3 flex h-20 items-center justify-center rounded-xl border border-[var(--brand-border-light)] bg-[var(--brand-canvas)]">
              <span class="grid size-12 place-items-center rounded-xl bg-[var(--brand-lime-tint)]">
                <component :is="VALUE_ICONS[valueDraft.icon]" class="h-6 w-6 text-[var(--brand-text)]" />
              </span>
            </div>
            <!-- icon library grid (choose from library) -->
            <div class="rounded-xl border border-[var(--brand-border-light)] p-2">
              <div class="px-1 pb-1.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--brand-text-quiet)]">Icon library</div>
              <div class="grid max-h-[176px] grid-cols-6 gap-1.5 overflow-y-auto pr-0.5">
                <button
                  v-for="(Ic, idx) in VALUE_ICONS"
                  :key="idx"
                  type="button"
                  class="grid aspect-square place-items-center rounded-lg border transition-colors"
                  :class="idx === valueDraft.icon ? 'border-[var(--brand-teal)] bg-[var(--brand-lime-tint)]' : 'border-transparent hover:bg-[var(--brand-surface-hover)]'"
                  @click="valueDraft.icon = idx"
                >
                  <component :is="Ic" class="h-[17px] w-[17px] text-[var(--brand-text)]" />
                </button>
              </div>
            </div>
          </div>
          <label class="block">
            <span class="block text-[13px] font-semibold text-[var(--brand-text-secondary)] mb-1.5">Value name <span class="text-[var(--brand-danger)]">*</span></span>
            <Input v-model="valueDraft.name" type="text" placeholder="e.g. Ownership" class="w-full" />
          </label>
          <label class="block">
            <span class="block text-[13px] font-semibold text-[var(--brand-text-secondary)] mb-1.5">Description</span>
            <textarea v-model="valueDraft.desc" rows="3" placeholder="What does this value mean at your company?" class="w-full box-border resize-none rounded-[9px] border-[1.5px] border-[var(--brand-border)] px-3 py-2 text-[14px] text-[var(--brand-text)] leading-[1.55] outline-none focus:border-[var(--brand-teal)] transition-colors" />
          </label>
        </div>
        <DialogFooter class="px-6 py-4 border-t border-[var(--brand-border-hairline)] gap-2 sm:justify-end">
          <BrandButton variant="outline" @click="valueModalOpen = false">Cancel</BrandButton>
          <BrandButton variant="primary-teal" :disabled="!valueValid" @click="saveValue">Save</BrandButton>
        </DialogFooter>
      </DialogScrollContent>
    </Dialog>

    <!-- Add / Edit Testimonial modal -->
    <Dialog v-model:open="testimonialModalOpen">
      <DialogScrollContent class="max-w-[520px] p-0 gap-0 overflow-hidden">
        <DialogHeader class="px-6 py-5 border-b border-[var(--brand-border-hairline)] text-left space-y-1">
          <DialogTitle class="text-[18px] font-bold text-[var(--brand-text)]">{{ editingTestimonialIndex === null ? 'Add testimonial' : 'Edit testimonial' }}</DialogTitle>
        </DialogHeader>
        <div class="px-6 py-5 space-y-4">
          <div>
            <span class="block text-[13px] font-semibold text-[var(--brand-text-secondary)] mb-1.5">Photo</span>
            <div class="flex items-center gap-3">
              <div class="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full text-[16px] font-bold text-white" :style="!testimonialDraft.photo ? { background: primaryColor } : {}">
                <img v-if="testimonialDraft.photo" :src="testimonialDraft.photo" alt="" class="absolute inset-0 h-full w-full object-cover">
                <span v-else>{{ initials(testimonialDraft.name) }}</span>
              </div>
              <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface-white)] px-3.5 py-2 text-[13px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-lime-tint)] transition-colors">
                <Upload class="h-[15px] w-[15px]" />
                {{ testimonialDraft.photo ? 'Change photo' : 'Upload photo' }}
                <input type="file" accept="image/*" class="sr-only" @change="onTestimonialPhoto">
              </label>
              <button v-if="testimonialDraft.photo" type="button" class="text-[13px] font-semibold text-[var(--brand-settings-danger)] hover:underline" @click="testimonialDraft.photo = ''">Remove</button>
            </div>
            <p class="mt-1.5 text-[11.5px] text-[var(--brand-text-quiet)]">Optional. A square image works best.</p>
          </div>
          <label class="block">
            <span class="block text-[13px] font-semibold text-[var(--brand-text-secondary)] mb-1.5">Employee name <span class="text-[var(--brand-danger)]">*</span></span>
            <Input v-model="testimonialDraft.name" type="text" placeholder="e.g. Amr Hammad" class="w-full" />
          </label>
          <label class="block">
            <span class="block text-[13px] font-semibold text-[var(--brand-text-secondary)] mb-1.5">Job title</span>
            <Input v-model="testimonialDraft.role" type="text" placeholder="e.g. Senior Engineer" class="w-full" />
          </label>
          <label class="block">
            <span class="block text-[13px] font-semibold text-[var(--brand-text-secondary)] mb-1.5">Quote <span class="text-[var(--brand-danger)]">*</span></span>
            <textarea v-model="testimonialDraft.quote" rows="4" placeholder="What did they say about working here?" class="w-full box-border resize-none rounded-[9px] border-[1.5px] border-[var(--brand-border)] px-3 py-2 text-[14px] text-[var(--brand-text)] leading-[1.6] outline-none focus:border-[var(--brand-teal)] transition-colors" />
          </label>
        </div>
        <DialogFooter class="px-6 py-4 border-t border-[var(--brand-border-hairline)] gap-2 sm:justify-end">
          <BrandButton variant="outline" @click="testimonialModalOpen = false">Cancel</BrandButton>
          <BrandButton variant="primary-teal" :disabled="!testimonialValid" @click="saveTestimonial">Save</BrandButton>
        </DialogFooter>
      </DialogScrollContent>
    </Dialog>

    <SettingsConfirmDialog
      v-model:open="removeCoverConfirmOpen"
      title="Remove cover image?"
      description="The career site hero will fall back to your brand colors until you upload a new one."
      confirm-label="Remove"
      @confirm="confirmRemoveCover"
    />
  </div>
</template>
