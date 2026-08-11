# Talent Pools — migration spec & component map

**Status:** delivered 2026-08-04 — every decision in §4(b), §5.1, §5.2 and §5.3 is settled and built.

Two things landed that this spec did not anticipate. Pools are built on the real sample candidates
in `candidates.handlers.ts` rather than an invented cast, so a pool row links straight to the
profile the Candidates module already owns — the three pool names those candidate records referenced
(`Engineering (Sample)`, `Rising stars (Sample)`, `Next recruitment - Q3 (Sample)`) exist now with
the membership those profiles claim. And `pageTransition` in `nuxt.config.ts` had to be disabled: it
silently broke every client-side route change app-wide, which is why opening a candidate from a pool
did nothing until it was found.
**Source of truth:** `Recruitera Talent Pools.html` (2,211 lines, standalone prototype, final iterated version)
**Target:** `app/pages/talent-pools.vue` (currently an 11-line "Coming soon" stub)
**Base branch:** `talent-pools-migration`, cut from `upstream/main`

The prototype is treated as the specification for **layout, behaviour, and states**. Colour values,
spacing, and components come from this repo's design system, not from the prototype's CSS. Nothing
is ported verbatim.

---

## 1. Scope

### Screens

| # | Screen | Notes |
|---|--------|-------|
| 1 | Pools list | Two tabs: Active / Archived, each with a live count |
| 2 | Pool detail | Candidates of one pool; prototype has a `detailTab` state but only ships one tab |
| 3 | Candidate profile drawer | Right-hand drawer, 400 px |

### Dialogs and drawers

| Element | Purpose |
|---------|---------|
| Create / Edit pool drawer (520 px) | Name, category, department **or** event name, description, assigned team members |
| Archive confirm | Moves pool to the Archived tab |
| Restore confirm | Moves pool back to Active |
| Delete pool | Radio choice: delete candidates too, **or** move them to another pool/job |
| Move to Job | Sends a candidate into an active job's pipeline |
| Move to Pool | Sends a candidate to a different pool |
| Candidate confirm | Shared confirm for disqualify / delete |
| Add candidate manually | Name, email, phone, résumé drop-zone |
| Import CSV | File input + downloadable template |
| Upload file | Résumé/bulk upload |
| Form builder | Standard fields, optional fields, custom questions |
| Form preview | Read-only render of the built form |

### Out of scope (prototype chrome the app already owns)

The prototype is standalone, so it ships its own app shell. All of it is dropped:

- Left navigation sidebar and its collapse toggle (`app/layouts/default.vue` + `AppSidebar` own this)
- Top bar: global search, help, notifications, notification settings, user avatar menu
- "Sample data active" trial banner
- `localStorage` bridging between standalone pages (see §5.4)

---

## 2. Data model

Lifted from the prototype's seed data. Field names kept unless they clash with existing app types.

```ts
type PoolCategory = 'general' | 'department' | 'event'

interface TalentPool {
  id: string
  name: string
  desc: string
  category: PoolCategory
  dept?: string            // when category === 'department'
  event?: string           // when category === 'event'
  system?: boolean         // true only for the General Application pool
  total: number            // candidate count
  created: string          // ISO date, e.g. '2026-04-12'
  members: string[]        // team-member ids
  archived: boolean
  pinned: boolean          // pinned pools sort first
  formStatus?: 'live' | 'draft'   // event pools only
}

interface PoolCandidate {
  id: string
  name: string
  stage: 'New' | 'Applied' | 'Screened' | 'Interview' | 'Offer' | 'Reference check'
  appliedVia: string       // 'Referral' | 'Career Site' | 'LinkedIn' | 'Event Form' | 'General Application'
  jobTitle: string | null
  email: string
  phone: string | null
  location: string
  aiScore: number | null
  evalScore: number | null
  tags: string[]
  date: string             // ISO date
}
```

Seed data in the prototype: 5 team members, 7 pools (1 archived, 1 system), 13 candidates.
All of it moves into an MSW handler — `app/mocks/handlers/talent-pools.handlers.ts`.

### Table columns

**Pools list:** Talent Pool Name · Category · Total Talents · Creation Date · Team Members · (kebab)

**Pool detail — candidates:** Job Title · Applied Via · Stage · AI Score · Evaluation Score · Tags

### Bulk actions (detail view)

Select-all checkbox drives a bulk bar with: move to pool, move to job, delete, clear selection.

---

## 3. Component map

Every prototype block maps to something that already exists. Nothing bespoke unless flagged.

| Prototype markup | Replaced by | Source |
|------------------|-------------|--------|
| `<table class="tp-table">` | `BrandDataTable` | `components/brand/` |
| Search input with magnifier | `BrandSearchBar` | `components/brand/` |
| `.empty-state` block | `BrandEmptyState` | `components/brand/` |
| Page heading + subtitle | `BrandPageTitle` | `components/brand/` |
| `.s-tab` + `.tab-count` | `ui/tabs` + `BrandCountBadge` | `components/ui/`, `brand/` |
| `.s-btn`, `.s-btn.primary` | `BrandButton` | `components/brand/` |
| Stage / category pills | `BrandStatusBadge` | `components/brand/` |
| Team-member initial circles | `BrandAvatarInitials` | `components/brand/` |
| `.checkbox-row`, `.radio-dot` | `BrandLimeCheckbox` | `components/brand/` |
| `.pool-kebab` row menu | `ui/dropdown-menu` | `components/ui/` |
| `.modal-bg` / `.modal-card` | `ui/dialog` | `components/ui/` |
| `.drawer-bg` / `.drawer` | `ui/sheet` | `components/ui/` |
| `initSearchableSelect()` (75 lines of hand-rolled combobox) | `ui/command` inside `ui/popover` | `components/ui/` |
| `<select class="s-input">` filters | `ui/select` or `BrandFilterGroup` | `components/ui/`, `brand/` |
| Filter panel (`#cand-filter-panel`) | `BrandFilterGroup` + `BrandFilterOption` + `useFilterRegistry` / `useActiveFilters` | `brand/`, `composables/` |
| `showToast()` + `.toast` markup | **no equivalent — see §5.1** | — |

### Composables to reuse rather than re-derive

`useTeam` (assigned members) · `useTags` (candidate tags) · `useDepartments` (department picker) ·
`useJobs` (Move-to-Job destinations) · `useApi` · `useFilterRegistry` + `useActiveFilters` (filters).

New: `useTalentPools` — pool CRUD, archive/restore, candidate moves.

---

## 4. Colour mapping

Audited all 62 distinct hex values in the prototype (357 usages) against the 98 `--brand-*` tokens.

| Bucket | Colours | Share of usages | Action |
|--------|---------|-----------------|--------|
| Exact match | 28 | **66.9%** | Direct token swap, no review needed |
| Near match (ΔRGB ≤ 12) | 14 | **8.7%** | Snap to nearest token — not perceptible |
| Orphan | 20 | **24.4%** | Needs a decision — listed below |

Representative exact matches:

```
#8a978f  x49  ->  --brand-text-quiet
#1a2b28  x24  ->  --brand-text
#5b6b5f  x24  ->  --brand-text-muted
#002427  x14  ->  --brand-teal
```

### Orphans requiring a decision

**(a) Prototype-internal drift — resolve toward the token**

The prototype uses two different reds for the same job: `#d04040` (15×) and `#c0392b` (9×).
`#c0392b` *is* `--brand-settings-danger`. Both collapse to that token; the migration removes an
inconsistency rather than introducing one.

The avatar palette is similar: the prototype hard-codes
`['#002427','#3a5c2e','#5a4a2e','#1d4e5c','#6b3fa0']` while the app ships `--brand-avatar-1..6`.
Snap to the app tokens.

**(b) Genuine semantic gaps — a new token is needed**

The confirm dialogs use a coloured icon tile per intent. Two of the three have no token:

> **Correction (2026-08-03).** The first pass of this audit ranked candidate tokens by RGB distance
> alone and reported the archive/restore colours as having no semantic token, recommending four new
> ones. That was wrong: `--brand-success` and `--brand-warning` already exist. Distance is not
> semantics — the nearest token by hue was an avatar colour, so the correctly-named tokens were
> never surfaced. Two tokens are added, not four.

| Intent | Prototype fg / bg | Correct token | Verdict |
|--------|-------------------|---------------|---------|
| Delete | `#c0392b` / `#fbe4e4` | `--brand-settings-danger` (#c0392b) | ✅ exists, exact |
| Archive | `#a67608` / `#fdf3d8` | `--brand-warning` (#e8a33d) | ✅ exists, different shade |
| Restore | `#1f8a4c` / `#e3f6ea` | `--brand-success` (#3aab52) | ✅ exists, different shade |

**Decided:** reuse the existing `--brand-success` and `--brand-warning` for the icon foregrounds.
Their shades differ noticeably from the prototype's, and per §0 the design system wins on values —
the confirm dialogs will read slightly lighter than the HTML. This is a deliberate deviation and
goes in the PR's **Design deviations** section.

The tinted **backgrounds** genuinely have no token (`--brand-settings-danger-hover-bg` covers danger
only), so exactly two are added, following the naming already used for danger:

```css
--brand-success-bg: #e3f6ea;   /* restore-confirm icon tile */
--brand-warning-bg: #fdf3d8;   /* archive-confirm icon tile */
```

These two lines are the only change this work makes to `app/assets/css/main.css`.

`#0d1f1c` (36×) is the prototype's heading colour and sits Δ16 from `--brand-preview-text-heading`
(#0f172a — a blue-tinted slate, wrong hue family). It is Δ~10 from `--brand-text` (#1a2b28), same
hue family. Recommendation: fold into `--brand-text`.

---

## 5. Open questions

### 5.1 Toasts — a real gap

The prototype shows success/error toasts after every mutation. This repo has **no toast component**
in `components/brand/` or `components/ui/`, and no toast library in `package.json`.

**Decided:** build a minimal `BrandToast` component plus a `useToast()` composable, styled from
brand tokens. No new dependency. Every remaining prototype uses toasts, so the cost is paid once
here. Success and error variants only — that is all the prototype uses.

### 5.2 The General Application pool

In the prototype this pool is system-generated and only appears once a "General Application" toggle
in **Settings → Career Site** has been switched on. Because the standalone pages cannot share state,
the prototype bridges the flag through `localStorage` (`recruitera_ga_enabled`,
`recruitera_ga_pool_created`, `recruitera_ga_candidates`).

Inside Nuxt this hack disappears — it becomes ordinary shared state through the MSW layer.

**Decided:** the pool ships **always present**, flagged `system: true` so it cannot be renamed,
archived or deleted. Gating it on the Career Site setting was rejected for now because
`app/pages/settings/career-site.vue` is still a stub — wiring the gate today would mean the pool
never appears at all. Add the gate when that page is built.

It holds the three sample candidates with no job assignment, and their rows show no job title:
these are people who applied without a specific role, which is the whole point of the pool.

### 5.3 Scope split

**Decided:** ship the whole feature as a **single PR**. A three-way split was offered and declined.

Consequence to manage: the PR will be large, so the burden shifts onto structure. Mitigations that
are now mandatory rather than optional:

- Commit in reviewable slices on the one branch — types and mocks, then toast primitive and tokens,
  then list view, then detail view, then form builder — so the commit-by-commit diff stays readable
  even though the PR is one unit.
- Split the page into child components under `app/components/talent-pools/` rather than one
  monolithic `talent-pools.vue`.
- The PR description carries a walkthrough ordered the same way as the commits.

### 5.4 Prototype cross-links

The prototype's sidebar links to sibling HTML files (`Recruitera Candidates Export.html`,
`Recruitera Calendar Standalone.html`, `Recruitera My Schedule.html`). These become normal Nuxt
routes and are dropped along with the rest of the shell.

---

## 6. Definition of done

- `app/pages/talent-pools.vue` replaces the stub, with child components under
  `app/components/talent-pools/`
- `app/mocks/handlers/talent-pools.handlers.ts` registered in `app/mocks/handlers/index.ts`
- `app/types/talent-pool.types.ts` exported from `app/types/index.ts`
- `BrandToast` + `useToast()` added; exactly two new tokens (`--brand-success-bg`,
  `--brand-warning-bg`) in `app/assets/css/main.css`
- `npm run lint` clean — no hex literals, no raw Tailwind colour classes
- `npm run test` green
- Verified in the browser, every screen and dialog in §1: both tabs, search, both filters, reset,
  empty state, create, edit, archive, restore, delete (both branches of the radio), detail view,
  candidate filters, bulk actions, profile drawer, move-to-pool, move-to-job, form builder,
  form preview, CSV import, manual add
- PR description carries a **Design deviations** section listing every §4 orphan decision
