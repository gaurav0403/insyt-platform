from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from backend.db.session import get_db
from backend.db.models import Narrative, NarrativeMention, Mention, Entity
from typing import Optional

router = APIRouter()


@router.get("/")
async def list_narratives(
    status: Optional[str] = None,
    entity_id: Optional[str] = None,
    limit: int = Query(default=30, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Narrative).order_by(Narrative.mention_count.desc())
    if status:
        query = query.where(Narrative.status == status)
    if entity_id:
        query = query.where(Narrative.entity_id == entity_id)
    query = query.limit(limit)
    result = await db.execute(query)
    narratives = result.scalars().all()
    return {"narratives": [_serialize(n) for n in narratives]}


@router.get("/by-entity")
async def narratives_by_entity(db: AsyncSession = Depends(get_db)):
    """Get narratives grouped by entity — for tabbed view."""
    result = await db.execute(
        text("""
            SELECT
                e.id, e.canonical_name, e.type,
                n.id as narrative_id, n.title, n.description, n.status,
                n.mention_count, n.velocity_score, n.first_seen_at, n.last_seen_at,
                n.sentiment_trajectory
            FROM narratives n
            JOIN entities e ON n.entity_id = e.id
            ORDER BY e.canonical_name, n.mention_count DESC
        """)
    )
    rows = result.fetchall()

    # Group by entity
    entities = {}
    for row in rows:
        eid = str(row[0])
        if eid not in entities:
            entities[eid] = {
                "id": eid,
                "name": row[1],
                "type": row[2],
                "narratives": [],
            }
        entities[eid]["narratives"].append({
            "id": str(row[3]),
            "title": row[4],
            "description": row[5],
            "status": row[6],
            "mention_count": row[7],
            "velocity_score": row[8],
            "first_seen_at": row[9].isoformat() if row[9] else None,
            "last_seen_at": row[10].isoformat() if row[10] else None,
            "sentiment_trajectory": row[11],
        })

    # Sort entities by total mention count
    sorted_entities = sorted(
        entities.values(),
        key=lambda e: sum(n["mention_count"] for n in e["narratives"]),
        reverse=True,
    )
    return {"entities": sorted_entities}


@router.get("/{narrative_id}")
async def get_narrative_detail(narrative_id: str, db: AsyncSession = Depends(get_db)):
    """Get narrative with its linked mentions — drill-down view."""
    narrative = await db.get(Narrative, narrative_id)
    if not narrative:
        return {"error": "not found"}

    # Get entity info
    entity = await db.get(Entity, narrative.entity_id) if narrative.entity_id else None

    # Get linked mentions
    mentions_result = await db.execute(
        text("""
            SELECT m.id, m.title, m.source_url, m.source_publication,
                   m.published_at, m.raw_content,
                   ma.sentiment_score, ma.themes
            FROM narrative_mentions nm
            JOIN mentions m ON nm.mention_id = m.id
            LEFT JOIN mention_analysis ma ON m.id = ma.mention_id
            WHERE nm.narrative_id = :nid
            ORDER BY m.published_at DESC
        """),
        {"nid": narrative_id},
    )
    mentions = mentions_result.fetchall()

    return {
        "narrative": {
            **_serialize(narrative),
            "entity_name": entity.canonical_name if entity else None,
            "entity_type": entity.type if entity else None,
        },
        "mentions": [
            {
                "id": str(row[0]),
                "title": row[1],
                "source_url": row[2],
                "source_publication": row[3],
                "published_at": row[4].isoformat() if row[4] else None,
                "raw_content": row[5][:300] if row[5] else None,
                "sentiment_score": row[6],
                "themes": row[7],
            }
            for row in mentions
        ],
    }


def _serialize(n: Narrative) -> dict:
    return {
        "id": str(n.id),
        "title": n.title,
        "description": n.description,
        "status": n.status,
        "mention_count": n.mention_count,
        "velocity_score": n.velocity_score,
        "sentiment_trajectory": n.sentiment_trajectory,
        "first_seen_at": n.first_seen_at.isoformat() if n.first_seen_at else None,
        "last_seen_at": n.last_seen_at.isoformat() if n.last_seen_at else None,
    }
