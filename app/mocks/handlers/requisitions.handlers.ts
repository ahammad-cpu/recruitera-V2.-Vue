import { http, HttpResponse } from 'msw'
import type {
  NewRequisitionInput, Requisition, RequisitionApprovalStep, RequisitionApprover,
  RequisitionJobOpening, RequisitionStatus, UpdateRequisitionInput,
} from '~/types'
import { MANPOWER_PROJECTS } from '~/types'

const CURRENT_USER = { id: 'u1', name: 'Mohamed Salem', initials: 'MS' }

interface Member { id: string, name: string, initials: string, role: string }
const MEMBERS: Member[] = [
  { id: 'u1', name: 'Mohamed Salem', initials: 'MS', role: 'Administrator' },
  { id: 'u2', name: 'Sara Rashed', initials: 'SR', role: 'Recruiter' },
  { id: 'u3', name: 'Ahmed Kamal', initials: 'AK', role: 'Hiring Manager' },
  { id: 'u4', name: 'Lina Waheed', initials: 'LW', role: 'Recruiter' },
  { id: 'u5', name: 'Omar Fathy', initials: 'OF', role: 'Finance' },
]
const memberById = (id: string) => MEMBERS.find(m => m.id === id) ?? MEMBERS[0]!

function apr(id: string, decision: RequisitionApprover['decision'] = 'pending', note?: string): RequisitionApprover {
  const m = memberById(id)
  return { userId: m.id, name: m.name, initials: m.initials, decision, note, decidedAt: decision === 'pending' ? undefined : '2025-07-01T00:00:00.000Z' }
}
function step(order: number, ids: RequisitionApprover[]): RequisitionApprovalStep {
  return { id: `s${order}`, order, rule: 'all', approvers: ids }
}
function openings(n: number, reason = 'New position'): RequisitionJobOpening[] {
  return Array.from({ length: n }, (_, i) => ({ id: `o${i + 1}`, reason, explanation: '' }))
}

const stepSatisfied = (s: RequisitionApprovalStep) =>
  s.rule === 'any' ? s.approvers.some(a => a.decision === 'approved') : s.approvers.every(a => a.decision === 'approved')
const activeStep = (r: Requisition) => r.approvalSteps.find(s => !stepSatisfied(s))
function deriveStatus(r: Requisition): RequisitionStatus {
  if (['draft', 'archived', 'filled'].includes(r.status)) return r.status
  if (r.approvalSteps.some(s => s.approvers.some(a => a.decision === 'rejected'))) return 'rejected'
  if (r.approvalSteps.length && r.approvalSteps.every(stepSatisfied)) return 'approved'
  return 'pending'
}
const isPendingForMe = (r: Requisition) => {
  if (r.status !== 'pending') return false
  const s = activeStep(r)
  return !!s && s.approvers.some(a => a.userId === CURRENT_USER.id && a.decision === 'pending')
}

let codeSeq = 0
const genCode = () => (Date.now().toString(36).slice(-3) + (codeSeq++).toString(36) + Math.floor(Math.random() * 46656).toString(36)).slice(0, 5)
let idSeq = 100
const nextId = () => `REQ-${++idSeq}`

interface SeedInput {
  code: string, title: string, status: RequisitionStatus
  project?: string, department?: string, joiningMonth?: string
  workplace?: Requisition['workplace'], employmentType?: Requisition['employmentType'], experience?: Requisition['experience']
  currency?: string, from?: number | null, to?: number | null
  locations?: string[], openings?: RequisitionJobOpening[], hires?: number
  requesterId: string, steps?: RequisitionApprovalStep[], following?: boolean, date: string
}
function mk(s: SeedInput): Requisition {
  const req = memberById(s.requesterId)
  const jobOpenings = s.openings ?? []
  return {
    id: nextId(), code: s.code, title: s.title, status: s.status,
    manpowerProject: s.project ?? '', department: s.department ?? '',
    joiningMonth: s.joiningMonth ?? '', workplace: s.workplace ?? '', employmentType: s.employmentType ?? '', experience: s.experience ?? '',
    salaryCurrency: s.currency ?? '', salaryFrom: s.from ?? null, salaryTo: s.to ?? null,
    customQuestions: [], jobOpenings, openingsTotal: jobOpenings.length, hiresCount: s.hires ?? 0,
    locations: s.locations ?? [],
    approvalSteps: s.steps ?? [],
    requesterId: req.id, requesterName: req.name, requesterInitials: req.initials,
    following: s.following ?? false, linkedJobIds: [],
    team: [{ id: req.id, name: req.name, initials: req.initials, role: 'Requester' }],
    notes: [], activity: [{ id: 'a1', at: s.date, actor: req.name, text: 'created this requisition' }],
    createdAt: s.date, updatedAt: s.date,
  }
}

let requisitions: Requisition[] = [
  mk({ code: '2ftst', title: 'Support jobs requisition', status: 'draft', project: 'Project test', requesterId: 'u1', following: true, date: '2026-08-19T09:00:00.000Z' }),
  mk({ code: 'k91zq', title: 'Accounts Payable Specialist', status: 'draft', project: '2025 Headcount Plan', department: 'Finance', joiningMonth: 'September', workplace: 'on-site', employmentType: 'full-time', experience: 'experienced', currency: 'EGP', from: 15000, to: 25000, locations: ['Cairo'], openings: openings(1), requesterId: 'u1', steps: [step(1, [apr('u3')]), step(2, [apr('u5')])], date: '2025-07-14T09:00:00.000Z' }),
  mk({ code: 'cpeku', title: 'Finance queue', status: 'pending', project: 'Q3 Backfills', department: 'Finance', joiningMonth: 'October', workplace: 'on-site', employmentType: 'full-time', experience: 'mid', currency: 'EGP', from: 12000, to: 18000, locations: ['Cairo'], openings: openings(15), requesterId: 'u2', steps: [step(1, [apr('u1')]), step(2, [apr('u5')])], following: true, date: '2023-10-12T10:30:00.000Z' }),
  mk({ code: '2bfgp', title: 'Analytics jobs requisition', status: 'pending', project: 'New Market — GCC', department: 'Product', joiningMonth: 'September', workplace: 'remote', employmentType: 'full-time', experience: 'senior', currency: 'USD', from: 4000, to: 6000, locations: ['Aruba'], openings: openings(6), requesterId: 'u3', steps: [step(1, [apr('u1')])], following: true, date: '2024-09-16T14:00:00.000Z' }),
  mk({ code: '9wq2a', title: 'Talent Acquisition Partner', status: 'pending', project: '2025 Headcount Plan', department: 'Human Resources', joiningMonth: 'August', workplace: 'on-site', employmentType: 'full-time', experience: 'experienced', currency: 'EGP', from: 18000, to: 28000, locations: ['Cairo'], openings: openings(1), requesterId: 'u1', steps: [step(1, [apr('u4', 'approved')]), step(2, [apr('u3')])], date: '2025-07-06T08:15:00.000Z' }),
  mk({ code: 'm4d1c', title: 'Senior Backend Engineer', status: 'approved', project: 'Q3 Backfills', department: 'Engineering', joiningMonth: 'September', workplace: 'hybrid', employmentType: 'full-time', experience: 'senior', currency: 'USD', from: 5000, to: 8000, locations: ['Cairo', 'Remote'], openings: openings(2), hires: 1, requesterId: 'u2', steps: [step(1, [apr('u1', 'approved')]), step(2, [apr('u3', 'approved')])], following: true, date: '2025-06-30T12:00:00.000Z' }),
  mk({ code: 'p7k3n', title: 'Product Designer', status: 'approved', project: 'New Market — GCC', department: 'Product', joiningMonth: 'October', workplace: 'remote', employmentType: 'full-time', experience: 'mid', currency: 'USD', from: 3500, to: 5000, locations: ['Remote'], openings: openings(1), requesterId: 'u3', steps: [step(1, [apr('u1', 'approved')])], date: '2025-06-22T09:00:00.000Z' }),
  mk({ code: 'z0x8b', title: 'Warehouse Operatives', status: 'approved', project: '2025 Headcount Plan', department: 'Operations', joiningMonth: 'August', workplace: 'on-site', employmentType: 'contract', experience: 'entry', currency: 'EGP', from: 6000, to: 9000, locations: ['Cairo'], openings: openings(4), hires: 2, requesterId: 'u4', steps: [step(1, [apr('u1', 'approved')]), step(2, [apr('u3', 'approved')])], date: '2025-06-18T12:00:00.000Z' }),
  mk({ code: 'q5r2t', title: 'Sales Development Reps', status: 'approved', project: 'New Market — GCC', department: 'Sales', joiningMonth: 'September', workplace: 'hybrid', employmentType: 'full-time', experience: 'junior', currency: 'AED', from: 8000, to: 12000, locations: ['Dubai'], openings: openings(3), hires: 1, requesterId: 'u1', steps: [step(1, [apr('u5', 'approved')])], date: '2025-06-10T09:00:00.000Z' }),
  mk({ code: 'h1n9v', title: 'Sample req', status: 'filled', project: 'Q3 Backfills', department: 'Product', joiningMonth: 'March', workplace: 'remote', employmentType: 'full-time', experience: 'senior', currency: 'USD', from: 4000, to: 6000, locations: ['Aruba'], openings: openings(1), hires: 1, requesterId: 'u3', steps: [step(1, [apr('u1', 'approved')])], date: '2023-03-23T09:00:00.000Z' }),
  mk({ code: 'b3m7k', title: 'Customer Success Lead', status: 'filled', project: '2025 Headcount Plan', department: 'Operations', joiningMonth: 'May', workplace: 'on-site', employmentType: 'full-time', experience: 'lead', currency: 'EGP', from: 30000, to: 45000, locations: ['Cairo'], openings: openings(1), hires: 1, requesterId: 'u1', steps: [step(1, [apr('u3', 'approved')])], date: '2025-05-02T09:00:00.000Z' }),
  mk({ code: 'r8t4w', title: 'Marketing Manager', status: 'rejected', project: 'New Market — GCC', department: 'Marketing', joiningMonth: 'June', workplace: 'hybrid', employmentType: 'full-time', experience: 'senior', currency: 'AED', from: 20000, to: 30000, locations: ['Dubai'], openings: openings(1), requesterId: 'u2', steps: [step(1, [apr('u1', 'rejected', 'Budget deferred to next quarter.')])], date: '2025-06-24T16:45:00.000Z' }),
  mk({ code: 'a1c2e', title: 'Seasonal Retail Staff 2024', status: 'archived', project: '2025 Headcount Plan', department: 'Operations', locations: ['Cairo'], openings: openings(20), hires: 20, requesterId: 'u4', date: '2024-11-01T09:00:00.000Z' }),
  mk({ code: 'a3f5h', title: 'Old QA requisition', status: 'archived', project: 'Q3 Backfills', department: 'Engineering', locations: ['Remote'], openings: openings(2), requesterId: 'u2', date: '2024-08-01T09:00:00.000Z' }),
]

const GROUP_ORDER: RequisitionStatus[] = ['draft', 'pending', 'approved', 'filled', 'rejected']

export const requisitionsHandlers = [
  http.get('/api/requisitions', ({ request }) => {
    const q = new URL(request.url).searchParams
    const scope = q.get('scope') ?? 'active'
    const filter = q.get('filter') ?? 'all'
    const search = (q.get('search') ?? '').trim().toLowerCase()

    const inScope = requisitions.filter(r => scope === 'archived' ? r.status === 'archived' : r.status !== 'archived')
    const searched = inScope.filter((r) => {
      if (!search) return true
      return r.title.toLowerCase().includes(search) || r.code.toLowerCase().includes(search)
        || r.department.toLowerCase().includes(search) || r.manpowerProject.toLowerCase().includes(search)
        || r.locations.some(l => l.toLowerCase().includes(search))
    })

    const active = requisitions.filter(r => r.status !== 'archived')
    const counts = {
      all: active.length,
      approval: active.filter(isPendingForMe).length,
      mine: active.filter(r => r.requesterId === CURRENT_USER.id).length,
    }

    let rows = searched
    if (filter === 'mine') rows = searched.filter(r => r.requesterId === CURRENT_USER.id)
    else if (filter === 'approval') rows = searched.filter(isPendingForMe)

    const order = scope === 'archived' ? (['archived'] as RequisitionStatus[]) : GROUP_ORDER
    const groups = order
      .map(status => ({ status, items: rows.filter(r => r.status === status).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)) }))
      .map(g => ({ ...g, count: g.items.length }))
      .filter(g => g.items.length > 0)

    return HttpResponse.json({ groups, total: rows.length, counts, archivedCount: requisitions.filter(r => r.status === 'archived').length, currentUserId: CURRENT_USER.id })
  }),

  http.get('/api/requisitions/me', () => HttpResponse.json(CURRENT_USER)),
  http.get('/api/requisitions/members', () => HttpResponse.json({ data: MEMBERS })),
  http.get('/api/requisitions/projects', () => HttpResponse.json({ data: MANPOWER_PROJECTS })),

  http.get('/api/requisitions/:id', ({ params }) => {
    const r = requisitions.find(x => x.id === params.id)
    return r ? HttpResponse.json(r) : new HttpResponse(null, { status: 404 })
  }),

  http.post('/api/requisitions', async ({ request }) => {
    const body = await request.json() as NewRequisitionInput
    const now = new Date().toISOString()
    const created = mk({ code: genCode(), title: body.title || 'Untitled requisition', status: 'draft', project: body.manpowerProject, department: body.department, requesterId: CURRENT_USER.id, date: now })
    requisitions = [created, ...requisitions]
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch('/api/requisitions/:id', async ({ params, request }) => {
    const b = await request.json() as UpdateRequisitionInput
    const r = requisitions.find(x => x.id === params.id)
    if (!r) return new HttpResponse(null, { status: 404 })
    const assign = <K extends keyof UpdateRequisitionInput>(k: K) => { if (b[k] !== undefined) (r as any)[k] = b[k] }
    ;(['title', 'department', 'manpowerProject', 'joiningMonth', 'workplace', 'employmentType', 'experience', 'salaryCurrency', 'salaryFrom', 'salaryTo', 'customQuestions', 'locations', 'approvalSteps'] as (keyof UpdateRequisitionInput)[]).forEach(assign)
    if (b.jobOpenings !== undefined) { r.jobOpenings = b.jobOpenings; r.openingsTotal = b.jobOpenings.length }
    r.updatedAt = new Date().toISOString()
    return HttpResponse.json(r)
  }),

  http.post('/api/requisitions/:id/submit', ({ params }) => {
    const r = requisitions.find(x => x.id === params.id)
    if (!r) return new HttpResponse(null, { status: 404 })
    const missing: string[] = []
    if (!r.department) missing.push('department')
    if (!r.locations.length) missing.push('a location')
    if (!r.openingsTotal) missing.push('a job opening')
    if (!r.approvalSteps.some(s => s.approvers.length)) missing.push('approvers')
    if (missing.length) return HttpResponse.json({ error: `Add ${missing.join(', ')} before requesting approval.` }, { status: 422 })
    r.status = 'pending'
    r.updatedAt = new Date().toISOString()
    r.activity.unshift({ id: `a${Date.now()}`, at: r.updatedAt, actor: CURRENT_USER.name, text: 'requested approval' })
    return HttpResponse.json(r)
  }),

  http.post('/api/requisitions/:id/approve', async ({ params, request }) => {
    const r = requisitions.find(x => x.id === params.id)
    if (!r) return new HttpResponse(null, { status: 404 })
    const body = await request.json().catch(() => ({})) as { note?: string }
    const s = activeStep(r)
    const mine = s?.approvers.find(a => a.userId === CURRENT_USER.id)
    if (mine) { mine.decision = 'approved'; mine.decidedAt = new Date().toISOString(); mine.note = body.note }
    r.status = deriveStatus(r)
    r.updatedAt = new Date().toISOString()
    r.activity.unshift({ id: `a${Date.now()}`, at: r.updatedAt, actor: CURRENT_USER.name, text: 'approved this requisition' })
    return HttpResponse.json(r)
  }),

  http.post('/api/requisitions/:id/reject', async ({ params, request }) => {
    const r = requisitions.find(x => x.id === params.id)
    if (!r) return new HttpResponse(null, { status: 404 })
    const body = await request.json().catch(() => ({})) as { note?: string }
    const s = activeStep(r)
    const mine = s?.approvers.find(a => a.userId === CURRENT_USER.id)
    if (mine) { mine.decision = 'rejected'; mine.decidedAt = new Date().toISOString(); mine.note = body.note }
    r.status = deriveStatus(r)
    r.updatedAt = new Date().toISOString()
    r.activity.unshift({ id: `a${Date.now()}`, at: r.updatedAt, actor: CURRENT_USER.name, text: 'rejected this requisition' })
    return HttpResponse.json(r)
  }),

  http.post('/api/requisitions/:id/follow', ({ params }) => {
    const r = requisitions.find(x => x.id === params.id)
    if (!r) return new HttpResponse(null, { status: 404 })
    r.following = !r.following
    return HttpResponse.json(r)
  }),

  http.post('/api/requisitions/:id/archive', ({ params }) => {
    const r = requisitions.find(x => x.id === params.id)
    if (!r) return new HttpResponse(null, { status: 404 })
    r.status = 'archived'
    r.updatedAt = new Date().toISOString()
    return HttpResponse.json(r)
  }),

  http.post('/api/requisitions/:id/duplicate', ({ params }) => {
    const r = requisitions.find(x => x.id === params.id)
    if (!r) return new HttpResponse(null, { status: 404 })
    const copy: Requisition = { ...structuredClone(r), id: nextId(), code: genCode(), title: `${r.title} (copy)`, status: 'draft', hiresCount: 0, following: false }
    copy.approvalSteps.forEach(s => s.approvers.forEach(a => { a.decision = 'pending'; a.decidedAt = undefined; a.note = undefined }))
    requisitions = [copy, ...requisitions]
    return HttpResponse.json(copy, { status: 201 })
  }),

  http.delete('/api/requisitions/:id', ({ params }) => {
    requisitions = requisitions.filter(x => x.id !== params.id)
    return HttpResponse.json({ ok: true })
  }),
]
