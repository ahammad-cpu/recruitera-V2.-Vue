<script setup lang="ts">
import {
  ArrowLeft, Pencil, Send, MoreHorizontal, Check, X, Clock, Plus, Trash2,
  Copy, Archive, Sparkles, MapPin, Building2,
  Bold, Italic, Underline, List, ListOrdered, ListChecks, Link2, Paperclip, AtSign, Smile,
  Eye, ChevronRight, MessageSquare, MoreVertical, ThumbsUp, Activity as ActivityIcon,
} from 'lucide-vue-next'
import { BrandButton, BrandAvatarInitials } from '~/components/brand'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Textarea } from '~/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog'
import RequisitionStatusBadge from '~/components/requisitions/RequisitionStatusBadge.vue'
import { useRequisition, useRequisitionMutations, useRequisitionCurrentUser } from '~/composables/useRequisitions'
import { useRequisitionNotes, type NoteVisibility } from '~/composables/useRequisitionNotes'
import {
  WORKPLACE_OPTIONS, EMPLOYMENT_OPTIONS, EXPERIENCE_OPTIONS, CURRENCY_OPTIONS, OPENING_REASONS, MONTH_OPTIONS,
  REQUISITION_DEPARTMENTS, REQUISITION_LOCATIONS,
  type Requisition, type RequisitionApprovalStep, type RequisitionJobOpening, type UpdateRequisitionInput,
} from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const { data: reqData, isLoading } = useRequisition(id)
const { data: me } = useRequisitionCurrentUser()
const { update, submit, approve, reject, duplicate, archive, remove } = useRequisitionMutations()

const TABS = ['Details', 'Approval flow', 'Notes', 'Files', 'Jobs', 'Hires', 'Team', 'Activity']
const tab = ref('Details')

// Editable form mirrors the requisition; persisted with "Save changes".
const form = reactive<Partial<Requisition>>({})
watch(reqData, (r) => { if (r) Object.assign(form, structuredClone(toRaw(r))) }, { immediate: true })

const editingTitle = ref(false)
const errorMsg = ref('')
const savedFlash = ref(false)

const isOwner = computed(() => !!me.value && reqData.value?.requesterId === me.value.id)
const isDraft = computed(() => reqData.value?.status === 'draft')

const stepSatisfied = (s: RequisitionApprovalStep) =>
  s.rule === 'any' ? s.approvers.some(a => a.decision === 'approved') : s.approvers.every(a => a.decision === 'approved')
const activeStep = computed(() => reqData.value?.approvalSteps.find(s => !stepSatisfied(s)))
const canDecide = computed(() => {
  const r = reqData.value
  if (!r || r.status !== 'pending' || !me.value) return false
  return !!activeStep.value?.approvers.some(a => a.userId === me.value!.id && a.decision === 'pending')
})

function saveChanges() {
  errorMsg.value = ''
  const input: UpdateRequisitionInput = {
    title: form.title, department: form.department, joiningMonth: form.joiningMonth,
    workplace: form.workplace, employmentType: form.employmentType, experience: form.experience,
    salaryCurrency: form.salaryCurrency,
    salaryFrom: form.salaryFrom === null || form.salaryFrom === undefined ? null : Number(form.salaryFrom),
    salaryTo: form.salaryTo === null || form.salaryTo === undefined ? null : Number(form.salaryTo),
    jobOpenings: form.jobOpenings, customQuestions: form.customQuestions,
  }
  update.mutate({ id: id.value, input }, { onSuccess: () => { savedFlash.value = true; editingTitle.value = false; setTimeout(() => (savedFlash.value = false), 1800) } })
}
function requestApproval() {
  errorMsg.value = ''
  submit.mutate(id.value, { onError: e => (errorMsg.value = (e as Error).message) })
}

// Approve / reject
const decisionNote = ref('')
function onApprove() { approve.mutate({ id: id.value, note: decisionNote.value.trim() || undefined }, { onSuccess: () => (decisionNote.value = '') }) }
function onReject() { if (decisionNote.value.trim()) reject.mutate({ id: id.value, note: decisionNote.value.trim() }, { onSuccess: () => (decisionNote.value = '') }) }

// Job openings editor
const addingOpening = ref(false)
const openingDraft = reactive({ reason: '', explanation: '' })
function resetDraft() { openingDraft.reason = ''; openingDraft.explanation = '' }
function addOpening(another: boolean) {
  if (!openingDraft.reason) return
  const item: RequisitionJobOpening = { id: `o${Date.now()}`, reason: openingDraft.reason, explanation: openingDraft.explanation }
  ;(form.jobOpenings ??= []).push(item)
  resetDraft()
  if (!another) addingOpening.value = false
}
function removeOpening(oid: string) { form.jobOpenings = (form.jobOpenings ?? []).filter(o => o.id !== oid) }

function toggleLocation(loc: string) {
  const arr = (form.locations ??= [])
  const i = arr.indexOf(loc)
  if (i === -1) arr.push(loc)
  else arr.splice(i, 1)
}

// ── Notes tab (local, mirrors the jobs Notes tab) ──
const { notes: reqNotes, addNote, removeNote } = useRequisitionNotes(id.value)
const noteDraft = ref('')
const noteVisibility = ref<NoteVisibility>('everyone')
const VIS_LABEL: Record<NoteVisibility, string> = { everyone: 'Visible to everyone', admins: 'Visible to admins', me: 'Visible to only me' }
function saveNote() { addNote(noteDraft.value, noteVisibility.value); noteDraft.value = '' }
function cancelNote() { noteDraft.value = '' }

// ── Activity tab — group the requisition's activity by date (jobs-style) ──
function actorInitials(name: string) { return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?' }
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ago`
  const h = Math.floor(diff / 3600000)
  if (h > 0) return `${h}h ago`
  const m = Math.floor(diff / 60000)
  return m > 0 ? `${m}m ago` : 'just now'
}
const activityGroups = computed(() => {
  const items = reqData.value?.activity ?? []
  const map = new Map<string, typeof items>()
  for (const a of items) {
    const d = new Date(a.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(a)
  }
  return [...map.entries()].map(([date, list]) => ({ date, items: list }))
})

const confirmDelete = ref(false)
function doDelete() { remove.mutate(id.value, { onSuccess: () => navigateTo('/requisitions') }) }

function stepRuleLabel(s: RequisitionApprovalStep) { return s.rule === 'any' ? 'Any approver' : 'All assigned approvers' }

const fieldCls = 'w-full h-10 rounded-lg border border-[var(--brand-border)] bg-white px-3 text-[14px] text-[var(--brand-text)] outline-none focus:border-[var(--brand-teal)] transition-colors disabled:bg-[var(--brand-canvas)] disabled:text-[var(--brand-text-muted)]'
const labelCls = 'block text-[13px] font-semibold text-[var(--brand-text)] mb-1.5'
const reqStar = 'text-[var(--brand-danger)]'
</script>

<template>
  <div class="flex flex-col h-full min-w-0 overflow-hidden bg-[var(--brand-surface-white)] border-t border-[var(--brand-border)]">
    <div v-if="isLoading && !reqData" class="p-6 space-y-4">
      <div class="h-8 w-64 rounded-lg bg-[var(--brand-canvas)] animate-pulse" />
      <div class="h-64 rounded-2xl bg-[var(--brand-canvas)] animate-pulse" />
    </div>

    <template v-else-if="reqData">
      <!-- Header -->
      <div class="px-6 pt-5 pb-3 flex items-start justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-3 min-w-0">
          <button type="button" class="w-9 h-9 rounded-lg grid place-items-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-lime-tint-hover)] transition-colors shrink-0" aria-label="Back" @click="navigateTo('/requisitions')"><ArrowLeft class="w-5 h-5" /></button>
          <div class="min-w-0">
            <div class="flex items-center gap-2.5">
              <input v-if="editingTitle" v-model="form.title" class="text-[22px] font-bold text-[var(--brand-text)] bg-transparent border-b border-[var(--brand-border)] outline-none focus:border-[var(--brand-teal)]" @keydown.enter="saveChanges">
              <h1 v-else class="text-[22px] font-bold text-[var(--brand-text)] truncate">{{ reqData.title }}</h1>
              <button type="button" class="text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]" aria-label="Edit title" @click="editingTitle = !editingTitle"><Pencil class="w-4 h-4" /></button>
              <RequisitionStatusBadge :status="reqData.status" variant="solid" />
              <span class="text-[12.5px] font-medium text-[var(--brand-text-quiet)] tabular-nums">#{{ reqData.code }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="savedFlash" class="text-[13px] font-semibold text-[var(--brand-status-approved-text)] inline-flex items-center gap-1"><Check class="w-4 h-4" /> Saved</span>
          <BrandButton variant="outline" size="md" :disabled="update.isPending.value" @click="saveChanges">Save changes</BrandButton>
          <BrandButton v-if="isDraft && isOwner" variant="primary-teal" size="md" class="gap-1.5" :disabled="submit.isPending.value" @click="requestApproval"><Send class="w-4 h-4" /> Request approval</BrandButton>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <BrandButton variant="outline" size="icon" aria-label="More"><MoreHorizontal class="w-4 h-4" /></BrandButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-44">
              <DropdownMenuItem class="text-[13.5px] gap-2 cursor-pointer" @click="duplicate.mutate(id, { onSuccess: (c) => navigateTo(`/requisitions/${c.id}`) })"><Copy class="w-4 h-4" /> Duplicate</DropdownMenuItem>
              <DropdownMenuItem v-if="reqData.status !== 'archived'" class="text-[13.5px] gap-2 cursor-pointer" @click="archive.mutate(id)"><Archive class="w-4 h-4" /> Archive</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="text-[13.5px] gap-2 cursor-pointer text-[var(--brand-danger)] focus:text-[var(--brand-danger)]" @click="confirmDelete = true"><Trash2 class="w-4 h-4" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <!-- Tabs -->
      <div class="px-6 flex items-center gap-6 border-b border-[var(--brand-border-light)] overflow-x-auto">
        <button v-for="t in TABS" :key="t" type="button" class="pb-2.5 -mb-px text-[14px] font-semibold whitespace-nowrap border-b-2 transition-colors" :class="tab === t ? 'text-[var(--brand-text)] border-[var(--brand-teal)]' : 'text-[var(--brand-text-quiet)] border-transparent hover:text-[var(--brand-text)]'" @click="tab = t">{{ t }}</button>
      </div>

      <div class="flex-1 overflow-auto px-6 py-5">
        <p v-if="errorMsg" class="mb-4 rounded-lg bg-[color-mix(in_srgb,var(--brand-danger)_10%,white)] border border-[color-mix(in_srgb,var(--brand-danger)_30%,white)] px-4 py-2.5 text-[13px] font-medium text-[var(--brand-danger)]">{{ errorMsg }}</p>

        <!-- DETAILS -->
        <div v-if="tab === 'Details'" class="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
          <div class="space-y-5">
            <!-- Approve / reject bar -->
            <div v-if="canDecide" class="rounded-2xl border border-[var(--brand-border-light)] bg-[var(--brand-canvas)] p-5">
              <div class="text-[14px] font-bold text-[var(--brand-text)] mb-1">Your approval is needed</div>
              <p class="text-[13px] text-[var(--brand-text-quiet)] mb-3">Review the requisition, then approve or reject{{ activeStep ? ` (step ${activeStep.order})` : '' }}.</p>
              <Textarea v-model="decisionNote" rows="2" placeholder="Add a note (required to reject)…" class="w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2 text-[13.5px] outline-none focus-visible:border-[var(--brand-teal)] focus-visible:ring-0" />
              <div class="mt-2.5 flex items-center justify-end gap-2.5">
                <BrandButton variant="danger-ghost" :disabled="reject.isPending.value || !decisionNote.trim()" @click="onReject">Reject</BrandButton>
                <BrandButton variant="primary-teal" :disabled="approve.isPending.value" @click="onApprove">Approve</BrandButton>
              </div>
            </div>

            <!-- Requisition details -->
            <section class="rounded-2xl border border-[var(--brand-border-light)] p-5">
              <h2 class="text-[16px] font-bold text-[var(--brand-text)]">Requisition details</h2>
              <p class="text-[13px] text-[var(--brand-text-quiet)] mb-4">Fill out all fields and send the requisition to approvers to start the approval flow.</p>

              <div class="grid grid-cols-2 gap-4 items-end">
                <div><div class="text-[12px] text-[var(--brand-text-quiet)] mb-0.5">Manpower Project</div><div class="text-[14px] font-semibold text-[var(--brand-text)] h-10 flex items-center">{{ reqData.manpowerProject || '—' }}</div></div>
                <div>
                  <label :class="labelCls">Department <span :class="reqStar">*</span></label>
                  <select v-model="form.department" :class="fieldCls"><option value="">Select</option><option v-for="d in REQUISITION_DEPARTMENTS" :key="d" :value="d">{{ d }}</option></select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label :class="labelCls">Joining Month <span :class="reqStar">*</span></label>
                  <select v-model="form.joiningMonth" :class="fieldCls"><option value="">Pick Month</option><option v-for="m in MONTH_OPTIONS" :key="m" :value="m">{{ m }}</option></select>
                </div>
                <div>
                  <label :class="labelCls">Workplace <span :class="reqStar">*</span></label>
                  <select v-model="form.workplace" :class="fieldCls"><option value="">ex. On-Site</option><option v-for="w in WORKPLACE_OPTIONS" :key="w.value" :value="w.value">{{ w.label }}</option></select>
                </div>
                <div>
                  <label :class="labelCls">Employment Type <span :class="reqStar">*</span></label>
                  <select v-model="form.employmentType" :class="fieldCls"><option value="">ex. Full-time</option><option v-for="e in EMPLOYMENT_OPTIONS" :key="e.value" :value="e.value">{{ e.label }}</option></select>
                </div>
                <div>
                  <label :class="labelCls">Experience <span :class="reqStar">*</span></label>
                  <select v-model="form.experience" :class="fieldCls"><option value="">ex. Experienced</option><option v-for="e in EXPERIENCE_OPTIONS" :key="e.value" :value="e.value">{{ e.label }}</option></select>
                </div>
              </div>
            </section>

            <!-- Location -->
            <section class="rounded-2xl border border-[var(--brand-border-light)] p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h2 class="text-[16px] font-bold text-[var(--brand-text)]">Location <span :class="reqStar">*</span></h2>
                  <p class="text-[13px] text-[var(--brand-text-quiet)] mt-0.5">Assign location to this requisition.</p>
                </div>
                <Popover>
                  <PopoverTrigger as-child>
                    <BrandButton variant="outline" size="md" class="gap-1.5"><Plus class="w-4 h-4" /> Assign location</BrandButton>
                  </PopoverTrigger>
                  <PopoverContent align="end" class="w-56 p-1.5">
                    <button
                      v-for="loc in REQUISITION_LOCATIONS"
                      :key="loc"
                      type="button"
                      class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] text-left transition-colors hover:bg-[var(--brand-lime-tint-hover)]"
                      @click="toggleLocation(loc)"
                    >
                      <span class="w-4 h-4 rounded-[5px] border grid place-items-center shrink-0" :class="form.locations?.includes(loc) ? 'bg-[var(--brand-teal)] border-[var(--brand-teal)] text-white' : 'border-[var(--brand-border)]'">
                        <Check v-if="form.locations?.includes(loc)" class="w-3 h-3" stroke-width="3" />
                      </span>
                      {{ loc }}
                    </button>
                  </PopoverContent>
                </Popover>
              </div>

              <div v-if="form.locations?.length" class="mt-4 flex flex-wrap gap-2">
                <span v-for="l in form.locations" :key="l" class="inline-flex items-center gap-1.5 h-8 pl-3 pr-1.5 rounded-lg bg-[var(--brand-canvas)] text-[13px] font-medium text-[var(--brand-text)]">
                  <MapPin class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" />{{ l }}
                  <button type="button" class="w-5 h-5 rounded grid place-items-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-border-light)]" aria-label="Remove location" @click="toggleLocation(l)"><X class="w-3.5 h-3.5" /></button>
                </span>
              </div>
              <div v-else class="mt-4 rounded-xl border border-dashed border-[var(--brand-border)] py-12 text-center">
                <div class="w-11 h-11 mx-auto rounded-xl bg-[var(--brand-canvas)] grid place-items-center text-[var(--brand-text-quiet)]"><Building2 class="w-5 h-5" stroke-width="1.7" /></div>
                <div class="mt-3 text-[14px] font-bold text-[var(--brand-text)]">Assign a location</div>
                <p class="mt-1 text-[13px] text-[var(--brand-text-quiet)]">Choose at least one location before requesting approval.</p>
              </div>
            </section>

            <!-- Salary -->
            <section class="rounded-2xl border border-[var(--brand-border-light)] p-5">
              <h2 class="text-[16px] font-bold text-[var(--brand-text)] mb-4">Salary Details</h2>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label :class="labelCls">Currency <span :class="reqStar">*</span></label>
                  <select v-model="form.salaryCurrency" :class="fieldCls"><option value="">ex. EGP</option><option v-for="c in CURRENCY_OPTIONS" :key="c" :value="c">{{ c }}</option></select>
                </div>
                <div>
                  <label :class="labelCls">Salary Range <span :class="reqStar">*</span></label>
                  <div class="flex items-center gap-2">
                    <input v-model="form.salaryFrom" type="number" min="0" placeholder="From" :class="fieldCls">
                    <input v-model="form.salaryTo" type="number" min="0" placeholder="To" :class="fieldCls">
                  </div>
                </div>
              </div>
            </section>

            <!-- Custom questions -->
            <section v-if="form.customQuestions?.length" class="rounded-2xl border border-[var(--brand-border-light)] p-5 space-y-4">
              <div v-for="(cq, i) in form.customQuestions" :key="cq.id">
                <label :class="labelCls">{{ cq.label }} <span v-if="cq.required" :class="reqStar">*</span></label>
                <input v-model="form.customQuestions[i]!.answer" :class="fieldCls" placeholder="Your answer">
              </div>
            </section>

            <!-- Job openings -->
            <section class="rounded-2xl border border-[var(--brand-border-light)] p-5">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-[16px] font-bold text-[var(--brand-text)] flex items-center gap-2">Job openings <span :class="reqStar">*</span> <span class="text-[12px] font-bold rounded-md px-2 h-[20px] inline-flex items-center bg-[var(--brand-canvas)] text-[var(--brand-text-secondary)] tabular-nums">{{ reqData.hiresCount }}/{{ form.jobOpenings?.length ?? 0 }}</span></h2>
                  <p class="text-[13px] text-[var(--brand-text-quiet)] mt-0.5 max-w-[560px]">Job openings equal the number of candidates you want to hire — add as many as you need. You fill an opening the moment you hire a candidate.</p>
                </div>
              </div>

              <ul v-if="form.jobOpenings?.length" class="mt-4 space-y-2">
                <li v-for="o in form.jobOpenings" :key="o.id" class="flex items-start justify-between gap-3 rounded-lg border border-[var(--brand-border-light)] bg-[var(--brand-canvas)] px-3.5 py-2.5">
                  <div class="min-w-0">
                    <div class="text-[13.5px] font-semibold text-[var(--brand-text)]">{{ o.reason }}</div>
                    <div v-if="o.explanation" class="text-[12.5px] text-[var(--brand-text-quiet)]">{{ o.explanation }}</div>
                  </div>
                  <button type="button" class="text-[var(--brand-text-quiet)] hover:text-[var(--brand-danger)] shrink-0" aria-label="Remove opening" @click="removeOpening(o.id)"><Trash2 class="w-4 h-4" /></button>
                </li>
              </ul>

              <!-- Add-new inline form -->
              <div v-if="addingOpening" class="mt-4 rounded-xl border border-[var(--brand-border-light)] p-4">
                <div class="grid grid-cols-[220px_1fr] gap-3">
                  <div>
                    <label class="block text-[12.5px] font-semibold text-[var(--brand-text-secondary)] mb-1.5">Reason</label>
                    <select v-model="openingDraft.reason" :class="fieldCls"><option value="">Choose an option…</option><option v-for="r in OPENING_REASONS" :key="r" :value="r">{{ r }}</option></select>
                  </div>
                  <div>
                    <label class="block text-[12.5px] font-semibold text-[var(--brand-text-secondary)] mb-1.5">Explanation</label>
                    <input v-model="openingDraft.explanation" :class="fieldCls" placeholder="Type here…">
                  </div>
                </div>
                <div class="mt-3 flex items-center justify-end gap-2.5">
                  <BrandButton variant="ghost" @click="addingOpening = false; resetDraft()">Cancel</BrandButton>
                  <BrandButton variant="outline" :disabled="!openingDraft.reason" @click="addOpening(true)">Save and add another</BrandButton>
                  <BrandButton variant="primary-lime" :disabled="!openingDraft.reason" @click="addOpening(false)">Save</BrandButton>
                </div>
              </div>
              <button v-else type="button" class="mt-4 w-full h-11 rounded-xl border border-dashed border-[var(--brand-border)] text-[13.5px] font-semibold text-[var(--brand-text-secondary)] inline-flex items-center justify-center gap-1.5 hover:border-[var(--brand-teal)] hover:text-[var(--brand-teal)] transition-colors" @click="addingOpening = true"><Plus class="w-4 h-4" /> Add new</button>
            </section>
          </div>

          <!-- Approval flow sidebar -->
          <aside class="rounded-2xl border border-[var(--brand-border-light)] bg-[var(--brand-canvas)] p-5">
            <h3 class="text-[15px] font-bold text-[var(--brand-text)] mb-4">Approval Flow</h3>
            <div v-if="!reqData.approvalSteps.length" class="text-[13px] text-[var(--brand-text-quiet)]">No approval steps configured yet.</div>
            <ol v-else class="space-y-4">
              <li v-for="s in reqData.approvalSteps" :key="s.id">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-full grid place-items-center text-[12px] font-bold shrink-0" :class="stepSatisfied(s) ? 'bg-[var(--brand-teal)] text-white' : 'bg-white border border-[var(--brand-border)] text-[var(--brand-text-secondary)]'">{{ s.order }}</span>
                  <span class="text-[13.5px] font-semibold text-[var(--brand-text)]">Step {{ s.order }} — {{ stepRuleLabel(s) }}</span>
                </div>
                <div class="mt-2 ml-3.5 pl-5 border-l border-[var(--brand-border)] space-y-2">
                  <div v-for="a in s.approvers" :key="a.userId" class="flex items-center gap-2.5">
                    <BrandAvatarInitials :initials="a.initials" size="sm" />
                    <span class="text-[13px] text-[var(--brand-text)] flex-1 truncate">{{ a.name }}</span>
                    <Check v-if="a.decision === 'approved'" class="w-4 h-4 text-[var(--brand-status-approved-text)]" stroke-width="3" />
                    <X v-else-if="a.decision === 'rejected'" class="w-4 h-4 text-[var(--brand-danger)]" stroke-width="3" />
                    <Clock v-else class="w-4 h-4 text-[var(--brand-text-quiet)]" />
                  </div>
                  <div v-if="!s.approvers.length" class="text-[12.5px] text-[var(--brand-text-quiet)]">No approvers assigned</div>
                </div>
              </li>
            </ol>
          </aside>
        </div>

        <!-- NOTES -->
        <div v-else-if="tab === 'Notes'" class="max-w-[880px] mx-auto w-full">
          <div class="rounded-[10px] border-[1.5px] border-[color-mix(in_srgb,var(--brand-teal)_60%,white)] bg-white overflow-hidden">
            <textarea v-model="noteDraft" rows="3" placeholder="Click here to add a note in this requisition" class="w-full resize-none bg-transparent outline-none text-[14px] leading-[1.55] text-[var(--brand-text)] placeholder:text-[var(--brand-text-quiet)] px-4 pt-3 pb-2" />
            <div class="flex items-center justify-between px-2 py-1.5 border-t border-[var(--brand-border-fade)]">
              <div class="flex items-center gap-0.5">
                <button v-for="btn in [{ icon: Bold, label: 'Bold' }, { icon: Italic, label: 'Italic' }, { icon: Underline, label: 'Underline' }, { icon: List, label: 'Bulleted list' }, { icon: ListOrdered, label: 'Numbered list' }, { icon: ListChecks, label: 'Checklist' }, { icon: Link2, label: 'Link' }]" :key="btn.label" class="w-8 h-8 rounded-md inline-flex items-center justify-center text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition" :aria-label="btn.label" :title="btn.label"><component :is="btn.icon" class="w-4 h-4" stroke-width="1.7" /></button>
              </div>
              <div class="flex items-center gap-0.5">
                <button v-for="btn in [{ icon: Paperclip, label: 'Attach file' }, { icon: AtSign, label: 'Mention someone' }, { icon: Smile, label: 'Insert emoji' }]" :key="btn.label" class="w-8 h-8 rounded-md inline-flex items-center justify-center text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition" :aria-label="btn.label" :title="btn.label"><component :is="btn.icon" class="w-4 h-4" stroke-width="1.7" /></button>
              </div>
            </div>
            <div class="border-t border-[var(--brand-border-fade)] px-3 py-2">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button class="inline-flex items-center gap-2 px-2 py-1 rounded-md text-[13px] font-semibold text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)]" aria-label="Change note visibility">
                    <Eye class="w-3.5 h-3.5" stroke-width="1.7" /> {{ VIS_LABEL[noteVisibility] }} <ChevronRight class="w-3 h-3 rotate-90" stroke-width="2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-[220px] p-1">
                  <DropdownMenuItem v-for="v in (['everyone', 'admins', 'me'] as const)" :key="v" class="flex items-center gap-2 px-2 py-1.5 text-[13.5px] cursor-pointer" @select="noteVisibility = v"><Eye class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" stroke-width="1.7" /> {{ VIS_LABEL[v] }}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 py-3">
            <button class="h-9 px-4 rounded-[9px] text-[13.5px] font-semibold text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition" @click="cancelNote">Cancel</button>
            <button class="h-9 px-5 rounded-[9px] text-[13.5px] font-bold text-white bg-[var(--brand-teal)] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition" :disabled="!noteDraft.trim()" @click="saveNote">Save</button>
          </div>
          <div v-if="!reqNotes.length" class="flex flex-col items-center justify-center text-center pt-4">
            <span class="w-11 h-11 rounded-[10px] bg-[var(--brand-canvas)] inline-flex items-center justify-center text-[var(--brand-text-quiet)] mb-3"><MessageSquare class="w-5 h-5" stroke-width="1.7" /></span>
            <div class="text-[16px] font-bold text-[var(--brand-text)] mb-1">No notes yet</div>
            <div class="text-[13.5px] text-[var(--brand-text-quiet)]">Click above to add your very first note.</div>
          </div>
          <div v-else class="flex flex-col gap-3">
            <article v-for="n in reqNotes" :key="n.id" class="rounded-[10px] border border-[var(--brand-border-light)] bg-white p-4">
              <header class="flex items-center gap-3 pb-2">
                <span class="w-7 h-7 rounded-full bg-[var(--brand-teal)] text-white inline-flex items-center justify-center font-bold text-[11px] shrink-0">{{ n.userInitials }}</span>
                <span class="font-bold text-[13.5px] text-[var(--brand-text)]">{{ n.userName }}</span>
                <span class="flex-1" />
                <button class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition" aria-label="Edit note"><Pencil class="w-3.5 h-3.5" stroke-width="1.7" /></button>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <button class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition" aria-label="More"><MoreVertical class="w-3.5 h-3.5" stroke-width="1.7" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-[160px] p-1">
                    <DropdownMenuItem class="flex items-center gap-2 px-2 py-1.5 text-[13.5px] text-[var(--brand-danger)] cursor-pointer" @select="removeNote(n.id)"><Trash2 class="w-3.5 h-3.5" stroke-width="1.7" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <span class="text-[13px] text-[var(--brand-text-quiet)] ml-1">{{ n.createdAt }}</span>
              </header>
              <div class="text-[14px] text-[var(--brand-text)] whitespace-pre-wrap">{{ n.text }}</div>
              <footer class="flex items-center gap-1 pt-3">
                <button class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition" aria-label="Like"><ThumbsUp class="w-3.5 h-3.5" stroke-width="1.7" /></button>
                <button class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition" aria-label="Add reaction"><Smile class="w-3.5 h-3.5" stroke-width="1.7" /></button>
                <button class="h-7 px-2 rounded-md text-[13px] font-semibold text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition">Reply</button>
              </footer>
            </article>
          </div>
        </div>

        <!-- ACTIVITY -->
        <div v-else-if="tab === 'Activity'" class="max-w-[880px] mx-auto w-full">
          <div v-for="group in activityGroups" :key="group.date" class="mb-6">
            <div class="relative pl-6 mb-3">
              <span class="absolute left-[10px] top-1 bottom-0 w-px bg-[var(--brand-border-fade)]" />
              <span class="text-[13.5px] text-[var(--brand-text-quiet)]">{{ group.date }}</span>
            </div>
            <div class="rounded-[12px] border border-[var(--brand-border-light)] bg-white overflow-hidden">
              <div v-for="(a, i) in group.items" :key="a.id" class="flex items-center gap-3.5 px-5 py-3.5 transition" :class="i > 0 ? 'border-t border-[var(--brand-border-fade)]' : ''">
                <div class="relative shrink-0">
                  <span class="w-9 h-9 rounded-full bg-[var(--brand-teal)] text-white inline-flex items-center justify-center font-bold text-[12.5px]">{{ actorInitials(a.actor) }}</span>
                  <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-[var(--brand-border-light)] inline-flex items-center justify-center text-[var(--brand-text-secondary)]"><ActivityIcon class="w-3 h-3" stroke-width="1.8" /></span>
                </div>
                <div class="flex-1 min-w-0 text-[13.5px] text-[var(--brand-text)] leading-[1.5]"><strong class="font-bold">{{ a.actor }}</strong> {{ a.text }}</div>
                <span class="text-[13px] text-[var(--brand-text-quiet)] tabular-nums shrink-0">{{ timeAgo(a.at) }}</span>
              </div>
            </div>
          </div>
          <div v-if="!activityGroups.length" class="py-16 text-center text-[13.5px] text-[var(--brand-text-quiet)]">No activity yet.</div>
        </div>

        <!-- Other tabs — later phases -->
        <div v-else class="flex flex-col items-center justify-center gap-2 py-20 text-center">
          <Sparkles class="w-8 h-8 text-[var(--brand-text-faint)]" />
          <div class="text-[15px] font-bold text-[var(--brand-text)]">{{ tab }}</div>
          <p class="text-[13px] text-[var(--brand-text-quiet)] max-w-[360px]">This tab is part of a later phase of the requisition module.</p>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <div v-else class="p-10 text-center">
      <div class="text-[15px] font-bold text-[var(--brand-text)]">Requisition not found</div>
      <BrandButton variant="outline" class="mt-3" @click="navigateTo('/requisitions')">Back to requisitions</BrandButton>
    </div>

    <!-- Delete confirm -->
    <Dialog :open="confirmDelete" @update:open="(o) => { if (!o) confirmDelete = false }">
      <DialogContent class="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Delete requisition?</DialogTitle>
          <DialogDescription>This can't be undone. The requisition and its approval history will be removed.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <BrandButton variant="outline" @click="confirmDelete = false">Cancel</BrandButton>
          <BrandButton variant="danger" :disabled="remove.isPending.value" @click="doDelete">Delete</BrandButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
