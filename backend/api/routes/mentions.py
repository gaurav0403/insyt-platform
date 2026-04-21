from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, cast, Float
from sqlalchemy.dialects.postgresql import JSONB
from backend.db.session import get_db
from backend.db.models import Mention, MentionAnalysis
from typing import Optional

router = APIRouter()


@router.get("/")
async def list_mentions(
    source_type: Optional[str] = None,
    publication: Optional[str] = None,
    sort: str = Query(default="relevance", description="Sort by: relevance, date, publication"),
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(Mention)
    if source_type:
        query = query.where(Mention.source_type == source_type)
    if publication:
        query = query.where(Mention.source_publication == publication)

    # Sort options
    if sort == "relevance":
        # Sort by relevance_score in metadata JSONB, then by date
        query = query.order_by(
            text("(metadata->>'relevance_score')::float DESC NULLS LAST"),
            Mention.published_at.desc(),
        )
    elif sort == "publication":
        query = query.order_by(Mention.source_publication, Mention.published_at.desc())
    else:  # date
        query = query.order_by(Mention.published_at.desc())

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    mentions = result.scalars().all()
    return {"mentions": [_serialize_mention(m) for m in mentions], "count": len(mentions)}


@router.get("/stats")
async def mention_stats(db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count(Mention.id)))
    by_source = await db.execute(
        select(Mention.source_type, func.count(Mention.id))
        .group_by(Mention.source_type)
    )
    by_publication = await db.execute(
        select(Mention.source_publication, func.count(Mention.id))
        .group_by(Mention.source_publication)
        .order_by(func.count(Mention.id).desc())
        .limit(15)
    )
    return {
        "total": total or 0,
        "by_source": {row[0]: row[1] for row in by_source.all()},
        "by_publication": {row[0]: row[1] for row in by_publication.all()},
    }


@router.get("/{mention_id}")
async def get_mention(mention_id: str, db: AsyncSession = Depends(get_db)):
    mention = await db.get(Mention, mention_id)
    if not mention:
        return {"error": "not found"}, 404
    return _serialize_mention(mention)


def _serialize_mention(m: Mention) -> dict:
    metadata = m.metadata_ or {}
    return {
        "id": str(m.id),
        "source_type": m.source_type,
        "source_url": m.source_url,
        "source_publication": m.source_publication,
        "title": m.title,
        "author": m.author,
        "published_at": m.published_at.isoformat() if m.published_at else None,
        "ingested_at": m.ingested_at.isoformat() if m.ingested_at else None,
        "language": m.language,
        "raw_content": m.raw_content[:500] if m.raw_content else None,
        "relevance_tier": metadata.get("relevance_tier"),
        "relevance_score": metadata.get("relevance_score"),
        "query_group": metadata.get("query_group"),
    }
