import { useLocalStorage } from '@vueuse/core'

// Getting-started / onboarding checklist — a guided set of steps, each with
// subtasks. Completion persists per-browser. Module-scoped so the header
// trigger and the drawer share one source of truth.

export interface OnboardingSubtask {
  id: string
  title: string
  icon: string // lucide name, resolved on the client
  video?: string // optional embed URL (expands inline)
}
export interface OnboardingStep {
  id: string
  title: string
  icon: string
  subtasks: OnboardingSubtask[]
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 'get-started', title: 'Get started', icon: 'Flag', subtasks: [
    { id: 'welcome', title: 'Welcome video', icon: 'PlayCircle', video: 'https://www.youtube.com/embed/GTjKXVyr4lY' },
    { id: 'nav-tour', title: 'Navigation tour', icon: 'Compass' },
    { id: 'roles', title: 'Set up roles', icon: 'UserCog' },
    { id: 'invite', title: 'Invite your team', icon: 'UserPlus' },
    { id: 'notifications', title: 'Adjust notifications', icon: 'Bell' },
  ] },
  { id: 'settings', title: 'Adjust settings', icon: 'Settings', subtasks: [
    { id: 'company', title: 'Company details', icon: 'Building2' },
    { id: 'branding', title: 'Branding & logo', icon: 'Palette' },
    { id: 'email', title: 'Email settings', icon: 'Mail' },
  ] },
  { id: 'careers', title: 'Create a careers site', icon: 'Globe', subtasks: [
    { id: 'template', title: 'Choose a template', icon: 'LayoutTemplate' },
    { id: 'content', title: 'Add your content', icon: 'FileText' },
    { id: 'publish-site', title: 'Publish your site', icon: 'Rocket' },
  ] },
  { id: 'messaging', title: 'Compose your messaging', icon: 'MessageSquare', subtasks: [
    { id: 'templates', title: 'Email templates', icon: 'Mail' },
    { id: 'auto-reply', title: 'Auto-confirmation reply', icon: 'MessagesSquare' },
  ] },
  { id: 'first-job', title: 'Post your first job', icon: 'Briefcase', subtasks: [
    { id: 'create-job', title: 'Create a job', icon: 'FilePlus2' },
    { id: 'publish-job', title: 'Publish the job', icon: 'Send' },
  ] },
  { id: 'candidates', title: 'Manage candidates', icon: 'Users', subtasks: [
    { id: 'add-cand', title: 'Add a candidate', icon: 'UserPlus' },
    { id: 'review', title: 'Review applications', icon: 'Eye' },
    { id: 'move-stage', title: 'Move through stages', icon: 'MoveRight' },
    { id: 'evaluate', title: 'Evaluate a candidate', icon: 'ThumbsUp' },
    { id: 'hire', title: 'Make a hire', icon: 'BadgeCheck' },
  ] },
  { id: 'marketplace', title: 'Visit our marketplace', icon: 'Store', subtasks: [
    { id: 'browse', title: 'Browse integrations', icon: 'Blocks' },
    { id: 'connect', title: 'Connect an integration', icon: 'Plug' },
  ] },
]

const TOTAL = ONBOARDING_STEPS.reduce((s, st) => s + st.subtasks.length, 0)

// singletons (module scope)
const open = ref(false)
const done = useLocalStorage<string[]>('onboarding-done', [])
const dismissed = useLocalStorage('onboarding-dismissed', false)

export function useOnboarding() {
  const doneSet = computed(() => new Set(done.value))
  const isDone = (id: string) => doneSet.value.has(id)
  function toggle(id: string) {
    done.value = doneSet.value.has(id) ? done.value.filter(x => x !== id) : [...done.value, id]
  }
  function markDone(id: string) { if (!doneSet.value.has(id)) done.value = [...done.value, id] }
  function stepDone(step: OnboardingStep) { return step.subtasks.filter(t => doneSet.value.has(t.id)).length }
  const completed = computed(() => done.value.filter(id => ONBOARDING_STEPS.some(s => s.subtasks.some(t => t.id === id))).length)
  const percent = computed(() => Math.round((completed.value / TOTAL) * 100))

  return { open, dismissed, done, total: TOTAL, isDone, toggle, markDone, stepDone, completed, percent }
}
