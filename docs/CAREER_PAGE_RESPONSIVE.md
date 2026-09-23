# Career Page — Responsive Map

Breakpoints in use (Tailwind v4 defaults, not overridden in `app/assets/css/main.css`):

| Range | Name used here | Triggers |
|---|---|---|
| 0 – 639px | Mobile | base classes; JS `innerWidth < 640` (values marquee) |
| 640 – 767px | Small tablet | `sm:` |
| 768 – 1023px | Tablet | `md:` |
| ≥ 1024px | Desktop | `lg:` |

`xl:` (1280) and `2xl:` (1536) are **not used**. Above 1024px, everything changes only through
max-widths and `clamp()`:

| Width threshold | What happens | Why |
|---|---|---|
| 1120px | 3 value cards fit on one row | content `min(1160,vw) − 48 ≥ 3×344 + 2×20 = 1072` |
| 1160px | all content containers stop growing (1112px inner) | `max-w-[1160px] px-6` |
| 1232px | header pill stops growing (1200px) | `max-w-[1200px]` + 2×16px |
| 971 / 1013 / 1095 / 1127 / 1129 / 1152px | clamp() headings reach their max | company name / featured H2 / section H2 / culture H2 / testimonial panel H2 / hero H1 |
| 1536px | image-hero photo stops growing (1504px) | `max-w-[1520px] px-2` |

---

## Measured layout (Chromium, viewport height 900, default config, 5 published jobs, 3 values, 2 testimonials, no video, no cover)

Boxes are `x / width` (and height where useful). Heights of text blocks depend on the font
(the test machine used the `system-ui` fallback because Geist is not loaded).

| Element | 375 | 390 | 430 | 768 | 1024 | 1280 | 1440 | 1536 | 1920 |
|---|---|---|---|---|---|---|---|---|---|
| Header pill x / w | 16 / 343 | 16 / 358 | 16 / 398 | 16 / 736 | 16 / 992 | 40 / 1200 | 120 / 1200 | 168 / 1200 | 360 / 1200 |
| Header row padding / gap | 16 / 16 | 16 / 16 | 16 / 16 | 28 / 32 | 28 / 32 | 28 / 32 | 28 / 32 | 28 / 32 | 28 / 32 |
| Nav + desktop buttons | hidden | hidden | hidden | shown | shown | shown | shown | shown | shown |
| Menu toggle | 44×44 | 44×44 | 44×44 | hidden | hidden | hidden | hidden | hidden | hidden |
| Hero height | 540.69 | 540.69 | 516.31 | 574.25 | 601.13 | 614.56 | 614.56 | 614.56 | 614.56 |
| Hero content x | 24 | 24 | 24 | 24 | 24 | 84 | 164 | 212 | 404 |
| H1 size / top | 32 / 112 | 32 / 112 | 32 / 112 | 38.4 / 144 | 51.2 / 144 | 57.6 / 144 | 57.6 / 144 | 57.6 / 144 | 57.6 / 144 |
| Intro size | 15 | 15 | 15 | 16.5 | 16.5 | 16.5 | 16.5 | 16.5 | 16.5 |
| Featured margin-top | −112 | −112 | −112 | −128 | −128 | −128 | −128 | −128 | −128 |
| Featured panel x / w | 24 / 327 | 24 / 342 | 24 / 382 | 24 / 720 | 24 / 976 | 84 / 1112 | 164 / 1112 | 212 / 1112 | 404 / 1112 |
| Panel padding | 28 | 28 | 28 | 40 | 40 | 40 | 40 | 40 | 40 |
| Featured H2 size | 21.6 | 21.6 | 21.6 | 23.04 | 30.4 | 30.4 | 30.4 | 30.4 | 30.4 |
| "View all" position | below text, left | below text, left | below text, left | right | right | right | right | right | right |
| Filter pills | 2 lines | 2 lines | 1 line | 1 line | 1 line | 1 line | 1 line | 1 line | 1 line |
| Job grid columns | 1 | 1 | 1 | 2 | 3 | 3 | 3 | 3 | 3 |
| Job card width | 269 | 284 | 324 | 309 | 284.66 | 330 | 330 | 330 | 330 |
| Values mode | marquee | marquee | marquee | static | static | static | static | static | static |
| Value card width | 300 | 300 | 300 | 350 | 344 | 344 | 344 | 344 | 344 |
| Value cards per row | strip | strip | strip | 2 + 1 | **2 + 1** | 3 | 3 | 3 | 3 |
| Section H2 size | 28.8 | 28.8 | 28.8 | 29.18 | 38.91 | 41.6 | 41.6 | 41.6 | 41.6 |
| Values section padding-y | 64 | 64 | 64 | 96 | 96 | 96 | 96 | 96 | 96 |
| Testimonials layout | stacked | stacked | stacked | stacked | 2 cols | 2 cols | 2 cols | 2 cols | 2 cols |
| Testimonials columns | 325 | 340 | 380 | 718 | 468.27 / 505.73 | 533.64 / 576.36 | same | same | same |
| Testimonial left panel height | 349.72 | 349.72 | 325.34 | 440 (min) | 500 (min) | 500 | 500 | 500 | 500 |
| Testimonial panel H2 | 27.2 | 27.2 | 27.2 | 27.2 | 34.82 | 38.4 | 38.4 | 38.4 | 38.4 |
| CTA box w / h | 327 / 259 | 342 / 238 | 382 / 208 | 720 / 203 | 976 / 135 | 1112 / 135 | 1112 / 135 | 1112 / 135 | 1112 / 135 |
| CTA button | below text | below text | below text | below text | right | right | right | right | right |
| CTA padding | 32 | 32 | 32 | 40 | 40 | 40 | 40 | 40 | 40 |
| Footer height | 126.25 | 126.25 | 126.25 | 126.25 | 126.25 | 126.25 | 126.25 | 126.25 | 126.25 |
| Document width = viewport (no h-scroll) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Document height | 3911 | 3867 | 3742 | 3698 | 3296 | 3110 | 3110 | 3110 | 3110 |

### Mobile menu open (measured)

| | 375 | 390 | 430 |
|---|---|---|---|
| Pill height (64 → open) | 303 | 303 | 303 |
| Dropdown box | y 80, h 239 | y 80, h 239 | y 80, h 239 |
| Items (y / h) | Home 89/48 · Opportunities 137/48 · For Employees 197/48 · العربية 255/48 | same | same |
| Item width | 311 | 326 | 366 |

### Variant: cover image (4:1 test image 1600×400)

| | 375 | 390 | 430 | 768 | 1024 | 1280 | 1440 | 1536 | 1920 |
|---|---|---|---|---|---|---|---|---|---|
| Photo x / w / h | 8 / 359 / 89.75 | 8 / 374 / 93.5 | 8 / 414 / 103.5 | 8 / 752 / 188 | 8 / 1008 / 252 | 8 / 1264 / 316 | 8 / 1424 / 356 | 16 / 1504 / 376 | 208 / 1504 / 376 |
| Hero height (86 + photo) | 175.75 | 179.5 | 189.5 | 274 | 338 | 402 | 442 | 462 | 462 |
| Featured margin-top | −16 | −16 | −16 | −64 | −64 | −64 | −64 | −64 | −64 |

(−48px applies only between 640 and 767px.)

### Variant: 5 values

Marquee at **every** width. Card 300px (<640) / 330px (≥640), animation 30s (5 × 6s).
Section height at 768 / 1024 is 550.06 / 579.22px, shorter than the static 3-value layout
(765.06 / 794.22px) because all cards stay on one line instead of wrapping to a second row.

### Variant: culture video set

| | 375 | 390 | 430 | 768 | 1024 | 1280+ |
|---|---|---|---|---|---|---|
| Layout | stacked | stacked | stacked | stacked | 2 cols | 2 cols |
| Grid columns | 327 | 342 | 382 | 720 | 460 / 460 | 528 / 528 |
| Gap | 40 | 40 | 40 | 40 | 56 | 56 |
| Video card | 327×183.94 | 342×192.38 | 382×214.88 | 720×405 | 460×258.75 | 528×297 |
| H2 size / line-height | 32 / 34.56 | 32 / 34.56 | 32 / 34.56 | 33.79 / 36.5 | 45.06 / 48.66 | 49.6 / 53.57 |
| Band height | 554.53 | 562.97 | 585.47 | 817.5 | 450.75 | 489 |

### Variant: full-width header

Header height 64, `margin-bottom:-64px`, bar spans the viewport, radius 0, shadow
`0 2px 16px rgba(0,0,0,0.14)`; the row is still centered at max 1200px (x = 40 @1280, 120 @1440, 360 @1920).

---

## Section-by-section change list

### Header (`CareerShell.vue` L27–75)
| Property | <640 | 640–767 | ≥768 |
|---|---|---|---|
| Row padding-x | 16 | 20 | 28 |
| Row gap | 16 | 32 | 32 |
| Logo image h / max-w | 32 / 130 | 36 / 150 | 36 / 150 |
| Company name size | 16 | 17 | 17 |
| Nav | hidden | flex, gap 28 | flex |
| For Employees / language | hidden | shown | shown |
| Menu toggle + dropdown | shown | hidden | hidden |
No change at 1024. Styling does not change on scroll.

### Hero
| Variant | <640 | 640–767 | 768–1023 | ≥1024 |
|---|---|---|---|---|
| Gradient padding (top/bottom) | 112 / 160 | 112 / 160 | 144 / 192 | 144 / 192 |
| Video text padding-x | 24 | 40 | 40 | 64 |
| Video text padding-bottom | 112 | 112 | 128 | 128 |
| Intro size | 15 | 15 | 16.5 | 16.5 |
| H1 | clamp(32px, 5vw, 57.6px) at all widths |
| Image hero | no breakpoint changes (fluid width, aspect-driven height) |
Media never changes by breakpoint; no mobile-specific asset.

### Featured jobs
| Property | <640 | 640–767 | 768–1023 | ≥1024 |
|---|---|---|---|---|
| Margin-top (gradient) | −112 | −112 | −128 | −128 |
| Margin-top (image) | −16 | −48 | −64 | −64 |
| Margin-top (video) | −56 | −56 | −64 | −64 |
| Panel padding | 28 | 28 | 40 | 40 |
| Grid (3+ jobs) | 1 col | 2 cols | 2 cols | 3 cols |
| Grid (2 jobs) | 1 | 2 | 2 | 2 |
| Grid (≤1 job) | 1, max 560 | same | same | same |
Header row and pills wrap naturally (`flex-wrap`), no breakpoint classes.

### Values
| Property | <640 | 640–1023 | ≥1024 |
|---|---|---|---|
| Section padding-y | 64 | 64 (<768) / 96 | 96 |
| Mode (≤3 values) | marquee if >1 value | static | static |
| Mode (>3 values) | marquee | marquee | marquee |
| Static card width | 100% | calc(50% − 10px) | 344px |
| Marquee card width | 300 | 330 | 330 |

### Culture video
| Property | <768 | 768–1023 | ≥1024 |
|---|---|---|---|
| Padding-y | 64 | 96 | 96 |
| Layout | stacked (text, then video) | stacked | 2 equal columns, vertically centered |
| Gap | 40 | 40 | 56 |

### Testimonials
| Property | <768 | 768–1023 | ≥1024 |
|---|---|---|---|
| Section padding-y | 64 | 96 | 96 |
| Box layout | stacked (panel on top) | stacked | 2 cols 1fr / 1.08fr |
| Left padding / gap | 32 / 32 | 56 / 48 | 56 / 48 |
| Left min-height | 0 | 440 | 500 |
| Right padding | 36 | 56 | 56 |
| Quote size | 16 | 17 | 17 |

### CTA
| Property | <768 | ≥768 |
|---|---|---|
| Section padding-bottom | 64 | 96 |
| Box padding | 32 | 40 |
Button wraps below text whenever they don't fit (flex-wrap; measured wrapped ≤768, one row ≥1024).

### Footer
No responsive changes.

---

## Order, visibility and overflow

- **Order never changes** at any breakpoint (no `order-*`, no `flex-col-reverse`).
- Visibility changes only in the header (`hidden sm:flex`, `sm:hidden`).
- Horizontal overflow is clipped by `overflow-hidden` on hero sections (HOME L73, L90, L98), the values mask (L172) and the testimonials grid (L218). Verified `scrollWidth === innerWidth` at all nine widths and in all variants.
- The values mode is computed in JavaScript (`onMounted` + `resize` listener, HOME L41–43), so it follows live window resizing.
