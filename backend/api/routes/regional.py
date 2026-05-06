"""
Regional intelligence API endpoints.
Serves vernacular press mentions grouped by language.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from backend.db.session import get_db
from typing import Optional

router = APIRouter()

LANG_NAMES = {
    "ml": "Malayalam", "ta": "Tamil", "hi": "Hindi",
    "te": "Telugu", "kn": "Kannada", "bn": "Bengali",
    "mr": "Marathi", "gu": "Gujarati", "en": "English",
}


@router.get("/summary")
async def regional_summary(db: AsyncSession = Depends(get_db)):
    """Overview of regional language coverage."""
    result = await db.execute(text("""
        SELECT m.language, COUNT(*) as mentions,
               COUNT(DISTINCT m.source_publication) as publications,
               ROUND(AVG(COALESCE(ma.sentiment_score, 0))::numeric, 2) as avg_sentiment,
               MAX(m.published_at) as latest
        FROM mentions m
        LEFT JOIN mention_analysis ma ON m.id = ma.mention_id
        WHERE m.language IN ('ml', 'ta', 'hi', 'te', 'kn', 'bn', 'mr', 'gu')
        GROUP BY m.language
        ORDER BY COUNT(*) DESC
    """))
    rows = result.fetchall()

    languages = []
    for r in rows:
        languages.append({
            "code": r[0],
            "name": LANG_NAMES.get(r[0], r[0]),
            "mentions": r[1],
            "publications": r[2],
            "avg_sentiment": float(r[3]) if r[3] else None,
            "latest": r[4].isoformat() if r[4] else None,
        })

    total = sum(l["mentions"] for l in languages)
    return {"languages": languages, "total_mentions": total}


@router.get("/mentions")
async def regional_mentions(
    lang: Optional[str] = Query(None, description="Language code: ml, ta, hi, te, kn"),
    limit: int = Query(default=30, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get mentions for a specific language or all regional."""
    lang_filter = ""
    if lang:
        lang_filter = f"AND m.language = '{lang}'"

    result = await db.execute(text(f"""
        SELECT m.id, m.title, m.raw_content, m.source_type, m.source_publication,
               m.published_at, m.source_url, m.language,
               ma.sentiment_score, ma.key_claims
        FROM mentions m
        LEFT JOIN mention_analysis ma ON m.id = ma.mention_id
        WHERE m.language IN ('ml', 'ta', 'hi', 'te', 'kn', 'bn', 'mr', 'gu')
          {lang_filter}
        ORDER BY m.published_at DESC NULLS LAST
        LIMIT :limit
    """), {"limit": limit})

    rows = result.fetchall()
    mentions = []
    for r in rows:
        mentions.append({
            "id": str(r[0]),
            "title": r[1],
            "content": r[2][:400] if r[2] else None,
            "source_type": r[3],
            "source_publication": r[4],
            "published_at": r[5].isoformat() if r[5] else None,
            "source_url": r[6],
            "language": r[7],
            "language_name": LANG_NAMES.get(r[7], r[7]),
            "sentiment": r[8],
            "insight": r[9][0] if r[9] else None,
        })

    return {"mentions": mentions, "count": len(mentions)}


@router.get("/publications")
async def regional_publications(
    lang: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get publication breakdown per language."""
    lang_filter = ""
    if lang:
        lang_filter = f"AND m.language = '{lang}'"

    result = await db.execute(text(f"""
        SELECT m.language, m.source_publication, COUNT(*) as mentions
        FROM mentions m
        WHERE m.language IS NOT NULL AND m.language != 'en'
          AND m.source_publication IS NOT NULL
          {lang_filter}
        GROUP BY m.language, m.source_publication
        ORDER BY m.language, COUNT(*) DESC
    """))

    rows = result.fetchall()
    by_lang: dict = {}
    for r in rows:
        code = r[0]
        if code not in by_lang:
            by_lang[code] = {"language": LANG_NAMES.get(code, code), "code": code, "publications": []}
        by_lang[code]["publications"].append({"name": r[1], "mentions": r[2]})

    return {"languages": list(by_lang.values())}
