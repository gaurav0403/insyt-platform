"""
Claude-powered contextual analysis pipeline.

Replaces keyword sentiment with actual intelligence:
- Reads each mention and understands what it means for the brand
- Classifies signal vs noise (gold price tables, routine stock updates = noise)
- Extracts non-obvious implications
- Scores actionability, not just sentiment
"""
import json
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
import structlog
import anthropic

from backend.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

ANALYSIS_PROMPT = """You are an intelligence analyst at Insyt, a context-intelligence platform. You analyze media signals for Kalyan Jewellers (the primary client brand).

CRITICAL: KALYAN RELEVANCE CHECK (apply to every mention):
- "kalyan_role": one of:
  - "primary_subject" — the mention is primarily about Kalyan Jewellers, its stores, stock, people, or products
  - "mentioned" — Kalyan is named but the story is about something else (e.g. listed among 5 brands)
  - "competitor_intel" — the mention is about a competitor (Tanishq, Malabar Gold, etc.) with strategic implications for Kalyan
  - "industry_context" — about the jewellery industry generally, Kalyan not named
- If kalyan_role is "mentioned" or "industry_context", urgency should NOT exceed 2 regardless of content
- If kalyan_role is "competitor_intel", sentiment should reflect what this means FOR KALYAN (competitor trouble = mildly positive for Kalyan)

For each mention, produce a JSON analysis with these fields:

1. "signal_type": one of:
   - "actionable" — requires attention or response FROM KALYAN specifically
   - "strategic" — important for Kalyan's long-term positioning
   - "contextual" — useful background
   - "noise" — routine data, irrelevant, or about other brands with no Kalyan implication

2. "sentiment": float -1.0 to 1.0 — sentiment FROM KALYAN'S PERSPECTIVE. A boycott targeting Tanishq is slightly positive for Kalyan. A complaint about Kalyan's store is negative.

3. "why_it_matters": One sentence explaining what this means for KALYAN specifically. If it doesn't matter to Kalyan, write "No direct Kalyan implication."

4. "themes": array of 1-3 from: stock_pressure, earnings_beat, expansion, hallmarking, competitive_threat, brand_campaign, crisis_signal, regulatory, consumer_experience, digital_growth, ambassador, festive_demand, institutional_activity, regional_narrative

5. "entities_involved": array of entity names mentioned

6. "urgency": 1-5 (1=background, 5=respond today). ONLY assign 4-5 if Kalyan is the primary subject and action is needed.

7. "non_obvious": One sentence a CMO might miss. null if nothing non-obvious.

8. "kalyan_role": as defined above

ENGAGEMENT WEIGHTING (social media only):
- Factor in views/likes/retweets when provided
- Low-engagement tweets (<100 views) from non-verified accounts = reduce urgency by 1
- High engagement on negative Kalyan-specific content = increase urgency

NOISE RULES:
- Gold price tables without brand insight = noise
- Generic stock price movement = noise
- Mentions where Kalyan appears only in a list of 3+ brands = contextual at best, never actionable
- Boycott/religious campaigns targeting OTHER brands where Kalyan is in a generic list = contextual, NOT actionable for Kalyan
- PR posts from Kalyan's own accounts = contextual

Respond ONLY with valid JSON. No markdown."""

BATCH_PROMPT = """Analyze these {count} mentions about Kalyan Jewellers and the Indian jewellery industry. For each, provide the analysis JSON.

Return a JSON array with one object per mention, in the same order as input. Each object must have the fields: signal_type, sentiment, why_it_matters, themes, entities_involved, urgency, non_obvious.

Mentions to analyze:

{mentions}"""


def analyze_batch(mentions: list[dict], client: anthropic.Anthropic) -> list[dict]:
    """Analyze a batch of mentions using Claude Sonnet."""
    # Format mentions for the prompt, including engagement data for social
    formatted = []
    for i, m in enumerate(mentions):
        source = m.get("source_publication") or m.get("source_type", "unknown")
        meta = m.get("metadata") or {}
        if isinstance(meta, str):
            try:
                import json as _json
                meta = _json.loads(meta)
            except Exception:
                meta = {}

        engagement_line = ""
        if m.get("source_type") in ("twitter", "instagram", "reddit"):
            likes = meta.get("likes", 0) or 0
            retweets = meta.get("retweets", 0) or 0
            replies = meta.get("replies", 0) or 0
            views = meta.get("views", 0) or 0
            score = meta.get("score", 0) or 0
            comments = meta.get("comments", 0) or 0
            followers = meta.get("followers", 0) or 0

            parts = []
            if views: parts.append(f"views:{views}")
            if likes: parts.append(f"likes:{likes}")
            if retweets: parts.append(f"RT:{retweets}")
            if replies: parts.append(f"replies:{replies}")
            if score: parts.append(f"score:{score}")
            if comments: parts.append(f"comments:{comments}")
            if followers: parts.append(f"author_followers:{followers}")
            if parts:
                engagement_line = f"\nEngagement: {', '.join(parts)}"

        formatted.append(
            f"[{i+1}] Source: {source} ({m.get('source_type', 'unknown')}) | Date: {m.get('published_at', 'unknown')} | Author: @{m.get('author', '?')}\n"
            f"Title: {m.get('title', 'No title')}\n"
            f"Content: {(m.get('raw_content') or m.get('title', ''))[:400]}"
            f"{engagement_line}"
        )

    prompt = BATCH_PROMPT.format(count=len(mentions), mentions="\n\n".join(formatted))

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=ANALYSIS_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        result_text = response.content[0].text.strip()

        # Parse JSON response
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]

        analyses = json.loads(result_text)
        if not isinstance(analyses, list):
            analyses = [analyses]
        return analyses

    except Exception as e:
        logger.error("analysis.claude_failed", error=str(e))
        return []


def run_claude_analysis(batch_size: int = 15, limit: int = 0):
    """
    Run Claude analysis on unanalyzed or keyword-only analyzed mentions.
    Re-analyzes everything with Claude for contextual intelligence.
    """
    engine = create_engine(settings.database_url_sync)
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    with engine.begin() as conn:
        # Get entity-linked mentions that need Claude analysis
        # Only analyze mentions that matched our taxonomy (filtering out noise)
        query = """
            SELECT DISTINCT m.id, m.title, m.raw_content, m.source_type, m.source_publication,
                   m.published_at, m.source_url, m.author, m.metadata
            FROM mentions m
            JOIN mention_entities me ON m.id = me.mention_id
            LEFT JOIN mention_analysis ma ON m.id = ma.mention_id
            WHERE ma.sentiment_confidence IS NULL OR ma.sentiment_confidence < 0.9
            ORDER BY m.published_at DESC NULLS LAST
        """
        if limit > 0:
            query += f" LIMIT {limit}"

        rows = conn.execute(text(query)).fetchall()
        total = len(rows)
        logger.info("analysis.claude_starting", mentions=total, batch_size=batch_size)

        if total == 0:
            print("No mentions to analyze.")
            return

        processed = 0
        signals = 0
        noise = 0

        for i in range(0, total, batch_size):
            batch_rows = rows[i:i + batch_size]
            mentions = []
            for row in batch_rows:
                mentions.append({
                    "id": str(row[0]),
                    "title": row[1],
                    "raw_content": row[2],
                    "source_type": row[3],
                    "source_publication": row[4],
                    "published_at": str(row[5]) if row[5] else None,
                    "source_url": row[6],
                    "author": row[7],
                    "metadata": row[8] if len(row) > 8 else None,
                })

            analyses = analyze_batch(mentions, client)

            if len(analyses) != len(mentions):
                logger.warning("analysis.batch_mismatch",
                             expected=len(mentions), got=len(analyses))
                # Pad or trim
                while len(analyses) < len(mentions):
                    analyses.append({
                        "signal_type": "noise",
                        "sentiment": 0.0,
                        "why_it_matters": "Analysis failed for this mention.",
                        "themes": [],
                        "entities_involved": [],
                        "urgency": 1,
                        "non_obvious": None,
                    })

            for mention, analysis in zip(mentions, analyses):
                sentiment = analysis.get("sentiment", 0.0)
                signal_type = analysis.get("signal_type", "noise")
                themes = analysis.get("themes", [])
                urgency = analysis.get("urgency", 1)
                why = analysis.get("why_it_matters", "")
                non_obvious = analysis.get("non_obvious")

                # Map signal_type to relevance_score for sorting
                relevance_map = {
                    "actionable": 1.0,
                    "strategic": 0.8,
                    "contextual": 0.5,
                    "noise": 0.1,
                }
                relevance = relevance_map.get(signal_type, 0.3)

                if signal_type != "noise":
                    signals += 1
                else:
                    noise += 1

                # Upsert into mention_analysis
                conn.execute(text("""
                    INSERT INTO mention_analysis
                        (mention_id, sentiment_score, sentiment_confidence, relevance_score,
                         severity_score, themes, key_claims, action_triggers)
                    VALUES (:mid, :sentiment, :confidence, :relevance,
                            :severity, :themes, :claims, :actions)
                    ON CONFLICT (mention_id) DO UPDATE SET
                        sentiment_score = :sentiment,
                        sentiment_confidence = :confidence,
                        relevance_score = :relevance,
                        severity_score = :severity,
                        themes = :themes,
                        key_claims = :claims,
                        action_triggers = :actions
                """), {
                    "mid": mention["id"],
                    "sentiment": sentiment,
                    "confidence": 0.95,  # Claude's analysis is high confidence
                    "relevance": relevance,
                    "severity": urgency,
                    "themes": themes,
                    "claims": [why] if why else [],
                    "actions": [non_obvious] if non_obvious else [],
                })

            processed += len(batch_rows)
            logger.info("analysis.claude_batch",
                       processed=processed, total=total,
                       signals=signals, noise=noise)

    print(f"\nClaude analysis complete:")
    print(f"  Processed: {processed}")
    print(f"  Signals: {signals} ({signals/max(processed,1)*100:.0f}%)")
    print(f"  Noise: {noise} ({noise/max(processed,1)*100:.0f}%)")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch-size", type=int, default=15)
    parser.add_argument("--limit", type=int, default=0, help="Max mentions to analyze (0=all)")
    args = parser.parse_args()
    run_claude_analysis(batch_size=args.batch_size, limit=args.limit)
