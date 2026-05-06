"""
Morning agenda generation.

Synthesises top signals, patterns, and narratives into 3-5 CMO-level agenda items.
Each item combines multiple signals into a single action-relevant observation.
"""
import json
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, text
import structlog
import anthropic

from backend.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


def gather_agenda_inputs() -> dict:
    """Collect the data Claude needs to write the agenda."""
    engine = create_engine(settings.database_url_sync)

    with engine.connect() as conn:
        # Top actionable signals (last 7 days, all platforms)
        signals = conn.execute(text("""
            SELECT m.title, m.source_type, m.source_publication,
                   ma.sentiment_score, ma.severity_score, ma.key_claims,
                   ma.themes, m.published_at, m.metadata
            FROM mentions m
            JOIN mention_analysis ma ON m.id = ma.mention_id
            WHERE ma.sentiment_confidence >= 0.9
              AND ma.relevance_score >= 0.7
              AND m.published_at >= NOW() - INTERVAL '7 days'
            ORDER BY ma.severity_score DESC NULLS LAST, ma.relevance_score DESC
            LIMIT 30
        """)).fetchall()

        # Active narratives
        narratives = conn.execute(text("""
            SELECT title, description, mention_count, status, metadata
            FROM narratives ORDER BY mention_count DESC LIMIT 8
        """)).fetchall()

        # Complaint summary
        complaints = conn.execute(text("""
            SELECT COUNT(*),
                   COUNT(DISTINCT m.region) FILTER (WHERE m.region IS NOT NULL)
            FROM mentions m
            JOIN mention_analysis ma ON m.id = ma.mention_id
            WHERE ma.sentiment_confidence >= 0.9
              AND ma.sentiment_score < -0.2
              AND m.source_type IN ('review', 'twitter')
              AND (m.raw_content ILIKE '%kalyan%' OR m.source_publication ILIKE '%kalyan%'
                   OR (m.source_type = 'review' AND m.metadata->>'brand' = 'Kalyan Jewellers'))
        """)).fetchone()

        # Store health extremes
        stores = conn.execute(text("""
            SELECT m.metadata->>'store' as store, m.metadata->>'city' as city,
                   ROUND(AVG((m.metadata->>'rating')::float)::numeric, 1) as rating,
                   COUNT(*) as reviews
            FROM mentions m
            WHERE m.source_type = 'review' AND m.metadata->>'store' IS NOT NULL
            GROUP BY store, city
            HAVING COUNT(*) >= 3
            ORDER BY AVG((m.metadata->>'rating')::float) ASC
            LIMIT 5
        """)).fetchall()

    return {
        "signals": [
            {
                "title": r[0],
                "source": f"{r[1]}:{r[2]}",
                "sentiment": r[3],
                "urgency": r[4],
                "insight": r[5][0] if r[5] else None,
                "themes": r[6],
                "date": str(r[7])[:10] if r[7] else None,
            }
            for r in signals
        ],
        "narratives": [
            {"title": r[0], "description": r[1], "mentions": r[2], "status": r[3]}
            for r in narratives
        ],
        "complaint_count": complaints[0] if complaints else 0,
        "complaint_cities": complaints[1] if complaints else 0,
        "worst_stores": [
            {"store": r[0], "city": r[1], "rating": float(r[2]), "reviews": r[3]}
            for r in stores
        ],
    }


def generate_agenda() -> list[dict]:
    """Generate 3-5 synthesised agenda items using Claude."""
    inputs = gather_agenda_inputs()
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    prompt = f"""You are the morning intelligence editor at Insyt. Write 3-5 agenda items for the CMO of Kalyan Jewellers.

Data:
{json.dumps(inputs, indent=2, default=str)}

KALYAN RELEVANCE (critical):
- The CMO of KALYAN JEWELLERS is reading this. Every agenda item must be directly relevant to Kalyan.
- Stories primarily about Tanishq, Malabar Gold, or other competitors are only relevant if they imply something Kalyan should do or be aware of competitively.
- Signals where Kalyan is mentioned in passing (in a list of brands, in a generic boycott call) should NOT become agenda items.
- A single tweet or single review is NEVER an agenda item. Minimum: 3+ signals across 2+ platforms, or a clear pattern from reviews/complaints.

EVIDENCE THRESHOLD:
- Each item must synthesise multiple signals, not echo one
- Cite the evidence: "across N signals from X platforms" or "based on Y reviews in Z cities"
- If a story has only 1-2 signals, it's not agenda-worthy — skip it

TONE:
- Editorial prose — Financial Times, not a SaaS alert
- Measured, factual. No "immediately," no exclamation marks
- If nothing significant happened, say "steady state" — that is a valid agenda
- Each item should state what it means for Kalyan, not just what happened

Return a JSON array where each item has:
- "title": one sentence, max 15 words
- "detail": 1-2 sentences of context and evidence
- "sources": brief note on evidence base (e.g. "4 news articles, 12 Twitter mentions, 3 reviews")
- "sentiment": direction for KALYAN specifically (-1 to 1)
- "theme": primary theme

Return ONLY valid JSON array. No markdown."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        result = response.content[0].text.strip()
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        return json.loads(result)
    except Exception as e:
        logger.error("agenda.generation_failed", error=str(e))
        return []


if __name__ == "__main__":
    items = generate_agenda()
    for i, item in enumerate(items):
        print(f"\n{i+1}. {item.get('title')}")
        print(f"   {item.get('detail')}")
        print(f"   Sources: {item.get('sources')}")
