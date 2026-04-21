"""
Narrative clustering: group related mentions into coherent storylines.

Approach (POC-appropriate):
1. Group mentions by entity + theme within time windows
2. Title/describe each cluster using the most common patterns
3. Track sentiment trajectory and velocity per narrative

No embeddings or DBSCAN for POC — theme+entity+time grouping is sufficient
and deterministic. Can upgrade to embedding similarity in production.
"""
import uuid
from datetime import datetime, timedelta, timezone
from collections import defaultdict

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import structlog

from backend.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


def run_narrative_clustering(window_days: int = 90) -> dict:
    """
    Cluster mentions into narratives based on entity + theme + time proximity.
    """
    engine = create_engine(settings.database_url_sync)

    with Session(engine) as session:
        # Get cutoff date
        cutoff = datetime.now(timezone.utc) - timedelta(days=window_days)

        # Fetch mentions with their entities and analysis
        rows = session.execute(text("""
            SELECT
                m.id, m.title, m.published_at, m.source_publication,
                ma.sentiment_score, ma.themes,
                e.id as entity_id, e.canonical_name, e.type as entity_type
            FROM mentions m
            JOIN mention_analysis ma ON m.id = ma.mention_id
            JOIN mention_entities me ON m.id = me.mention_id
            JOIN entities e ON me.entity_id = e.id
            WHERE m.published_at > :cutoff
              AND e.type IN ('company', 'competitor', 'ambassador')
            ORDER BY m.published_at DESC
        """), {"cutoff": cutoff}).fetchall()

        logger.info("narratives.data_loaded", mentions_with_entities=len(rows))

        # Group by entity + primary theme
        clusters = defaultdict(list)
        for row in rows:
            mention_id = str(row[0])
            title = row[1] or ""
            published_at = row[2]
            sentiment = row[4] or 0.0
            themes = row[5] or []
            entity_id = str(row[6])
            entity_name = row[7]
            entity_type = row[8]

            # Use first theme as cluster key, or 'general' if no themes
            primary_theme = themes[0] if themes else "general"
            cluster_key = f"{entity_id}::{primary_theme}"

            clusters[cluster_key].append({
                "mention_id": mention_id,
                "title": title,
                "published_at": published_at,
                "sentiment": sentiment,
                "themes": themes,
                "entity_id": entity_id,
                "entity_name": entity_name,
                "entity_type": entity_type,
                "primary_theme": primary_theme,
            })

        # Filter clusters with at least 3 mentions (real narratives, not noise)
        significant_clusters = {k: v for k, v in clusters.items() if len(v) >= 3}
        logger.info("narratives.clusters_found",
                    total=len(clusters),
                    significant=len(significant_clusters))

        # Clear existing narratives and rebuild
        session.execute(text("DELETE FROM narrative_mentions"))
        session.execute(text("DELETE FROM narratives"))
        session.commit()

        narratives_created = 0
        links_created = 0

        for cluster_key, mentions in significant_clusters.items():
            entity_id = mentions[0]["entity_id"]
            entity_name = mentions[0]["entity_name"]
            primary_theme = mentions[0]["primary_theme"]

            # Sort by date
            mentions.sort(key=lambda x: x["published_at"] or datetime.min.replace(tzinfo=timezone.utc))

            # Generate narrative title and description
            title = _generate_title(entity_name, primary_theme, mentions)
            description = _generate_description(mentions)

            # Calculate metrics
            sentiments = [m["sentiment"] for m in mentions]
            first_seen = mentions[0]["published_at"]
            last_seen = mentions[-1]["published_at"]
            mention_count = len(mentions)

            # Velocity: mentions per day in the cluster
            if first_seen and last_seen and first_seen != last_seen:
                days_span = max((last_seen - first_seen).days, 1)
                velocity = mention_count / days_span
            else:
                velocity = 0.0

            # Determine status
            if last_seen and (datetime.now(timezone.utc) - last_seen).days <= 3:
                status = "active"
            elif last_seen and (datetime.now(timezone.utc) - last_seen).days <= 14:
                status = "declining"
            else:
                status = "resolved"

            # Sentiment trajectory (last 5 points)
            trajectory = sentiments[-5:] if len(sentiments) >= 5 else sentiments

            narrative_id = uuid.uuid4()
            session.execute(text("""
                INSERT INTO narratives
                (id, entity_id, title, description, first_seen_at, last_seen_at,
                 mention_count, sentiment_trajectory, velocity_score, status, metadata)
                VALUES (:id, :entity_id, :title, :description, :first_seen, :last_seen,
                        :count, :trajectory, :velocity, :status, :metadata)
            """), {
                "id": str(narrative_id),
                "entity_id": entity_id,
                "title": title,
                "description": description,
                "first_seen": first_seen,
                "last_seen": last_seen,
                "count": mention_count,
                "trajectory": trajectory,
                "velocity": velocity,
                "status": status,
                "metadata": "{}",
            })
            narratives_created += 1

            # Link mentions to narrative
            for m in mentions:
                session.execute(text("""
                    INSERT INTO narrative_mentions (narrative_id, mention_id, assigned_at)
                    VALUES (:nid, :mid, :now)
                    ON CONFLICT DO NOTHING
                """), {
                    "nid": str(narrative_id),
                    "mid": m["mention_id"],
                    "now": datetime.now(timezone.utc),
                })
                links_created += 1

        session.commit()

    stats = {
        "narratives_created": narratives_created,
        "links_created": links_created,
        "clusters_analyzed": len(clusters),
        "significant_clusters": len(significant_clusters),
    }
    logger.info("narratives.complete", **stats)
    return stats


THEME_LABELS = {
    "stock_movement": "Stock & Market Performance",
    "earnings": "Quarterly Results & Financial Performance",
    "expansion": "Store Expansion & Growth",
    "festive_sales": "Festive Season & Consumer Demand",
    "gold_market": "Gold Market & Commodity Dynamics",
    "regulatory": "Regulatory & Compliance",
    "competition": "Competitive Landscape",
    "brand_campaign": "Brand & Marketing Campaigns",
    "crisis": "Crisis & Reputation",
    "digital": "Digital & E-Commerce",
    "investor": "Investor Sentiment & Analyst Views",
    "general": "General Coverage",
}


def _generate_title(entity_name: str, theme: str, mentions: list[dict]) -> str:
    """Generate an editorial title for the narrative cluster."""
    theme_label = THEME_LABELS.get(theme, theme.replace("_", " ").title())
    count = len(mentions)

    # Use recent mentions for context
    recent_titles = [m["title"] for m in mentions[-3:]]

    # Simple but effective title generation
    if theme == "stock_movement":
        avg_sent = sum(m["sentiment"] for m in mentions) / count
        if avg_sent > 0.2:
            return f"{entity_name}: stock momentum builds"
        elif avg_sent < -0.2:
            return f"{entity_name}: share price under pressure"
        return f"{entity_name}: stock in focus"
    elif theme == "earnings":
        return f"{entity_name}: quarterly performance narrative"
    elif theme == "expansion":
        return f"{entity_name}: expansion and growth story"
    elif theme == "festive_sales":
        return f"{entity_name}: festive demand and consumer trends"
    elif theme == "competition":
        return f"{entity_name}: competitive positioning"
    elif theme == "crisis":
        return f"{entity_name}: reputation and risk signals"
    elif theme == "investor":
        return f"{entity_name}: analyst and investor outlook"
    elif theme == "digital":
        return f"{entity_name}: digital and e-commerce push"
    elif theme == "brand_campaign":
        return f"{entity_name}: brand and marketing"
    else:
        return f"{entity_name}: {theme_label.lower()}"


def _generate_description(mentions: list[dict]) -> str:
    """Generate a 1-2 sentence description of the narrative."""
    count = len(mentions)
    sentiments = [m["sentiment"] for m in mentions]
    avg_sentiment = sum(sentiments) / count if count else 0

    first = mentions[0]["published_at"]
    last = mentions[-1]["published_at"]
    days_span = (last - first).days if first and last else 0

    direction = "positive" if avg_sentiment > 0.15 else "negative" if avg_sentiment < -0.15 else "mixed"

    return (
        f"{count} mentions over {days_span} days with {direction} sentiment "
        f"(avg {avg_sentiment:+.2f}). Most recent coverage from "
        f"{mentions[-1].get('title', 'recent article')[:50]}."
    )


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--window", type=int, default=90, help="Days to look back")
    args = parser.parse_args()

    stats = run_narrative_clustering(window_days=args.window)
    print(f"\nNarrative clustering complete:")
    print(f"  Narratives created: {stats['narratives_created']}")
    print(f"  Links created: {stats['links_created']}")
    print(f"  Clusters analyzed: {stats['clusters_analyzed']}")
