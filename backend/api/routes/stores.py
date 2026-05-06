"""
Store-level intelligence endpoints.
Serves Google Reviews data grouped by store/city with sentiment and patterns.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from backend.db.session import get_db
from typing import Optional

router = APIRouter()


@router.get("/")
async def list_stores(
    sort: str = Query(default="signals", description="signals, rating, sentiment"),
    limit: int = Query(default=30, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List all stores with review stats."""
    sort_clause = {
        "signals": "review_count DESC",
        "rating": "avg_rating ASC",
        "sentiment": "avg_sentiment ASC",
    }.get(sort, "review_count DESC")

    result = await db.execute(text(f"""
        SELECT
            m.metadata->>'store' as store_name,
            m.metadata->>'city' as city,
            m.metadata->>'state' as state,
            m.metadata->>'brand' as brand,
            COUNT(*) as review_count,
            ROUND(AVG((m.metadata->>'rating')::float)::numeric, 1) as avg_rating,
            ROUND(AVG(COALESCE(ma.sentiment_score, 0))::numeric, 2) as avg_sentiment,
            COUNT(*) FILTER (WHERE (m.metadata->>'rating')::int <= 2) as low_ratings,
            COUNT(*) FILTER (WHERE (m.metadata->>'rating')::int >= 4) as high_ratings,
            COUNT(*) FILTER (WHERE ma.relevance_score >= 0.9) as actionable
        FROM mentions m
        LEFT JOIN mention_analysis ma ON m.id = ma.mention_id
        WHERE m.source_type = 'review'
          AND m.metadata->>'store' IS NOT NULL
        GROUP BY store_name, city, state, brand
        ORDER BY {sort_clause}
        LIMIT :limit
    """), {"limit": limit})

    rows = result.fetchall()
    stores = []
    for r in rows:
        stores.append({
            "store_name": r[0],
            "city": r[1],
            "state": r[2],
            "brand": r[3],
            "review_count": r[4],
            "avg_rating": float(r[5]) if r[5] else None,
            "avg_sentiment": float(r[6]) if r[6] else None,
            "low_ratings": r[7],
            "high_ratings": r[8],
            "actionable": r[9],
        })

    return {"stores": stores, "count": len(stores)}


@router.get("/summary")
async def store_summary(db: AsyncSession = Depends(get_db)):
    """Overview stats for store-level intelligence."""
    result = await db.execute(text("""
        SELECT
            COUNT(*) as total_reviews,
            COUNT(DISTINCT m.metadata->>'store') as total_stores,
            COUNT(DISTINCT m.metadata->>'city') as total_cities,
            ROUND(AVG((m.metadata->>'rating')::float)::numeric, 1) as avg_rating,
            COUNT(*) FILTER (WHERE (m.metadata->>'rating')::int <= 2) as low_count,
            COUNT(*) FILTER (WHERE (m.metadata->>'rating')::int = 5) as five_star,
            ROUND(AVG(COALESCE(ma.sentiment_score, 0))::numeric, 2) as avg_sentiment
        FROM mentions m
        LEFT JOIN mention_analysis ma ON m.id = ma.mention_id
        WHERE m.source_type = 'review'
    """))
    row = result.fetchone()

    # By city
    by_city = await db.execute(text("""
        SELECT m.metadata->>'city' as city, m.metadata->>'state' as state,
               COUNT(*) as reviews,
               ROUND(AVG((m.metadata->>'rating')::float)::numeric, 1) as avg_rating,
               COUNT(*) FILTER (WHERE (m.metadata->>'rating')::int <= 2) as complaints
        FROM mentions m
        WHERE m.source_type = 'review' AND m.metadata->>'city' IS NOT NULL
        GROUP BY city, state
        ORDER BY reviews DESC
    """))

    return {
        "total_reviews": row[0],
        "total_stores": row[1],
        "total_cities": row[2],
        "avg_rating": float(row[3]) if row[3] else None,
        "low_ratings": row[4],
        "five_star": row[5],
        "avg_sentiment": float(row[6]) if row[6] else None,
        "by_city": [
            {"city": r[0], "state": r[1], "reviews": r[2], "avg_rating": float(r[3]) if r[3] else None, "complaints": r[4]}
            for r in by_city.fetchall()
        ],
    }


@router.get("/{store_name}/reviews")
async def store_reviews(
    store_name: str,
    limit: int = Query(default=20, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Get reviews for a specific store."""
    result = await db.execute(text("""
        SELECT m.id, m.title, m.raw_content, m.author, m.published_at, m.source_url,
               m.metadata->>'rating' as rating, m.metadata->>'city' as city,
               m.metadata->>'state' as state,
               ma.sentiment_score, ma.severity_score, ma.key_claims
        FROM mentions m
        LEFT JOIN mention_analysis ma ON m.id = ma.mention_id
        WHERE m.source_type = 'review'
          AND m.metadata->>'store' ILIKE :store
        ORDER BY m.published_at DESC NULLS LAST
        LIMIT :limit
    """), {"store": f"%{store_name}%", "limit": limit})

    rows = result.fetchall()
    reviews = []
    for r in rows:
        reviews.append({
            "id": str(r[0]),
            "title": r[1],
            "content": r[2],
            "author": r[3],
            "published_at": r[4].isoformat() if r[4] else None,
            "source_url": r[5],
            "rating": int(r[6]) if r[6] else None,
            "city": r[7],
            "state": r[8],
            "sentiment": r[9],
            "severity": r[10],
            "why_it_matters": r[11][0] if r[11] else None,
        })

    return {"reviews": reviews, "count": len(reviews), "store": store_name}
