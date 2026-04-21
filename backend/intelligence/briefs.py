"""
Daily brief generation: editorial intelligence brief for CMO-level decision makers.

Uses Claude Sonnet to produce a morning brief from the day's narratives,
mentions, and metrics. Follows Insyt voice principles strictly.
"""
import uuid
from datetime import datetime, date, timedelta, timezone

import anthropic
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import structlog

from backend.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

BRIEF_SYSTEM_PROMPT = """You are Insyt's editorial intelligence system. You produce morning briefs
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
- Headline: 8-12 words, editorial
- Subheadline: 12-18 words, the "so what"
- Opening paragraph: 3-4 sentences, sets the day
- 2-4 sections, each with sub-headline and 2-3 paragraphs
- Metrics strip: 3-5 numbers with provenance

Brand context: Kalyan Jewellers India Limited (NSE: KALYANKJIL, BSE: 543278).
India's second-largest organised jewellery retailer by revenue. Kerala-origin,
253 stores in India, brand ambassadors include Amitabh Bachchan and Katrina Kaif.
Key competitors: Tanishq (Titan), Malabar Gold, Joyalukkas.

Do not use bullet points. Do not use bold mid-sentence. Do not use
exclamation marks. Do not use words like "crushing," "amazing,"
"game-changing," "revolutionary." Write as if for Mint or Business
Standard's editorial pages.

Respond with a JSON object:
{
  "headline": "...",
  "subheadline": "...",
  "opening_paragraph": "...",
  "sections": [{"title": "...", "content": "..."}],
  "metrics": [{"label": "...", "value": "...", "source": "..."}]
}"""


def gather_brief_data(session: Session, target_date: date) -> dict:
    """Gather data for brief generation: recent mentions, narratives, sentiment."""
    # Recent mentions (last 7 days from target)
    window_start = target_date - timedelta(days=7)
    mentions_result = session.execute(text("""
        SELECT m.title, m.source_publication, m.published_at,
               ma.sentiment_score, ma.themes
        FROM mentions m
        LEFT JOIN mention_analysis ma ON m.id = ma.mention_id
        WHERE m.published_at >= :start AND m.published_at <= :end
        ORDER BY m.published_at DESC
        LIMIT 50
    """), {"start": window_start, "end": target_date + timedelta(days=1)}).fetchall()

    # Active narratives
    narratives_result = session.execute(text("""
        SELECT n.title, n.description, n.mention_count, n.velocity_score, n.status,
               e.canonical_name
        FROM narratives n
        JOIN entities e ON n.entity_id = e.id
        WHERE n.status = 'active'
        ORDER BY n.mention_count DESC
        LIMIT 10
    """)).fetchall()

    # Sentiment summary
    sentiment_result = session.execute(text("""
        SELECT
            COUNT(*) as total,
            AVG(ma.sentiment_score) as avg_sentiment,
            COUNT(*) FILTER (WHERE ma.sentiment_score > 0.15) as positive,
            COUNT(*) FILTER (WHERE ma.sentiment_score < -0.15) as negative
        FROM mentions m
        JOIN mention_analysis ma ON m.id = ma.mention_id
        WHERE m.published_at >= :start
    """), {"start": window_start}).fetchone()

    # Format for prompt
    mentions_text = "\n".join([
        f"- [{row[1]}] {row[0]} (sentiment: {row[3]:.2f})" if row[3] else f"- [{row[1]}] {row[0]}"
        for row in mentions_result[:30]
    ])

    narratives_text = "\n".join([
        f"- {row[0]} ({row[5]}, {row[2]} mentions, velocity {row[3]:.1f}/day)"
        for row in narratives_result
    ])

    return {
        "date": target_date.isoformat(),
        "mentions_summary": mentions_text,
        "narratives_summary": narratives_text,
        "total_mentions": sentiment_result[0] if sentiment_result else 0,
        "avg_sentiment": sentiment_result[1] if sentiment_result else 0,
        "positive_count": sentiment_result[2] if sentiment_result else 0,
        "negative_count": sentiment_result[3] if sentiment_result else 0,
    }


def generate_brief(target_date: date = None) -> dict:
    """Generate a daily brief for the given date."""
    if target_date is None:
        target_date = date.today()

    engine = create_engine(settings.database_url_sync)
    api_key = settings.anthropic_api_key
    if not api_key:
        return {"error": "INSYT_ANTHROPIC_API_KEY not set"}

    with Session(engine) as session:
        # Check if brief already exists for this date
        existing = session.execute(
            text("SELECT id FROM briefs WHERE date = :d"),
            {"d": target_date},
        ).fetchone()

        # Gather data
        data = gather_brief_data(session, target_date)
        logger.info("brief.data_gathered", date=str(target_date), mentions=data["total_mentions"])

        if data["total_mentions"] == 0:
            return {"error": "No mentions found for this date window"}

        # Generate with Claude Sonnet
        client = anthropic.Anthropic(api_key=api_key)
        user_prompt = f"""Generate today's intelligence brief for Kalyan Jewellers.

Date: {data['date']}
Period: Last 7 days

Recent coverage ({data['total_mentions']} mentions, avg sentiment {data['avg_sentiment']:.2f}):
{data['mentions_summary']}

Active narratives:
{data['narratives_summary']}

Sentiment distribution: {data['positive_count']} positive, {data['negative_count']} negative, {data['total_mentions'] - data['positive_count'] - data['negative_count']} neutral.

Produce the brief as JSON."""

        try:
            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=2000,
                system=BRIEF_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )
            raw_text = response.content[0].text.strip()

            # Parse JSON from response
            import json
            # Handle potential markdown code blocks
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            brief_data = json.loads(raw_text)

        except Exception as e:
            logger.error("brief.generation_failed", error=str(e))
            return {"error": f"Generation failed: {str(e)}"}

        # Store brief
        brief_id = uuid.uuid4()
        client_id_row = session.execute(
            text("SELECT id FROM clients LIMIT 1")
        ).fetchone()
        client_id = str(client_id_row[0]) if client_id_row else None

        # Upsert brief
        if existing:
            session.execute(text("""
                UPDATE briefs SET headline = :headline, subheadline = :sub,
                opening_paragraph = :opening, sections = :sections,
                metrics = :metrics, generated_at = :now
                WHERE date = :d
            """), {
                "headline": brief_data.get("headline", ""),
                "sub": brief_data.get("subheadline", ""),
                "opening": brief_data.get("opening_paragraph", ""),
                "sections": json.dumps(brief_data.get("sections", [])),
                "metrics": json.dumps(brief_data.get("metrics", [])),
                "now": datetime.now(timezone.utc),
                "d": target_date,
            })
        else:
            session.execute(text("""
                INSERT INTO briefs (id, client_id, date, headline, subheadline,
                    opening_paragraph, sections, metrics, generated_at)
                VALUES (:id, :client_id, :date, :headline, :sub, :opening,
                    :sections, :metrics, :now)
            """), {
                "id": str(brief_id),
                "client_id": client_id,
                "date": target_date,
                "headline": brief_data.get("headline", ""),
                "sub": brief_data.get("subheadline", ""),
                "opening": brief_data.get("opening_paragraph", ""),
                "sections": json.dumps(brief_data.get("sections", [])),
                "metrics": json.dumps(brief_data.get("metrics", [])),
                "now": datetime.now(timezone.utc),
            })

        session.commit()
        logger.info("brief.stored", date=str(target_date), headline=brief_data.get("headline", ""))

    return {
        "date": str(target_date),
        "headline": brief_data.get("headline", ""),
        "subheadline": brief_data.get("subheadline", ""),
        "sections_count": len(brief_data.get("sections", [])),
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", default=None, help="Target date YYYY-MM-DD")
    args = parser.parse_args()

    target = date.fromisoformat(args.date) if args.date else date.today()
    result = generate_brief(target)
    if "error" in result:
        print(f"Error: {result['error']}")
    else:
        print(f"\nBrief generated for {result['date']}:")
        print(f"  Headline: {result['headline']}")
        print(f"  Subheadline: {result['subheadline']}")
        print(f"  Sections: {result['sections_count']}")
