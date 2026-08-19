import { http, HttpResponse } from 'msw'
import type { ManpowerGroup, ManpowerLine, ManpowerProject, ManpowerSummary, NewManpowerProjectInput } from '~/types'

const DEPARTMENTS = ['Engineering', 'Sales', 'Operations', 'Product', 'Support', 'Marketing', 'Finance', 'Human Resources']
const LOCATIONS = ['Cairo', 'Alexandria', 'Dubai', 'Riyadh', 'Remote']
const MEMBERS = [
  { name: 'Mohamed Salem', initials: 'MS' },
  { name: 'Sara Rashed', initials: 'SR' },
  { name: 'Ahmed Kamal', initials: 'AK' },
]

let seq = 200
const nextId = () => `MP-${++seq}`
let lineSeq = 0

// Build a plan line, spreading `budgeted` across the given months.
function mkLine(jobTitle: string, location: string, currentHC: number, budgeted: number, hired: number, months: string[]): ManpowerLine {
  const per = Math.floor(budgeted / months.length)
  const rem = budgeted - per * months.length
  const monthly = months.map((month, i) => {
    const b = per + (i < rem ? 1 : 0)
    const current = Math.min(b, Math.round((currentHC / Math.max(1, budgeted)) * b))
    return { month, budgeted: b, current, needToHire: Math.max(0, b - current) }
  })
  return { id: `L${++lineSeq}`, jobTitle, location, currentHC, budgeted, hired, needToHire: Math.max(0, budgeted - currentHC), monthly }
}

function rollup(groups: ManpowerGroup[]) {
  const lines = groups.flatMap(g => g.lines)
  const currentHeadcount = lines.reduce((s, l) => s + l.currentHC, 0)
  const budgeted = lines.reduce((s, l) => s + l.budgeted, 0)
  const hired = lines.reduce((s, l) => s + l.hired, 0)
  const needToHire = lines.reduce((s, l) => s + l.needToHire, 0)
  const targetAchieved = budgeted ? Math.round((currentHeadcount / budgeted) * 100) : 0
  return { currentHeadcount, budgeted, hired, needToHire, targetAchieved }
}

const projects: ManpowerProject[] = [
  (() => {
    const groups: ManpowerGroup[] = [
      { id: 'g1', department: 'Engineering', subDepartment: 'Platform', lines: [
        mkLine('Backend Engineer', 'Cairo', 8, 12, 2, ['Mar', 'Jun', 'Sep']),
        mkLine('Frontend Engineer', 'Cairo', 5, 8, 1, ['Apr', 'Jul']),
        mkLine('DevOps Engineer', 'Dubai', 2, 4, 0, ['May', 'Sep']),
      ] },
      { id: 'g2', department: 'Sales', subDepartment: 'Enterprise', lines: [
        mkLine('Account Executive', 'Dubai', 6, 10, 2, ['Feb', 'May', 'Aug']),
        mkLine('Sales Development Rep', 'Cairo', 4, 9, 1, ['Mar', 'Jun', 'Sep']),
      ] },
      { id: 'g3', department: 'Operations', subDepartment: 'Fulfilment', lines: [
        mkLine('Warehouse Operative', 'Cairo', 14, 20, 3, ['Jan', 'Apr', 'Jul', 'Oct']),
      ] },
    ]
    return { id: 'MP-101', name: '2026 Annual Manpower Plan', code: 'AMP26', kind: 'headcount' as const, assignedToName: 'Mohamed Salem', assignedToInitials: 'MS', createdAt: '2026-01-08T09:00:00.000Z', startDate: '2026-01-01', endDate: '2026-12-31', departments: ['Engineering', 'Sales', 'Operations'], locations: ['Cairo', 'Dubai'], visibility: 'Everyone', groups, ...rollup(groups) }
  })(),
  (() => {
    const groups: ManpowerGroup[] = [
      { id: 'g4', department: 'Product', subDepartment: 'Design', lines: [
        mkLine('Product Designer', 'Riyadh', 1, 3, 1, ['Jul', 'Sep']),
        mkLine('Product Manager', 'Dubai', 2, 3, 0, ['Aug']),
      ] },
      { id: 'g5', department: 'Support', subDepartment: 'CX', lines: [
        mkLine('Customer Support Lead', 'Dubai', 2, 2, 0, ['Jul']),
        mkLine('Support Agent', 'Riyadh', 3, 8, 2, ['Jul', 'Aug', 'Sep']),
      ] },
    ]
    return { id: 'MP-102', name: 'Q3 Expansion — Gulf', code: 'Q3GLF', kind: 'project' as const, assignedToName: 'Sara Rashed', assignedToInitials: 'SR', createdAt: '2026-06-02T09:00:00.000Z', startDate: '2026-07-01', endDate: '2026-09-30', departments: ['Product', 'Support'], locations: ['Riyadh', 'Dubai'], visibility: 'Selected members', groups, ...rollup(groups) }
  })(),
]

function summarize(list: ManpowerProject[]): ManpowerSummary {
  const companyBudget = list.reduce((s, p) => s + p.budgeted, 0)
  const currentEmployees = list.reduce((s, p) => s + p.currentHeadcount, 0)
  const hired = list.reduce((s, p) => s + p.hired, 0)
  const needToHire = list.reduce((s, p) => s + p.needToHire, 0)
  return { companyBudget, currentEmployees, budgeted: companyBudget, hired, needToHire, targetAchieved: companyBudget ? Math.round((currentEmployees / companyBudget) * 100) : 0, projectCount: list.length }
}

export const manpowerHandlers = [
  http.get('/api/manpower/projects', () => HttpResponse.json({ summary: summarize(projects), projects })),
  http.get('/api/manpower/meta', () => HttpResponse.json({ departments: DEPARTMENTS, locations: LOCATIONS, members: MEMBERS })),
  http.get('/api/manpower/projects/:id', ({ params }) => {
    const p = projects.find(x => x.id === params.id)
    return p ? HttpResponse.json(p) : new HttpResponse(null, { status: 404 })
  }),
  http.post('/api/manpower/projects', async ({ request }) => {
    const b = await request.json() as NewManpowerProjectInput
    const created: ManpowerProject = {
      id: nextId(), name: b.name, code: b.name.replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase() || 'PLAN',
      kind: b.kind, assignedToName: 'Mohamed Salem', assignedToInitials: 'MS', createdAt: new Date().toISOString(),
      startDate: b.startDate, endDate: b.endDate, departments: b.departments, locations: b.locations, visibility: b.visibility,
      groups: [], currentHeadcount: 0, budgeted: 0, hired: 0, needToHire: 0, targetAchieved: 0,
    }
    projects.unshift(created)
    return HttpResponse.json(created, { status: 201 })
  }),
  http.delete('/api/manpower/projects/:id', ({ params }) => {
    const i = projects.findIndex(x => x.id === params.id)
    if (i >= 0) projects.splice(i, 1)
    return HttpResponse.json({ ok: true })
  }),
]
