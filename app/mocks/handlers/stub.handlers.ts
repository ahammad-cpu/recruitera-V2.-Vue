import { http, HttpResponse } from 'msw'

const stubRoutes = [
  '/api/jobs', '/api/interviews', '/api/offers',
  '/api/evaluations', '/api/questionnaires',
  '/api/approvals', '/api/requisitions', '/api/workforce',
  '/api/referrals', '/api/distribution', '/api/analytics',
  '/api/whatsapp', '/api/conflicts', '/api/career-site',
  '/api/self-schedule', '/api/dashboard', '/api/users',
]

export const stubHandlers = stubRoutes.map(route =>
  http.get(route, () => HttpResponse.json({ data: [], total: 0 })),
)
