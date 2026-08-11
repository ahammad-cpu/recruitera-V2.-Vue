import type { Job, JobStatus } from '~/types'

/**
 * Static jobs fixture — matches the rows in the design reference.
 * Swap for an MSW handler + Vue Query call when the API is ready
 * (mirror the useCandidates.ts pattern).
 *
 * Kept as a module-scope ref so status changes made via the Status
 * column dropdown persist across route changes within the same tab.
 *
 * ─── When the real API lands, migrate these here ────────────────────
 *   • Pagination — swap `jobs` for `useQuery({ queryKey: ['jobs', filters], … })`
 *     and thread `page/perPage` through the filters (see useCandidates for the
 *     shape). If total counts pass ~1000, add @tanstack/vue-virtual to the card
 *     list container instead of paginating.
 *   • Skeleton loading — render a stack of skeleton JobCards while `isFetching`
 *     is true (mirror CandidatesTableSkeleton). Avoids layout jump.
 *   • Optimistic status mutations — `useMutation` with onMutate to write the
 *     new status into the query cache, rollback in onError.
 *   • URL-synced search + filters — bind `searchInput` + activeView + collarTab
 *     to router.query so bookmarked/shared links reproduce the view.
 */
// Assignee avatar tokens (initials + brand palette) reused across rows.
const MS = { name: 'Mohamed Salem', initials: 'MS', bg: 'var(--brand-teal)',            color: 'var(--brand-avatar-text)' }
const SR = { name: 'Sara Rashed',   initials: 'SR', bg: '#2f6f8f',                       color: '#ffffff'            }
const AK = { name: 'Ahmed Kamal',   initials: 'AK', bg: '#6d4ac8',                       color: '#ffffff'            }
const LW = { name: 'Lina Waheed',   initials: 'LW', bg: '#b2453a',                       color: '#ffffff'            }

const FIXTURE: Job[] = [
  { id: 'j1', title: 'Backend Engineer',        status: 'published', location: 'Tel Aviv',  department: 'Engineering', workModel: 'on-site', collar: 'white', candidateCount: 58, newCandidates: 11, hires: 2, createdAt: '2026-07-24', assignees: [MS, SR],
    description: 'We are looking for a Backend Engineer to design and maintain the services powering our hiring platform. You will work closely with product and frontend to ship reliable, well-tested APIs.',
    responsibilities: ['Design and build backend services and APIs', 'Own data models and query performance', 'Write tests and participate in code review', 'Collaborate with frontend and product on new features'],
    requirements: ['3+ years building production backend services', 'Strong SQL and API design fundamentals', 'Comfortable owning a service end to end'],
    employmentType: 'Full-time', category: 'IT/Software Development', careerLevel: 'Experienced' },
  { id: 'j2', title: 'Senior Frontend Engineer', status: 'published', location: 'London',    department: 'Engineering', workModel: 'hybrid',  collar: 'white', candidateCount: 47, newCandidates: 7,  hires: 2, createdAt: '2026-07-18', assignees: [AK],
    description: 'Own the candidate-facing experience end to end with Vue and TypeScript, working across the career site, application flows, and the recruiter product.',
    responsibilities: ['Build and maintain Vue/TypeScript UI across the product', 'Partner with design on a shared component system', 'Mentor other frontend engineers', 'Champion performance and accessibility'],
    requirements: ['5+ years frontend engineering experience', 'Deep Vue or comparable framework experience', 'Track record shipping consumer-facing UI at scale'],
    employmentType: 'Full-time', category: 'IT/Software Development', careerLevel: 'Experienced' },
  { id: 'j3', title: 'Marketing Manager',        status: 'draft',     location: 'Amsterdam', department: 'Marketing',   workModel: 'remote',  collar: 'white', candidateCount: 12, newCandidates: 2,  hires: 0, createdAt: '2026-07-10', assignees: [MS, LW],
    description: 'Lead our marketing efforts across content, campaigns, and brand — building the story that gets talent and customers excited about what we are building.',
    responsibilities: ['Own the marketing calendar and campaign execution', 'Manage brand voice across channels', 'Partner with sales on lead generation', 'Report on campaign performance'],
    requirements: ['5+ years in B2B marketing', 'Experience owning a marketing function end to end', 'Strong written communication'],
    employmentType: 'Full-time', category: 'Marketing/PR/Advertising', careerLevel: 'Manager' },
  { id: 'j4', title: 'Product Designer',         status: 'published', location: 'Remote',    department: 'Design',      workModel: 'remote',  collar: 'white', candidateCount: 31, newCandidates: 4,  hires: 1, createdAt: '2026-06-29', assignees: [SR],
    description: 'Shape flows and design systems across the hiring product, from early concepts to shipped, polished experiences.',
    responsibilities: ['Design end-to-end product flows', 'Maintain and extend our design system', 'Run user research and usability testing', 'Partner closely with engineering during build'],
    requirements: ['3+ years of product design experience', 'A strong portfolio of shipped B2B or SaaS work', 'Comfortable working directly with engineers'],
    employmentType: 'Full-time', category: 'Creative/Design/Art', careerLevel: 'Experienced' },
  { id: 'j5', title: 'Data Analyst',             status: 'internal',  location: 'Tel Aviv',  department: 'Data',        workModel: 'on-site', collar: 'white', candidateCount: 8,  newCandidates: 1,  hires: 0, createdAt: '2026-06-15', assignees: [MS, SR, AK],
    description: 'Turn hiring data into models and dashboards that help our teams decide faster — this role is open to internal employees first.',
    responsibilities: ['Build and maintain reporting dashboards', 'Partner with product on data-informed decisions', 'Own data quality for key hiring metrics'],
    requirements: ['1-3 years in an analytics role', 'Strong SQL skills', 'Comfortable presenting findings to non-technical stakeholders'],
    employmentType: 'Full-time', category: 'Analyst/Research', careerLevel: 'Entry Level' },
  { id: 'j6', title: 'Warehouse Operative',      status: 'published', location: 'Cairo',     department: 'Operations',  workModel: 'on-site', collar: 'blue',  candidateCount: 23, newCandidates: 3,  hires: 1, createdAt: '2026-05-30', assignees: [LW],
    description: 'Join our logistics team keeping fulfilment fast and accurate — picking, packing, and organizing inventory across our Cairo warehouse.',
    responsibilities: ['Pick and pack orders accurately', 'Keep inventory organized and labeled', 'Follow safety procedures on the warehouse floor'],
    requirements: ['Able to work shift hours', 'Comfortable with physical, on-your-feet work', 'No prior experience required — training provided'],
    employmentType: 'Shift Based', category: 'Logistics/Supply Chain', careerLevel: 'Entry Level' },
  { id: 'j7', title: 'Delivery Driver',          status: 'published', location: 'Cairo',     department: 'Logistics',   workModel: 'on-site', collar: 'blue',  candidateCount: 41, newCandidates: 6,  hires: 3, createdAt: '2026-05-12', assignees: [AK, LW],
    description: 'Deliver orders across Greater Cairo on time and in good condition, representing us at the customer\'s doorstep.',
    responsibilities: ['Deliver packages on assigned routes', 'Handle packages with care', 'Communicate delays or issues promptly'],
    requirements: ['Valid driving licence', 'Familiarity with Cairo roads', 'Punctual and customer-friendly'],
    employmentType: 'Shift Based', category: 'Logistics/Supply Chain', careerLevel: 'Entry Level' },
  { id: 'j8', title: 'Customer Support Lead',    status: 'closed',    location: 'Dubai',     department: 'Support',     workModel: 'hybrid',  collar: 'white', candidateCount: 19, newCandidates: 0,  hires: 1, createdAt: '2026-04-20', assignees: [MS],
    description: 'Be the friendly, sharp first line for our customers, and lead a small team of support specialists.',
    responsibilities: ['Lead and coach the support team', 'Own escalations and tricky tickets', 'Report on support quality and response times'],
    requirements: ['3+ years in customer support, 1+ leading a team', 'Excellent written communication', 'Calm under pressure'],
    employmentType: 'Full-time', category: 'Customer Service/Support', careerLevel: 'Manager' },
  { id: 'j9', title: 'UX Researcher',            status: 'draft',     location: 'Remote',    department: 'Design',      workModel: 'remote',  collar: 'white', candidateCount: 0,  newCandidates: 0,  hires: 0, createdAt: '2026-04-02', assignees: [],
    description: 'Help the team understand recruiters and candidates deeply, running research that shapes what we build next.',
    responsibilities: ['Plan and run qualitative and quantitative research', 'Synthesize findings into clear recommendations', 'Build a research repository the whole team can use'],
    requirements: ['3+ years in UX research', 'Comfortable running studies independently', 'Strong synthesis and storytelling skills'],
    employmentType: 'Full-time', category: 'Analyst/Research', careerLevel: 'Experienced' },
  { id: 'j10', title: 'DevOps Engineer',         status: 'closed',    location: 'Berlin',    department: 'Engineering', workModel: 'hybrid',  collar: 'white', candidateCount: 27, newCandidates: 0,  hires: 1, createdAt: '2026-03-15', assignees: [AK],
    description: 'Own our deployment pipelines and infrastructure, keeping the platform fast, observable, and reliable.',
    responsibilities: ['Maintain CI/CD pipelines', 'Own infrastructure-as-code', 'Improve observability and on-call tooling'],
    requirements: ['3+ years in a DevOps or SRE role', 'Experience with containerized infrastructure', 'Comfortable owning production incidents'],
    employmentType: 'Full-time', category: 'IT/Software Development', careerLevel: 'Experienced' },
]

const jobsRef = ref<Job[]>(FIXTURE)

export function useJobs() {
  function setStatus(id: string, status: JobStatus) {
    jobsRef.value = jobsRef.value.map(j => j.id === id ? { ...j, status } : j)
  }
  return { jobs: jobsRef, setStatus }
}
