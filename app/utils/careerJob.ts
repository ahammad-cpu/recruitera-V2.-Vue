// Helpers that derive candidate-facing job content for the public career site.
// The Job model has no long-form copy, so overview/screening content is
// synthesized from the role. Swap for real job fields when the API provides them.
import type { Job } from '~/types'

/** True when a URL points at a directly-playable video file (not a YouTube page). */
export function ccIsVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(url) || url.startsWith('data:video/') || url.startsWith('blob:')
}

export function ccEmploymentType(job: Job): string {
  return job.collar === 'blue' ? 'Shift Based' : 'Full-time'
}
export function ccWorkLabel(w: Job['workModel']): string {
  return w === 'on-site' ? 'On-site' : w === 'remote' ? 'Remote' : 'Hybrid'
}
export function ccDaysAgo(createdAt: string): string {
  const t = Date.parse(createdAt)
  if (Number.isNaN(t)) return createdAt
  const days = Math.max(0, Math.round((Date.now() - t) / 86_400_000))
  return days === 0 ? 'Today' : `${days}d ago`
}
export function ccBlurb(job: Job): string {
  const dept = job.department || 'our team'
  return `We're looking for a ${job.title} to join ${dept} and help build what's next — owning real work from day one alongside a team that values craft and candor.`
}
export function ccOverview(job: Job) {
  const t = job.title.toLowerCase()
  return {
    description: ccBlurb(job),
    responsibilities: [
      `Own ${t} work end to end`,
      'Collaborate closely with cross-functional partners',
      'Ship high-quality output on a steady cadence',
      'Raise the bar for craft and process',
    ],
    requirements: [
      'Relevant experience in a similar role',
      'Strong ownership and clear communication',
      'A track record of shipping real outcomes',
    ],
  }
}
export const CC_SCREENING = [
  'How many years of relevant experience do you have?',
  "What's your expected salary?",
  "What's your notice period?",
]
