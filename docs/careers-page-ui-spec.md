# Careers Page — UI Design Spec

The visual design of the public career home page
(https://recruitera-v2-vue.vercel.app/careers). Use it to rebuild the same page
in another project.

---

## 0. Read this first: how to use this spec

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
   tinted (chips, icon tiles, panels) is a lighter mix of these two (see §1).
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

## 1. Design tokens (target values)

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
| 16px | Value cards |
| 18px | Job cards |
| 20px | Culture video frame, CTA box |
| 22px | Floating header, featured-jobs panel |
| 24px | Testimonials box, top corners of cover photo |

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

## 2. Page order (top to bottom)

1. Header: sticky, floating rounded bar that overlaps the hero by 80px
2. Hero: brand gradient with text (default), **or** a cover photo, **or** a cover video
3. Featured jobs panel: white card pulled up over the bottom of the hero
4. Values: "What we stand for"
5. Culture video: dark band, only shown when a video is set
6. Testimonials: "From the team"
7. "Can't find your desired job?" box
8. Footer

---

## 3. Header

**Default:** floating bar that stays at the top while scrolling.

- Outer area: 16px padding on top, left and right. It overlaps the hero by
  80px, so the hero shows around and behind it.
- Bar: max 1200px wide, centered, 22px radius, header-color background,
  floating-header shadow.
- Inside the bar: one row, **64px tall**, items vertically centered.
  - Side padding: 16px (mobile), 20px (tablet), 28px (≥ 768px).
  - Gap between groups: 16px (mobile), 32px (tablet and up).

Alternative (a setting): full-width bar, square corners, full-width header
shadow, overlaps the hero by 64px.

**Logo (left)**
- Uploaded logo: 32px tall on mobile, 36px from tablet up. Max width 130px
  (mobile) or 150px. Scaled to fit, never cropped.
- No logo: 36×36 tile, 10px radius, brand background, company initial in
  white 15px/800, followed by the company name in white 16px (17px from
  tablet) / 700, cut off with "…" if too long. 10px gap.

**Nav (tablet and up):** "Home", "Opportunities". 28px gap, 15px/600. Current
page in brand color; others white 65%, white on hover.

**Right side (tablet and up):** pushed to the far right, 10px gap.
- "For Employees": 40px tall, 20px side padding, fully round, brand
  background, white 13.5px/700.
- Language ("globe icon + العربية"): 40px tall, 14px side padding, fully
  round, 1px white 25% border, white 13px/600, 16px globe icon, 6px gap.
  Hover: white 10% background.

Mobile behavior is in §9.

---

## 4. Hero

There are three versions. Which one shows depends on the cover setting.

### 4a. Gradient hero (default, no cover)

- Background: diagonal gradient (135°) from the brand color to "hero gradient end".
- Content: max 1160px wide, 24px side padding, white text.
  - Space above/below the text: **112px / 160px** below 768px wide, **144px / 192px** from 768px.
    The large bottom space is what the featured-jobs panel overlaps.
- Title (default): "Build the future of hiring with us".
- Intro, 20px below the title: "We help teams hire better and faster. Join a
  team that values craft, ownership, and candor — and do the best work of
  your career."
- Button, 36px below the intro: **"View openings →"**: 48px tall, 24px side
  padding, 13px radius, white background, brand-colored 15px/700 text, 18px
  arrow icon, 8px gap. Smoothly scrolls down to the featured-jobs panel.

### 4b. Cover photo hero

Shown when the cover is set to **Image** and a photo is uploaded (recommended
shape **4:1**). The photo **replaces** the gradient hero entirely: **no title,
no intro, no "View openings" button**.

Built from two layers:

1. **Blurred background:** the same photo stretched to fill the whole hero
   band, heavily blurred (~40px), and enlarged 125% so the blurry edges are
   cut off. It shows behind the floating header, in the thin side margins,
   and on both sides when the screen is wider than 1520px.
2. **Sharp photo:** max 1520px wide, 8px margin left and right, starting
   **86px** from the top (16px header gap + 64px header + 6px). It keeps its
   own shape and is never cropped, so the hero's height comes from the photo
   (a 4:1 photo is ~376px tall on a wide desktop and ~94px on a 390px phone).
   **Top corners round (24px), bottom corners square**, cover-photo shadow.
   The hero ends at the photo's bottom edge.

The featured-jobs panel overlaps the bottom of the photo by only
**16px on mobile, 48px on tablet, 64px from 768px**, so most of the photo
stays visible. Removing the photo brings back the gradient hero.

### 4c. Cover video hero

- At least 94% of the screen height, black background. The video (muted,
  looping, autoplaying) fills the area and is cropped to cover it.
- Dark overlay from the bottom: 86% → 42% (at 42% height) → 10% at the top,
  color `rgb(8,14,22)`.
- Text sits at the **bottom-left**: side padding 24px (mobile), 40px
  (tablet), 64px (desktop); bottom padding 112px (128px from 768px). Same
  title, intro and button as 4a (button 32px below the intro).
- The featured panel overlaps by 56px (64px from 768px).

---

## 5. Featured jobs panel

- Pulled up over the hero: 112px / 128px (gradient), 56px / 64px (video),
  16px / 48px / 64px (photo). It sits on top of the hero.
- Max 1160px wide, 24px side padding.
- **Panel:** white, 22px radius, 1px `#eceef1` border, featured-panel
  shadow. Inner padding **28px** (40px from 768px).

**Top part:** text block on the left, "View all" on the right, bottom-aligned,
16px gap. Wraps onto separate lines when there isn't room.
- Company name (brand color).
- Title "Discover our featured jobs", 8px below.
- Paragraph 8px below, 14.5px, `#6b7280`, max 500px wide: "The roles we're
  most excited about right now at {Company} — standout positions where you
  can grow fast and make real impact from day one."
- **"View all →"**: 40px tall, 16px side padding, 11px radius, 1.5px brand
  border, brand 13.5px/600 text, 16px arrow. Hover background: brand 8%.

**Filter pills**, 24px below: "All", "White Collar", "Blue Collar". 10px gap,
wrap onto more lines if needed.
- 36px tall, 16px side padding, fully round, 13px/600.
- Selected: brand background, white text. Not selected: white, 1px
  `#e3e6ea` border, `#4b5563` text; border `#c3c8cf` on hover.

**Job cards**, 28px below the pills, 20px gap. Up to 6 open jobs.

| Jobs shown | Mobile | Tablet | Desktop |
|---|---|---|---|
| 1 | 1 column, max 560px wide | same | same |
| 2 | 1 column | 2 columns | 2 columns |
| 3–6 | 1 column | 2 columns | 3 columns |

**Job card** (the whole card is clickable and opens the job):
- White, 18px radius, 1px `#ececf0` border, 20px padding, content stacked
  vertically.
- Hover: moves up 4px, border turns brand color, job-card shadow appears,
  title turns brand color.
- Top row: department chip on the left, work-mode badge on the far right.
  - Department chip: 24px tall, 10px side padding, fully round, 11.5px/600,
    brand 11% background, brand text.
  - Work-mode badge: 24px tall, 10px side padding, fully round, 1px `#e6e8ec`
    border, 11.5px/600 `#5b6472`, with a 6px brand dot before the text
    ("On-site", "Remote", "Hybrid").
- Title 14px below, 17px/700, header color.
- Description 8px below, 13.5px, `#727a86`, **max 2 lines** (cut off with
  "…"). It stretches so that card footers line up across a row. Text:
  "We're looking for a {title} to join {department} and help build what's
  next — owning real work from day one alongside a team that values craft
  and candor."
- Footer: 20px below, 16px top padding, 1px `#f0f1f4` line above. 12.5px/500
  `#727a86`, items 16px apart (wrap with 6px row gap), each with a 14px
  icon: map pin + location, briefcase + "Full-time" (or "Shift Based" for
  blue-collar jobs).

---

## 6. Values section: "What we stand for"

### Layout shared by all sizes

- Max 1160px wide, 24px side padding. Space above and below: **64px** below
  768px, **96px** from 768px.
- Centered heading block, max ~46 characters wide:
  - Eyebrow "What we stand for".
  - Title "The principles behind how we work", 8px below, header color.
- Cards start **48px** below the heading.

### Value card (same on all sizes)

- White, 16px radius, 1px `#ececf0` border, 24px padding, everything centered.
- Icon tile: 48×48, centered, 14px radius, brand 12% background with a 1px
  brand 24% inner outline. Icon inside: 22px, brand color, thin-medium stroke.
- Name 20px below the tile, 17px/700, header color.
- Description 6px below, 14px, line height 1.6, `#6b7280`.
- Hover (pointer devices): card moves up 4px, value-card shadow appears,
  border becomes "brand border", icon tile grows to 105%.

Default values:
- **Ownership** (target icon): "We take end-to-end ownership of outcomes, not tasks."
- **Craft** (gem icon): "We sweat the details and ship work we are proud of."
- **Candor** (speech-bubble icon): "We speak honestly and assume good intent from each other."

### Two display modes

| Number of values | Mobile (< 640px) | Tablet / Desktop (≥ 640px) |
|---|---|---|
| 1 | Static card, full width | Static card, centered |
| 2–3 | **Auto-scrolling strip** | **Static centered row** |
| 4 or more | **Auto-scrolling strip** | **Auto-scrolling strip** |

On phones a stacked list of cards gets long, so any list with more than one
value scrolls instead.

**Mode A: static centered row**
- Cards wrap and are centered horizontally, 20px gap in both directions.
- Card width:
  - Mobile (only with 1 value): full width.
  - Tablet: two per row (half the row minus 10px each). With 3 values the
    third card sits alone, centered, on a second line.
  - Desktop: fixed **344px** each, so 3 cards fit on one centered row
    (3 × 344 + 2 × 20 = 1072px).
- No movement.

**Mode B: auto-scrolling strip (marquee)**
- One horizontal row that scrolls **right-to-left forever at a steady speed**.
  The list is shown twice in a row so the loop has no visible jump or gap.
- Card width **300px** on mobile, **330px** from 640px; 20px gap between cards.
  Cards keep their width, so on a phone about one card and a bit of the next
  are visible.
- Speed: one full pass of the list takes **6 seconds per value, at least 18
  seconds** (3 values = 18s, 5 values = 30s). Linear, no easing.
- **Both edges fade out**: the first and last 5% of the strip width fade to
  transparent, so cards appear and disappear softly.
- Pauses while the pointer is over the strip (desktop).
- If the user's device asks for reduced motion: no scrolling; the strip just
  shows the cards as they are.
- The strip is clipped to the section width, so the page never scrolls sideways.

Decide the mode from the screen width (switch at 640px) and update it when
the window is resized.

---

## 7. Culture video band (only when a video is set)

- Full-width band, header-color background.
- Content: max 1160px wide, space above/below 64px (96px from 768px), 24px
  side padding.
- **Desktop:** two equal columns (text left, video right), vertically
  centered, 56px apart.
- Text:
  - Eyebrow "Inside {Company}" (brand).
  - Title "A look inside / our culture" (line break after "inside"), 16px below, white.
  - Paragraph 20px below, 16px, white 65%, max ~46 characters wide: "Meet the
    people, the pace, and the work behind what we do — no gloss, just a real
    look at life on our team."
- Video frame: 16:9, 20px radius, video-frame shadow and outline.
  - Before playing: video thumbnail with a dark diagonal overlay (55% → 35%
    `rgb(8,14,22)`) and a centered 64px round brand-colored play button with a
    white filled play icon (grows to 110% on hover).
  - Clicking plays the video in place.

---

## 8. Testimonials: "From the team"

- Max 1160px wide, 24px side padding, space above/below 64px (96px from 768px).
- Centered heading block (max ~46 characters): eyebrow "From the team",
  title "What it's like to work with us". 48px space below it.
- **Box:** 24px radius, 1px `#ececf0` border, testimonials shadow, content
  clipped to the rounded corners.
- **Desktop:** two columns side by side; the right one is slightly wider
  (1 : 1.08).

**Left panel (branded)**
- Brand 38% background. Big quote mark at the top, text at the bottom.
- Padding 32px (56px from 768px). Min height 440px from 768px, 500px on desktop.
- Quote mark: 56px, filled, white 60%.
- Title "Real Stories from Real Employees", header color.
- Paragraph 16px below, 15px, "header 78%" color: "Get an inside look at our
  workplace culture, career growth opportunities, and team experiences
  through the voices of our employees."

**Right panel (slider)**
- White, padding 36px (56px from 768px).
- Shows **one testimonial at a time**, fading between them (~0.35s). Moves
  to the next every **6 seconds**, pauses while the pointer is over the box
  and while the browser tab is hidden. Loops back to the first.
- Person row (16px gap): 48px round photo, or a brand-colored circle with
  white initials (14px/700); name 16px/700 header color; role 13px `#8a919c`.
- Quote 24px below, 16px (17px from 768px), line height 1.6, `#3f4652`, in
  quotation marks.
- Controls, only if there's more than one testimonial, 32px below, 12px gap:
  - Previous / next: 40px round, 1px `#e6e8ec` border, 20px chevron in header
    color, `#f7f8fa` on hover.
  - Dots (8px after the arrows, 8px apart): 8px tall, brand color. The active
    dot is a 24px-wide pill; the others are 8px circles at 30% opacity (60% on
    hover). Clicking a dot jumps to that testimonial.

Default testimonials:
- **Mariam Adel**, Senior Engineer: "The best team I have worked with — real autonomy and real impact from day one."
- **Omar Khaled**, Product Designer: "Culture of craft is not a slogan here. It shows up in every review and ship."

---

## 9. Mobile behavior (< 640px), whole page

The page is fully usable on phones with no sideways scrolling. Changes from
desktop, section by section:

**Header**
- Still a floating rounded bar (16px from the screen edges), sticky, 64px tall.
- Nav links, "For Employees" and the language button are **hidden**.
- A **menu button** appears on the right: 44×44 touch area, 12px radius,
  24px white hamburger icon. It turns into an ✕ when open.
- Tapping it opens a **dropdown inside the same rounded bar**, directly
  below the 64px row (the bar grows taller):
  - 1px white 10% line on top, padding 8px top, 16px sides and bottom.
  - "Home" and "Opportunities" as full-width rows: 48px tall, 12px side
    padding, 12px radius, 16px/600. Current page in brand color; others white
    80% with a faint white 5% background on press/hover.
  - 12px below: two full-width stacked buttons, 10px apart, 48px tall,
    12px radius, 15px: "For Employees" (brand background, white) and the
    language button (1px white 25% border, globe icon).
  - Opening: fades in while sliding down 8px (~0.2–0.25s, soft ease-out).
    With reduced motion it only fades.
  - The menu closes automatically when you navigate to another page.
- Logo: 32px tall (max 130px wide), or 16px company name.

**Hero**
- Gradient: title at its smallest (32px), intro 15px, 112px space above and
  160px below. Button keeps its full size (48px tall).
- Cover photo: full width minus 8px each side; short because of the 4:1 shape
  (~94px tall on a 390px phone). Featured panel overlaps it by just 16px.
- Cover video: at least 94% of screen height, text bottom-left with 24px side
  padding.

**Featured jobs panel**
- 28px inner padding.
- "View all" drops **below** the text block, aligned left.
- Filter pills wrap onto a second line if needed.
- Job cards in **one column**, full width.

**Values**
- Scrolling strip whenever there's more than one value (cards 300px wide), see §6.
- 64px space above and below. Title at its smallest (28.8px).

**Culture video**
- Stacked: text first, video below at full width, 40px apart.
- 64px space above and below.

**Testimonials**
- Box stacked: branded panel on top, slider below.
- Branded panel: 32px padding, 32px between quote mark and text, no minimum
  height (only as tall as its content).
- Slider panel: 36px padding. Quote 16px.

**"Can't find your desired job?" box**
- 32px padding. The "Join Talent Pool" button drops **below** the text,
  aligned left.

**Footer**: unchanged.

**Touch:** hover effects don't apply; buttons shrink slightly (to ~95–97%)
while pressed and cards shrink to 99%, as feedback.

### Tablet (640–1023px) in short

- Header shows the full desktop version (nav + buttons).
- Job cards and value cards in 2 columns (values: static row if 3 or fewer).
- From 768px: bigger paddings (featured panel 40px, sections 96px,
  testimonials panels 56px) and bigger hero spacing.
- Culture video and testimonials stay **stacked** until 1024px.

---

## 10. "Can't find your desired job?" box

- Max 1160px wide, 24px side padding, 64px space below (96px from 768px).
- Box: 20px radius, header-color background, padding 32px (40px from 768px).
  Text on the left, button on the right, vertically centered, 20px gap; wraps
  when there isn't room.
- Text (white): title 20px/700 "Can't find your desired job?"; 4px below,
  14px white 70% "Apply through General Application and join our Talent Pool
  for future hiring."
- Button "Join Talent Pool": 48px tall, 24px side padding, 13px radius, brand
  background, white 15px/700.

---

## 11. Footer

- 1px `#eceef1` line on top, white background.
- Max 1160px wide, 40px padding top/bottom, 24px sides, centered text.
- Company name 15px/700 in header color; 4px below, 12.5px `#8a919c`:
  "© {Company} · Careers powered by Recruitera".

---

## 12. Interaction and motion summary

| Interaction | Behavior |
|---|---|
| Any button pressed | Shrinks to ~95–97%, quick (~150ms) |
| Brand-colored button hover | Slightly brighter |
| White button hover | Slightly darker |
| Job / value card hover | Moves up 4px + soft shadow (~200ms) |
| "View openings" | Smooth scroll to the featured jobs panel |
| Mobile menu | Fade + 8px slide down |
| Values strip | Constant right-to-left scroll, pauses on hover |
| Testimonials | Auto-advance every 6s, 0.35s crossfade, pauses on hover / hidden tab |
| Reduced motion | Values strip stops; menu only fades |

## 13. Icons needed (use your own icon set)

Globe, hamburger menu, close (✕), arrow right, map pin, briefcase, quote
mark, play, chevron left, chevron right, plus one icon per value (defaults:
target, gem, speech bubble).
