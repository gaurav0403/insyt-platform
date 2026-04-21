from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.db.session import get_db
from backend.db.models import Brief

router = APIRouter()


@router.get("/")
async def list_briefs(
    limit: int = Query(default=10, le=50),
    db: AsyncSession = Depends(get_db),
):
    query = select(Brief).order_by(Brief.date.desc().nullslast()).limit(limit)
    result = await db.execute(query)
    briefs = result.scalars().all()
    return {"briefs": [_serialize(b) for b in briefs]}


@router.get("/latest")
async def latest_brief(db: AsyncSession = Depends(get_db)):
    query = select(Brief).order_by(Brief.date.desc().nullslast()).limit(1)
    result = await db.execute(query)
    brief = result.scalar_one_or_none()
    if not brief:
        return {"brief": None}
    return {"brief": _serialize(brief)}


@router.get("/{brief_id}")
async def get_brief(brief_id: str, db: AsyncSession = Depends(get_db)):
    brief = await db.get(Brief, brief_id)
    if not brief:
        return {"error": "not found"}, 404
    return _serialize(brief)


def _serialize(b: Brief) -> dict:
    return {
        "id": str(b.id),
        "date": b.date.isoformat() if b.date else None,
        "headline": b.headline,
        "subheadline": b.subheadline,
        "opening_paragraph": b.opening_paragraph,
        "sections": b.sections,
        "metrics": b.metrics,
        "generated_at": b.generated_at.isoformat() if b.generated_at else None,
    }
