"""
Google Reviews ingestion via SearchAPI.io Google Maps Reviews engine.
Pulls reviews for tracked stores, scores them, stores in mentions table.
"""
import uuid
import httpx
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine, text
import structlog
import re

from backend.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

# Top stores to monitor -- selected by review volume and geographic coverage
KALYAN_STORES = [
    {"name": "Kalyan Jewellers - Thrissur", "place_id": "ChIJMT61S07upzsRgm6Y3u21YVA", "city": "Thrissur", "state": "KL"},
    {"name": "Kalyan Jewellers - MG Road, Ernakulam", "place_id": "ChIJXZ_QIk0NCDsRwq2tN5EgIyY", "city": "Kochi", "state": "KL"},
    {"name": "Kalyan Jewellers - Kozhikode", "place_id": "ChIJQ_kNlj9ZpjsRfkJYPJ4p9b0", "city": "Kozhikode", "state": "KL"},
    {"name": "Kalyan Jewellers - Gandhipuram, Coimbatore", "place_id": "ChIJha8EDVZYqDsRMq-49v_wem0", "city": "Coimbatore", "state": "TN"},
    {"name": "Kalyan Jewellers - T. Nagar", "place_id": "ChIJ5eh3jU1mUjoReqiZnqKjjeU", "city": "Chennai", "state": "TN"},
    {"name": "Kalyan Jewellers - Jayanagar, Bengaluru", "place_id": "ChIJx6Bj7ZcVrjsRbdr2a7B4OYk", "city": "Bengaluru", "state": "KA"},
    {"name": "Kalyan Jewellers - Dickenson Rd, Bengaluru", "place_id": "ChIJWaQZlIgWrjsRmfpuyhwS4bI", "city": "Bengaluru", "state": "KA"},
    {"name": "Kalyan Jewellers - Punjagutta, Hyderabad", "place_id": "ChIJ6x9OXbWQyzsRhEqnoK_LZxw", "city": "Hyderabad", "state": "TS"},
    {"name": "Kalyan Jewellers - Karol Bagh, New Delhi", "place_id": "ChIJSwkagJgCDTkR84zEUeHx13M", "city": "Delhi", "state": "DL"},
    {"name": "Kalyan Jewellers - South Extension, New Delhi", "place_id": "ChIJc8ltNJXjDDkRLSTK8ebDeGw", "city": "Delhi", "state": "DL"},
    {"name": "Kalyan Jewellers - Hazratganj, Lucknow", "place_id": "ChIJTZpqJgr9mzkRAEUZvhInxdk", "city": "Lucknow", "state": "UP"},
    {"name": "Kalyan Jewellers - Ghatkopar, Mumbai", "place_id": "ChIJSzhdQyzG5zsROu5WGgzMLMc", "city": "Mumbai", "state": "MH"},
    {"name": "Kalyan Jewellers - Thane, Mumbai", "place_id": "ChIJ56c4Olu55zsR6qDms1zfT2g", "city": "Mumbai", "state": "MH"},
    {"name": "Kalyan Jewellers - Vashi, Mumbai", "place_id": "ChIJw54dWkzB5zsREAWdUos77qw", "city": "Mumbai", "state": "MH"},
    {"name": "Kalyan Jewellers - Pitampura, Delhi", "place_id": "ChIJI4qb1TICDTkRN9KOinH-kpU", "city": "Delhi", "state": "DL"},
]

COMPETITOR_STORES = [
    {"name": "Tanishq - T. Nagar, Chennai", "place_id": "ChIJa_FZxE1mUjoR3i6aDe37xXk", "city": "Chennai", "state": "TN", "brand": "Tanishq"},
    {"name": "Tanishq - Connaught Place, Delhi", "place_id": "ChIJLY3YlXoCDTkRpGvEqPnLQs0", "city": "Delhi", "state": "DL", "brand": "Tanishq"},
    {"name": "Malabar Gold - Kozhikode", "place_id": "ChIJa0XLpj9ZpjsRaF5YPIYCu0E", "city": "Kozhikode", "state": "KL", "brand": "Malabar Gold"},
    {"name": "Joyalukkas - Kochi", "place_id": "ChIJAwtzqE0NCDsRoqCX0EPlXuc", "city": "Kochi", "state": "KL", "brand": "Joyalukkas"},
]


def _parse_relative_date(date_str: str) -> datetime | None:
    """Parse Google's relative dates like '2 weeks ago', '3 months ago'."""
    if not date_str:
        return None
    now = datetime.now(timezone.utc)
    date_str = date_str.lower().strip()

    match = re.match(r"(\d+)\s+(hour|day|week|month|year)s?\s+ago", date_str)
    if match:
        num = int(match.group(1))
        unit = match.group(2)
        delta = {
            "hour": timedelta(hours=num),
            "day": timedelta(days=num),
            "week": timedelta(weeks=num),
            "month": timedelta(days=num * 30),
            "year": timedelta(days=num * 365),
        }.get(unit, timedelta(0))
        return now - delta

    if "yesterday" in date_str:
        return now - timedelta(days=1)
    if "hour" in date_str or "minute" in date_str:
        return now

    return None


def fetch_reviews(place_id: str, num: int = 20) -> list[dict]:
    """Fetch reviews from SearchAPI Google Maps Reviews."""
    try:
        resp = httpx.get(
            "https://www.searchapi.io/api/v1/search",
            params={
                "api_key": settings.searchapi_key,
                "engine": "google_maps_reviews",
                "place_id": place_id,
                "hl": "en",
                "sort_by": "newest",
                "num": num,
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("reviews", [])
    except Exception as e:
        logger.warning("reviews.fetch_failed", place_id=place_id, error=str(e))
        return []


def store_reviews(reviews: list[dict], store_name: str, city: str, state: str, brand: str = "Kalyan Jewellers") -> int:
    """Store reviews in mentions table."""
    engine = create_engine(settings.database_url_sync)
    inserted = 0
    cutoff = datetime.now(timezone.utc) - timedelta(days=90)

    with engine.begin() as conn:
        for review in reviews:
            text_content = review.get("text", review.get("snippet", ""))
            if not text_content or len(text_content) < 5:
                continue

            rating = review.get("rating", 0)
            user_name = review.get("user", {}).get("name", "Anonymous")
            date_str = review.get("date", "")
            published = _parse_relative_date(date_str)

            # Skip reviews older than 90 days
            if published and published < cutoff:
                continue

            # Use the real Google Maps review link, fallback to place search
            source_url = review.get("link", "")
            if not source_url:
                source_url = f"https://www.google.com/maps/search/{store_name.replace(' ', '+')}+{city}"

            exists = conn.execute(
                text("SELECT 1 FROM mentions WHERE content_hash = :hash"),
                {"hash": str(hash(text_content + store_name))}
            ).fetchone()
            if exists:
                continue

            title = f"{'★' * rating}{'☆' * (5-rating)} {text_content[:80]}"

            conn.execute(text("""
                INSERT INTO mentions (id, source_type, source_url, source_publication, title, author,
                    published_at, ingested_at, raw_content, content_hash, language, region, metadata)
                VALUES (:id, 'review', :url, :pub, :title, :author, :pub_at, :ing_at, :content,
                    :hash, 'en', :region, :meta)
                ON CONFLICT DO NOTHING
            """), {
                "id": str(uuid.uuid4()),
                "url": source_url,
                "pub": f"Google Reviews \u00B7 {brand}",
                "title": title,
                "author": user_name,
                "pub_at": published,
                "ing_at": datetime.now(timezone.utc),
                "content": f"[{store_name} \u00B7 {city}, {state}] Rating: {rating}/5\n\n{text_content}",
                "hash": str(hash(text_content + store_name)),
                "region": f"{city}, {state}",
                "meta": f'{{"rating": {rating}, "store": "{store_name}", "city": "{city}", "state": "{state}", "brand": "{brand}", "source": "google_reviews"}}',
            })
            inserted += 1

    return inserted


def run_review_ingestion():
    """Pull reviews for all tracked stores."""
    if not settings.searchapi_key:
        print("ERROR: INSYT_SEARCHAPI_KEY not set.")
        return

    total = 0

    print("Pulling Kalyan Jewellers store reviews...")
    for store in KALYAN_STORES:
        reviews = fetch_reviews(store["place_id"], num=20)
        if reviews:
            inserted = store_reviews(reviews, store["name"], store["city"], store["state"])
            total += inserted
            print(f"  {store['city']} ({store['name'][:40]}): {len(reviews)} fetched, {inserted} new (90d)")

    print("\nPulling competitor store reviews...")
    for store in COMPETITOR_STORES:
        reviews = fetch_reviews(store["place_id"], num=15)
        if reviews:
            inserted = store_reviews(reviews, store["name"], store["city"], store["state"], brand=store["brand"])
            total += inserted
            print(f"  {store['brand']} {store['city']}: {len(reviews)} fetched, {inserted} new (90d)")

    print(f"\nReview ingestion complete: {total} new reviews stored (90-day window)")
    return total


if __name__ == "__main__":
    run_review_ingestion()
