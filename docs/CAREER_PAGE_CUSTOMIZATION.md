# Career Page — Customization Model (Fixed Template vs Company Config)

Only properties that exist in code are listed. Sources:
- **UCS** = `app/composables/useCareerSite.ts` (state interface L27–56, defaults L59–88, persistence L92–146, CSS vars L148–154)
- **SET** = `app/pages/settings/career-site.vue` (the admin builder that writes UCS)
- **SHELL / HOME / CTA** = `app/components/career/CareerShell.vue` / `CareerHome.vue` / `CareerApplyCta.vue`

## How configuration is stored

- One module-level `reactive<CareerState>` object (UCS L59). Every importer shares it.
- Hydrated from and saved to **`localStorage['cc-career-site']`** (UCS L92, L118, L133–135; 400ms debounce).
- Cross-tab live sync via the `storage` event (UCS L139–144); arrays replaced in place, then `syncRev++` (UCS L100–112) which re-keys the Values and Testimonials sections (HOME L154, L213).
- Back-compat: a saved object without `coverType` gets `'video'` if it has `coverVideoUrl`, else `'image'` (UCS L122–124).
- **There is no server storage, no company slug and no company ID.** A visitor sees the defaults below unless the same browser edited Settings.
- The only company data from an API is **`name`** (`GET /api/company`, `app/composables/useCompany.ts`), fallback `'Your Company'` (SHELL L16, HOME L17). `CompanyInfo.logoUrl` from the API is **not used** by the career page.

---

## Company-controlled properties

| # | Property | Type | Source | Default | Fallback | Consumed at | Affects |
|---|---|---|---|---|---|---|---|
| 1 | `companyName` | string | `/api/company` → `name`; or `CareerShell` prop `companyName` (never passed) | `'iCareer'` (MSW mock, `app/mocks/handlers/company.handlers.ts` L5) | `'Your Company'` | SHELL L43–44 (logo initial + name), L82–83 (footer); HOME L116, L118 (featured), L191 ("Inside {name}") | content (text width can wrap) |
| 2 | `logoUrl` | string (data URL) | UCS L40, L70; SET upload L309–313 (`image/png,image/jpeg,image/svg+xml`, L462) | `''` | initial-letter tile + name | SHELL L41–45 | **layout**: image (h32/36, max-w 130/150) vs tile+name |
| 3 | `primaryColor` → `--cc-primary` | `#RRGGBB` | UCS L35, L65, L149; SET L102, L108–113, hex validation L114–116 | `#4d7c0f` | — | ~40 places (buttons, links, chips, icons, gradients, tints) | branding only |
| 4 | `headerColor` → `--cc-header` | `#RRGGBB` | UCS L36, L66, L150; SET L103 | `#0f172a` | — | header bg, headings, culture band, CTA box, root text, footer name, tints | branding only |
| 5 | `btnColor` → `--cc-btn` | `#RRGGBB` | UCS L37, L67, L151 | `#4d7c0f` | — | **not consumed** (SET forces = primary, L108–113) | none |
| 6 | `ctaColor` → `--cc-cta` | `#RRGGBB` | UCS L38, L68, L152 | `#4d7c0f` | — | **not consumed** | none |
| 7 | `font` → `--cc-font` | string (family name) | UCS L39, L69, L153; SET options L118 | `'Geist'` | `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif` (SHELL L90) | whole page | branding; **metrics/wrapping change** if the font is installed. Font is never loaded. |
| 8 | `coverType` | `'image' \| 'video'` | UCS L41, L71; SET toggle L470–471 | `'image'` | — | HOME L50–51 | **layout**: selects hero variant |
| 9 | `coverUrl` | string (data URL, png/jpeg) | UCS L42, L72; SET L314–318 | `''` | gradient hero | HOME L51, L91, L93 | **layout**: image hero (no text), featured overlap −16/−48/−64 |
| 10 | `coverVideoUrl` | string (YouTube URL or video file URL) | UCS L43, L73; SET L296–303 (600ms debounce, sets coverType 'video') | `''` | gradient hero | HOME L45–50, L75–78 | **layout**: 94vh video hero, overlap −56/−64 |
| 11 | `headline` | string | UCS L45, L74 | `'Build the future of hiring with us'` | — | HOME L82, L101 | content (gradient + video heroes only) |
| 12 | `intro` | string | UCS L46, L75 | `'We help teams hire better and faster. Join a team that values craft, ownership, and candor — and do the best work of your career.'` | video hero hides `<p>` if empty; gradient hero renders empty `<p>` | HOME L83, L102 | content |
| 13 | `videoUrl` | string (YouTube or file URL) | UCS L48, L76 | `''` | section hidden | HOME L187–210 | **layout**: culture section appears |
| 14 | `values[]` | `{ icon: number; name: string; desc: string }[]` | UCS L24, L77–81; SET modal (name required) | 3 items: Ownership (0 Target), Craft (1 Gem), Candor (2 MessageSquare) | section hidden when empty; icon index fallback 0 | HOME L154–184 | **layout**: section visibility; count >3 (or >1 on <640px) switches to marquee; marquee duration |
| 15 | `testimonials[]` | `{ name; role; quote; photo? }[]` | UCS L25, L82–85; SET modal (name + quote required; photo `image/*` data URL) | Mariam Adel / Senior Engineer; Omar Khaled / Product Designer (no photos) | section hidden when empty; initials avatar when no photo | HOME L213–252 | **layout**: section visibility; controls only if >1 |
| 16 | `forEmployeesOn` | boolean | UCS L29, L61 | `true` | — | SHELL L53, L69 (buttons); CTA L8 (whole CTA section) | **layout** |
| 17 | `headerSticky` | boolean | UCS L32, L63 | `true` | — | SHELL L30 | **layout** (sticky vs static) |
| 18 | `headerFullWidth` | boolean | UCS L33, L64 | `false` | — | SHELL L31–37 | **layout** (pill vs bar; overlap −80 vs −64) |
| 19 | `employeeDomain` | string | UCS L53, L86 | `'acme.co'` | — | destructured in HOME L14 but **not rendered or used** | none |
| 20 | `generalApplicationOn` | boolean | UCS L28, L60 | `false` | — | **not consumed** by public pages | none |
| 21 | `published` | boolean | UCS L30, L62 | `true` | — | **not consumed** (page renders when "Draft") | none |
| 22 | `subdomain` | string | UCS L55, L87 | `'acme'` | — | only Settings preview (`{subdomain}.recruitera.ai`) | none |
| 23 | Jobs (published) | `Job[]` | `app/composables/useJobs.ts` static fixture | 5 published of 9 | — | HOME L19–21 | **layout**: grid columns by count (1 / 2 / 3+) |

Not configurable (hard-coded English in templates): "Home", "Opportunities", "For Employees", "العربية",
"View openings", "Discover our featured jobs" + description, "View all", filter labels, "What we stand for",
"The principles behind how we work", "Inside {name}", "A look inside our culture" + paragraph, "From the team",
"What it's like to work with us", "Real Stories from Real Employees" + paragraph, CTA title/description/button,
footer line, job blurb template (`app/utils/careerJob.ts` L23–26), favicon, page title (none set), language list,
section order, employee portal URL (does not exist), talent pool destination (does not exist).

---

## GROUP A — Fixed template rules (identical for every company)

| Area | Rule | Source |
|---|---|---|
| Containers | header 1200; content 1160 with 24px gutters (1112 inner); image hero 1520 with 8px gutters | SHELL L37, L39; HOME L92, L100, L112, L154, L188, L213; CTA L8; SHELL L81 |
| Header geometry | 16px outer padding, 64px row, padding 16/20/28, gap 16/32, radius 22, sticky z-40 | SHELL L27–39 |
| Overlaps | header −80 (pill) / −64; featured −112/−128 (gradient), −16/−48/−64 (image), −56/−64 (video); featured z-10 | SHELL L32; HOME L111 |
| Section rhythm | py 64 → 96 (≥768); headings → content 48px; footer py 40 | HOME L154, L188, L213; SHELL L81 |
| Hero geometry | gradient padding 112/160 → 144/192; video min-h 94vh; image frame padding-top 86 | HOME L73, L92, L100 |
| Grid | gap 20; columns by job count; max 6 jobs | HOME L21–28, L131 |
| Card dimensions | job p20 r18; value p24 r24 (344 / 50% / 100%; marquee 300/330); icon tile 48 r14 | HOME L133, L161, L174 |
| Radius system | 10, 11, 12, 13, 14, 18, 20, 22, 24, 9999 | see TOKENS |
| Shadows | all fixed (not tinted by brand) | see TOKENS |
| Neutral palette | #eceef1, #ececf0, #e3e6ea, #c3c8cf, #e6e8ec, #f0f1f4, #f7f8fa, #4b5563, #5b6472, #6b7280, #727a86, #8a919c, #3f4652 | HOME / SHELL |
| Tint ratios | 8 / 11 / 12 / 24 / 35 / 38 % of primary; 78 / 92 % of header; 45 % primary + #0b1220 | HOME / SHELL |
| Typography scale | all sizes, weights, line-heights, letter-spacings (TOKENS.typography) | — |
| Breakpoints | 640 / 768 / 1024 (+ JS 640 for values) | Tailwind defaults; HOME L41 |
| Motion | 150/200ms transitions; 6s testimonial autoplay; 0.35s fade; marquee 6s/item min 18s | HOME L38, L66, L282 |
| Section order | Hero → Featured → Values → Culture → Testimonials → CTA → Footer | HOME L70–256 |

## GROUP B — Company customization

Colors (`primaryColor`, `headerColor`), font name, logo, cover (type + image/video), headline, intro,
culture video URL, values list, testimonials list, `forEmployeesOn`, `headerSticky`, `headerFullWidth`,
company name (API), jobs (data).

## ⚠ Places where company configuration changes LAYOUT

1. `headerFullWidth` — header shape and overlap amount (−80 → −64).
2. `headerSticky` — sticky vs scrolling header.
3. `coverType` + `coverUrl` / `coverVideoUrl` — entirely different hero structure, height model (content / image aspect / 94vh), presence of hero text, and featured-panel overlap.
4. `logoUrl` — image box vs initial tile + name.
5. `forEmployeesOn` — header button + entire CTA section.
6. `videoUrl` — whole culture section.
7. `values.length` — section visibility and static-row vs marquee mode.
8. `testimonials.length` — section visibility and carousel controls.
9. Number of published jobs (and the collar filter) — grid column count.
10. `font` — only if the named font is installed locally; changes text metrics and wrapping.
11. Text lengths (headline, intro, company name, value/testimonial text) — heights and wrapping.
