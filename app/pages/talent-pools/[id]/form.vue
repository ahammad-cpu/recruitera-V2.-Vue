<script setup lang="ts">
import { ArrowLeft, Plus, Trash2, Lock, GripVertical, Link2, Check, UploadCloud } from 'lucide-vue-next'
import { BrandButton } from '~/components/brand'
import { Input } from '~/components/ui/input'
import { useTalentPool, useTalentPoolMutations } from '~/composables/useTalentPools'
import type { TalentPoolFieldType, TalentPoolFormField } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const { data: pool } = useTalentPool(id)
const { saveForm, publishForm } = useTalentPoolMutations()

const fields = ref<TalentPoolFormField[]>([])
watch(pool, (p) => {
  if (p && !fields.value.length) {
    const src = p.formFields.length ? structuredClone(toRaw(p.formFields)) : [
      { id: 'f-name', label: 'Full Name', type: 'text', required: true, locked: true, enabled: true, section: 'candidate' },
      { id: 'f-email', label: 'Email', type: 'email', required: true, locked: true, enabled: true, section: 'candidate' },
    ] as TalentPoolFormField[]
    // normalise (older fields may lack a section)
    fields.value = src.map(f => ({ ...f, section: f.section ?? 'candidate' }))
  }
}, { immediate: true })

const candidateFields = computed(() => fields.value.filter(f => f.section === 'candidate'))
const screeningFields = computed(() => fields.value.filter(f => f.section === 'screening'))

const CANDIDATE_TYPES: { value: TalentPoolFieldType, label: string }[] = [
  { value: 'text', label: 'Short text' }, { value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone' }, { value: 'textarea', label: 'Long text' }, { value: 'file', label: 'File upload' },
]
const QUESTION_TYPES: { value: TalentPoolFieldType, label: string }[] = [
  { value: 'text', label: 'Short text' }, { value: 'textarea', label: 'Long text' }, { value: 'yesno', label: 'Yes / No' }, { value: 'number', label: 'Number' }, { value: 'date', label: 'Date' }, { value: 'single-choice', label: 'Single choice' }, { value: 'multi-choice', label: 'Multiple choice' }, { value: 'file', label: 'File upload' },
]

const flash = ref('')
const publishedLink = computed(() => pool.value ? `${location.origin}/apply/pool/${pool.value.id}` : '')

function addField() { fields.value.push({ id: `f-${Date.now()}`, label: 'New field', type: 'text', required: false, locked: false, enabled: true, section: 'candidate' }) }
function addQuestion() { fields.value.push({ id: `q-${Date.now()}`, label: 'New question', type: 'text', required: false, locked: false, enabled: true, section: 'screening', visibility: 'everyone' }) }
function removeField(fid: string) { fields.value = fields.value.filter(f => f.id !== fid) }

function save() { saveForm.mutate({ id: id.value, formFields: fields.value }, { onSuccess: () => { flash.value = 'Saved'; setTimeout(() => (flash.value = ''), 1600) } }) }
function publish() {
  saveForm.mutate({ id: id.value, formFields: fields.value }, {
    onSuccess: () => publishForm.mutate(id.value, { onSuccess: () => { flash.value = 'Published'; setTimeout(() => (flash.value = ''), 2000) } }),
  })
}
function copyLink() { navigator.clipboard?.writeText(publishedLink.value).catch(() => {}) }

const enabledCandidate = computed(() => candidateFields.value.filter(f => f.enabled))
const enabledScreening = computed(() => screeningFields.value.filter(f => f.enabled))
const fieldCls = 'h-9 rounded-lg border border-[var(--brand-border)] bg-white px-2.5 text-[13.5px] outline-none focus:border-[var(--brand-teal)]'
</script>

<template>
  <div class="flex flex-col h-full min-w-0 overflow-hidden bg-[var(--brand-surface-white)] border-t border-[var(--brand-border)]">
    <template v-if="pool">
      <!-- Header -->
      <div class="px-6 pt-5 pb-3 flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <button type="button" class="w-9 h-9 rounded-lg grid place-items-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-lime-tint-hover)] transition" aria-label="Back" @click="navigateTo(`/talent-pools/${id}`)"><ArrowLeft class="w-5 h-5" /></button>
          <div>
            <h1 class="text-[20px] font-bold text-[var(--brand-text)]">Application form</h1>
            <p class="text-[13px] text-[var(--brand-text-quiet)]">{{ pool.name }} · candidates who submit are routed into this pool.</p>
          </div>
        </div>
        <div class="flex items-center gap-2.5">
          <span v-if="flash" class="text-[13px] font-semibold text-[var(--brand-status-approved-text)] inline-flex items-center gap-1"><Check class="w-4 h-4" /> {{ flash }}</span>
          <span v-if="pool.formPublished" class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] font-bold bg-[var(--brand-status-approved-bg)] text-[var(--brand-status-approved-text)]">Published</span>
          <BrandButton variant="outline" size="md" :disabled="saveForm.isPending.value" @click="save">Save</BrandButton>
          <BrandButton variant="primary-teal" size="md" :disabled="publishForm.isPending.value" @click="publish">{{ pool.formPublished ? 'Re-publish' : 'Publish' }}</BrandButton>
        </div>
      </div>

      <div class="flex-1 overflow-auto px-6 pb-10">
        <div class="max-w-[1080px] mx-auto grid gap-6 lg:grid-cols-[1fr_380px] items-start">
          <!-- Editor -->
          <div class="space-y-6">
            <div v-if="pool.formPublished" class="rounded-xl border border-[var(--brand-border-light)] bg-[var(--brand-canvas)] p-4 flex items-center gap-3">
              <Link2 class="w-4 h-4 text-[var(--brand-teal)] shrink-0" />
              <input :value="publishedLink" readonly class="flex-1 bg-transparent text-[13px] text-[var(--brand-text-secondary)] outline-none truncate">
              <BrandButton variant="outline" size="sm" @click="copyLink">Copy link</BrandButton>
            </div>

            <!-- 1) Candidate information -->
            <section class="rounded-2xl border border-[var(--brand-border-light)] bg-white p-5">
              <h2 class="text-[16px] font-bold text-[var(--brand-text)]">Candidate information</h2>
              <p class="text-[13px] text-[var(--brand-text-quiet)] mb-3">Candidates fill out these details on the application form.</p>
              <div class="space-y-2.5">
                <div v-for="f in candidateFields" :key="f.id" class="rounded-xl border border-[var(--brand-border-light)] bg-white p-3.5">
                  <div class="flex items-center gap-2.5">
                    <GripVertical class="w-4 h-4 text-[var(--brand-text-faint)] shrink-0" />
                    <Input v-model="f.label" :disabled="f.locked" class="flex-1 h-9 rounded-lg border-[var(--brand-border)]" />
                    <select v-model="f.type" :disabled="f.locked" :class="[fieldCls, 'w-32']"><option v-for="t in CANDIDATE_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option></select>
                    <Lock v-if="f.locked" class="w-4 h-4 text-[var(--brand-text-quiet)] shrink-0" />
                    <button v-else type="button" class="w-8 h-8 rounded-md grid place-items-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] hover:text-[var(--brand-danger)] transition" aria-label="Remove field" @click="removeField(f.id)"><Trash2 class="w-4 h-4" /></button>
                  </div>
                  <div class="mt-2.5 ml-6 flex items-center gap-5 text-[13px]">
                    <label class="inline-flex items-center gap-1.5" :class="f.locked ? 'opacity-60' : 'cursor-pointer'"><input v-model="f.required" type="checkbox" :disabled="f.locked" class="accent-[var(--brand-teal)]"> Required</label>
                    <label class="inline-flex items-center gap-1.5" :class="f.locked ? 'opacity-60' : 'cursor-pointer'"><input v-model="f.enabled" type="checkbox" :disabled="f.locked" class="accent-[var(--brand-teal)]"> Shown on form</label>
                  </div>
                </div>
                <button type="button" class="w-full h-11 rounded-xl border border-dashed border-[var(--brand-border)] text-[13.5px] font-semibold text-[var(--brand-text-secondary)] inline-flex items-center justify-center gap-1.5 hover:border-[var(--brand-teal)] hover:text-[var(--brand-teal)] transition" @click="addField"><Plus class="w-4 h-4" /> Add field</button>
              </div>
            </section>

            <!-- 2) Screening questions -->
            <section class="rounded-2xl border border-[var(--brand-border-light)] bg-white p-5">
              <h2 class="text-[16px] font-bold text-[var(--brand-text)]">Screening questions</h2>
              <p class="text-[13px] text-[var(--brand-text-quiet)] mb-3">Candidates answer these questions before applying.</p>
              <div class="space-y-2.5">
                <div v-for="q in screeningFields" :key="q.id" class="rounded-xl border border-[var(--brand-border-light)] bg-white p-3.5">
                  <div class="flex items-center gap-2.5">
                    <GripVertical class="w-4 h-4 text-[var(--brand-text-faint)] shrink-0" />
                    <Input v-model="q.label" placeholder="Type your question…" class="flex-1 h-9 rounded-lg border-[var(--brand-border)]" />
                    <select v-model="q.type" :class="[fieldCls, 'w-36']"><option v-for="t in QUESTION_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option></select>
                    <button type="button" class="w-8 h-8 rounded-md grid place-items-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] hover:text-[var(--brand-danger)] transition" aria-label="Remove question" @click="removeField(q.id)"><Trash2 class="w-4 h-4" /></button>
                  </div>
                  <div class="mt-2.5 ml-6 flex items-center gap-5 text-[13px]">
                    <label class="inline-flex items-center gap-1.5 cursor-pointer"><input v-model="q.required" type="checkbox" class="accent-[var(--brand-teal)]"> Required</label>
                    <label class="inline-flex items-center gap-1.5">Visibility
                      <select v-model="q.visibility" class="h-8 rounded-md border border-[var(--brand-border)] bg-white px-2 text-[13px]"><option value="everyone">Everyone</option><option value="me">Only me</option></select>
                    </label>
                  </div>
                </div>
                <button type="button" class="w-full h-11 rounded-xl border border-dashed border-[var(--brand-border)] text-[13.5px] font-semibold text-[var(--brand-text-secondary)] inline-flex items-center justify-center gap-1.5 hover:border-[var(--brand-teal)] hover:text-[var(--brand-teal)] transition" @click="addQuestion"><Plus class="w-4 h-4" /> Add question</button>
              </div>
            </section>
          </div>

          <!-- Live preview -->
          <div class="rounded-2xl border border-[var(--brand-border-light)] bg-[var(--brand-canvas)] p-5 lg:sticky lg:top-2">
            <div class="text-[12px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)] mb-3">Preview</div>
            <div class="rounded-xl bg-white border border-[var(--brand-border-light)] p-5">
              <div class="text-[15px] font-bold text-[var(--brand-text)]">{{ pool.name }}</div>
              <p class="text-[12.5px] text-[var(--brand-text-quiet)] mb-4">Apply to join this talent pool.</p>

              <div v-if="enabledCandidate.length" class="text-[11px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)] mb-2.5">Candidate information</div>
              <div class="space-y-3.5">
                <div v-for="f in enabledCandidate" :key="f.id">
                  <label class="block text-[12.5px] font-semibold text-[var(--brand-text-secondary)] mb-1">{{ f.label }} <span v-if="f.required" class="text-[var(--brand-danger)]">*</span></label>
                  <textarea v-if="f.type === 'textarea'" rows="2" disabled class="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--brand-canvas)] px-3 py-2 text-[13px]" />
                  <label v-else-if="f.type === 'file'" class="flex items-center gap-2 h-14 rounded-lg border-[1.5px] border-dashed border-[var(--brand-border)] bg-[var(--brand-canvas)] px-3 text-[12.5px] text-[var(--brand-text-quiet)]"><UploadCloud class="w-4 h-4" /> Upload PDF/Word</label>
                  <div v-else class="w-full h-10 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-canvas)]" />
                </div>
              </div>

              <template v-if="enabledScreening.length">
                <div class="text-[11px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)] mt-5 mb-2.5">Screening questions</div>
                <div class="space-y-3.5">
                  <div v-for="q in enabledScreening" :key="q.id">
                    <label class="block text-[12.5px] font-semibold text-[var(--brand-text-secondary)] mb-1">{{ q.label }} <span v-if="q.required" class="text-[var(--brand-danger)]">*</span></label>
                    <textarea v-if="q.type === 'textarea'" rows="2" disabled class="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--brand-canvas)] px-3 py-2 text-[13px]" />
                    <div v-else-if="q.type === 'yesno'" class="flex gap-2">
                      <span class="h-9 px-4 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-canvas)] text-[13px] grid place-items-center">Yes</span>
                      <span class="h-9 px-4 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-canvas)] text-[13px] grid place-items-center">No</span>
                    </div>
                    <div v-else class="w-full h-10 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-canvas)]" />
                  </div>
                </div>
              </template>

              <div class="mt-5 h-10 rounded-lg bg-[var(--brand-teal)] text-white text-[13.5px] font-bold grid place-items-center">Submit application</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
