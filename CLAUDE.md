# CLAUDE.md — Recruitera V2

Guidance for Claude Code when working in this project. Read this before writing any code.

This file lives at the root of `D:\Recruitera Product`, **not inside the git repo**
(`Recruitera Settings/recruitera-V2.-Vue/`). That's deliberate — see [§ Why this file lives
here, not in the repo](#why-this-file-lives-here-not-in-the-repo) at the bottom. A backup copy is
committed on the fork's `main` branch only; see that section for what that means in practice.

## What this project is

Recruitera V2 is the **frontend rewrite** of the Recruitera ATS, migrating off a Bubble no-code
build. Nuxt 4 + shadcn-vue. Currently at **clickable-prototype / MVP** stage.

**Critical context: there is no backend.** No server API, no database, no real auth.

- Every `/api/*` request is intercepted by **MSW** (Mock Service Worker) — see `app/mocks/`.
- MSW runs in **production too** (`app/plugins/msw.client.ts`), because without it every page is empty.
- Auth is faked in `sessionStorage` (`app/stores/auth.store.ts`). Nothing persists across a browser close.

Do not add a `server/api/` directory, a database client, or an ORM unless explicitly asked. New data
goes in an MSW handler.

## The repo layout — fork, not the team repo

You are working from **`a7mad-hadhoud/recruitera-V2.-Vue`**, a fork of the teammate's repo
**`ahammad-cpu/recruitera-V2.-Vue`**. Two remotes matter:

```
origin    →  a7mad-hadhoud/recruitera-V2.-Vue   (your fork — push here freely)
upstream  →  ahammad-cpu/recruitera-V2.-Vue      (teammate's repo — never push here without being told)
```

A `SessionStart` hook (`D:\Recruitera Product\.claude\tools\fetch-upstream.mjs`, configured in
`D:\Recruitera Product\.claude\settings.local.json`) already fetches `upstream` and reports new
commits/branches at the top of every session. You don't need to manually sync before starting work —
it's already been done by the time you see this file.

**Branch every new feature off `upstream/main`, not `origin/main`.** The fork's `main` accumulates
extra commits over time (see below), so branching from it risks pulling those into a future PR by
accident.

## Git workflow — what's freely allowed, what needs an explicit ask

This is the actual policy this project has been run under, confirmed repeatedly across sessions.
It's stricter in one place than a generic "ask before every git command" rule, and looser in
another — read both halves.

**Freely allowed, no need to ask each time:**
- `git status`, `git diff`, `git log`, `git branch`, `git fetch`
- `git checkout -b <name>` off `upstream/main` at the start of a task
- `git add <explicit files>` / `git commit` — commit working increments as you go
- `git push origin <feature-branch>` — pushing to **your own fork** is fine on an ongoing basis
  once the user has said something like "put this on GitHub" or "push these up" for the task —
  that authorization covers the rest of the session's increments on that branch, not just one push.
  Each push triggers a Vercel preview build for that branch automatically.
- `git merge <feature-branch> --no-ff` into **`origin/main`** (the fork's own main), then
  `git push origin main` — this has been the standing move to make the fork's Vercel **production**
  domain reflect current work, instead of hunting per-branch preview URLs. Safe because merging a
  feature branch *into* the fork's main never touches `upstream`, and never rewrites the feature
  branch's own history (so it still PRs cleanly later).

**Never do without an explicit instruction in that turn:**
- `git push` to **`upstream`**, or anything that reaches the teammate's repo
- `gh pr create`, or any `gh` command that writes
- Merging or committing directly on `upstream/main`
- `git push --force`, `git reset --hard`, `git rebase`, `git branch -D` — explain what the command
  does and get a yes first

"Looks good" / "that works" is approval of the code, not permission to push or open a PR — but once
push has been explicitly authorized for a task, it stays authorized for that task's follow-up
rounds. Opening a PR is always its own, separate ask.

Before any `git add -A` / `git add .`, run `git status` first and check nothing unexpected is
staged — particularly true in this repo since local-only doc files can sit in the working tree
unstaged.

## Commands

```bash
npm install              # first-time setup
npm run dev              # dev server — pin a specific port if 3000 is taken locally
npm run lint             # ESLint, including the custom color rules — MUST pass
npm run lint:fix         # auto-fix
npm run test             # Vitest (unit tests for app/components/brand/ only)
npm run lint:components  # heuristic duplicate-component detector
npm run build             # production build — run this before pushing anything large,
                          # it's exactly what Vercel will do
```

Run `npm run lint` and `npm run test` after every change. The lint step enforces design-system rules
that are not optional (see below).

## Stack

| Concern | Tool | Notes |
|---|---|---|
| Framework | Nuxt 4 (`future.compatibilityVersion: 4`), Vue 3 `<script setup>`, TypeScript strict | file-based routing from `app/pages/` |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) | no `tailwind.config` — tokens live in CSS |
| UI primitives | shadcn-vue (`new-york` style) in `app/components/ui/` | generated/vendored, but see the note below — fixing a shared default here is sometimes correct |
| Design system | `app/components/brand/` | 16 `Brand*` primitives (includes `BrandToast`), the real API for building pages |
| Server state | `@tanstack/vue-query` | wrapped in composables |
| UI state | Pinia (`app/stores/`) | sidebar, app, auth, candidates |
| Forms | VeeValidate + Zod | |
| Icons | `lucide-vue-next` | import by name only |
| Mock API | MSW | `app/mocks/handlers/` |
| Tests | Vitest + happy-dom | standalone config, no `@nuxt/test-utils` |

**On "vendored, do not hand-edit" for `app/components/ui/`:** true by default, but if the *same*
visual bug shows up in more than one place because a shared shadcn primitive has a bad default
(transparent Select backgrounds, wrong dropdown shadow/radius, etc.), fix it once in the shared
component rather than overriding it per call-site. A per-instance override that already exists
elsewhere in the codebase is a strong signal the shared default is wrong — check for that pattern
before assuming the default is intentional.

## Directory map

```
app/
  pages/          file-based routes
  layouts/        default.vue · settings.vue · auth.vue  — only three, don't add more
  components/
    brand/        THE design system — start here on every new page
    ui/           shadcn-vue, vendored — see note above on when a shared fix is correct
    layout/       AppSidebar, AppHeader, TrialBanner
    settings/     11 shared Settings primitives (SettingsTable, SettingsFormModal, ...)
    talent-pools/ PoolDetail, PoolFormDialog, PoolMoveDialog, PoolFormBuilderDialog, etc.
    candidates/ jobs/ dashboard/ interviews/ onboarding/   feature components
  composables/    data + UI-logic composables (useCandidates, useJobs, useTalentPools, ...)
  stores/         Pinia: app · auth · candidates · sidebar
  types/          one *.types.ts per domain, re-exported from types/index.ts
  mocks/          MSW worker + handler files
  lib/            query-client.ts, utils.ts (cn helper)
  middleware/     auth.ts, subscription.ts
  assets/css/     main.css — ~130 --brand-* tokens
docs/superpowers/ design specs and implementation plans — write one before building anything
                  ported from an HTML prototype (see the porting workflow prompt)
eslint-rules/     custom rules: no-hex-colors, no-raw-tailwind-color
```

## Hard rules

### 1. No hex colors, no raw Tailwind color classes

Enforced by ESLint (`local/no-hex-colors`, `local/no-raw-tailwind-color`) — violations fail `npm run lint`.

```vue
<!-- WRONG -->
<div class="bg-[#C9FD13] text-gray-500 border-slate-200">

<!-- RIGHT -->
<div class="bg-[var(--brand-lime)] text-[var(--brand-text-muted)] border-[var(--brand-border)]">
```

All tokens live in `app/assets/css/main.css`. If you need a color that doesn't exist, **add the
token to `main.css` first**, then reference it. Never inline a value.

Before adding a new token, check whether the color is really new or is prototype-internal drift —
two slightly different hex values doing the same job (e.g. two reds both meaning "danger"). Collapse
those onto one existing token instead of adding a near-duplicate. When comparing a hex value against
existing tokens, rank candidates by **semantic name match first, RGB distance second** — the nearest
color by distance is sometimes the wrong token entirely (an avatar color, say) when a correctly-named
token (`--brand-success`, `--brand-warning`) exists a little further away in RGB space.

Exempt paths (already ignored in `eslint.config.mjs`): `app/components/ui/**`, `app/pages/design-system.vue`.

### 2. Reuse primitives — never re-implement a button, search bar, table shell, or empty state

Import from the barrel file:

```ts
import { BrandButton, BrandPageTitle, BrandSearchBar, BrandDataTable, BrandEmptyState, BrandToast } from '~/components/brand'
```

For Settings pages, also reuse `app/components/settings/`: `SettingsPageHeader`, `SettingsTable`,
`SettingsFormModal`, `SettingsConfirmDialog`, `SettingsRowMenu`, `SettingsToast`, etc.

Extract a new primitive only when the pattern is about to appear on a 2nd or 3rd page, or you'd
duplicate >10 lines of Tailwind. New primitives go in `app/components/brand/BrandXxx.vue` and get
exported from `index.ts`.

Before creating any component, check whether an equivalent already exists — `npm run lint:components`
catches near-duplicate names.

### 3. The layout shell is fixed

Every page renders inside `app/layouts/default.vue`:

```
TrialBanner
header (52px, --brand-canvas bg, no border-b)
flex row
  AppSidebar (canvas bg, no border-r)
  <main class="flex-1 overflow-auto">  ← your page
BrandToast (mounted once here — call useToast() from any page, don't remount it)
```

Settings pages use `definePageMeta({ layout: 'settings' })`. Auth pages use `'auth'`.
Do not add new layouts.

### 4. Follow the existing pattern in the nearest complete page

Before building anything, open the closest finished equivalent and mirror its structure exactly.

| Building | Copy the pattern from |
|---|---|
| Settings CRUD page | `app/pages/settings/locations.vue` |
| List view + filters + side filter panel + table | `app/pages/talent-pools.vue` + `app/components/talent-pools/PoolDetail.vue` |
| Detail page with tabs | `app/pages/candidates/[id].vue` |
| Multi-step form | `app/pages/jobs/new.vue` |
| Auth flow | `app/pages/auth/login.vue` |

Consistency with the existing code matters more than any improvement you could invent.

## Data layer

Server state goes through a composable in `app/composables/`, one per domain, returning Vue Query.
Mocks are read-only — mutations happen by seeding a local `ref` copy from the query result on
mount, then mutating that copy directly (see `talent-pools.vue`, `settings/locations.vue`). Keep
that pattern until the backend lands.

When two features describe the same people or records, **build one on top of the other rather than
inventing a parallel dataset.** Talent pools, for example, are built directly on
`ALL_CANDIDATES` in `candidates.handlers.ts` (exported for that reason) rather than a second
invented cast — a pool row's id is a real candidate id, so it opens the same profile the Candidates
module owns.

## Adding a mock endpoint

1. Create `app/mocks/handlers/<domain>.handlers.ts` exporting `<domain>Handlers`.
2. Import it and spread it into the array in `app/mocks/handlers/index.ts` — **above `...stubHandlers`**.
3. Use `await delay(350)` so loading skeletons stay visible in dev.
4. Response shape must mirror a plausible real API: `{ data: [...], total: n }`.
5. Add matching types in `app/types/<domain>.types.ts` and re-export from `app/types/index.ts`.

## Known landmines — don't silently reintroduce these

- **`nuxt.config.ts` → `app.pageTransition` must stay `false`.** It was `{ name: 'page', mode:
  'out-in' }` and silently broke every client-side route change app-wide: the URL updated but the
  page component never swapped. Reproduces on a clean dev server. Supplying the missing
  `.page-enter`/`.page-leave` CSS does **not** fix it — the cause isn't just absent styles. If you
  ever need page transitions, treat re-enabling this as its own task with its own verification, not
  a drive-by re-enable.
- `app/pages/settings/company.vue` and `settings/company-2.vue` are byte-identical duplicates —
  ask before deleting either.
- CSP is in `Content-Security-Policy-Report-Only` mode; don't flip it without being asked.

## Working style

- Follow the repo's own workflow: design spec → task-by-task plan → implement. Specs live in
  `docs/superpowers/specs/` — write one before porting anything from an HTML prototype (see the
  prompts file for the exact workflow).
- Prefer editing existing files over creating new ones. Don't create README or docs files unless asked.
- Don't add npm dependencies without asking — the stack is deliberately small.
- Verify changes in the browser, not just by reading the diff — this project has been caught out
  more than once by code that looked right and rendered wrong (a transparent background blending
  into the page canvas, a toolbar overflow pushing buttons off-edge). Screenshot or read the
  rendered DOM before calling something done.

## Definition of done

0. The person has looked at it in the browser and said they're satisfied.
1. `npm run lint` passes (colors, Nuxt/Vue rules).
2. `npm run test` passes.
3. Page renders inside the correct layout with no console errors.
4. Loading, empty, and error states all exist — use `BrandEmptyState` and the skeleton components.
5. Colors are tokens. Repeated markup is a primitive. Data goes through a composable.
6. Any new `/api/*` call has a matching MSW handler registered in `handlers/index.ts`.

---

## Why this file lives here, not in the repo

Three things are all true at once here, and no single file location satisfies all three:

1. This file needs to be **read automatically every session** — that means present on disk
   regardless of which git branch happens to be checked out.
2. It needs to be **backed up on GitHub**, not just sitting on one machine.
3. It must **never appear in a pull request to the teammate's repo** — not as a file addition, not
   even as a one-line `.gitignore` change, until explicitly asked to share it upstream.

A file tracked only on the git repo's `main` branch fails (1): checking out a feature branch that
never had the file removes it from the working tree. A file added to the feature branch fails (3):
it would ride along into any PR from that branch. The fix used here is two copies:

- **This copy** (`D:\Recruitera Product\CLAUDE.md`) — outside the git repo entirely, at the working
  directory Claude Code starts every session in. Nothing here can ever be part of a git operation,
  so it's permanently safe and always present, on every branch, with zero maintenance.
- **A backup copy**, same content, committed only on the fork's `main`
  (`origin/main` in `recruitera-V2.-Vue`) — satisfies "backed up on GitHub." Feature branches are
  always cut from `upstream/main`, never from `origin/main`, so this backup is structurally never
  part of a feature branch's history and can't leak into a PR diff.

If this file's content changes, update both copies. The outer one is what actually gets read.
