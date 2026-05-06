# Insyt — Product UI Handoff

A brand-intelligence platform for Indian conglomerate CEOs. The product reads ~4,200 sources daily across English press, vernacular press, broadcast, independent YouTube, and real-time social — and presents what matters as **editorial briefings**, not dashboards.

This bundle is for a developer building the product in **Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui** on the frontend and **FastAPI** on the backend. It contains eight hi-fi product screens, the shared design system, screenshots, and three appendices that translate the design idiom into your stack.

---

## About the design files

The HTML files in `design_files/` are **design references** — single-file prototypes built to communicate intended look, layout, density, and behavior. They are **not production code**. Do not lift the markup or CSS directly into your app.

Your task is to **recreate these designs in Next.js + Tailwind + shadcn/ui**, using your existing component patterns and conventions. The HTML is the spec; your codebase is the medium.

A few things will translate naturally:
- The **design tokens** (colors, type scale, spacing) — port these to `tailwind.config.ts` and CSS variables.
- The **component vocabulary** (briefing card, signal row, source row, severity bar, sentiment sparkline) — implement as React components, composing shadcn primitives where useful (`Card`, `Separator`, `ScrollArea`, `Badge`, `Tabs`, `Sheet`, `Tooltip`).
- The **layout idioms** (broadsheet grids, editorial sidebars, scrubbers) — use CSS Grid and Tailwind `grid-cols-*`.

A few things will NOT translate without care:
- The HTML uses bespoke class names like `.row`, `.signal`, `.brief-card`. Do **not** carry these forward — name your components properly (`SignalRow`, `BriefingCard`, `SourceRow`).
- The HTML inlines style overrides for sentiment-bar heights (`style="height: 70%"`). In React, drive these from data — see the API contracts appendix.
- The HTML has no real interactivity. Tabs, scrubbers, filters, focus panes, sheets — all need real state, real navigation, real data fetching.

---

## Fidelity

**Hi-fi.** Pixel-perfect mockups with final colors, typography, spacing, and editorial copy. Recreate the visual treatment exactly: the broadsheet white background, the warm slate dark surfaces, the single sindoor-red accent, the Spectral serif throughout, the JetBrains Mono labels in 11px small-caps with 0.12em tracking. The aesthetic is the product — *Financial Times after a minute* is the reference, not Material or Linear.

Where copy/data is provided in the mocks (e.g. specific source names, sentiment values, story headlines), treat it as **placeholder editorial** — recreate the *shape* faithfully, but the developer should wire it to live data via the API contracts in Appendix B.

---

## The brand voice — read this first

Two principles inform every screen. Do not lose them in implementation:

1. **Editorial, not dashboard.** Information is presented as if a senior editor wrote it for one reader. Every brief has a lede, a deck, a body. Numbers exist in support of language, never the reverse. There are no widgets, no tiles, no vanity metrics.

2. **The terminal dot is sacred.** The wordmark is *Insyt* in Spectral 500, with a vermilion period. The dot is the **only** chromatic element of the wordmark, and one of only a few uses of color in the entire system. Do not add gradients, do not add brand color to other UI chrome, do not let designers redecorate.

---

## Files in this bundle

```
design_handoff_product_ui/
├── README.md                          ← you are here
├── APPENDIX_A_components.md           ← HTML idiom → shadcn/ui component map
├── APPENDIX_B_api_contracts.md        ← FastAPI endpoint shapes the UI implies
├── design_files/                      ← the eight product screens, HTML
│   ├── shared.css                     ← the design tokens — port to Tailwind
│   ├── 03-Daily Intelligence.html
│   ├── 04-Narrative Exploration.html
│   ├── 05-Crisis Reconstruction.html
│   ├── 06-Action Drafting.html
│   ├── 07-Regional Depth.html
│   ├── 08-Ground Intelligence.html
│   ├── 09-People Monitoring.html
│   └── 11-Source Library.html
└── screenshots/                       ← one PNG per screen (1440-wide capture)
    ├── 03-Daily Intelligence.png
    ├── 04-Narrative Exploration.png
    ├── 05-Crisis Reconstruction.png
    ├── 06-Action Drafting.png
    ├── 07-Regional Depth.png
    ├── 08-Ground Intelligence.png
    ├── 09-People Monitoring.png
    └── 11-Source Library.png
```

To inspect a design: open the HTML file directly in a browser. They render at 1440px width and use Google Fonts (Spectral, JetBrains Mono) loaded from a CDN.

---

## Design tokens

Port these to `tailwind.config.ts` and a `globals.css` `@layer base { :root { ... } }`. Source of truth is `design_files/shared.css`.

### Color

Two surface families. Light is for shareable artifacts (the morning brief, exports). Dark is for the product itself.

```ts
// tailwind.config.ts — colors
{
  // Light surface — broadsheet white, used for briefs and shareables
  paper:        '#F8F7F4',  // background
  'paper-2':    '#EDEAE3',  // toned card
  'paper-edge': '#D5D1C7',  // hairline rule
  ink:          '#14130F',  // primary text (warm near-black, never #000)
  'ink-2':      '#2A2924',  // secondary text
  'ink-3':      '#66635A',  // captions, tertiary
  'ink-4':      '#95918A',  // hairline labels

  // Dark surface — warm slate, used for product chrome
  slate:        '#0E0D0B',  // background
  'slate-2':    '#16140F',  // card / row
  'slate-3':    '#1E1B15',  // hover, elevated
  'slate-edge': '#2A261E',  // hairline rule on dark
  bone:         '#E8E1D2',  // primary text on slate
  'bone-2':     '#B8AF9C',  // secondary
  'bone-3':     '#7A7263',  // tertiary
  'bone-4':     '#4A4438',  // hairline labels

  // The single chromatic note — sindoor red, the wordmark dot color
  vermilion:    '#C8392C',  // base — used like ink, not decoration
  'vermilion-2':'#A82E22',  // hover
  'vermilion-3':'#E85543',  // for dark surfaces

  // Functional, sparingly
  positive:     '#5A6B3F',  // moss
  negative:     '#8B2E1F',
  caution:      '#9A7A2E',
}
```

**Color discipline:**
- `vermilion` is the only saturated color in the system. Use it for: the wordmark dot, severity indicators, "yours" in a comparison, an active filter chip, the underline of an editor's note. Do **not** use it for primary buttons, links by default, or branding flourishes.
- All "black" is `ink` (#14130F) — never pure black. All "white" is `paper` (#F8F7F4) — never pure white.

### Type

One typeface for everything except labels: **Spectral** (Google Fonts), weights 300/400/500/600/700, with italics. Labels are **JetBrains Mono** in 11px small-caps. The system uses serif for headlines, body, *and* sans-equivalent contexts — this is intentional and editorial. Do not substitute Inter or Roboto.

```ts
// tailwind.config.ts — fontFamily
{
  serif: ['Spectral', 'GT Sectra', 'Charter', 'Iowan Old Style', 'Georgia', 'serif'],
  mono:  ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
}
```

The type scale (nine sizes, used with discipline):

| Class | Size / line-height / weight / tracking | Usage |
|---|---|---|
| `t-display` | 96 / 0.95 / 500 / -0.03em | Marketing-only, not in product |
| `t-headline` | 56 / 1.02 / 500 / -0.02em | Page H1 |
| `t-title` | 36 / 1.08 / 500 / -0.015em | Section H2 |
| `t-subtitle` | 24 / 1.18 / 500 / -0.01em | Card title |
| `t-lede` | 20 / 1.45 / 400 / -0.005em | Deck under H1, opening paragraph |
| `t-body` | 16 / 1.55 / 400 / 0 | Body |
| `t-small` | 14 / 1.5 / 400 / 0 | Dense rows, secondary body |
| `t-caption` | 13 / 1.4 / 400 italic / 0 | Photo caption, footnote |
| `t-label` | 11 / 1 / 500 mono UPPERCASE / 0.12em | Section eyebrows, column headers, meta |

### Spacing & rhythm

The mocks use a non-strict 4/8/16/24/32/48/64/96 scale. Tailwind's defaults are fine; favor whole multiples of 4. Most pages have:
- 32–48px page padding (`p-8` to `p-12`)
- 32px gutter between major regions (`gap-8`)
- 16–24px gutter inside cards (`gap-4` to `gap-6`)

### Borders, rules, shadows

- Hairline rules: `1px solid var(--paper-edge)` on light, `1px solid var(--slate-edge)` on dark. There are **no shadows**. Layering is done with hairlines and 2–4 levels of slate (`slate`, `slate-2`, `slate-3`).
- Border radius: **0** by default. The system is sharp-cornered. The only place a small radius (`rounded-sm`, 2px) appears is on filter chips — and even then it's optional.

---

## The eight screens

Each screen has its own section below: **purpose**, **layout**, **components**, **interactions**, **data shape** pointer to Appendix B. Read each screen's HTML alongside its section.

A few things are universal across all eight:

- **Top meta bar** (~32px tall, mono 11px label-styled): wordmark on the left, page name + date in the middle, environment/account on the right. This is the same component on every product screen.
- **Page header**: H1 (`t-headline`), with the last word italic and a vermilion period (e.g. *"The morning **brief.**"*). Followed by a deck (`t-lede`, italic, max-width ~720px). This is also a reusable component.
- **Section eyebrows**: `t-label` mono UPPERCASE, often with a `§` glyph or a count to the right.

---

### 03 — Daily Intelligence (the morning brief)

**Purpose.** The single screen the CEO opens at 06:30 IST. Tells them what changed overnight, what is moving today, and what they should respond to. Editorial, scannable in 90 seconds, deep-readable in 10 minutes.

**Layout.**
- Full-width header with H1 + two-column deck (left: lede sentence in italic; right: meta — date, market open, weather-of-the-day-style "today's tone").
- Below: a **broadsheet front-page grid** with a hero column (the lead story) and 2–3 secondary columns of stacked stories.
- Each "story" is a **briefing card** with: a section eyebrow (REGIONAL · MALAYALAM, COMPETITOR · TANISHQ), an italic deck, a body paragraph, an inline source citation as a footnote, and severity dots.
- Right rail: an "Agenda" — three bullets the user might do today.
- Below the grid: a denser "What else moved" list of one-line stories.

**Key components.**
- `BriefingCard` — variants: `hero`, `column`, `compact`. The hero takes up ~40% of width; columns are equal.
- `SeverityBar` — five 4px×12px ticks; first N are vermilion. Drive from a 1–5 score.
- `SourceFootnote` — superscript number that links to the source library.
- `AgendaItem` — bullet, one-line action, time/owner meta.

**Interactions.**
- Hovering a briefing card surfaces a "see narrative" affordance (links to screen 04 with the story prefilled).
- Clicking a source footnote opens the Source Library (screen 11) scoped to that source.
- The whole page has a subtle "as of 06:23 IST · 4,212 signals processed" mono timestamp in the corner — drive from real fetch time.

**Data shape.** See Appendix B → `GET /api/brief/today`.

---

### 04 — Narrative Exploration

**Purpose.** Multi-week view of how stories form around the brand. Where you are winning the narrative, where you are losing it, who is shaping it. The screen a strategist or comms head would live in.

**Layout.**
- Header (same pattern as screen 03).
- A **controls bar** with time-range tabs (7d / 30d / 90d / Custom), region selector, narrative selector.
- Main canvas split 60/40:
  - **Left:** a stacked area chart — "Narrative volume over time" — with vermilion overlay for "your share of the conversation."
  - **Right:** two stacked panels — "Share of the narrative" (horizontal bars: brand name + percentage of mentions; the brand of focus is vermilion, others are slate) and "Source gravity" (top-N source list with gravity score and per-source sentiment sparkline).
- Below: a "Themes" row — a horizontal list of theme cards (Hallmarking, Regional pricing, Akshaya Tritiya), each with a 30-day sentiment trend.

**Key components.**
- `NarrativeAreaChart` — recharts or visx stacked area, single vermilion overlay.
- `ShareBar` — horizontal bar with name on left, percentage label on right.
- `SourceGravityRow` — name, gravity score (1 decimal), 30-day sentiment sparkline (10 bars, classed `pos`/`neu`/`neg`, height encodes intensity).
- `ThemeCard` — title, 30-day sentiment sparkline, mention count.

**Interactions.**
- Time range tabs drive a refetch.
- Clicking a theme card scopes the entire page to that theme (all charts update).
- Hovering a source row shows a tooltip with last appearance and a one-line "editor's note" snippet.

**Data shape.** Appendix B → `GET /api/narratives`, `GET /api/narratives/{id}`, `GET /api/sources/gravity`.

---

### 05 — Crisis Reconstruction

**Purpose.** The "I wish I'd had this" demo. Replays a real past crisis (the 2023 Tanishq hallmarking moment) hour by hour, showing what Insyt **would have detected, when, and what it would have drafted** — vs what actually happened. This is a sales-and-trust artifact as much as a product surface.

**Layout.**
- Big editorial header — H1 ("The Tanishq hallmarking moment, replayed day by day."), deck explaining the case, mono meta row with case ID + dates.
- **Scrubber** at top — a 96-hour timeline with playhead, hour markers, and event pins. Play/pause + speed controls + per-hour jump.
- **Three panes** below the scrubber, side-by-side:
  - **What was happening** — raw signals visible at this hour (e.g. "4,820 raw signals · 412 retained · 38 deemed material").
  - **What Insyt detected** — the platform's interpretation (severity, confidence, narrative ID).
  - **What Insyt would have drafted** — a fully composed statement, with timestamp, byline, and review status.
- **Verdict bar** at the bottom — large H2: *"If Tanishq had been on Insyt — the story would have moved twenty-nine hours earlier, in the language that mattered."*

**Key components.**
- `Scrubber` — controlled component with playhead position, hour ticks, and event pins. Use a custom range input + overlay layer for pins.
- `SignalListItem` — timestamped one-liner with source tag, sentiment dot.
- `DetectionCard` — severity badge, confidence score, prose interpretation.
- `DraftCard` — looks like a scaled-down version of the screen 06 statement output. Has an "embargoed" or "for review" tag.
- `VerdictBar` — large editorial closing statement, full-bleed.

**Interactions.**
- The scrubber drives ALL three panes simultaneously. Use a single `currentHour` state.
- Play/pause animates the playhead and panes update at 1Hz (configurable speed).
- The crisis case is parameterized — the platform can replay other crises (`/cases/:caseId`).

**Data shape.** Appendix B → `GET /api/cases/{id}`, `GET /api/cases/{id}/at/{hour}`.

---

### 06 — Action Drafting

**Purpose.** Where the CEO (or a comms head) actually responds. The platform drafts statements, briefing notes, internal memos in the user's voice — trained on their published material — ready for review and dispatch.

**Layout.**
- Header.
- **Top context strip** — three side-by-side cards:
  - The **story** being responded to (title, severity, mention/sentiment delta).
  - The **voice profile** being used (e.g. "Kalyan Jewellers · CEO comms — past 24 statements").
  - The **action type** chosen (Statement, Briefing note, Internal memo, etc.).
- Main canvas split:
  - **Left (60%):** the **document** — formatted as a press release / statement, with editor-style controls (header bar with "For attribution to T.S. Kalyanaraman · 25 Apr 2026"), H2 title, italic deck, body paragraphs. The document is editable inline.
  - **Right (40%):** a **review rail** with: tone analysis (who this is meant for), sentiment match against past statements, distribution targets (which outlets, in which language, by when), approve/edit/dispatch buttons.

**Key components.**
- `DocumentEditor` — for v1, can be a contentEditable region with Tailwind prose styles. Future: TipTap/Lexical.
- `VoiceProfileCard` — shows whose voice, source count, learned signature traits.
- `DistributionTargetRow` — outlet name + language + time + checkbox.
- `ApprovalButtonStack` — three vertically stacked buttons: Approve & dispatch, Save draft, Reject & retry.

**Interactions.**
- Clicking "Reject & retry" with a reason regenerates the draft.
- The voice profile is editable — clicking it opens a sheet with sample statements and tone sliders.
- Dispatch routes to a confirm-and-send flow (out of scope for v1; show a modal stub).

**Data shape.** Appendix B → `POST /api/drafts`, `GET /api/voice-profiles/{id}`, `POST /api/drafts/{id}/dispatch`.

---

### 07 — Regional Depth

**Purpose.** The screen that says *"India is not one media landscape, and the platform reads it that way."* Vernacular press alongside English, source-weighted, editor-reviewed. The competitive moat made visible.

**Layout.**
- Header.
- **Language selector strip** — chips for the 12 languages tracked, with active counts (EN · 218, ML · 96, TA · 112, HI · 128, +9 languages · 152).
- Main: a **two-column reading view**:
  - **Left:** the same story, *as it appears* in 4 languages — Malayalam (Manorama), Tamil (Daily Thanthi), Hindi (Dainik Jagran), English (The Hindu). Each panel has the actual headline (Malayalam script, Tamil script, etc.), a translated subtitle in italic, source meta, and a 2-line summary in English.
  - **Right:** "Penetration of the hallmarking story · by language · last 24h" — a bar grid showing source count, source gravity, and propagation index per language. Vermilion bars indicate active discussion; bone bars indicate the story has not yet reached that media surface.
- Below: an "Editor's notes" panel — pull-quotes from the platform's regional editors with their interpretation and a recommended frame.

**Key components.**
- `LanguageChip` — language code, count, active state.
- `LocalizedHeadlinePanel` — actual non-Latin headline, translation, source attribution. Use proper `lang="ml"`, `lang="ta"` attributes for screen readers and font fallback.
- `PenetrationBarRow` — language label, count, gravity, propagation, status indicator.
- `EditorPullquote` — italic blockquote, byline, region.

**Interactions.**
- Clicking a language chip filters the main view to that language only.
- Clicking a localized headline opens the Source Library scoped to that source.

**Font note.** Indic scripts (Malayalam, Tamil, Devanagari) need real font support. The mocks use system fonts; in production load `Noto Serif Malayalam`, `Noto Serif Tamil`, `Noto Serif Devanagari` via `next/font/google` and apply per-element with `lang` attributes.

**Data shape.** Appendix B → `GET /api/stories/{id}/regional`, `GET /api/penetration?theme={id}`.

---

### 08 — Ground Intelligence

**Purpose.** What is being said today, on the ground, at a particular place. Drawn from local reviews, regional press, vernacular social, walk-in surveys. Geographic, not linguistic.

**Layout.**
- Header.
- **Map canvas** — "The southern crescent · Kerala & Tamil Nadu" — an SVG map with bubbles at city centers. Bubble size = 24-hour signal volume. Bubble color = sentiment (vermilion adversarial, bone steady, positive moss).
- **Left rail:** a list of cities sorted by signal volume, each row showing volume, dominant sentiment, dominant theme.
- **Right rail:** when a city is selected, a focus pane showing: a hero quote pulled from the highest-gravity source there, recent signals, walk-in survey snippet count.
- Below: a **time series** strip — past 7 days of signal volume per region.

**Key components.**
- `MapCanvas` — SVG with a stylized map of Kerala/TN. For v1, can be a static SVG with bubble positions hardcoded by city; in production wire to a real geo lib (Mapbox or react-simple-maps with India boundaries).
- `CityRow` — city name, volume, sentiment dot, dominant theme.
- `GroundSignalCard` — quote, source, location, time.

**Interactions.**
- Clicking a bubble or a city row scopes the right rail and the time series to that city.
- Hovering a bubble shows a tooltip with city + volume + sentiment.

**Data shape.** Appendix B → `GET /api/ground/regions`, `GET /api/ground/regions/{id}/signals`.

---

### 09 — People Monitoring

**Purpose.** Individuals as distinct reputational entities — executives, public figures, brand ambassadors. Each with their own signal landscape, their own arc, their own audience.

**Layout.**
- Header.
- **People strip** — horizontal scroll of 6–8 monitored individuals. Each card has: portrait placeholder (use a serif initial in a slate square), name, role, current sentiment trend (7-day sparkline), severity dot.
- **Detail canvas** for the focused person:
  - **Left:** profile (portrait, name, title, organization, role-relevance, monitoring scope).
  - **Center:** a multi-pane view — current narrative arc (area chart), top mentions in the last 7 days (list of cards), associated themes.
  - **Right:** "Audience attention" — a bar grid showing where this person is being talked about (English press, Malayalam press, X/Twitter, Reddit, etc.) with reach estimates.

**Key components.**
- `PersonCard` — used in both the strip (small) and the detail (large) view.
- `MentionCard` — source tag, headline/quote, sentiment, time.
- `AttentionBarRow` — channel name, reach, mention count, sentiment direction.

**Interactions.**
- Clicking a person in the strip swaps the detail canvas (URL: `/people/[id]`).
- Hovering a sparkline shows the day-by-day breakdown.

**Data shape.** Appendix B → `GET /api/people`, `GET /api/people/{id}`.

---

### 11 — Source Library

**Purpose.** Every source the platform reads, presented as an editorial directory. Source gravity is composite — historical accuracy, audience trust, propagation index. Sources are ranked by tier, not algorithm. **Social platforms are first-class citizens here** — X, Instagram, Reddit, Telegram, WhatsApp public groups all appear as named sources alongside print and broadcast.

**Layout.**
- Header with H1 and totals (4,212 sources, 488 in active scope).
- **Top filter bar** — Tier (A/B/C/D + All), Medium (Print, Broadcast, Digital, YouTube, X / Twitter, Instagram, Reddit, Telegram, WhatsApp), Language, Sentiment to brand, active Theme.
- Three-column body:
  - **Left rail (taxonomy):** "By desk · 4,212" — hierarchical list. National English press · 218, Business & trade · 186, **Vernacular print · 488** (with sub-counts for Malayalam, Tamil, Hindi, +9 languages), Vernacular broadcast · 312, Independent / YouTube · 624, **Social · real-time · 812** (with sub-counts for X / Twitter, Instagram, Reddit, WhatsApp public groups, Telegram · trade), Local reviews · 1,148, Regulatory & gov. · 96, Walk-in surveys · 218. Below, a "Saved views" section with named curated lists.
  - **Center (directory):** a sortable table of sources, grouped by tier — A (institutionally trusted), B (regional regulars), C (independent / volatile), **D (social, real-time — read for velocity, not for truth)**. Columns: Source / location, Lang, Gravity, Reach, Read (★ rating), Frequency, Sentiment 30d (sparkline).
  - **Right rail (focus pane):** when a source is selected, a profile — portrait/logo placeholder, name, type, language, established date, gravity score with breakdown, sentiment-to-brand, an editor's note (italic prose), and a recent appearances list.
- The "ed" row variant (highlighted with a vermilion left border + slate-2 background) marks editorially flagged sources — including the active focus and live-trending sources.

**Key components.**
- `TaxonomyTree` — collapsible hierarchical list with counts.
- `SourceRow` — the directory row. Variant `ed` for highlighted.
- `SentimentSparkline` — 10 bars, classes `pos` / `neu` / `neg`, height encodes intensity. Use a small SVG component, drive from `{ value: number, sentiment: 'pos'|'neu'|'neg' }[]`.
- `GravityScore` — single number, tinted by tier (`hi`/`mid`/`lo` → bone / bone-2 / bone-3).
- `SourceFocusPane` — full profile, including the editor's note (italic, indented, vermilion left rule).
- `TierSectionHeader` — "Tier D · *social, real-time — read for velocity, not for truth*" + count + horizontal rule.

**Interactions.**
- Selecting a tier chip filters the directory.
- Clicking a source row populates the right focus pane (URL: `/sources/[id]`).
- The "Saved views" items in the left rail load preset filter combinations.

**Data shape.** Appendix B → `GET /api/sources`, `GET /api/sources/{id}`, `GET /api/sources/saved-views`.

---

## Routing — the Next.js App Router structure

Suggested structure. Adapt to your conventions.

```
app/
├── (product)/
│   ├── layout.tsx                    ← top meta bar + auth shell
│   ├── brief/
│   │   └── page.tsx                  ← screen 03
│   ├── narratives/
│   │   ├── page.tsx                  ← screen 04 (overview)
│   │   └── [id]/page.tsx             ← single narrative
│   ├── cases/
│   │   ├── page.tsx                  ← list of replayable crises
│   │   └── [id]/page.tsx             ← screen 05 (crisis replay)
│   ├── drafts/
│   │   ├── page.tsx                  ← drafts inbox
│   │   └── [id]/page.tsx             ← screen 06 (action drafting)
│   ├── regional/
│   │   └── page.tsx                  ← screen 07
│   ├── ground/
│   │   └── page.tsx                  ← screen 08
│   ├── people/
│   │   ├── page.tsx                  ← screen 09 (overview)
│   │   └── [id]/page.tsx             ← single person
│   └── sources/
│       ├── page.tsx                  ← screen 11
│       └── [id]/page.tsx             ← single source (or use a Sheet)
├── globals.css                       ← @layer base with tokens + font imports
└── layout.tsx                        ← root, fonts, providers
```

---

## Build order (recommended)

If you're starting from zero, this is the order that minimizes rework:

1. **Tokens + type + fonts.** `tailwind.config.ts`, `globals.css`, `next/font/google` for Spectral, JetBrains Mono, and the Noto Serif Indic family. Validate by reproducing the design tokens table above as a `/styleguide` page.
2. **Primitive components.** `WordmarkDot`, `PageHeader`, `SectionEyebrow`, `Rule`, `Tag`, `SeverityBar`, `SentimentSparkline`. These are used on every screen.
3. **Briefing card** family — used heavily in screen 03 and 04.
4. **Source row** + `SourceFocusPane` — needed for screens 04, 11, plus surfaced on most others.
5. **Screen 03 (Brief).** First screen, lowest interaction complexity, validates the system end-to-end.
6. **Screen 11 (Source Library).** High data volume, validates filtering, focus panes, sentiment sparklines at scale.
7. **Screen 04 (Narratives).** Adds charting.
8. **Screen 06 (Drafting).** Adds editor patterns.
9. **Screen 05 (Crisis Replay).** Adds the scrubber + simultaneous panes.
10. **Screens 07, 08, 09** — domain-specific, build last.

---

## Things that look like decoration but are not

A few details in the mocks are doing real work. Please preserve them:

- The **vermilion period** in every page H1 (`em + .stop`) is the platform signature. It must appear, and only there.
- The **§ glyph** before some section eyebrows (e.g. *§ The verdict*) marks a closing or summarial section. It is editorial, not decorative.
- The **mono 11px UPPERCASE eyebrow** with 0.12em tracking is the *only* uppercase text in the entire system. If you find yourself writing `text-transform: uppercase` anywhere else, stop.
- **Italics** carry meaning: italicized text in headlines is the emphasized noun ("Narrative *exploration*"). Italicized body text is editorial commentary or a deck. Italicized small-caps are *not* a thing — never combine them.
- The **highlighted "ed" row** in tables (vermilion left border, slate-2 background) means *the editor has flagged this row*. Do not use it as a generic "selected" state. Selected rows should use a hairline change or a chevron, not the editorial highlight.

---

## Contact / questions for the design author

When in doubt, the rule is: **does this read like the front page of a serious newspaper?** If yes, ship it. If it reads like a SaaS dashboard, it's wrong, no matter how nice the components.

See appendices A and B for the component map and API contracts.
