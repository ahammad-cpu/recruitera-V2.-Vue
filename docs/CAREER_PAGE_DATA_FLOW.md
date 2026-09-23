# Career Page — Data Flow

## Overview

```
Browser navigates to /careers
  │  nuxt.config.ts L91: routeRules '/careers' → ssr:false (SPA: client-rendered only)
  ▼
app/plugins/msw.client.ts ── starts MSW service worker (also in production, plugin L2–3);
  │                          on failure logs a warning and continues without mocks (L9–14)
app/plugins/vue-query.ts ── installs QueryClient (app/lib/query-client.ts: stale 60s, gc 5min, retry 1, no refetch on focus)
  ▼
app/pages/careers/index.vue  (layout:false, no middleware, no route params)
  ▼
CareerShell ──► useCareerSite()  → themeVars, forEmployeesOn, logoUrl, headerSticky, headerFullWidth
            ──► useCompany()     → company.name
            ──► useRoute()       → active nav link
  ▼ slot
CareerHome  ──► useCareerSite()  → headline, intro, values, testimonials, videoUrl, cover*, forEmployeesOn, syncRev
            ──► useCompany()     → company.name
            ──► useJobs()        → jobs (static fixture)
            ──► app/utils/careerJob.ts helpers
  ▼
CareerApplyCta ──► useCareerSite().forEmployeesOn
```

There is **no company slug, no company ID and no route param** on `/careers`. The page always
represents "the current workspace" (the MSW company mock) with the config stored in this browser.

---

## 1. Career-site configuration (`app/composables/useCareerSite.ts`)

- **Storage**: module-level `reactive<CareerState>` (L59–88) → persisted in `localStorage['cc-career-site']`.
- **Hydration** (`hydrateCareerSite`, L114–146), runs once on the client when `useCareerSite()` is first called:
  1. read `localStorage` (L118) → `applyState()` (L100–112): scalars assigned, arrays replaced in place with `splice`, `syncRev++`.
  2. back-compat `coverType` inference (L122–124).
  3. `watch(state, deep)` → debounced 400ms `localStorage.setItem` (L130–137).
  4. `window.addEventListener('storage')` → `applyState()` for cross-tab live updates (L139–144).
- **Writer**: `app/pages/settings/career-site.vue` copies state into local refs (L249–266) and writes back with `watchEffect` (L268–286); uploads write data URLs directly (L309–318).
- **Theme output**: `themeVars` computed (L148–154) bound on `.cc-root` (`CareerShell.vue` L23).

```ts
// app/composables/useCareerSite.ts L24–56
export interface CareerValue { icon: number; name: string; desc: string }
export interface CareerTestimonial { name: string; role: string; quote: string; photo?: string }

interface CareerState {
  generalApplicationOn: boolean
  forEmployeesOn: boolean
  published: boolean
  headerSticky: boolean
  headerFullWidth: boolean
  primaryColor: string
  headerColor: string
  btnColor: string
  ctaColor: string
  font: string
  logoUrl: string
  coverType: 'image' | 'video'
  coverUrl: string
  coverVideoUrl: string
  headline: string
  intro: string
  videoUrl: string
  values: CareerValue[]
  testimonials: CareerTestimonial[]
  employeeDomain: string
  subdomain: string
}
```

Defaults: see `CAREER_PAGE_CUSTOMIZATION.md`.

## 2. Company (`app/composables/useCompany.ts`)

| Item | Value |
|---|---|
| Endpoint | `GET /api/company` (relative URL; no base URL, no auth header, no params) |
| Client | `useQuery({ queryKey: ['company'], queryFn })`; throws `'Failed to fetch company'` on non-2xx |
| Server | none; answered by MSW `app/mocks/handlers/company.handlers.ts` L14–18 |
| Mock response | `{ name: 'iCareer', industry: 'Technology', size: '11–50', foundedYear: 2019, about: 'We help teams hire better, faster.', logoUrl: null, seoImageUrl: null }` |
| Used fields | `name` only |
| Loading state | none rendered; `companyName` = `'Your Company'` until data arrives (CareerShell L16, CareerHome L17) |
| Error state | none rendered; stays `'Your Company'` (after 1 retry) |
| Caching | Vue Query in-memory, staleTime 60s, gcTime 5min |

```ts
// app/types/company.types.ts
export interface CompanyInfo {
  name: string
  industry: string
  size: string
  foundedYear: number | null
  about: string
  logoUrl: string | null
  seoImageUrl: string | null
}
```

## 3. Jobs (`app/composables/useJobs.ts`)

| Item | Value |
|---|---|
| Source | module-level `ref<Job[]>(FIXTURE)` — **no API call** (the file's comments describe the future API migration) |
| Fixture | 9 jobs; statuses: published j1, j2, j4, j6, j7; internal j5; draft j3, j9; closed j8 |
| Career Page filter | `status === 'published'` (CareerHome L19) → 5 jobs |
| Collar filter | client-side `collar` ref: `'all' \| 'white' \| 'blue'` (L20–21) |
| Limit | first 6 after filtering (L21), fixture order (no sort) |
| Loading / empty / error | none (synchronous); empty → grid with no children |

```ts
// app/types/job.types.ts
export type JobStatus = 'published' | 'internal' | 'closed' | 'archived' | 'draft'
export type CollarType = 'white' | 'blue'
export type WorkModel = 'on-site' | 'remote' | 'hybrid'
export interface Job {
  id: string
  title: string
  status: JobStatus
  location: string | null
  department: string | null
  workModel: WorkModel
  collar: CollarType
  candidateCount: number
  newCandidates: number
  hires: number
  createdAt: string
  assignees: JobAssignee[]
}
```

Fields the Career Page reads from a job: `id`, `title`, `status`, `location`, `department`, `workModel`, `collar`.

Derived text (`app/utils/careerJob.ts`):
- `ccWorkLabel(workModel)` → `On-site` / `Remote` / `Hybrid` (L14–16)
- `ccEmploymentType(job)` → `Shift Based` if `collar==='blue'` else `Full-time` (L11–13)
- `ccBlurb(job)` → ``We're looking for a ${title} to join ${department || 'our team'} and help build what's next — owning real work from day one alongside a team that values craft and candor.`` (L23–26)

## 4. Media

| Media | Origin | Network |
|---|---|---|
| Logo, cover image, testimonial photos | data URLs in localStorage | none |
| Cover video / culture video (YouTube) | `youtube.com/embed/{id}` iframe | YouTube |
| Culture poster | `img.youtube.com/vi/{id}/hqdefault.jpg` | YouTube |
| Cover / culture video (file) | any URL the admin typed | that host |

Note: `nuxt.config.ts` ships `Content-Security-Policy-Report-Only` (L8–18, L71) with no `frame-src`
(falls back to `default-src 'self'`) — YouTube iframes would be *reported*, not blocked.

## 5. Navigation effects

| Action | Result |
|---|---|
| Job card | `navigateTo('/careers/jobs/{id}')` (`pages/careers/index.vue` L7) |
| View all | `navigateTo('/careers/opportunities')` (L8) |
| Logo / Home / Opportunities | `NuxtLink` |
| Everything else | local state only; no API writes anywhere on the page |

## 6. Localization data

None. No i18n package, no locale files, no `lang`/`dir` handling. All copy is hard-coded English
or English defaults in `useCareerSite.ts`.

## 7. Rendering

Client-side only (`ssr:false`). No server payload, no SEO meta (`useHead` not called on career pages),
no `<title>` set by the page.
