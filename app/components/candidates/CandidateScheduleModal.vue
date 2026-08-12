<!--
  Interview scheduling — the 2-step "Schedule event" dialog opened from a
  candidate profile ("Set Interview"). Ports the Recruitee flow into our
  design system (brand tokens, teal primary; no purple/hex).

  Steps (internal `step` state):
    · form      — date/time/duration, Find time, event name, event type
                  (on-site / phone / meeting / video providers),
                  interviewers, location (or video link), organizer, note,
                  request-evaluation / private-note, privacy settings.
    · notify    — event summary + invitation notice + Schedule.

  Find time opens as a nested dialog (pop-up-in-pop-up) with a week/day grid;
  picking a slot writes back to the form's date/time.

  Reuses shadcn Dialog + DropdownMenu + Brand primitives; team roster via
  useTeamMembers(). Emits `scheduled` with the built event on Schedule.
-->
<script setup lang="ts">
import {
  X, ChevronDown, ChevronLeft, ChevronRight, Calendar, HelpCircle, Building2, Phone, Users,
  Video, Plus, ArrowRight, AlignLeft, MapPin, MoreHorizontal, AlertTriangle,
  Bold, Italic, Underline, List, ListOrdered, Link2, Image, Undo2, Redo2, Code, Paperclip, Type,
} from 'lucide-vue-next'
import { Dialog, DialogContent, DialogTitle } from '~/components/ui/dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '~/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger } from '~/components/ui/select'
import { BrandButton, BrandLimeCheckbox, BrandAvatarInitials } from '~/components/brand'
import { useTeamMembers } from '~/composables/useTeam'
import { useCompany } from '~/composables/useCompany'
import CandidateRequestEvaluationModal from '~/components/candidates/CandidateRequestEvaluationModal.vue'
import type { TeamMember } from '~/types'

interface JobOption { title: string; status?: string; disqualified?: boolean }

const props = defineProps<{
  candidateName?: string
  candidateInitials?: string
  candidateColor?: string
  jobName?: string
  jobs?: JobOption[]
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ scheduled: [payload: Record<string, unknown>] }>()

// ── Team roster (interviewers + organizer) ──
const { data: teamData } = useTeamMembers()
const roster = computed<TeamMember[]>(() => teamData.value?.data ?? [])
function initialsFor(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean)
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1]![0] : '')).toUpperCase() || '?'
}

// ── Job selector (header) ──
const jobOptions = computed<JobOption[]>(() =>
  props.jobs?.length ? props.jobs : props.jobName ? [{ title: props.jobName }] : [],
)
const selectedJobTitle = ref<string | null>(props.jobName ?? props.jobs?.[0]?.title ?? null)
// Status dot mode: published → full, internal/draft → half, closed/archived → gray, none → hidden.
function jobDotMode(title: string | null): 'full' | 'half' | 'gray' | 'none' {
  if (!title) return 'none'
  const s = jobOptions.value.find(j => j.title === title)?.status
  if (!s || s === 'published') return 'full'
  if (s === 'internal' || s === 'draft') return 'half'
  return 'gray'
}

// ── Event types ──
type EventKind = 'onsite' | 'phone' | 'meeting' | 'video'
interface EventType { key: string; label: string; sub?: string; icon: any; kind: EventKind }
const EVENT_TYPES: EventType[] = [
  { key: 'onsite',  label: 'On-site interview', icon: Building2, kind: 'onsite' },
  { key: 'phone',   label: 'Phone interview',   icon: Phone,     kind: 'phone' },
  { key: 'meeting', label: 'Meeting',           icon: Users,     kind: 'meeting' },
  { key: 'gmeet',   label: 'Google Meet',  sub: 'Video interview', icon: Video, kind: 'video' },
  { key: 'zoom',    label: 'Zoom',         sub: 'Video interview', icon: Video, kind: 'video' },
  { key: 'teams',   label: 'Microsoft Teams', sub: 'Video interview', icon: Video, kind: 'video' },
]
const eventTypeKey = ref('onsite')
const eventType = computed(() => EVENT_TYPES.find(t => t.key === eventTypeKey.value)!)

// ── Date / time / duration ──
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
function fmtDate(d: Date) { return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
function fmtFull(d: Date) { return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
function sameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString() }

const baseDate = new Date()
const selectedDate = ref<Date>(baseDate)
const time = ref('11:45')
const duration = ref(30)
const TIMES = Array.from({ length: 36 }, (_, i) => {
  const m = 8 * 60 + i * 15 // 08:00 → 16:45
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
})
const DURATIONS = [15, 30, 45, 60, 90, 120]
function durationLabel(m: number) {
  const h = Math.floor(m / 60), mm = m % 60
  return h ? `${h} hour${h > 1 ? 's' : ''}${mm ? ` ${mm} min` : ''}` : `${m} minutes`
}
const startMinutes = computed(() => { const [h, mm] = time.value.split(':').map(Number); return h! * 60 + mm! })
const endTime = computed(() => {
  const total = startMinutes.value + duration.value
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
})

// ── Event name ──
const eventName = ref('')

// ── Interviewers / organizer ──
const interviewerIds = ref<string[]>([])
const organizerId = ref<string>('')
watchEffect(() => {
  if (roster.value.length) {
    if (!interviewerIds.value.length) interviewerIds.value = [roster.value[0]!.id]
    if (!organizerId.value) organizerId.value = roster.value[0]!.id
  }
})
const interviewers = computed(() => roster.value.filter(m => interviewerIds.value.includes(m.id)))
const organizer = computed(() => roster.value.find(m => m.id === organizerId.value))
const availableToAdd = computed(() => roster.value.filter(m => !interviewerIds.value.includes(m.id)))
function addInterviewer(id: string) { if (!interviewerIds.value.includes(id)) interviewerIds.value = [...interviewerIds.value, id] }
function removeInterviewer(id: string) { interviewerIds.value = interviewerIds.value.filter(x => x !== id) }

// ── Video provider (host + not-connected notice) ──
const calendarConnected = ref(false) // no integration in the mock → always show the notice
const videoHostId = ref('')
const videoWarnDismissed = ref(false)
const videoHost = computed(() => roster.value.find(m => m.id === videoHostId.value))
// What the user needs to connect for the selected video provider.
const videoConnectTarget = computed(() =>
  eventTypeKey.value === 'zoom' ? 'Zoom account'
  : eventTypeKey.value === 'teams' ? 'Microsoft Calendar'
  : 'Google Calendar',
)

// ── Other fields ──
const location = ref('')
const note = ref('')
const priv = reactive({ private: false, hideName: false, excludeCandidate: false })

// Request evaluation (nested modal) + inline private note.
const reqEvalOpen = ref(false)
const evalRequest = ref<{ formId: string; memberIds: string[] } | null>(null)
function onEvalSaved(p: { formId: string; memberIds: string[] }) { evalRequest.value = p }
const privateNoteOpen = ref(false)
const privateNote = ref('')

// ── Step 2 (Notify) state ──
const { data: company } = useCompany()
const companyName = computed(() => company.value?.name || 'the company')
const showInviteOptions = ref(true)
const invite = reactive({ candidateEmail: true, candidateCalendar: true, interviewerEmail: true, interviewerCalendar: false })
const fromEmail = ref('')
const emailBody = ref("Hello,\n\nWe'd like to confirm your interview. Please find all the relevant details below.")
const showInterviewerEmail = ref(false)
const remindCandidate = ref(false)
const eventLink = ref('')
const emailSubject = computed(() =>
  `${eventType.value.label} on ${fmtDate(selectedDate.value)} ${time.value} — ${endTime.value} (GMT+03:00) Africa/Cairo`,
)
const RT_TOOLS = [Bold, Italic, Underline, Type, List, ListOrdered, AlignLeft, Link2, Image, Undo2, Redo2, Code]
watchEffect(() => { if (!fromEmail.value && organizer.value) fromEmail.value = organizer.value.email })
const fromMembers = computed(() => roster.value)

// ── Reset on open ──
watch(open, (v) => {
  if (v) {
    selectedJobTitle.value = props.jobName ?? props.jobs?.[0]?.title ?? null
    eventName.value = `${props.candidateName ?? 'Candidate'} - Interview with ${selectedJobTitle.value ?? 'the team'}`
    step.value = 'form'
    promoDismissed.value = false
    videoWarnDismissed.value = false
    findTimeOpen.value = false
    eventLink.value = `https://recruitera.ai/v/events/${Math.random().toString(36).slice(2, 12)}`
  }
})

// ── Steps ──
const step = ref<'form' | 'notify'>('form')
const promoDismissed = ref(false)

// ── Find time (nested dialog) ──
const findTimeOpen = ref(false)
const calView = ref<'week' | 'day'>('week')
const GRID_START = 0     // 00:00 — full day like the reference
const GRID_END = 24      // 24:00
const ROW_H = 60         // px per hour (30-min event = 30px, like the reference)
const GRID_HOURS = Array.from({ length: GRID_END - GRID_START }, (_, i) => GRID_START + i)
const gridHeight = (GRID_END - GRID_START) * ROW_H
const gridScroll = ref<HTMLElement | null>(null)
const todayMidnight = (() => { const d = new Date(baseDate); d.setHours(0, 0, 0, 0); return d })()
function isPastDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x < todayMidnight }
function hourLabel(h: number) { return `${h}:00` } // single-digit like the reference (9:00, 17:00)
// Scroll the grid so the selected slot sits near the top when the dialog opens.
watch(findTimeOpen, (v) => {
  if (v) nextTick(() => { if (gridScroll.value) gridScroll.value.scrollTop = Math.max(0, blockTop.value - 120) })
})
const weekStart = computed(() => {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Monday
  return d
})
const weekDays = computed(() => Array.from({ length: 5 }, (_, i) => {
  const d = new Date(weekStart.value); d.setDate(d.getDate() + i); return d
}))
const calDays = computed(() => calView.value === 'day' ? [new Date(selectedDate.value)] : weekDays.value)
const weekRangeLabel = computed(() => {
  if (calView.value === 'day') return fmtDate(selectedDate.value)
  const a = weekDays.value[0]!, b = weekDays.value[4]!
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} - ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
    : `${a.getDate()} ${MONTHS[a.getMonth()]} - ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
})
const blockTop = computed(() => (startMinutes.value - GRID_START * 60) / 60 * ROW_H)
const blockHeight = computed(() => duration.value / 60 * ROW_H)
function shiftRange(dir: number) {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + dir * (calView.value === 'day' ? 1 : 7))
  selectedDate.value = d
}
function onColumnClick(day: Date, e: MouseEvent) {
  if (isPastDay(day)) return // past days are not selectable
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const y = e.clientY - rect.top
  let mins = GRID_START * 60 + Math.round((y / ROW_H * 60) / 15) * 15 // snap to 15 min
  mins = Math.max(GRID_START * 60, Math.min(GRID_END * 60 - duration.value, mins))
  selectedDate.value = new Date(day)
  time.value = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

const summaryLine = computed(() =>
  `${eventType.value.label} on ${fmtFull(selectedDate.value)} at ${time.value} - ${endTime.value}`,
)

function onSchedule() {
  emit('scheduled', {
    candidate: props.candidateName,
    job: selectedJobTitle.value,
    name: eventName.value,
    type: eventTypeKey.value,
    date: selectedDate.value.toISOString(),
    time: time.value,
    duration: duration.value,
    interviewers: interviewerIds.value,
    organizer: organizerId.value,
    videoHost: eventType.value.kind === 'video' ? videoHostId.value : undefined,
    location: location.value,
    note: note.value,
    privateNote: privateNote.value,
    evaluationRequest: evalRequest.value,
    privacy: { ...priv },
  })
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      :show-close-button="false"
      class="p-0 gap-0 border-0 rounded-[18px] w-[96vw] !max-w-[540px] sm:!max-w-[540px] max-h-[92vh] shadow-[0_24px_64px_rgba(0,20,18,0.22)] bg-[var(--brand-canvas)] overflow-hidden flex flex-col"
    >
      <!-- ═══ Header ═══ -->
      <div class="flex items-center gap-3 px-7 pt-6 pb-5 bg-white shrink-0">
        <BrandAvatarInitials :initials="candidateInitials || initialsFor(candidateName || '?')" :bg="candidateColor || 'var(--brand-pipeline-purple)'" size="xl" />
        <div class="flex-1 min-w-0">
          <DialogTitle class="text-[20px] font-bold text-[var(--brand-text)] leading-tight">Schedule event</DialogTitle>
          <div class="flex items-center gap-2 text-[13px] text-[var(--brand-text-quiet)] mt-0.5 min-w-0">
            <span class="font-medium text-[var(--brand-text-secondary)] truncate">{{ candidateName || 'Candidate' }}</span>
            <!-- Job selector -->
            <DropdownMenu v-if="jobOptions.length">
              <DropdownMenuTrigger as-child>
                <button type="button" class="inline-flex items-center gap-1.5 h-7 pl-2 pr-1.5 rounded-[8px] bg-[var(--brand-canvas)] border border-[var(--brand-border)] text-[13px] font-semibold text-[var(--brand-text)] hover:border-[var(--brand-teal)] transition shrink-0">
                  <template v-if="jobDotMode(selectedJobTitle) === 'half'">
                    <svg width="11" height="11" viewBox="0 0 12 12" class="shrink-0"><circle cx="6" cy="6" r="5.2" fill="none" stroke="var(--brand-status-teal-green)" stroke-width="1.6" /><path d="M6 0.8 A5.2 5.2 0 0 0 6 11.2 Z" fill="var(--brand-status-teal-green)" /></svg>
                  </template>
                  <span v-else-if="jobDotMode(selectedJobTitle) === 'full'" class="inline-block w-[10px] h-[10px] rounded-full" style="background:var(--brand-status-teal-green)" />
                  <span v-else-if="jobDotMode(selectedJobTitle) === 'gray'" class="inline-block w-[10px] h-[10px] rounded-full" style="background:var(--brand-status-gray)" />
                  <span class="truncate max-w-[160px]">{{ selectedJobTitle ?? 'None' }}</span>
                  <ChevronDown class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" stroke-width="2" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" class="w-[260px] p-1.5 rounded-[12px]">
                <DropdownMenuItem class="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] cursor-pointer" @select="selectedJobTitle = null">
                  <span class="inline-block w-[10px] h-[10px] shrink-0" />
                  <span class="text-[13.5px] font-semibold text-[var(--brand-text)]">None</span>
                </DropdownMenuItem>
                <DropdownMenuItem v-for="j in jobOptions" :key="j.title" class="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] cursor-pointer" @select="selectedJobTitle = j.title">
                  <template v-if="jobDotMode(j.title) === 'half'">
                    <svg width="11" height="11" viewBox="0 0 12 12" class="shrink-0"><circle cx="6" cy="6" r="5.2" fill="none" stroke="var(--brand-status-teal-green)" stroke-width="1.6" /><path d="M6 0.8 A5.2 5.2 0 0 0 6 11.2 Z" fill="var(--brand-status-teal-green)" /></svg>
                  </template>
                  <span v-else-if="jobDotMode(j.title) === 'gray'" class="inline-block w-[10px] h-[10px] rounded-full shrink-0" style="background:var(--brand-status-gray)" />
                  <span v-else class="inline-block w-[10px] h-[10px] rounded-full shrink-0" style="background:var(--brand-status-teal-green)" />
                  <span class="text-[13.5px] font-semibold text-[var(--brand-text)] truncate">{{ j.title }}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <span class="text-[13px] text-[var(--brand-text-quiet)] shrink-0">Step {{ step === 'notify' ? 2 : 1 }} of 2</span>
        <button
          v-if="step === 'form'"
          type="button" class="w-8 h-8 rounded-[8px] inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition shrink-0" aria-label="Close" @click="open = false"
        ><X class="w-4 h-4" stroke-width="2" /></button>
      </div>
      <div class="h-px bg-[var(--brand-border-fade)] shrink-0" />

      <!-- ═══ STEP: form ═══ -->
      <div v-if="step === 'form'" class="flex-1 overflow-y-auto">
        <!-- Date / time / duration (white top) -->
        <div class="bg-white px-7 pt-5 pb-6">
          <!-- Calendar promo -->
          <div v-if="!promoDismissed" class="relative rounded-[12px] bg-[var(--brand-lime-tint)] border border-[var(--brand-lime)] px-4 py-3.5 mb-5">
            <button type="button" class="absolute top-3 right-3 text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]" aria-label="Dismiss" @click="promoDismissed = true"><X class="w-3.5 h-3.5" stroke-width="2" /></button>
            <div class="text-[14px] font-bold text-[var(--brand-teal)]">Connect your calendar</div>
            <div class="text-[13px] text-[var(--brand-text-secondary)] mt-0.5">Enhance your scheduling productivity. <a href="#" class="font-semibold text-[var(--brand-teal-secondary)] hover:text-[var(--brand-teal)]">Learn more</a></div>
            <div class="flex flex-wrap gap-2.5 mt-3">
              <button type="button" class="inline-flex items-center gap-2 h-9 px-3 rounded-[9px] bg-white border border-[var(--brand-border)] text-[13px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition">📅 Google (Calendar)</button>
              <button type="button" class="inline-flex items-center gap-2 h-9 px-3 rounded-[9px] bg-white border border-[var(--brand-border)] text-[13px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition">🗂 Microsoft (Outlook/Exchange)</button>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-[13px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Date</label>
              <div class="inline-flex w-full items-center gap-2 h-11 px-3.5 rounded-[10px] border-[1.5px] border-[var(--brand-border)] bg-white text-[14px] text-[var(--brand-text)]">
                <Calendar class="w-4 h-4 text-[var(--brand-text-quiet)]" stroke-width="1.8" />
                {{ fmtDate(selectedDate) }}
              </div>
            </div>
            <div>
              <label class="block text-[13px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Time</label>
              <Select v-model="time">
                <SelectTrigger class="w-full h-11 px-3.5 rounded-[10px] border-[1.5px] border-[var(--brand-border)] bg-white text-[14px] text-[var(--brand-text)] shadow-none data-[state=open]:border-[var(--brand-teal)] focus:ring-0 focus-visible:ring-0 focus-visible:border-[var(--brand-teal)]">
                  <span class="flex-1 text-left">{{ time }}</span>
                </SelectTrigger>
                <SelectContent class="rounded-[12px] max-h-[280px]">
                  <SelectItem v-for="t in TIMES" :key="t" :value="t" class="py-2.5 pl-3 text-[14px] cursor-pointer">{{ t }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label class="block text-[13px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Duration</label>
              <Select v-model="duration">
                <SelectTrigger class="w-full h-11 px-3.5 rounded-[10px] border-[1.5px] border-[var(--brand-border)] bg-white text-[14px] text-[var(--brand-text)] shadow-none data-[state=open]:border-[var(--brand-teal)] focus:ring-0 focus-visible:ring-0 focus-visible:border-[var(--brand-teal)]">
                  <span class="flex-1 text-left">{{ durationLabel(duration) }}</span>
                </SelectTrigger>
                <SelectContent class="rounded-[12px]">
                  <SelectItem v-for="d in DURATIONS" :key="d" :value="d" class="py-2.5 pl-3 text-[14px] cursor-pointer">{{ durationLabel(d) }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="flex items-center justify-between mt-4">
            <div class="flex items-center gap-2">
              <BrandButton variant="outline" @click="findTimeOpen = true">Find time</BrandButton>
              <HelpCircle class="w-4 h-4 text-[var(--brand-text-quiet)]" stroke-width="1.8" />
            </div>
            <span class="text-[13px] text-[var(--brand-text-quiet)]">(GMT+03:00) Africa/Cairo</span>
          </div>
        </div>

        <div class="h-px bg-[var(--brand-border-fade)]" />

        <!-- Details (canvas) -->
        <div class="px-7 py-6 flex flex-col gap-5">
          <div>
            <label class="flex items-center gap-2 text-[13px] font-bold text-[var(--brand-text-secondary)] mb-1.5">
              Event name
              <span class="inline-flex items-center h-[18px] px-1.5 rounded-md text-[11px] font-extrabold tracking-[0.04em] text-[var(--brand-pipeline-purple)] bg-[color-mix(in_srgb,var(--brand-pipeline-purple)_14%,white)]">NEW</span>
            </label>
            <input v-model="eventName" type="text" class="w-full h-11 px-3.5 text-[14px] rounded-[10px] border-[1.5px] border-[var(--brand-border)] bg-white focus:border-[var(--brand-teal)] focus:outline-none transition">
          </div>

          <div class="grid grid-cols-2 gap-4 items-start">
            <div>
              <label class="block text-[13px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Event type</label>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button type="button" class="w-full inline-flex items-center gap-2.5 h-11 px-3.5 rounded-[10px] border-[1.5px] border-[var(--brand-border)] bg-white text-[14px] text-[var(--brand-text)] hover:border-[var(--brand-teal)] transition">
                    <component :is="eventType.icon" class="w-4 h-4 text-[var(--brand-text-secondary)]" stroke-width="1.8" />
                    <span class="flex-1 text-left truncate">{{ eventType.label }}</span>
                    <ChevronDown class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" stroke-width="2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-[260px] p-1.5 rounded-[12px]">
                  <DropdownMenuItem v-for="t in EVENT_TYPES" :key="t.key" class="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] cursor-pointer" @select="eventTypeKey = t.key">
                    <component :is="t.icon" class="w-4 h-4 text-[var(--brand-text-secondary)] shrink-0" stroke-width="1.8" />
                    <span class="flex-1 min-w-0">
                      <span class="block text-[13.5px] font-semibold text-[var(--brand-text)]">{{ t.label }}</span>
                      <span v-if="t.sub" class="block text-[12px] text-[var(--brand-text-quiet)]">{{ t.sub }}</span>
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div>
              <label class="block text-[13px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Interviewer(s)</label>
              <div class="flex items-center gap-2 flex-wrap">
                <DropdownMenu v-if="availableToAdd.length">
                  <DropdownMenuTrigger as-child>
                    <button type="button" class="w-8 h-8 rounded-full border-[1.5px] border-dashed border-[var(--brand-border)] inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:border-[var(--brand-teal)] hover:text-[var(--brand-teal)] transition" aria-label="Add interviewer"><Plus class="w-4 h-4" stroke-width="2" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" class="w-[240px] p-1.5 rounded-[12px]">
                    <DropdownMenuItem v-for="m in availableToAdd" :key="m.id" class="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] cursor-pointer" @select="addInterviewer(m.id)">
                      <BrandAvatarInitials :initials="initialsFor(m.name)" :bg="m.avatarBg" :color="m.avatarText" size="md" />
                      <span class="text-[13.5px] font-semibold text-[var(--brand-text)]">{{ m.name }}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button v-for="m in interviewers" :key="m.id" type="button" class="group relative" :title="m.name" @click="removeInterviewer(m.id)">
                  <BrandAvatarInitials :initials="initialsFor(m.name)" :bg="m.avatarBg" :color="m.avatarText" size="md" />
                  <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white border border-[var(--brand-border)] text-[var(--brand-text-quiet)] opacity-0 group-hover:opacity-100 inline-flex items-center justify-center transition"><X class="w-2.5 h-2.5" stroke-width="2.5" /></span>
                </button>
              </div>
            </div>
          </div>

          <!-- Location (on-site/meeting) -->
          <div v-if="eventType.kind === 'onsite' || eventType.kind === 'meeting'">
            <label class="block text-[13px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Location</label>
            <div class="relative">
              <MapPin class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--brand-text-quiet)]" stroke-width="1.8" />
              <input v-model="location" type="text" placeholder="Type location" class="w-full h-11 pl-10 pr-3.5 text-[14px] rounded-[10px] border-[1.5px] border-[var(--brand-border)] bg-white focus:border-[var(--brand-teal)] focus:outline-none transition">
            </div>
          </div>

          <!-- Video provider: not-connected notice + host -->
          <template v-else-if="eventType.kind === 'video'">
            <div v-if="!calendarConnected && !videoWarnDismissed" class="relative rounded-[12px] bg-[color-mix(in_srgb,var(--brand-warning)_16%,white)] border border-[color-mix(in_srgb,var(--brand-warning)_55%,white)] px-4 py-3.5">
              <button type="button" class="absolute top-3 right-3 text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]" aria-label="Dismiss" @click="videoWarnDismissed = true"><X class="w-3.5 h-3.5" stroke-width="2" /></button>
              <div class="flex items-start gap-2.5">
                <AlertTriangle class="w-5 h-5 shrink-0 mt-0.5 text-[var(--brand-warning)]" stroke-width="2" fill="none" />
                <div class="min-w-0 pr-4">
                  <div class="text-[14px] font-bold text-[var(--brand-text)]">{{ videoConnectTarget }} not connected</div>
                  <div class="text-[13px] text-[var(--brand-text-secondary)] mt-0.5">You need to connect your {{ videoConnectTarget }} to create {{ eventType.label }} events.</div>
                  <button type="button" class="mt-3 inline-flex items-center h-9 px-3.5 rounded-[9px] bg-white border border-[color-mix(in_srgb,var(--brand-warning)_65%,white)] text-[13px] font-bold text-[var(--brand-warning)] hover:bg-[color-mix(in_srgb,var(--brand-warning)_8%,white)] transition">Connect your calendar</button>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-[13px] font-bold text-[var(--brand-text-secondary)] mb-1.5">{{ eventType.label }} event host <span class="text-[var(--brand-danger)]">*</span></label>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button type="button" class="w-full inline-flex items-center gap-2.5 h-11 px-3.5 rounded-[10px] border-[1.5px] border-[var(--brand-border)] bg-white text-[14px] text-[var(--brand-text)] hover:border-[var(--brand-teal)] transition">
                    <BrandAvatarInitials v-if="videoHost" :initials="initialsFor(videoHost.name)" :bg="videoHost.avatarBg" :color="videoHost.avatarText" size="md" />
                    <span class="flex-1 text-left truncate" :class="videoHost ? '' : 'text-[var(--brand-text-quiet)]'">{{ videoHost?.name ?? 'Select event organizer' }}</span>
                    <ChevronDown class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" stroke-width="2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-[--reka-dropdown-menu-trigger-width] min-w-[240px] p-1.5 rounded-[12px]">
                  <DropdownMenuItem v-for="m in roster" :key="m.id" class="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] cursor-pointer" @select="videoHostId = m.id">
                    <BrandAvatarInitials :initials="initialsFor(m.name)" :bg="m.avatarBg" :color="m.avatarText" size="sm" />
                    <span class="text-[14px] text-[var(--brand-text-secondary)]">{{ m.name }}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </template>

          <!-- Organizer (non-video) -->
          <div v-if="eventType.kind !== 'video'">
            <label class="block text-[13px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Organizer</label>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <button type="button" class="w-full inline-flex items-center gap-2.5 h-11 px-3.5 rounded-[10px] border-[1.5px] border-[var(--brand-border)] bg-white text-[14px] text-[var(--brand-text)] hover:border-[var(--brand-teal)] transition">
                  <BrandAvatarInitials v-if="organizer" :initials="initialsFor(organizer.name)" :bg="organizer.avatarBg" :color="organizer.avatarText" size="md" />
                  <span class="flex-1 text-left truncate">{{ organizer?.name ?? 'Select organizer' }}</span>
                  <ChevronDown class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" stroke-width="2" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" class="w-[--reka-dropdown-menu-trigger-width] min-w-[240px] p-1.5 rounded-[12px]">
                <DropdownMenuItem v-for="m in roster" :key="m.id" class="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] cursor-pointer" @select="organizerId = m.id">
                  <BrandAvatarInitials :initials="initialsFor(m.name)" :bg="m.avatarBg" :color="m.avatarText" size="sm" />
                  <span class="text-[14px] text-[var(--brand-text-secondary)]">{{ m.name }}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <!-- Note -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-[13px] font-bold text-[var(--brand-text-secondary)]">Note</label>
              <span class="text-[12.5px] text-[var(--brand-text-quiet)]">Visible to candidates</span>
            </div>
            <textarea v-model="note" rows="2" placeholder="Add a note" class="w-full px-3.5 py-2.5 text-[14px] leading-relaxed rounded-[10px] border-[1.5px] border-[var(--brand-border)] bg-white focus:border-[var(--brand-teal)] focus:outline-none resize-y transition" />
          </div>

          <!-- Private note — inline, revealed by "Add private note" -->
          <div v-if="privateNoteOpen" class="rounded-[10px] border border-[color-mix(in_srgb,var(--brand-warning)_45%,white)] bg-[color-mix(in_srgb,var(--brand-warning)_10%,white)] p-3.5">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[13.5px] font-bold text-[var(--brand-text)]">Private note</span>
              <div class="flex items-center gap-2.5">
                <span class="text-[12.5px] text-[var(--brand-text-quiet)]">Only visible to team members</span>
                <button type="button" class="text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]" aria-label="Close private note" @click="privateNoteOpen = false"><X class="w-3.5 h-3.5" stroke-width="2" /></button>
              </div>
            </div>
            <textarea
              v-model="privateNote"
              rows="2"
              placeholder="Add a note visible only to team members"
              class="w-full px-3.5 py-2.5 text-[14px] leading-relaxed rounded-[9px] border border-[color-mix(in_srgb,var(--brand-warning)_45%,white)] bg-[color-mix(in_srgb,var(--brand-warning)_6%,white)] focus:border-[var(--brand-warning)] focus:outline-none resize-y transition"
            />
          </div>

          <div class="flex items-center gap-2.5">
            <BrandButton variant="outline" @click="reqEvalOpen = true">
              <Plus class="w-3.5 h-3.5 mr-1.5" stroke-width="2" />Request evaluation<span v-if="evalRequest" class="ml-1 text-[var(--brand-teal)]">·1</span>
            </BrandButton>
            <BrandButton v-if="!privateNoteOpen" variant="outline" @click="privateNoteOpen = true"><AlignLeft class="w-3.5 h-3.5 mr-1.5" stroke-width="2" />Add private note</BrandButton>
          </div>

          <!-- Privacy -->
          <div>
            <div class="text-[13px] font-bold text-[var(--brand-text-secondary)] mb-2.5">Privacy settings for Google Calendar &amp; Outlook</div>
            <label class="flex items-center gap-2.5 py-1.5 cursor-pointer">
              <BrandLimeCheckbox v-model="priv.private" aria-label="Make event private" />
              <span class="text-[13.5px] text-[var(--brand-text)]">Make event private</span>
              <HelpCircle class="w-3.5 h-3.5 text-[var(--brand-text-faint)]" stroke-width="1.8" />
            </label>
            <label class="flex items-center gap-2.5 py-1.5 cursor-pointer">
              <BrandLimeCheckbox v-model="priv.hideName" aria-label="Don't show candidate full name" />
              <span class="text-[13.5px] text-[var(--brand-text)]">Don’t show candidate full name</span>
              <HelpCircle class="w-3.5 h-3.5 text-[var(--brand-text-faint)]" stroke-width="1.8" />
            </label>
            <label class="flex items-center gap-2.5 py-1.5 cursor-pointer">
              <BrandLimeCheckbox v-model="priv.excludeCandidate" aria-label="Don't add candidate to participants" />
              <span class="text-[13.5px] text-[var(--brand-text)]">Don’t add candidate to the list of participants</span>
              <HelpCircle class="w-3.5 h-3.5 text-[var(--brand-text-faint)]" stroke-width="1.8" />
            </label>
          </div>
        </div>
      </div>

      <!-- ═══ STEP: notify ═══ -->
      <div v-else class="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-6">
        <!-- Event details -->
        <div>
          <div class="text-[15px] font-bold text-[var(--brand-text)] mb-3">Event details</div>
          <div class="rounded-[12px] border border-[var(--brand-border-fade)] bg-white p-5 flex items-start gap-3.5">
            <component :is="eventType.icon" class="w-6 h-6 text-[var(--brand-text-secondary)] mt-0.5 shrink-0" stroke-width="1.6" />
            <div class="min-w-0">
              <div class="text-[15px] font-bold text-[var(--brand-text)]">{{ eventName }}</div>
              <div class="text-[13.5px] text-[var(--brand-text-quiet)] mt-1">{{ summaryLine }}</div>
            </div>
          </div>
        </div>

        <!-- Invitations -->
        <div>
          <div class="text-[15px] font-bold text-[var(--brand-text)] mb-3">Invitations</div>
          <div class="rounded-[12px] border border-[var(--brand-border-fade)] bg-white p-5">
            <div class="flex items-center gap-3">
              <div class="flex -space-x-2 shrink-0">
                <BrandAvatarInitials :initials="candidateInitials || initialsFor(candidateName || '?')" :bg="candidateColor || 'var(--brand-pipeline-purple)'" size="md" />
                <BrandAvatarInitials v-if="organizer" :initials="initialsFor(organizer.name)" :bg="organizer.avatarBg" :color="organizer.avatarText" size="md" />
              </div>
              <span class="flex-1 text-[14px] text-[var(--brand-text)]">Invite all participants <span class="font-semibold">via email &amp; calendar</span></span>
              <button type="button" class="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--brand-text-secondary)] hover:text-[var(--brand-text)]" @click="showInviteOptions = !showInviteOptions">
                {{ showInviteOptions ? 'Hide options' : 'Show options' }}
                <ChevronDown class="w-3.5 h-3.5 transition-transform" :class="showInviteOptions ? 'rotate-180' : ''" stroke-width="2" />
              </button>
            </div>
            <div v-if="showInviteOptions" class="mt-4 pt-4 border-t border-[var(--brand-border-fade)]">
              <div class="flex items-center gap-6 mb-3">
                <span class="w-[150px] shrink-0 text-[13.5px] text-[var(--brand-text-secondary)]">Invite candidate via</span>
                <label class="inline-flex items-center gap-2 cursor-pointer"><BrandLimeCheckbox v-model="invite.candidateEmail" aria-label="Email candidate" /><span class="text-[13.5px] text-[var(--brand-text)]">Email</span></label>
                <label class="inline-flex items-center gap-2 cursor-pointer"><BrandLimeCheckbox v-model="invite.candidateCalendar" aria-label="Calendar invite candidate" /><span class="text-[13.5px] text-[var(--brand-text)]">Calendar (Outlook/Google)</span></label>
                <a href="#" class="ml-auto inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--brand-teal-secondary)] hover:text-[var(--brand-teal)]"><HelpCircle class="w-3.5 h-3.5" stroke-width="1.8" />FAQ</a>
              </div>
              <div class="flex items-center gap-6">
                <span class="w-[150px] shrink-0 text-[13.5px] text-[var(--brand-text-secondary)]">Invite interviewers via</span>
                <label class="inline-flex items-center gap-2 cursor-pointer"><BrandLimeCheckbox v-model="invite.interviewerEmail" aria-label="Email interviewers" /><span class="text-[13.5px] text-[var(--brand-text)]">Email</span></label>
                <label class="inline-flex items-center gap-2 opacity-50"><BrandLimeCheckbox v-model="invite.interviewerCalendar" aria-label="Calendar invite interviewers" /><span class="text-[13.5px] text-[var(--brand-text)]">Calendar (Outlook/Google)</span></label>
              </div>
            </div>
          </div>
        </div>

        <!-- Customize email to candidate -->
        <div>
          <div class="text-[15px] font-bold text-[var(--brand-text)] mb-3">Customize email to candidate</div>
          <div class="rounded-[12px] border border-[var(--brand-border-fade)] bg-white overflow-hidden">
            <!-- From -->
            <div class="flex items-center gap-2.5 px-4 h-12 border-b border-[var(--brand-border-fade)]">
              <span class="text-[13px] text-[var(--brand-text-quiet)]">From</span>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button type="button" class="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[var(--brand-text)] hover:text-[var(--brand-teal)] transition">
                    <BrandAvatarInitials v-if="organizer" :initials="initialsFor(organizer.name)" :bg="organizer.avatarBg" :color="organizer.avatarText" size="sm" />
                    {{ fromEmail || 'Select sender' }}
                    <ChevronDown class="w-3.5 h-3.5 text-[var(--brand-text-quiet)]" stroke-width="2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-[260px] p-1.5 rounded-[12px]">
                  <DropdownMenuItem v-for="m in fromMembers" :key="m.id" class="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] cursor-pointer" @select="fromEmail = m.email">
                    <BrandAvatarInitials :initials="initialsFor(m.name)" :bg="m.avatarBg" :color="m.avatarText" size="md" />
                    <span class="text-[13px] text-[var(--brand-text)] truncate">{{ m.email }}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <!-- Subject -->
            <div class="px-4 py-3 text-[13.5px] text-[var(--brand-text)] border-b border-[var(--brand-border-fade)]">{{ emailSubject }}</div>
            <!-- Toolbar -->
            <div class="flex items-center gap-0.5 px-2 h-11 border-b border-[var(--brand-border-fade)] overflow-x-auto">
              <button v-for="(t, i) in RT_TOOLS" :key="i" type="button" class="w-8 h-8 rounded-md inline-flex items-center justify-center text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition shrink-0" aria-label="Format">
                <component :is="t" class="w-4 h-4" stroke-width="1.9" />
              </button>
              <span class="flex-1" />
              <button type="button" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--brand-border-fade)] text-[13px] font-semibold text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition shrink-0"><Plus class="w-3.5 h-3.5" stroke-width="2" />Insert…</button>
            </div>
            <!-- Body -->
            <div class="p-5">
              <textarea v-model="emailBody" rows="3" class="w-full text-[13.5px] leading-relaxed text-[var(--brand-text)] bg-transparent focus:outline-none resize-y" />
              <!-- Event preview card -->
              <div class="mt-4 rounded-[12px] border border-[var(--brand-border-fade)] bg-white p-5">
                <div class="text-[15px] font-bold text-[var(--brand-text)]">{{ eventName }}</div>
                <div class="mt-3 text-[13px]">
                  <div class="text-[var(--brand-text-quiet)]">When</div>
                  <div class="text-[var(--brand-text-secondary)]">{{ fmtFull(selectedDate) }} {{ time }} — {{ endTime }} (GMT+03:00) Africa/Cairo</div>
                </div>
                <div class="mt-3 text-[13px]">
                  <div class="text-[var(--brand-text-quiet)]">Interviewers</div>
                  <div class="text-[var(--brand-text-secondary)]">{{ interviewers.map(m => m.name).join(', ') || '—' }}</div>
                </div>
                <div class="mt-3 text-[13px]">
                  <div class="text-[var(--brand-text-quiet)]">Company</div>
                  <div class="text-[var(--brand-text-secondary)]">{{ companyName }}</div>
                </div>
                <div class="mt-3 text-[13px]">
                  <div class="text-[var(--brand-text-quiet)]">Event link</div>
                  <a href="#" class="font-semibold text-[var(--brand-teal-secondary)] break-all">{{ eventLink }}</a>
                </div>
              </div>
            </div>
            <!-- Placeholders -->
            <div class="flex items-center gap-2 flex-wrap px-4 py-3 border-t border-[var(--brand-border-fade)]">
              <span class="inline-flex items-center gap-1 text-[13px] text-[var(--brand-text-secondary)]">Placeholders <HelpCircle class="w-3.5 h-3.5 text-[var(--brand-text-faint)]" stroke-width="1.8" /></span>
              <button type="button" class="inline-flex items-center gap-1 h-7 px-2.5 rounded-[7px] border border-[var(--brand-border-fade)] text-[12.5px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-canvas)]">Candidate <ChevronDown class="w-3 h-3" stroke-width="2" /></button>
              <span v-for="ph in ['job_offer', 'company']" :key="ph" class="inline-flex items-center h-7 px-2.5 rounded-[7px] border border-[var(--brand-border-fade)] text-[12.5px] font-semibold text-[var(--brand-teal-secondary)]">[ {{ ph }} ]</span>
              <button type="button" class="inline-flex items-center gap-1 h-7 px-2 rounded-[7px] text-[12.5px] font-semibold text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]">··· More</button>
            </div>
            <!-- Attach -->
            <button type="button" class="w-full flex items-center gap-2 px-4 py-3 border-t border-[var(--brand-border-fade)] text-[13.5px] font-semibold text-[var(--brand-text-secondary)] hover:bg-[var(--brand-canvas)] transition"><Paperclip class="w-4 h-4" stroke-width="1.8" />Attach file</button>
          </div>
        </div>

        <!-- Customize email to interviewers (collapsible) -->
        <div>
          <button type="button" class="inline-flex items-center gap-2 text-[15px] font-bold text-[var(--brand-text)]" @click="showInterviewerEmail = !showInterviewerEmail">
            Customize email to interviewers
            <ChevronDown class="w-4 h-4 text-[var(--brand-text-quiet)] transition-transform" :class="showInterviewerEmail ? 'rotate-180' : ''" stroke-width="2" />
          </button>
          <div v-if="showInterviewerEmail" class="mt-3 rounded-[12px] border border-[var(--brand-border-fade)] bg-white p-5 text-[13.5px] text-[var(--brand-text-quiet)]">
            Interviewers receive the event details and any note above. Customize their copy here.
          </div>
        </div>

        <!-- Reminders -->
        <div>
          <div class="text-[15px] font-bold text-[var(--brand-text)] mb-3">Reminders</div>
          <div class="rounded-[12px] border border-[var(--brand-border-fade)] bg-white px-4 py-3.5 flex items-center gap-3">
            <label class="inline-flex items-center gap-2.5 cursor-pointer flex-1"><BrandLimeCheckbox v-model="remindCandidate" aria-label="Remind candidate" /><span class="text-[13.5px] text-[var(--brand-text)]">Remind candidate</span></label>
            <a href="#" class="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--brand-teal-secondary)] hover:text-[var(--brand-teal)]"><HelpCircle class="w-3.5 h-3.5" stroke-width="1.8" />How candidates see this?</a>
          </div>
        </div>
      </div>

      <!-- ═══ Footer ═══ -->
      <div class="h-px bg-[var(--brand-border-fade)] shrink-0" />
      <div class="px-7 py-4 bg-[var(--brand-canvas)] shrink-0">
        <!-- notify: back (Edit) left, primary right -->
        <div v-if="step === 'notify'" class="flex items-center justify-between gap-3">
          <BrandButton variant="outline" @click="step = 'form'"><ChevronLeft class="w-4 h-4 mr-1" stroke-width="2" />Edit</BrandButton>
          <BrandButton variant="primary-teal" @click="onSchedule">Schedule and invite</BrandButton>
        </div>
        <!-- form: Cancel + Continue grouped on the right (Cancel = plain) -->
        <div v-else class="flex items-center justify-end gap-2">
          <BrandButton variant="ghost" @click="open = false">Cancel</BrandButton>
          <BrandButton variant="primary-teal" @click="step = 'notify'">Continue<ArrowRight class="w-4 h-4 ml-1" stroke-width="2" /></BrandButton>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- ═══ Find time (pop-up-in-pop-up) ═══ -->
  <Dialog v-model:open="findTimeOpen">
    <DialogContent
      :show-close-button="false"
      class="p-0 gap-0 border-0 rounded-[18px] !max-w-none h-[88vh] max-h-[88vh] shadow-[0_24px_64px_rgba(0,20,18,0.22)] bg-white overflow-hidden flex flex-col"
      style="width: calc(100vw - 140px)"
    >
      <!-- Header -->
      <div class="flex items-start gap-3 px-7 pt-6 pb-5 shrink-0">
        <div class="flex-1 min-w-0">
          <DialogTitle class="text-[20px] font-bold text-[var(--brand-text)] leading-tight">Find time</DialogTitle>
          <div class="flex items-center gap-2 text-[13px] text-[var(--brand-text-quiet)] mt-1 min-w-0">
            <span>for an interview with</span>
            <BrandAvatarInitials :initials="candidateInitials || initialsFor(candidateName || '?')" :bg="candidateColor || 'var(--brand-pipeline-purple)'" size="md" />
            <span class="font-semibold text-[var(--brand-text-secondary)] truncate">{{ candidateName || 'Candidate' }}</span>
            <template v-if="selectedJobTitle">
              <span class="inline-block w-[9px] h-[9px] rounded-full shrink-0" style="background:var(--brand-status-teal-green)" />
              <span class="truncate">{{ selectedJobTitle }}</span>
            </template>
          </div>
        </div>
        <div class="text-right shrink-0">
          <div class="text-[13px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Interviewer(s)</div>
          <div class="flex items-center justify-end gap-2">
            <DropdownMenu v-if="availableToAdd.length">
              <DropdownMenuTrigger as-child>
                <button type="button" class="w-8 h-8 rounded-full border-[1.5px] border-dashed border-[var(--brand-border)] inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:border-[var(--brand-teal)] hover:text-[var(--brand-teal)] transition" aria-label="Add interviewer"><Plus class="w-4 h-4" stroke-width="2" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-[240px] p-1.5 rounded-[12px]">
                <DropdownMenuItem v-for="m in availableToAdd" :key="m.id" class="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] cursor-pointer" @select="addInterviewer(m.id)">
                  <BrandAvatarInitials :initials="initialsFor(m.name)" :bg="m.avatarBg" :color="m.avatarText" size="md" />
                  <span class="text-[13.5px] font-semibold text-[var(--brand-text)]">{{ m.name }}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <BrandAvatarInitials v-for="m in interviewers" :key="m.id" :initials="initialsFor(m.name)" :bg="m.avatarBg" :color="m.avatarText" size="md" :title="m.name" />
          </div>
        </div>
        <button type="button" class="w-8 h-8 rounded-[8px] inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] transition shrink-0" aria-label="Close" @click="findTimeOpen = false"><X class="w-4 h-4" stroke-width="2" /></button>
      </div>
      <div class="h-px bg-[var(--brand-border-fade)] shrink-0" />

      <!-- Toolbar -->
      <div class="flex items-center justify-between gap-3 px-7 py-3.5 shrink-0">
        <div class="inline-flex items-center gap-2 h-9 px-3 rounded-[9px] border border-[var(--brand-border)] bg-white text-[13.5px] font-semibold text-[var(--brand-text)]">
          <Calendar class="w-4 h-4 text-[var(--brand-text-quiet)]" stroke-width="1.8" />
          {{ weekRangeLabel }}
          <HelpCircle class="w-3.5 h-3.5 text-[var(--brand-text-faint)] ml-0.5" stroke-width="1.8" />
        </div>
        <div class="flex items-center gap-2">
          <div class="inline-flex items-center p-0.5 rounded-[9px] bg-[var(--brand-canvas)] border border-[var(--brand-border-fade)]">
            <button type="button" class="h-7 px-3 rounded-[7px] text-[13px] font-semibold transition" :class="calView === 'week' ? 'bg-white text-[var(--brand-text)] shadow-sm' : 'text-[var(--brand-text-quiet)]'" @click="calView = 'week'">Week</button>
            <button type="button" class="h-7 px-3 rounded-[7px] text-[13px] font-semibold transition" :class="calView === 'day' ? 'bg-white text-[var(--brand-text)] shadow-sm' : 'text-[var(--brand-text-quiet)]'" @click="calView = 'day'">Day</button>
          </div>
          <button type="button" class="w-8 h-8 rounded-md border border-[var(--brand-border)] bg-white inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]" aria-label="Previous" @click="shiftRange(-1)"><ChevronLeft class="w-4 h-4" stroke-width="2" /></button>
          <button type="button" class="w-8 h-8 rounded-md border border-[var(--brand-border)] bg-white inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]" aria-label="Next" @click="shiftRange(1)"><ChevronRight class="w-4 h-4" stroke-width="2" /></button>
          <button type="button" class="w-8 h-8 rounded-md border border-[var(--brand-border)] bg-white inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]" aria-label="More"><MoreHorizontal class="w-4 h-4" stroke-width="2" /></button>
        </div>
      </div>

      <!-- Day headers -->
      <div class="flex border-t border-[var(--brand-border-fade)] shrink-0">
        <div class="w-[72px] shrink-0 border-r border-[var(--brand-border-fade)] px-2 py-2.5">
          <div class="inline-flex items-center gap-0.5 text-[11px] font-bold text-[var(--brand-text-secondary)] leading-tight">GMT<br>+03:00</div>
        </div>
        <div class="flex-1 grid" :style="{ gridTemplateColumns: `repeat(${calDays.length}, minmax(0, 1fr))` }">
          <div v-for="d in calDays" :key="d.toISOString()" class="border-r last:border-r-0 border-[var(--brand-border-fade)] px-3 py-2.5" :class="[sameDay(d, selectedDate) ? 'border-t-2 border-t-[var(--brand-teal)] -mt-px' : '', isPastDay(d) ? 'opacity-45' : '']">
            <div class="text-[13px]" :class="sameDay(d, selectedDate) ? 'font-bold text-[var(--brand-teal)]' : 'text-[var(--brand-text-secondary)]'">{{ DAYS_FULL[d.getDay()] }}</div>
            <div class="text-[17px] font-bold" :class="sameDay(d, selectedDate) ? 'text-[var(--brand-teal)]' : 'text-[var(--brand-text)]'">{{ d.getDate() }} {{ MONTHS[d.getMonth()] }}</div>
            <div class="flex items-center gap-1 mt-1.5">
              <BrandAvatarInitials v-for="m in interviewers" :key="m.id" :initials="initialsFor(m.name)" :bg="m.avatarBg" :color="m.avatarText" size="sm" :title="m.name" />
            </div>
          </div>
        </div>
      </div>
      <div class="h-px bg-[var(--brand-border-fade)] shrink-0" />

      <!-- All-day row -->
      <div class="flex shrink-0">
        <div class="w-[72px] shrink-0 border-r border-[var(--brand-border-fade)] px-2 py-2 text-[11px] text-[var(--brand-text-quiet)]">All day</div>
        <div class="flex-1 grid border-b border-[var(--brand-border-fade)]" :style="{ gridTemplateColumns: `repeat(${calDays.length}, minmax(0, 1fr))` }">
          <div v-for="d in calDays" :key="d.toISOString()" class="border-r last:border-r-0 border-[var(--brand-border-fade)] h-9" />
        </div>
      </div>

      <!-- Time grid (scrollable, full day) -->
      <div ref="gridScroll" class="flex-1 overflow-y-auto">
        <div class="flex">
          <!-- time gutter -->
          <div class="w-[72px] shrink-0 relative border-r border-[var(--brand-border-fade)]" :style="{ height: gridHeight + 'px' }">
            <div v-for="h in GRID_HOURS" v-show="h >= 1" :key="h" class="absolute right-2 -translate-y-1/2 text-[11.5px] text-[var(--brand-text-quiet)] tabular-nums" :style="{ top: (h - GRID_START) * ROW_H + 'px' }">{{ hourLabel(h) }}</div>
          </div>
          <!-- day columns -->
          <div class="flex-1 grid" :style="{ gridTemplateColumns: `repeat(${calDays.length}, minmax(0, 1fr))` }">
            <div
              v-for="d in calDays"
              :key="d.toISOString()"
              class="relative border-r last:border-r-0 border-[var(--brand-border-fade)]"
              :class="isPastDay(d) ? 'bg-[var(--brand-canvas)]/60 cursor-not-allowed' : 'cursor-pointer'"
              :style="{ height: gridHeight + 'px' }"
              @click="onColumnClick(d, $event)"
            >
              <!-- hour gridlines (full + faint half-hour) -->
              <template v-for="h in GRID_HOURS" :key="h">
                <div class="absolute left-0 right-0 border-t border-[var(--brand-border-fade)]" :style="{ top: (h - GRID_START) * ROW_H + 'px' }" />
                <div class="absolute left-0 right-0 border-t border-[var(--brand-border-hairline)]" :style="{ top: (h - GRID_START) * ROW_H + ROW_H / 2 + 'px' }" />
              </template>
              <!-- selected slot -->
              <div
                v-if="sameDay(d, selectedDate)"
                class="absolute left-1.5 right-1.5 rounded-[7px] bg-[var(--brand-teal)] text-white px-2 py-0.5 text-[10.5px] font-semibold leading-[1.15] shadow-[0_4px_12px_rgba(0,36,39,0.28)] overflow-hidden"
                :style="{ top: blockTop + 'px', height: blockHeight + 'px' }"
              >
                <div>{{ duration }} mins</div>
                <div class="opacity-90">{{ time }} - {{ endTime }}</div>
                <!-- resize handle (bottom-right, visual) -->
                <svg class="absolute bottom-0.5 right-0.5 w-3 h-3 text-white/70" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M10 4 L4 10 M10 8 L8 10" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="h-px bg-[var(--brand-border-fade)] shrink-0" />
      <div class="flex items-center justify-between gap-3 px-7 py-4 bg-[var(--brand-canvas)] shrink-0">
        <BrandButton variant="outline" @click="findTimeOpen = false"><ChevronLeft class="w-4 h-4 mr-1" stroke-width="2" />Go back</BrandButton>
        <BrandButton variant="primary-teal" @click="findTimeOpen = false">Continue with {{ fmtDate(selectedDate).replace(/ \d{4}$/, '') }} {{ time }} - {{ endTime }}</BrandButton>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Request evaluation (nested) -->
  <CandidateRequestEvaluationModal v-model:open="reqEvalOpen" @save="onEvalSaved" />
</template>
