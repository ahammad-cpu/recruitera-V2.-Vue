# Career Page — Implementation Reference (Source of Truth)

Reverse-engineered from this repository. **No application code was changed.**

- Page: `/careers` (Home of the public career site)
- Repo state audited: commit `3168a66` on `claude/brave-mayer-3lc8a7`; app code identical to `origin/main`.
- Method: (1) source code, (2) computed values measured in Chromium (Playwright) against
  a local `nuxt dev` of this exact code at 375 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1536 / 1920 px
  wide, viewport height 900px, in 5 configurations (default, cover image, 5 values, culture
  video, full-width header). No values below are estimated from screenshots.
- Measured heights depend on the rendered font. `Geist` is **not loaded** by the app (see §12),
  so the measurement machine used the `system-ui` fallback. Widths, paddings, gaps, radii,
  font sizes and positions are font-independent. Heights of text blocks are not.

Companion files:

| File | Content |
|---|---|
| `CAREER_PAGE_COMPONENT_MAP.md` | Routes, component tree, files, composables, packages |
| `CAREER_PAGE_TOKENS.json` | Machine-readable exact values |
| `CAREER_PAGE_CUSTOMIZATION.md` | Fixed template vs company-controlled properties |
| `CAREER_PAGE_RESPONSIVE.md` | Breakpoint-by-breakpoint behavior + measured boxes |
| `CAREER_PAGE_DATA_FLOW.md` | Route → config → API → component data flow |

### Path abbreviations used for source references

| Abbrev. | File |
|---|---|
| **SHELL** | `app/components/career/CareerShell.vue` |
| **HOME** | `app/components/career/CareerHome.vue` |
| **CTA** | `app/components/career/CareerApplyCta.vue` |
| **UCS** | `app/composables/useCareerSite.ts` |
| **CJ** | `app/utils/careerJob.ts` |
| **CSS** | `app/assets/css/main.css` |
| **TW** | Tailwind CSS v4 default theme (`tailwindcss/theme.css`, v4.3.2 resolved) |
| **PAGE** | `app/pages/careers/index.vue` |

Tailwind unit: `--spacing: 0.25rem` (TW default; not overridden in CSS). Root font size is the
browser default **16px** (measured `html` font-size = 16px; no `html{font-size}` rule in CSS),
so 1 spacing unit = 4px and `1rem = 16px`.

---

## 1. Where the Career Page lives

See `CAREER_PAGE_COMPONENT_MAP.md` for the full inventory. Summary:

- **Route** `/careers` → `PAGE` L1–15, `layout: false` (L6), client-only (`nuxt.config.ts` L91–92 `ssr:false`).
- **Components**: `SHELL` (theme root + header + footer), `HOME` (all sections), `CTA` (talent pool box). Nothing else.
- **State**: `UCS` module-level reactive store persisted to `localStorage['cc-career-site']`.
- **Data**: `useCompany()` → `GET /api/company` (MSW mock), `useJobs()` → static in-memory fixture.
- **Styling**: Tailwind v4 utilities + inline `:style` + 2 scoped `<style>` blocks + global `CSS`.
- **Icons**: `lucide-vue-next` 0.468.0. **Fonts**: none loaded. **i18n**: none.

```
CareerShell (div.cc-root)
├── header (sticky) ─ pill ─ row: logo · nav · [For Employees] [العربية] [menu]
│                        └── mobile dropdown nav
├── CareerHome
│   ├── Hero (video | image | gradient — exactly one)
│   ├── section#jobs  Featured jobs panel (filters + grid of job cards)
│   ├── Values ("What we stand for") — static row | marquee
│   ├── Culture video (only if videoUrl)
│   ├── Testimonials ("From the team")
│   └── CareerApplyCta (only if forEmployeesOn)
└── footer
```

---

## 2. Global page layout

| Property | Value | Source |
|---|---|---|
| Page root element | `div.cc-root` `position:relative; min-height:100vh; background:#fff` | SHELL L23 (`relative min-h-screen bg-white`) |
| Root text color | `color-mix(in srgb, var(--cc-header) 92%, transparent)` → default `rgba(15,23,42,0.92)` (measured `color(srgb 0.0588 0.0902 0.1647 / 0.92)`) | SHELL L23 |
| Root font-family | `var(--cc-font), -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif` → default resolves to `Geist, -apple-system, …` | SHELL L90 (scoped style) + UCS L69, L153 |
| Theme CSS vars on root | `--cc-primary`, `--cc-header`, `--cc-btn`, `--cc-cta`, `--cc-font` (inline style) | SHELL L23 `:style="themeVars"`; UCS L148–154 |
| `body` background (outside root) | `var(--brand-canvas)` = `#f7f8f9` — hidden because `.cc-root` is white and ≥100vh | CSS L274 + L61 |
| `body` font-family (overridden by `.cc-root`) | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif` | CSS L276 |
| `body` extras that DO apply inside the page | `-webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; font-feature-settings: "tnum" 1` (tabular numbers) | CSS L277–279 |
| `html, body` | `height:100%; margin:0; padding:0` | CSS L268–272 |
| Box sizing | `* { box-sizing: border-box }` | CSS L265–267 (+ Tailwind preflight) |
| Base line-height | `1.5` (Tailwind preflight on `html`) — every text element **without** a `leading-*` class uses 1.5 | TW preflight L30 |
| Root font size | 16px (browser default) | measured |
| Scroll behavior | browser default (`auto`). Only `scrollToJobs()` uses `scrollIntoView({behavior:'smooth'})` | HOME L53 |
| Reduced motion | global: all animation/transition durations 0.01ms, `scroll-behavior:auto !important` | CSS L298–308 |
| Horizontal overflow | none at any tested width (`documentElement.scrollWidth === viewport`) — hero, values marquee and testimonials use `overflow:hidden` | measured; HOME L73, L90, L98, L172, L218 |
| Focus ring (global) | `outline: 2px solid var(--brand-teal)` (#002427), `outline-offset: 2px`, `border-radius: 6px` on `a, button, input, select, [tabindex]` `:focus-visible` | CSS L284–296 |
| Scrollbar (WebKit) | 8px, thumb `#d5dad0`, radius 6px, transparent track | CSS L338–342, L149 |

### Containers

| Container | max-width | Horizontal padding | Resulting max content width | Source |
|---|---|---|---|---|
| Header outer (pill mode) | none | 16px (`px-4`) | — | SHELL L31 |
| Header pill | 1200px (`max-w-[1200px]`), centered | — | 1200px | SHELL L37 |
| Header row | 1200px | 16 / 20 (≥640) / 28 (≥768) px | 1144px at ≥768 in pill | SHELL L39 |
| Gradient hero content | 1160px | 24px (`px-6`) | 1112px | HOME L100 |
| Image hero frame | 1520px | 8px (`px-2`) | 1504px | HOME L92 |
| Video hero content | full width (`w-full`) | 24 / 40 (≥640) / 64 (≥1024) px | viewport − 2×pad | HOME L81 |
| Featured jobs | 1160px | 24px | panel 1112px | HOME L112 |
| Values section | 1160px (the **section itself**) | 24px | 1112px | HOME L154 |
| Culture video inner | 1160px (band is full-bleed) | 24px | 1112px | HOME L188 |
| Testimonials section | 1160px (the section itself) | 24px | 1112px | HOME L213 |
| CTA section | 1160px | 24px | 1112px | CTA L8 |
| Footer inner | 1160px | 24px | 1112px | SHELL L81 |

The app's global `.page-container` (max 1280, `--grid-margin`) and `.page-grid` (CSS L245–262)
are **not used** by the Career Page.

### Vertical rhythm (section spacing)

| Section | padding-top / bottom | Source |
|---|---|---|
| Gradient hero content | 112 / 160px; ≥768: 144 / 192px | HOME L100 `pt-28 pb-40 md:pt-36 md:pb-48` |
| Featured jobs | pulled up (negative margin, §22); no padding of its own | HOME L111 |
| Values | 64 / 64px; ≥768: 96 / 96px | HOME L154 `py-16 md:py-24` |
| Culture video | 64 / 64px; ≥768: 96 / 96px | HOME L188 |
| Testimonials | 64 / 64px; ≥768: 96 / 96px | HOME L213 |
| CTA | 0 / 64px; ≥768: 0 / 96px | CTA L8 `pb-16 md:pb-24` |
| Footer | 40 / 40px | SHELL L81 `py-10` |

There is **no gap** between the featured-jobs section and the values section other than the values'
own top padding (measured: values section starts exactly where `#jobs` ends).

---

## 3. Navigation / header

Source: SHELL L27–75. Default config: `headerSticky: true`, `headerFullWidth: false` (UCS L63–64).

| Property | Pill mode (default) | Full-width mode | Source |
|---|---|---|---|
| Element | `<header>` | same | SHELL L27 |
| Position | `sticky; top:0` (if `headerSticky`) else `relative` | same | L30 |
| z-index | 40 | 40 | L28 |
| Outer padding | `16px 16px 0` | 0 | L31 |
| Bottom margin (overlap) | `-80px` (when `heroOverlap`) | `-64px` | L32 |
| Measured header box | height 80px (16 + 64) | height 64px | measured |
| Bar max-width | 1200px, `margin: 0 auto` | none (100%) | L37 |
| Bar radius | 22px | 0 | L37 |
| Bar overflow | hidden (clips mobile dropdown into the pill) | visible | L37 |
| Bar shadow | `0 14px 38px rgba(10,15,25,0.28)` | `0 2px 16px rgba(0,0,0,0.14)` | L36–37 |
| Bar background | `var(--cc-header)` (default `#0f172a`) | same | L38 |
| Bar border | none | none | — |
| Backdrop filter | none | none | — |
| Row | `max-width:1200px; margin:0 auto; height:64px; display:flex; align-items:center` | same | L39 |
| Row padding-x | 16px; ≥640: 20px; ≥768: 28px | same | L39 `px-4 sm:px-5 md:px-7` |
| Row gap | 16px; ≥640: 32px | same | L39 `gap-4 sm:gap-8` |
| Measured pill width | `min(1200, viewport − 32)`: 343 @375 · 736 @768 · 992 @1024 · 1200 @≥1232 | full viewport; row centered 1200 | measured |

**Scrolling behavior**: `position: sticky` inside `.cc-root`; it stays at `top:0` for the whole
page. Styling **does not change** after scrolling (no scroll listener, no class toggle). It never
becomes `fixed`. It is centered relative to the viewport (not a page container). With
`headerSticky:false` it scrolls away with the page.

### Logo (SHELL L40–46)
- Wrapper: `NuxtLink` → `/careers`, `display:flex; align-items:center; gap:10px; flex-shrink:0; min-width:0`.
- Uploaded logo (`logoUrl` truthy): `<img>` `height:32px` (≥640: 36px), `max-width:130px` (≥640: 150px), `object-fit:contain`, `alt=""`. L41.
- Fallback: tile `36×36`, `border-radius:10px`, bg `var(--cc-primary)`, first character of company name, 15px / 800 / white (L43); name 16px (≥640: 17px) / 700 / white / `letter-spacing:-0.01em` / `truncate` (L44). Measured tile at x=32 (375px) and x=44 (768–1024px).

### Nav links (SHELL L47–50)
- `display:none`; ≥640: `flex`, `gap:28px`, 15px / 600.
- Active: `color: var(--cc-primary)` (inline style). **No underline, no border, no background.**
- Inactive: `color: rgba(255,255,255,0.65)`; hover `#fff`; `transition` (150ms, `cubic-bezier(0.4,0,0.2,1)`).
- Active logic: `isHome = !route.path.startsWith('/careers/opportunities')` (L17). On `/careers`, "Home" is active.

### Right actions (SHELL L51–60): `margin-left:auto; display:flex; align-items:center; gap:10px`
| Button | Size | Style | Visible | Source |
|---|---|---|---|---|
| For Employees | h 40px, px 20px; measured 151.31×40 | radius 999px, bg `var(--cc-primary)`, 13.5px / 700 white, `line-height:1`; hover `brightness(1.1)`; active `scale(.96)`; 150ms | ≥640 **and** `forEmployeesOn` | L53 |
| Language | h 40px, px 14px; measured 94.84×40 | radius 999px, `1px solid rgba(255,255,255,.25)`, 13px / 600 white, Globe 16px (stroke 1.9) + "العربية", gap 6px; hover bg `rgba(255,255,255,.1)`; active `scale(.96)` | ≥640 | L54 |
| Menu toggle | 44×44, `margin-right:-6px` | radius 12px, white `Menu`/`X` 24px (stroke 2), `aria-expanded`, `aria-label="Menu"`; active `scale(.9)` | <640 | L56–59 |

Neither "For Employees" nor the language button has a click handler (no navigation, no language switch).

### Mobile dropdown (SHELL L64–73)
- Shown when `menuOpen` and <640. Inside the pill (pill grows; measured pill height 64 → **303px**).
- `border-top:1px solid rgba(255,255,255,.1); padding: 8px 16px 16px`.
- Links: `display:flex; align-items:center; height:48px; padding:0 12px; radius 12px; 16px / 600`; active `var(--cc-primary)`; inactive white 80%, hover bg white 5%; active `scale(.98)`.
- Buttons block: `margin-top:12px; flex-direction:column; gap:10px`. "For Employees" (if `forEmployeesOn`): h 48, radius 12, 15px / 700, bg primary. Language: h 48, radius 12, 1px white 25% border, 15px / 600, Globe 16px, gap 6px.
- Measured item boxes @390: Home y=89 h48, Opportunities y=137, For Employees y=197, العربية y=255 (width = pill − 32).
- Transition `cc-menu`: enter/leave `opacity .2s ease, transform .24s cubic-bezier(0.22,1,0.36,1)`, from/to `opacity:0; translateY(-8px)`. Reduced motion: `opacity .15s`, no transform. SHELL L91–97.
- Closes on route change (`watch(route.path)` L19). Does not close on outside click or Escape.

---

## 4. Hero

Exactly one of three variants renders (HOME L50–51):

```
heroIsVideo = coverType === 'video' && (YouTube id found in coverVideoUrl || ccIsVideoFile(coverVideoUrl))
heroImage   = coverType === 'image' && !!coverUrl
else        → gradient hero
```
Defaults (`coverType:'image'`, `coverUrl:''`) → **gradient hero**.

### 4a. Gradient hero (default) — HOME L98–107
| Property | Value |
|---|---|
| Section | `position:relative; overflow:hidden`; height = content (no fixed/min height, no vh, no aspect-ratio) |
| Background layer | `position:absolute; inset:0; background: linear-gradient(135deg, var(--cc-primary), color-mix(in srgb, var(--cc-primary) 45%, #0b1220))` (L99) |
| Content | `position:relative; max-width:1160px; margin:0 auto; padding:112px 24px 160px` (≥768: `144px 24px 192px`); text white; left-aligned |
| H1 | `font-size: clamp(2rem, 5vw, 3.6rem)` (32 → 57.6px); 800; `line-height:1.05`; `letter-spacing:-0.03em`; `max-width:18ch`; `text-wrap:balance` (L101) |
| Intro `<p>` | margin-top 20px; 15px (≥768: 16.5px); `line-height:1.625`; `rgba(255,255,255,.85)`; `max-width:56ch` (L102). Rendered even if `intro` is empty. |
| CTA row | margin-top 36px; `flex; flex-wrap:wrap; gap:12px` (L103) |
| CTA "View openings" | `inline-flex; align-items:center; gap:8px; height:48px; padding:0 24px; radius 13px; bg #fff; color var(--cc-primary); 15px/700`; ArrowRight 18px stroke 2.2; hover `brightness(.95)`; active `scale(.97)`; 150ms. Measured 197.13×48. Click → `scrollToJobs()` smooth-scrolls to `#jobs` (L104, L53) |
| Measured height | 540.69 @375 · 574.25 @768 · 601.13 @1024 · 614.56 @≥1280 (font-dependent) |
| Measured H1 | 32px @≤640 · 38.4 @768 · 51.2 @1024 · 57.6 @≥1152 |

### 4b. Image hero — HOME L90–95
| Property | Value |
|---|---|
| Section | `relative; overflow:hidden`; height = 86px + photo height |
| Blurred fill | same `coverUrl` `<img>`: `absolute; inset:0; w/h 100%; object-fit:cover; transform:scale(1.25); filter:blur(40px)` (`blur-2xl` = 40px, TW), `aria-hidden` |
| Frame | `relative; max-width:1520px; margin:0 auto; padding: 86px 8px 0` |
| Photo | `display:block; width:100%; height:auto` (**native aspect ratio, never cropped**), `border-radius: 24px 24px 0 0`, `box-shadow: 0 16px 50px rgba(0,0,0,.28)` |
| object-position | not set (default `50% 50%`, only affects the blurred fill) |
| No text / no CTA | the headline, intro and "View openings" are **not rendered** in this variant |
| Measured (4:1 test image) | photo 359×89.75 @375 · 752×188 @768 · 1008×252 @1024 · 1424×356 @1440 · 1504×376 @≥1536; hero height = 86 + photo height |
| Settings hint | upload accepts `image/png,image/jpeg`, label says "(4:1)" (`settings/career-site.vue` L480, L485) |

### 4c. Video hero — HOME L73–86
| Property | Value |
|---|---|
| Section | `relative; overflow:hidden; min-height:94vh; display:flex; align-items:flex-end; background:#000` |
| Media box | `absolute; inset:0; overflow:hidden` |
| YouTube | `<iframe>` centered with `translate(-50%,-50%)`, `width:177.78vh; min-width:100%; height:56.25vw; min-height:100%; pointer-events:none` (16:9 cover); src `https://www.youtube.com/embed/{id}?autoplay=1&mute=1&loop=1&playlist={id}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1` (L75–77) |
| File video | `<video>` `absolute inset-0 w-full h-full object-fit:cover`, `autoplay muted loop playsinline` (L78) |
| Overlay | `linear-gradient(to top, rgba(8,14,22,.86) 0%, rgba(8,14,22,.42) 42%, rgba(8,14,22,.10) 100%)` (L80) |
| Text block | `relative; width:100%; padding: 0 24px 112px` (≥640 px 40px; ≥768 pb 128px; ≥1024 px 64px); white; bottom-left (L81) |
| H1 / intro | same as 4a; intro only `v-if="intro"` (L83) |
| CTA | same button, `margin-top:32px` (L84) |

Fallbacks: no static fallback asset. No poster image. Media does not change on mobile. Company
media is injected as `coverUrl` / `coverVideoUrl` strings from `UCS` (data URL for uploaded images).

---

## 5. Featured jobs

### Outer — HOME L111–113
| Property | Value | Source |
|---|---|---|
| Section | `id="jobs"; position:relative; z-index:10` | L111 |
| Overlap (negative margin-top) | gradient: **−112px** (≥768 **−128px**) · video: −56px (≥768 −64px) · image: −16px (≥640 −48px, ≥768 −64px) | L111 |
| Container | max-width 1160px, centered, padding-x 24px | L112 |
| Panel | `border-radius:22px; background:#fff; border:1px solid #eceef1; box-shadow:0 28px 70px rgba(15,23,42,0.12); padding:28px` (≥768 **40px**) | L113 |
| Measured panel | 327 wide @375 · 720 @768 · 976 @1024 · 1112 @≥1160 | measured |

### Header row — HOME L114–121
`display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px`.

| Element | Style | Source |
|---|---|---|
| Company name (eyebrow) | `div`, `clamp(1.3rem, 2.8vw, 1.7rem)` (20.8 → 27.2px), 700, `letter-spacing:-0.01em`, `var(--cc-primary)`, line-height 1.5 | L116 |
| H2 "Discover our featured jobs" | margin-top 8px, `clamp(1.35rem, 3vw, 1.9rem)` (21.6 → 30.4px), **600**, `var(--cc-header)`, line-height 1.5 (measured 21.6/32.4 @≤720, 30.4/45.6 @≥1013) | L117 |
| Paragraph | margin-top 8px, 14.5px, `line-height:1.625`, `#6b7280`, `max-width:500px`; copy interpolates company name | L118 |
| "View all" | `inline-flex; gap:6px; height:40px; padding:0 16px; radius 11px; border:1.5px solid var(--cc-primary); color primary; 13.5px/600`; ArrowRight 16px stroke 2; hover bg `color-mix(primary 8%, white)`; active `scale(.96)`. Measured 115.53×40. Emits `view-all` → `/careers/opportunities` | L120; PAGE L8 |
| Wrap behaviour | When text block + button don't fit, the button wraps below, left-aligned (measured at 375–430px) | measured |

### Filters — HOME L123–129
| Property | Value |
|---|---|
| Row | margin-top 24px; `flex; flex-wrap:wrap; gap:10px` |
| Pills | `All`, `White Collar`, `Blue Collar` (keys `all/white/blue`) |
| Size | height 36px; padding 0 16px; `border-radius:9999px`; 13px / 600. Measured widths 50.98 / 124.19 / 113.53 |
| Active | inline `background: var(--cc-primary); color:#fff`; no border |
| Inactive | `background:#fff; border:1px solid #e3e6ea; color:#4b5563`; hover `border-color:#c3c8cf` |
| Press | `scale(.95)`; `transition` 150ms |
| Focus | global focus-visible ring only (CSS L284) |
| Mobile | wraps: at 375 / 390 "Blue Collar" drops to a 2nd line (y +46 = 36 + 10 gap) |
| State | `collar` ref, default `'all'` (HOME L20). Filters `openRoles` by `job.collar` (L21). No URL sync. |

### Job grid — HOME L131, L23–28
- `display:grid; gap:20px; margin-top:28px`.
- Columns depend on **the number of featured jobs `n`** (max 6, L21):

| n | Classes | <640 | 640–1023 | ≥1024 |
|---|---|---|---|---|
| 0 or 1 | `grid-cols-1 max-w-[560px]` | 1 col, max 560 | 1 col, max 560 | 1 col, max 560 |
| 2 | `grid-cols-1 sm:grid-cols-2` | 1 | 2 | 2 |
| 3–6 | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | 1 | 2 | 3 |

- `grid-template-columns: repeat(N, minmax(0, 1fr))`. Measured card widths (n=5): 269 @375 · 284 @390 · 324 @430 · 309 @768 · 284.66 @1024 · 330 @≥1160.
- Row gap = column gap = 20px.

### Job card — HOME L132–147 (`<button type="button">`)
| Property | Value |
|---|---|
| Box | `position:relative; display:flex; flex-direction:column; text-align:left; border-radius:18px; border:1px solid #ececf0; background:#fff; padding:20px` |
| Height | content-driven; rows stretch to the tallest card (grid default). Measured 211px (system font); no min/max height |
| Hover | `translateY(-4px)`, `border-color: var(--cc-primary)`, `box-shadow: 0 20px 46px rgba(15,23,42,0.10)`, title color → primary; `transition` 200ms |
| Active | `translateY(0) scale(.99)` |
| Cursor | default (Tailwind v4 preflight does not set `cursor:pointer` on buttons; the CSS doesn't either) |
| Top row | `flex; align-items:center; justify-content:space-between; gap:12px` (L136) |
| Department chip | only `v-if="job.department"`: `inline-flex; height:24px; padding:0 10px; radius 9999px; 11.5px/600; bg color-mix(primary 11%, white); color primary` (L137) |
| Work-mode badge | `margin-left:auto; inline-flex; gap:6px; height:24px; padding:0 10px; radius 9999px; border 1px #e6e8ec; 11.5px/600; #5b6472`; leading dot 6×6 round `var(--cc-primary)`; text `ccWorkLabel()` → `On-site` / `Remote` / `Hybrid` (L138; CJ L14–16) |
| Title `<h3>` | margin-top 14px; 17px / 700; `line-height:1.375`; `letter-spacing:-0.01em`; `var(--cc-header)`; hover → primary (`transition-colors`) (L140) |
| Blurb `<p>` | margin-top 8px; 13.5px; `line-height:1.625`; `#727a86`; **`line-clamp:2`**; `flex:1` (pushes footer down) (L141). Text = `ccBlurb(job)` (CJ L23–26) |
| Footer | margin-top 20px; padding-top 16px; `border-top:1px solid #f0f1f4`; `flex; flex-wrap:wrap; align-items:center; column-gap:16px; row-gap:6px`; 12.5px / 500; `#727a86` (L143) |
| Footer items | `inline-flex; gap:6px`: `MapPin` 14px stroke 1.9 + `job.location` (only if set); `Briefcase` 14px + `ccEmploymentType(job)` → `Shift Based` (blue) / `Full-time` (white) (L144–145; CJ L11–13) |
| Click | emits `open-job(id)` → `navigateTo('/careers/jobs/{id}')` (PAGE L7) |

### Empty state
**There is none.** If `featured` is empty (e.g. no published jobs, or a collar with no jobs), the
grid renders with class `grid-cols-1 max-w-[560px]` and **zero children** — only the
28px margin-top remains. No icon, no text. (HOME L23–25, L131–148.) There is also no
loading skeleton: jobs are synchronous; company name falls back to `'Your Company'` while loading.

---

## 6. Values ("What we stand for") — HOME L154–184

Renders only `v-if="values.length"`. Keyed by `syncRev` (re-mounts on cross-tab sync).

| Property | Value | Source |
|---|---|---|
| Section | `max-width:1160px; margin:0 auto; padding: 64px 24px` (≥768 `96px 24px`) | L154 |
| Heading block | `text-align:center; max-width:46ch; margin:0 auto` | L155 |
| Eyebrow | "What we stand for", 13px / 800 / uppercase / `letter-spacing:0.14em` / primary | L156 |
| H2 | "The principles behind how we work", margin-top 8px, `clamp(1.8rem, 3.8vw, 2.6rem)` (28.8 → 41.6px), 800, `letter-spacing:-0.02em`, `text-wrap:balance`, header color, line-height 1.5 | L157 |
| Cards area | margin-top 48px | L160 / L172 |

**Mode switch** (L62–63, L41–42):
```
isMobile   = window.innerWidth < 640   (set in onMounted and on window resize)
valuesLoop = values.length > 3 || (isMobile && values.length > 1)
```

### Static row (`!valuesLoop`) — L160–169
- `display:flex; flex-wrap:wrap; justify-content:center; gap:20px`.
- Card width: `100%`; ≥640 `calc(50% - 0.625rem)` (= 50% − 10px); ≥1024 **344px**.
- Measured: 768 → 350 + 350, 3rd card centered on row 2; **1024 → 344 + 344, 3rd card on row 2** (content width 976 < 3×344 + 2×20 = 1072); ≥1120 (content ≥ 1072) → 3 in one row (measured at 1280+).

### Marquee (`valuesLoop`) — L172–183 + scoped CSS L262–280
- Mask wrapper: `margin-top:48px; overflow:hidden; mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)` (+ `-webkit-` prefix).
- Track: `display:flex; width:max-content`; animation `cc-marquee` (`translateX(0)` → `translateX(-50%)`), `linear`, `infinite`, `will-change:transform`, duration `max(18, values.length × 6)` seconds (L66). Measured 18s (3 values), 30s (5 values).
- Items = values duplicated (`[...values, ...values]`, L64). Card `flex-shrink:0; width:300px` (≥640 **330px**); `margin-right:20px`.
- `.cc-marquee:hover { animation-play-state: paused }`. Reduced motion: `animation: none`.
- Direction: right-to-left. No drag/swipe. No arrows/dots.

### Value card (both modes)
| Property | Value |
|---|---|
| Box | `border-radius:24px` (**`rounded-2xl` is overridden to 24px** in CSS L219; measured 24px); `border:1px solid #ececf0`; bg #fff; padding 24px; `text-align:center` |
| Hover | `translateY(-4px)`; `box-shadow:0 20px 46px rgba(15,23,42,0.08)`; `border-color: color-mix(in srgb, var(--cc-primary) 35%, #ececf0)`; 200ms |
| Icon tile | 48×48; `margin:0 auto`; grid center; radius 14px; bg `color-mix(primary 12%, white)`; `box-shadow: inset 0 0 0 1px color-mix(primary 24%, white)`; hover `scale(1.05)` (200ms) |
| Icon | lucide component from `CAREER_VALUE_ICONS[v.icon]` (fallback index 0 = Target), 22×22, stroke 1.9, primary |
| Name `<h3>` | margin-top 20px; 17px / 700; header color |
| Description | margin-top 6px; 14px; `line-height:1.625`; `#6b7280` |
| Measured height | 195px (system font) |

---

## 7. Culture video — HOME L187–210

Renders only `v-if="videoUrl"` (default `''` → hidden).

| Property | Value |
|---|---|
| Band | full-bleed `<section>`, `background: var(--cc-header)`; no fixed height |
| Inner | `max-width:1160px; margin:0 auto; padding:64px 24px` (≥768 96px); `display:grid; gap:40px` (≥1024 `56px`); ≥1024 `grid-template-columns: repeat(2, minmax(0,1fr)); align-items:center` (**50/50**) |
| Measured | stacked below 1024 (frame 720×405 @768); 460+460 @1024; 528+528 @≥1160; band height 489px @≥1280 |
| Eyebrow | "Inside {companyName}", 13px / 800 / uppercase / `letter-spacing:0.16em` / primary |
| H2 | "A look inside`<br>`our culture", margin-top 16px, `clamp(2rem, 4.4vw, 3.1rem)` (32 → 49.6px), 800, `line-height:1.08`, `letter-spacing:-0.025em`, white |
| Paragraph | margin-top 20px, 16px, `line-height:1.625`, `rgba(255,255,255,.65)`, `max-width:46ch` |
| Video card | `position:relative; aspect-ratio:16/9; border-radius:20px; overflow:hidden; box-shadow:0 30px 80px rgba(0,0,0,0.45)` + ring `0 0 0 1px rgba(255,255,255,.1)` |
| Poster | YouTube: `https://img.youtube.com/vi/{id}/hqdefault.jpg`, cover; overlay `linear-gradient(135deg, rgba(8,14,22,.55), rgba(8,14,22,.35))`. Non-YouTube: no image, overlay `linear-gradient(135deg, color-mix(header 55%, #000), color-mix(primary 45%, #000))` |
| Play button | whole card is a `<button aria-label="Play culture video">`; centered 64×64 circle, bg primary, Tailwind `shadow-lg` (`0 10px 15px -3px rgb(0 0 0/.1), 0 4px 6px -4px rgb(0 0 0/.1)`); `Play` icon 24px white filled, `translateX(2px)`; hover circle `scale(1.1)` 200ms; press card `scale(.995)` |
| Click | `videoPlaying = true` (local ref, L31) → **inline** swap (no modal): YouTube `<iframe src="https://www.youtube.com/embed/{id}?autoplay=1&rel=0" allowfullscreen>`; otherwise `<video src=videoUrl autoplay controls playsinline>`. No transition. Cannot return to poster. |
| YouTube id regex | `/(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/` (L30) |

---

## 8. Testimonials — HOME L213–252

Renders only `v-if="testimonials.length"`. Keyed by `syncRev`.

| Property | Value |
|---|---|
| Section | max 1160, padding 64px 24px (≥768 96px) |
| Heading block | centered, `max-width:46ch`, **margin-bottom 48px**; eyebrow "From the team" (13/800/uppercase/0.14em/primary); H2 "What it's like to work with us" (same style as values H2) |
| Box | `display:grid; overflow:hidden; border-radius:24px; border:1px solid #ececf0; box-shadow:0 24px 64px rgba(15,23,42,0.07)`; ≥1024 `grid-template-columns: minmax(0,1fr) minmax(0,1.08fr)` |
| Measured box | 1112×502 @≥1160 (cols 533.64 / 576.36); 976×502 @1024 (468.27 / 505.73); stacked below 1024 |
| Left panel | `position:relative; display:flex; flex-direction:column; justify-content:space-between; gap:32px` (≥768 48px); padding 32px (≥768 56px); `min-height:0` (≥768 **440px**, ≥1024 **500px**); bg `color-mix(in srgb, var(--cc-primary) 38%, white)` |
| Quote icon | lucide `Quote`, 56×56, `fill:currentColor; stroke-width:0`, `rgba(255,255,255,.6)` |
| Left H2 | "Real Stories from Real Employees", `clamp(1.7rem, 3.4vw, 2.4rem)` (27.2 → 38.4px), 800, `line-height:1.1`, `letter-spacing:-0.02em`, header color |
| Left paragraph | margin-top 16px, 15px, `line-height:1.625`, `color-mix(in srgb, var(--cc-header) 78%, white)` |
| Right panel | `position:relative; display:flex; flex-direction:column; background:#fff; padding:36px` (≥768 56px) |
| Slide | `<Transition name="cc-fade" mode="out-in">` keyed by `tIndex`; `opacity .35s ease` (HOME L282–283); slide `flex:1` |
| Person row | `flex; align-items:center; gap:16px`. Avatar 48×48 round: `photo` (`object-fit:cover`) or initials circle bg primary, white 14px/700 (`initials()` = first letters of first 2 words, uppercase, `'?'` fallback, L52) |
| Name | 16px / 700 / header color. Role (only if set): 13px `#8a919c` |
| Quote | `<blockquote>` margin-top 24px; 16px (≥768 17px); `line-height:1.625`; `#3f4652`; wrapped in literal `"` characters |
| Controls | only if `testimonials.length > 1`: margin-top 32px; `flex; align-items:center; gap:12px` |
| Arrows | 40×40 circle, `border:1px solid #e6e8ec`, ChevronLeft/Right 20px header color; hover bg `#f7f8fa`; press `scale(.9)`; `aria-label` Previous / Next |
| Dots | wrapper `margin-left:8px; gap:8px`; each `height:8px; border-radius:9999px; bg primary`; active `width:24px`; inactive `width:8px; opacity:.3` (hover .6); `transition-all` 150ms; `aria-label="Testimonial {n}"` |
| Autoplay | `setInterval(goT(1), 6000)` started `onMounted` if >1 item (L38, L42); stops on `mouseenter` of the box, restarts on `mouseleave` (L218); pauses when `document.hidden` (L40) |
| Swipe | **none** (no touch handlers) |
| Data | `CareerTestimonial { name: string; role: string; quote: string; photo?: string }` (UCS L25) |

---

## 9. Talent Pool CTA — CTA L8–16

| Property | Value |
|---|---|
| Condition | `v-if="forEmployeesOn"` (**not** `generalApplicationOn`) (CTA L8) |
| Section | max 1160, `margin:0 auto`, `padding: 0 24px 64px` (≥768 bottom 96px) |
| Box | `border-radius:20px; padding:32px` (≥768 40px); bg `var(--cc-header)`; `display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:20px`; no fixed height |
| Measured | 1112×135 @≥1160 (single row); 976×135 @1024; wraps when text + button do not fit (measured: wrapped at ≤768px — 342×238 @390, 720×203 @768; single row at ≥1024) |
| Title | "Can't find your desired job?" 20px / 700 white (line-height 1.5) |
| Description | margin-top 4px, 14px, `rgba(255,255,255,.7)` |
| Button | "Join Talent Pool": height 48, padding 0 24px, radius 13, bg primary, white 15px/700; hover `brightness(1.1)`; press `scale(.97)`. Measured 178.48×48 |
| Click destination | **none** (no handler, no link) |

---

## 10. Footer — SHELL L80–85

| Property | Value |
|---|---|
| Box | `border-top:1px solid #eceef1; background:#fff`; measured height 126.25px (font-dependent) |
| Inner | max 1160, padding 40px 24px, `text-align:center` |
| Line 1 | company name, 15px / 700, `var(--cc-header)` |
| Line 2 | margin-top 4px, 12.5px, `#8a919c`: `© {companyName} · Careers powered by Recruitera` |
| Logo / links / social | **none** |
| Mobile | unchanged |

---

## 11. Responsive system

Breakpoints actually used by the Career Page (Tailwind v4 defaults, TW L327–329; none overridden):

| Name | min-width | Used |
|---|---|---|
| (base) | 0 | yes |
| `sm` | 640px | yes |
| `md` | 768px | yes |
| `lg` | 1024px | yes |
| `xl` / `2xl` | 1280 / 1536 | **not used** |
| JS breakpoint | `window.innerWidth < 640` | values marquee (HOME L41) |

Implicit thresholds created by max-widths: header pill stops growing at 1232px (1200 + 32);
content containers at 1160px (1112 inner); values 3-in-a-row needs ≥1120px; font clamps saturate
at 1152px (hero), 971px (company name), 1013px (featured H2), 1095px (section H2), 1127px (video H2),
1129px (testimonial panel H2).

Full per-section, per-width map with measured boxes: **`CAREER_PAGE_RESPONSIVE.md`**.

---

## 12. Typography

**Font loading: none.** `--cc-font` is a bare family name (default `Geist`, UCS L69; Settings offers
`Geist, Inter, Lato, Manrope, DM Sans, Plus Jakarta Sans`, `settings/career-site.vue` L118). No
`@font-face`, no `<link>` to Google Fonts (grep over `app/` and `nuxt.config.ts`; CSP allows
`fonts.gstatic.com` but nothing requests it). The font renders only if installed on the visitor's
device; otherwise the stack falls back to `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif` (SHELL L90).
No Arabic font is defined.

| Style | Component | Size | Weight | Line-height | Letter-spacing | Case | Source |
|---|---|---|---|---|---|---|---|
| Logo initial | header | 15px | 800 | 1.5 | 0 | — | SHELL L43 |
| Logo name | header | 16 / 17px (≥640) | 700 | 1.5 | −0.01em | — | SHELL L44 |
| Nav link | header | 15px | 600 | 1.5 | 0 | — | SHELL L47 |
| For Employees | header | 13.5px | 700 | 1 | 0 | — | SHELL L53 |
| Language btn | header | 13px | 600 | 1.5 | 0 | — | SHELL L54 |
| Mobile nav link | header | 16px | 600 | 1.5 | 0 | — | SHELL L66–67 |
| Mobile buttons | header | 15px | 700 / 600 | 1 / 1.5 | 0 | — | SHELL L69–70 |
| Hero H1 | hero | clamp(2rem,5vw,3.6rem) | 800 | 1.05 | −0.03em | — | HOME L82, L101 |
| Hero intro | hero | 15 / 16.5px (≥768) | 400 | 1.625 | 0 | — | HOME L83, L102 |
| Hero CTA | hero | 15px | 700 | 1.5 | 0 | — | HOME L84, L104 |
| Featured company | featured | clamp(1.3rem,2.8vw,1.7rem) | 700 | 1.5 | −0.01em | — | HOME L116 |
| Featured H2 | featured | clamp(1.35rem,3vw,1.9rem) | 600 | 1.5 | 0 | — | HOME L117 |
| Featured desc | featured | 14.5px | 400 | 1.625 | 0 | — | HOME L118 |
| View all | featured | 13.5px | 600 | 1.5 | 0 | — | HOME L120 |
| Filter pill | featured | 13px | 600 | 1.5 | 0 | — | HOME L125 |
| Chip / badge | job card | 11.5px | 600 | 1.5 | 0 | — | HOME L137–138 |
| Job title | job card | 17px | 700 | 1.375 | −0.01em | — | HOME L140 |
| Job blurb | job card | 13.5px | 400 | 1.625 | 0 | — | HOME L141 |
| Job meta | job card | 12.5px | 500 | 1.5 | 0 | — | HOME L143 |
| Eyebrow | values / testimonials | 13px | 800 | 1.5 | 0.14em | UPPERCASE | HOME L156, L215 |
| Eyebrow | culture | 13px | 800 | 1.5 | 0.16em | UPPERCASE | HOME L191 |
| Section H2 | values / testimonials | clamp(1.8rem,3.8vw,2.6rem) | 800 | 1.5 | −0.02em | — | HOME L157, L216 |
| Value name | values | 17px | 700 | 1.5 | 0 | — | HOME L166 |
| Value desc | values | 14px | 400 | 1.625 | 0 | — | HOME L167 |
| Culture H2 | culture | clamp(2rem,4.4vw,3.1rem) | 800 | 1.08 | −0.025em | — | HOME L192 |
| Culture p | culture | 16px | 400 | 1.625 | 0 | — | HOME L193 |
| Testimonial panel H2 | testimonials | clamp(1.7rem,3.4vw,2.4rem) | 800 | 1.1 | −0.02em | — | HOME L223 |
| Testimonial panel p | testimonials | 15px | 400 | 1.625 | 0 | — | HOME L224 |
| Avatar initials | testimonials | 14px | 700 | 1.5 | 0 | UPPER (JS) | HOME L233 |
| Person name / role | testimonials | 16px / 13px | 700 / 400 | 1.5 | 0 | — | HOME L235–236 |
| Quote | testimonials | 16 / 17px (≥768) | 400 | 1.625 | 0 | — | HOME L239 |
| CTA title / desc / button | CTA | 20 / 14 / 15px | 700 / 400 / 700 | 1.5 | 0 | — | CTA L11–14 |
| Footer name / line | footer | 15 / 12.5px | 700 / 400 | 1.5 | 0 | — | SHELL L82–83 |

Global font feature: `font-feature-settings: "tnum" 1` inherited from `body` (CSS L279) → all digits tabular.

---

## 13. Color system

### A. Company-controlled (CSS custom properties on `.cc-root`, UCS L148–154)
| Var | State field | Default | Used |
|---|---|---|---|
| `--cc-primary` | `primaryColor` | `#4d7c0f` (rgb 77,124,15) | brand everywhere |
| `--cc-header` | `headerColor` | `#0f172a` (rgb 15,23,42) | header bar, headings, culture band, CTA box, text base |
| `--cc-btn` | `btnColor` | `#4d7c0f` | **defined but never read** by the page |
| `--cc-cta` | `ctaColor` | `#4d7c0f` | **defined but never read** by the page |
| `--cc-font` | `font` | `Geist` | font-family |

Settings forces `btnColor = ctaColor = primaryColor` on every primary change (`settings/career-site.vue` L108–113). Hex input accepts only `#RRGGBB` (L114–116).

### B. Template / fixed colors
`#ffffff`, `#000000` (video hero bg), `#eceef1`, `#ececf0`, `#e3e6ea`, `#c3c8cf`, `#e6e8ec`, `#f0f1f4`, `#f7f8fa`,
`#4b5563`, `#5b6472`, `#6b7280`, `#727a86`, `#8a919c`, `#3f4652`, `#0b1220` (gradient mix), `rgb(8,14,22)` (video overlays),
`#002427` (global focus ring, CSS L47), `#f7f8f9` (body canvas, hidden), `#d5dad0` (scrollbar thumb).

### C. Derived colors (computed **automatically by the browser** via `color-mix(in srgb, …)`; no JS)
| Expression | Default result | Where |
|---|---|---|
| `color-mix(header 92%, transparent)` | rgba(15,23,42,.92) | root text (SHELL L23) |
| `color-mix(primary 45%, #0b1220)` | ≈ rgb(41,66,24) | hero gradient end (HOME L99) |
| `color-mix(primary 8%, white)` | ≈ rgb(241,245,236) | View all hover (HOME L120) |
| `color-mix(primary 11%, white)` | ≈ rgb(235,241,229) | department chip (HOME L137) |
| `color-mix(primary 12%, white)` | ≈ rgb(234,239,226) | value icon tile (HOME L163) |
| `color-mix(primary 24%, white)` | ≈ rgb(212,224,197) | value tile inset ring (HOME L163) |
| `color-mix(primary 35%, #ececf0)` | ≈ rgb(180,197,161) | value card hover border (HOME L161) |
| `color-mix(primary 38%, white)` | ≈ rgb(187,205,164) | testimonial left panel (HOME L220) |
| `color-mix(header 78%, white)` | ≈ rgb(68,74,89) | testimonial panel text (HOME L224) |
| `color-mix(header 55%, #000)` → `color-mix(primary 45%, #000)` | — | non-YouTube video poster gradient (HOME L201) |
| `filter: brightness(1.1)` / `(0.95)` | — | button hovers |

No darker/lighter tokens are pre-computed or stored; no contrast adjustment is applied at runtime
(Settings only *displays* contrast ratios, L240–243).

### D. Transparency colors
`rgba(255,255,255,.65)` nav inactive · `.85` hero intro · `.8` mobile link · `.7` CTA desc · `.65` culture p · `.6` quote icon · `.25` language border · `.1` hover bg / dropdown border / video ring · `.05` mobile link hover ·
`rgba(8,14,22,.86/.42/.10)` video hero overlay · `rgba(8,14,22,.55/.35)` poster overlay ·
shadows: `rgba(10,15,25,.28)`, `rgba(0,0,0,.14)`, `rgba(15,23,42,.12/.10/.08/.07)`, `rgba(0,0,0,.45)`, `rgba(0,0,0,.28)`.

---

## 14–15. Branding / customization — see `CAREER_PAGE_CUSTOMIZATION.md`

Key facts:
- All config lives in `UCS` state (defaults L59–88), persisted to **browser localStorage** only
  (`cc-career-site`, L92). There is **no per-company API** for career-site config; every visitor's
  browser uses the defaults unless that same browser edited Settings.
- Company name comes from `GET /api/company` (`name`), fallback `'Your Company'`.
- Config that **changes layout**: `headerFullWidth`, `headerSticky`, `coverType`/`coverUrl`/`coverVideoUrl` (hero variant + featured overlap), `videoUrl` (section appears), `values.length` (section appears; static vs marquee), `testimonials.length` (section + controls), `forEmployeesOn` (header button + CTA section), `logoUrl` (logo vs initial tile), job count (grid columns), text lengths (wrapping).

---

## 16. RTL / Arabic

| Aspect | Finding | Source |
|---|---|---|
| Language toggle | Static button labelled "العربية" with `aria-label="Switch language"`; **no click handler** | SHELL L54, L70 |
| Locale source | none; no i18n library, no locale files, no `lang`/`dir` handling | grep |
| `dir` attribute | never set; page is always LTR | — |
| Alignment / flex reversal | none; physical utilities used (`ml-auto`, `-mr-1.5`, `ml-2`, `text-left`, `left-1/2`, `translate-x-[2px]`) | SHELL L51, L56; HOME L81, L133, L138, L204, L246 |
| Arrows | `ArrowRight`, `ChevronLeft/Right` not mirrored | HOME |
| Arabic text today | only the literal "العربية" in the language button (renders with the fallback system font, shaped by the browser) | SHELL L54 |
| Arabic font | none | — |
| Routes | no locale prefix | — |
| Translated content | none; all copy hard-coded English in templates, or English defaults in UCS | — |
| Marquee | always `translateX(-50%)` (LTR direction) | HOME L262–265 |

Risks if RTL is added later without changes: physical margins, arrow icons, marquee direction,
`text-left` job cards, gradient angle 135°, mask symmetric (OK).

---

## 17. Interactions

| Trigger | State change | Component | Effect |
|---|---|---|---|
| Click logo / "Home" | — | SHELL L40, L48 | `NuxtLink` → `/careers` |
| Click "Opportunities" | — | SHELL L49 | → `/careers/opportunities` |
| Click menu toggle (<640) | `menuOpen = !menuOpen` | SHELL L56 | dropdown enters/leaves (cc-menu transition) |
| Route change | `menuOpen = false` | SHELL L19 | menu closes |
| Click "For Employees" | none | SHELL L53, L69 | **no effect** |
| Click "العربية" | none | SHELL L54, L70 | **no effect** |
| Click "View openings" | — | HOME L53 | `#jobs.scrollIntoView({behavior:'smooth'})` (sticky header may overlap the top of the panel; no scroll-margin) |
| Click filter pill | `collar = 'all' \| 'white' \| 'blue'` | HOME L128 | `featured` recomputed; grid columns may change; no animation |
| Click "View all" | emit `view-all` | HOME L120 → PAGE L8 | `navigateTo('/careers/opportunities')` |
| Click job card | emit `open-job(id)` | HOME L134 → PAGE L7 | `navigateTo('/careers/jobs/{id}')` |
| Hover job card | CSS | HOME L133 | lift 4px, primary border, shadow, title primary (200ms) |
| Hover value card | CSS | HOME L161/174 | lift 4px, shadow, tinted border, icon scale 1.05 |
| Hover marquee | CSS | HOME L272 | animation paused |
| Resize window | `isMobile` | HOME L41–42 | values static ↔ marquee switch at 640px |
| Click culture poster | `videoPlaying = true` | HOME L199 | inline iframe/video with autoplay |
| Testimonial prev/next | `tIndex ± 1` (wraps) | HOME L36, L244–245 | crossfade 0.35s (timer keeps running) |
| Testimonial dot | `tIndex = i` | HOME L247 | crossfade |
| Hover testimonial box | `stopT()` / `startT()` | HOME L218 | autoplay pause/resume |
| Tab hidden/visible | `stopT()` / `startT()` | HOME L40 | autoplay pause/resume |
| Click "Join Talent Pool" | none | CTA L14 | **no effect** |
| Keyboard | native `<button>`/`<a>` only; Tab order = DOM order; Enter/Space activate; no arrow-key carousel, no Escape for menu | — |
| Focus | global `:focus-visible` outline 2px `#002427`, offset 2px, radius 6px (not brand-colored) | CSS L284–296 |

---

## 18. Data flow — see `CAREER_PAGE_DATA_FLOW.md`

- Company: `GET /api/company` (Vue Query `['company']`, MSW mock) → `CompanyInfo.name`.
- Jobs: `useJobs()` static fixture (9 jobs, 5 `published`) — **no network**.
- Career config: `UCS` defaults + `localStorage['cc-career-site']`.
- No company slug, no company ID, no route params on `/careers`. No loading / error UI.

---

## 19. Assets

| Asset | Type | Dimensions | Where | Static / company |
|---|---|---|---|---|
| Company logo | `logoUrl` string (data URL from upload: png/jpeg/svg) | rendered h 32/36px, max w 130/150px | header | company |
| Cover image | `coverUrl` data URL (png/jpeg) | native; recommended 4:1 | hero 4b | company |
| Cover video | `coverVideoUrl` (YouTube URL or .mp4/.webm/.ogg/.ogv/.mov/.m4v/data:video/blob:) | fills ≥94vh | hero 4c | company |
| Culture video | `videoUrl` (YouTube or file URL) | 16:9 card | culture | company |
| YouTube thumbnail | `https://img.youtube.com/vi/{id}/hqdefault.jpg` | 480×360 source, cover | culture poster | derived |
| Testimonial photo | `photo` data URL (`image/*`) | 48×48 cover | testimonials | company |
| Icons | lucide-vue-next SVG components | see §12/§17 | everywhere | static |
| Fonts | none | — | — | — |
| Placeholders / fallback images | none | — | — | — |
| `public/*` files | not used by the Career Page | — | — | — |

---

## 20. CSS implementation

- **Tailwind CSS v4** (Vite plugin) utilities in templates — primary mechanism.
- **Arbitrary values** heavily used (`rounded-[22px]`, `text-[13.5px]`, `shadow-[…]`, `max-w-[1160px]`, `clamp()`).
- **Inline `:style`** for every company color (Tailwind cannot see runtime vars).
- **Inline static `style=""`** for hero gradients (HOME L80, L99).
- **Scoped Vue styles**: SHELL L89–98, HOME L259–284.
- **Global CSS**: `main.css` (preflight, base, radius overrides, focus, reduced motion).
- **CSS variables**: `--cc-*` theme vars; `color-mix()` for tints.
- No CSS Modules, no SCSS, no CSS-in-JS, no `cn()`/`cva` in career components.

Key class → CSS translations (all 1 unit = 4px):

| Class | CSS |
|---|---|
| `px-4` / `px-5` / `px-6` / `px-7` | padding-inline 16 / 20 / 24 / 28px |
| `pt-4` | padding-top 16px |
| `-mb-[80px]` / `-mb-16` | margin-bottom −80px / −64px |
| `h-16` / `h-12` / `h-10` / `h-9` / `h-6` | height 64 / 48 / 40 / 36 / 24px |
| `gap-2.5` / `gap-4` / `gap-5` / `gap-7` / `gap-8` | 10 / 16 / 20 / 28 / 32px |
| `pt-28 pb-40` / `md:pt-36 md:pb-48` | 112 / 160px → 144 / 192px |
| `-mt-28` / `md:-mt-32` | −112 / −128px |
| `-mt-4 sm:-mt-12 md:-mt-16` | −16 / −48 / −64px |
| `-mt-14 md:-mt-16` | −56 / −64px |
| `p-7 md:p-10` | 28 → 40px |
| `mt-2` / `mt-3.5` / `mt-5` / `mt-6` / `mt-7` / `mt-9` / `mt-12` | 8 / 14 / 20 / 24 / 28 / 36 / 48px |
| `py-16 md:py-24` | 64 → 96px |
| `py-10` | 40px |
| `rounded-2xl` | **24px** (CSS L219 override; TW default would be 16px) |
| `rounded-full` | 9999px (CSS L220) |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0/.1), 0 4px 6px -4px rgb(0 0 0/.1)` |
| `blur-2xl` | `filter: blur(40px)` |
| `scale-125` | `scale: 1.25` |
| `leading-relaxed` / `leading-snug` | 1.625 / 1.375 |
| `line-clamp-2` | `overflow:hidden; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2` |
| `text-balance` | `text-wrap: balance` |
| `transition` | 150ms `cubic-bezier(0.4,0,0.2,1)` on color/bg/border/opacity/shadow/transform/filter… |
| `duration-150` / `duration-200` | 150 / 200ms |
| `aspect-video` | `aspect-ratio: 16 / 9` |
| `min-h-[94vh]` | min-height 94vh |
| `z-40` / `z-10` | 40 / 10 |
| `sm:` / `md:` / `lg:` | `@media (width >= 40rem / 48rem / 64rem)` |

---

## 21. Design tokens — see `CAREER_PAGE_TOKENS.json`

---

## 22. Stacking / overlap

| Overlap | Mechanism | Why it works |
|---|---|---|
| Header over hero | `<header>` has `margin-bottom:-80px` (pill) / `-64px` (full) and is exactly 80 / 64px tall → contributes **0px** to flow, so the hero starts at y=0 behind it. `position:sticky; z-index:40` creates a stacking context above all content. | Positioning context for sticky = nearest scroll container = viewport. `.cc-root` is `position:relative` without z-index (no stacking context of its own). |
| Hero backgrounds | Gradient/overlay layers are `position:absolute; inset:0` inside `section.relative.overflow-hidden`; content wrapper is `relative` so it paints above the absolute layer (later in DOM, both non-z-indexed positioned). | Parent `section` (`relative`) is the containing block. |
| Featured panel over hero | `section#jobs` has negative `margin-top` (−112/−128px default) and `position:relative; z-index:10`. | z-index 10 > hero (auto) → panel paints over the hero's bottom padding. Hero's bottom padding (160/192px) is larger than the overlap, so hero text is never covered. |
| Header vs featured | header z 40 > featured z 10 → header always on top while scrolling. | — |
| Image hero blur | blurred `<img>` absolute + `scale(1.25)`; section `overflow:hidden` clips it. Sharp photo frame is `relative` → paints above. | — |
| Video iframe | absolute centered with `translate(-50%,-50%)` and vh/vw sizing; `overflow:hidden` on media box and section. | — |
| Testimonials | `overflow:hidden` on grid clips panel corners to 24px radius. | — |
| Transforms on hover | cards use `translate`/`scale` → create stacking contexts only while hovered. | — |

No `position:fixed` is used on the page.

---

## 23. Conditional sections

| Section / element | Condition | Source |
|---|---|---|
| Video hero | `coverType === 'video' && coverHasVideo` | HOME L73, L50 |
| Image hero | `coverType === 'image' && !!coverUrl` | HOME L90, L51 |
| Gradient hero | otherwise | HOME L98 |
| Hero intro (video hero only) | `v-if="intro"` | HOME L83 |
| Featured jobs | **always** rendered (even with 0 jobs) | HOME L111 |
| Department chip | `job.department` | HOME L137 |
| Location meta | `job.location` | HOME L144 |
| Values | `values.length > 0` | HOME L154 |
| Values marquee | `values.length > 3 || (innerWidth < 640 && values.length > 1)` | HOME L63 |
| Culture video | `videoUrl` truthy | HOME L187 |
| Testimonials | `testimonials.length > 0` | HOME L213 |
| Testimonial controls | `testimonials.length > 1` | HOME L243 |
| Role line | `activeT.role` | HOME L236 |
| Photo vs initials | `activeT.photo` | HOME L232–233 |
| CTA box | `forEmployeesOn` | CTA L8 |
| "For Employees" buttons | `forEmployeesOn` | SHELL L53, L69 |
| Logo image vs initial | `logoUrl` | SHELL L41–45 |
| Header sticky / full-width | `headerSticky` / `headerFullWidth` | SHELL L30–37 |

**Order is fixed** (no reordering config). `generalApplicationOn` and `published` exist in state
but **do not affect** the public Career Page.

---

## 26. Final summary

### A. Component tree
`app.vue → NuxtLayout(none) → pages/careers/index.vue → CareerShell[header, CareerHome{Hero, Featured, Values, Culture, Testimonials, CareerApplyCta}, footer]`.

### B. Section order
Header → Hero → Featured jobs → Values → Culture video → Testimonials → Talent Pool CTA → Footer.

### C. Fixed design system
Containers 1200 (header) / 1160 (content, 24px gutters → 1112) / 1520 (image hero); section
padding 64→96px; radii 10/11/12/13/14/18/20/22/24/9999; shadows as §13D; typography §12; Tailwind
breakpoints 640/768/1024 + JS 640.

### D. Company customization model
Two colors (`primaryColor`, `headerColor`) + font name + logo + cover (image/video) + hero copy +
values + testimonials + culture video + toggles (`forEmployeesOn`, `headerSticky`, `headerFullWidth`),
stored in browser localStorage; company name from `/api/company`.

### E. Responsive model
Mobile-first utilities; container widths via max-width + fixed 24px gutters; clamp() headings;
grid columns by job count; values mode by JS width; stacked → 2-col at 1024 for culture/testimonials.

### F. Data flow
`/careers` → `useCareerSite()` (defaults ← localStorage) + `useCompany()` (Vue Query → MSW `/api/company`) + `useJobs()` (fixture) → computed props → template.

### G. External dependencies
nuxt 3 (compat v4), vue 3, tailwindcss v4 (+ @tailwindcss/vite), lucide-vue-next, @tanstack/vue-query, msw, YouTube embeds/thumbnails.

### H. Reliance on shared/global styles
`main.css`: `rounded-2xl`/`rounded-full` overrides, box-sizing, html/body reset, `tnum` font feature,
antialiasing, focus-visible ring (#002427), reduced-motion override, scrollbar, body canvas color.
Tailwind preflight: base line-height 1.5, heading/paragraph resets, `img{display:block;max-width:100%}`, button resets.

### I. Porting risks (into another Vue app)
1. **`rounded-2xl` = 24px** only because of this app's `@theme` override; a stock Tailwind app renders 16px.
2. Line-height 1.5 on un-classed text comes from preflight; another reset changes vertical rhythm.
3. Focus ring color and shape come from this app's global CSS, not the component.
4. `tnum` tabular figures are inherited from `body`.
5. Font is never loaded; the look depends on the visitor's installed fonts.
6. `color-mix()` requires modern browsers (Chrome 111+, Safari 16.2+, Firefox 113+).
7. Config is localStorage-only; production needs an API for per-company settings.
8. Jobs are a static fixture; production needs a jobs API (published only).
9. MSW service worker provides `/api/company` even in production.
10. `ssr:false` → no SEO HTML for a public page.
11. Values mode is decided in `onMounted`; with SSR it would first render the desktop layout.
12. Buttons show the default cursor (Tailwind v4 preflight).
13. Several controls are inert (For Employees, language, Join Talent Pool).
14. Physical (non-logical) spacing → RTL not supported.
15. Header `-mb-[80px]` assumes pill height 64 + 16 top padding; changing either breaks the overlap.

### J. Everything required to reproduce this Career Page 1:1
- [ ] Root: white, min-height 100vh, font stack `var(--cc-font), -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`, text `rgba(header, .92)`, `tnum`, antialiased, base line-height 1.5, border-box
- [ ] Theme vars `--cc-primary` (#4d7c0f), `--cc-header` (#0f172a), `--cc-font` (Geist) on the root
- [ ] Header: sticky, z 40, 16px outer padding, −80px bottom margin, pill max 1200 / radius 22 / shadow `0 14px 38px rgba(10,15,25,.28)`, row 64px, padding 16/20/28, gap 16/32
- [ ] Logo 32/36px tall (max 130/150) or 36px initial tile radius 10
- [ ] Nav ≥640: 15px/600, gap 28, active = primary text (no underline), inactive white 65%
- [ ] Buttons: For Employees (h40, px20, pill, 13.5/700), language (h40, px14, 1px white 25%), menu (44×44) <640
- [ ] Mobile dropdown inside pill; 48px rows; fade + 8px slide (.2s/.24s `cubic-bezier(.22,1,.36,1)`)
- [ ] Hero gradient 135° primary → mix(primary 45%, #0b1220); content max 1160, padding 112/160 → 144/192; H1 clamp(2rem,5vw,3.6rem)/800/1.05/−0.03em/18ch; intro 15→16.5px/1.625/white 85%/56ch; CTA h48 px24 r13 white bg primary text
- [ ] Image hero: blurred 40px ×1.25 fill; frame max 1520, padding 86 8 0; photo width 100%, height auto, top radius 24, shadow
- [ ] Video hero: min-h 94vh, bottom-aligned text, overlay gradient, px 24/40/64, pb 112/128
- [ ] Featured: z 10, margin-top −112/−128 (−16/−48/−64 image, −56/−64 video); panel max 1112, r22, border #eceef1, shadow `0 28px 70px rgba(15,23,42,.12)`, padding 28/40
- [ ] Featured header: company clamp(1.3rem,2.8vw,1.7rem)/700; H2 clamp(1.35rem,3vw,1.9rem)/600; p 14.5/1.625/#6b7280/max 500; View all h40 px16 r11 1.5px primary
- [ ] Pills h36 px16 full 13/600, gap 10, active primary bg
- [ ] Grid gap 20, mt 28; columns by count (1 → max 560; 2 → 1/2; 3+ → 1/2/3)
- [ ] Job card r18, border #ececf0, p20, chips h24 11.5/600, title 17/700/1.375, blurb 13.5/1.625/2 lines, footer mt20 pt16 border #f0f1f4 12.5/500; hover lift 4 + primary border + shadow
- [ ] Values: section max 1160, py 64/96; eyebrow 13/800/0.14em; H2 clamp(1.8rem,3.8vw,2.6rem)/800; cards mt 48; static row (100% / 50%−10px / 344px, gap 20) or marquee (300/330px + 20px, 6s×n min 18s, 5% edge mask, pause on hover); JS switch <640
- [ ] Value card **radius 24**, border #ececf0, p24; icon tile 48 r14 tint 12% + inset ring 24%; icon 22 stroke 1.9; name 17/700; desc 14/1.625
- [ ] Culture band (if video): header bg, py 64/96, grid gap 40/56, 2 equal cols ≥1024; card 16:9 r20 shadow `0 30px 80px rgba(0,0,0,.45)` + white 10% ring; play 64px primary circle
- [ ] Testimonials: heading mb 48; box r24 border shadow `0 24px 64px rgba(15,23,42,.07)`; cols 1fr/1.08fr ≥1024; left p32/56, min-h 0/440/500, bg mix 38%; right p36/56; 6s autoplay, 0.35s fade, arrows 40px, dots 8px (active 24px)
- [ ] CTA (if forEmployeesOn): pb 64/96, box r20 p32/40 header bg, gap 20, wraps; button h48 px24 r13 primary
- [ ] Footer: border-top #eceef1, py40 px24, centered, name 15/700 header color, line 12.5 #8a919c
- [ ] Global: focus-visible ring 2px (#002427 here), reduced-motion kill-switch, no horizontal overflow
