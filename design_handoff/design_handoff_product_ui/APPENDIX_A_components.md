# Appendix A — Component map (HTML idiom → shadcn/ui)

This appendix maps the recurring components in the HTML mocks to concrete React components built on top of shadcn/ui primitives. Use this as a starting point; rename and reorganize to fit your project conventions.

shadcn/ui primitives referenced below are assumed to be installed via `npx shadcn-ui@latest add <name>`.

---

## Layout & chrome

### `<TopMetaBar />`

The 32px-tall mono strip at the top of every product page. Wordmark on the left, page name + date in the middle, environment/account on the right.

- Tailwind: `flex h-8 items-center justify-between px-8 border-b border-slate-edge font-mono text-[11px] tracking-[0.12em] uppercase text-bone-3`.
- No shadcn primitive needed — it's a plain flex row.
- Place in `app/(product)/layout.tsx`.

### `<Wordmark size="default" | "small" />`

```tsx
<span className="font-serif font-medium tracking-tight inline-flex items-baseline">
  Insyt<span className="text-vermilion">.</span>
</span>
```

The dot is the only colored element. Never restyle.

### `<PageHeader title={...} highlight={...} deck={...} />`

```tsx
<header className="space-y-3 mb-12">
  <h1 className="font-serif font-medium text-[56px] leading-[1.02] tracking-[-0.02em]">
    The morning <em className="not-italic"><span className="italic">{highlight}</span><span className="text-vermilion-3">.</span></em>
  </h1>
  <p className="font-serif italic text-[20px] leading-[1.45] text-bone-2 max-w-[720px]">
    {deck}
  </p>
</header>
```

Note: the H1 is rendered as plain text + an `<em>` for the highlighted noun + a `.` in vermilion. Don't compose it from three `<span>`s with extra spacing — the kerning needs to be tight.

### `<SectionEyebrow>{children}</SectionEyebrow>`

```tsx
<div className="font-mono text-[11px] tracking-[0.12em] uppercase text-bone-3 leading-none">
  {children}
</div>
```

For the "§ The verdict" variant, just include the glyph in the children.

---

## Editorial primitives

### `<SeverityBar value={1..5} />`

Five 4×12px ticks; the first `value` are vermilion-3, the rest are bone-4. Use 5 inline divs in a flex row with 2px gap.

### `<SentimentSparkline data={Point[]} />`

```ts
type Point = { value: number /* 0..100 */, sentiment: 'pos' | 'neu' | 'neg' }
```

Render 10 bars, 4px wide, 1px gap, height = `value`% of container. Color = `pos: positive`, `neu: bone-3`, `neg: vermilion-3`.

For v1 a plain inline div array works. If you scale to thousands of these, switch to a single SVG with `<rect>`s.

### `<Tag variant="outline" | "solid" | "warm" />`

Already a shadcn `Badge` use case — extend with a `warm` variant that uses vermilion.

### `<SourceFootnote n={number} sourceId={string} />`

A superscript number that opens the Source Library focused on that source. Use `next/link` with `?source={id}` query param consumed by the Source Library page (or a shadcn `Sheet`).

---

## Cards

### `<BriefingCard variant="hero" | "column" | "compact" />`

Composes a `Card` (shadcn) but with **no shadow, no rounded corners** — override `Card`'s defaults via `className`.

```tsx
<Card className="rounded-none border-0 border-t border-slate-edge p-0">
  <SectionEyebrow>{eyebrow}</SectionEyebrow>
  <h3 className="font-serif font-medium text-[24px] leading-[1.18] my-3">{title}</h3>
  <p className="font-serif italic text-[15px] text-bone-2 mb-2">{deck}</p>
  <p className="font-serif text-[15px] leading-[1.55]">{body}<SourceFootnote n={1} sourceId="..."/></p>
  <div className="flex items-center gap-3 mt-4">
    <SeverityBar value={severity} />
    <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-bone-3">{meta}</span>
  </div>
</Card>
```

The `hero` variant has bigger type. The `compact` variant drops the deck.

### `<DetectionCard />`, `<DraftCard />` (screen 05)

Same chassis as `BriefingCard` but with an embargo / status tag at the top.

---

## Tables & lists

### `<SourceRow source={...} highlighted={boolean} />`

The directory row. Use a CSS Grid with the column template from the mocks:

```tsx
<div className={cn(
  "grid grid-cols-[1.6fr_70px_90px_90px_70px_70px_1fr] gap-4 py-3.5 border-b border-slate-edge items-center text-[13px]",
  highlighted && "bg-slate-2 -mx-8 px-8 border-l-2 border-l-vermilion-3"
)}>
  <div className="flex flex-col gap-0.5">
    <span className="font-medium text-[14px] tracking-tight">{source.name}</span>
    <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-bone-3">{source.where}</span>
  </div>
  <div className="font-mono text-[11px] text-bone-2 text-right">{source.lang}</div>
  <div className={cn("font-mono text-[14px] font-medium text-right", gravityClass(source.gravity))}>
    {source.gravity.toFixed(1)}
  </div>
  <div className="font-mono text-[11px] text-right text-bone-2">{source.reach}</div>
  <div className="font-mono text-[11px] text-right text-bone-2">{source.read}</div>
  <div className="font-mono text-[11px] text-right text-bone-3">{source.frequency}</div>
  <SentimentSparkline data={source.sentiment30d} />
</div>
```

For a virtualized list at 4,212 rows, wrap in `@tanstack/react-virtual`.

### `<TaxonomyTree nodes={...} active={...} onSelect={...} />`

Plain recursive tree. shadcn doesn't have one; build it. Each node renders name + count, with optional `indent` style. Use `radix-ui/react-collapsible` for expand/collapse.

### `<SaveViewsList items={...} />`

Same primitive as the taxonomy tree but flat, prefixed with a "·" glyph.

---

## Filters

### `<FilterChipGroup label="Tier" options={...} value={...} onChange={...} />`

The chips at the top of screens 04 and 11. Use shadcn `ToggleGroup`:

```tsx
<div className="flex items-center gap-3 py-3">
  <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-bone-3">Tier</span>
  <ToggleGroup type="single" value={value} onValueChange={onChange}>
    {options.map(o => (
      <ToggleGroupItem key={o.value} value={o.value}
        className="rounded-none px-3 py-1 text-[12px] font-mono uppercase tracking-[0.1em] data-[state=on]:bg-bone data-[state=on]:text-slate">
        {o.label}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
</div>
```

The "warm" variant (vermilion border) is for adversarial / theme chips — add a `variant` prop.

---

## Charts

Use **Recharts** (works server-side with App Router) or **visx** for fine control. The system has only three chart types:

1. **Stacked area chart** (screen 04) — Recharts `<AreaChart>` with one stacked area per narrative + one vermilion overlay area for "your share."
2. **Horizontal bar chart** (screen 04 share-of-narrative, screen 07 penetration) — Recharts `<BarChart>` with `layout="vertical"`. Vermilion fill for the highlighted brand/language.
3. **Sparkline** (everywhere) — custom inline component, see `SentimentSparkline` above.

**Style guide for charts:**
- No gridlines except a single bottom axis rule (1px, slate-edge).
- No tooltips by default — use Recharts `<Tooltip>` only with custom content matching the editorial aesthetic.
- Axis labels in JetBrains Mono, 10px, tracking 0.12em, uppercase.

---

## The scrubber (screen 05)

Custom component. The structure:

```tsx
<div className="border-y border-slate-edge py-6">
  <div className="flex items-center justify-between mb-4">
    <h4>Replay timeline · 96 hours</h4>
    <PlaybackControls /> {/* play/pause + speed */}
  </div>
  <div className="relative h-12">
    {/* Hour ticks */}
    {hours.map(h => <div key={h} className="absolute top-0 w-px h-2 bg-slate-edge" style={{ left: `${(h/96)*100}%` }} />)}
    {/* Event pins */}
    {events.map(e => <EventPin key={e.id} event={e} pct={(e.hour/96)*100} />)}
    {/* Playhead */}
    <div className="absolute top-0 bottom-0 w-px bg-vermilion-3" style={{ left: `${(currentHour/96)*100}%` }}>
      <div className="absolute -top-1 -left-[3px] w-[7px] h-[7px] bg-vermilion-3 rotate-45" />
    </div>
  </div>
  <input type="range" min={0} max={96} step={0.1} value={currentHour}
    onChange={e => setCurrentHour(+e.target.value)}
    className="absolute inset-0 opacity-0 cursor-ew-resize" />
</div>
```

Keep `currentHour` in a parent context so the three panes (`SignalListPane`, `DetectionPane`, `DraftPane`) re-fetch / re-render when it changes.

---

## State, fetching, and data flow

- Use **Server Components** for the initial render of every screen — the data is editorial and most pages are read-mostly.
- Use **TanStack Query** (`@tanstack/react-query`) for client-side refetching and the scrubber's per-hour data.
- Use **URL state** (`searchParams`) for filters, selected sources, and selected people — these should be shareable links.
- Use a small `nuqs` or hand-rolled `useQueryState` hook for typed URL state.

---

## Accessibility checklist

- Every page H1 must be a single `<h1>`. The deck below is `<p>`, not `<h2>`.
- Indic-script text **must** carry `lang="ml"`, `lang="ta"`, `lang="hi"` etc. for screen readers and font fallback.
- The vermilion period in the wordmark is decorative — wrap in `<span aria-hidden="true">.</span>`.
- Sentiment sparklines need an `aria-label` summarizing the trend (e.g. *"30-day sentiment, ending negative"*).
- The crisis scrubber needs keyboard support: arrow keys ±1 hour, Space play/pause.
- Color contrast: bone-3 (#7A7263) on slate (#0E0D0B) is borderline — use only for tertiary meta, never for body. bone-2 on slate is the floor for readable secondary text.
