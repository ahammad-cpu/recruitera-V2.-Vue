<!--
  Getting-started onboarding drawer — progress ring + expandable step cards,
  each with subtasks. Completion persists via useOnboarding (localStorage).
-->
<script setup lang="ts">
import {
  Flag, Settings, Globe, MessageSquare, Briefcase, Users, Store,
  PlayCircle, Compass, UserCog, UserPlus, Bell, Building2, Palette, Mail,
  LayoutTemplate, FileText, Rocket, MessagesSquare, FilePlus2, Send, Eye,
  MoveRight, ThumbsUp, BadgeCheck, Blocks, Plug,
  ChevronDown, Check, GraduationCap, X,
} from 'lucide-vue-next'
import { useLocalStorage } from '@vueuse/core'
import { Sheet, SheetContent } from '~/components/ui/sheet'
import { useTeamMembers } from '~/composables/useTeam'
import { useOnboarding, ONBOARDING_STEPS, type OnboardingStep } from '~/composables/useOnboarding'

const ICONS: Record<string, unknown> = {
  Flag, Settings, Globe, MessageSquare, Briefcase, Users, Store,
  PlayCircle, Compass, UserCog, UserPlus, Bell, Building2, Palette, Mail,
  LayoutTemplate, FileText, Rocket, MessagesSquare, FilePlus2, Send, Eye,
  MoveRight, ThumbsUp, BadgeCheck, Blocks, Plug,
}

const { open, isDone, toggle, markDone, stepDone, percent, dismissed } = useOnboarding()
const { trackEvent } = useIntercom()
watch(percent, (v) => { if (v === 100) trackEvent('onboarding_completed') })
const { data: teamData } = useTeamMembers()
const firstName = computed(() => (teamData.value?.data?.[0]?.name ?? 'there').split(/\s+/)[0])

const expandedStep = ref<string>('get-started')
const expandedTask = ref<string>('')
function toggleStep(id: string) { expandedStep.value = expandedStep.value === id ? '' : id }
function onTaskClick(taskId: string, video?: string) {
  if (video) { expandedTask.value = expandedTask.value === taskId ? '' : taskId; return }
  toggle(taskId)
  if (isDone(taskId)) trackEvent('onboarding_task_completed', { task: taskId })
}

// progress ring geometry
const R = 24
const CIRC = 2 * Math.PI * R
const dashoffset = computed(() => CIRC * (1 - percent.value / 100))
function stepComplete(s: OnboardingStep) { return stepDone(s) === s.subtasks.length }

// Resizable width — default 440 (Recruitee-like), clamped, remembered per browser.
const MIN_W = 360
const MAX_W = 680
const panelWidth = useLocalStorage('onboarding-width', 440)
const resizing = ref(false)
function onResize(e: MouseEvent) {
  if (!resizing.value) return
  panelWidth.value = Math.min(MAX_W, Math.max(MIN_W, Math.round(window.innerWidth - e.clientX)))
}
function endResize() {
  resizing.value = false
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', endResize)
}
function startResize(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  resizing.value = true
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', endResize)
}
onBeforeUnmount(endResize)
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent side="right" class="p-0 gap-0 flex flex-col bg-[var(--brand-canvas)]" :class="resizing ? 'select-none' : ''" :style="{ width: `${panelWidth}px`, maxWidth: '92vw' }">
      <!-- Resize handle (left edge) — bare dotted grip, no pill -->
      <div class="absolute left-0 top-0 bottom-0 w-4 z-30 cursor-ew-resize group hidden sm:block" @mousedown="startResize">
        <svg class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors" :class="resizing ? 'text-[var(--brand-teal)]' : 'text-[var(--brand-text-faint)] group-hover:text-[var(--brand-text-secondary)]'" width="8" height="14" viewBox="0 0 8 14" fill="currentColor" aria-hidden="true">
          <circle cx="2" cy="2" r="1.1" /><circle cx="6" cy="2" r="1.1" />
          <circle cx="2" cy="7" r="1.1" /><circle cx="6" cy="7" r="1.1" />
          <circle cx="2" cy="12" r="1.1" /><circle cx="6" cy="12" r="1.1" />
        </svg>
      </div>

      <!-- Header bar -->
      <div class="flex items-center justify-between px-5 h-12 bg-[var(--brand-teal)] text-white shrink-0">
        <span class="inline-flex items-center gap-2 text-[14px] font-bold"><GraduationCap class="w-4.5 h-4.5" /> Getting started</span>
        <button type="button" class="w-8 h-8 -mr-1.5 rounded-md grid place-items-center hover:bg-white/15 transition" aria-label="Close" @click="open = false"><X class="w-4.5 h-4.5" /></button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <!-- Greeting + progress -->
        <div class="px-5 pt-5 pb-4 flex items-start justify-between gap-4">
          <div>
            <div class="text-[20px] font-bold text-[var(--brand-text)]">👋 Hello {{ firstName }}!</div>
            <div class="text-[13.5px] text-[var(--brand-text-quiet)] mt-0.5">Complete all steps to learn Recruitera.</div>
          </div>
          <div class="relative w-[53px] h-[53px] shrink-0">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 53 53">
              <circle cx="26.5" cy="26.5" :r="R" fill="none" stroke="var(--brand-canvas)" stroke-width="5" />
              <circle cx="26.5" cy="26.5" :r="R" fill="none" stroke="var(--brand-status-teal-green)" stroke-width="5" stroke-linecap="round" :stroke-dasharray="CIRC" :stroke-dashoffset="dashoffset" class="transition-[stroke-dashoffset] duration-500" />
            </svg>
            <span class="absolute inset-0 grid place-items-center text-[13px] font-bold text-[var(--brand-text)] tabular-nums">{{ percent }}%</span>
          </div>
        </div>

        <!-- Step cards -->
        <div class="px-4 pb-4 space-y-2.5">
          <div v-for="s in ONBOARDING_STEPS" :key="s.id" class="rounded-[14px] border border-[var(--brand-border-light)] bg-white overflow-hidden">
            <!-- Step header -->
            <button type="button" class="w-full flex items-center gap-3 px-4 py-3.5 text-left" @click="toggleStep(s.id)">
              <span class="w-10 h-10 rounded-full grid place-items-center shrink-0" :class="stepComplete(s) ? 'bg-[var(--brand-status-approved-bg)]' : 'bg-[var(--brand-lime-tint)]'">
                <Check v-if="stepComplete(s)" class="w-5 h-5 text-[var(--brand-status-approved-text)]" stroke-width="2.5" />
                <component :is="ICONS[s.icon] ?? Flag" v-else class="w-5 h-5 text-[var(--brand-teal)]" stroke-width="1.9" />
              </span>
              <span class="flex-1 text-[15px] font-bold text-[var(--brand-text)]">{{ s.title }}</span>
              <span class="text-[12.5px] text-[var(--brand-text-quiet)]">{{ stepDone(s) }}/{{ s.subtasks.length }}</span>
              <ChevronDown class="w-4.5 h-4.5 text-[var(--brand-text-quiet)] transition-transform" :class="expandedStep === s.id ? 'rotate-180' : ''" />
            </button>

            <!-- Subtasks -->
            <div v-if="expandedStep === s.id" class="px-3 pb-3 space-y-1.5">
              <div v-for="t in s.subtasks" :key="t.id" class="rounded-xl border border-[var(--brand-border-fade)] overflow-hidden" :class="isDone(t.id) ? 'bg-[var(--brand-status-approved-bg)]/40' : 'bg-white'">
                <button type="button" class="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[var(--brand-canvas)]/60 transition" @click="onTaskClick(t.id, t.video)">
                  <span class="w-8 h-8 rounded-full grid place-items-center shrink-0" :class="isDone(t.id) ? 'bg-[var(--brand-status-teal-green)]' : 'bg-[var(--brand-canvas)]'">
                    <Check v-if="isDone(t.id)" class="w-4 h-4 text-white" stroke-width="2.5" />
                    <component :is="ICONS[t.icon] ?? PlayCircle" v-else class="w-4 h-4 text-[var(--brand-text-secondary)]" stroke-width="1.9" />
                  </span>
                  <span class="flex-1 text-[13.5px] font-semibold" :class="isDone(t.id) ? 'text-[var(--brand-text-quiet)] line-through' : 'text-[var(--brand-text)]'">{{ t.title }}</span>
                  <ChevronDown v-if="t.video" class="w-4 h-4 text-[var(--brand-text-quiet)] transition-transform" :class="expandedTask === t.id ? 'rotate-180' : ''" />
                </button>

                <!-- Video content -->
                <div v-if="t.video && expandedTask === t.id" class="px-3 pb-3">
                  <div class="rounded-lg overflow-hidden aspect-video bg-black">
                    <iframe :src="t.video" class="w-full h-full" allowfullscreen title="Welcome video" />
                  </div>
                  <div class="flex justify-end mt-2">
                    <button type="button" class="h-8 px-3 rounded-lg text-[13px] font-semibold text-[var(--brand-teal)] hover:bg-[var(--brand-lime-tint-hover)] transition" @click="markDone(t.id); trackEvent('onboarding_task_completed', { task: t.id }); expandedTask = ''">Mark as done</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center pb-6">
          <button type="button" class="text-[13.5px] font-semibold text-[var(--brand-teal)] hover:underline" @click="dismissed = true; open = false">Dismiss this guide</button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
