import { http, HttpResponse } from 'msw'
import type {
  DashboardRecent, DashboardNewCandidate, DashboardAppliedStats, DashboardEvaluation,
  DashboardTask, DashboardNoteGroup, DashboardActivityGroup, DashboardEvent, DashboardTag, DashboardSource,
} from '~/types'

// All colors are brand tokens (var(--brand-*)) — never hardcoded hex.

const recents: DashboardRecent[] = [
  { id: 'r1', kind: 'job', title: 'Senior Marketer (Sample)', sub: '8 candidates' },
  { id: 'r2', kind: 'job', title: 'Next recruitment - Q3 (Sample)', sub: '0 candidates' },
  { id: 'r3', kind: 'candidate', title: 'Kendall McClure (Sample)', sub: 'in 0 jobs', initial: 'KM', bg: 'var(--brand-avatar-1)' },
  { id: 'r4', kind: 'candidate', title: 'John Doe (Sample)', sub: 'Recruiter (Sample)', initial: 'JD', bg: 'var(--brand-avatar-2)' },
  { id: 'r5', kind: 'candidate', title: 'Mikel Lang (Sample)', sub: 'Recruiter (Sample)', initial: 'ML', bg: 'var(--brand-avatar-3)' },
  { id: 'r6', kind: 'job', title: 'Recruiter (Sample)', sub: '6 candidates' },
]

const newCandidates: DashboardNewCandidate[] = [
  { id: 'nc1', name: 'John Doe (Sample)', initial: 'JD', bg: 'var(--brand-avatar-2)', when: '2 months ago' },
  { id: 'nc2', name: 'Mariela Vasquez (Sample)', initial: 'MV', bg: 'var(--brand-avatar-3)', when: 'a month ago' },
  { id: 'nc3', name: 'Kendall McClure (Sample)', initial: 'KM', bg: 'var(--brand-avatar-1)', when: 'a month ago' },
]

const appliedStats: DashboardAppliedStats = {
  cards: [
    { key: 'careers', label: 'Applied via careers site', value: 2 },
    { key: 'email', label: 'Applied via email', value: 3 },
    { key: 'manual', label: 'Added manually', value: 2 },
    { key: 'sourced', label: 'Sourced', value: 4 },
    { key: 'referred', label: 'Referred', value: 1 },
  ],
  series: [3, 0, 0, 0, 1, 1, 1, 0, 1, 1, 2, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
}

const evaluations: DashboardEvaluation[] = [
  {
    id: 'e1', status: 'completed',
    candidate: { name: 'John Doe (Sample)', initial: 'JD', bg: 'var(--brand-avatar-2)' },
    job: 'Senior Marketer (Sample)', verdict: 'Strong yes', stage: 'Phone interview',
    evaluator: { name: 'Sara Rashed', initials: 'SR', bg: 'var(--brand-avatar-3)' },
    template: 'Marketing evaluation template', when: '2 hours ago', summary: 'Great communication and clear campaign thinking.',
    answers: [
      { q: 'How do you approach a new demand-generation campaign?', a: 'Start from the funnel and the ICP, then pick channels by CAC.' },
      { q: 'Describe a campaign you are proud of and the result.', a: 'Doubled MQLs in a quarter with a content + paid mix.' },
      { q: 'How do you work with sales on lead quality?', a: 'Shared definitions and a weekly feedback loop.' },
    ],
  },
]

const tasks: DashboardTask[] = [
  { id: 't1', text: 'Review John Doe’s assessment for Senior Marketer', done: false, ago: 'due today' },
  { id: 't2', text: 'Send interview invite to Mariela Vasquez', done: false, ago: 'due tomorrow' },
  { id: 't3', text: 'Follow up with Kendall McClure', done: true, ago: 'yesterday' },
]

const noteGroups: DashboardNoteGroup[] = [
  {
    date: '18 Aug 2026', about: 'John Doe (Sample)',
    notes: [{ author: 'Sara Rashed', initials: 'SR', bg: 'var(--brand-avatar-3)', mention: '@Mohamed Salem', body: 'Strong portfolio — worth a fast-track to the on-site.', ago: '1d' }],
  },
]

const activityGroups: DashboardActivityGroup[] = [
  {
    date: '18 Aug 2026',
    events: [
      { text: 'added a new job ', bold: 'Sara Rashed', tail: 'Senior Marketer (Sample).', icon: 'job', ago: '1d' },
      { text: 'added follower(s) to the job ', bold: 'Mohamed Salem', tail: 'Recruiter (Sample): Sara Rashed.', icon: 'bookmark', ago: '1d' },
      { text: 'enabled the Screening Assistant.', bold: 'Mohamed Salem', icon: 'screen', ago: '2d' },
    ],
  },
  {
    date: '16 Aug 2026',
    events: [
      { text: 'added a new job ', bold: 'Lina Waheed', tail: 'Marketer (Sample).', icon: 'job', ago: '3d' },
    ],
  },
]

const events: DashboardEvent[] = [
  { id: 'ev1', candidate: 'Wilma Roelendsen (Sample)', initials: 'WR', bg: 'var(--brand-avatar-2)', job: 'Recruiter (Sample)', jobDot: 'var(--brand-pipeline-blue)', title: 'Interview with recruitera', date: 'Wed, 19 Aug 2026', time: '18:26 - 18:56', scope: 'today', role: 'You’re the interviewer' },
  { id: 'ev2', candidate: 'John Doe (Sample)', initials: 'JD', bg: 'var(--brand-avatar-3)', job: 'Senior Marketer (Sample)', jobDot: 'var(--brand-success)', title: 'Phone screen', date: 'Fri, 21 Aug 2026', time: '11:00 - 11:30', scope: 'week', role: 'You’re the interviewer' },
]

const tags: DashboardTag[] = [
  { label: 'Sample', count: 14 }, { label: 'Senior', count: 5 }, { label: 'Junior', count: 4 }, { label: 'Mid-level', count: 4 }, { label: 'Hired', count: 0 },
]
const sources: DashboardSource[] = [
  { label: 'Indeed', count: 6 }, { label: 'Careers site', count: 2 }, { label: 'Resume sent', count: 2 }, { label: 'LinkedIn', count: 2 }, { label: 'Referral', count: 1 }, { label: 'Facebook', count: 1 }, { label: 'Matched', count: 0 },
]

export const dashboardHandlers = [
  http.get('/api/dashboard/recents', () => HttpResponse.json({ data: recents })),
  http.get('/api/dashboard/new-candidates', () => HttpResponse.json({ data: newCandidates })),
  http.get('/api/dashboard/applied-stats', () => HttpResponse.json(appliedStats)),
  http.get('/api/dashboard/evaluations', () => HttpResponse.json({ data: evaluations })),
  http.get('/api/dashboard/tasks', () => HttpResponse.json({ data: tasks })),
  http.get('/api/dashboard/notes', () => HttpResponse.json({ data: noteGroups })),
  http.get('/api/dashboard/activity', () => HttpResponse.json({ data: activityGroups })),
  http.get('/api/dashboard/events', () => HttpResponse.json({ data: events })),
  http.get('/api/dashboard/tags', () => HttpResponse.json({ data: tags })),
  http.get('/api/dashboard/sources', () => HttpResponse.json({ data: sources })),
]
