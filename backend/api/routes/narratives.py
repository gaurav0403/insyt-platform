from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.db.session import get_db
from backend.db.models import Narrative
from typing import Optional

router = APIRouter()


@router.get("/")
async def list_narratives(
    status: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Narrative).order_by(Narrative.last_seen_at.desc().nullslast())
    if status:
        query = query.where(Narrative.status == status)
    query = query.limit(limit)
    result = await db.execute(query)
    narratives = result.scalars().all()
    return {"narratives": [_serialize(n) for n in narratives]}


def _serialize(n: Narrative) -> dict:
    return {
        "id": str(n.id),
        "title": n.title,
        "description": n.description,
        "status": n.status,
        "mention_count": n.mention_count,
        "velocity_score": n.velocity_score,
        "first_seen_at": n.first_seen_at.isoformat() if n.first_seen_at else None,
        "last_seen_at": n.last_seen_at.isoformat() if n.last_seen_at else None,
    }
