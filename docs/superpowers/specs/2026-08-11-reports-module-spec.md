# Reports Module — Design Spec

Source of truth: `Reports_Module_ClaudeCode_Prompt.md` (General Reports PRD V3 + PRD E5 v2.0), supplied
by the user 2026-08-11. This spec translates that BRD into this codebase's conventions. Legacy
reference (`recruitera-reports-legacy-reference.md`) is background only, superseded by the BRD.

Branch: `reports-module`, cut from `origin/main` (fast-forwarded from `upstream/main` — this branch
is explicitly **not** headed for a PR, so it was safe to pull in Smart Distribute / Career Site /
Talent Pools work already merged on the fork's main instead of re-deriving it).

## Two surfaces, architecturally distinct (per BRD §1)

1. **General Reports** — standalone module, own left-nav item, 8 sections, global filter bar.
2. **Job-Level Reports** — the existing "Reports" tab in `jobs/[id]/index.vue` (currently a dead
   tab — in `TABS` array, no content block), scoped to one job, simpler filter, no drill-down popup.

Do not merge them into one dashboard or share filter state between them.

## Architecture decisions

**Charting:** `echarts` + `vue-echarts` (added to `package.json`), `renderer: 'svg'`. SVG renderer
means chart colors can reference `var(--brand-*)` tokens directly like any other DOM color — no hex,
no runtime `getComputedStyle` resolution needed, satisfies `local/no-hex-colors`. One wrapper
component per chart type in `app/components/reports/charts/`: `ReportLineChart`, `ReportBarChart`,
`ReportHorizontalBarChart`, `ReportDonutChart`, `ReportFunnelChart`. Each takes plain data props and
emits `@point-click` for the drill-down popup — chart-library specifics stay inside these 5 files.

**Nav/shell, not a new layout:** CLAUDE.md forbids new layouts (only `default` / `settings` / `auth`
exist). `SettingsSidebar.vue` + `settings.vue` proves the "secondary in-app-rail nav" pattern already
exists as a **component**, not a layout. Mirror it: `ReportsSidebar.vue` (flat 8-item list, same
visual language as `SettingsSidebar`, no accordion needed) + `ReportsShell.vue` (composes
`ReportsSidebar` + `ReportsFilterBar` + content slot), rendered from ordinary pages under the
existing `default` layout. Pages: `app/pages/reports/jobs.vue`, `reports/candidates.vue`,
`reports/pipelines.vue`, `reports/disqualifications.vue`, `reports/hires.vue`,
`reports/interviews.vue`, `reports/evaluations.vue`, `reports/careers-site.vue`, each a thin
`<ReportsShell active="jobs"><JobsReportSection /></ReportsShell>`. `reports/index.vue` redirects to
`reports/jobs`.

**Sidebar nav:** `AppSidebar.vue`'s "Analytics" item (`TrendingUp` icon, `/analytics`) becomes
"Reports" → `/reports`. `pages/analytics.vue` becomes a redirect to `/reports` (kept, not deleted, in
case anything still links to the old path).

**State:**
- Global filters (date range + department + job + recruiter + hiring manager + talent pool + collar
  toggle) live in a new `app/stores/reports.store.ts` Pinia store — must persist across the 8 section
  page navigations (R-G01), which rules out page-local `ref`. Not persisted to `localStorage`; resets
  on full reload, matching "All time" default.
- Job-level date range (5-option, simpler) is page-local `ref` in `jobs/[id]/index.vue`, not shared
  with the global store.

**Data layer** (`app/composables/useReports.ts`, one composable file — "one per domain" per
CLAUDE.md, Reports is one domain): `useJobsReport(filters)`, `useCandidatesReport(filters)`,
`usePipelinesReport(filters)`, `useDisqualificationsReport(filters)`, `useHiresReport(filters)`,
`useInterviewsReport(filters)`, `useEvaluationsReport(filters)`, `useCareersSiteReport(filters)`,
`useJobReport(jobId, dateRange)` (job-level), each wrapping Vue Query against one MSW handler file:
`app/mocks/handlers/reports.handlers.ts`, endpoints `/api/reports/jobs`, `/api/reports/candidates`,
etc. + `/api/reports/jobs/:id` for job-level. All computation happens inside the handler (server-side
in a real API), so the handler is where the BRD's calculation formulas (§2.8, §4 legacy formulas as
ground truth for exact math) actually get implemented.

**Drill-down popup:** `app/components/reports/DrillDownPopup.vue`, company-level only (§2.5). Reads
from the same `ALL_CANDIDATES`-derived data; given a chart's clicked point + active filters, filters
candidates matching and paginates client-side (mock scale is small, no need for a dedicated endpoint).

**CSV export:** `app/utils/csvExport.ts` — one small utility, `exportToCsv(filename, rows)`, used by
every section's export button and the drill-down popup's export icon. Pure client-side (data already
in memory from the query).

## Data model: what's reused vs. what's new

Per CLAUDE.md's "build on top of existing data" rule — confirmed via codebase audit before writing
this spec:

**Reused as-is:** `ALL_CANDIDATES` (`candidates.handlers.ts`) for `sources`, `status`,
`disqualifiedBy`, `dateCreated`, `talentPools`, `assignedRecruiterId`/`assignmentSource` (Smart
Distribute, populated on this branch); `useJobs` fixture for `department`, `collar`, `workModel`,
`assignees`; `team.handlers.ts` for recruiter/hiring-manager identity + `role` distinction (Recruiter
vs Hiring Manager already exist as separate `TeamMemberRole` values); `departments.handlers.ts` names
where they overlap with job data.

**Gap found, filled inside `reports.handlers.ts` only (not bolted onto the real domain files) —
each is a deterministic generator seeded from existing candidate/job ids, so numbers are stable
across reloads and reflect the same underlying people:**
- Per-candidate stage-entry timestamp history (needed for avg time per/to stage, TTH, TTF) — nothing
  like this exists anywhere (`job-pipeline.types.ts` has no timestamps, `useJobActivity` is job-level
  not per-candidate-stage). Generated as `stageHistory: {stage, enteredAt}[]` per candidate.
- Job `publishedAt` / `filledAt` / `closedAt` / `positions` (openings target) — `Job` type has
  `createdAt` only, no lifecycle dates or an openings count that persists. Generated per job.
- Submitted evaluation records (score, evaluator, submitted date, request date, status) — the only
  existing evaluation-shaped data is a hardcoded fixture local to `CandidateEvaluationTab.vue`,
  identical for every candidate. Generated per-candidate from `team.handlers.ts` recruiters as
  evaluators.
- Interview records (interviewer, duration, type online/on-site, status, date) —
  `interviews.vue`'s `SchedulerLink[]` is self-scheduling links, not individual interview events.
  Generated per interview-stage candidate.
- Offers (accepted date, start date) — `offers.vue` is a bare "Coming soon" stub, no data at all.
  Generated for hired candidates only.
- Career Site sessions/visits/traffic-source — no tracking data exists anywhere despite the public
  career site pages being built. Generated as aggregate daily counts, not per-session records (no
  consumer needs session-level granularity per the BRD's KPI/chart list).
- Disqualification reason **taxonomy**: real 7-value list already exists but only as local component
  state in `settings/workflow/disqualify.vue` (`Not a fit, Hired elsewhere, Lack of knowledge,
  Overpriced, Spam, Lacks interpersonal skills, Wrong skill set`) — imported into the reports handler
  and assigned to disqualified candidates deterministically (not touching the settings page).

**Explicitly not reconciled as part of this build:** `departments.handlers.ts` (4 names) vs. the 7
department strings actually used in the `useJobs` fixture don't overlap — Department filter options
are sourced from distinct `job.department` values in use, not from the Settings department list.
Flagging, not fixing — out of scope for a Reports build.

## Open-question defaults (BRD §2.13 / §3.10 — answered here so the build isn't blocked)

- Blue/White Collar toggle: **global filter**, per BRD §2.6 listing it there (not per-section).
- Time to Hire counts from **Applied date**, matching BRD's own stated industry standard.
- Careers Site report: built against the generated mock session data above (in scope for this build,
  not deferred — this is a prototype, not gated on a real tracking pixel).
- Interviews report includes only generated Scheduler-shaped records (no manual-interview concept
  exists in this codebase to include or exclude).
- Access control: **not gated by role for this build** — no permission-check pattern exists yet
  elsewhere in the app to hook into; all users see all reports. Flagged, not solved.
- Job-level Recruiter Performance table: visible to all viewers of the tab (same reasoning).
- Job-level evaluation distribution: shows all evaluations (quick + structured are not actually
  distinguished anywhere in the codebase).

## Build order (mirrors BRD §6 checklist)

1. Shared infra: chart wrappers, KPI card, date-range pickers (18-option global, 5-option job-level),
   CSV export util, drill-down popup, `reports.store.ts`.
2. `reports.handlers.ts` + `reports.types.ts` — all 8 general section endpoints + job-level endpoint,
   including the generated-data gap-fillers above.
3. Shell: `ReportsSidebar`, `ReportsFilterBar`, `ReportsShell`, routing, sidebar nav rename.
4. Sections in BRD order: Jobs → Candidates → Pipelines → Disqualifications → Hires → Interviews →
   Evaluations → Careers Site.
5. Job-Level Reports tab in `jobs/[id]/index.vue`.
6. Lint/test/build pass + browser verification of each section (empty states, loading skeletons,
   filter interaction, drill-down, CSV export).
