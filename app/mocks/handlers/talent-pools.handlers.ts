import { http, HttpResponse } from 'msw'
import type { DeleteTalentPoolInput, NewTalentPoolInput, TalentPool, TalentPoolFormField, TalentPoolMember, UpdateTalentPoolInput } from '~/types'

const CURRENT_USER = { id: 'u1', name: 'Mohamed Salem', initials: 'MS' }

const MEMBERS: TalentPoolMember[] = [
  { id: 'u1', name: 'Mohamed Salem', initials: 'MS' },
  { id: 'u2', name: 'Sara Rashed', initials: 'SR' },
  { id: 'u3', name: 'Ahmed Kamal', initials: 'AK' },
  { id: 'u4', name: 'Lina Waheed', initials: 'LW' },
  { id: 'u5', name: 'Omar Fathy', initials: 'OF' },
]
const memberById = (id: string) => MEMBERS.find(m => m.id === id)
const DEPARTMENTS = ['Finance', 'Engineering', 'Product', 'Human Resources', 'Operations', 'Marketing', 'Sales']

let codeSeq = 0
const genCode = () => (Date.now().toString(36).slice(-3) + (codeSeq++).toString(36) + Math.floor(Math.random() * 46656).toString(36)).slice(0, 5)
let seq = 100
const nextId = () => `TP-${++seq}`

// Default event/general form — Full Name + Email are always present + required.
function defaultFormFields(): TalentPoolFormField[] {
  return [
    // Candidate information
    { id: 'f-name', label: 'Full Name', type: 'text', required: true, locked: true, enabled: true, section: 'candidate' },
    { id: 'f-email', label: 'Email', type: 'email', required: true, locked: true, enabled: true, section: 'candidate' },
    { id: 'f-phone', label: 'Phone Number', type: 'phone', required: false, locked: false, enabled: true, section: 'candidate' },
    { id: 'f-job', label: 'Job Title', type: 'text', required: false, locked: false, enabled: true, section: 'candidate' },
    { id: 'f-cv', label: 'CV / Resume', type: 'file', required: true, locked: false, enabled: true, section: 'candidate' },
    // Screening questions
    { id: 'q-city', label: 'Which city do you live in?', type: 'text', required: false, locked: false, enabled: true, section: 'screening', visibility: 'everyone' },
    { id: 'q-strength', label: 'What are your top 3 strengths?', type: 'textarea', required: false, locked: false, enabled: true, section: 'screening', visibility: 'everyone' },
  ]
}

let pools: TalentPool[] = [
  {
    id: 'TP-GA', code: 'ga001', name: 'General Application', category: 'general', department: '', eventName: '',
    description: 'Candidates who applied without a specific job via the Career Site.',
    members: [memberById('u1')!], talentsCount: 34, pinned: true, following: true, system: true,
    hasForm: true, formPublished: true, formFields: [], status: 'active', createdAt: '2026-01-05T09:00:00.000Z', createdBy: 'System',
  },
  {
    id: 'TP-105', code: 'vbvla', name: 'Next recruitment - Q3 (Sample)', category: 'department', department: '', eventName: '',
    description: 'Candidates that are interested in joining us, but we couldn\'t place yet.',
    members: [memberById('u1')!], talentsCount: 2, pinned: false, following: false, system: false,
    hasForm: false, formPublished: false, formFields: [], status: 'active', createdAt: '2026-07-20T09:00:00.000Z', createdBy: 'Ahmed Kamal',
  },
  {
    id: 'TP-101', code: 'e4tng', name: 'Engineering (Sample)', category: 'department', department: 'Engineering', eventName: '',
    description: 'Strong engineering candidates for future roles.',
    members: [memberById('u1')!, memberById('u2')!], talentsCount: 1, pinned: false, following: true, system: false,
    hasForm: false, formPublished: false, formFields: [], status: 'active', createdAt: '2026-03-12T09:00:00.000Z', createdBy: 'Mohamed Salem',
  },
  {
    id: 'TP-102', code: 'c9far', name: 'Cairo Career Fair 2026', category: 'event', department: '', eventName: 'Cairo Career Fair 2026',
    description: 'Candidates collected at the Cairo job fair.',
    members: [memberById('u2')!, memberById('u4')!], talentsCount: 52, pinned: false, following: false, system: false,
    hasForm: true, formPublished: true, formFields: [], status: 'active', createdAt: '2026-05-02T09:00:00.000Z', createdBy: 'Sara Rashed',
  },
  {
    id: 'TP-103', code: 'ris22', name: 'Rising stars (Sample)', category: 'department', department: 'Product', eventName: '',
    description: 'High-potential candidates to nurture.',
    members: [memberById('u4')!], talentsCount: 2, pinned: false, following: false, system: false,
    hasForm: false, formPublished: false, formFields: [], status: 'active', createdAt: '2026-04-20T09:00:00.000Z', createdBy: 'Lina Waheed',
  },
  {
    id: 'TP-104', code: 'gtx25', name: 'GITEX 2025', category: 'event', department: '', eventName: 'GITEX 2025',
    description: 'Old event pool.', members: [memberById('u1')!], talentsCount: 40, pinned: false, following: false, system: false,
    hasForm: true, formPublished: true, formFields: [], status: 'archived', createdAt: '2025-10-10T09:00:00.000Z', createdBy: 'Mohamed Salem',
  },
]

// Event / General pools ship with the default form fields.
for (const p of pools) {
  if ((p.category === 'event' || p.category === 'general') && !p.formFields.length) p.formFields = defaultFormFields()
}

export const talentPoolsHandlers = [
  http.get('/api/talent-pools', ({ request }) => {
    const q = new URL(request.url).searchParams
    const scope = q.get('scope') ?? 'active'
    const search = (q.get('search') ?? '').trim().toLowerCase()
    const filter = q.get('filter') ?? 'all'

    let data = pools.filter(p => p.status === scope)
    if (search) data = data.filter(p => p.name.toLowerCase().includes(search) || p.department.toLowerCase().includes(search) || p.eventName.toLowerCase().includes(search))
    if (filter === 'followed') data = data.filter(p => p.following)
    data = [...data].sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (a.createdAt < b.createdAt ? 1 : -1))

    const active = pools.filter(p => p.status === 'active')
    return HttpResponse.json({
      data,
      counts: { all: active.length, followed: active.filter(p => p.following).length, archived: pools.filter(p => p.status === 'archived').length },
      currentUserId: CURRENT_USER.id,
    })
  }),

  http.get('/api/talent-pools/members', () => HttpResponse.json({ data: MEMBERS })),
  http.get('/api/talent-pools/departments', () => HttpResponse.json({ data: DEPARTMENTS })),

  http.get('/api/talent-pools/:id', ({ params }) => {
    const p = pools.find(x => x.id === params.id)
    return p ? HttpResponse.json(p) : new HttpResponse(null, { status: 404 })
  }),

  http.post('/api/talent-pools', async ({ request }) => {
    const b = await request.json() as NewTalentPoolInput
    const created: TalentPool = {
      id: nextId(), code: genCode(), name: b.name, category: b.category ?? 'department',
      department: b.department ?? '', eventName: b.eventName ?? '', description: b.description ?? '',
      members: (b.memberIds ?? []).map(id => memberById(id)).filter(Boolean) as TalentPoolMember[],
      talentsCount: 0, pinned: false, following: false, system: false,
      hasForm: b.category === 'event', formPublished: false, formFields: (b.category === 'event') ? defaultFormFields() : [],
      status: 'active', createdAt: new Date().toISOString(), createdBy: CURRENT_USER.name,
    }
    pools = [created, ...pools]
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch('/api/talent-pools/:id', async ({ params, request }) => {
    const b = await request.json() as UpdateTalentPoolInput
    const p = pools.find(x => x.id === params.id)
    if (!p) return new HttpResponse(null, { status: 404 })
    if (b.name !== undefined) p.name = b.name
    if (b.department !== undefined) p.department = b.department
    if (b.eventName !== undefined) p.eventName = b.eventName
    if (b.description !== undefined) p.description = b.description
    if (b.memberIds !== undefined) p.members = b.memberIds.map(id => memberById(id)).filter(Boolean) as TalentPoolMember[]
    return HttpResponse.json(p)
  }),

  // ── Event form builder ──
  http.patch('/api/talent-pools/:id/form', async ({ params, request }) => {
    const b = await request.json() as { formFields: TalentPoolFormField[] }
    const p = pools.find(x => x.id === params.id)
    if (!p) return new HttpResponse(null, { status: 404 })
    p.formFields = b.formFields
    p.hasForm = true
    return HttpResponse.json(p)
  }),
  http.post('/api/talent-pools/:id/form/publish', ({ params }) => {
    const p = pools.find(x => x.id === params.id)
    if (!p) return new HttpResponse(null, { status: 404 })
    if (!p.formFields.length) p.formFields = defaultFormFields()
    p.hasForm = true
    p.formPublished = true
    return HttpResponse.json(p)
  }),
  // Public form submission → routes the applicant into the pool.
  http.post('/api/talent-pools/:id/apply', ({ params }) => {
    const p = pools.find(x => x.id === params.id)
    if (!p) return new HttpResponse(null, { status: 404 })
    p.talentsCount += 1
    return HttpResponse.json({ ok: true, pool: p.name })
  }),

  http.post('/api/talent-pools/:id/follow', ({ params }) => {
    const p = pools.find(x => x.id === params.id)
    if (!p) return new HttpResponse(null, { status: 404 })
    p.following = !p.following
    return HttpResponse.json(p)
  }),

  http.post('/api/talent-pools/:id/archive', ({ params }) => {
    const p = pools.find(x => x.id === params.id)
    if (!p) return new HttpResponse(null, { status: 404 })
    p.status = 'archived'
    return HttpResponse.json(p)
  }),
  http.post('/api/talent-pools/:id/retrieve', ({ params }) => {
    const p = pools.find(x => x.id === params.id)
    if (!p) return new HttpResponse(null, { status: 404 })
    p.status = 'active'
    return HttpResponse.json(p)
  }),

  http.delete('/api/talent-pools/:id', async ({ params, request }) => {
    const body = await request.json().catch(() => ({ mode: 'all' })) as DeleteTalentPoolInput
    const p = pools.find(x => x.id === params.id)
    if (!p) return new HttpResponse(null, { status: 404 })
    if (body.mode === 'reassign' && body.destinationId) {
      const dest = pools.find(x => x.id === body.destinationId)
      if (dest) dest.talentsCount += p.talentsCount
    }
    pools = pools.filter(x => x.id !== params.id)
    return HttpResponse.json({ ok: true })
  }),
]
