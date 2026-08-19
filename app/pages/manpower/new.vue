<script setup lang="ts">
import { ArrowLeft, Building2, CalendarDays, Check, ChevronDown, Download, UploadCloud, Plus } from 'lucide-vue-next'
import { BrandButton } from '~/components/brand'
import { Input } from '~/components/ui/input'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import { useManpowerMeta, useManpowerMutations } from '~/composables/useManpower'
import type { ManpowerBudgetKind } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const { data: meta } = useManpowerMeta()
const departments = computed(() => meta.value?.departments ?? [])
const locations = computed(() => meta.value?.locations ?? [])
const { create } = useManpowerMutations()

const step = ref(1)
const kind = ref<ManpowerBudgetKind>(route.query.kind === 'project' ? 'project' : 'headcount')
const name = ref('')
const startDate = ref('')
const endDate = ref('')
const selDepts = ref<string[]>([])
const selLocs = ref<string[]>([])
const visibility = ref('Everyone')
const touched = ref(false)

function toggleDept(v: string) { selDepts.value = selDepts.value.includes(v) ? selDepts.value.filter(x => x !== v) : [...selDepts.value, v] }
function toggleLoc(v: string) { selLocs.value = selLocs.value.includes(v) ? selLocs.value.filter(x => x !== v) : [...selLocs.value, v] }
const step1Valid = computed(() => name.value.trim() && startDate.value && endDate.value && selDepts.value.length && selLocs.value.length)

function submit() {
  create.mutate({ name: name.value.trim(), kind: kind.value, startDate: startDate.value, endDate: endDate.value, departments: selDepts.value, locations: selLocs.value, visibility: visibility.value }, {
    onSuccess: () => navigateTo('/manpower'),
  })
}

const cardCls = 'rounded-2xl border border-[var(--brand-border-light)] bg-white p-6'
const labelCls = 'block text-[14px] font-bold text-[var(--brand-text)] mb-1.5'
const fieldCls = 'w-full h-11 rounded-lg border border-[var(--brand-border)] bg-white px-3.5 text-[14px] outline-none focus:border-[var(--brand-teal)] transition-colors'
</script>

<template>
  <div class="flex flex-col h-full min-w-0 overflow-hidden bg-[var(--brand-surface-white)] border-t border-[var(--brand-border)]">
    <div class="px-6 pt-5 pb-3 flex items-center gap-3">
      <button type="button" class="w-9 h-9 rounded-lg grid place-items-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-lime-tint-hover)] transition" aria-label="Back" @click="navigateTo('/manpower')"><ArrowLeft class="w-5 h-5" /></button>
      <div>
        <h1 class="text-[22px] font-bold text-[var(--brand-text)]">Create a manpower plan</h1>
        <p class="text-[13px] text-[var(--brand-text-quiet)]">{{ kind === 'headcount' ? 'Headcount Budget' : 'Project Budget' }}</p>
      </div>
    </div>

    <!-- Stepper -->
    <div class="px-6 pb-4 flex items-center gap-3">
      <div v-for="s in [{ n: 1, t: 'Details' }, { n: 2, t: 'Upload plan' }]" :key="s.n" class="flex items-center gap-2">
        <span class="w-6 h-6 rounded-full grid place-items-center text-[12px] font-bold" :class="step >= s.n ? 'bg-[var(--brand-teal)] text-white' : 'bg-[var(--brand-canvas)] text-[var(--brand-text-quiet)]'">{{ s.n }}</span>
        <span class="text-[13px] font-semibold" :class="step >= s.n ? 'text-[var(--brand-text)]' : 'text-[var(--brand-text-quiet)]'">{{ s.t }}</span>
        <span v-if="s.n === 1" class="w-8 h-px bg-[var(--brand-border)]" />
      </div>
    </div>

    <div class="flex-1 overflow-auto px-6 pb-10">
      <div class="max-w-[820px] mx-auto space-y-5">
        <!-- Step 1 -->
        <template v-if="step === 1">
          <section :class="cardCls">
            <label :class="labelCls">Plan type</label>
            <div class="grid grid-cols-2 gap-3 max-w-[520px]">
              <button type="button" class="flex items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-3 text-left transition" :class="kind === 'headcount' ? 'border-[var(--brand-teal)] bg-[var(--brand-lime-tint-hover)]' : 'border-[var(--brand-border-light)] hover:border-[var(--brand-border)]'" @click="kind = 'headcount'"><Building2 class="w-5 h-5 text-[var(--brand-teal)]" /><span class="block text-[13.5px] font-semibold text-[var(--brand-text)]">Headcount Budget</span></button>
              <button type="button" class="flex items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-3 text-left transition" :class="kind === 'project' ? 'border-[var(--brand-teal)] bg-[var(--brand-lime-tint-hover)]' : 'border-[var(--brand-border-light)] hover:border-[var(--brand-border)]'" @click="kind = 'project'"><CalendarDays class="w-5 h-5 text-[var(--brand-teal)]" /><span class="block text-[13.5px] font-semibold text-[var(--brand-text)]">Project Budget</span></button>
            </div>
          </section>

          <section :class="cardCls">
            <div class="grid gap-5 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label :class="labelCls">Name <span class="text-[var(--brand-danger)]">*</span></label>
                <Input v-model="name" placeholder="e.g. 2026 Annual Manpower Plan" :class="[fieldCls, touched && !name.trim() ? 'border-[var(--brand-danger)]' : '']" />
              </div>
              <div><label :class="labelCls">Start date <span class="text-[var(--brand-danger)]">*</span></label><input v-model="startDate" type="date" :class="fieldCls"></div>
              <div><label :class="labelCls">End date <span class="text-[var(--brand-danger)]">*</span></label><input v-model="endDate" type="date" :class="fieldCls"></div>

              <div>
                <label :class="labelCls">Departments <span class="text-[var(--brand-danger)]">*</span></label>
                <Popover>
                  <PopoverTrigger as-child>
                    <button type="button" :class="[fieldCls, 'flex items-center justify-between text-left']"><span :class="selDepts.length ? 'text-[var(--brand-text)]' : 'text-[var(--brand-text-quiet)]'">{{ selDepts.length ? `${selDepts.length} selected` : 'Select departments' }}</span><ChevronDown class="w-4 h-4 text-[var(--brand-text-quiet)]" /></button>
                  </PopoverTrigger>
                  <PopoverContent align="start" class="w-[var(--reka-popover-trigger-width)] p-1.5 max-h-[260px] overflow-y-auto rounded-xl">
                    <button v-for="d in departments" :key="d" type="button" class="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-[13.5px] text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition" @click="toggleDept(d)"><span class="w-4 h-4 rounded border grid place-items-center" :class="selDepts.includes(d) ? 'bg-[var(--brand-teal)] border-[var(--brand-teal)]' : 'border-[var(--brand-border)]'"><Check v-if="selDepts.includes(d)" class="w-3 h-3 text-white" /></span>{{ d }}</button>
                  </PopoverContent>
                </Popover>
                <div v-if="selDepts.length" class="flex flex-wrap gap-1.5 mt-2"><span v-for="d in selDepts" :key="d" class="inline-flex items-center h-6 px-2 rounded-md bg-[var(--brand-lime-tint)] text-[12px] font-semibold text-[var(--brand-olive)]">{{ d }}</span></div>
              </div>

              <div>
                <label :class="labelCls">Locations <span class="text-[var(--brand-danger)]">*</span></label>
                <Popover>
                  <PopoverTrigger as-child>
                    <button type="button" :class="[fieldCls, 'flex items-center justify-between text-left']"><span :class="selLocs.length ? 'text-[var(--brand-text)]' : 'text-[var(--brand-text-quiet)]'">{{ selLocs.length ? `${selLocs.length} selected` : 'Select locations' }}</span><ChevronDown class="w-4 h-4 text-[var(--brand-text-quiet)]" /></button>
                  </PopoverTrigger>
                  <PopoverContent align="start" class="w-[var(--reka-popover-trigger-width)] p-1.5 max-h-[260px] overflow-y-auto rounded-xl">
                    <button v-for="l in locations" :key="l" type="button" class="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-[13.5px] text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition" @click="toggleLoc(l)"><span class="w-4 h-4 rounded border grid place-items-center" :class="selLocs.includes(l) ? 'bg-[var(--brand-teal)] border-[var(--brand-teal)]' : 'border-[var(--brand-border)]'"><Check v-if="selLocs.includes(l)" class="w-3 h-3 text-white" /></span>{{ l }}</button>
                  </PopoverContent>
                </Popover>
                <div v-if="selLocs.length" class="flex flex-wrap gap-1.5 mt-2"><span v-for="l in selLocs" :key="l" class="inline-flex items-center h-6 px-2 rounded-md bg-[var(--brand-lime-tint)] text-[12px] font-semibold text-[var(--brand-olive)]">{{ l }}</span></div>
              </div>

              <div class="sm:col-span-2">
                <label :class="labelCls">Visibility</label>
                <select v-model="visibility" :class="fieldCls"><option>Everyone</option><option>Selected members</option><option>Only me</option></select>
              </div>
            </div>
          </section>

          <div class="flex justify-end">
            <BrandButton variant="primary-teal" size="md" :disabled="!step1Valid" @click="touched = true; step1Valid && (step = 2)">Next</BrandButton>
          </div>
        </template>

        <!-- Step 2 -->
        <template v-else>
          <section :class="cardCls">
            <h2 class="text-[16px] font-bold text-[var(--brand-text)]">Upload job titles &amp; allocations</h2>
            <p class="text-[13px] text-[var(--brand-text-quiet)] mb-4">Download the template, fill in Department, Sub-Department, Job Title, Location, Current HC, Planned HC and Allocation, then upload. Roles with Planned HC &gt; 0 auto-create approved requisitions.</p>
            <BrandButton variant="outline" size="md" class="gap-2 mb-4"><Download class="w-4 h-4" /> Download CSV template</BrandButton>
            <label class="flex flex-col items-center justify-center gap-2 h-40 rounded-xl border-[1.5px] border-dashed border-[var(--brand-border)] bg-[var(--brand-canvas)] text-[13px] text-[var(--brand-text-quiet)] cursor-pointer hover:border-[var(--brand-teal)] transition">
              <UploadCloud class="w-7 h-7" /> Drop your CSV / XLSX here or click to browse
              <input type="file" class="hidden" accept=".csv,.xlsx">
            </label>
          </section>

          <div class="flex items-center justify-between">
            <BrandButton variant="ghost" size="md" @click="step = 1">Back</BrandButton>
            <div class="flex items-center gap-2">
              <BrandButton variant="outline" size="md" class="gap-1.5" :disabled="create.isPending.value" @click="submit"><Plus class="w-4 h-4" /> Create empty plan</BrandButton>
              <BrandButton variant="primary-teal" size="md" :disabled="create.isPending.value" @click="submit">Create plan</BrandButton>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
