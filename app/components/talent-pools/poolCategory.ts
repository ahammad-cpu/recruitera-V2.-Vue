import { Folder, Megaphone, Package } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { PoolCandidateStage, TalentPool, TalentPoolCategory } from '~/types'

/**
 * One colour + icon per pool category, shared by the row icon tile and the
 * category pill so the two never drift apart.
 */
export const POOL_CATEGORY: Record<TalentPoolCategory, {
  label: string
  icon: Component
  bg: string
  text: string
}> = {
  general: {
    label: 'General',
    icon: Package,
    bg: 'var(--brand-category-general-bg)',
    text: 'var(--brand-category-general-text)',
  },
  department: {
    label: 'Department',
    icon: Folder,
    bg: 'var(--brand-category-department-bg)',
    text: 'var(--brand-category-department-text)',
  },
  event: {
    label: 'Event',
    icon: Megaphone,
    bg: 'var(--brand-category-event-bg)',
    text: 'var(--brand-category-event-text)',
  },
}

/** Stage pill colours. `New` and `Interview` share the general/event category pairs. */
export const STAGE_TONE: Record<PoolCandidateStage, { bg: string; text: string }> = {
  'New': { bg: 'var(--brand-category-general-bg)', text: 'var(--brand-category-general-text)' },
  'Applied': { bg: 'var(--brand-stage-applied-bg)', text: 'var(--brand-stage-applied-text)' },
  'Screened': { bg: 'var(--brand-stage-screened-bg)', text: 'var(--brand-stage-screened-text)' },
  'Interview': { bg: 'var(--brand-category-event-bg)', text: 'var(--brand-category-event-text)' },
  'Reference check': { bg: 'var(--brand-stage-positive-bg)', text: 'var(--brand-stage-positive-text)' },
  'Offer': { bg: 'var(--brand-success-bg)', text: 'var(--brand-stage-positive-text)' },
}

/** Score pills band the 0–100 value; null renders as a neutral dash pill. */
export function scoreTone(v: number | null) {
  if (v === null) return { bg: 'var(--brand-badge-settings-bg)', text: 'var(--brand-text-quiet)' }
  if (v >= 75) return { bg: 'var(--brand-stage-positive-bg)', text: 'var(--brand-stage-positive-text)' }
  if (v >= 50) return { bg: 'var(--brand-warning-bg)', text: 'var(--brand-stage-applied-text)' }
  return { bg: 'var(--brand-settings-danger-hover-bg)', text: 'var(--brand-settings-danger)' }
}

/**
 * Department pools always show the job title; event pools only once their form is live.
 * The General Application pool uses a reduced column set instead.
 */
export function poolNeedsJobTitle(p: TalentPool): boolean {
  return p.category === 'department' || (p.category === 'event' && p.formStatus === 'live')
}

/** The line under the category pill: the department or event this pool belongs to. */
export function poolCategoryDetail(p: TalentPool): string {
  if (p.category === 'department') return p.department ?? ''
  if (p.category === 'event') return p.event ?? ''
  return 'General Application'
}
