from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.db.session import get_db
from backend.db.models import Entity
from typing import Optional

router = APIRouter()


@router.get("/")
async def list_entities(
    type: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(Entity).order_by(Entity.canonical_name)
    if type:
        query = query.where(Entity.type == type)
    query = query.limit(limit)
    result = await db.execute(query)
    entities = result.scalars().all()
    return {"entities": [_serialize_entity(e) for e in entities]}


@router.get("/stats")
async def entity_stats(db: AsyncSession = Depends(get_db)):
    by_type = await db.execute(
        select(Entity.type, func.count(Entity.id)).group_by(Entity.type)
    )
    return {"by_type": {row[0]: row[1] for row in by_type.all()}}


def _serialize_entity(e: Entity) -> dict:
    return {
        "id": str(e.id),
        "type": e.type,
        "canonical_name": e.canonical_name,
        "aliases": e.aliases or [],
        "metadata": e.metadata_,
    }
