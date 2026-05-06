"""
Vernacular press ingestion via SearchAPI Google News with regional language params.
Covers Malayalam, Tamil, Hindi press for Kalyan + competitors + industry.
"""
import uuid
import httpx
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, text
import structlog

from backend.config import get_settings
from backend.ingestion.news.scraper import score_relevance, content_hash, detect_language, identify_publication

logger = structlog.get_logger()
settings = get_settings()

REGIONAL_QUERIES = {
    "ml": {
        "name": "Malayalam",
        "queries": [
            "കല്യാൺ ജ്വല്ലറീസ്",
            "സ്വർണ്ണം ഹാൾമാർക്കിംഗ് കേരള",
            "മലബാർ ഗോൾഡ്",
            "ജോയ് ആലുക്കാസ്",
            "Kalyan Jewellers Kerala",
            "gold jewellery Kerala",
        ],
    },
    "ta": {
        "name": "Tamil",
        "queries": [
            "கல்யாண் ஜுவல்லர்ஸ்",
            "தங்கம் ஹால்மார்க்கிங்",
            "தனிஷ்க் நகை",
            "Kalyan Jewellers Tamil Nadu",
            "Tanishq Chennai",
            "gold jewellery Tamil Nadu",
        ],
    },
    "hi": {
        "name": "Hindi",
        "queries": [
            "कल्याण ज्वैलर्स",
            "सोना हॉलमार्किंग भारत",
            "तनिष्क ज्वैलरी",
            "मलाबार गोल्ड",
            "Kalyan Jewellers Hindi",
            "gold hallmarking India Hindi",
        ],
    },
    "te": {
        "name": "Telugu",
        "queries": [
            "కల్యాణ్ జ్యువెల్లర్స్",
            "బంగారం హాల్‌మార్కింగ్",
            "తనిష్క్ నగలు",
            "మలబార్ గోల్డ్",
            "Kalyan Jewellers Hyderabad",
            "gold jewellery Telangana",
        ],
    },
    "kn": {
        "name": "Kannada",
        "queries": [
            "ಕಲ್ಯಾಣ್ ಜ್ಯುವೆಲ್ಲರ್ಸ್",
            "ಚಿನ್ನದ ಹಾಲ್‌ಮಾರ್ಕಿಂಗ್",
            "ತನಿಷ್ಕ್ ಆಭರಣ",
            "Kalyan Jewellers Bangalore",
            "gold jewellery Karnataka",
            "Malabar Gold Bangalore",
        ],
    },
}


def search_regional(query: str, lang: str, num_results: int = 10) -> list[dict]:
    """Search Google News in regional language."""
    try:
        resp = httpx.get(
            "https://www.searchapi.io/api/v1/search",
            params={
                "api_key": settings.searchapi_key,
                "engine": "google_news",
                "q": query,
                "gl": "in",
                "hl": lang,
                "num": num_results,
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        raw = data.get("news_results", data.get("organic_results", []))
        results = []
        for r in raw:
            source = r.get("source", {})
            src_name = source.get("name", "") if isinstance(source, dict) else str(source)
            results.append({
                "title": r.get("title", ""),
                "link": r.get("link", ""),
                "snippet": r.get("snippet", ""),
                "source": src_name,
                "date": r.get("iso_date", r.get("date", "")),
            })
        return results
    except Exception as e:
        logger.warning("regional.search_failed", query=query[:30], lang=lang, error=str(e))
        return []


def store_regional(mentions: list[dict]) -> int:
    """Store regional mentions in DB."""
    engine = create_engine(settings.database_url_sync)
    inserted = 0

    with engine.begin() as conn:
        for m in mentions:
            url = m.get("source_url", "")
            if not url:
                continue

            exists = conn.execute(
                text("SELECT 1 FROM mentions WHERE source_url = :url"),
                {"url": url},
            ).fetchone()
            if exists:
                continue

            conn.execute(text("""
                INSERT INTO mentions (id, source_type, source_url, source_publication, title, author,
                    published_at, ingested_at, raw_content, content_hash, language, metadata)
                VALUES (:id, 'news', :url, :pub, :title, NULL, :pub_at, :ing_at, :content,
                    :hash, :lang, :meta)
                ON CONFLICT DO NOTHING
            """), {
                "id": str(uuid.uuid4()),
                "url": url,
                "pub": m.get("source_publication", "Unknown"),
                "title": m.get("title", "")[:200],
                "pub_at": m.get("published_at"),
                "ing_at": datetime.now(timezone.utc),
                "content": m.get("raw_content", ""),
                "hash": m.get("content_hash", str(hash(url))),
                "lang": m.get("language", "en"),
                "meta": f'{{"query_group": "regional", "language": "{m.get("language", "")}", "source": "searchapi_regional"}}',
            })
            inserted += 1

    return inserted


def _parse_date(date_str: str) -> datetime | None:
    """Try parsing various date formats."""
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        pass
    # Relative dates from regional results
    now = datetime.now(timezone.utc)
    dl = date_str.lower()
    if "day" in dl or "दिन" in dl or "ദിവസ" in dl or "நாள" in dl:
        try:
            num = int("".join(c for c in dl if c.isdigit()) or "1")
            return now - timedelta(days=num)
        except ValueError:
            pass
    if "week" in dl or "हफ़्त" in dl or "ആഴ്ച" in dl or "வாரம" in dl:
        try:
            num = int("".join(c for c in dl if c.isdigit()) or "1")
            return now - timedelta(weeks=num)
        except ValueError:
            pass
    if "month" in dl or "महीन" in dl or "മാസ" in dl or "மாத" in dl:
        try:
            num = int("".join(c for c in dl if c.isdigit()) or "1")
            return now - timedelta(days=num * 30)
        except ValueError:
            pass
    return None


def run_regional_ingestion():
    """Pull vernacular press from all configured languages."""
    if not settings.searchapi_key:
        print("ERROR: INSYT_SEARCHAPI_KEY not set.")
        return

    total = 0

    for lang_code, config in REGIONAL_QUERIES.items():
        lang_name = config["name"]
        lang_total = 0
        print(f"\n{lang_name} ({lang_code}):")

        for query in config["queries"]:
            results = search_regional(query, lang_code, num_results=10)
            if not results:
                continue

            mentions = []
            seen_urls = set()
            for item in results:
                url = item.get("link", "")
                if not url or url in seen_urls:
                    continue
                seen_urls.add(url)

                title = item.get("title", "")
                snippet = item.get("snippet", "")
                full_text = f"{title}\n\n{snippet}" if snippet else title

                if not full_text or len(full_text) < 15:
                    continue

                pub = item.get("source", "") or identify_publication(url) or "Unknown"
                published = _parse_date(item.get("date", ""))

                mentions.append({
                    "source_url": url,
                    "source_publication": pub,
                    "title": title,
                    "raw_content": full_text,
                    "content_hash": content_hash(full_text),
                    "language": lang_code,
                    "published_at": published,
                })

            if mentions:
                inserted = store_regional(mentions)
                lang_total += inserted
                print(f"  {query[:40]}: {len(results)} found, {inserted} new")

        total += lang_total
        print(f"  {lang_name} subtotal: {lang_total} new")

    print(f"\nRegional ingestion complete: {total} new mentions")
    return total


if __name__ == "__main__":
    run_regional_ingestion()
