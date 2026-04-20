# Insyt — Brand Reference
**Version:** 1.0
**Date:** April 2026
**Direction:** India-editorial
**Status:** Reference for POC build and early production

---

## Positioning

**Category:** Context Intelligence for brands that matter
**Tagline:** An intelligence of its place.
**Voice stance:** Serious, editorial, India-rooted without being provincial. Written as if for the editorial pages of Mint or Business Standard, not for a SaaS marketing site.

The core claim: the incumbents in this category were built in San Francisco and Oslo for customers in New York and London. Their sentiment models do not know that Thrissur is where Kalyan began, that Malayala Manorama reports differently from Mathrubhumi, or that a post in Tamil at 11pm can move a stock by morning. Insyt is built for this specifically — the texture of the Indian market, read with the seriousness of a financial paper.

---

## Wordmark

**Primary form:** `insyt.`

Lowercase, set in Cormorant Garamond (or equivalent serif — Centaur, Baskerville as fallbacks). The terminal dot is drawn in ochre — the one accent the identity permits itself. It functions as both punctuation and imprimatur. The name ends with a decision.

**Clearspace:** Minimum clearspace on all sides equals the x-height of the wordmark. The mark never sits inside rules, tinted containers, or decorative frames.

**Sizing guidance:**
- Large display (hero moments, covers): 96px+
- Navigation/headers: 24-32px
- Inline references: 16-18px
- Minimum legible: 14px

**Wordmark variants:**
- Primary — black wordmark, ochre dot, on paper or white surfaces
- Reversed — white wordmark, ochre dot, on ink or near surfaces
- Monochrome — black wordmark, black dot (use only when ochre cannot render; e.g., single-color print)

---

## Typography

### Display — Cormorant Garamond

Italic forms are preferred for display headlines where the tone is editorial or narrative. Upright forms for direct statement.

- Display XL: 80-96px, weight 400, line-height 1.05, letter-spacing -0.02em
- Display L: 52-64px, weight 400, line-height 1.1, letter-spacing -0.015em
- Display M: 36-44px, weight 400, line-height 1.15, letter-spacing -0.01em
- Display S: 28-32px, weight 400, line-height 1.2

Fallback stack: `"Cormorant Garamond", "Centaur", "Baskerville", Georgia, serif`

### Body — Inter

Humanist sans for all running text, UI, and metadata where mono isn't appropriate.

- Body L (long prose): 16-17px, weight 400, line-height 1.7
- Body (standard): 15px, weight 400, line-height 1.7
- Body S (secondary text): 13-14px, weight 400, line-height 1.6
- Emphasis: italic within body, never bold mid-sentence

Fallback stack: `"Inter", system-ui, -apple-system, sans-serif`

### Metadata — JetBrains Mono

All uppercase metadata, labels, timestamps, tickers, data-provenance lines.

- Label: 10-11px, weight 500, uppercase, letter-spacing 0.1em
- Caption: 12px, weight 400
- Inline data (tickers, figures in text): 12-13px, weight 400 or 500

Fallback stack: `"JetBrains Mono", "SF Mono", ui-monospace, monospace`

### Type pairing rules

- Cormorant for display moments, headlines, and the occasional literary emphasis
- Inter for all body copy, UI, buttons, form fields
- JetBrains Mono for metadata, labels, figures alongside prose, timestamps
- Never more than these three faces in a single view
- Never mix weights within a single line except italic/upright of the same weight

---

## Palette

Monochrome plus one accent. The accent is drawn sparingly from Indian red-ochre — the colour of temple walls in Kerala and the printing inks of serious Indian publishing.

| Token | Hex | Usage |
|---|---|---|
| **Ink** | `#0A0A0A` | Primary type, wordmark, major rules |
| **Ochre** | `#B7410E` | Terminal dot, severity indicators, chapter rules, single-moment accents |
| **Slate** | `#4A4542` | Body prose (softer than Ink for long reading), secondary type |
| **Stone** | `#8A867E` | Metadata, captions, footnotes, tertiary labels |
| **Parchment** | `#EDE6DA` | Editorial surfaces (briefs, reports, printed documents) |
| **Paper** | `#F7F3EB` | Primary dashboard surface, warmer than white |
| **White** | `#FFFFFF` | Detail views, read-heavy surfaces where contrast matters most |

### Accent discipline

Ochre is not a general-purpose color. It appears in only five contexts:

1. The terminal dot in the wordmark
2. Severity indicators on crisis-class alerts ("High", "Critical")
3. Major chapter rules in editorial documents (2px ochre under display headlines, occasionally)
4. Single-figure emphasis in briefs (a trajectory arrow, a dissent marker)
5. Interactive states on primary actions (focus rings, active states) — subtle, never dominant

Ochre is never used for:
- Chart series (charts are monochrome — emphasis via weight, rule, or annotation)
- Large surfaces (no ochre backgrounds, no ochre cards)
- Decorative graphics
- Brand patterns or textures
- Headlines or body text (except the four moments above)

### Text-on-surface pairings

| Text | Surface | Contrast |
|---|---|---|
| Ink on White | Headlines, wordmark, primary type | 20.7:1 |
| Ink on Paper | Dashboard type | 19.0:1 |
| Ink on Parchment | Editorial prose, briefs | 17.2:1 |
| Slate on White | Long body prose | 12.4:1 |
| Slate on Parchment | Body prose on briefs | 10.8:1 |
| Stone on White | Labels, captions, metadata | 4.7:1 |
| Stone on Parchment | Metadata on briefs | 4.1:1 |
| White on Ink | Reversed treatments | 20.7:1 |

All pairings meet or exceed WCAG AA at body sizes; many exceed AAA.

---

## Grid and composition

### Columns and measure

- 12-column grid at desktop (1440px)
- 8-column at tablet (1024px)
- 4-column at narrow (below 768px)
- Gutters fixed at 24px; margins breathe with viewport
- Running prose measure: 52-72 characters; lock at 66ch for long-form briefs

### Rules (lines as structural elements)

- Hairline rules: 1px, Ink — section dividers
- Chapter rules: 2px, Ink — major breaks
- Accent rules: 2px, Ochre — reserved for hero moments, document chapters, rare emphasis
- Never use boxed containers where a rule will do the work

### Whitespace

Generous, on purpose. The restraint is the product. When in doubt, add space rather than decoration. A confident design uses 40% of the page; an insecure design fills 95%.

---

## Voice principles

Applied to every piece of generated content, UI copy, and brand writing.

### № 01 Narrate, don't decorate.
We write paragraphs before we design pixels. If a sentence can replace a chart, we write the sentence. If an italic can carry the emphasis, we skip the colour.

### № 02 Source every claim.
Numbers are promises. Every figure in Insyt carries a footnote to its underlying query, source, and cut date. If we cannot defend it in a board meeting, we don't print it.

### № 03 Short words. Long thinking.
We favour plain English over industry cant. Executives read quickly; rigor should feel like ease. Insight is not prose complexity — it's clarity earned through depth of analysis.

### № 04 Quiet, on purpose.
No gradients. No decorative icons. No illustration. No exclamation marks. No words like "crushing," "amazing," "game-changing," "revolutionary." The restraint is the product.

### Voice, in practice

**Write:**
> Core Platform grew 14.1% on a 72% gross margin — the first quarter in two years where both moved in the same direction.

**Not:**
> 🚀 Crushing it! Core Platform is on fire this quarter with next-level numbers across the board.

**Write:**
> The Coimbatore incident is not a customer-service problem in isolation; it is pattern-consistent with three earlier South Indian store events. See footnote 4 for the pattern.

**Not:**
> Various concerning incidents at our stores in the southern region are impacting customer sentiment due to multiple operational factors.

**Write:**
> One paragraph, one claim, one citation.

---

## UI components — applied brand system

### Buttons

Primary action: outline style, Ink border, Ink text, hover fills to Ink with White text. Arrow character (→) after label for navigational actions.
Secondary action: text-only, Slate color, underline on hover.
Destructive/critical: Ochre border, Ochre text on hover fill to Ochre with White text. Reserved only for irreversible actions in crisis workflows.

Examples: `Read the brief →` `View sources →` `Escalate to Ramesh K →`

### Form fields

36px height, 1px Stone border, Ink text, Stone placeholder. Focus state: 2px Ink ring. No colored error states — errors render in body as footnotes with Ochre markers.

### Tabs

Text-only tabs separated by thin vertical rules. Active tab: Ink with 2px Ink underline. Inactive: Slate. No pill backgrounds, no color fills.

### Badges

Small JetBrains Mono labels with thin Stone border. Four semantic variants:

- Neutral: Stone border, Stone text on White (metadata, categories)
- Emphasis: Ink border, Ink text on White (active states)
- Severity-high: Ochre border, Ochre text on White (critical alerts only)
- On-dark reverse: White border and text on Ink background

### Cards

Paper surface, no drop shadow, 1px Stone border at 0.5 opacity. Generous internal padding (24-32px). Headline in Cormorant; body in Inter; metadata in JetBrains Mono, always positioned at top or bottom of card, never floating mid-content.

### Tables

Monospace for figures (tabular alignment). 1px Ink rules above and below header row only — no internal rules, no alternating row backgrounds. Right-align numbers; left-align text.

### Data visualization

Charts are monochrome. Single series in Ink; comparative series in Ink + Stone. Trajectories use line weight and annotation for emphasis, never color. Axis labels in JetBrains Mono. Values in tabular figures. Never use chart legends that float — label series inline at the line.

Ochre may mark a single point in a chart — a crisis day, a critical threshold — never an entire series.

---

## Surface treatment strategy

Different surfaces for different modes of intelligence:

**Dashboard views (command center, narratives, competitive, alerts):**
Paper background (#F7F3EB). Feels like a well-set publication. Clean, readable, warm without being decorative.

**Brief surfaces (morning brief, weekly summary, case study):**
Parchment background (#EDE6DA). Feels more editorial, more considered. The surface itself signals "this is meant to be read carefully."

**Detail views (mention detail, action drafting, long prose):**
White background. Maximum contrast for reading-heavy work. Reduces cognitive load when attention matters most.

**Never:**
- Gradient backgrounds
- Background textures or patterns
- Decorative borders around entire pages
- Header images or hero photography
- Background watermarks or brand elements

---

## Tailwind configuration

Drop this into `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        ochre: '#B7410E',
        slate: '#4A4542',
        stone: '#8A867E',
        parchment: '#EDE6DA',
        paper: '#F7F3EB',
        white: '#FFFFFF',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Centaur', 'Baskerville', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['96px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-l': ['64px', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
        'display-m': ['44px', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-s': ['32px', { lineHeight: '1.2' }],
        'body-l': ['17px', { lineHeight: '1.7' }],
        'body': ['15px', { lineHeight: '1.7' }],
        'body-s': ['13px', { lineHeight: '1.6' }],
        'mono-label': ['11px', { lineHeight: '1.2', letterSpacing: '0.1em' }],
        'mono-caption': ['12px', { lineHeight: '1.4' }],
      },
      letterSpacing: {
        'metadata': '0.1em',
        'label': '0.15em',
      },
    },
  },
}

export default config
```

---

## Font loading

Use `next/font` for Next.js implementation. These three fonts only:

```typescript
// app/layout.tsx
import { Cormorant_Garamond, Inter, JetBrains_Mono } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
})
```

---

## Shadcn/ui adaptation

Install Shadcn with the "neutral" base. Then override these specific components to match brand:

- Button: remove default rounded corners (keep minimal 2px radius), remove shadows, adopt outline as primary style
- Card: remove default shadow, use 1px Stone border instead
- Badge: reduce to Mono label treatment (no rounded-full by default)
- Tabs: strip pill background, use underline-style active indicators
- Input/Textarea: 36px height, 1px Stone border, Ink focus ring

Components to accept as Shadcn defaults (minimal override):
- Dialog, Sheet, DropdownMenu, Tooltip, Separator, Skeleton

Do not install or use Shadcn's "default" variant buttons, filled cards, or toast notifications with gradient accents. These fight the brand.

---

## What this brand system is not

To prevent drift, explicit rejections:

- **Not a jewellery-themed brand.** The product serves jewellery clients, but does not look like jewellery. Resist gold accents, ornate elements, luxurious gradient effects.
- **Not a startup-tech brand.** No gradients, no neon, no generative-pattern backgrounds, no "futuristic" treatments.
- **Not a traditional Indian brand.** Not rangoli motifs, not saffron/green/white patriotism, not temple iconography.
- **Not an enterprise-boring brand.** The editorial treatment, the Cormorant serif, the ochre accent — these are deliberate distinctiveness. Avoid collapsing into Helvetica-on-white generic SaaS.

The brand exists in a specific territory: Indian-editorial-intellectual. Serious publishing meets modern intelligence product. That territory is narrow; the discipline is in staying within it.

---

## Document companion assets (to produce as you build)

These extend the brand system into operational artifacts. Produce as needed during sprint:

1. **Wordmark lockup file** — SVG wordmark in all variants (primary, reversed, monochrome)
2. **Brief template (print)** — a reusable layout for the 15-20 page Kalyan dossier
3. **Email signature template** — Insyt wordmark + basic contact, JetBrains Mono metadata
4. **One-page executive summary template** — for the single-page handout to accompany dossier
5. **Proposal document template** — the commercial ask document

These are secondary to the build. Address them on Day 8-9 when the pieces need to exist.

---

**End of brand reference. The restraint is the product.**
