<script setup lang="ts">
import { Check, UploadCloud } from 'lucide-vue-next'
import { useTalentPool } from '~/composables/useTalentPools'

definePageMeta({ layout: false })

const route = useRoute()
const id = computed(() => String(route.params.id))
const { data: pool } = useTalentPool(id)

const enabledFields = computed(() => (pool.value?.formFields ?? []).filter(f => f.enabled))
const candidateFields = computed(() => enabledFields.value.filter(f => (f.section ?? 'candidate') === 'candidate'))
const screeningFields = computed(() => enabledFields.value.filter(f => f.section === 'screening'))
const sections = computed(() => [
  { title: 'Candidate information', items: candidateFields.value },
  { title: 'Screening questions', items: screeningFields.value },
].filter(s => s.items.length))
const answers = reactive<Record<string, string>>({})
const touched = ref(false)
const submitted = ref(false)
const submitting = ref(false)

const missing = computed(() => enabledFields.value.filter(f => f.required && f.type !== 'file' && !(answers[f.id] ?? '').trim()).map(f => f.id))
async function submit() {
  touched.value = true
  if (missing.value.length) return
  submitting.value = true
  try {
    const res = await fetch(`/api/talent-pools/${id.value}/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) })
    if (res.ok) submitted.value = true
  }
  finally { submitting.value = false }
}
const fieldCls = 'w-full h-11 rounded-lg border bg-white px-3.5 text-[14px] outline-none focus:border-[var(--brand-teal)] transition-colors'
</script>

<template>
  <div class="min-h-screen bg-[var(--brand-canvas)] flex items-start justify-center px-4 py-10">
    <div class="w-full max-w-[560px]">
      <div v-if="submitted" class="rounded-2xl bg-white border border-[var(--brand-border-light)] p-10 text-center">
        <div class="w-14 h-14 mx-auto rounded-full bg-[var(--brand-status-approved-bg)] text-[var(--brand-status-approved-text)] grid place-items-center mb-4"><Check class="w-7 h-7" stroke-width="2.5" /></div>
        <h1 class="text-[20px] font-bold text-[var(--brand-text)]">Application submitted successfully</h1>
        <p class="text-[14px] text-[var(--brand-text-quiet)] mt-1.5">Thanks — your details were added to <strong>{{ pool?.name }}</strong>. We'll reach out about future opportunities.</p>
      </div>

      <div v-else-if="pool" class="rounded-2xl bg-white border border-[var(--brand-border-light)] overflow-hidden">
        <div class="px-7 pt-7 pb-4 border-b border-[var(--brand-border-fade)]">
          <h1 class="text-[22px] font-bold text-[var(--brand-text)]">{{ pool.name }}</h1>
          <p class="text-[13.5px] text-[var(--brand-text-quiet)] mt-1">Can't find the right role? Apply here and we'll keep you in mind for future openings.</p>
        </div>
        <form class="px-7 py-6 space-y-6" @submit.prevent="submit">
          <div v-for="sec in sections" :key="sec.title" class="space-y-4">
            <div class="text-[11.5px] font-bold uppercase tracking-wide text-[var(--brand-text-quiet)]">{{ sec.title }}</div>
            <div v-for="f in sec.items" :key="f.id">
              <label class="block text-[13px] font-semibold text-[var(--brand-text)] mb-1.5">{{ f.label }} <span v-if="f.required" class="text-[var(--brand-danger)]">*</span></label>
              <textarea v-if="f.type === 'textarea'" v-model="answers[f.id]" rows="3" :class="[fieldCls, 'h-auto py-2', touched && missing.includes(f.id) ? 'border-[var(--brand-danger)]' : 'border-[var(--brand-border)]']" />
              <label v-else-if="f.type === 'file'" class="flex items-center justify-center gap-2 h-20 rounded-lg border-[1.5px] border-dashed border-[var(--brand-border)] bg-[var(--brand-canvas)] text-[13px] text-[var(--brand-text-quiet)] cursor-pointer"><UploadCloud class="w-5 h-5" /> Upload PDF or Word — up to 10MB<input type="file" class="hidden" accept=".pdf,.doc,.docx"></label>
              <div v-else-if="f.type === 'yesno'" class="flex gap-2.5">
                <label class="flex-1 h-11 rounded-lg border border-[var(--brand-border)] grid place-items-center text-[13.5px] cursor-pointer" :class="answers[f.id] === 'Yes' ? 'border-[var(--brand-teal)] bg-[var(--brand-lime-tint-hover)]' : ''"><input v-model="answers[f.id]" type="radio" value="Yes" class="sr-only"> Yes</label>
                <label class="flex-1 h-11 rounded-lg border border-[var(--brand-border)] grid place-items-center text-[13.5px] cursor-pointer" :class="answers[f.id] === 'No' ? 'border-[var(--brand-teal)] bg-[var(--brand-lime-tint-hover)]' : ''"><input v-model="answers[f.id]" type="radio" value="No" class="sr-only"> No</label>
              </div>
              <input v-else v-model="answers[f.id]" :type="f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'" :class="[fieldCls, touched && missing.includes(f.id) ? 'border-[var(--brand-danger)]' : 'border-[var(--brand-border)]']">
              <p v-if="touched && missing.includes(f.id)" class="mt-1 text-[12px] text-[var(--brand-danger)]">This field is required.</p>
            </div>
          </div>
          <button type="submit" :disabled="submitting" class="w-full h-11 rounded-lg bg-[var(--brand-teal)] text-white text-[14px] font-bold hover:brightness-110 disabled:opacity-50 transition">Submit application</button>
        </form>
      </div>

      <div v-else class="rounded-2xl bg-white border border-[var(--brand-border-light)] p-10 text-center text-[14px] text-[var(--brand-text-quiet)]">This form is not available.</div>
    </div>
  </div>
</template>
