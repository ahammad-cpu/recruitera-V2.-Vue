# Career Site: Job Detail & Apply Page, UI Design Spec

**Page:** a single job, with an **Overview** tab (description) and an
**Application** tab (apply form). Reached by clicking a job on the Home or
Opportunities page.
**Goes to:** Opportunities page ("Back", "Browse open roles").

This file is **complete on its own**. It contains the shared rules, theme,
header and footer as well as everything specific to this page. The other
career pages (Home, Opportunities) have their own files.

## Page order (top to bottom)

1. Header: floating bar, sticky, overlaps the banner by 80px
2. Banner: plain brand gradient strip (default, no text), **or** cover photo
3. Job card pulled up over the banner, containing:
   - "← Back" link
   - Chips, job title, meta line, "Apply Now" button
   - Tabs: **Overview** | **Application**
   - Tab content
4. "Can't find your desired job?" box: on the Overview tab only (hidden on the Application tab)
5. Footer

## Page states

| State | What shows in the job card |
|---|---|
| Open job, Overview tab (default) | Title block + "Apply Now" + tabs + description sections + "Apply for this job" |
| Open job, Application tab | Title block (no "Apply Now") + tabs + apply form |
| After submitting | Title block + tabs + "Application submitted" message |
| Closed job | Title block (no "Apply Now") + "currently closed" message, **no tabs** |
| Job not found | No banner or card, just a small "Role not found" message |

"Open" means the job is published (or internal). Any other status counts as closed.

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
| `#374151` | Body text of description and lists, form labels |
| `#9aa1ab` | Input placeholder, upload icon |
| `#d1d5db` | Line under the tabs |
| `#dfe3e8` | Dashed border of the resume upload box |
| `#fafbfc` | Resume upload box background |
| `#f7f8fa` | Background of the closed / submitted message boxes |
| `#dc2626` | Required-field asterisk (*) |
| `#fdecec` / `#b02a2a` | "Blue Collar" chip background / text |
| `#eef2ff` / `#3b5bdb` | "White Collar" chip background / text |
| 11px radius | Form inputs, form buttons |
| 12px radius | Resume upload box |
| 13px radius | "Apply Now", "Browse open roles" |
| 14px radius | "Apply for this job" |
| 16px radius | Closed / submitted message boxes |
| 22px radius | Job card |
| `0 28px 70px rgba(15,23,42,0.12)` | Job card shadow |

---

## Banner

### Default: plain gradient strip

- Full width, diagonal gradient (135°) from the brand color to "hero gradient end".
- **No text.** Height = 86px top padding + 96px bottom padding = **182px**.

### With a cover photo

Replaced by the cover photo banner (see "Cover photo banner" below).

---

## Job card

- Max 1160px wide, 24px side padding, **64px** space below.
- **Pulled up over the banner:** 16px on mobile, 40px from 640px, 64px from
  768px. It sits on top of the banner.
- Card: white, 22px radius, 1px `#eceef1` border, shadow
  `0 28px 70px rgba(15,23,42,0.12)`, padding **28px** (40px from 768px).

### "← Back" link

- Left-arrow icon 16px + "Back", 6px gap, 14px/600, brand color, 70% opacity
  on hover. Goes to the Opportunities page.

### Title block

24px below "Back". Left part and the "Apply Now" button side by side, top
aligned, 16px gap. They wrap when there isn't room.

**Left part:**
- **Chips row** (8px gap):
  - Employment chip: **28px tall**, 12px side padding, fully round, 12px/700,
    brand 12% background, brand text: "Full-time" (white collar) or "Shift Based" (blue collar).
  - Collar chip: same size. "White Collar" = `#eef2ff` background, `#3b5bdb`
    text. "Blue Collar" = `#fdecec` background, `#b02a2a` text.
- **Job title**, 12px below: 800 weight, letter spacing −2%, header color,
  size grows from **28.8px to 41.6px** with the screen width.
- **Meta line**, 10px below: wraps, 20px between items (8px between lines),
  14px `#8a919c`:
  - 16px map-pin icon + location (6px gap)
  - 16px building icon + department (6px gap)
  - Work mode text: "On-site" / "Remote" / "Hybrid"

**"Apply Now" button** (only for open jobs, and only on the Overview tab):
- 48px tall, 28px side padding, 13px radius, brand background, white 15px/700.
  Hover slightly brighter, shrinks to 98% when pressed.
- **≥ 640px:** normal width, on the right of the title block.
- **< 640px:** **full width**, below the title block (4px extra space above).
- Clicking it switches to the **Application** tab.

### Tabs

- 36px below the title block.
- Row of two tabs, **32px apart**, with a **1.5px `#d1d5db` line** under the whole row.
- Each tab: 15px/600, 14px space under the text, and a **2.5px underline**
  that sits on top of the row's line.
  - Active: brand-colored text and underline.
  - Inactive: `#8a919c` text, no underline; `#4b5563` on hover.
- Labels: "Overview", "Application". Default: Overview.

---

## Overview tab

32px below the tabs. Four sections stacked, **32px apart**, then the apply button.

Each section:
- Heading: 18px/700, header color.
- 8px below: the content, 15px `#374151`.
  - Paragraph: line height 1.6.
  - Lists: items 6px apart. Each item has a **16px brand-colored check mark**
    on the left (thick stroke, nudged 4px down to line up with the first line
    of text), 10px gap, text wraps next to it.

| Section | Content (default) |
|---|---|
| **Job Description** | Paragraph: "We're looking for a {title} to join {department} and help build what's next — owning real work from day one alongside a team that values craft and candor." |
| **Responsibilities** | ✓ Own {job title in lowercase} work end to end · ✓ Collaborate closely with cross-functional partners · ✓ Ship high-quality output on a steady cadence · ✓ Raise the bar for craft and process |
| **Requirements** | ✓ Relevant experience in a similar role · ✓ Strong ownership and clear communication · ✓ A track record of shipping real outcomes |
| **Benefits** | ✓ Competitive salary · ✓ Medical insurance · ✓ Learning & development opportunities · ✓ Incentives and performance bonuses |

**"Apply for this job"** button, 32px below the last section:
- **Full width**, 16px padding top and bottom, 14px radius, brand
  background, white 15.5px/700. Hover slightly brighter, shrinks to 99% when pressed.
- Switches to the **Application** tab.

---

## Application tab

32px below the tabs. A form with two groups **32px apart**, then the form buttons.

**Shared field style:**
- Label: 13px/600 `#374151`, 6px above the field. Required fields end with a
  red `#dc2626` asterisk "*".
- Text box / dropdown: full width, **48px tall**, 16px side padding, 11px
  radius, 1px `#e3e6ea` border, white, 14.5px text, placeholder `#9aa1ab`.
  Border turns brand color on focus.

### Group 1: "Personal Information"

- Heading 18px/700 header color; fields start 16px below.
- Grid with 16px gaps: **2 columns from 640px**, 1 column on mobile.

| Field | Type | Required | Placeholder |
|---|---|---|---|
| Full Name | text | yes | Write Full Name |
| Gender | dropdown | no | Choose an option… (options: Female, Male, Prefer not to say) |
| Email | email | yes | Write Email |
| Phone Number | text | no | +20 10 01234567 |

(On desktop: Full Name | Gender on the first row, Email | Phone Number on the second.)

- **Resume** (required), 16px below the grid, full width:
  - Upload box: **96px tall**, 12px radius, **1.5px dashed** `#dfe3e8`
    border, `#fafbfc` background, contents centered in one line, 8px gap.
    The whole box is clickable and opens the file picker. Border turns brand color on hover.
  - Contents: 20px upload-cloud icon (`#9aa1ab`) + text 13.5px `#6b7280`:
    "**Upload a file**" (600, brand color) + " or drag and drop · PDF, Word up to 10MB".
  - After a file is chosen: the brand-colored part shows the **file name** and
    the rest of the sentence is hidden.
  - Accepts .pdf, .doc, .docx.

### Group 2: "Screening Questions"

- Heading 18px/700; questions start 16px below, stacked **16px apart**.
- Each question label: **14px/500** `#374151` with a red "*". Answer box uses
  the shared text-box style, placeholder "Your answer".
- Default questions:
  1. How many years of relevant experience do you have?
  2. What's your expected salary?
  3. What's your notice period?

### Form buttons

- Row with **"Clear Form" on the left** and **"Submit" on the right**, 12px
  gap, 8px space above, and a 1px `#eceef1` line on top.
- "Clear Form": 44px tall, 20px side padding, 11px radius, 1px `#e3e6ea`
  border, white, 14px/600 `#4b5563`; border `#c3c8cf` on hover. Empties every field and answer.
- "Submit": 44px tall, 24px side padding, 11px radius, brand background, white
  14px/700, slightly brighter on hover.
  - **Disabled (50% opacity)** until Full Name, Email and Resume are filled.
    The asterisked screening questions are marked required but do not block submitting.

### After submitting

The form is replaced by a message box:
- 16px radius, 1px `#eceef1` border, `#f7f8fa` background, 24px side padding,
  64px top/bottom, centered.
- **56px** brand-colored circle with a white 28px check mark.
- 16px below: "Application submitted", 20px/800 header color.
- 6px below, 14px `#6b7280`: "Thanks, {Full Name} — we've received your
  application for {job title} and will be in touch." (Uses "there" if the name is empty.)

---

## Closed job

When the job is not open: **no "Apply Now" button and no tabs.** 32px below
the title block, a message box:
- 16px radius, 1px `#eceef1` border, `#f7f8fa` background, 24px side padding,
  64px top/bottom, centered.
- **64px** brand-colored circle with a white 32px ✕.
- 20px below: "Sorry, this job is currently closed", 22px/800 header color.
- 8px below, 15px `#6b7280`: "This position is no longer accepting
  applications. Explore our other open roles."
- 24px below: **"Browse open roles"** button: 48px tall, 28px side padding,
  13px radius, brand background, white 15px/700. Goes to Opportunities.

The "Can't find your desired job?" box **is shown** under a closed job.

## Job not found

When the job doesn't exist: **no banner and no job card.** Just a centered
block, max 900px wide, 24px side padding, 96px space above and below:
- "Role not found", 18px/700 header color.
- 12px below: "← Back to opportunities", 14px/600 brand color, goes to Opportunities.
- No "Can't find your desired job?" box. Header and footer are still shown.

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

- **Header:** hamburger menu, see "Header → Mobile".
- **Banner:** gradient strip 182px tall, or the short cover photo (~94px on a 390px phone).
- **Job card:** pulled up only **16px**, 28px padding.
- **Title block:** chips, title (at its smallest, 28.8px), meta line (wraps).
  **"Apply Now" is full width** below them.
- **Tabs:** same row, 32px apart.
- **Overview:** sections stacked as on desktop; "Apply for this job" full width.
- **Application form:** every field in **one column**, full width (Full Name,
  Gender, Email, Phone Number, Resume, then the screening questions).
  "Clear Form" and "Submit" stay on one row, left and right.
- **Closed / submitted messages:** same centered boxes.
- **"Can't find your desired job?" box** (Overview or closed only): 32px
  padding, button below the text.
- **Touch:** no hover effects; buttons shrink slightly while pressed.

### Tablet (640–1023px)

- Header shows the full desktop version.
- Card pulled up 40px (64px from 768px). Card padding 40px from 768px.
- "Apply Now" returns to normal width, on the right of the title block
  (it wraps under the title only if there's no room).
- Form fields in 2 columns.

---

## Behavior notes

- Switching tabs does not change the page address and does not scroll.
- "Apply Now" and "Apply for this job" both just switch to the Application tab.
- The "Can't find your desired job?" box is **hidden on the Application tab**
  so the form is the last thing before the footer.
- Header nav: the current site highlights **"Home"** on this page (only the
  Opportunities list itself counts as "Opportunities"). Keep this to match
  exactly, or highlight "Opportunities" if you prefer. Both are acceptable.

## Interaction and motion summary

| Interaction | Behavior |
|---|---|
| Buttons pressed | Shrink to ~97–99% (~150ms) |
| Brand-colored button hover | Slightly brighter |
| "Back" / text links hover | 70% opacity |
| Input focus / upload box hover | Border turns brand color |
| Tab hover (inactive) | Text darkens to `#4b5563` |
| Submit | Instantly replaced by the "Application submitted" box |

## Icons needed (use your own icon set)

Globe, hamburger menu, close (✕), arrow left, map pin, building, check mark,
upload cloud.

## Done checklist

- [ ] Built only with the project's existing components and tokens
- [ ] Header + mobile menu
- [ ] Gradient strip (182px) or cover photo banner
- [ ] Card overlap 16 / 40 / 64px; padding 28 / 40px
- [ ] Chips (employment + collar colors), title, meta line
- [ ] "Apply Now": right side on desktop, full width on mobile, Overview only
- [ ] Tabs with 2.5px underline over a 1.5px line
- [ ] Overview: 4 sections with check-mark lists + full-width apply button
- [ ] Application form: 2 columns from 640px, resume upload box, 3 screening questions
- [ ] Submit disabled until Full Name, Email, Resume; success message
- [ ] Closed job state, and "Role not found" state
- [ ] CTA box on Overview / closed only
- [ ] Checked at 390px, 768px, 1024px and 1440px wide
