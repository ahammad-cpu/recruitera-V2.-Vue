# Careers Page — UI Spec (handoff)

Complete visual spec of the public career home page (`/careers`,
https://recruitera-v2-vue.vercel.app/careers), taken from the source code so
another project can reproduce the same UI.

Source files:

| Part | File |
|---|---|
| Page entry | `app/pages/careers/index.vue` |
| Header + footer (shell) | `app/components/career/CareerShell.vue` |
| Hero, featured jobs, values, video, testimonials | `app/components/career/CareerHome.vue` |
| "Join Talent Pool" CTA | `app/components/career/CareerApplyCta.vue` |
| Theme defaults + content | `app/composables/useCareerSite.ts` |
| Job card text helpers | `app/utils/careerJob.ts` |

Stack: Vue 3 / Nuxt 3, Tailwind CSS v4, icons from `lucide-vue-next`. If the
target project also uses Tailwind, the class strings in the source files can be
copied as-is. All pixel values below are resolved from the Tailwind classes
(1 Tailwind unit = 4px).

Breakpoints (Tailwind defaults): `sm` ≥ 640px, `md` ≥ 768px, `lg` ≥ 1024px.

---

## 1. Design tokens

### Theme variables (set on the page root)

| Variable | Default | Used for |
|---|---|---|
| `--cc-primary` | `#4d7c0f` (olive green) | Brand color: buttons, active nav link, chips, icons, eyebrow labels |
| `--cc-header` | `#0f172a` (slate-900) | Header bar, headings, dark video section, CTA box |
| `--cc-font` | `Geist` | Font family (falls back to `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`) |

Note: the app never loads Geist, so unless it is installed on the device, the
live site renders in the system font stack. To match it exactly, use the
system stack; to match the intent, load Geist from Google Fonts.

Default body text color: `color-mix(in srgb, var(--cc-header) 92%, transparent)`.
Page background: `#ffffff`.

### Derived colors (built with `color-mix`)

| Name | Formula | Where |
|---|---|---|
| primary-tint-8 | `color-mix(in srgb, var(--cc-primary) 8%, white)` | "View all" button hover bg |
| primary-tint-11 | `… 11%, white` | Department chip bg |
| primary-tint-12 | `… 12%, white` | Value icon tile bg |
| primary-tint-24 | `… 24%, white` | Value icon tile 1px inset ring |
| primary-tint-38 | `… 38%, white` | Testimonials left panel bg |
| primary-border-35 | `color-mix(in srgb, var(--cc-primary) 35%, #ececf0)` | Value card hover border |
| hero-gradient-end | `color-mix(in srgb, var(--cc-primary) 45%, #0b1220)` | Hero gradient end stop |
| header-78 | `color-mix(in srgb, var(--cc-header) 78%, white)` | Testimonials panel paragraph |

### Neutral palette

| Hex | Use |
|---|---|
| `#eceef1` | Featured-jobs panel border, footer top border |
| `#ececf0` | Job card, value card, testimonials box border |
| `#e3e6ea` | Inactive filter pill border (hover `#c3c8cf`) |
| `#e6e8ec` | Work-mode badge border, carousel arrow border |
| `#f0f1f4` | Job card footer divider |
| `#f7f8fa` | Carousel arrow hover bg |
| `#4b5563` | Inactive filter pill text |
| `#5b6472` | Work-mode badge text |
| `#6b7280` | Secondary paragraph text |
| `#727a86` | Job card blurb + meta text |
| `#8a919c` | Muted text (footer line, testimonial role) |
| `#3f4652` | Testimonial quote text |

### Radii

| Value | Element |
|---|---|
| 999px / full | Nav buttons, filter pills, chips, badges, avatars, play button, dots |
| 10px | Logo letter tile |
| 11px | "View all" button |
| 12px | Mobile menu items/buttons |
| 13px | Large buttons (View openings, Join Talent Pool) |
| 14px | Value icon tile |
| 16px (`rounded-2xl`) | Value cards |
| 18px | Job cards |
| 20px | Culture video frame, CTA box |
| 22px | Floating header pill, featured-jobs panel |
| 24px | Testimonials box, image-hero top corners |

### Shadows

| Element | Shadow |
|---|---|
| Floating header pill | `0 14px 38px rgba(10,15,25,0.28)` |
| Full-width header bar | `0 2px 16px rgba(0,0,0,0.14)` |
| Featured-jobs panel | `0 28px 70px rgba(15,23,42,0.12)` |
| Job card (hover) | `0 20px 46px rgba(15,23,42,0.10)` |
| Value card (hover) | `0 20px 46px rgba(15,23,42,0.08)` |
| Testimonials box | `0 24px 64px rgba(15,23,42,0.07)` |
| Culture video frame | `0 30px 80px rgba(0,0,0,0.45)` + 1px ring `rgba(255,255,255,0.10)` |
| Image hero photo | `0 16px 50px rgba(0,0,0,0.28)` |

### Containers

| Max width | Used by |
|---|---|
| 1200px | Header (pill and inner row) |
| 1160px | Hero text, featured jobs, values, video, testimonials, CTA, footer |
| 1520px | Image hero photo frame |

Content sections use `24px` side padding (`px-6`) at all sizes.

### Type scale

| Role | Size | Weight | Line-height / tracking |
|---|---|---|---|
| Hero H1 | `clamp(2rem, 5vw, 3.6rem)` (32→57.6px) | 800 | lh 1.05, tracking −0.03em, max-width 18ch, `text-wrap: balance` |
| Hero intro | 15px (md: 16.5px) | 400 | relaxed (1.625), white 85%, max-width 56ch |
| Section eyebrow | 13px uppercase | 800 | tracking 0.14em (video: 0.16em), color primary |
| Section H2 (values/testimonials) | `clamp(1.8rem, 3.8vw, 2.6rem)` | 800 | tracking −0.02em, balance |
| Video H2 | `clamp(2rem, 4.4vw, 3.1rem)` | 800 | lh 1.08, tracking −0.025em |
| Testimonial panel H2 | `clamp(1.7rem, 3.4vw, 2.4rem)` | 800 | lh 1.1, tracking −0.02em |
| Featured panel company name | `clamp(1.3rem, 2.8vw, 1.7rem)` | 700 | tracking −0.01em, primary |
| Featured panel H2 | `clamp(1.35rem, 3vw, 1.9rem)` | 600 | color header |
| Card title (job/value) | 17px | 700 | job: snug (1.375), −0.01em |
| Body | 14–15px | 400 | relaxed |
| Nav links | 15px | 600 | |
| Small buttons | 13–13.5px | 600–700 | |
| Chips / badges | 11.5px | 600 | |
| Meta | 12.5px | 500 | |

---

## 2. Page structure (top to bottom)

```
┌ Header (sticky, floating rounded pill, overlaps hero by 80px)
├ Hero (gradient by default · image or video if configured)
├ Featured jobs panel (white card pulled UP over the hero)
├ Values ("What we stand for")
├ Culture video (dark, only if a video URL is set)
├ Testimonials ("From the team")
├ CTA box ("Can't find your desired job?")
└ Footer
```

---

## 3. Header

**Default mode = floating pill + sticky** (`headerSticky: true`, `headerFullWidth: false`).

- `<header>`: `position: sticky; top: 0; z-index: 40`, padding `16px 16px 0`
  (`px-4 pt-4`), `margin-bottom: -80px` so it floats over the hero.
- Pill: `max-width: 1200px; margin: 0 auto; border-radius: 22px; overflow: hidden`,
  background `var(--cc-header)`, shadow `0 14px 38px rgba(10,15,25,.28)`.
- Inner row: `max-width: 1200px`, **height 64px**, flex, align center.
  - Horizontal padding: 16px → sm 20px → md 28px.
  - Gap: 16px → sm 32px.

Full-width variant: no outer padding, no radius, shadow `0 2px 16px rgba(0,0,0,.14)`, `margin-bottom: -64px`.

**Logo (left)**
- Uploaded logo: height 32px (sm 36px), max-width 130px (sm 150px), `object-fit: contain`.
- Fallback: 36×36 tile, radius 10px, bg primary, white first letter 15px/800
  + company name 16px (sm 17px) / 700, white, tracking −0.01em, truncate. Gap 10px.

**Nav (sm and up)**: gap 28px, 15px/600. Active link = primary color; inactive = `rgba(255,255,255,.65)`, hover white. Items: "Home", "Opportunities".

**Right actions (sm and up)**, `margin-left: auto`, gap 10px:
- "For Employees": height 40px, padding 0 20px, pill, bg primary, white 13.5px/700. Hover `brightness(1.1)`, active `scale(.96)`.
- Language ("🌐 العربية"): height 40px, padding 0 14px, pill, 1px border `rgba(255,255,255,.25)`, white 13px/600, Globe icon 16px, gap 6px. Hover bg `rgba(255,255,255,.10)`.

**Mobile (< 640px)**
- Menu button: 44×44, radius 12px, white Menu/X icon 24px (stroke 2), `margin-right: -6px`.
- Dropdown (inside the pill): top border `rgba(255,255,255,.10)`, padding `8px 16px 16px`.
  - Links: height 48px, padding 0 12px, radius 12px, 16px/600; inactive white 80%, hover bg white 5%.
  - Buttons stack (margin-top 12px, gap 10px): height 48px, radius 12px, 15px; "For Employees" filled primary, language outlined.
  - Animation: fade + `translateY(-8px)`, opacity .2s ease, transform .24s `cubic-bezier(.22,1,.36,1)`.

---

## 4. Hero

Three variants; the **default (no cover set) is the gradient hero**.

### 4a. Gradient hero (default)
- Background: `linear-gradient(135deg, var(--cc-primary), color-mix(in srgb, var(--cc-primary) 45%, #0b1220))`.
- Content: container 1160px, padding-x 24px.
  - Padding top/bottom: **112px / 160px**, md: **144px / 192px** (the big bottom padding is what the featured panel overlaps).
  - Text white.
- H1 (see type scale) — default text: "Build the future of hiring with us".
- Intro: margin-top 20px — "We help teams hire better and faster. Join a team that values craft, ownership, and candor — and do the best work of your career."
- Button row margin-top 36px, gap 12px. **"View openings →"**: height 48px, padding 0 24px, radius 13px, bg white, text primary 15px/700, ArrowRight icon 18px (stroke 2.2), gap 8px. Hover `brightness(.95)`, active `scale(.97)`. Smooth-scrolls to `#jobs`.

### 4b. Image hero (cover image uploaded)
- Section bg: the same image, `object-fit: cover; transform: scale(1.25); filter: blur(40px)` (blur-2xl).
- Frame: max-width 1520px, padding-x 8px, padding-top 86px. Sharp image full width, auto height, top corners radius 24px, shadow `0 16px 50px rgba(0,0,0,.28)`. No text.

### 4c. Video hero (cover video)
- `min-height: 94vh`, flex, items at bottom, bg black; video/YouTube covers the area (muted, looped, autoplay).
- Overlay: `linear-gradient(to top, rgba(8,14,22,.86) 0%, rgba(8,14,22,.42) 42%, rgba(8,14,22,.10) 100%)`.
- Text block: padding-x 24 / sm 40 / lg 64px, padding-bottom 112px (md 128px). Same H1, intro, and button (button margin-top 32px).

---

## 5. Featured jobs panel (`#jobs`)

- Section: `position: relative; z-index: 10`, pulled up over the hero:
  - gradient hero: `margin-top: -112px` (md `-128px`)
  - video hero: `-56px` (md `-64px`)
  - image hero: `-16px` (sm `-48px`, md `-64px`)
- Container 1160px, padding-x 24px.
- **Panel**: white, radius 22px, 1px border `#eceef1`, shadow `0 28px 70px rgba(15,23,42,.12)`, padding **28px** (md **40px**).

**Panel header**: flex, wrap, `align-items: flex-end`, `justify-content: space-between`, gap 16px.
- Company name (primary, see type scale).
- H2 "Discover our featured jobs", margin-top 8px, color header.
- Paragraph, margin-top 8px, 14.5px, `#6b7280`, max-width 500px:
  "The roles we're most excited about right now at {Company} — standout positions where you can grow fast and make real impact from day one."
- **"View all →"** button: height 40px, padding 0 16px, radius 11px, 1.5px border primary, text primary 13.5px/600, icon 16px, gap 6px. Hover bg primary-tint-8, active `scale(.96)`.

**Filter pills**: margin-top 24px, flex wrap, gap 10px. Labels: All · White Collar · Blue Collar.
- Pill: height 36px, padding 0 16px, fully rounded, 13px/600.
- Active: bg primary, white text. Inactive: white bg, 1px `#e3e6ea` border, text `#4b5563`, hover border `#c3c8cf`. Active press `scale(.95)`.

**Job grid**: margin-top 28px, gap 20px. Shows at most 6 published jobs.
- 1 job: 1 column, max-width 560px.
- 2 jobs: 1 col → sm 2 cols.
- 3+ jobs: 1 col → sm 2 cols → lg 3 cols.

**Job card** (whole card is a button):
- Flex column, left-aligned, white, radius 18px, 1px border `#ececf0`, padding 20px.
- Hover: `translateY(-4px)`, border primary, shadow `0 20px 46px rgba(15,23,42,.10)`, title turns primary. Active: `translateY(0) scale(.99)`. Transition 200ms.
- Top row (flex, space-between, gap 12px):
  - Department chip: height 24px, padding 0 10px, pill, 11.5px/600, bg primary-tint-11, text primary.
  - Work-mode badge (margin-left auto): height 24px, padding 0 10px, pill, 1px border `#e6e8ec`, 11.5px/600 `#5b6472`, leading 6×6 primary dot, gap 6px. Text: On-site / Remote / Hybrid.
- Title: margin-top 14px, 17px/700, color header.
- Blurb: margin-top 8px, 13.5px, `#727a86`, clamp to 2 lines, `flex: 1` (keeps footers aligned). Text:
  "We're looking for a {title} to join {department} and help build what's next — owning real work from day one alongside a team that values craft and candor."
- Footer meta: margin-top 20px, padding-top 16px, top border `#f0f1f4`, flex wrap, gap 6px 16px, 12.5px/500 `#727a86`. Items with 14px icons (stroke 1.9), gap 6px: MapPin + location, Briefcase + "Full-time" (or "Shift Based" for blue-collar).

---

## 6. Values — "What we stand for"

- Section: container 1160px, padding `64px 24px` (md `96px 24px`).
- Heading block: centered, max-width 46ch.
  - Eyebrow "What we stand for" (13px/800 uppercase, tracking .14em, primary).
  - H2 "The principles behind how we work", margin-top 8px, color header.
- Cards area margin-top 48px.

**≤ 3 values → centered row**: flex wrap, center, gap 20px. Card width: 100% → sm `calc(50% - 10px)` → lg 344px.
**> 3 values (or > 1 on mobile < 640px) → infinite marquee**: cards 300px (sm 330px) wide with 20px right margin, list duplicated, track animates `translateX(0 → -50%)` linear infinite, duration `max(18s, count × 6s)`, pauses on hover, edge fade mask `linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)`. Disabled for reduced motion.

**Value card**: white, radius 16px, 1px `#ececf0` border, padding 24px, text centered.
- Hover: `translateY(-4px)`, shadow `0 20px 46px rgba(15,23,42,.08)`, border primary-border-35; icon tile `scale(1.05)`.
- Icon tile: 48×48, centered, radius 14px, bg primary-tint-12, `box-shadow: inset 0 0 0 1px` primary-tint-24; lucide icon 22px, primary, stroke 1.9.
- Name: margin-top 20px, 17px/700, header color.
- Description: margin-top 6px, 14px, relaxed, `#6b7280`.

Default values: Ownership (Target icon) — "We take end-to-end ownership of outcomes, not tasks." · Craft (Gem) — "We sweat the details and ship work we are proud of." · Candor (MessageSquare) — "We speak honestly and assume good intent from each other."

---

## 7. Culture video (only when a video URL is set)

- Full-width band, bg `var(--cc-header)`.
- Inner: container 1160px, padding `64px 24px` (md 96px vertical), grid, gap 40px (lg 56px); lg: 2 equal columns, vertically centered.
- Left:
  - Eyebrow "Inside {Company}" (tracking .16em, primary).
  - H2 "A look inside<br>our culture", margin-top 16px, white.
  - Paragraph margin-top 20px, 16px, `rgba(255,255,255,.65)`, max-width 46ch:
    "Meet the people, the pace, and the work behind what we do — no gloss, just a real look at life on our team."
- Right: 16:9 frame, radius 20px, overflow hidden, big shadow + white 10% ring.
  - Poster (YouTube thumbnail) + overlay `linear-gradient(135deg, rgba(8,14,22,.55), rgba(8,14,22,.35))`.
  - Centered play button: 64×64 circle, bg primary, white filled Play icon 24px nudged 2px right; hover `scale(1.1)`. Click swaps in the player.

---

## 8. Testimonials — "From the team"

- Section: container 1160px, padding `64px 24px` (md 96px vertical).
- Heading block (centered, max 46ch, margin-bottom 48px): eyebrow "From the team", H2 "What it's like to work with us".
- **Box**: grid, overflow hidden, radius 24px, 1px `#ececf0` border, shadow `0 24px 64px rgba(15,23,42,.07)`. lg: 2 columns `minmax(0,1fr) minmax(0,1.08fr)`; stacked below lg.

**Left panel** (branded): bg primary-tint-38, flex column, space-between, gap 32px (md 48px), padding 32px (md 56px), min-height md 440px / lg 500px.
- Quote icon 56×56, filled, `rgba(255,255,255,.6)`.
- H2 "Real Stories from Real Employees" (header color).
- Paragraph margin-top 16px, 15px, color header-78:
  "Get an inside look at our workplace culture, career growth opportunities, and team experiences through the voices of our employees."

**Right panel** (carousel): white, flex column, padding 36px (md 56px).
- One testimonial at a time, cross-fade 0.35s. Auto-advance every 6s; pauses on hover and when the tab is hidden.
- Person row (gap 16px): 48×48 round avatar (photo, or primary circle with white initials 14px/700); name 16px/700 header color; role 13px `#8a919c`.
- Quote: margin-top 24px, 16px (md 17px), relaxed, `#3f4652`, wrapped in quotes.
- Controls (only if > 1), margin-top 32px, gap 12px:
  - Prev/next: 40×40 circles, 1px `#e6e8ec` border, Chevron icon 20px in header color, hover bg `#f7f8fa`, active `scale(.9)`.
  - Dots (margin-left 8px, gap 8px): height 8px, primary; active width 24px, inactive width 8px at 30% opacity (hover 60%).

Default testimonials:
- Mariam Adel, Senior Engineer — "The best team I have worked with — real autonomy and real impact from day one."
- Omar Khaled, Product Designer — "Culture of craft is not a slogan here. It shows up in every review and ship."

---

## 9. CTA — "Can't find your desired job?"

- Section: container 1160px, padding `0 24px 64px` (md bottom 96px).
- Box: radius 20px, padding 32px (md 40px), bg `var(--cc-header)`, flex wrap, center-aligned, space-between, gap 20px.
- Text (white): title 20px/700 "Can't find your desired job?"; subtitle margin-top 4px, 14px, white 70%:
  "Apply through General Application and join our Talent Pool for future hiring."
- Button "Join Talent Pool": height 48px, padding 0 24px, radius 13px, bg primary, white 15px/700; hover `brightness(1.1)`, active `scale(.97)`.

---

## 10. Footer

- Top border 1px `#eceef1`, white bg.
- Inner: container 1160px, padding `40px 24px`, centered text.
- Company name 15px/700 in header color; below (margin-top 4px) 12.5px `#8a919c`: "© {Company} · Careers powered by Recruitera".

---

## 11. Motion summary

| Interaction | Effect |
|---|---|
| Buttons (press) | `scale(.95–.97)`, 150ms |
| Filled buttons (hover) | `filter: brightness(1.1)` (white buttons `.95`) |
| Job / value cards (hover) | lift 4px + shadow, 200ms |
| Mobile menu | fade + 8px slide, `cubic-bezier(.22,1,.36,1)` |
| Values marquee | linear infinite scroll, pause on hover |
| Testimonials | 6s auto-advance, 0.35s opacity crossfade |
| `prefers-reduced-motion` | marquee off, menu fades only |

## 12. Icons (lucide)

Globe, Menu, X (header) · ArrowRight, MapPin, Briefcase, Quote, Play,
ChevronLeft, ChevronRight (home) · value icons from the
`CAREER_VALUE_ICONS` list in `useCareerSite.ts` (Target, Gem, MessageSquare, …).
