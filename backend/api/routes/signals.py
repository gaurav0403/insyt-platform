"""
Intelligence-grade signal endpoints.
Serves engagement-weighted, Claude-analyzed signals with complaint tracking.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from backend.db.session import get_db
from backend.intelligence.agenda import generate_agenda
from typing import Optional
from pathlib import Path
import json as _json

router = APIRouter()


@router.get("/")
async def list_signals(
    signal_type: Optional[str] = Query(None, description="actionable, strategic, contextual, noise"),
    source_type: Optional[str] = Query(None, description="news, twitter, reddit, instagram, youtube, review"),
    min_urgency: int = Query(default=1, ge=1, le=5),
    days: Optional[int] = Query(None, description="Filter to last N days (e.g. 2, 7, 30, 90)"),
    sort: str = Query(default="urgency", description="urgency, engagement, date, sentiment"),
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """
    List signals ranked by intelligence value.
    Combines Claude analysis with engagement weighting.
    """
    # Map signal_type to relevance_score range
    relevance_filter = ""
    if signal_type == "actionable":
        relevance_filter = "AND ma.relevance_score >= 0.9"
    elif signal_type == "strategic":
        relevance_filter = "AND ma.relevance_score >= 0.7 AND ma.relevance_score < 0.9"
    elif signal_type == "contextual":
        relevance_filter = "AND ma.relevance_score >= 0.4 AND ma.relevance_score < 0.7"
    elif signal_type == "noise":
        relevance_filter = "AND ma.relevance_score < 0.4"

    source_filter = ""
    if source_type:
        source_filter = f"AND m.source_type = '{source_type}'"

    date_filter = ""
    if days:
        date_filter = f"AND m.published_at >= NOW() - INTERVAL '{days} days'"

    # Sort mapping
    sort_clause = {
        "urgency": "ma.severity_score DESC NULLS LAST, ma.relevance_score DESC",
        "engagement": """
            COALESCE((m.metadata->>'views')::int, 0) +
            COALESCE((m.metadata->>'likes')::int, 0) * 10 +
            COALESCE((m.metadata->>'retweets')::int, 0) * 20 +
            COALESCE((m.metadata->>'replies')::int, 0) * 5 DESC NULLS LAST,
            ma.severity_score DESC NULLS LAST
        """,
        "date": "m.published_at DESC NULLS LAST",
        "sentiment": "ma.sentiment_score ASC",
    }.get(sort, "ma.severity_score DESC NULLS LAST")

    result = await db.execute(text(f"""
        SELECT m.id, m.title, m.raw_content, m.source_type, m.source_publication,
               m.published_at, m.source_url, m.author, m.metadata,
               ma.sentiment_score, ma.relevance_score, ma.severity_score,
               ma.themes, ma.key_claims, ma.action_triggers, ma.sentiment_confidence
        FROM mentions m
        JOIN mention_analysis ma ON m.id = ma.mention_id
        WHERE ma.sentiment_confidence >= 0.9
          AND COALESCE(ma.severity_score, 0) >= :min_urgency
          {relevance_filter}
          {source_filter}
          {date_filter}
        ORDER BY {sort_clause}
        LIMIT :limit OFFSET :offset
    """), {"min_urgency": min_urgency, "limit": limit, "offset": offset})

    rows = result.fetchall()

    # Get total count
    count_result = await db.execute(text(f"""
        SELECT COUNT(*) FROM mentions m
        JOIN mention_analysis ma ON m.id = ma.mention_id
        WHERE ma.sentiment_confidence >= 0.9
          AND COALESCE(ma.severity_score, 0) >= :min_urgency
          {relevance_filter}
          {source_filter}
          {date_filter}
    """), {"min_urgency": min_urgency})
    total = count_result.scalar() or 0

    signals = []
    for r in rows:
        meta = r[8] or {}
        signal_t = "actionable" if (r[10] or 0) >= 0.9 else "strategic" if (r[10] or 0) >= 0.7 else "contextual" if (r[10] or 0) >= 0.4 else "noise"

        engagement = {
            "likes": meta.get("likes", 0) or 0,
            "retweets": meta.get("retweets", 0) or 0,
            "replies": meta.get("replies", 0) or 0,
            "views": meta.get("views", 0) or 0,
            "score": meta.get("score", 0) or 0,
            "comments": meta.get("comments", 0) or 0,
            "followers": meta.get("followers", 0) or 0,
        }
        engagement["total"] = (
            engagement["views"] +
            engagement["likes"] * 10 +
            engagement["retweets"] * 20 +
            engagement["replies"] * 5 +
            engagement["score"] * 10 +
            engagement["comments"] * 5
        )

        signals.append({
            "id": str(r[0]),
            "title": r[1],
            "content": r[2][:300] if r[2] else None,
            "source_type": r[3],
            "source_publication": r[4],
            "published_at": r[5].isoformat() if r[5] else None,
            "source_url": r[6],
            "author": r[7],
            "sentiment": r[9],
            "signal_type": signal_t,
            "urgency": r[11],
            "themes": r[12] or [],
            "why_it_matters": r[13][0] if r[13] else None,
            "non_obvious": r[14][0] if r[14] and r[14][0] else None,
            "engagement": engagement if r[3] in ("twitter", "reddit", "instagram", "youtube") else None,
        })

    return {"signals": signals, "count": len(signals), "total": total}


AGENDA_CACHE = Path("/tmp/insyt_agenda_cache.json")

@router.get("/agenda")
async def get_agenda():
    """Claude-synthesised morning agenda. Cached for speed."""
    if AGENDA_CACHE.exists():
        try:
            return _json.loads(AGENDA_CACHE.read_text())
        except Exception:
            pass
    items = generate_agenda()
    result = {"agenda": items}
    try:
        AGENDA_CACHE.write_text(_json.dumps(result, default=str))
    except Exception:
        pass
    return result


@router.get("/summary")
async def signal_summary(db: AsyncSession = Depends(get_db)):
    """Dashboard-level summary of signal quality and distribution."""
    result = await db.execute(text("""
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE ma.relevance_score >= 0.9) as actionable,
            COUNT(*) FILTER (WHERE ma.relevance_score >= 0.7 AND ma.relevance_score < 0.9) as strategic,
            COUNT(*) FILTER (WHERE ma.relevance_score >= 0.4 AND ma.relevance_score < 0.7) as contextual,
            COUNT(*) FILTER (WHERE ma.relevance_score < 0.4) as noise,
            COUNT(*) FILTER (WHERE ma.severity_score >= 4) as urgent,
            ROUND(AVG(ma.sentiment_score)::numeric, 3) as avg_sentiment,
            COUNT(DISTINCT m.source_type) as source_types,
            COUNT(DISTINCT m.source_publication) as publications
        FROM mentions m
        JOIN mention_analysis ma ON m.id = ma.mention_id
        WHERE ma.sentiment_confidence >= 0.9
    """))
    row = result.fetchone()

    # By source type
    by_source = await db.execute(text("""
        SELECT m.source_type, COUNT(*),
               COUNT(*) FILTER (WHERE ma.relevance_score >= 0.9) as actionable
        FROM mentions m
        JOIN mention_analysis ma ON m.id = ma.mention_id
        WHERE ma.sentiment_confidence >= 0.9
        GROUP BY m.source_type ORDER BY COUNT(*) DESC
    """))

    # Top themes
    themes = await db.execute(text("""
        SELECT unnest(ma.themes) as theme, COUNT(*) as cnt
        FROM mention_analysis ma
        WHERE ma.sentiment_confidence >= 0.9 AND ma.themes IS NOT NULL
        GROUP BY theme ORDER BY cnt DESC LIMIT 10
    """))

    return {
        "total": row[0],
        "actionable": row[1],
        "strategic": row[2],
        "contextual": row[3],
        "noise": row[4],
        "urgent": row[5],
        "avg_sentiment": float(row[6]) if row[6] else None,
        "source_types": row[7],
        "publications": row[8],
        "by_source": [{"type": r[0], "count": r[1], "actionable": r[2]} for r in by_source.fetchall()],
        "top_themes": [{"theme": r[0], "count": r[1]} for r in themes.fetchall()],
    }


@router.get("/complaints")
async def list_complaints(
    brand: Optional[str] = None,
    status: Optional[str] = Query(None, description="unresolved, acknowledged, resolved"),
    days: Optional[int] = Query(None, description="Filter to last N days"),
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
):
    """
    List customer complaints from social platforms.
    Identified by Claude analysis — action_triggers contains complaint metadata.
    """
    brand_filter = ""
    if brand:
        brand_filter = f"AND m.raw_content ILIKE '%{brand}%'"

    complaint_date_filter = ""
    if days:
        complaint_date_filter = f"AND m.published_at >= NOW() - INTERVAL '{days} days'"

    result = await db.execute(text(f"""
        SELECT m.id, m.title, m.raw_content, m.source_type, m.source_publication,
               m.published_at, m.source_url, m.author, m.metadata,
               ma.sentiment_score, ma.severity_score, ma.themes, ma.key_claims
        FROM mentions m
        JOIN mention_analysis ma ON m.id = ma.mention_id
        WHERE ma.sentiment_confidence >= 0.9
          AND m.source_type IN ('twitter', 'reddit', 'instagram', 'review')
          AND ma.sentiment_score < -0.2
          AND ma.relevance_score >= 0.5
          AND (
            m.raw_content ILIKE '%complaint%' OR m.raw_content ILIKE '%worst%'
            OR m.raw_content ILIKE '%fraud%' OR m.raw_content ILIKE '%scam%'
            OR m.raw_content ILIKE '%refund%' OR m.raw_content ILIKE '%cheat%'
            OR m.raw_content ILIKE '%disappointed%' OR m.raw_content ILIKE '%pathetic%'
            OR m.raw_content ILIKE '%horrible%' OR m.raw_content ILIKE '%overcharg%'
            OR m.raw_content ILIKE '%poor quality%' OR m.raw_content ILIKE '%customer care%'
            OR 'consumer_experience' = ANY(ma.themes)
          )
          {brand_filter}
          {complaint_date_filter}
        ORDER BY ma.severity_score DESC NULLS LAST, m.published_at DESC
        LIMIT :limit
    """), {"limit": limit})

    rows = result.fetchall()
    complaints = []
    for r in rows:
        meta = r[8] or {}
        engagement = {
            "likes": meta.get("likes", 0) or 0,
            "retweets": meta.get("retweets", 0) or 0,
            "views": meta.get("views", 0) or 0,
        }
        complaints.append({
            "id": str(r[0]),
            "title": r[1],
            "content": r[2][:400] if r[2] else None,
            "source_type": r[3],
            "author": r[7],
            "published_at": r[5].isoformat() if r[5] else None,
            "source_url": r[6],
            "sentiment": r[9],
            "severity": r[10],
            "themes": r[11] or [],
            "why_it_matters": r[12][0] if r[12] else None,
            "engagement": engagement,
        })

    return {"complaints": complaints, "count": len(complaints)}
