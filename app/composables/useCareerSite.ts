// Career Site Builder configuration — module-scope singleton so Settings
// (the builder) and the public /careers/* pages read and write the exact
// same state within a session (mirrors useJobs.ts / useJobReferrals.ts).
//
// Fixture today; swap the mutating functions for useMutation calls that
// PATCH /api/career-site and invalidate ['career-site'] when the API lands.
import {
  Anchor, Award, Compass, Eye, Feather, Flag, Gauge, Gem, Globe, Handshake,
  Heart, Hexagon, IdCard, Leaf, Lightbulb, MessageSquare, Palette, Puzzle,
  Quote, Rocket, Scale, Shield, Smile, Sparkles, Star, Target, ThumbsUp,
  Trophy, TrendingUp, Users, Youtube, Zap,
} from 'lucide-vue-next'

// Index into this array is what CareerSiteValue.icon stores — shared so the
// Settings icon picker and the public site always agree on which icon a
// given index means.
export const CAREER_SITE_VALUE_ICONS = [
  Target, Gem, MessageSquare, Palette, Globe, IdCard, Youtube, Quote,
  Rocket, Heart, Shield, Zap, Users, Award, Star, ThumbsUp, Lightbulb,
  Handshake, TrendingUp, Sparkles, Compass, Flag, Trophy, Leaf, Scale,
  Eye, Smile, Anchor, Feather, Puzzle, Gauge, Hexagon,
]

export interface CareerSiteValue { icon: number, name: string, desc: string }
export interface CareerSiteTestimonial { name: string, role: string, quote: string, photo?: string }

export interface CareerSiteState {
  coverUrl: string
  generalApplicationOn: boolean
  forEmployeesOn: boolean
  published: boolean
  primaryColor: string
  headerColor: string
  btnColor: string
  ctaColor: string
  font: string
  headline: string
  intro: string
  videoUrl: string
  values: CareerSiteValue[]
  testimonials: CareerSiteTestimonial[]
  subdomain: string
}

// Hex defaults below are the customer's own career-site theme picker values,
// intentionally independent of Recruitera's brand tokens (local/no-hex-colors
// only lints .vue files, so these are fine as plain data here).
const state = reactive<CareerSiteState>({
  coverUrl: '',
  generalApplicationOn: false,
  forEmployeesOn: true,
  published: true,
  primaryColor: '#4d7c0f',
  headerColor: '#0f172a',
  btnColor: '#4d7c0f',
  ctaColor: '#4d7c0f',
  font: 'Geist',
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
  subdomain: 'icareer',
})

// localStorage (not just an in-memory singleton) because "Visit site" opens
// the public /careers/* pages in a new tab — a separate JS runtime that
// shares nothing in memory with the Settings tab. Without this, "the live
// site reflects branding immediately" would only ever be true within a
// single tab, never across the new-tab flow the Settings page itself uses.
const STORAGE_KEY = 'recruitera:career_site_config'
if (import.meta.client) {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try { Object.assign(state, JSON.parse(raw)) }
    catch { /* corrupt/old shape — keep defaults */ }
  }
  watch(state, () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, { deep: true })
}

export function useCareerSite() {
  return state
}
