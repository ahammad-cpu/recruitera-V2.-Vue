<!--
  "New scheduler link" dialog — self-scheduling link setup (opened from the
  Calendar / Interviews page). Direction A "Calm booking": one relaxed column,
  Recruitera brand tokens, brand primitives, and a chip-based availability
  picker (preset workday ranges, with a Custom fallback to time dropdowns).
  Carries the full field set: event details, organizer, location, notes,
  interviewers, availability + settings. Emits `create` with the payload.
-->
<script setup lang="ts">
import {
  X, Plus, Check, Lightbulb, HelpCircle, MapPin, Users, Phone, Video, AlignLeft, Play,
} from 'lucide-vue-next'
import { Dialog, DialogContent, DialogTitle } from '~/components/ui/dialog'
import { TooltipProvider } from '~/components/ui/tooltip'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '~/components/ui/dropdown-menu'
import { BrandButton, BrandAvatarInitials, BrandLimeCheckbox } from '~/components/brand'
import SchedulerSelect from './SchedulerSelect.vue'
import SchedulerHelpTip from './SchedulerHelpTip.vue'
import { useTeamMembers } from '~/composables/useTeam'
import type { TeamMember } from '~/types'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ create: [payload: Record<string, unknown>] }>()

const { data: teamData } = useTeamMembers()
const roster = computed<TeamMember[]>(() => teamData.value?.data ?? [])
function initialsFor(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean)
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1]![0] : '')).toUpperCase() || '?'
}

// ── Option sets ──
const TIME_OPTIONS = (() => {
  const out: { value: string; label: string }[] = []
  for (let h = 6; h < 22; h++) for (const m of [0, 30]) {
    const v = `${h}:${String(m).padStart(2, '0')}`
    out.push({ value: v, label: v })
  }
  return out
})()
const DATE_RANGE_OPTIONS = [7, 14, 20, 30, 60, 90].map(d => ({ value: String(d), label: `Next ${d} days` }))
const EXPIRES_OPTIONS = [
  { value: '7', label: '7 days' }, { value: '10', label: '10 days' }, { value: '14', label: '14 days' },
  { value: '30', label: '30 days' }, { value: '0', label: 'No expiry' },
]
const DURATION_OPTIONS = [
  { value: '15', label: '15 minutes' }, { value: '30', label: '30 minutes' }, { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' }, { value: '90', label: '1 hour 30 minutes' }, { value: '120', label: '2 hours' },
]
const SLOT_INTERVAL_OPTIONS = [
  { value: '15', label: '15 minutes' }, { value: '30', label: '30 minutes' }, { value: '60', label: '1 hour' },
]
const EVENT_TYPE_OPTIONS = [
  { value: 'meeting', label: 'Meeting', icon: Users },
  { value: 'in_person', label: 'In person', icon: MapPin },
  { value: 'phone', label: 'Phone call', icon: Phone },
  { value: 'google_meet', label: 'Google Meet', icon: Video },
  { value: 'zoom', label: 'Zoom', icon: Video },
  { value: 'teams', label: 'Microsoft Teams', icon: Video },
]
const EVENT_NAME_DEFAULT = '[candidate.full] — Interview with [company]'
const TIMEZONE_LABEL = '(GMT+03:00) Africa/Cairo'

// ── Form state ──
const linkName = ref('')
const dateRange = ref('20')
const expires = ref('10')
const eventName = ref(EVENT_NAME_DEFAULT)
const eventDuration = ref('30')
const slotInterval = ref('30')
const eventType = ref('meeting')
const organizerId = ref('')
const location = ref('')
const note = ref('')
const showPrivateNote = ref(false)
const privateNote = ref('')
const inviteMode = ref<'all' | 'first'>('all')

// Availability settings
const bufferTime = ref(false)
const ignoreAllDay = ref(true)
const limitMeetings = ref(false)
const allowReschedule = ref(true)

// ── Availability with preset chips ──
interface Slot { start: string; end: string }
interface DayAvailability { day: string; enabled: boolean; slots: Slot[]; customOpen: boolean }
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const PRESETS = [
  { key: '9 – 5', start: '9:00', end: '17:00' },
  { key: '10 – 6', start: '10:00', end: '18:00' },
  { key: '1 – 5', start: '13:00', end: '17:00' },
]
function freshAvailability(): DayAvailability[] {
  return DAY_NAMES.map((day, i) => ({
    day,
    enabled: i < 5,
    slots: i < 5 ? [{ start: PRESETS[0]!.start, end: PRESETS[0]!.end }] : [],
    customOpen: false,
  }))
}
const availability = ref<DayAvailability[]>(freshAvailability())
function activePreset(d: DayAvailability): string | 'custom' | null {
  const s = d.slots[0]
  if (!s) return null
  return PRESETS.find(p => p.start === s.start && p.end === s.end)?.key ?? 'custom'
}
function toggleDay(d: DayAvailability) {
  d.enabled = !d.enabled
  d.customOpen = false
  d.slots = d.enabled ? [{ start: PRESETS[0]!.start, end: PRESETS[0]!.end }] : []
}
function pickPreset(d: DayAvailability, p: typeof PRESETS[number]) {
  d.customOpen = false
  d.slots = [{ start: p.start, end: p.end }]
}
function openCustom(d: DayAvailability) {
  d.customOpen = true
  if (!d.slots.length) d.slots = [{ start: '9:00', end: '17:00' }]
}
function addSlot(d: DayAvailability) { d.slots.push({ start: '9:00', end: '17:00' }) }
function removeSlot(d: DayAvailability, i: number) {
  d.slots.splice(i, 1)
  if (!d.slots.length) { d.enabled = false; d.customOpen = false }
}

// ── Interviewers (tabs) ──
const interviewerIds = ref<string[]>([])
const activeInterviewerId = ref<string>('')
watch(roster, (r) => {
  if (r.length && !interviewerIds.value.length) {
    interviewerIds.value = [r[0]!.id]
    activeInterviewerId.value = r[0]!.id
    if (!organizerId.value) organizerId.value = r[0]!.id
  }
}, { immediate: true })
const interviewers = computed(() => roster.value.filter(m => interviewerIds.value.includes(m.id)))
const availableInterviewers = computed(() => roster.value.filter(m => !interviewerIds.value.includes(m.id)))
function addInterviewer(id: string) {
  if (!interviewerIds.value.includes(id)) interviewerIds.value = [...interviewerIds.value, id]
  activeInterviewerId.value = id
}
function removeInterviewer(id: string) {
  interviewerIds.value = interviewerIds.value.filter(x => x !== id)
  if (activeInterviewerId.value === id) activeInterviewerId.value = interviewerIds.value[0] ?? ''
}
const activeInterviewer = computed(() => roster.value.find(m => m.id === activeInterviewerId.value))
const organizer = computed(() => roster.value.find(m => m.id === organizerId.value))
const missingCalendarNames = computed(() => interviewers.value.map(m => m.name).join(', '))

const showCalendarPromo = ref(true)
const showMissingCalendarInfo = ref(true)
const showDidYouKnow = ref(true)
const showPlaceholders = ref(false)
const PLACEHOLDERS = ['[candidate.full]', '[candidate.first]', '[candidate.last]', '[company]', '[job.title]', '[interviewer.first]']
const canCreate = computed(() => linkName.value.trim().length > 0)

function reset() {
  linkName.value = ''
  dateRange.value = '20'
  expires.value = '10'
  eventName.value = EVENT_NAME_DEFAULT
  eventDuration.value = '30'
  slotInterval.value = '30'
  eventType.value = 'meeting'
  location.value = ''
  note.value = ''
  showPrivateNote.value = false
  privateNote.value = ''
  inviteMode.value = 'all'
  bufferTime.value = false; ignoreAllDay.value = true; limitMeetings.value = false; allowReschedule.value = true
  availability.value = freshAvailability()
  showCalendarPromo.value = true
  showMissingCalendarInfo.value = true
  showDidYouKnow.value = true
  showPlaceholders.value = false
}
watch(open, (v) => { if (v) reset() })

function onCreate() {
  if (!canCreate.value) return
  emit('create', {
    name: linkName.value.trim(),
    dateRangeDays: Number(dateRange.value),
    expiresDays: Number(expires.value),
    inviteMode: inviteMode.value,
    interviewerIds: interviewerIds.value,
    availability: availability.value.map(d => ({ day: d.day, enabled: d.enabled, slots: d.slots })),
    settings: { bufferTime: bufferTime.value, ignoreAllDay: ignoreAllDay.value, limitMeetings: limitMeetings.value, allowReschedule: allowReschedule.value },
    event: {
      name: eventName.value, durationMin: Number(eventDuration.value), slotIntervalMin: Number(slotInterval.value),
      type: eventType.value, timezone: TIMEZONE_LABEL, organizerId: organizerId.value,
      location: location.value, note: note.value, privateNote: showPrivateNote.value ? privateNote.value : '',
    },
  })
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      :show-close-button="false"
      class="p-0 gap-0 border-0 rounded-[18px] !max-w-[600px] sm:!max-w-[600px] w-[95vw] max-h-[92vh] flex flex-col shadow-[0_28px_72px_rgba(0,20,18,0.20)] bg-white overflow-hidden"
    >
      <TooltipProvider :delay-duration="150" :disable-hoverable-content="true">
      <!-- Header -->
      <div class="flex items-center gap-3 px-7 pt-6 pb-5 shrink-0">
        <DialogTitle class="flex-1 text-[20px] font-bold text-[var(--brand-text)] tracking-[-0.01em]">
          <span class="font-medium text-[var(--brand-text-quiet)]">New</span> scheduler link
        </DialogTitle>
        <button type="button" class="w-9 h-9 rounded-[9px] inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] hover:text-[var(--brand-text)] transition" aria-label="Close" @click="open = false">
          <X class="w-5 h-5" stroke-width="2" />
        </button>
      </div>
      <div class="h-px bg-[var(--brand-border-fade)] shrink-0" />

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5">
        <!-- Did you know? — onboarding nudge -->
        <div v-if="showDidYouKnow" class="relative flex items-start gap-3.5 rounded-[13px] border border-[color-mix(in_srgb,var(--brand-teal-secondary)_26%,white)] bg-[color-mix(in_srgb,var(--brand-teal-secondary)_8%,white)] px-4 py-3.5">
          <button type="button" class="w-12 h-12 rounded-[11px] bg-[var(--brand-teal)] inline-flex items-center justify-center shrink-0 shadow-sm group" aria-label="Play intro video">
            <Play class="w-5 h-5 text-[var(--brand-lime)] translate-x-[1px] transition group-hover:scale-110" fill="currentColor" stroke-width="0" />
          </button>
          <div class="flex-1 min-w-0 pr-5">
            <div class="text-[13.5px] font-bold text-[var(--brand-text)]">Did you know?</div>
            <div class="text-[12.5px] text-[var(--brand-text-secondary)] mt-0.5 leading-relaxed">Candidates hear back faster with a self-scheduling link — they pick a slot that fits, no email back-and-forth.</div>
          </div>
          <button type="button" class="absolute top-2.5 right-2.5 w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-white transition" aria-label="Dismiss" @click="showDidYouKnow = false"><X class="w-4 h-4" stroke-width="2" /></button>
        </div>

        <!-- Link name -->
        <div>
          <label class="block text-[12.5px] font-bold text-[var(--brand-text-secondary)] mb-1.5">
            Link name <span class="text-[var(--brand-status-closed-text)]">*</span>
          </label>
          <input
            v-model="linkName"
            type="text"
            placeholder="e.g. Senior Marketer — first round"
            class="w-full h-11 px-3.5 rounded-[11px] border-[1.5px] border-[var(--brand-border)] bg-white text-[14.5px] text-[var(--brand-text)] outline-none transition focus:border-[var(--brand-teal)] placeholder:text-[var(--brand-text-quiet)]"
          >
        </div>

        <!-- Range / expiry -->
        <div class="grid grid-cols-2 gap-3.5">
          <div>
            <label class="flex items-center gap-1 text-[12.5px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Date range <SchedulerHelpTip text="How far ahead candidates can book — the link only offers open slots within this window." /></label>
            <SchedulerSelect v-model="dateRange" :options="DATE_RANGE_OPTIONS" />
          </div>
          <div>
            <label class="flex items-center gap-1 text-[12.5px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Expires after <SchedulerHelpTip text="When the link stops accepting new bookings, even if slots remain." /></label>
            <SchedulerSelect v-model="expires" :options="EXPIRES_OPTIONS" />
          </div>
        </div>

        <!-- Event name -->
        <div>
          <label class="flex items-center gap-2 text-[12.5px] font-bold text-[var(--brand-text-secondary)] mb-1.5">
            Event name
            <span class="inline-flex items-center h-[18px] px-1.5 rounded-md text-[11px] font-extrabold tracking-[0.04em] text-[var(--brand-pipeline-purple)] bg-[color-mix(in_srgb,var(--brand-pipeline-purple)_14%,white)]">NEW</span>
          </label>
          <input
            v-model="eventName"
            type="text"
            class="w-full h-11 px-3.5 rounded-[11px] border-[1.5px] border-[var(--brand-border)] bg-white text-[14.5px] text-[var(--brand-text)] outline-none transition focus:border-[var(--brand-teal)]"
          >
          <div class="flex items-start gap-1.5 mt-1.5">
            <Lightbulb class="w-3.5 h-3.5 text-[var(--brand-warning)] shrink-0 mt-0.5" stroke-width="1.8" />
            <span class="text-[12px] text-[var(--brand-text-quiet)]">Use placeholders to personalise what the candidate sees. <button type="button" class="font-semibold text-[var(--brand-teal-secondary)] hover:text-[var(--brand-teal)] transition" @click="showPlaceholders = !showPlaceholders">See available placeholders</button></span>
          </div>
          <div v-if="showPlaceholders" class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="p in PLACEHOLDERS" :key="p" type="button"
              class="inline-flex items-center h-7 px-2.5 rounded-[7px] border border-[var(--brand-border-fade)] bg-[var(--brand-canvas)] text-[12px] font-semibold text-[var(--brand-teal-secondary)] hover:border-[var(--brand-teal)] transition"
              @click="eventName = (eventName ? eventName + ' ' : '') + p"
            >{{ p }}</button>
          </div>
        </div>

        <!-- Duration / slots -->
        <div class="grid grid-cols-2 gap-3.5">
          <div>
            <label class="block text-[12.5px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Each slot</label>
            <SchedulerSelect v-model="eventDuration" :options="DURATION_OPTIONS" />
          </div>
          <div>
            <label class="flex items-center gap-1 text-[12.5px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Start times every <SchedulerHelpTip text="The gap between the start times candidates can choose — e.g. every 30 min." /></label>
            <SchedulerSelect v-model="slotInterval" :options="SLOT_INTERVAL_OPTIONS" />
          </div>
        </div>

        <!-- Event type / organizer -->
        <div class="grid grid-cols-2 gap-3.5 items-start">
          <div>
            <label class="block text-[12.5px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Event type</label>
            <SchedulerSelect v-model="eventType" :options="EVENT_TYPE_OPTIONS" />
          </div>
          <div>
            <label class="block text-[12.5px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Organizer</label>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <button type="button" class="w-full inline-flex items-center gap-2 h-10 px-3 rounded-[10px] border border-[var(--brand-border)] bg-white text-[14px] text-[var(--brand-text)] transition hover:border-[var(--brand-teal)]">
                  <BrandAvatarInitials v-if="organizer" :initials="initialsFor(organizer.name)" :bg="organizer.avatarBg" :color="organizer.avatarText" size="sm" />
                  <span class="flex-1 text-left truncate">{{ organizer?.name ?? 'Select organizer' }}</span>
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
        </div>

        <!-- Location -->
        <div>
          <label class="block text-[12.5px] font-bold text-[var(--brand-text-secondary)] mb-1.5">Location</label>
          <div class="flex items-center gap-2 h-11 px-3.5 rounded-[11px] border-[1.5px] border-[var(--brand-border)] bg-white transition focus-within:border-[var(--brand-teal)]">
            <MapPin class="w-4 h-4 text-[var(--brand-text-quiet)] shrink-0" stroke-width="1.8" />
            <input v-model="location" type="text" placeholder="Type location" class="flex-1 bg-transparent text-[14.5px] text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-quiet)]">
          </div>
        </div>

        <!-- Note -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-[12.5px] font-bold text-[var(--brand-text-secondary)]">Note</label>
            <span class="text-[12px] text-[var(--brand-text-quiet)]">Visible to candidates</span>
          </div>
          <textarea
            v-model="note"
            rows="2"
            placeholder="Add a note"
            class="w-full px-3.5 py-2.5 rounded-[11px] border-[1.5px] border-[var(--brand-border)] bg-white text-[14.5px] text-[var(--brand-text)] outline-none resize-none transition focus:border-[var(--brand-teal)] placeholder:text-[var(--brand-text-quiet)]"
          />
        </div>

        <!-- Private note (revealed) -->
        <div v-if="showPrivateNote" class="rounded-[11px] border border-[color-mix(in_srgb,var(--brand-warning)_45%,white)] bg-[color-mix(in_srgb,var(--brand-warning)_10%,white)] p-3.5">
          <div class="text-[12px] font-bold text-[var(--brand-text)] mb-1.5">Private note · only visible to your team</div>
          <textarea
            v-model="privateNote"
            rows="2"
            placeholder="Add a private note"
            class="w-full px-3.5 py-2.5 rounded-[9px] border border-[color-mix(in_srgb,var(--brand-warning)_45%,white)] bg-white text-[14.5px] text-[var(--brand-text)] outline-none resize-none"
          />
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-2">
          <BrandButton variant="outline">
            <Plus class="w-3.5 h-3.5 mr-1.5" stroke-width="2" />Request evaluation
          </BrandButton>
          <BrandButton v-if="!showPrivateNote" variant="outline" @click="showPrivateNote = true">
            <AlignLeft class="w-3.5 h-3.5 mr-1.5" stroke-width="1.8" />Add private note
          </BrandButton>
        </div>

        <div class="h-px bg-[var(--brand-border-fade)]" />

        <!-- Interviewers -->
        <div>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-[15px] font-bold text-[var(--brand-text)]">Interviewers</h2>
            <div class="flex items-center gap-4">
              <button type="button" class="inline-flex items-center gap-2 group" @click="inviteMode = 'all'">
                <span class="w-[17px] h-[17px] rounded-full border-2 inline-flex items-center justify-center transition" :class="inviteMode === 'all' ? 'border-[var(--brand-teal)]' : 'border-[var(--brand-border-mid)] group-hover:border-[var(--brand-text-quiet)]'">
                  <span v-if="inviteMode === 'all'" class="w-2 h-2 rounded-full bg-[var(--brand-teal)]" />
                </span>
                <span class="text-[13px] font-semibold text-[var(--brand-text)]">Invite all</span>
              </button>
              <button type="button" class="inline-flex items-center gap-2 group" @click="inviteMode = 'first'">
                <span class="w-[17px] h-[17px] rounded-full border-2 inline-flex items-center justify-center transition" :class="inviteMode === 'first' ? 'border-[var(--brand-teal)]' : 'border-[var(--brand-border-mid)] group-hover:border-[var(--brand-text-quiet)]'">
                  <span v-if="inviteMode === 'first'" class="w-2 h-2 rounded-full bg-[var(--brand-teal)]" />
                </span>
                <span class="text-[13px]" :class="inviteMode === 'first' ? 'font-semibold text-[var(--brand-text)]' : 'text-[var(--brand-text-muted)]'">Only the first available</span>
              </button>
            </div>
          </div>

          <div class="flex items-center gap-6 border-b border-[var(--brand-border-fade)] mt-3.5">
            <button
              v-for="m in interviewers" :key="m.id" type="button"
              class="group inline-flex items-center gap-2 pb-2.5 -mb-px border-b-2 transition"
              :class="m.id === activeInterviewerId ? 'border-[var(--brand-teal)]' : 'border-transparent hover:border-[var(--brand-border-mid)]'"
              @click="activeInterviewerId = m.id"
            >
              <BrandAvatarInitials :initials="initialsFor(m.name)" :bg="m.avatarBg" :color="m.avatarText" size="md" />
              <span class="text-[13.5px] font-semibold text-[var(--brand-text)]">{{ m.name }}</span>
              <span v-if="interviewers.length > 1" class="w-4 h-4 rounded-full inline-flex items-center justify-center text-[var(--brand-text-quiet)] opacity-0 group-hover:opacity-100 hover:bg-[var(--brand-canvas)] transition" @click.stop="removeInterviewer(m.id)"><X class="w-3 h-3" stroke-width="2.5" /></span>
            </button>
            <DropdownMenu v-if="availableInterviewers.length">
              <DropdownMenuTrigger as-child>
                <button type="button" class="inline-flex items-center gap-1.5 pb-2.5 text-[13.5px] font-semibold text-[var(--brand-teal-secondary)] hover:text-[var(--brand-teal)] transition">Add interviewer <Plus class="w-4 h-4" stroke-width="2" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" class="w-[240px] p-1.5 rounded-[12px]">
                <DropdownMenuItem v-for="m in availableInterviewers" :key="m.id" class="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] cursor-pointer" @select="addInterviewer(m.id)">
                  <BrandAvatarInitials :initials="initialsFor(m.name)" :bg="m.avatarBg" :color="m.avatarText" size="sm" />
                  <span class="text-[14px] text-[var(--brand-text-secondary)]">{{ m.name }}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <!-- Availability — chip picker (the signature) -->
        <div>
          <label class="block text-[12.5px] font-bold text-[var(--brand-text-secondary)] mb-1">When are you available?</label>
          <div class="flex flex-col">
            <div v-for="d in availability" :key="d.day" class="flex items-center gap-4 py-2.5 border-t border-[var(--brand-border-row)] first:border-t-0">
              <button type="button" class="inline-flex items-center gap-2.5 w-[118px] shrink-0 text-left" @click="toggleDay(d)">
                <span class="w-[19px] h-[19px] rounded-[6px] border-[1.7px] inline-flex items-center justify-center shrink-0 transition" :class="d.enabled ? 'bg-[var(--brand-lime)] border-[var(--brand-lime)] text-[var(--brand-olive)]' : 'bg-white border-[var(--brand-border-mid)]'">
                  <Check v-if="d.enabled" class="w-3 h-3" stroke-width="3.2" />
                </span>
                <span class="text-[14px]" :class="d.enabled ? 'font-bold text-[var(--brand-text)]' : 'text-[var(--brand-text-quiet)] font-medium'">{{ d.day }}</span>
              </button>

              <div v-if="d.enabled && !d.customOpen" class="flex items-center gap-2 flex-wrap">
                <button
                  v-for="p in PRESETS" :key="p.key" type="button"
                  class="h-9 px-3.5 rounded-full border-[1.5px] text-[13px] font-semibold tabular-nums transition"
                  :class="activePreset(d) === p.key
                    ? 'bg-[var(--brand-lime)] border-[var(--brand-lime)] text-[var(--brand-olive)]'
                    : 'bg-white border-[var(--brand-border)] text-[var(--brand-text-secondary)] hover:border-[var(--brand-text-quiet)] hover:text-[var(--brand-text)]'"
                  @click="pickPreset(d, p)"
                >{{ p.key }}</button>
                <button type="button" class="h-9 px-3.5 rounded-full border-[1.5px] border-dashed border-[var(--brand-border)] text-[13px] font-semibold text-[var(--brand-teal-secondary)] hover:border-[var(--brand-teal-secondary)] transition" @click="openCustom(d)">
                  {{ activePreset(d) === 'custom' ? '· Custom' : '+ Custom' }}
                </button>
              </div>
              <div v-else-if="d.enabled && d.customOpen" class="flex flex-col gap-2">
                <div v-for="(s, i) in d.slots" :key="i" class="flex items-center gap-2.5">
                  <div class="w-[112px]"><SchedulerSelect v-model="s.start" :options="TIME_OPTIONS" /></div>
                  <span class="text-[13px] text-[var(--brand-text-quiet)]">to</span>
                  <div class="w-[112px]"><SchedulerSelect v-model="s.end" :options="TIME_OPTIONS" /></div>
                  <button type="button" class="w-9 h-9 rounded-[9px] inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] hover:text-[var(--brand-text)] transition" aria-label="Add another slot" @click="addSlot(d)"><Plus class="w-4 h-4" stroke-width="2" /></button>
                  <button v-if="d.slots.length > 1" type="button" class="w-9 h-9 rounded-[9px] inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-[var(--brand-canvas)] hover:text-[var(--brand-danger)] transition" aria-label="Remove slot" @click="removeSlot(d, i)"><X class="w-4 h-4" stroke-width="2" /></button>
                  <button v-if="i === 0" type="button" class="h-9 px-3 rounded-full text-[13px] font-semibold text-[var(--brand-teal-secondary)] hover:text-[var(--brand-teal)] transition" @click="d.customOpen = false">Presets</button>
                </div>
              </div>
              <div v-else class="flex items-center gap-3">
                <span class="text-[13.5px] text-[var(--brand-text-quiet)]">Unavailable</span>
                <button type="button" class="text-[13px] font-semibold text-[var(--brand-teal-secondary)] hover:text-[var(--brand-teal)]" @click="toggleDay(d)">+ Add hours</button>
              </div>
            </div>
          </div>

          <!-- Connect calendar -->
          <div v-if="showCalendarPromo" class="relative mt-4 rounded-[12px] bg-[var(--brand-lime-tint)] border border-[var(--brand-lime)] px-4 py-3.5">
            <button type="button" class="absolute top-3 right-3 text-[var(--brand-text-quiet)] hover:text-[var(--brand-text)] transition" aria-label="Dismiss" @click="showCalendarPromo = false"><X class="w-3.5 h-3.5" stroke-width="2" /></button>
            <div class="text-[14px] font-bold text-[var(--brand-teal)]">Connect your calendar</div>
            <div class="text-[13px] text-[var(--brand-text-secondary)] mt-0.5 mb-3">Enhance your scheduling productivity. <a href="#" class="font-semibold text-[var(--brand-teal-secondary)] hover:text-[var(--brand-teal)]">Learn more</a></div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <button type="button" class="inline-flex items-center gap-2 h-9 px-3 rounded-[9px] bg-white border border-[var(--brand-border)] text-[13px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition">📅 Google (Calendar)</button>
              <button type="button" class="inline-flex items-center gap-2 h-9 px-3 rounded-[9px] bg-white border border-[var(--brand-border)] text-[13px] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-canvas)] transition">🗂 Microsoft (Outlook/Exchange)</button>
            </div>
          </div>

          <div class="text-[12.5px] text-[var(--brand-text-quiet)] tabular-nums mt-3.5">
            <span v-if="activeInterviewer">{{ activeInterviewer.name }}'s time zone is </span>{{ TIMEZONE_LABEL }}
          </div>
        </div>

        <!-- Missing-calendar info -->
        <div v-if="showMissingCalendarInfo" class="flex gap-3 rounded-[12px] border border-[var(--brand-border-fade)] bg-[var(--brand-canvas)] px-4 py-3.5">
          <HelpCircle class="w-5 h-5 text-[var(--brand-teal-secondary)] shrink-0 mt-0.5" stroke-width="1.8" />
          <div class="flex-1 min-w-0">
            <div class="text-[13.5px] font-bold text-[var(--brand-text)] mb-0.5">Some interviewers haven’t connected their calendars</div>
            <div class="text-[13px] text-[var(--brand-text-muted)]">Scheduling is easier when all interviewers sync their calendars with Recruitera. Tip: you can share <a href="#" class="font-semibold text-[var(--brand-teal-secondary)] hover:text-[var(--brand-teal)]">these instructions</a> with your team.</div>
            <div class="mt-1.5 text-[12.5px] italic text-[var(--brand-text-quiet)] border-l-2 border-[var(--brand-border)] pl-2.5">Missing calendars: {{ missingCalendarNames || '—' }}</div>
          </div>
          <button type="button" class="w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--brand-text-quiet)] hover:bg-white transition self-start" aria-label="Dismiss" @click="showMissingCalendarInfo = false"><X class="w-4 h-4" stroke-width="2" /></button>
        </div>

        <!-- Availability settings -->
        <div>
          <label class="block text-[12.5px] font-bold text-[var(--brand-text-secondary)] mb-2.5">Availability settings</label>
          <div class="grid grid-cols-2 gap-x-8 gap-y-2.5">
            <label class="flex items-center gap-2.5 cursor-pointer">
              <BrandLimeCheckbox v-model="bufferTime" />
              <span class="text-[13.5px] text-[var(--brand-text)]">Add buffer time</span>
              <SchedulerHelpTip text="Adds gaps before and after each meeting so back-to-back interviews aren't cramped." />
            </label>
            <label class="flex items-center gap-2.5 cursor-pointer">
              <BrandLimeCheckbox v-model="ignoreAllDay" />
              <span class="text-[13.5px] font-semibold text-[var(--brand-text)]">Ignore all-day events</span>
              <SchedulerHelpTip text="Don't treat all-day calendar entries (like PTO markers) as busy time." />
            </label>
            <label class="flex items-center gap-2.5 cursor-pointer">
              <BrandLimeCheckbox v-model="limitMeetings" />
              <span class="text-[13.5px] text-[var(--brand-text)]">Limit the number of meetings</span>
              <SchedulerHelpTip text="Cap how many interviews can be booked through this link per day." />
            </label>
            <label class="flex items-center gap-2.5 cursor-pointer">
              <BrandLimeCheckbox v-model="allowReschedule" />
              <span class="text-[13.5px] font-semibold text-[var(--brand-text)]">Allow rescheduling</span>
              <SchedulerHelpTip text="Let candidates pick a new time after they've booked." />
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="h-px bg-[var(--brand-border-fade)] shrink-0" />
      <div class="flex items-center justify-end gap-2.5 px-7 py-4 bg-[var(--brand-canvas)] shrink-0">
        <BrandButton variant="ghost" @click="open = false">Cancel</BrandButton>
        <BrandButton variant="primary-teal" :disabled="!canCreate" @click="onCreate">Create link</BrandButton>
      </div>
      </TooltipProvider>
    </DialogContent>
  </Dialog>
</template>
