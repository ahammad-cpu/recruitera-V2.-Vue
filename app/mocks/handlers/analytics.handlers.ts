import { http, HttpResponse } from 'msw'
import type { AnalyticsBoard, AnalyticsBoardKey, AnalyticsBoardSummary } from '~/types'

// All values are brand-token-styled on the client; numbers here are coherent
// sample data derived from the app's jobs / candidates / hires fixtures.

const BOARD_LIST: AnalyticsBoardSummary[] = [
  { key: 'jobs', label: 'Jobs', icon: 'Briefcase' },
  { key: 'candidates', label: 'Candidates', icon: 'Users' },
  { key: 'pipelines', label: 'Pipelines', icon: 'GitBranch' },
  { key: 'disqualifications', label: 'Disqualifications', icon: 'Ban' },
  { key: 'hires', label: 'Hires', icon: 'BadgeCheck' },
  { key: 'interviews', label: 'Interviews', icon: 'CalendarDays' },
  { key: 'evaluations', label: 'Evaluations', icon: 'ThumbsUp' },
  { key: 'careers-site', label: 'Careers site', icon: 'Globe' },
]

const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
const TZ = 'Africa/Cairo (GMT+03:00)'

const BOARDS: Record<AnalyticsBoardKey, AnalyticsBoard> = {
  jobs: {
    key: 'jobs', label: 'Jobs', timezone: TZ,
    metrics: [
      { id: 'published', title: 'Published', subtitle: 'Job published · Last 30 days', value: '5', unit: 'JOBS', delta: 25 },
      { id: 'filled', title: 'Filled', subtitle: 'Job filled · Last 30 days', value: '3', unit: 'JOBS', delta: 50 },
      { id: 'closed', title: 'Closed', subtitle: 'Job closed · Last 30 days', value: '1', unit: 'JOBS', delta: -50 },
      { id: 'fill-rate', title: 'Fill rate', subtitle: 'Job published · Last 90 days', value: '42%', unit: 'FILL RATE', delta: 8 },
      { id: 'time-to-fill', title: 'Time to fill', subtitle: 'Job filled · Last 90 days', value: '32 days', unit: 'AVG TIME', delta: -4 },
      { id: 'time-to-close', title: 'Time to close', subtitle: 'Job closed · Last 90 days', value: '48 days', unit: 'AVG TIME', delta: 6 },
    ],
    charts: [
      {
        id: 'activity', title: 'Job activity over time', subtitle: 'Job status change date · Last 90 days', type: 'area', span: 3,
        points: MONTHS.map((m, i) => ({ label: m, value: [2, 3, 1, 4, 3, 5][i]!, value2: [1, 1, 2, 2, 3, 3][i]! })), seriesLabels: ['Published', 'Filled'],
      },
      {
        id: 'open-time', title: 'Open time per job', subtitle: 'Job published · Last 365 days', type: 'hbars', span: 1, unit: ' days',
        points: [
          { label: 'Delivery Driver', value: 63 }, { label: 'Backend Engineer', value: 47 }, { label: 'Warehouse Operative', value: 41 },
          { label: 'Product Designer', value: 38 }, { label: 'Senior Frontend Engineer', value: 29 },
        ],
      },
      {
        id: 'fill-rate-job', title: 'Fill rate per job', subtitle: 'Job published · Last 365 days', type: 'hbars', span: 1, unit: '%',
        points: [
          { label: 'Delivery Driver', value: 75 }, { label: 'Backend Engineer', value: 50 }, { label: 'Product Designer', value: 50 },
          { label: 'Warehouse Operative', value: 33 }, { label: 'Data Analyst', value: 0 },
        ],
      },
      {
        id: 'published-dept', title: 'Published jobs by department', subtitle: 'Job created · Last 365 days', type: 'bars', span: 1,
        points: [{ label: 'Eng', value: 2 }, { label: 'Ops', value: 1 }, { label: 'Logi', value: 1 }, { label: 'Design', value: 1 }, { label: 'Support', value: 1 }],
      },
      {
        id: 'filled-dept', title: 'Filled jobs by department', subtitle: 'Job filled · Last 365 days', type: 'bars', span: 1,
        points: [{ label: 'Logi', value: 3 }, { label: 'Eng', value: 2 }, { label: 'Ops', value: 1 }, { label: 'Design', value: 1 }, { label: 'Support', value: 1 }],
      },
    ],
  },
  candidates: {
    key: 'candidates', label: 'Candidates', timezone: TZ,
    metrics: [
      { id: 'new', title: 'New candidates', subtitle: 'Applied · Last 30 days', value: '48', unit: 'CANDIDATES', delta: 18 },
      { id: 'qualified', title: 'Qualified', subtitle: 'Moved forward · Last 30 days', value: '17', unit: 'CANDIDATES', delta: 12 },
      { id: 'disqualified', title: 'Disqualified', subtitle: 'Rejected · Last 30 days', value: '9', unit: 'CANDIDATES', delta: -6 },
      { id: 'hired', title: 'Hired', subtitle: 'Hired · Last 30 days', value: '4', unit: 'CANDIDATES', delta: 33 },
    ],
    charts: [
      {
        id: 'applied-over-time', title: 'Candidates over time', subtitle: 'Applied · Last 90 days', type: 'area', span: 3,
        points: MONTHS.map((m, i) => ({ label: m, value: [12, 18, 9, 22, 15, 20][i]! })),
      },
      {
        id: 'by-source', title: 'Candidates by source', subtitle: 'Applied · Last 365 days', type: 'hbars', span: 2,
        points: [{ label: 'Indeed', value: 6 }, { label: 'Careers site', value: 2 }, { label: 'Resume sent', value: 2 }, { label: 'LinkedIn', value: 2 }, { label: 'Referral', value: 1 }, { label: 'Facebook', value: 1 }],
      },
      {
        id: 'by-status', title: 'Candidates by status', subtitle: 'Current · All time', type: 'bars', span: 1,
        points: [{ label: 'New', value: 4 }, { label: 'Not cont.', value: 12 }, { label: 'Qualified', value: 8 }, { label: 'Disq.', value: 1 }],
      },
    ],
  },
  pipelines: {
    key: 'pipelines', label: 'Pipelines', timezone: TZ,
    metrics: [
      { id: 'applied', title: 'Applied', subtitle: 'Entered pipeline · Last 90 days', value: '96', unit: 'CANDIDATES' },
      { id: 'interview', title: 'Interview', subtitle: 'Reached stage · Last 90 days', value: '28', unit: 'CANDIDATES' },
      { id: 'offer', title: 'Offer', subtitle: 'Reached stage · Last 90 days', value: '9', unit: 'CANDIDATES' },
      { id: 'conversion', title: 'Applied → Hire', subtitle: 'Conversion · Last 90 days', value: '6%', unit: 'CONVERSION', delta: 1 },
    ],
    charts: [
      {
        id: 'funnel', title: 'Pipeline funnel', subtitle: 'Reached stage · Last 90 days', type: 'hbars', span: 3,
        points: [{ label: 'Applied', value: 96 }, { label: 'Screening', value: 54 }, { label: 'Interview', value: 28 }, { label: 'Evaluation', value: 15 }, { label: 'Offer', value: 9 }, { label: 'Hired', value: 6 }],
      },
    ],
  },
  disqualifications: {
    key: 'disqualifications', label: 'Disqualifications', timezone: TZ,
    metrics: [
      { id: 'total', title: 'Disqualified', subtitle: 'Rejected · Last 90 days', value: '31', unit: 'CANDIDATES', delta: -8 },
      { id: 'auto', title: 'Auto-rejected', subtitle: 'Knockout · Last 90 days', value: '12', unit: 'CANDIDATES' },
      { id: 'rate', title: 'Disqualification rate', subtitle: 'Of applicants · Last 90 days', value: '22%', unit: 'RATE', delta: -3 },
    ],
    charts: [
      {
        id: 'by-reason', title: 'Disqualifications by reason', subtitle: 'Rejected · Last 365 days', type: 'hbars', span: 3,
        points: [{ label: 'Knockout question', value: 12 }, { label: 'Lack of experience', value: 8 }, { label: 'Location mismatch', value: 5 }, { label: 'Salary expectation', value: 4 }, { label: 'Withdrew', value: 2 }],
      },
    ],
  },
  hires: {
    key: 'hires', label: 'Hires', timezone: TZ,
    metrics: [
      { id: 'total', title: 'Total hires', subtitle: 'Hired · Last 90 days', value: '10', unit: 'HIRES', delta: 25 },
      { id: 'avg-time', title: 'Avg time to hire', subtitle: 'Applied → hired · Last 90 days', value: '29 days', unit: 'AVG TIME', delta: -3 },
      { id: 'offer-accept', title: 'Offer acceptance', subtitle: 'Accepted · Last 90 days', value: '82%', unit: 'RATE', delta: 5 },
    ],
    charts: [
      {
        id: 'over-time', title: 'Hires over time', subtitle: 'Candidate hired · Last 90 days', type: 'area', span: 3,
        points: MONTHS.map((m, i) => ({ label: m, value: [1, 2, 1, 2, 1, 3][i]! })),
      },
      {
        id: 'by-dept', title: 'Hires by department', subtitle: 'Hired · Last 365 days', type: 'hbars', span: 2,
        points: [{ label: 'Logistics', value: 3 }, { label: 'Engineering', value: 2 }, { label: 'Operations', value: 1 }, { label: 'Design', value: 1 }],
      },
      {
        id: 'by-source', title: 'Hires by source', subtitle: 'Hired · Last 365 days', type: 'bars', span: 1,
        points: [{ label: 'Indeed', value: 4 }, { label: 'Referral', value: 3 }, { label: 'LinkedIn', value: 2 }, { label: 'Careers', value: 1 }],
      },
    ],
  },
  interviews: {
    key: 'interviews', label: 'Interviews', timezone: TZ,
    metrics: [
      { id: 'scheduled', title: 'Scheduled', subtitle: 'Upcoming · Next 30 days', value: '14', unit: 'INTERVIEWS' },
      { id: 'completed', title: 'Completed', subtitle: 'Done · Last 30 days', value: '22', unit: 'INTERVIEWS', delta: 10 },
      { id: 'no-show', title: 'No-shows', subtitle: 'Missed · Last 30 days', value: '3', unit: 'INTERVIEWS', delta: -1 },
    ],
    charts: [
      {
        id: 'over-time', title: 'Interviews over time', subtitle: 'Scheduled · Last 90 days', type: 'area', span: 3,
        points: MONTHS.map((m, i) => ({ label: m, value: [6, 9, 5, 11, 8, 12][i]! })),
      },
    ],
  },
  evaluations: {
    key: 'evaluations', label: 'Evaluations', timezone: TZ,
    metrics: [
      { id: 'submitted', title: 'Submitted', subtitle: 'Completed · Last 30 days', value: '19', unit: 'EVALUATIONS', delta: 15 },
      { id: 'avg-score', title: 'Average score', subtitle: 'All templates · Last 90 days', value: '72%', unit: 'AVG SCORE', delta: 4 },
      { id: 'pending', title: 'Pending', subtitle: 'Awaiting · Now', value: '6', unit: 'EVALUATIONS' },
    ],
    charts: [
      {
        id: 'by-verdict', title: 'Evaluations by verdict', subtitle: 'Completed · Last 365 days', type: 'bars', span: 2,
        points: [{ label: 'Strong yes', value: 7 }, { label: 'Yes', value: 9 }, { label: 'Not sure', value: 5 }, { label: 'No', value: 3 }, { label: 'Strong no', value: 1 }],
      },
      {
        id: 'score-dist', title: 'Score distribution', subtitle: 'Completed · Last 365 days', type: 'bars', span: 1,
        points: [{ label: '0-40', value: 2 }, { label: '40-60', value: 5 }, { label: '60-80', value: 11 }, { label: '80-100', value: 7 }],
      },
    ],
  },
  'careers-site': {
    key: 'careers-site', label: 'Careers site', timezone: TZ,
    metrics: [
      { id: 'visits', title: 'Visits', subtitle: 'Unique · Last 30 days', value: '1,284', unit: 'VISITS', delta: 12 },
      { id: 'applications', title: 'Applications', subtitle: 'Submitted · Last 30 days', value: '48', unit: 'APPLICATIONS', delta: 18 },
      { id: 'conversion', title: 'Visit → apply', subtitle: 'Conversion · Last 30 days', value: '3.7%', unit: 'CONVERSION', delta: 1 },
    ],
    charts: [
      {
        id: 'visits-over-time', title: 'Visits over time', subtitle: 'Unique visits · Last 90 days', type: 'area', span: 3,
        points: MONTHS.map((m, i) => ({ label: m, value: [640, 820, 710, 980, 1120, 1284][i]! })),
      },
      {
        id: 'top-jobs', title: 'Most viewed jobs', subtitle: 'Views · Last 90 days', type: 'hbars', span: 2,
        points: [{ label: 'Backend Engineer', value: 412 }, { label: 'Product Designer', value: 388 }, { label: 'Delivery Driver', value: 271 }, { label: 'Senior Frontend Engineer', value: 205 }],
      },
      {
        id: 'by-device', title: 'Visits by device', subtitle: 'Unique · Last 90 days', type: 'bars', span: 1,
        points: [{ label: 'Mobile', value: 58 }, { label: 'Desktop', value: 34 }, { label: 'Tablet', value: 8 }],
      },
    ],
  },
}

export const analyticsHandlers = [
  http.get('/api/analytics/boards', () => HttpResponse.json({ data: BOARD_LIST })),
  http.get('/api/analytics/boards/:key', ({ params }) => {
    const board = BOARDS[params.key as AnalyticsBoardKey]
    return board ? HttpResponse.json(board) : new HttpResponse(null, { status: 404 })
  }),
]
