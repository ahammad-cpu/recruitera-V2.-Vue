<!--
  Career site — JOB DETAIL + APPLY. Cover banner on top, left-aligned content
  card (Overview + Application tabs). Props: jobId. Emits back.
  Job from useJobs(); themed + covered by useCareerSite().
-->
<script setup lang="ts">
import { ArrowLeft, MapPin, Building2, Check, UploadCloud } from 'lucide-vue-next'
import { useJobs } from '~/composables/useJobs'
import { useCompany } from '~/composables/useCompany'
import { useCareerSite } from '~/composables/useCareerSite'
import { ccEmploymentType, ccWorkLabel, ccOverview, CC_SCREENING } from '~/utils/careerJob'

const { jobId } = defineProps<{ jobId: string }>()
const emit = defineEmits<{ back: [] }>()

const { jobs } = useJobs()
const { data: company } = useCompany()
const { coverType, coverUrl } = useCareerSite()
const companyName = computed(() => company.value?.name || 'Your Company')
const job = computed(() => jobs.value.find(j => j.id === jobId))
const overview = computed(() => job.value ? ccOverview(job.value) : null)
const isImageCover = computed(() => coverType.value === 'image' && !!coverUrl.value)

const tab = ref<'overview' | 'application'>('overview')
const form = reactive({ fullName: '', gender: '', email: '', phone: '', resume: '', photo: '' })
const answers = ref<string[]>(CC_SCREENING.map(() => ''))
const submitted = ref(false)
const canSubmit = computed(() => form.fullName.trim() && form.email.trim() && form.resume)
function onResume(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) form.resume = f.name }
function submit() { if (canSubmit.value) submitted.value = true }
function clearForm() { Object.assign(form, { fullName: '', gender: '', email: '', phone: '', resume: '', photo: '' }); answers.value = CC_SCREENING.map(() => '') }

const inputCls = 'w-full h-12 px-4 rounded-[11px] border border-[#e3e6ea] bg-white text-[14.5px] outline-none focus:border-[color:var(--cc-primary)] placeholder:text-[#9aa1ab]'
</script>

<template>
  <div v-if="job">
    <!-- Cover banner (framed image with blurred fill, or gradient) -->
    <section v-if="isImageCover" class="relative overflow-hidden">
      <img :src="coverUrl" alt="" aria-hidden="true" class="absolute inset-0 h-full w-full object-cover scale-125 blur-2xl">
      <div class="relative mx-auto max-w-[1520px] px-2 pt-[86px]">
        <img :src="coverUrl" alt="" class="block w-full h-auto rounded-t-[24px] shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
      </div>
    </section>
    <section v-else class="pt-[86px] pb-24" style="background:linear-gradient(135deg, var(--cc-primary), color-mix(in srgb, var(--cc-primary) 45%, #0b1220))" />

    <!-- Content card overlapping the cover -->
    <div class="relative z-10 mx-auto max-w-[1160px] px-6 -mt-16 pb-16">
      <div class="rounded-[22px] bg-white border border-[#eceef1] shadow-[0_28px_70px_rgba(15,23,42,0.12)] p-7 md:p-10">
        <button type="button" class="inline-flex items-center gap-1.5 text-[14px] font-semibold transition hover:opacity-70" :style="{ color: 'var(--cc-primary)' }" @click="emit('back')"><ArrowLeft class="w-4 h-4" stroke-width="2" /> Back</button>

        <div class="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center h-7 px-3 rounded-full text-[12px] font-bold" :style="{ background: 'color-mix(in srgb, var(--cc-primary) 12%, white)', color: 'var(--cc-primary)' }">{{ ccEmploymentType(job) }}</span>
              <span class="inline-flex items-center h-7 px-3 rounded-full text-[12px] font-bold" :class="job.collar === 'blue' ? 'bg-[#fdecec] text-[#b02a2a]' : 'bg-[#eef2ff] text-[#3b5bdb]'">{{ job.collar === 'blue' ? 'Blue Collar' : 'White Collar' }}</span>
            </div>
            <h1 class="mt-3 text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-[-0.02em]" :style="{ color: 'var(--cc-header)' }">{{ job.title }}</h1>
            <div class="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-[#8a919c]">
              <span v-if="job.location" class="inline-flex items-center gap-1.5"><MapPin class="w-4 h-4" stroke-width="1.8" />{{ job.location }}</span>
              <span v-if="job.department" class="inline-flex items-center gap-1.5"><Building2 class="w-4 h-4" stroke-width="1.8" />{{ job.department }}</span>
              <span>{{ ccWorkLabel(job.workModel) }}</span>
            </div>
          </div>
          <button type="button" class="h-12 px-7 rounded-[13px] text-white text-[15px] font-bold transition duration-150 hover:brightness-110 active:scale-[0.97]" :style="{ background: 'var(--cc-primary)' }" @click="tab = 'application'">Apply</button>
        </div>

        <div class="mt-9 flex items-center gap-8 border-b-[1.5px] border-[#d1d5db]">
          <button v-for="t in (['overview','application'] as const)" :key="t" type="button"
            class="pb-3.5 -mb-[1.5px] border-b-[2.5px] text-[15px] font-semibold transition"
            :style="tab === t ? { borderColor: 'var(--cc-primary)', color: 'var(--cc-primary)' } : {}"
            :class="tab === t ? '' : 'border-transparent text-[#8a919c] hover:text-[#4b5563]'"
            @click="tab = t">{{ t === 'overview' ? 'Overview' : 'Application' }}</button>
        </div>

        <!-- Overview -->
        <div v-if="tab === 'overview' && overview" class="mt-8 flex flex-col gap-8">
          <div>
            <h2 class="text-[18px] font-bold" :style="{ color: 'var(--cc-header)' }">Job Description</h2>
            <p class="mt-2 text-[15px] leading-relaxed text-[#374151]">{{ overview.description }}</p>
          </div>
          <div>
            <h2 class="text-[18px] font-bold" :style="{ color: 'var(--cc-header)' }">Responsibilities</h2>
            <ul class="mt-2 flex flex-col gap-1.5">
              <li v-for="r in overview.responsibilities" :key="r" class="flex items-start gap-2.5 text-[15px] text-[#374151]"><Check class="w-4 h-4 mt-1 shrink-0" :style="{ color: 'var(--cc-primary)' }" stroke-width="2.4" />{{ r }}</li>
            </ul>
          </div>
          <div>
            <h2 class="text-[18px] font-bold" :style="{ color: 'var(--cc-header)' }">Requirements</h2>
            <ul class="mt-2 flex flex-col gap-1.5">
              <li v-for="r in overview.requirements" :key="r" class="flex items-start gap-2.5 text-[15px] text-[#374151]"><Check class="w-4 h-4 mt-1 shrink-0" :style="{ color: 'var(--cc-primary)' }" stroke-width="2.4" />{{ r }}</li>
            </ul>
          </div>
          <div>
            <h2 class="text-[18px] font-bold" :style="{ color: 'var(--cc-header)' }">Benefits</h2>
            <ul class="mt-2 flex flex-col gap-1.5">
              <li v-for="b in overview.benefits" :key="b" class="flex items-start gap-2.5 text-[15px] text-[#374151]"><Check class="w-4 h-4 mt-1 shrink-0" :style="{ color: 'var(--cc-primary)' }" stroke-width="2.4" />{{ b }}</li>
            </ul>
          </div>
          <button type="button" class="w-full py-4 rounded-[14px] text-white text-[15.5px] font-bold transition duration-150 hover:brightness-110 active:scale-[0.99]" :style="{ background: 'var(--cc-primary)' }" @click="tab = 'application'">Apply for this job</button>
        </div>

        <!-- Application -->
        <div v-else-if="tab === 'application'" class="mt-8">
          <div v-if="submitted" class="rounded-[16px] border border-[#eceef1] bg-[#f7f8fa] px-6 py-16 text-center">
            <div class="w-14 h-14 mx-auto rounded-full grid place-items-center text-white" :style="{ background: 'var(--cc-primary)' }"><Check class="w-7 h-7" stroke-width="2.5" /></div>
            <h2 class="mt-4 text-[20px] font-extrabold" :style="{ color: 'var(--cc-header)' }">Application submitted</h2>
            <p class="mt-1.5 text-[14px] text-[#6b7280]">Thanks, {{ form.fullName || 'there' }} — we've received your application for {{ job.title }} and will be in touch.</p>
          </div>

          <form v-else class="flex flex-col gap-8" @submit.prevent="submit">
            <div>
              <h2 class="text-[18px] font-bold" :style="{ color: 'var(--cc-header)' }">Personal Information</h2>
              <div class="mt-4 grid gap-4 sm:grid-cols-2">
                <div><label class="block text-[13px] font-semibold mb-1.5 text-[#374151]">Full Name <span class="text-[#dc2626]">*</span></label><input v-model="form.fullName" :class="inputCls" placeholder="Write Full Name"></div>
                <div><label class="block text-[13px] font-semibold mb-1.5 text-[#374151]">Gender</label><select v-model="form.gender" :class="inputCls"><option value="">Choose an option…</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></div>
                <div><label class="block text-[13px] font-semibold mb-1.5 text-[#374151]">Email <span class="text-[#dc2626]">*</span></label><input v-model="form.email" type="email" :class="inputCls" placeholder="Write Email"></div>
                <div><label class="block text-[13px] font-semibold mb-1.5 text-[#374151]">Phone Number</label><input v-model="form.phone" :class="inputCls" placeholder="+20 10 01234567"></div>
              </div>
              <div class="mt-4">
                <label class="block text-[13px] font-semibold mb-1.5 text-[#374151]">Resume <span class="text-[#dc2626]">*</span></label>
                <label class="flex items-center justify-center gap-2 h-24 rounded-[12px] border-[1.5px] border-dashed border-[#dfe3e8] bg-[#fafbfc] cursor-pointer text-[13.5px] text-[#6b7280] hover:border-[color:var(--cc-primary)] transition">
                  <UploadCloud class="w-5 h-5 text-[#9aa1ab]" stroke-width="1.8" />
                  <span><span class="font-semibold" :style="{ color: 'var(--cc-primary)' }">{{ form.resume || 'Upload a file' }}</span> {{ form.resume ? '' : 'or drag and drop · PDF, Word up to 10MB' }}</span>
                  <input type="file" class="hidden" accept=".pdf,.doc,.docx" @change="onResume">
                </label>
              </div>
            </div>

            <div>
              <h2 class="text-[18px] font-bold" :style="{ color: 'var(--cc-header)' }">Screening Questions</h2>
              <div class="mt-4 flex flex-col gap-4">
                <div v-for="(q, i) in CC_SCREENING" :key="i">
                  <label class="block text-[14px] font-medium mb-1.5 text-[#374151]">{{ q }} <span class="text-[#dc2626]">*</span></label>
                  <input v-model="answers[i]" :class="inputCls" placeholder="Your answer">
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3 pt-2 border-t border-[#eceef1]">
              <button type="button" class="h-11 px-5 rounded-[11px] border border-[#e3e6ea] bg-white text-[14px] font-semibold text-[#4b5563] hover:border-[#c3c8cf] transition" @click="clearForm">Clear Form</button>
              <button type="submit" :disabled="!canSubmit" class="h-11 px-6 rounded-[11px] text-white text-[14px] font-bold transition disabled:opacity-50 hover:brightness-110" :style="{ background: 'var(--cc-primary)' }">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="mx-auto max-w-[900px] px-6 py-24 text-center">
    <div class="text-[18px] font-bold" :style="{ color: 'var(--cc-header)' }">Role not found</div>
    <button type="button" class="mt-3 text-[14px] font-semibold" :style="{ color: 'var(--cc-primary)' }" @click="emit('back')">← Back to opportunities</button>
  </div>
</template>
