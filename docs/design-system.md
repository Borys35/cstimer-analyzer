# Design System

Reference for every visual decision in the cstimer analyzer UI. Change a token here, the whole app updates.

## Design philosophy

Warm precision. The UI should feel like a well-built instrument — not a generic analytics dashboard. Amber accent over cold blue, monospace numbers for the scoreboard, sharp corners (0.5rem), generous whitespace. The cube's own colors appear in charts and the sticker theme, not as the primary UI accent.

---

## Color system

All colors are CSS custom properties defined in `src/app/globals.css`. There are three theme scopes: `[data-theme="dark"]`, `[data-theme="light"]`, and `[data-theme="sticker"]`. Changing a hex value here changes it everywhere that token is used.

### Core palette (dark theme shown)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0B0E11` | Page background |
| `--surface` | `#141920` | Card/panel background |
| `--surface-2` | `#1B2128` | Inner containers, code blocks |
| `--surface-3` | `#232B35` | Hover states, subtle fills |
| `--border` | `#2C3540` | Card borders, dividers |
| `--text` | `#E8E6E1` | Primary text |
| `--text-dim` | `#7D8590` | Secondary text, labels |
| `--text-faint` | `#4E5760` | Tertiary text, captions |
| `--track` | `#1E2530` | Progress bar backgrounds, gauge track |

### Accent colors

| Token | Hex | Usage |
|---|---|---|
| `--amber` | `#E5A126` | Primary accent — buttons, links, active states, frequency axis |
| `--amber-dim` | `#B8801F` | Hover state for amber elements |
| `--green` | `#2DA44E` | Positive signals — PB badges, "good" tier |
| `--red` | `#CF4B4B` | Alerts — DNFs, "horrible" tier, projection line |

### Cube sticker colors

Used in chart series, the sticker theme, and the 3x3 hero grid. These represent the actual physical cube.

| Token | Hex | Face |
|---|---|---|
| `--cube-red` | `#ea3323` | Red |
| `--cube-orange` | `#ff5800` | Orange |
| `--cube-yellow` | `#ffd500` | Yellow |
| `--cube-green` | `#00a651` | Green |
| `--cube-blue` | `#0057c8` | Blue |
| `--cube-white` | `#f8fafc` | White |

### Stat chip colors

Each stat chip in the quick-stats row gets a color via `--chip1` through `--chip6` with matching `--ink1` through `--ink6` for text on colored backgrounds.

| Token pair | Dark value | Purpose |
|---|---|---|
| `--chip1` / `--ink1` | `#E5A126` / `#0B0E11` | Solves in range (amber on dark) |
| `--chip2` / `--ink2` | `#38bdf8` / `#0B0E11` | DNFs (sky blue on dark) |
| `--chip3` / `--ink3` | `#2DA44E` / `#fff` | Abandoned (green on white) |
| `--chip4` / `--ink4` | `#CF4B4B` / `#fff` | Current level (red on white) |
| `--chip5` / `--ink5` | `#818cf8` / `#fff` | Best single (indigo on white) |
| `--chip6` / `--ink6` | `#E8E6E1` / `#0B0E11` | Active days (white on dark) |

### Chart series colors

| Token | Hex | Series |
|---|---|---|
| `--series-raw` | `#9CA3AF` | Session scatter dots |
| `--series-ao5` | `#38bdf8` | Rolling ao5 line |
| `--series-ao12` | `#818cf8` | Rolling ao12 line |
| `--series-ao100` | `#34d399` | Rolling ao100 line |
| `--series-trend` | `#E5A126` | Fitted trend line (amber) |
| `--series-proj` | `#CF4B4B` | Projection dashed line (red) |
| `--chart-bg` | `#141920` | Chart plot area background |
| `--chart-grid` | `#1E2530` | Grid lines |
| `--chart-tick` | `#7D8590` | Axis labels |
| `--chart-volume` | `#232B35` | Volume bar fill |
| `--chart-tooltip-bg` | `#1B2128` | Tooltip background |

### Axis semantic colors

Used in prescription cards and sub-score bars via CSS classes:

| Class | `--axis` | `--axis-text` | Meaning |
|---|---|---|---|
| `.axis-improvement` | `var(--cube-red)` | `#ff6b62` | Improvement metric |
| `.axis-consistency` | `var(--cube-blue)` | `#5b9bff` | Consistency metric |
| `.axis-frequency` | `var(--amber)` | `var(--amber)` | Frequency metric |

### Light theme overrides

The light theme redefines the same tokens with lighter values. Key differences:

- `--bg: #F5F3EF` (warm off-white, not pure white)
- `--surface: #FFFFFF`
- `--amber: #B87A10` (darker for contrast on light backgrounds)
- `--text: #1A1A1A`

### Sticker theme

The sticker theme uses deeper, saturated versions of the cube colors as panel backgrounds (`--panel-red`, `--panel-blue`, etc.) and adds a multi-color radial gradient to `--bg-image` for atmosphere. Stat chips become fully colored (background = chip color, text = chip ink).

---

## Typography

Two font families loaded via Google Fonts in `globals.css`:

### Font families

| Variable | Font | Fallback | Usage |
|---|---|---|---|
| `--font-sans` | DM Sans | system-ui, sans-serif | Body text, headings, labels |
| `--font-mono` | JetBrains Mono | ui-monospace, monospace | Score displays, time values, data |

### Usage rules

- **JetBrains Mono**: Use `font-mono` class or `fontFamily: "var(--font-mono)"` for any numeric display — scores, times, percentages, CV values. Tabular figures keep columns aligned.
- **DM Sans**: Use `font-sans` class (default body font) for everything else — headings, paragraph text, labels, button text.

### Type scale (approximate)

| Element | Size | Weight | Font |
|---|---|---|---|
| Page title (upload) | `text-4xl` / `text-5xl` | 700 | DM Sans |
| Page title (dashboard) | `text-xl` | 700 | DM Sans |
| Scoreboard score | 48px (SVG) | 700 | JetBrains Mono |
| Section headings | `text-sm` | 600 uppercase | DM Sans |
| Card body text | `text-xs` / `text-sm` | 400 | DM Sans |
| Stat chip label | `text-[10px]` | 400 uppercase | DM Sans |
| Stat chip value | `text-base` | 400 | JetBrains Mono |
| Filter labels | `text-[11px]` | 400 | DM Sans |
| Tier pill | `text-[0.7rem]` | 700 uppercase | DM Sans |

---

## Components

### Card (`.card`)

The base container for all grouped content.

```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 0.5rem;
```

Used everywhere: scoreboard hero, stat chips, prescription cards, chart wrapper, session list, filter controls. Add `card` class to any container for consistent surface treatment.

### Stat chip (`.stat-chip`)

Small data cards in the quick-stats grid. Has a 4px left accent bar via `::before` pseudo-element. Color set via inline style `--chip` and `--chip-ink`.

```jsx
<div className="stat-chip p-2.5 pl-3.5"
  style={{ "--chip": "var(--chip1)", "--chip-ink": "var(--ink1)" }}>
  <div className="chip-label text-[10px] uppercase tracking-wide text-[var(--text-faint)]">
    Label
  </div>
  <div className="mt-0.5 font-mono text-base text-[var(--text)]">
    Value
  </div>
</div>
```

In sticker theme, chips become fully colored (background = `--chip`, text = `--chip-ink`).

### Tier pill (`.tier-pill`)

Colored badge showing the verdict等级. Modifier classes: `.tier-pill-good`, `.tier-pill-decent`, `.tier-pill-bad`, `.tier-pill-horrible`.

| Class | Background | Text |
|---|---|---|
| `.tier-pill-good` | `var(--green)` | white |
| `.tier-pill-decent` | `var(--amber)` | `#0B0E11` (dark) |
| `.tier-pill-bad` | `var(--cube-orange)` | white |
| `.tier-pill-horrible` | `var(--red)` | white |

### Score hero (`.score-hero`)

The main scoreboard layout. Flexbox: column on mobile, row on desktop (768px+). Contains the gauge ring on the left and sub-score bars on the right.

```jsx
<div className="card score-hero">
  <div className="score-hero-gauge">/* gauge ring + tier pill */</div>
  <div className="score-hero-bars">/* sub-score bars */</div>
</div>
```

Override the gauge width on desktop by targeting `.score-hero-gauge` (default: `flex: 0 0 220px`).

### Gauge ring

SVG component in `ScoreboardHero.tsx`. A circular progress indicator:

- Viewbox: 200x200
- Radius: 82
- Stroke width: 10
- Track color: `var(--track)`
- Fill color: dynamic based on tier (green/amber/orange/red)
- Score text: 48px JetBrains Mono at `--text` color
- "/100" label: 13px DM Sans at `--text-dim` color
- Animation: `stroke-dashoffset` transitions over 0.8s with `cubic-bezier(0.22, 1, 0.36, 1)`

### Sub-score bar

Progress bar for each scoring axis. Consists of:

1. Label row: axis name (left) + score/100 with weight (right, mono)
2. Track: 8px height, `var(--track)` background, fully rounded
3. Fill: colored by axis, animated width transition (0.6s)

Colors per axis:
- Improvement: `var(--cube-red)`
- Consistency: `var(--cube-blue)`
- Frequency: `var(--amber)`

### Prescription card

A `.card` with a 3px left border colored by axis via `--axis` variable. Applied via `.prescription-card` class + axis class (e.g., `.axis-improvement`).

### Hero tile (`.hero-tile`)

Individual cube face in the 3x3 upload grid. Inset shadows create a 3D tile effect. On hover, tiles tilt and scale via CSS custom properties `--tilt` and `--scale`.

```css
border-radius: 0.4rem;
box-shadow: inset 0 -3px 0 rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.22);
```

---

## Layout

### Page structure

```
Upload state:
  Centered column (max-w-3xl), vertically centered
  CubeHero → Title → Subtitle → Drop zone

Dashboard state:
  Full-width column (max-w-6xl), padded
  Header → Filters → Scoreboard Hero → Quick Stats → Chart → Verdict → Prescriptions → Sessions
```

### Breakpoints

Uses Tailwind defaults:

| Prefix | Width | Usage |
|---|---|---|
| (none) | < 640px | Mobile — single column, stacked layout |
| `sm:` | 640px+ | Small desktop — slightly larger tiles/padding |
| `lg:` | 1024px+ | Large desktop — 2-column prescription grid, 6-column stat chips |

### Key layout classes

| Element | Mobile | Desktop |
|---|---|---|
| Score hero | Column (stacked) | Row (gauge left, bars right) |
| Prescription cards | Single column | 2-column grid (`lg:grid-cols-2`) |
| Quick stats | 2-column grid | 6-column grid (`lg:grid-cols-6`) |
| Filter bar | Wrapping flex | Single row |

### Spacing

- Page padding: `px-4` mobile, `sm:px-6` desktop
- Section gaps: `mb-5` (1.25rem) between major sections
- Card internal padding: `p-3.5` to `p-4` depending on card type
- Stat chip padding: `p-2.5 pl-3.5` (extra left for accent bar)

---

## Theming

### How it works

1. Theme is stored in `localStorage` under key `cta-theme`
2. Applied as `data-theme` attribute on `<html>`
3. CSS variables in `globals.css` are scoped to `[data-theme="dark"]`, `[data-theme="light"]`, `[data-theme="sticker"]`
4. A no-flash script in `layout.tsx` reads localStorage before paint to prevent flicker
5. System preference (`prefers-color-scheme`) is used as default on first visit

### Theme cycle

Dark → Light → Sticker → Dark (via `ThemeToggle` component)

### Adding a new theme

1. Add `"newtheme"` to the `Theme` type in `src/lib/theme.ts`
2. Add it to the `THEMES` array
3. Add a `[data-theme="newtheme"] { ... }` block in `globals.css` with all token overrides
4. The toggle and persistence automatically pick it up

### Chart palette

Charts read their colors at runtime via `readChartPalette()` in `src/lib/theme.ts`. It reads `--chart-*` and `--series-*` CSS variables from the computed style. This means chart colors automatically follow the active theme.

If you add new chart series, add corresponding `--series-*` tokens in all three theme blocks and extend the `ChartPalette` interface.

---

## Animation

### Current animations

| Element | Property | Duration | Easing | Reduced motion |
|---|---|---|---|---|
| Gauge ring fill | `stroke-dashoffset` | 0.8s | `cubic-bezier(0.22, 1, 0.36, 1)` | Respected |
| Score bar fill | `width` | 0.6s | `cubic-bezier(0.22, 1, 0.36, 1)` | Respected |
| Hero tile hover | `transform` | 0.35s | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Respected |
| Body background | `background-color` | 0.2s | `ease` | Not explicitly disabled |

### Reduced motion

All animated elements are wrapped in:

```css
@media (prefers-reduced-motion: reduce) {
  .hero-tile { transition: none; }
  .score-bar-fill { transition: none; }
}
```

The gauge ring transition is set via inline `style` attribute — to disable it for reduced motion, add a CSS rule targeting the SVG circle or move the transition to a class.

---

## How to make common changes

### Change the primary accent color

1. Update `--amber` and `--amber-dim` in all three theme blocks in `globals.css`
2. Update `--chip1` if you want the first stat chip to match
3. Update `--series-trend` if you want the trend line to match
4. The `.axis-frequency` class also uses `--amber`

### Change the card style

Edit the `.card` rule in `globals.css`. Current: 0.5rem radius, 1px border, `var(--surface)` background.

### Change the scoreboard gauge

Edit the `GaugeRing` function in `src/components/ScoreboardHero.tsx`. Key values: radius (82), stroke width (10), viewBox (200x200), font sizes (48px score, 13px label).

### Add a new stat chip

1. Add a new `--chipN` / `--inkN` pair in all three theme blocks
2. Add the chip to the array in `Dashboard.tsx` in the quick-stats section
3. Reference it with `style={{ "--chip": "var(--chipN)" }}`

### Change typography

1. Swap the Google Fonts import URL in `globals.css`
2. Update `--font-sans` and/or `--font-mono` in `:root`
3. All components reference these via `font-sans`/`font-mono` Tailwind classes or `var(--font-*)` in inline styles

### Modify the chart

The chart uses Recharts components in `Dashboard.tsx`. All chart-related CSS tokens are `--chart-*` and `--series-*`. The chart reads colors at runtime via `readChartPalette()`, so changing the CSS variables is all that's needed.

### Adjust responsive behavior

The `.score-hero` layout is the only component using custom CSS for responsive behavior (media query at 768px). All other responsive layouts use Tailwind's `sm:` and `lg:` prefixes. To change breakpoints, update the `@media` query in the `.score-hero` block or the Tailwind classes in components.

---

## File reference

| File | What it controls |
|---|---|
| `src/app/globals.css` | All color tokens, typography imports, component styles, animations |
| `src/app/layout.tsx` | HTML structure, no-flash theme script, metadata |
| `src/lib/theme.ts` | Theme type, localStorage persistence, chart palette reader |
| `src/components/ScoreboardHero.tsx` | Gauge ring SVG, score display, sub-score bars |
| `src/components/Dashboard.tsx` | Upload screen, filter bar, chart, prescriptions, sessions |
| `src/components/CubeHero.tsx` | 3x3 cube tile grid on upload screen |
| `src/components/ThemeToggle.tsx` | Theme cycle button |
