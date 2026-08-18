// Shared career-site configuration — the single source of truth for both the
// Settings → Career Site builder (writes) and the public career pages (read).
// Module-level reactive state means edits in Settings reflect live on the
// Home / Opportunities / Job pages. Colors here are the customer's own theme
// (intentionally independent of Recruitera's brand tokens).
import { toRefs } from 'vue'
import {
  Target, Gem, MessageSquare, Palette, Globe, IdCard, Youtube, Quote,
  Rocket, Heart, Shield, Zap, Users, Award, Star, ThumbsUp, Lightbulb,
  Handshake, TrendingUp, Sparkles, Compass, Flag, Trophy, Leaf, Scale,
  Eye, Smile, Anchor, Feather, Puzzle, Gauge, Hexagon,
} from 'lucide-vue-next'
import type { Component } from 'vue'

/** Icon palette for the Values section — index stored on each value. */
export const CAREER_VALUE_ICONS: Component[] = [
  Target, Gem, MessageSquare, Palette, Globe, IdCard, Youtube, Quote,
  Rocket, Heart, Shield, Zap, Users, Award, Star, ThumbsUp, Lightbulb,
  Handshake, TrendingUp, Sparkles, Compass, Flag, Trophy, Leaf, Scale,
  Eye, Smile, Anchor, Feather, Puzzle, Gauge, Hexagon,
]

export interface CareerValue { icon: number; name: string; desc: string }
export interface CareerTestimonial { name: string; role: string; quote: string; photo?: string }

interface CareerState {
  // Toggles
  generalApplicationOn: boolean
  forEmployeesOn: boolean
  published: boolean
  // Header layout
  headerSticky: boolean
  headerFullWidth: boolean
  // Hero
  showHero: boolean
  // Branding
  primaryColor: string
  headerColor: string
  btnColor: string
  ctaColor: string
  font: string
  logoUrl: string
  coverType: 'image' | 'video'
  coverUrl: string
  coverVideoUrl: string
  // Hero
  headline: string
  intro: string
  // Culture video
  videoUrl: string
  // Values / testimonials
  values: CareerValue[]
  testimonials: CareerTestimonial[]
  // For employees
  employeeDomain: string
  // Publish
  subdomain: string
}

// Single module-level instance — shared across every importer.
const state = reactive<CareerState>({
  generalApplicationOn: false,
  forEmployeesOn: true,
  published: true,
  headerSticky: true,
  headerFullWidth: false,
  showHero: true,
  primaryColor: '#4d7c0f',
  headerColor: '#0f172a',
  btnColor: '#4d7c0f',
  ctaColor: '#4d7c0f',
  font: 'Geist',
  logoUrl: '',
  coverType: 'image',
  coverUrl: '',
  coverVideoUrl: '',
  headline: 'Build the future of hiring with us',
  intro: 'We help teams hire better and faster. Join a team that values craft, ownership, and candor — and do the best work of your career.',
  videoUrl: '',
  values: [
    { icon: 0, name: 'Ownership', desc: 'We take end-to-end ownership of outcomes, not tasks.' },
    { icon: 1, name: 'Craft', desc: 'We sweat the details and ship work we are proud of.' },
    { icon: 2, name: 'Candor', desc: 'We speak honestly and assume good intent from each other.' },
  ],
  testimonials: [
    { name: 'Mariam Adel', role: 'Senior Engineer', quote: 'The best team I have worked with — real autonomy and real impact from day one.' },
    { name: 'Omar Khaled', role: 'Product Designer', quote: 'Culture of craft is not a slogan here. It shows up in every review and ship.' },
  ],
  employeeDomain: 'acme.co',
  subdomain: 'acme',
})

// Persist the config to localStorage so edits in Settings → Career Site reflect
// on the public /careers page (across reloads and tabs on the same browser).
const STORAGE_KEY = 'cc-career-site'
let _hydrated = false

// Apply a saved snapshot onto the reactive state. Arrays (values/testimonials)
// are replaced IN PLACE via splice — reassigning them through Object.assign does
// not reliably trigger reactivity for cross-tab updates, so live edits to
// testimonials/values wouldn't reach the public page without this.
// Bumped on every external (cross-tab) apply. Scalar reactivity is reliable, so
// array-driven sections (values / testimonials) key off this to re-render even
// when a deep array mutation doesn't propagate on its own.
const syncRev = ref(0)
function applyState(src: Record<string, unknown>) {
  for (const key of Object.keys(src)) {
    if (!(key in state)) continue
    const next = src[key]
    const cur = (state as Record<string, unknown>)[key]
    if (Array.isArray(cur) && Array.isArray(next)) cur.splice(0, cur.length, ...next)
    else (state as Record<string, unknown>)[key] = next
  }
  syncRev.value++
}

function hydrateCareerSite() {
  if (_hydrated || !import.meta.client) return
  _hydrated = true
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      applyState(parsed)
      // Back-compat: older saves predate `coverType`. Infer it from content so
      // an existing cover video keeps using the full-bleed video hero.
      if (!parsed.coverType) state.coverType = parsed.coverVideoUrl ? 'video' : 'image'
    }
  }
  catch { /* ignore corrupt storage */ }
  // Debounced write — the state can hold large base64 data-URLs (logo/cover),
  // so stringifying + writing on every keystroke would freeze the UI.
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  watch(state, () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }
      catch { /* ignore quota */ }
    }, 400)
  }, { deep: true })
  // Live-update other tabs (e.g. the /careers page while editing in Settings).
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try { applyState(JSON.parse(e.newValue)) }
      catch { /* ignore */ }
    }
  })
}

/** CSS custom properties to theme a public career page with the company colors. */
const themeVars = computed(() => ({
  '--cc-primary': state.primaryColor,
  '--cc-header': state.headerColor,
  '--cc-btn': state.btnColor,
  '--cc-cta': state.ctaColor,
  '--cc-font': state.font,
}))

export function valueIcon(index: number): Component {
  return CAREER_VALUE_ICONS[index] ?? CAREER_VALUE_ICONS[0]!
}

export function useCareerSite() {
  hydrateCareerSite()
  return {
    ...toRefs(state),
    state,
    themeVars,
    syncRev,
    VALUE_ICONS: CAREER_VALUE_ICONS,
    valueIcon,
  }
}
