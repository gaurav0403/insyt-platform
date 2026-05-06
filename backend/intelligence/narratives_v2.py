"""
Claude-powered narrative formation.

Instead of entity+theme bucketing, this:
1. Reads all high-signal mentions from Claude analysis
2. Groups by temporal proximity and entity overlap
3. Asks Claude to identify actual storylines and write editorial descriptions
4. Produces narratives that a CMO would recognize as real stories
"""
import json
import uuid
from datetime import datetime, timedelta, timezone
from collections import defaultdict

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import structlog
import anthropic

from backend.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

NARRATIVE_PROMPT = """You are a senior intelligence editor at Insyt. Your job is to identify NARRATIVES forming around Kalyan Jewellers (the primary client brand).

A narrative is a STORY with a direction and stakes — not a topic category.

KALYAN RELEVANCE RULE (critical):
- Every narrative MUST have direct relevance to Kalyan Jewellers
- A story about Tanishq's boycott is NOT a Kalyan narrative unless Kalyan is directly involved
- A story about Malabar Gold's sales is only a Kalyan narrative if it implies competitive threat TO KALYAN
- Signals where Kalyan is mentioned in passing (in a list of 5 brands) should NOT anchor a narrative
- Prefer narratives backed by multiple signals where Kalyan is the primary subject

QUALITY THRESHOLD:
- A narrative needs at least 3 signals to be credible. A single tweet is not a narrative.
- Cross-platform signals (news + social + reviews) are stronger than single-platform
- High-engagement signals carry more weight than zero-engagement ones

For each narrative, provide:
1. "title": Editorial headline, max 80 chars. FT-style, not SaaS dashboard.
2. "description": 2-3 sentences — what happened, direction, why it matters FOR KALYAN
3. "signal_ids": Array of mention IDs (use only real UUIDs from the data, never descriptive strings)
4. "sentiment": Direction for Kalyan specifically (-1 to +1)
5. "velocity": accelerating, steady, or declining
6. "urgency": 1-5. Only 4-5 if Kalyan is directly affected and action is needed.
7. "what_to_watch": One sentence on what to monitor next

Return 5-8 narratives as a JSON array."""


def form_narratives(window_days: int = 90):
    """Use Claude to identify real narratives from analyzed signals."""
    engine = create_engine(settings.database_url_sync)
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    with Session(engine) as session:
        cutoff = datetime.now(timezone.utc) - timedelta(days=window_days)

        # Get high-quality signals (actionable + strategic, Claude-analyzed)
        rows = session.execute(text("""
            SELECT m.id, m.title, m.raw_content, m.source_type, m.source_publication,
                   m.published_at, ma.sentiment_score, ma.severity_score,
                   ma.themes, ma.key_claims, ma.action_triggers, ma.relevance_score
            FROM mentions m
            JOIN mention_analysis ma ON m.id = ma.mention_id
            WHERE m.published_at > :cutoff
              AND ma.sentiment_confidence >= 0.9
              AND ma.relevance_score >= 0.5
            ORDER BY m.published_at DESC
            LIMIT 80
        """), {"cutoff": cutoff}).fetchall()

        logger.info("narratives_v2.signals_loaded", count=len(rows))

        if len(rows) < 5:
            print("Not enough analyzed signals for narrative formation.")
            return

        # Format signals for Claude
        formatted = []
        for r in rows:
            signal_type = "actionable" if r[11] >= 0.9 else "strategic" if r[11] >= 0.7 else "contextual"
            claims = r[9] or []
            non_obvious = r[10] or []
            formatted.append(
                f"ID: {r[0]}\n"
                f"Source: {r[4]} ({r[3]}) | Date: {r[5]} | Urgency: {r[7]} | Sentiment: {r[6]:+.2f} | Type: {signal_type}\n"
                f"Title: {r[1]}\n"
                f"Content: {(r[2] or '')[:300]}\n"
                f"Themes: {r[8]}\n"
                f"Why it matters: {claims[0] if claims else 'N/A'}\n"
                f"Non-obvious: {non_obvious[0] if non_obvious and non_obvious[0] else 'N/A'}"
            )

        prompt = f"Here are {len(formatted)} signals from the last {window_days} days about Kalyan Jewellers and the Indian jewellery industry. Identify the distinct narratives.\n\n" + "\n\n---\n\n".join(formatted)

        try:
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                system=NARRATIVE_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
            result_text = response.content[0].text.strip()
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]

            narratives = json.loads(result_text)
        except Exception as e:
            logger.error("narratives_v2.claude_failed", error=str(e))
            return

        logger.info("narratives_v2.claude_identified", count=len(narratives))

        # Clear old narratives and rebuild
        session.execute(text("DELETE FROM narrative_mentions"))
        session.execute(text("DELETE FROM narratives"))
        session.commit()

        # Get entity links for signal_ids to assign narratives to entities
        all_signal_ids = set()
        for n in narratives:
            for sid in n.get("signal_ids", []):
                all_signal_ids.add(str(sid))

        entity_map = {}
        if all_signal_ids:
            entity_rows = session.execute(text("""
                SELECT me.mention_id, e.id, e.canonical_name
                FROM mention_entities me
                JOIN entities e ON me.entity_id = e.id
                WHERE me.mention_id::text = ANY(:ids)
                ORDER BY me.confidence DESC
            """), {"ids": list(all_signal_ids)}).fetchall()
            for er in entity_rows:
                mid = str(er[0])
                if mid not in entity_map:
                    entity_map[mid] = {"entity_id": str(er[1]), "entity_name": er[2]}

        created = 0
        for n in narratives:
            signal_ids = [str(s) for s in n.get("signal_ids", [])]
            sentiment = n.get("sentiment", 0.0)
            urgency = n.get("urgency", 1)
            velocity_label = n.get("velocity", "steady")
            velocity_score = {"accelerating": 1.5, "steady": 0.5, "declining": 0.2}.get(velocity_label, 0.5)

            # Find primary entity
            entity_id = None
            for sid in signal_ids:
                if sid in entity_map:
                    entity_id = entity_map[sid]["entity_id"]
                    break

            # Calculate time range from signals
            signal_dates = []
            for sid in signal_ids:
                date_row = session.execute(text(
                    "SELECT published_at FROM mentions WHERE id::text = :id"
                ), {"id": sid}).fetchone()
                if date_row and date_row[0]:
                    signal_dates.append(date_row[0])

            first_seen = min(signal_dates) if signal_dates else cutoff
            last_seen = max(signal_dates) if signal_dates else datetime.now(timezone.utc)

            status = "active"
            if velocity_label == "declining":
                status = "declining"

            narrative_id = uuid.uuid4()
            session.execute(text("""
                INSERT INTO narratives
                (id, entity_id, title, description, first_seen_at, last_seen_at,
                 mention_count, sentiment_trajectory, velocity_score, status, metadata)
                VALUES (:id, :eid, :title, :desc, :first, :last, :count, :traj, :vel, :status, :meta)
            """), {
                "id": str(narrative_id),
                "eid": entity_id,
                "title": n.get("title", "Untitled narrative"),
                "desc": n.get("description", ""),
                "first": first_seen,
                "last": last_seen,
                "count": len(signal_ids),
                "traj": [sentiment] * 5,
                "vel": velocity_score,
                "status": status,
                "meta": json.dumps({
                    "urgency": urgency,
                    "what_to_watch": n.get("what_to_watch", ""),
                    "velocity_label": velocity_label,
                    "claude_generated": True,
                }),
            })

            for sid in signal_ids:
                # Validate UUID format -- Claude sometimes returns descriptive strings
                try:
                    uuid.UUID(str(sid))
                except (ValueError, AttributeError):
                    continue
                session.execute(text("""
                    INSERT INTO narrative_mentions (narrative_id, mention_id, assigned_at)
                    VALUES (:nid, :mid, :now)
                    ON CONFLICT DO NOTHING
                """), {
                    "nid": str(narrative_id),
                    "mid": str(sid),
                    "now": datetime.now(timezone.utc),
                })

            created += 1
            print(f"  [{status}] urgency:{urgency} | {n.get('title')}")

        session.commit()
        logger.info("narratives_v2.complete", created=created)
        print(f"\nNarrative formation complete: {created} narratives identified by Claude")


if __name__ == "__main__":
    form_narratives()
