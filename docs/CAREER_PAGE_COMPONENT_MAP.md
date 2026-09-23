# Career Page — Component Map

Source of truth: this repository at commit `3168a66` (app code identical to `origin/main`).
Scope: the public Career Page at **`/careers`** (Home). The two sibling routes that share
the same shell (`/careers/opportunities`, `/careers/jobs/[id]`) are listed for completeness
because the Career Page links to them.

All paths are relative to the repository root.

---

## 1. Routes

| Route | File | Lines | Notes |
|---|---|---|---|
| `/careers` | `app/pages/careers/index.vue` | 1–15 | `definePageMeta({ layout: false })` (L6). Renders `<CareerShell hero-overlap>` → `<CareerHome>` (L12–14). |
| `/careers/opportunities` | `app/pages/careers/opportunities.vue` | 1–11 | Same shell, renders `<CareerOpportunities>`. |
| `/careers/jobs/[id]` | `app/pages/careers/jobs/[id].vue` | 1–13 | Same shell, renders `<CareerJob :job-id>`. |
| `/career-site` | `nuxt.config.ts` | L63 | `routeRules` redirect → `/careers` (Nitro default status 307). |

Rendering mode: `nuxt.config.ts` L91–92 → `'/careers': { ssr: false }`, `'/careers/**': { ssr: false }`.
The Career Page is **client-rendered only (SPA)**. There is no server-rendered HTML for it.

Layout: **none**. `layout: false` bypasses `app/layouts/*`. `app/app.vue` (L4–8) still wraps
every page in `<NuxtLayout><NuxtPage/></NuxtLayout>`; with `layout:false` NuxtLayout renders nothing extra.

Page transition: `nuxt.config.ts` L101 `app.pageTransition = { name: 'page', mode: 'out-in' }`.
No `.page-enter-*` / `.page-leave-*` CSS exists anywhere in the repo (grep: 0 hits), so route
changes between career pages have **no visible animation**. The out-in mode still applies (old page unmounts before new mounts).

Middleware: none. The career pages declare no `middleware` in `definePageMeta`, and
`app/middleware/auth.ts` / `subscription.ts` are not global (no `.global` suffix).

---

## 2. Component tree (actual, `/careers`)

```
app/app.vue
└── NuxtLayout (no layout: layout:false)
    └── pages/careers/index.vue
        └── CareerShell  (prop heroOverlap = true)                    app/components/career/CareerShell.vue
            ├── div.cc-root  (theme CSS vars, font, bg-white)         L23
            │   ├── header (sticky, z-40)                             L27–75
            │   │   └── div (pill / full-width bar, bg = --cc-header)  L34–74
            │   │       ├── div row (h-16)                            L39–61
            │   │       │   ├── NuxtLink → /careers (logo)            L40–46
            │   │       │   │   ├── img (uploaded logo)  OR           L41
            │   │       │   │   └── initial tile + company name       L42–45
            │   │       │   ├── nav (≥640px): Home · Opportunities    L47–50
            │   │       │   └── div actions (ml-auto)                 L51–60
            │   │       │       ├── button "For Employees" (≥640, if forEmployeesOn)  L53
            │   │       │       ├── button language "العربية" (≥640)  L54
            │   │       │       └── button menu toggle (<640)          L56–59
            │   │       └── Transition cc-menu                        L64–73
            │   │           └── nav mobile dropdown (<640, if menuOpen) L65–72
            │   ├── <slot/> ──► CareerHome                             app/components/career/CareerHome.vue
            │   │   └── div (root)                                     L70
            │   │       ├── HERO — exactly one of:
            │   │       │   ├── section video hero   (v-if heroIsVideo)   L73–86
            │   │       │   ├── section image hero   (v-else-if heroImage) L90–95
            │   │       │   └── section gradient hero (v-else)            L98–107
            │   │       ├── section#jobs  FEATURED JOBS                    L111–151
            │   │       │   └── div container → div panel                  L112–113
            │   │       │       ├── header row (company, h2, p, View all)  L114–121
            │   │       │       ├── collar filter pills ×3                 L123–129
            │   │       │       └── grid of job-card <button>s (≤6)        L131–148
            │   │       ├── section VALUES (v-if values.length)            L154–184
            │   │       │   ├── heading block                              L155–158
            │   │       │   ├── static row (v-if !valuesLoop)              L160–169
            │   │       │   └── marquee (v-else)                           L172–183
            │   │       ├── section CULTURE VIDEO (v-if videoUrl)          L187–210
            │   │       ├── section TESTIMONIALS (v-if testimonials.length) L213–252
            │   │       │   ├── heading block                              L214–217
            │   │       │   └── grid box                                   L218–251
            │   │       │       ├── left branded panel                     L220–226
            │   │       │       └── right carousel (Transition cc-fade)    L228–250
            │   │       └── CareerApplyCta                                 L255
            │   │           └── section (v-if forEmployeesOn)              app/components/career/CareerApplyCta.vue L8–16
            │   └── footer                                             CareerShell L80–85
```

There are **no separate files** for Navbar, Hero, FeaturedJobs, JobCard, Filters, Principles,
Culture, Testimonials or Footer: they are all inline template blocks. Only three `.vue`
components make up the page: `CareerShell`, `CareerHome`, `CareerApplyCta`.

---

## 3. Component table

| Component | File | Responsibility | Children | Data source | Styling source |
|---|---|---|---|---|---|
| `pages/careers/index.vue` | `app/pages/careers/index.vue` | Route entry; disables layout; wires `open-job` → `navigateTo('/careers/jobs/:id')` (L7) and `view-all` → `navigateTo('/careers/opportunities')` (L8) | CareerShell, CareerHome | none | none |
| `CareerShell` | `app/components/career/CareerShell.vue` | Theme root (CSS vars + font), header (desktop + mobile menu), footer, slot | header, mobile nav, `<slot>`, footer | `useCareerSite()` (themeVars, forEmployeesOn, logoUrl, headerSticky, headerFullWidth) L13; `useCompany()` (name) L14; `useRoute()` (active link) L15–17; prop `companyName?`, prop `heroOverlap` L12 | Tailwind utility classes (inline in template), inline `:style` for theme colors, scoped `<style>` L89–98 (font-family, `cc-menu` transition) |
| `CareerHome` | `app/components/career/CareerHome.vue` | Hero (3 variants), featured jobs + collar filter, values (static/marquee), culture video, testimonials carousel, CTA | CareerApplyCta; lucide icons | `useCareerSite()` L14; `useCompany()` L15; `useJobs()` L16; helpers from `~/utils/careerJob` L9 | Tailwind classes, inline `:style`, inline `style="background:…"` strings (L80, L99), scoped `<style>` L259–284 (marquee keyframes, mask, crossfade) |
| `CareerApplyCta` | `app/components/career/CareerApplyCta.vue` | "Can't find your desired job?" box + "Join Talent Pool" button | none | `useCareerSite().forEmployeesOn` L4 | Tailwind classes + inline `:style` |
| `CareerOpportunities` (sibling route) | `app/components/career/CareerOpportunities.vue` | Opportunities list page | CareerApplyCta | useJobs, useCareerSite | Tailwind |
| `CareerJob` (sibling route) | `app/components/career/CareerJob.vue` | Job detail + apply form | CareerApplyCta | useJobs, useCompany, useCareerSite | Tailwind |

Auto-import: components are Nuxt auto-imported from `app/components/career/…` (no explicit
imports in the page files). Composables are imported explicitly with `~/composables/...`.

---

## 4. Composables / state / helpers

| Kind | File | Used by | What it provides |
|---|---|---|---|
| Composable + module state | `app/composables/useCareerSite.ts` | Shell, Home, ApplyCta | Single module-level `reactive<CareerState>` (L59–88) with all branding/content; `themeVars` computed (L148–154); `syncRev` (L110); `valueIcon()` (L156–158); localStorage persistence (L92, L114–146) |
| Composable (Vue Query) | `app/composables/useCompany.ts` | Shell, Home | `useQuery(['company'])` → `fetch('/api/company')` → `CompanyInfo` |
| Composable (static fixture) | `app/composables/useJobs.ts` | Home | Module-level `ref<Job[]>` of 9 fixture jobs; **no API call** |
| Helpers | `app/utils/careerJob.ts` | Home | `ccEmploymentType` (L11–13), `ccWorkLabel` (L14–16), `ccBlurb` (L23–26), `ccIsVideoFile` (L7–9) |
| Vue Query client | `app/lib/query-client.ts` + `app/plugins/vue-query.ts` | useCompany | staleTime 60s, gcTime 5min, retry 1, refetchOnWindowFocus false |
| Mock API | `app/plugins/msw.client.ts`, `app/mocks/browser.ts`, `app/mocks/handlers/company.handlers.ts` | useCompany | MSW service worker answers `GET /api/company` (enabled in production too, per plugin comment L2–3) |
| Pinia stores | `app/stores/*` | **not used** by the Career Page | — |
| Settings writer | `app/pages/settings/career-site.vue` | (admin page, not public) | Edits the same `useCareerSite()` state (L247–286), which persists to localStorage |

---

## 5. Styling sources

| Source | File | Relevance to Career Page |
|---|---|---|
| Tailwind CSS v4 via Vite plugin | `nuxt.config.ts` L1, L39–41; `package.json` devDeps `tailwindcss`, `@tailwindcss/vite` | All utility classes |
| Global CSS | `app/assets/css/main.css` (registered `nuxt.config.ts` L37) | `@import "tailwindcss"` (L1); `@theme inline` radius overrides (L214–220) — **`rounded-2xl` = 24px** here; preflight + base: `* { box-sizing:border-box }` (L265–267), `html,body{height:100%;margin:0;padding:0}` (L268–272), body bg/color/font (L273–280), focus-visible outline (L284–296), reduced-motion override (L298–308), scrollbar (L338–342) |
| No `tailwind.config.*` file | — | Tailwind v4 CSS-first config; breakpoints/spacing/font-size are Tailwind **defaults** (no overrides of `--breakpoint-*`, `--spacing`, `--text-*` in main.css) |
| Scoped styles | CareerShell L89–98, CareerHome L259–284 | font-family, menu transition, marquee, mask, crossfade |
| Inline `style` / `:style` | throughout | All company colors (`var(--cc-primary)`, `var(--cc-header)`) and `color-mix()` tints |
| PostCSS | `postcss.config.js` | `@tailwindcss/postcss` (Vite plugin is what Nuxt actually uses) |

---

## 6. Icons, fonts, assets, third-party packages

| Item | Source | Where |
|---|---|---|
| Icons | `lucide-vue-next` (`package.json`: `^0.468.0`) | Shell L8: `Globe, Menu, X`. Home L6: `ArrowRight, MapPin, Briefcase, Quote (as QuoteIcon), Play, ChevronLeft, ChevronRight`. Value icons: 32 icons in `CAREER_VALUE_ICONS` (`useCareerSite.ts` L16–22) |
| Fonts | none loaded | `--cc-font` default `'Geist'` (`useCareerSite.ts` L69); no `@font-face`, no Google Fonts link anywhere in `app/` or `nuxt.config.ts` (grep) |
| Static images | none used by the Career Page | `public/logo.svg`, `public/Frame 427320920.svg` are not referenced by career components |
| Company media | data URLs / external URLs from `useCareerSite` state | logo, cover image, cover video, culture video, testimonial photos |
| YouTube | `https://www.youtube.com/embed/{id}` iframes and `https://img.youtube.com/vi/{id}/hqdefault.jpg` | Home L75–77, L197, L200 |
| Vue Query | `@tanstack/vue-query` `^5.62.0` | useCompany |
| MSW | `msw` (mock service worker) | `/api/company` |
| Nuxt | `nuxt ^3.15.0`, `compatibilityVersion: 4` | framework |
| Color mode | `@nuxtjs/color-mode` (preference `light`, `nuxt.config.ts` L31–35) | Adds `light` class to `<html>`; Career Page has no dark styles |
| Pinia, vee-validate, zod, reka-ui | installed | **not used** by the Career Page |
| i18n | none | no i18n package or locale files exist |
