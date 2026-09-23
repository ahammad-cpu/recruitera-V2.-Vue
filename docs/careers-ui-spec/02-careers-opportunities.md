# Career Site: Opportunities Page, UI Design Spec

**Page:** career site Opportunities, the full job list with search and
filters (live example: https://recruitera-v2-vue.vercel.app/careers/opportunities)
**Goes to:** Job detail page (click a job row).

This file is **complete on its own**. It contains the shared rules, theme,
header and footer as well as everything specific to this page. The other
career pages (Home, Job detail) have their own files.

## Page order (top to bottom)

1. Header: floating bar, sticky, overlaps the banner by 80px. "Opportunities" is the current nav item.
2. Banner: brand gradient with the title "Job Opportunities" (default), **or** cover photo
3. Content area, pulled up 40px over the banner:
   - Left column: **Filters** card
   - Right column: **Search** card, then the **Jobs** list and pagination
4. "Can't find your desired job?" box
5. Footer

---

## Read this first: how to use this spec

This is a **design spec, not code to copy**. It says what the page looks like
and how it behaves. It does not say how to build it.

**Rules for the implementing project:**

1. **Keep your stack as it is.** Don't add new frameworks, CSS libraries,
   UI kits, icon packs or build tools for this page.
2. **Build it with your existing design system.** Use your own Button, Card,
   Badge/Chip, Container, Grid, Icon, Carousel, etc. Don't create a parallel
   set of components or a separate stylesheet just for this page.
3. **Map the values below onto your existing tokens.** For each color, radius,
   shadow, spacing or font size, use the closest token you already have. Add a
   new token only when nothing close exists, and add it to your design system
   the normal way, not as a one-off value in the page.
4. **Brand color and header color are the only theme inputs.** Everything
   tinted (chips, icon tiles, panels) is a lighter mix of these two (see "Design tokens").
   Wire them to however your project already handles theming.
5. **Icons:** use the equivalent glyph from the icon set you already have.
   The names in this spec are descriptive (e.g. "map pin", "briefcase").
6. **Numbers are the target look.** Pixel values are the size things should
   render at. Match them visually with your own spacing scale; being 1–2px off
   to land on an existing token is fine.

**Screen sizes used in this spec:**

| Name | Width |
|---|---|
| Mobile | < 640px |
| Tablet | 640–1023px (some things change again at 768px) |
| Desktop | ≥ 1024px |

---

## Design tokens (target values, same on every career page)

### Theme inputs

| Token | Default | Used for |
|---|---|---|
| Brand / primary | `#4d7c0f` (olive green) | Buttons, active nav link, chips, icons, eyebrow labels, dots |
| Header / ink | `#0f172a` (dark navy) | Header bar, headings, dark video band, CTA box, footer name |
| Font | Geist, falling back to the system sans-serif stack | Whole page |

Page background is white. Default body text color is the header color at 92%
opacity.

### Tints derived from the theme

"X% brand" means the brand color mixed with white at that strength.

| Name | Value | Where |
|---|---|---|
| Brand 8% | 8% brand + white | "View all" button hover background |
| Brand 11% | 11% brand + white | Department chip background |
| Brand 12% | 12% brand + white | Value icon tile background |
| Brand 24% | 24% brand + white | Value icon tile 1px inner outline |
| Brand 38% | 38% brand + white | Testimonials left panel background |
| Brand border | 35% brand + `#ececf0` | Value card border on hover |
| Hero gradient end | 45% brand + `#0b1220` | End color of the hero gradient |
| Header 78% | 78% header color + white | Testimonials panel paragraph |

### Neutrals

| Hex | Use |
|---|---|
| `#eceef1` | Featured-jobs panel border, footer top border |
| `#ececf0` | Job card, value card, testimonials box border |
| `#e3e6ea` | Inactive filter pill border (hover `#c3c8cf`) |
| `#e6e8ec` | Work-mode badge border, carousel arrow border |
| `#f0f1f4` | Divider inside job card |
| `#f7f8fa` | Carousel arrow hover background |
| `#4b5563` | Inactive filter pill text |
| `#5b6472` | Work-mode badge text |
| `#6b7280` | Secondary paragraphs |
| `#727a86` | Job card description and meta |
| `#8a919c` | Muted text (footer line, testimonial role) |
| `#3f4652` | Testimonial quote |

### Corner radius

| Value | Element |
|---|---|
| Fully round | Header buttons (desktop), filter pills, chips, badges, avatars, play button, dots |
| 10px | Logo letter tile |
| 11px | "View all" button |
| 12px | Mobile menu items and buttons |
| 13px | Large buttons ("View openings", "Join Talent Pool") |
| 14px | Value icon tile |
| 18px | Job cards |
| 20px | Culture video frame, CTA box |
| 22px | Floating header, featured-jobs panel |
| 24px | Value cards, testimonials box, top corners of cover photo |

### Shadows

| Element | Shadow |
|---|---|
| Floating header | `0 14px 38px rgba(10,15,25,0.28)` |
| Full-width header | `0 2px 16px rgba(0,0,0,0.14)` |
| Featured-jobs panel | `0 28px 70px rgba(15,23,42,0.12)` |
| Job card (hover) | `0 20px 46px rgba(15,23,42,0.10)` |
| Value card (hover) | `0 20px 46px rgba(15,23,42,0.08)` |
| Testimonials box | `0 24px 64px rgba(15,23,42,0.07)` |
| Culture video frame | `0 30px 80px rgba(0,0,0,0.45)` plus a 1px white 10% outline |
| Cover photo | `0 16px 50px rgba(0,0,0,0.28)` |

### Page widths

| Max width | Used by |
|---|---|
| 1200px | Header |
| 1160px | All content sections and footer |
| 1520px | Cover photo frame |

Content sections have **24px side padding on every screen size**.

### Text styles

Sizes written as "A → B" grow smoothly with the screen width between A (small
screens) and B (large screens).

| Role | Size | Weight | Other |
|---|---|---|---|
| Hero title | 32px → 57.6px | 800 | line height 1.05, letter spacing −3%, max ~18 characters per line, balanced line breaks |
| Hero intro | 15px (≥ 768: 16.5px) | 400 | line height 1.6, white 85%, max ~56 characters per line |
| Section eyebrow | 13px, uppercase | 800 | letter spacing +14% (video band: +16%), brand color |
| Section title (values, testimonials) | 28.8px → 41.6px | 800 | letter spacing −2%, balanced |
| Video band title | 32px → 49.6px | 800 | line height 1.08, letter spacing −2.5% |
| Testimonial panel title | 27.2px → 38.4px | 800 | line height 1.1, letter spacing −2% |
| Featured panel company name | 20.8px → 27.2px | 700 | brand color |
| Featured panel title | 21.6px → 30.4px | 600 | header color |
| Card title (job, value) | 17px | 700 | |
| Body | 14–15px | 400 | line height 1.6 |
| Nav links | 15px | 600 | |
| Small buttons | 13–13.5px | 600–700 | |
| Chips / badges | 11.5px | 600 | |
| Meta text | 12.5px | 500 | |

---

## Header (same on every career page)

**Default:** a floating rounded bar that stays at the top while scrolling.

### Desktop / tablet (≥ 640px)

- Outer area: 16px padding on top, left and right. It **overlaps the content
  below by 80px**, so the hero or banner shows around and behind it.
- Bar: max 1200px wide, centered, 22px radius, header-color background,
  shadow `0 14px 38px rgba(10,15,25,0.28)`.
- Inside the bar: one row, **64px tall**, items vertically centered.
  - Side padding: 20px (640–767px), 28px (≥ 768px).
  - Gap between groups: 32px.

Alternative (a setting): full-width bar, square corners, shadow
`0 2px 16px rgba(0,0,0,0.14)`, overlaps the content by 64px. Row content is
the same, still max 1200px wide.

**Logo (left)**
- Uploaded logo: 36px tall, max 150px wide, scaled to fit, never cropped.
- No logo: 36×36 tile, 10px radius, brand background, company initial in
  white 15px/800, followed by the company name in white 17px/700, cut off
  with "…" if too long. 10px gap between tile and name.
- Clicking the logo goes to the career Home page.

**Nav:** "Home", "Opportunities". 28px gap, 15px/600.
- Current page in the brand color; others white 65%, full white on hover.
- "Opportunities" is current on the Opportunities page. "Home" is current on
  every other career page (including Job detail, see the note in the Job
  detail file).

**Right side:** pushed to the far right, 10px gap.
- "For Employees" (only shown when that setting is on): 40px tall, 20px side
  padding, fully round, brand background, white 13.5px/700. Hover slightly
  brighter; shrinks to 96% while pressed.
- Language button ("globe icon + العربية"): 40px tall, 14px side padding,
  fully round, 1px white 25% border, white 13px/600, 16px globe icon, 6px
  gap. Hover: white 10% background.

### Mobile (< 640px)

- Still a floating rounded bar 16px from the screen edges, sticky, 64px tall.
- Row side padding 16px, gap 16px.
- Logo: 32px tall (max 130px wide), or 16px company name.
- Nav links, "For Employees" and the language button are **hidden**.
- A **menu button** appears on the right: 44×44 touch area (pulled 6px
  toward the edge), 12px radius, 24px white hamburger icon. It turns into an
  ✕ while the menu is open.
- Tapping it opens a **dropdown inside the same rounded bar**, directly under
  the 64px row (the bar grows taller; the page does not get a separate overlay):
  - 1px white 10% line on top; padding 8px top, 16px sides and bottom.
  - "Home" and "Opportunities" as full-width rows: 48px tall, 12px side
    padding, 12px radius, 16px/600. Current page in brand color; others white
    80% with a faint white 5% background on hover.
  - 12px below: two full-width stacked buttons, 10px apart, 48px tall, 12px
    radius, 15px: "For Employees" (brand background, white, 700) and the
    language button (1px white 25% border, globe icon, 600).
  - Opening/closing: fades while sliding 8px vertically, about 0.2–0.25s
    with a soft ease-out. With reduced motion it only fades.
  - The menu closes by itself when the user goes to another page.

---
## Extra tokens used on this page

| Value | Use |
|---|---|
| `#374151` | Text inside dropdowns |
| `#9aa1ab` | Search icon, input placeholder |
| `#9aa1ac` | "Search Results" label, "…" in pagination |
| `#dfe3e8` | Dashed border of the empty state |
| `#f7f8fa` | Empty state background, pagination hover |
| 10px radius | Inputs, dropdowns, "Find" button, pagination buttons |
| 16px radius | Job rows, empty state |
| 20px radius | Filters card, Search card |
| `0 18px 50px rgba(15,23,42,0.10)` | Filters card and Search card shadow |
| `0 16px 40px rgba(15,23,42,0.08)` | Job row hover shadow |

---

## Banner

### Default: gradient banner with title

- Full width, diagonal gradient (135°) from the brand color to "hero gradient end".
- Space above the title: **112px** (128px from 768px). Space below: **64px**.
  The 112px leaves room for the floating header.
- Content max 1160px wide, 24px side padding.
- Title **"Job Opportunities"**: white, 800 weight, letter spacing −2%, size
  grows with the screen from **32px to 48px**.

### With a cover photo

When a cover image is uploaded, the gradient banner is replaced by the cover
photo banner (see "Cover photo banner" below). **The "Job Opportunities"
title is not shown** in that case.

---

## Content area

- Max 1160px wide, 24px side padding, **80px** space below.
- **Pulled up 40px** over the bottom of the banner (for both banner types) and
  sits on top of it.
- **Desktop (≥ 1024px):** two columns, **300px** fixed left column and the
  rest on the right, 24px gap, both aligned to the top.
- **Below 1024px:** one column, 24px gap, in this order: Filters card,
  Search card, Jobs list.

### Filters card (left column)

- White, 20px radius, 1px `#eceef1` border, shadow
  `0 18px 50px rgba(15,23,42,0.10)`, **24px** padding.
- Title **"Filters"**: 18px/700, header color.
- 20px below: three fields stacked, 16px apart. Each field:
  - Label: 12.5px/600, `#6b7280`, 6px above the control.
  - Dropdown: full width, **44px tall**, 12px side padding, 10px radius, 1px
    `#e3e6ea` border, white, 14px `#374151` text. Border turns brand color on focus.

| Label | Placeholder (= no filter) | Options |
|---|---|---|
| Department | Choose Department | Every department that has an open job |
| Work Type | Choose Work Type | On-site, Remote, Hybrid |
| Job Type | Choose Job Type | White Collar, Blue Collar |

- 20px below: **"Clear filters"** text button, 13.5px/600, brand color, 70%
  opacity on hover. Resets **all** filters, the search text and the location.

### Search card (top of the right column)

- Same card look as Filters (white, 20px radius, border, same shadow), padding
  **16px** (20px from 768px).
- **≥ 640px:** one row of three parts, bottom-aligned, 12px gap:
  search field (takes the free space) · Location dropdown (max 220px) · Find button.
- **< 640px:** the three parts stacked, 12px apart, each full width.
- **Search field:** label "Search" (same label style). Text box 44px tall, 10px
  radius, 1px `#e3e6ea` border, 14px text, 40px left padding for a 16px search
  icon (`#9aa1ab`) sitting 14px from the left edge, vertically centered.
  Placeholder "Search for Job Title" in `#9aa1ab`. Brand border on focus.
- **Location dropdown:** label "Location", placeholder "Choose Location",
  options = every location that has an open job. Same dropdown style as Filters.
- **"Find" button:** 44px tall, 28px side padding, 10px radius, brand
  background, white 14px/700. Hover slightly brighter, shrinks to 97% when pressed.

**Behavior:** all filtering is **instant**. The list updates as the user types
or changes any dropdown; "Find" does not have to be pressed. Search matches
the job title (not case-sensitive). All filters combine (AND). Only open
(published) jobs are listed.

### Jobs list

- Starts **32px** below the Search card. When the page scrolls to it
  (pagination), it stops 96px from the top so the sticky header doesn't cover it.
- Heading **"Jobs"**: 22px/800, letter spacing −1%, header color.
- 4px below: "Found {N} Jobs" (singular "Job" when N = 1), 14px `#6b7280`.
- 16px below: "Search Results", 13px/500 `#9aa1ac`.
- 16px below: the job rows, stacked, **16px apart**.

**Job row** (the whole row is clickable and opens the Job detail page):
- White, **16px radius**, 1px `#eceef1` border, **20px** padding.
- Hover: moves up 2px, shadow `0 16px 40px rgba(15,23,42,0.08)`, border turns
  brand color. Pressed: shrinks to 99.5%.
- Inside: text block on the left, button on the right, top-aligned, 16px gap.
- **Left text block** (can shrink):
  - Job title: 17px/700, **brand color**.
  - 8px below, description: 13.5px, line height 1.6, `#6b7280`, **max 2
    lines** (cut with "…"), max ~70 characters per line. Text: "We're
    looking for a {title} to join {department} and help build what's next —
    owning real work from day one alongside a team that values craft and candor."
  - 12px below, one wrapping row, 10px gap:
    - Employment chip: 24px tall, 10px side padding, fully round, 11.5px/700,
      brand 12% background, brand text. "Full-time" (white collar) or
      "Shift Based" (blue collar).
    - Work-mode chip: 24px tall, 10px side padding, fully round, 1px `#e6e8ec`
      border, 11.5px/600 `#5b6472`: "On-site" / "Remote" / "Hybrid".
    - Location: 14px map-pin icon + text, 6px gap, 12.5px `#8a919c`.
- **Right button "View Details →"** (never shrinks): 40px tall, 16px side
  padding, 11px radius, brand background, white 13.5px/600, 16px arrow, 6px gap.

**Empty state** (no job matches):
- 16px radius, 1px **dashed** `#dfe3e8` border, `#f7f8fa` background, 24px
  side padding, 64px top/bottom, centered.
- "No jobs match your filters": 15px/700 header color.
- 4px below: "Try clearing a filter — new roles open often.", 13.5px `#8a919c`.

### Pagination

- **12 jobs per page.** Only shown when there is more than one page.
- 32px below the list, centered row, 6px gap.
- Previous / Next: 40×40, 10px radius, 1px `#e3e6ea` border, 18px chevron in
  header color, `#f7f8fa` on hover, shrinks to 95% when pressed. Disabled on
  the first / last page (40% opacity).
- Page numbers: at least 40×40 (12px side padding for wider numbers), 10px
  radius, 14px/600. Current page: brand background, white text. Others: 1px
  `#e3e6ea` border, `#4b5563` text, `#f7f8fa` on hover.
- Which numbers show: **1, 2, the last two, and the current page with one on
  each side**. Wherever numbers are skipped, show "…" (`#9aa1ac`, 4px side
  padding). Example on page 7 of 20: `‹ 1 2 … 6 7 8 … 19 20 ›`.
- Changing page **smoothly scrolls** back up to the "Jobs" heading.
- Changing any filter or the search text goes back to **page 1**.

---

## Cover photo banner (shared by all career pages)

Used when the company sets the cover to **Image** and uploads a photo
(recommended shape **4:1**). On this page it **replaces** the default
gradient hero/banner.

Built from two layers:

1. **Blurred background:** the same photo stretched to fill the whole band,
   heavily blurred (~40px) and enlarged 125% so the blurry edges are cut off
   (the band clips its content). It shows behind the floating header, in the
   thin side margins, and on both sides when the screen is wider than 1520px.
2. **Sharp photo:** max 1520px wide, centered, 8px margin left and right,
   starting **86px** from the top (16px header gap + 64px header + 6px). It
   keeps its own shape and is **never cropped**, so the band's height comes
   from the photo (a 4:1 photo is ~376px tall on a wide desktop, ~94px on a
   390px phone). **Top corners round (24px), bottom corners square.** Shadow
   `0 16px 50px rgba(0,0,0,0.28)`. The band ends at the photo's bottom edge.

No text is placed on the photo.

---
## "Can't find your desired job?" box (shared)

Only shown when the "For Employees" setting is on.

- Max 1160px wide, 24px side padding, **64px** space below (96px from 768px).
- Box: 20px radius, header-color background, padding **32px** (40px from
  768px). Text on the left, button on the right, vertically centered, 20px
  gap.
- Text (white):
  - Title 20px/700: "Can't find your desired job?"
  - 4px below, 14px, white 70%: "Apply through General Application and join
    our Talent Pool for future hiring."
- Button "Join Talent Pool": 48px tall, 24px side padding, 13px radius, brand
  background, white 15px/700. Hover slightly brighter, shrinks to 97% while
  pressed.
- **Mobile / narrow:** when the text and button don't fit on one line, the
  button drops **below** the text, aligned left.

## Footer (shared)

- 1px `#eceef1` line on top, white background.
- Max 1160px wide, 40px padding top and bottom, 24px sides, centered text.
- Company name 15px/700 in the header color.
- 4px below, 12.5px `#8a919c`: "© {Company} · Careers powered by Recruitera".
- Same on all screen sizes.

---
## Mobile behavior of this page (< 640px)

No sideways scrolling anywhere.

- **Header:** hamburger menu, see "Header → Mobile". "Opportunities" is the
  highlighted item in the dropdown.
- **Banner:** gradient with "Job Opportunities" at 32px, 112px space above,
  64px below. With a cover photo: short photo (~94px tall on a 390px phone),
  no title.
- **Content** pulled up 40px over the banner, in one column:
  1. **Filters card** first (full width, 24px padding, the three dropdowns stacked)
  2. **Search card** (16px padding): search field, Location and **Find**
     stacked, each full width
  3. **Jobs** heading, count, then the job rows
- **Job rows:** same layout as desktop. The **"View Details" button stays on
  the right** and the text block next to it gets narrower (the title and
  description wrap more). The chips row wraps onto more lines if needed.
- **Pagination:** same centered row. On small screens keep it on one line
  (the numbering rule keeps at most ~9 items).
- **"Can't find your desired job?" box:** 32px padding, button below the text.
- **Touch:** no hover effects; rows shrink to 99.5% and buttons to ~95–97%
  while pressed.

### Tablet (640–1023px)

- Header shows the full desktop version.
- Still **one column** (Filters card above the Search card and list).
- Search card is **one row** (search · Location · Find).
- From 768px: Search card padding 20px, banner space above the title 128px,
  CTA box padding 40px, space below the CTA 96px.

### Desktop (≥ 1024px)

- Two columns: Filters card 300px on the left, Search card + list on the right.

---

## Interaction and motion summary

| Interaction | Behavior |
|---|---|
| Typing in search / changing a dropdown | List updates instantly, back to page 1 |
| "Clear filters" | Resets all filters, search and location |
| Job row hover | Moves up 2px + soft shadow, brand border (~200ms) |
| Job row click | Opens the Job detail page for that job |
| Page change | Smooth scroll to the "Jobs" heading |
| Buttons pressed | Shrink to ~95–97% (~150ms) |
| Input / dropdown focus | Border turns brand color |

## Icons needed (use your own icon set)

Globe, hamburger menu, close (✕), search (magnifier), map pin, arrow right,
chevron left, chevron right.

## Done checklist

- [ ] Built only with the project's existing components and tokens
- [ ] Header with "Opportunities" active; mobile menu works
- [ ] Gradient banner with title, or cover photo without title
- [ ] Content pulled up 40px; 300px + rest columns on desktop, stacked below 1024px
- [ ] Filters card with 3 dropdowns + "Clear filters"
- [ ] Search card: one row from 640px, stacked on mobile; instant filtering
- [ ] "Found N Jobs" count, singular/plural
- [ ] Job rows with chips, 2-line description and "View Details"
- [ ] Empty state
- [ ] Pagination: 12 per page, numbering with "…", scroll to heading, reset on filter
- [ ] Checked at 390px, 768px, 1024px and 1440px wide
