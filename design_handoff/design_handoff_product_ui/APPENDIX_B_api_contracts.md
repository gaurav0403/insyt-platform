# Appendix B — API contracts (FastAPI ↔ Next.js)

The shape of the data each screen needs. These are the contracts the UI implies — the backend team can adapt names but should preserve the shapes. All endpoints assume a `/api/v1` prefix; auth is bearer-token (out of scope here).

All timestamps are ISO 8601 with timezone (`2026-04-25T06:23:00+05:30`). All sentiment values are floats in `[-1, 1]`. All gravity scores are floats in `[0, 10]`, one decimal. All currencies are strings with units (`"₹2.4 cr"`).

---

## Shared types

```python
# Pydantic models (FastAPI)

from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime

Sentiment = Literal["pos", "neu", "neg"]
Tier = Literal["A", "B", "C", "D"]
Severity = Literal[1, 2, 3, 4, 5]
LangCode = Literal["EN", "ML", "TA", "HI", "TE", "KN", "BN", "MR", "GU", "PA", "OR", "AS"]

class SentimentPoint(BaseModel):
    value: float = Field(ge=0, le=100)  # height 0..100
    sentiment: Sentiment

class SourceRef(BaseModel):
    id: str
    name: str
    tier: Tier
    medium: str  # "Print" | "Broadcast" | "YouTube" | "X" | "Instagram" | ...
    lang: LangCode

class TimeRange(BaseModel):
    start: datetime
    end: datetime
```

---

## Screen 03 — Daily Intelligence

### `GET /api/v1/brief/today`

Returns the morning brief as an editorial document.

```python
class Brief(BaseModel):
    generated_at: datetime
    signals_processed: int  # e.g. 4212
    lede: str  # one sentence, italic in UI
    meta: dict  # market_open, weather_of_day, etc — flexible

    hero: BriefingStory
    columns: list[BriefingStory]  # 2-3 secondary stories
    what_else: list[BriefingLine]  # one-liners
    agenda: list[AgendaItem]

class BriefingStory(BaseModel):
    id: str
    eyebrow: str  # "REGIONAL · MALAYALAM"
    title: str
    deck: str  # italic, single sentence
    body: str  # 2-4 sentences
    sources: list[SourceRef]  # for footnote rendering
    severity: Severity
    narrative_id: Optional[str]  # link to narrative exploration
    delta: Optional[str]  # "+318% mentions vs 7d"

class BriefingLine(BaseModel):
    id: str
    eyebrow: str
    title: str
    severity: Severity
    source: SourceRef

class AgendaItem(BaseModel):
    id: str
    title: str
    owner: Optional[str]
    due: Optional[str]  # "By 10:00 IST"
```

---

## Screen 04 — Narrative Exploration

### `GET /api/v1/narratives?range=30d&region=KL&theme=hallmarking`

```python
class NarrativesView(BaseModel):
    range: TimeRange
    volume_series: list[VolumeBucket]  # for the area chart
    share: list[ShareRow]  # who owns the conversation
    top_sources: list[SourceWithGravity]
    themes: list[ThemeCard]

class VolumeBucket(BaseModel):
    t: datetime
    by_narrative: dict[str, int]  # narrative_id -> count
    your_share: int

class ShareRow(BaseModel):
    entity: str  # brand name
    is_you: bool  # vermilion if true
    pct: float
    sentiment: float

class SourceWithGravity(BaseModel):
    source: SourceRef
    gravity: float
    sentiment_30d: list[SentimentPoint]
    last_seen: datetime
    editor_note: Optional[str]

class ThemeCard(BaseModel):
    id: str
    name: str
    mention_count: int
    sentiment_30d: list[SentimentPoint]
```

### `GET /api/v1/narratives/{id}` — single narrative drilldown

Returns the same shape scoped to one narrative.

---

## Screen 05 — Crisis Reconstruction

### `GET /api/v1/cases/{id}`

```python
class Case(BaseModel):
    id: str  # "tanishq-hallmarking-2023"
    title: str
    deck: str
    range: TimeRange  # 96 hours
    events: list[CaseEvent]  # for scrubber pins
    verdict: str  # large editorial closing statement

class CaseEvent(BaseModel):
    hour: float  # 0..96
    label: str
    kind: Literal["signal", "detection", "draft", "external"]
```

### `GET /api/v1/cases/{id}/at/{hour}`

Returns the three-pane state at hour H.

```python
class CaseSnapshot(BaseModel):
    hour: float
    signals: SignalsPane
    detection: DetectionPane
    draft: DraftPane

class SignalsPane(BaseModel):
    raw_count: int  # 4820
    retained: int  # 412
    material: int  # 38
    items: list[SignalItem]

class SignalItem(BaseModel):
    t: datetime
    source: SourceRef
    summary: str
    sentiment: Sentiment

class DetectionPane(BaseModel):
    severity: Severity
    confidence: float  # 0..1
    interpretation: str  # prose
    narrative_id: Optional[str]

class DraftPane(BaseModel):
    drafted_at: datetime
    audience: str  # "Kerala outlets · embargoed"
    title: str
    deck: str
    body: list[str]  # paragraphs
    review_status: Literal["unreviewed", "approved", "rejected"]
```

---

## Screen 06 — Action Drafting

### `POST /api/v1/drafts`

```python
class DraftRequest(BaseModel):
    story_id: str
    voice_profile_id: str
    action_type: Literal["statement", "briefing_note", "internal_memo", "social_post"]
    constraints: Optional[dict]  # length, tone overrides

class Draft(BaseModel):
    id: str
    story: BriefingStory  # context
    voice_profile: VoiceProfile
    action_type: str
    document: DraftDocument
    review: ReviewRail

class DraftDocument(BaseModel):
    eyebrow: str  # "Statement · 25 Apr 2026 · For attribution to T.S. Kalyanaraman"
    title: str
    deck: str
    body: list[str]  # markdown paragraphs
    byline: Optional[str]

class VoiceProfile(BaseModel):
    id: str
    name: str  # "Kalyan Jewellers · CEO comms"
    sample_count: int  # 24 statements
    learned_traits: list[str]  # signature phrases, sentence length, etc

class ReviewRail(BaseModel):
    tone_match: float
    sentiment_match: float
    distribution_targets: list[DistributionTarget]

class DistributionTarget(BaseModel):
    outlet: str
    lang: LangCode
    when: datetime
    selected: bool
```

### `POST /api/v1/drafts/{id}/dispatch` — fires the distribution
### `POST /api/v1/drafts/{id}/regenerate` — body: `{ reason: str }`
### `GET /api/v1/voice-profiles/{id}` — voice profile detail for the sheet

---

## Screen 07 — Regional Depth

### `GET /api/v1/stories/{id}/regional?theme=hallmarking`

```python
class RegionalView(BaseModel):
    languages: list[LanguageEntry]  # for the language chip strip
    panels: list[LocalizedPanel]
    penetration: list[PenetrationRow]
    editor_notes: list[EditorPullquote]

class LanguageEntry(BaseModel):
    code: LangCode
    label: str  # "Malayalam"
    source_count: int
    active: bool

class LocalizedPanel(BaseModel):
    lang: LangCode
    source: SourceRef
    headline_native: str  # actual non-Latin headline
    headline_translated: str  # English, italic
    summary_en: str  # 2 lines
    published_at: datetime

class PenetrationRow(BaseModel):
    lang: LangCode
    source_count: int
    avg_gravity: float
    propagation_index: float  # 0..1
    status: Literal["active", "emerging", "absent"]  # vermilion / bone / faint

class EditorPullquote(BaseModel):
    quote: str  # italic
    editor_name: str
    region: str
```

---

## Screen 08 — Ground Intelligence

### `GET /api/v1/ground/regions?bbox=...`

```python
class GroundView(BaseModel):
    map_bounds: dict  # geojson bbox
    cities: list[CityBubble]
    time_series: list[VolumeBucket]  # past 7d

class CityBubble(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    volume_24h: int
    sentiment: float  # -1..1
    dominant_theme: str
```

### `GET /api/v1/ground/regions/{city_id}/signals`

```python
class GroundSignals(BaseModel):
    city: CityBubble
    hero_quote: GroundQuote
    recent: list[GroundQuote]
    walk_in_count: int

class GroundQuote(BaseModel):
    text: str
    source: SourceRef
    location: str  # neighborhood
    t: datetime
```

---

## Screen 09 — People Monitoring

### `GET /api/v1/people`

Returns the strip.

```python
class PeopleStrip(BaseModel):
    people: list[PersonCard]

class PersonCard(BaseModel):
    id: str
    name: str
    role: str
    organization: str
    sentiment_7d: list[SentimentPoint]
    severity: Severity
```

### `GET /api/v1/people/{id}`

```python
class PersonDetail(PersonCard):
    monitoring_scope: str
    narrative_arc: list[VolumeBucket]
    recent_mentions: list[Mention]
    associated_themes: list[ThemeCard]
    attention_by_channel: list[AttentionRow]

class Mention(BaseModel):
    source: SourceRef
    headline: str
    sentiment: Sentiment
    t: datetime

class AttentionRow(BaseModel):
    channel: str  # "X / Twitter", "Malayalam press"
    reach: int
    mention_count: int
    sentiment_direction: Sentiment
```

---

## Screen 11 — Source Library

### `GET /api/v1/sources?tier=&medium=&lang=&theme=&q=`

```python
class SourceLibraryView(BaseModel):
    totals: SourceTotals
    taxonomy: list[TaxonomyNode]
    saved_views: list[SavedView]
    sources: list[Source]  # the directory rows, paginated

class SourceTotals(BaseModel):
    total: int  # 4212
    in_scope: int  # 488

class TaxonomyNode(BaseModel):
    label: str  # "Vernacular print"
    count: int
    children: list["TaxonomyNode"]
    active: bool

class SavedView(BaseModel):
    id: str
    name: str  # "The hallmarking watch"
    count: int
    filter: dict  # the query params it represents

class Source(BaseModel):
    id: str
    name: str
    where: str  # "Print + broadcast · Kottayam"
    editor: Optional[str]
    tier: Tier
    medium: str
    lang: LangCode
    gravity: float  # 0..10, one decimal
    reach: str  # "2.1M / day" — display string
    read_rating: int  # 1..3 (★)
    frequency: str  # "hourly" | "daily" | "live" | ...
    sentiment_30d: list[SentimentPoint]
    last_seen: datetime
    is_editorially_flagged: bool  # the "ed" highlight
```

### `GET /api/v1/sources/{id}`

Full focus pane.

```python
class SourceProfile(Source):
    established: Optional[str]  # "est. 2022"
    based_in: Optional[str]
    subscribers: Optional[int]
    median_views: Optional[int]
    cadence: Optional[str]
    historical_accuracy: Optional[float]  # 0..1
    audience_trust: Optional[Literal["High", "Medium", "Low"]]
    crossover_history: Optional[str]  # "3 of 14 → EN press"
    sentiment_to_brand: float  # -1..1
    editor_note: Optional[EditorNote]
    recent_appearances: list[Appearance]

class EditorNote(BaseModel):
    body: str  # editorial prose, italic in UI
    by: str  # "V. Menon"

class Appearance(BaseModel):
    t: datetime
    title: str
    duration: Optional[str]  # "14 min"
    reach: Optional[int]
```

---

## Auth, rate limits, errors

- All endpoints require `Authorization: Bearer <jwt>`. JWT carries `account_id` and `permissions`.
- Rate limit per account: 600 req/min for read endpoints, 60 req/min for `/drafts` writes.
- Errors are RFC 7807 `application/problem+json`:
  ```json
  { "type": "/errors/source-not-found", "title": "Source not found", "status": 404, "detail": "...", "instance": "..." }
  ```

## Realtime considerations

- The Daily Intelligence brief is regenerated server-side at 06:00 IST and cached. Mid-day mutations come via SSE: `GET /api/v1/brief/stream` (text/event-stream) emits `signal_added`, `severity_changed`, `narrative_updated`.
- The Crisis Reconstruction scrubber should pre-fetch hours in batches of 8 (~5MB each) — don't re-fetch per hour.
- The Source Library should support a long-poll or websocket for live sources (X / Twitter, Instagram, WhatsApp) — but v1 can poll every 60s and it'll feel fine.
