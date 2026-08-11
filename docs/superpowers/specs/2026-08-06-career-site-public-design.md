# Public Career Site + General Application + Employee Portal + Referrals — Design

**Date:** 2026-08-06
**Scope:** New public-facing pages, wired to the existing Career Site Builder (Settings), Talent Pools, and Jobs modules. Source PRDs pasted by the user (Career Site Builder, General Application, Employee Portal Access / Magic Link, Employee Referrals, Internal Application, Referral Form Builder) live only in chat — this doc is the implementation translation, not a copy of them.

## Explicit non-goals (per user instruction this session)

- Do not modify anything already shipped in Settings unless the public site genuinely cannot work without it. Flag before touching.
- Referral Form Builder (Settings → Templates → Referral, and the Employee Hub form-customization tab) is **already built** — consume it, don't rebuild it.
- No real backend exists (MSW only, per root CLAUDE.md). Every PRD requirement that's backend/infra-only (JWT signing, rate limiting, GDPR, DNS/subdomain provisioning, key rotation) has no UI surface here — it's out of scope by construction, not an oversight.

## Scope simplifications (backend-only PRD requirements translated to prototype terms)

- **Subdomain routing** (`[slug].recruitera.ai`) isn't achievable without real DNS. The public site lives at an in-app route instead (`/careers/*`); Settings' "Visit site" / "Copy link" point there. `previewDomain` display text is kept as cosmetic copy.
- **Magic-link email delivery** doesn't exist. The "For Employees" modal renders the full real flow (domain-suffixed email input → "Send me a sign-in email" → check-your-inbox state) for fidelity, **plus** a "Demo as Employee" button next to it (explicit user request) that sets the same verified session instantly, no email round-trip.
- **Employee Affiliate Link (Referral Mode 2) token infra, Smart Distribution, Bonus Program (E5/E6)**: these depend on pipeline/recruiter systems not in this codebase. Built to the observable-UI level only — "Copy my referral link" generates a `?ref=` URL and shows a toast; it does not simulate Smart Distribute assignment.
- **i18n (EN/AR)**: no `@nuxtjs/i18n` in the stack today and CLAUDE.md says don't add deps without asking. Scoped a small hand-rolled dictionary + `dir` toggle to just the `/careers/*` pages rather than pulling in a library — flagging this choice, not asking, since it's a low-risk default consistent with "the stack is deliberately small."
- **Internal "Referred" pipeline stage**: adding a new system stage type to the whole Jobs/Candidates pipeline is a cross-cutting change well beyond "build the career website." Referral submissions are tracked in their own lightweight `useReferrals` store (visible in the employee portal's "My Referrals") rather than as a new Kanban column.

## Data layer — what becomes shared vs stays local

| Today | Change |
|---|---|
| `settings/career-site.vue` — all branding/hero/values/testimonials/toggles are local `ref()`s, never leave the component | Lifted into `app/composables/useCareerSite.ts`, a module-scope singleton (same pattern as `useJobReferrals.ts`). Settings page becomes a consumer, not the owner. Public `/careers/*` pages read the same singleton — this is *the* link the user asked for. |
| `useJobs.ts` `FIXTURE` — no `description`/`employmentType`/`category`/`careerLevel` | Extend `Job` type with these as optional fields, backfill the 9 fixture jobs. Public job cards/detail read real jobs filtered by `status` (`published` → Opportunities, `internal` → Internal Opportunities), never an invented list. |
| Talent Pools `p1` "General Application" pool — already exists, pinned, system, in `talent-pools.handlers.ts` | No new pool needed. General Application form submit pushes a candidate + membership row directly into that handler's module-scope arrays (mirrors how `candidates.handlers.ts` exports `ALL_CANDIDATES` for reuse) so the next Talent Pools fetch picks it up. |
| Referral Question templates (Settings → Templates → Referral) | Consumed read-only by the public "Refer Someone" / Referral Form renderer. Not modified. |

## Routes (new)

```
/careers                      Home — hero, featured jobs (3-per-row, max 6), values, video, testimonials, employees CTA, general-application CTA
/careers/opportunities        Filters (Category/Type/Career Level/Job Type) + search/location/Find + results + general-application CTA
/careers/jobs/[id]             Job detail — open: full description + Apply + Refer Someone + Copy referral link (if employee); closed: "no longer available" + up to 6 same-department recommendations + general-application CTA
/careers/apply/general         General Application standalone form (Full Name, Email, Job Title, CV)
/careers/portal                Employee "My Referrals" + Internal Opportunities (only reachable once employee-verified)
```

All under `definePageMeta({ layout: false })` — not a 4th layout file (the CLAUDE.md "only three layouts" rule is about layout *files*; opting a page out entirely via `layout: false` doesn't add one). These pages own their full chrome (`CareerSiteHeader`, `CareerSiteFooter`) since they're candidate-facing, not ATS admin chrome.

Settings `career-site.vue`'s "Visit site" and "Copy link" point at `/careers` (relative, in-app) instead of the fictitious `https://{subdomain}.recruitera.ai`.

## Employee session

New `app/stores/employeePortal.store.ts`, sessionStorage-backed (mirrors `auth.store.ts`): `{ email, domain, verified }`. Drives:
- Header: "For Employees" button → "Internal Opportunities" tab + "Log out" once verified
- Internal jobs visibility (`status === 'internal'`)
- "Apply" on an internal job while verified → normal application form, tagged `Internal` / source `Internal Application` (same form component as public Apply, per PRD — no fork)
- "Refer Someone" / "Copy my referral link" visibility

## Build order

1. Job type + fixture enrichment, `useCareerSite.ts`, refactor Settings page onto it, wire Visit/Copy — foundation everything else needs
2. `/careers` + `/careers/opportunities` + `/careers/jobs/[id]` (public, unauthenticated path — this is the literal "career website" ask)
3. General Application (toggle already exists in `useCareerSite`) — CTA x3, form, pool wiring
4. Employee portal — session store, For Employees modal (+ Demo as Employee), Internal Opportunities, Internal Application
5. Referrals — Refer Someone form (existing templates), Copy referral link, My Referrals
6. `npm run lint`, `npm run test`, browser walkthrough of every new page + the Settings link-through, mobile filter drawer check
