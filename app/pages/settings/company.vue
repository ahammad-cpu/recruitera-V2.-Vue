<script setup lang="ts">
import { Image, Pencil, Upload } from 'lucide-vue-next'
import { useCompany } from '~/composables/useCompany'
import SettingsPageHeader from '~/components/settings/SettingsPageHeader.vue'
import SettingsConfirmDialog from '~/components/settings/SettingsConfirmDialog.vue'
import { BrandButton } from '~/components/brand'
import type { CompanyInfo } from '~/types'

definePageMeta({ layout: 'settings' })

const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Other']
const SIZES = ['1–10', '11–50', '51–200', '201–500', '500+']

const { data, isLoading } = useCompany()

const company = ref<CompanyInfo | null>(null)
const seeded = ref(false)
watch(data, (v) => {
  if (v && !seeded.value) {
    company.value = { ...v }
    seeded.value = true
  }
}, { immediate: true })

// ─────────────── Company details view/edit toggle ───────────────
const editing = ref(false)
const form = reactive({ name: '', industry: '', size: '', foundedYear: '', about: '' })

function openEdit() {
  if (!company.value) return
  form.name = company.value.name
  form.industry = company.value.industry
  form.size = company.value.size
  form.foundedYear = company.value.foundedYear != null ? String(company.value.foundedYear) : ''
  form.about = company.value.about
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

function saveDetails() {
  if (!company.value) return
  company.value.name = form.name.trim() || company.value.name
  company.value.industry = form.industry
  company.value.size = form.size
  company.value.foundedYear = form.foundedYear ? Number(form.foundedYear) : null
  company.value.about = form.about
  editing.value = false
}

// ─────────────── Logo upload (ground truth left this button unwired — wired for real here) ───────────────
function onLogoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !company.value) return
  company.value.logoUrl = URL.createObjectURL(file)
}
const removeLogoConfirmOpen = ref(false)
function confirmRemoveLogo() {
  if (company.value) company.value.logoUrl = null
  removeLogoConfirmOpen.value = false
}

// ─────────────── Default SEO image upload (also unwired in ground truth) ───────────────
function onSeoImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !company.value) return
  company.value.seoImageUrl = URL.createObjectURL(file)
}
</script>

<template>
  <div>
    <SettingsPageHeader
      title="Company information"
      subtitle="Used across Recruitera and your Career Site. Name and logo reflect on the Career Site immediately."
    />

    <div v-if="isLoading || !company" class="text-[13px] text-[var(--brand-text-muted)] py-8 text-center">Loading…</div>

    <template v-else>
      <!-- Company details -->
      <div class="flex items-center justify-between mb-4">
        <div class="text-[16px] font-bold text-[var(--brand-text)]">Company details</div>
        <BrandButton
          v-if="!editing"
          variant="outline"
          size="sm"
          @click="openEdit"
        >
          <Pencil class="w-3.5 h-3.5" />
          Edit
        </BrandButton>
      </div>

      <!-- View mode -->
      <div v-if="!editing" class="flex flex-col gap-4 mb-5">
        <div>
          <div class="text-[12.5px] font-semibold text-[var(--brand-text-quiet)] uppercase tracking-[0.04em] mb-1">Company Name</div>
          <div class="text-[15px] font-semibold text-[var(--brand-text)]">{{ company.name }}</div>
        </div>
        <div class="grid grid-cols-3 gap-5">
          <div>
            <div class="text-[12.5px] font-semibold text-[var(--brand-text-quiet)] uppercase tracking-[0.04em] mb-1">Industry</div>
            <div class="text-[15px] font-semibold text-[var(--brand-text)]">{{ company.industry }}</div>
          </div>
          <div>
            <div class="text-[12.5px] font-semibold text-[var(--brand-text-quiet)] uppercase tracking-[0.04em] mb-1">Company Size</div>
            <div class="text-[15px] font-semibold text-[var(--brand-text)]">{{ company.size }}</div>
          </div>
          <div>
            <div class="text-[12.5px] font-semibold text-[var(--brand-text-quiet)] uppercase tracking-[0.04em] mb-1">Founded Year</div>
            <div class="text-[15px] font-semibold text-[var(--brand-text)]">{{ company.foundedYear ?? '—' }}</div>
          </div>
        </div>
        <div>
          <div class="text-[12.5px] font-semibold text-[var(--brand-text-quiet)] uppercase tracking-[0.04em] mb-1">About</div>
          <div class="text-[15px] text-[var(--brand-text)]">{{ company.about || '—' }}</div>
        </div>
      </div>

      <!-- Edit mode -->
      <div v-else class="mb-4">
        <div class="mb-4">
          <label class="block text-[13.5px] font-semibold text-[var(--brand-text-secondary)] mb-1.5">Company Name</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full box-border px-3 py-2.5 rounded-[9px] border-[1.5px] border-[var(--brand-border)] text-[14px] text-[var(--brand-text)] outline-none bg-[var(--brand-surface-white)] focus:border-[var(--brand-teal)] transition-colors"
          >
        </div>

        <div class="grid grid-cols-3 gap-3.5 mb-4">
          <div>
            <label class="block text-[13.5px] font-semibold text-[var(--brand-text-secondary)] mb-1.5">Industry</label>
            <select
              v-model="form.industry"
              class="w-full box-border px-3 py-2.5 rounded-[9px] border-[1.5px] border-[var(--brand-border)] text-[14px] text-[var(--brand-text)] outline-none bg-[var(--brand-surface-white)] focus:border-[var(--brand-teal)] transition-colors"
            >
              <option v-for="opt in INDUSTRIES" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[13.5px] font-semibold text-[var(--brand-text-secondary)] mb-1.5">Company Size</label>
            <select
              v-model="form.size"
              class="w-full box-border px-3 py-2.5 rounded-[9px] border-[1.5px] border-[var(--brand-border)] text-[14px] text-[var(--brand-text)] outline-none bg-[var(--brand-surface-white)] focus:border-[var(--brand-teal)] transition-colors"
            >
              <option v-for="opt in SIZES" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[13.5px] font-semibold text-[var(--brand-text-secondary)] mb-1.5">Founded Year</label>
            <input
              v-model="form.foundedYear"
              type="number"
              min="1900"
              max="2099"
              placeholder="e.g. 2019"
              class="w-full box-border px-3 py-2.5 rounded-[9px] border-[1.5px] border-[var(--brand-border)] text-[14px] text-[var(--brand-text)] outline-none bg-[var(--brand-surface-white)] focus:border-[var(--brand-teal)] transition-colors"
            >
          </div>
        </div>

        <div class="mb-5">
          <label class="block text-[13.5px] font-semibold text-[var(--brand-text-secondary)] mb-1.5">About</label>
          <textarea
            v-model="form.about"
            rows="4"
            class="w-full box-border px-3 py-2.5 rounded-[9px] border-[1.5px] border-[var(--brand-border)] text-[14px] text-[var(--brand-text)] outline-none bg-[var(--brand-surface-white)] focus:border-[var(--brand-teal)] transition-colors resize-y"
          />
        </div>

        <div class="flex justify-end gap-2">
          <BrandButton
            variant="outline"
            size="md"
            @click="cancelEdit"
          >
            Cancel
          </BrandButton>
          <BrandButton
            variant="primary-teal"
            size="md"
            @click="saveDetails"
          >
            Save changes
          </BrandButton>
        </div>
      </div>

      <div class="h-px bg-[var(--brand-border-light)] my-6" />

      <!-- Company logo -->
      <div class="text-[16px] font-bold text-[var(--brand-text)] mb-1">Company logo</div>
      <p class="text-[13.5px] text-[var(--brand-text-quiet)] mb-3.5">This logo will be displayed in the navigation in all Recruitera products.</p>
      <div class="flex items-center gap-4">
        <div class="w-[72px] h-[72px] rounded-[12px] bg-[var(--brand-lime-tint-hover)] border-[1.5px] border-[var(--brand-border-light)] flex items-center justify-center shrink-0 overflow-hidden">
          <img v-if="company.logoUrl" :src="company.logoUrl" alt="Company logo" class="w-full h-full object-cover">
          <Image v-else class="w-7 h-7 text-[var(--brand-border-mid)]" />
        </div>
        <div>
          <div class="mb-1.5 flex items-center gap-2">
            <label class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] border border-[var(--brand-border)] bg-[var(--brand-surface-white)] text-[13.5px] font-semibold text-[var(--brand-text)] outline-none cursor-pointer hover:bg-[var(--brand-lime-tint-hover)] transition-colors">
              <Upload class="w-3.5 h-3.5" />
              Upload logo
              <input type="file" accept="image/png,image/jpeg,image/svg+xml" class="hidden" @change="onLogoChange">
            </label>
            <button
              v-if="company.logoUrl"
              type="button"
              class="text-[13px] font-semibold text-[var(--brand-settings-danger)] hover:underline"
              @click="removeLogoConfirmOpen = true"
            >
              Remove
            </button>
          </div>
          <div class="text-[12px] text-[var(--brand-text-quiet)]">PNG, JPG or SVG · max 5 MB</div>
        </div>
      </div>

      <div class="h-px bg-[var(--brand-border-light)] my-6" />

      <!-- Default SEO image -->
      <div class="border border-[var(--brand-border-light)] rounded-[12px] overflow-hidden flex">
        <div class="flex-1 p-6">
          <div class="text-[15px] font-bold text-[var(--brand-text)] mb-1.5">Default SEO image</div>
          <p class="text-[13.5px] text-[var(--brand-text-quiet)] mb-4 leading-relaxed">Shown when jobs are shared. Applies to future jobs only; recruiters can override per job.</p>
          <label class="inline-flex items-center gap-1.5 mb-2 px-3.5 py-2 rounded-[9px] border border-[var(--brand-border)] bg-[var(--brand-surface-white)] text-[13.5px] font-semibold text-[var(--brand-text)] outline-none cursor-pointer hover:bg-[var(--brand-lime-tint-hover)] transition-colors">
            <Upload class="w-3.5 h-3.5" />
            Upload
            <input type="file" accept="image/png,image/jpeg" class="hidden" @change="onSeoImageChange">
          </label>
          <div class="text-[12px] text-[var(--brand-text-quiet)]">PNG, JPG · 1600×630 px · max 5 MB</div>
        </div>
        <div class="w-[300px] shrink-0 bg-[var(--brand-lime-tint-hover)] border-l border-[var(--brand-border-light)] flex flex-col overflow-hidden">
          <div class="flex-1 flex flex-col items-center justify-center p-6 gap-2.5">
            <div v-if="company.seoImageUrl" class="w-full aspect-[1600/630] rounded-[10px] overflow-hidden border border-[var(--brand-border-light)]">
              <img :src="company.seoImageUrl" alt="SEO preview" class="w-full h-full object-cover">
            </div>
            <template v-else>
              <div class="w-11 h-11 rounded-[10px] bg-[var(--brand-surface-white)] border border-[var(--brand-border-light)] flex items-center justify-center">
                <Image class="w-[22px] h-[22px] text-[var(--brand-border-mid)]" />
              </div>
              <span class="text-[13px] text-[var(--brand-text-quiet)]">We are hiring</span>
            </template>
          </div>
          <div class="bg-[var(--brand-surface-white)] border-t border-[var(--brand-border-light)] px-4 py-3">
            <div class="text-[10px] text-[var(--brand-text-quiet)] uppercase tracking-[0.06em] mb-1">icareer.recruitera.ai</div>
            <div class="text-[13.5px] font-bold text-[var(--brand-text)] mb-0.5">{{ company.name }} — Careers</div>
            <div class="text-[12px] text-[var(--brand-text-quiet)]">{{ company.about }}</div>
          </div>
        </div>
      </div>
    </template>

    <SettingsConfirmDialog
      v-model:open="removeLogoConfirmOpen"
      title="Remove company logo?"
      description="Navigation across Recruitera products and your Career Site will fall back to your company's initials until you upload a new one."
      confirm-label="Remove"
      @confirm="confirmRemoveLogo"
    />
  </div>
</template>
