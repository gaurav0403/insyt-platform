# Insyt — Kalyan POC Build Brief
**Version:** 1.0
**Date:** April 2026
**Sprint window:** 10 days
**Audience:** Claude Code / engineering team
**Target meeting:** Dr. Sajeev Chemmany, CMO, Kalyan Jewellers

---

## 0. How to use this document

This is the technical and strategic specification for the 10-day build sprint. It assumes familiarity with modern web development (React, Next.js, Tailwind, Shadcn) and standard data engineering patterns. It does not explain fundamentals.

**Read order for Claude Code sessions:**
1. Sections 1-2 (context and goals) — read once at sprint start
2. Section 3 (architecture) — reference before any build decision
3. Section 4 (ingestion) — for days 1-2 work
4. Section 5 (analysis) — for days 3-4 work
5. Section 6 (UI) — for days 5-8 work
6. Section 7 (case study) — for days 6-7 work, the hero asset
7. Section 8 (prompting) — reference throughout
8. Section 9 (daily plan) — sprint orchestration
9. Section 10 (done-definitions) — what "complete" means per deliverable
10. Section 11 (demo checklist) — day 10 verification

**What is NOT in this document:**
- Business strategy reasoning (already decided upstream)
- Naming or branding debates (locked)
- Whether to build (decision made)
- Post-POC product roadmap (out of scope for sprint)

---

## 1. Context — what we're building and why

### The product in one paragraph
Insyt is a context-intelligence platform for Indian enterprise brands. It ingests public signals across news, social, regulatory filings, and reviews, then produces editorial intelligence briefs for CMO-level decision-makers. The differentiator is not monitoring coverage but contextual interpretation — understanding what a mention means in narrative, regulatory, competitive, and action terms.

### The immediate goal
A working prototype, configured and trained on Kalyan Jewellers (NSE: KALYANKJIL) data, demonstrable on Day 11 to Dr. Sajeev Chemmany (CMO). The goal of that meeting is to close a ₹4.5L/month 90-day POC with path to ₹6-8L/month annual contract.

### What success on Day 11 looks like
Sajeev concludes the meeting with one of:
- "When can we start?"
- "Let me bring in [named stakeholders] for the next meeting"
- "I want to do this. Let me figure out scope internally."

Any of the above = success. The build must be sufficient to produce those outcomes.

### What success is NOT
- A polished general-purpose product
- Full feature completeness
- All data sources live
- Perfect UI
- Production-grade reliability across all paths

Prototype, not product. Every scope decision in this document optimizes for the Sajeev meeting, not for post-POC operations.

---

## 2. Scope — rigorous in/out decisions

### IN scope (must work by Day 10)

**Data sources, live:**
- English news from 15-20 Indian publications
- Twitter/X via twitterapi.io (30-50 tracked handles)
- YouTube monitoring (Kalyan channel + 3 competitor channels + 2 news channels)
- BSE/NSE announcement scraping (Kalyan + 5 competitors)
- Google Reviews for 10 pilot Kalyan stores
- SERP API (Serper) for daily discovery across long-tail sources

**Data sources, sampled:**
- Malayalam press: 2 publications live (Manorama, Mathrubhumi)
- Tamil press: 1 publication live (Dinamalar) — others as placeholder
- Hindi press: 1 publication live (Dainik Jagran) — others as placeholder
- AmbitionBox/Glassdoor: sample data, clear UI implication of fuller coverage

**Analysis capabilities:**
- Entity resolution against Kalyan taxonomy
- Sentiment tagging per mention
- Narrative clustering across time windows
- Relevance scoring and filtering
- Severity scoring for crisis detection
- Peer/competitive comparative analysis

**Intelligence outputs:**
- Daily morning brief generation (editorial format)
- Real-time alert generation for crisis-class events
- Weekly narrative summary
- Action draft generation for 5 scenario types
- The January 2025 case study replay (hero asset)

**UI views, all 10:**
See Section 6 for full specification.

### OUT of scope (explicit — defer to POC, not sprint)

- TV broadcast transcription (flag Phase 2)
- Full regional language deep coverage (sample only)
- Store-level monitoring for all 300+ stores (10 stores only)
- International coverage (US, Malaysia, GCC)
- Full investor/analyst call transcription and analysis
- Mobile app
- Multi-tenant architecture
- Role-based access control
- API access for clients
- White-label reporting
- WhatsApp bot integration
- Production-grade observability and alerting
- Full admin console
- User management UI
- Billing integration
- Comprehensive test coverage (critical paths only)

### Placeholder strategy (show but label as Phase 2)

Some features get UI-only treatment to communicate roadmap without building them:
- Store-level India heatmap (10 real stores, rest placeholder)
- Ambassador reputation cards (structural view, limited real data)
- Regional language deep-dive views
- TV broadcast monitoring view
- Compliance/SEBI dashboard view

Every placeholder view must be explicitly labeled in-UI as "Phase 2" or "Expanding in POC" — never pretend to be fully functional.

---

## 3. System architecture

### Stack decisions (non-negotiable)

| Layer | Technology | Rationale |
|---|---|---|
| Frontend framework | Next.js 14+ App Router | Server components, fast builds, Vercel deploy |
| UI component library | Shadcn/ui | Industry standard, easily themeable to brand tokens |
| Styling | Tailwind CSS | Speed, brand token mapping |
| Backend language | Python 3.11+ | Data engineering ecosystem, Anthropic SDK maturity |
| Backend framework | FastAPI | Async support, automatic docs, type safety |
| Task queue | Celery + Redis | Proven, simple, sufficient for this scale |
| Primary database | PostgreSQL 15+ | Relational for entities/mentions/narratives |
| Object storage | S3 (or Wasabi/B2 for cost) | Transcripts, raw HTML, media |
| Search | Typesense | Simpler than Elasticsearch, plenty fast for POC |
| Cache | Redis | Session, rate limiting, short-lived data |
| LLM — primary | Claude Haiku 4.5 | Volume work: classification, extraction, sentiment |
| LLM — complex | Claude Sonnet 4.6 | Narrative analysis, action drafting, brief generation |
| Deployment | Vercel (frontend), Railway/Render (backend) | Fast ship, minimal DevOps |
| Observability | Sentry + Axiom | Error tracking, basic logging |

**Do not** introduce Kubernetes, microservices, Kafka, Airflow, Elasticsearch, Datadog, or any infrastructure that signals "production-scale engineering" during this sprint. They are inappropriate for the scale and timeline.

### Data flow (high-level)

```
[Sources] → [Ingestion Workers] → [Raw Storage (S3)]
                  ↓
           [Normalization] → [PostgreSQL: mentions table]
                  ↓
           [Entity Resolution] → [PostgreSQL: entity links]
                  ↓
           [Analysis Pipeline] → [PostgreSQL: enriched mentions]
                  ↓
           [Narrative Clustering] → [PostgreSQL: narratives table]
                  ↓
           [Intelligence Generation] → [PostgreSQL: briefs, alerts, actions]
                  ↓
           [API Layer (FastAPI)] ← [Next.js Frontend] ← [User]
```

### Repository structure

```
insyt/
├── frontend/                    # Next.js application
│   ├── app/
│   │   ├── (dashboard)/
│   │   ├── api/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # Shadcn components
│   │   ├── brand/              # Insyt-specific brand components
│   │   └── views/              # The 10 core views
│   ├── lib/
│   └── styles/
│
├── backend/
│   ├── ingestion/
│   │   ├── news/
│   │   ├── twitter/
│   │   ├── youtube/
│   │   ├── reviews/
│   │   ├── filings/
│   │   └── serp/
│   ├── analysis/
│   │   ├── entities.py
│   │   ├── sentiment.py
│   │   ├── narratives.py
│   │   ├── severity.py
│   │   └── relevance.py
│   ├── intelligence/
│   │   ├── briefs.py
│   │   ├── alerts.py
│   │   ├── actions.py
│   │   └── prompts/            # All LLM prompts versioned here
│   ├── api/
│   │   ├── routes/
│   │   └── main.py
│   ├── db/
│   │   ├── models.py
│   │   ├── migrations/
│   │   └── seed.py
│   └── workers/
│       ├── celery_app.py
│       └── tasks.py
│
├── taxonomy/
│   └── kalyan_v1.yaml          # Machine-readable taxonomy
│
├── case_study/
│   └── jan_2025_replay/        # Hero asset data and logic
│
├── docs/
│   └── handoff_brief.md        # This document
│
└── infra/
    ├── docker-compose.yml       # Local dev environment
    └── deployment/
```

### Database schema (core tables)

```sql
-- Entities: companies, people, ambassadors, collections, etc.
entities (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,  -- company, person, collection, ambassador, competitor
  canonical_name TEXT NOT NULL,
  aliases TEXT[],
  metadata JSONB,
  client_id UUID REFERENCES clients(id),
  created_at TIMESTAMPTZ
)

-- Raw mentions as ingested
mentions (
  id UUID PRIMARY KEY,
  source_type TEXT NOT NULL,  -- news, twitter, youtube, review, filing
  source_url TEXT,
  source_publication TEXT,
  published_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ,
  raw_content TEXT,
  language TEXT,
  region TEXT,
  metadata JSONB
)

-- Mention-entity links (many-to-many)
mention_entities (
  mention_id UUID REFERENCES mentions(id),
  entity_id UUID REFERENCES entities(id),
  confidence FLOAT,
  context_snippet TEXT,
  PRIMARY KEY (mention_id, entity_id)
)

-- Enriched analysis per mention
mention_analysis (
  mention_id UUID PRIMARY KEY REFERENCES mentions(id),
  sentiment_score FLOAT,  -- -1 to 1
  sentiment_confidence FLOAT,
  relevance_score FLOAT,  -- 0 to 1
  severity_score FLOAT,   -- 0 to 1
  themes TEXT[],
  key_claims TEXT[],
  action_triggers TEXT[],
  analyzed_at TIMESTAMPTZ
)

-- Narrative clusters
narratives (
  id UUID PRIMARY KEY,
  entity_id UUID REFERENCES entities(id),
  title TEXT,
  description TEXT,
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  mention_count INTEGER,
  sentiment_trajectory FLOAT[],
  velocity_score FLOAT,
  status TEXT,  -- emerging, active, declining, resolved
  metadata JSONB
)

-- Narrative-mention links
narrative_mentions (
  narrative_id UUID REFERENCES narratives(id),
  mention_id UUID REFERENCES mentions(id),
  assigned_at TIMESTAMPTZ,
  PRIMARY KEY (narrative_id, mention_id)
)

-- Daily briefs generated
briefs (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  date DATE,
  headline TEXT,
  subheadline TEXT,
  opening_paragraph TEXT,
  sections JSONB,
  metrics JSONB,
  generated_at TIMESTAMPTZ
)

-- Alerts fired
alerts (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  triggered_at TIMESTAMPTZ,
  severity TEXT,  -- low, medium, high, critical
  narrative_id UUID REFERENCES narratives(id),
  mention_ids UUID[],
  summary TEXT,
  recommended_actions JSONB,
  status TEXT  -- open, acknowledged, resolved
)

-- Action drafts
action_drafts (
  id UUID PRIMARY KEY,
  alert_id UUID REFERENCES alerts(id),
  draft_type TEXT,  -- social_mirror, sebi_disclosure, press_statement, internal_note, etc.
  content TEXT,
  language TEXT,
  generated_at TIMESTAMPTZ,
  metadata JSONB
)

-- Clients (Kalyan for POC)
clients (
  id UUID PRIMARY KEY,
  name TEXT,
  taxonomy_path TEXT,  -- path to YAML config
  config JSONB,
  created_at TIMESTAMPTZ
)
```

---

## 4. Ingestion layer — detailed specification

### Priority order (Days 1-2 of sprint)

Ingestion must come online in this order. Each must be demonstrable before moving to the next.

**Day 1 morning:**
1. English news scraping infrastructure (the hardest to set up properly)
2. twitterapi.io integration for top 30 handles
3. BSE/NSE announcement feed

**Day 1 afternoon:**
4. YouTube monitoring for Kalyan's own channel
5. SERP API (Serper) integration
6. Initial taxonomy loaded into database

**Day 2:**
7. Google Reviews for 10 pilot stores
8. Malayalam news (Manorama, Mathrubhumi) — HTML scrapers
9. Tamil news (Dinamalar) — HTML scraper
10. Hindi news (Dainik Jagran) — HTML scraper
11. YouTube: competitor channels + news channels
12. Begin 90-day historical backfill where possible

### Source configurations

**English news (Tier 1 - must work):**
| Publication | Method | Notes |
|---|---|---|
| Economic Times | RSS + scraper fallback | economictimes.indiatimes.com |
| Mint / Livemint | RSS + scraper | livemint.com |
| Business Standard | Scraper | business-standard.com |
| Moneycontrol | RSS + scraper | moneycontrol.com |
| Financial Express | Scraper | financialexpress.com |
| BloombergQuint / NDTV Profit | Scraper | ndtvprofit.com |
| The Hindu Business Line | RSS + scraper | thehindubusinessline.com |
| Business Today | Scraper | businesstoday.in |

**English news (Tier 2 - best effort):**
- Times of India, Hindustan Times, The Hindu, Indian Express
- Forbes India, Inc42, YourStory
- Retail Jeweller India, Solitaire International (trade press — critical for domain)

**Twitter/X handles (via twitterapi.io):**

Company and executives:
- @KalyanJewellers, @CandereDotCom
- Any verified Kalyanaraman family handles (Ramesh, Rajesh, TS)

Competitors:
- @TanishqJewelry, @malabargoldiamd, @joyalukkas
- @sencogoldindia, @pcjeweller_com, @caratlane, @Bluestone_in

Ambassadors:
- @SrBachchan (Amitabh), @juniorbachchan (Abhishek, occasional mentions)
- @KatrinaKaif, @iamnagarjuna, @ShivaRajKumar
- @ManjuWarrier_, @iamsrk (Shah Rukh for GCC)

Financial journalists (verify current handles):
- Key ET, Mint, Moneycontrol business reporters
- Retail sector analysts active on Twitter

Retail equity voices:
- @MoneyLifers, well-known Indian retail traders (verify and filter for quality)

**YouTube channels:**
- Kalyan Jewellers official
- Tanishq official, Malabar Gold official, Joyalukkas official
- CNBC-TV18, ET Now, Moneycontrol Pro
- Mathrubhumi News (Malayalam)
- Thanthi TV (Tamil)

**BSE/NSE feeds:**
- Scrape corporate announcements for KALYANKJIL, TITAN, SENCO, PCJEWELLER, THANGAMAYL daily
- Source: bseindia.com/corporates and nseindia.com/companies-listing

**Google Reviews:**
- Top 10 Kalyan stores by city-tier spread:
  - Thrissur (flagship), Kochi, Trivandrum, Chennai, Bengaluru, Hyderabad, Mumbai, Delhi, Kolkata, Ahmedabad
- Use Places API or scrape carefully; refresh daily

**SERP API (Serper):**
- Daily queries at 6am IST:
  - `Kalyan Jewellers` (general news)
  - `KALYANKJIL` (financial)
  - `Kalyan controversy` (risk)
  - Same pattern for each Tier-1 competitor
- Approximately 50-80 queries per day at launch

### Rate limits and cost budgets

| Source | Rate limit | Monthly cost target (sprint) |
|---|---|---|
| twitterapi.io | 1000+ QPS supported, pay-per-tweet | ~$50 for sprint period |
| Serper | As needed | ~$30 for sprint |
| News scraping | Respect robots.txt, 1 req/5sec per domain | Infra cost only |
| YouTube | Official API free tier + Whisper for transcription | ~$20 for sprint |
| OpenAI Whisper | $0.006/min | ~$50 for sprint |
| Claude Haiku | $1/$5 per MTok | ~$80 for sprint |
| Claude Sonnet | $3/$15 per MTok | ~$60 for sprint |

Total sprint data/AI cost estimate: ~$300-400. This is for build and test, not production load.

### Ingestion implementation notes

**Robustness expectations:**
- Every scraper must have timeout (30s max), retry logic (3x with exponential backoff), and failure logging
- Failures should not cascade — one dead source should not stop others
- Deduplication at URL + content-hash level before storage
- Language detection on every mention before analysis

**Do not over-engineer:**
- Single-threaded workers are fine for sprint scale
- Daily batch + on-demand refresh is enough — no real-time streaming needed
- No Kafka, no streams, no complex orchestration

**Historical backfill strategy:**
- Target 90 days of data for Kalyan and top 3 competitors
- Budget 2 hours per day during Days 1-3 of sprint for backfill jobs
- Accept that some sources won't have full 90 days — document gaps
- January 2025 window (case study) needs maximum completeness — Jan 10 through Feb 5, 2025 — prioritize backfill for this window specifically

---

## 5. Analysis layer — detailed specification

### Pipeline order per mention

Each new mention passes through this pipeline:

```
[Raw mention] → [Language detect] → [Entity extraction] → [Entity resolution] →
[Relevance scoring] → [If relevant: Sentiment + Themes] → [Severity scoring] →
[Narrative cluster assignment] → [Action trigger check] → [Persist]
```

### Entity resolution

Match extracted entities against Kalyan taxonomy (loaded from `taxonomy/kalyan_v1.yaml` at startup).

- Fuzzy matching for company name variants (Kalyan, Kalyan Jewellers, Kalyan Jewelers, KJIL, Kalyan Jewellery)
- Strict matching for tickers (KALYANKJIL, 543278)
- Contextual disambiguation where needed (e.g., "Ramesh" alone is ambiguous — requires co-mention of Kalyan or context)
- Confidence score (0-1) attached to every entity-mention link

Use Claude Haiku for ambiguous cases — batched, cached aggressively on taxonomy context.

### Sentiment analysis

Three-tier approach:

1. **Fast path** — Cheap classifier for high-confidence cases (strong positive/negative lexical signals)
2. **Standard path** — Claude Haiku with brand-context prompting for nuanced cases
3. **Slow path** — Claude Sonnet for cases where context matters heavily (sarcasm, comparative mentions, ambiguous tone)

Sentiment is scored -1 to +1, with separate confidence score. Always preserve the raw text snippet that drove the score.

**Critical:** Sentiment must be brand-contextual, not generic. "Stock is down" is negative for a long-holder but neutral for a short-seller narrative. Prompt must include entity context.

### Narrative clustering

This is the core differentiator. Naive mention-level monitoring is commodity; narrative-level understanding is not.

**Approach:**
- Cluster mentions within rolling 7-day and 30-day windows
- Clustering method: embedding similarity (use Claude's embedding capability or open-source sentence-transformers) + theme tagging
- Each cluster has: title (AI-generated), description, representative mentions, sentiment trajectory, velocity score
- Narratives persist across days; new mentions get assigned to existing narratives when similarity is high

**Implementation note:** For sprint, acceptable to use cosine similarity on sentence embeddings + DBSCAN or hierarchical clustering. Do not build a sophisticated graph-based approach. Quality of prompting for title/description matters more than clustering algorithm sophistication.

### Severity scoring

Severity = function of multiple factors, computed per mention AND per narrative:

| Factor | Weight | Signal |
|---|---|---|
| Velocity | 0.25 | Retweets, shares, reach in time window |
| Amplifier quality | 0.20 | Verified accounts, journalists, press pickup |
| Sentiment intensity | 0.15 | How negative, not just negative |
| Regulatory adjacency | 0.15 | Does this touch SEBI, BIS, tax, legal matters |
| Cross-platform spread | 0.10 | Limited to one platform vs. spreading |
| Regional concentration | 0.10 | Heartland vs. peripheral |
| Historical pattern match | 0.05 | Similar to past crisis patterns |

Output: 0-1 severity score mapped to 4 tiers (Low, Medium, High, Critical). Alerts fire at High and Critical.

### Relevance scoring

Not every mention of "Kalyan" matters. Relevance filters noise.

- Mentions of unrelated entities named Kalyan (political figures, other businesses) — filter out
- Generic gold price discussions where Kalyan is only peripheral — deprioritize
- Sponsored content and paid campaigns — mark as such, don't treat as organic signal
- Historical references to Kalyan in retrospective pieces — lower relevance

Use Claude Haiku with relevance prompting. Target: 5-10% of raw ingested mentions are flagged as high-relevance for brief inclusion.

---

## 6. UI specification — the 10 views

### Design token mapping

Before implementing views, lock these tokens in Tailwind config so all components derive from brand system:

```javascript
// tailwind.config.ts extend
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
  display: ['Cormorant Garamond', 'Georgia', 'serif'],
  body: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

**Surface rules:**
- Dashboard views: paper background (#F7F3EB) or pure white
- Brief views: parchment background (#EDE6DA) — feels editorial
- Detail views: white background for readability
- Ochre is never used for large surfaces — only accents: severity indicators, terminal dot in wordmark, critical alert rules

**Typography rules:**
- Display headlines: Cormorant Garamond, 40-80px depending on view
- H1/H2 within views: Cormorant Garamond 28-36px
- Body: Inter 15px, line-height 1.7
- Metadata: JetBrains Mono 11-12px, uppercase, tracking-wide
- Labels, badges: JetBrains Mono 10px, uppercase, tracking-wider

### View 1 — Brand command center (landing)

**Purpose:** First view after login. Summary of Kalyan's current narrative state.

**Layout:**
- Top bar: Insyt wordmark, current date/time, user name
- Left: headline of today's brief (Cormorant Garamond 40px)
- Mid-section: 3 metric cards — Narrative velocity (7-day), Sentiment pulse (7-day), Active alerts (count)
- Right side: active narrative list (title + sentiment indicator + velocity)
- Bottom: latest 5 mentions feed, small, scrollable

**Must work live.** This is what Sajeev sees first when you open the laptop.

### View 2 — Narrative landscape (90-day themes)

**Purpose:** The editorial-quality 90-day narrative view. Anchors Act 1 of the meeting.

**Layout:**
- Full-width parchment surface
- Editorial title: "The Kalyan narrative, Q1 FY26"
- Subtitle: last 90 days summary in one sentence
- 5-7 narrative cards, each showing: title, 2-sentence description, sentiment trajectory sparkline, mention volume, dominant sources
- Clickthrough to narrative detail view

**Must work live on real 90-day data.**

### View 3 — Competitive narrative comparison

**Purpose:** Show Kalyan vs. Tanishq vs. Malabar narrative positioning. Demonstrates the "context" differentiation.

**Layout:**
- 3 columns (Kalyan, Tanishq, Malabar)
- Each column: top 3 narratives, sentiment direction, 7-day velocity
- Bottom section: "Where Kalyan is winning" and "Where Kalyan is losing" — editorial paragraphs, not charts
- Share-of-voice bar at very bottom, not the hero

**Must work live with real data across all three entities.**

### View 4 — January 2025 case study replay ⭐ HERO VIEW

**Purpose:** THE meeting-winning moment. Reconstructs the January 2025 stock crash with day-by-day replay.

**Layout:**
- Full-width timeline at top (Jan 10 - Feb 5, 2025)
- Playhead slider user can drag
- As playhead moves, system shows:
  - What Insyt would have detected on that day
  - Severity score trajectory
  - Emerging narrative cluster details
  - When first alert would have fired
  - What draft response Insyt would have generated
- Below timeline: stock price line chart for context (KALYANKJIL during that window)
- Side panel: "What actually happened" vs "What would have happened with Insyt" — parallel timelines

**Must work flawlessly. This is the hero. See Section 7 for construction methodology.**

### View 5 — Mention detail / drill-down

**Purpose:** Click any mention anywhere in the system → land here with full context.

**Layout:**
- Editorial treatment — feels like reading an article, not a dashboard row
- Top: source, publication, author, published time, ingested time
- Middle: full content (or excerpt if long)
- Right sidebar: entities mentioned, sentiment, relevance, narrative cluster membership, related mentions
- Bottom: "Recommended action" panel if severity is high

### View 6 — Action drafting workspace

**Purpose:** The "so what" layer. AI generates response drafts, user reviews/edits.

**Layout:**
- Left: context panel (the triggering mention, narrative, why this action is recommended)
- Center: draft content in an editable text area (feels like a document, not a form field)
- Top of center: draft type selector (SEBI disclosure | Social mirror | Press statement | Internal note | Journalist clarification)
- Right: "Generate alternative" button, tone adjusters (formal/direct/empathetic), language toggle (EN/ML/TA/HI)
- Bottom: Export (PDF/DOCX), Send to Slack, Copy

**Must work live for at least 3 draft types on real Kalyan-context scenarios.**

### View 7 — Alert configuration

**Purpose:** Show the system's rule engine. Brief demo, not deep dive.

**Layout:**
- List of active alert rules
- Each rule: trigger condition, severity threshold, routing (email/Slack/WhatsApp)
- "Add rule" button
- Rule creation form when clicked

**Structural completeness matters; deep functionality not required. Sajeev's team would configure this during onboarding — show that capability exists.**

### View 8 — Store-level heatmap (partial live)

**Purpose:** Show "we can do store-level intelligence" without building all 300+ stores.

**Layout:**
- India map, with pins for 10 live stores
- Pins colored by sentiment of recent reviews/mentions
- Click pin → small card with store name, recent signal, top 3 recent mentions
- Rest of map shows "250+ stores — Phase 2 expansion" as overlay text

**Acceptable to be partially placeholder. Frame as roadmap, not gap.**

### View 9 — Regional language deep-dive (partial live)

**Purpose:** Demonstrate regional language capability.

**Layout:**
- Tabs: Malayalam | Tamil | Hindi (others as "Phase 2")
- Each tab: mentions feed in that language, with English translation beside, sentiment per mention
- Top metrics: regional coverage stats
- Side: source breakdown (which publications contributing)

**Malayalam must have at least 20 real mentions from Manorama and Mathrubhumi. Tamil: 10+ from Dinamalar. Hindi: 10+ from Dainik Jagran.**

### View 10 — Ambassador reputation tracker (structural)

**Purpose:** Show ambassador-level monitoring capability.

**Layout:**
- Cards grid: one per tracked ambassador (Amitabh Bachchan, Katrina Kaif, Nagarjuna, Shivarajkumar, Manju Warrier, Prabhu Ganesan)
- Each card: portrait placeholder, name, 7-day sentiment pulse, recent mention count, any active reputation events
- Bottom strip: "Upcoming: reputation risk modeling across ambassador portfolio" — Phase 2

**Structural view is sufficient; some data can be sampled. Do not fake data — show real mention counts where available.**

### Navigation structure

Simple left sidebar, Shadcn-themed:
- Brief (landing)
- Narratives
- Competitive
- Mentions
- Actions
- Regional
- Stores
- Ambassadors
- Alerts (small)
- Settings (placeholder)

At bottom of sidebar: client indicator showing "Kalyan Jewellers" (future: multi-tenant dropdown).

### Shadcn components to use

Install and use these from Shadcn: Card, Badge, Button, Input, Textarea, Tabs, Select, Dialog, DropdownMenu, Tooltip, Sheet (for drill-downs), Table, Skeleton (loading states), Separator.

Customize the color tokens globally — do not override per-component. Color tokens cascade from the Tailwind config defined above.

---

## 7. The January 2025 case study reconstruction — the hero asset

This is the most important single piece of work in the sprint. If nothing else works brilliantly, this must.

### The story we are reconstructing

**Timeline of actual events (January 2025):**
- Early January: Unverified social media posts begin circulating rumors of IT raids on Kalyan and bribery allegations linking Kalyan with Motilal Oswal AMC
- January 14: Kalyan Q3 earnings call — Ramesh Kalyanaraman addresses rumors directly, calls them "absurd"
- January 16-17: First MOAMC denial statement
- Over 2 weeks: Stock declines ~37% from early-January highs
- January 20: Second, stronger MOAMC denial issued; stock jumps 9.3% on clarification
- Late January: Situation stabilizes but damage done

### What Insyt would have done differently (the narrative you construct)

**Day T-7 (early January, before mainstream visibility):**
Insyt detects low-volume but clustered posts across small accounts. Individual severity low, but clustering detects emerging narrative: "IT raid on Kalyan" narrative forming. Narrative score shifts from dormant to emerging.

**Day T-5:**
Posts gaining traction on mid-tier financial Twitter. Velocity score crosses emerging threshold. First alert fires — tier: "emerging narrative, monitor."

**Day T-3:**
Mainstream financial Twitter engaging. Reach crosses threshold. Alert tier upgrades to "active narrative, senior review." Draft clarification generated for CS/IR team.

**Day T-2:**
Mainstream financial press begins to reference. Stock beginning small decline. Severity crosses high threshold. Critical alert fires.

**Day T-1:**
Narrative matured. Stock declining meaningfully. Kalyan still hasn't responded officially.

**Day T (Jan 14 — earnings call, actual day Ramesh addressed it):**
In actual timeline, this was the first clear corporate response. Insyt timeline would have had response drafted, cleared, and issued 5-7 days earlier.

### Data required for reconstruction

- 90 days of historical Twitter data covering Jan 2025 window (primary)
- News coverage Jan 5 - Feb 5, 2025 from all Tier-1 English publications
- BSE/NSE filings in the window
- KALYANKJIL stock price data (daily OHLC) — free from Yahoo Finance or similar
- Motilal Oswal AMC statements from the period
- Q3 FY25 earnings call transcript (publicly available)

### Reconstruction build approach

**Step 1 (Day 6):** Pull all data from the window. Acceptable if some is incomplete — document what's available.

**Step 2 (Day 6 evening):** Run the data through current analysis pipeline with timestamps preserved. Key: do NOT let the model see any data from after the point being analyzed at each step. Reconstruction must feel real, not retrospectively engineered.

**Step 3 (Day 7):** Manually validate the narrative the system constructs. If the automated pipeline doesn't surface the right narrative automatically, adjust prompts and thresholds — not data — to get it right. This is legitimate tuning, not cheating: real operational use would involve client-specific calibration in week 1 of POC.

**Step 4 (Day 7 evening):** Generate the draft clarification statements Insyt would have produced at each trigger point. Review for accuracy and tone.

**Step 5 (Day 8):** Build the replay UI (View 4). Timeline scrubber, stock price overlay, what-if comparison.

### The draft clarification

At the point Insyt would have flagged this as critical (Day T-2 in reconstruction), the system should generate a clarification statement. The draft must:

- Be factually accurate to what Kalyan actually said later in earnings call
- Be in appropriate tone for a listed company responding to unverified allegations
- Reference the specific allegations being denied
- Commit to transparency and compliance without admitting anything
- Be format-ready for SEBI filing if appropriate

This is the moment Sajeev sees the product save him 7 days in a crisis window. Spend time here.

---

## 8. Prompting architecture

All LLM interactions go through a prompt registry at `backend/intelligence/prompts/`. No inline prompts in business logic. Version every prompt.

### Prompt categories

**1. Entity resolution prompts**
Input: ambiguous entity mention + context
Output: structured resolution with confidence
Model: Haiku, aggressive caching of taxonomy

**2. Sentiment prompts**
Input: mention + entity + brand context
Output: sentiment score, confidence, reasoning
Model: Haiku for clear cases, Sonnet for nuanced
Critical: brand context must be in system prompt so sentiment is brand-relative, not generic

**3. Theme extraction prompts**
Input: mention
Output: array of themes from predefined theme taxonomy
Model: Haiku

**4. Narrative title/description prompts**
Input: cluster of related mentions
Output: editorial title + description
Model: Sonnet
Voice: match the brand voice principles — narrate don't decorate, short words, cite every figure

**5. Severity assessment prompts**
Input: mention + context + factors
Output: severity tier + reasoning
Model: Haiku with explicit rubric in prompt

**6. Brief generation prompts**
Input: day's narratives, mentions, metrics
Output: full editorial brief in Insyt voice
Model: Sonnet
Voice: strict adherence to voice principles — this is the flagship output

**7. Action draft prompts (5 variants)**
Input: triggering narrative + context + draft type
Output: draft response in appropriate format and language
Model: Sonnet
Each draft type has its own prompt template with examples

### System prompt for brief generation (reference template)

```
You are Insyt's editorial intelligence system. You produce morning briefs
for CMO-level decision makers at Indian enterprise brands.

Voice principles (non-negotiable):
1. Narrate, don't decorate. Prose over charts. If a sentence can carry
   the meaning, use the sentence.
2. Cite every figure. Every number has a footnote to its source. Numbers
   are promises.
3. Short words, long thinking. Plain English over jargon. Executives
   read quickly; rigor should feel like ease.
4. Quiet, on purpose. No decoration, no excitement markers, no hype.

Format:
- Headline: Cormorant Garamond, 8-12 words, editorial
- Subheadline: 12-18 words, the "so what"
- Opening paragraph: 3-4 sentences, sets the day
- 2-4 sections, each with sub-headline and 2-3 paragraphs
- Metrics strip: 3-5 numbers with provenance
- Sources consulted

Brand context for this brief:
{client_brand_context}

Today's data:
{data_summary}

Do not use bullet points. Do not use bold mid-sentence. Do not use
exclamation marks. Do not use words like "crushing," "amazing,"
"game-changing," "revolutionary." Write as if for Mint or Business
Standard's editorial pages.

Produce the brief.
```

### Prompt caching strategy

- Taxonomy context (large, stable) cached aggressively — 60-80% cost reduction on repeat queries
- Voice principles (every brief generation) cached at 1-hour tier
- Client-specific brand context cached per-client
- Data summaries not cached — change every call

### Tier routing

- Haiku: 80% of volume (entity resolution, simple sentiment, theme extraction, severity)
- Sonnet: 20% of volume (narrative generation, brief generation, action drafting, nuanced sentiment)
- Never Opus during sprint — overkill for this use case, burns budget

---

## 9. 10-day sprint plan

Each day has a primary deliverable and a secondary. Stick to the primary; attempt the secondary only if primary completes early.

### Day 1 — Foundation
**Primary:** Ingestion pipelines running for English news (8 sources), Twitter (30 handles), BSE/NSE, SERP API. Database schema deployed. Taxonomy loaded.
**Secondary:** YouTube monitoring operational, first historical backfill batch started.

### Day 2 — Expand and backfill
**Primary:** Regional language sources live (Malayalam, Tamil, Hindi — 1 each minimum). Google Reviews for 10 stores. 90-day historical backfill running in background.
**Secondary:** Competitive tracking for Tanishq, Malabar, Joyalukkas live.

### Day 3 — Analysis pipeline
**Primary:** Entity resolution working. Sentiment analysis working with Haiku. Relevance filtering deployed. First end-to-end pipeline completing on real mentions.
**Secondary:** Theme extraction, initial narrative clustering on backfilled data.

### Day 4 — Narratives and severity
**Primary:** Narrative clustering producing reasonable clusters on 30-day window. Severity scoring operational. First set of "narratives" visible in database.
**Secondary:** Competitive narrative analysis working.

### Day 5 — Insight hunting
**Primary (all day, founder + analyst):** Manual review of 60-90 day analysis output. Hunt for 5 non-obvious insights. Document candidate insights with supporting data.
**Secondary:** Refine analysis prompts based on findings.

### Day 6 — Case study reconstruction (part 1)
**Primary:** January 2025 data pulled and processed. Reconstruction narrative drafted. Draft clarification statements written.
**Secondary:** Begin UI work on case study replay view.

### Day 7 — Case study reconstruction (part 2) + UI foundation
**Primary:** Case study replay view functional. Key UI shell built (navigation, dashboard shell, design tokens). Views 1-3 scaffolded.
**Secondary:** Views 4 (replay) and 5 (mention detail) in progress.

### Day 8 — UI build-out
**Primary:** Views 1-5 functional with real data. Views 6-10 scaffolded with real or placeholder content as spec'd.
**Secondary:** Action drafting workspace producing real drafts for 3 scenarios.

### Day 9 — Polish and pressure test
**Primary:** Designer polishes 5 hero screens (Views 1, 2, 3, 4, 6). Internal demo run — identify and fix issues. Dossier document drafted.
**Secondary:** Additional insights incorporated, prompts refined based on demo findings.

### Day 10 — Final polish and rehearsal
**Primary:** Final bug fixes. Demo environment locked. Dossier printed. Live demo rehearsed 3+ times end-to-end. Backup plans for failure modes.
**Secondary:** Nothing — sleep early if possible before Day 11 meeting.

### Critical path warnings

- If Day 1 ingestion is not running end-to-end by EOD, escalate immediately
- If Day 4 narrative clustering is producing noise rather than meaningful clusters, stop feature building and fix prompts/algorithm
- If Day 6 case study reconstruction isn't showing promising results, delay meeting rather than showing weak work
- Day 5 insight hunting is not negotiable — do not skip to build more features

---

## 10. Done-definitions per deliverable

What "complete" means, to avoid ambiguity.

**Ingestion done:** Sources producing mentions into database, dedupe working, language detection working, at least 1000 mentions from last 7 days across all Kalyan-relevant sources.

**Entity resolution done:** 95%+ of Kalyan mentions correctly entity-linked. Competitor mentions correctly entity-linked. False positives <5%.

**Sentiment done:** Sentiment scores produced for 100% of relevant mentions. Manual spot-check of 50 mentions shows agreement with human judgment 85%+.

**Narrative clustering done:** 5-8 distinct, sensible narrative clusters identified in Kalyan 90-day data. Each cluster has coherent title and description. Manual review confirms clusters aren't just keyword matches.

**Brief generation done:** Daily brief produces 800-1200 word editorial output matching voice principles. Manual review confirms readability at CMO level. Three sample briefs produced for dossier inclusion.

**Case study done:** Replay view plays end-to-end for Jan 2025 window. Timeline scrubber works. Draft clarifications show at appropriate points. Stock price overlay renders. Narrative trajectory visible.

**UI views done:** All 10 views reachable from navigation, styled to brand tokens, loading real data where spec'd. No console errors in happy-path usage.

**Action drafting done:** Can click-to-generate draft responses for at least 3 scenario types on real Kalyan mentions, with appropriate tone, factually grounded, ready to copy/export.

---

## 11. Demo-readiness checklist (Day 10 evening)

Before leaving for the night on Day 10, verify:

**Technical:**
- [ ] Demo environment URL tested on 3 different networks
- [ ] All 10 UI views load in <2 seconds
- [ ] No console errors in demo flow
- [ ] Data visible in all "must-work-live" views
- [ ] Action drafting generates draft in <15 seconds on live call
- [ ] Case study replay plays smoothly end-to-end
- [ ] Backup offline mode for case study replay (in case of network failure)
- [ ] Mobile hotspot ready as backup internet
- [ ] Laptop charged, second laptop as backup

**Content:**
- [ ] Dossier printed (3 copies), professionally bound
- [ ] One-page executive summary printed
- [ ] Proposal document ready
- [ ] NDA template ready to sign
- [ ] 5 curated insights ready to discuss in-depth
- [ ] 2-3 "wow moments" rehearsed

**Preparation:**
- [ ] Meeting venue confirmed
- [ ] Arrival buffer: 30 minutes early
- [ ] Founder rehearsed 5-act meeting structure 3+ times
- [ ] Responses prepared for obvious hard questions
- [ ] Commercial ask rehearsed with matter-of-fact tone

**Human factors:**
- [ ] Team debrief done after final rehearsal
- [ ] Sleep early
- [ ] Professional attire ready
- [ ] Travel contingencies planned

---

## 12. Non-negotiables — things that must be true

Some constraints override build priorities. If any of these are at risk, escalate before proceeding.

1. **The January 2025 case study must work.** If it doesn't, the meeting changes structure fundamentally. Delay the meeting before showing weak case study work.

2. **Brand voice must be consistent across all generated content.** If briefs read like generic SaaS output, the "quiet, editorial" positioning collapses. Fix prompts aggressively.

3. **No fake data labeled as real.** Every placeholder view must be explicitly labeled. Pretending placeholder is real, if discovered, ends the deal permanently.

4. **Regional language quality must be genuine where shown.** If Malayalam coverage looks sloppy, credibility with Kerala-origin Kalyan collapses. Better to show less Malayalam well than more Malayalam poorly.

5. **Commercial materials must match technical materials.** The dossier must describe what the product actually does, not what you wish it did.

---

## 13. Contact and escalation

**Decisions requiring founder input (not Claude Code autonomy):**
- Prompt voice adjustments for brand consistency
- Which 5 insights to feature in dossier
- Case study narrative framing
- Commercial pricing adjustments
- Whether to delay meeting

**Decisions Claude Code can make autonomously:**
- Technical implementation choices within stack decisions
- Database query optimization
- UI component selection from Shadcn
- Prompt engineering within voice/output specs
- Test data generation for development

---

## 14. Post-sprint handoff

If the Kalyan meeting succeeds and POC begins, this prototype becomes the foundation of the production system. Architectural decisions should anticipate this:

- Multi-tenant architecture (single-tenant for Kalyan POC, but structured to add clients without rewrite)
- Taxonomy pattern extends cleanly to new clients (just add new YAML)
- Brand voice profiles extend per-client (Kalyan voice, Tanishq voice, etc. when multi-brand agency use case emerges)
- Analysis pipeline is client-agnostic (only taxonomy and brand context differ)

Do not invest in these abstractions during sprint. Just avoid decisions that actively prevent them later.

---

**End of brief. Go build.**
