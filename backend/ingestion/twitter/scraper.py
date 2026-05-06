"""
Twitter ingestion via twitterapi.io
Pulls tweets for tracked queries and handles, stores in mentions table.
"""
import uuid
import httpx
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
import structlog

from backend.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

BASE_URL = "https://api.twitterapi.io/twitter"

SEARCH_QUERIES = [
    # Brand
    '"Kalyan Jewellers"',
    "KALYANKJIL",
    "Candere jewellery",
    # Competitors
    "Tanishq jewellery",
    "Malabar Gold",
    "Joyalukkas",
    # Issues
    "hallmarking jewellery India",
    "jewellery fraud India",
    # Consumer signals
    "Kalyan Jewellers review",
    "Kalyan Jewellers complaint",
    "Kalyan Jewellers experience",
]

TRACKED_HANDLES = [
    "KalyanJewellers",
    "TanishqJewelry",
    "MalabarGold",
    "JoyAlukkas",
]


def _headers():
    return {"X-API-Key": settings.twitter_api_key}


def search_tweets(query: str, max_pages: int = 3) -> list[dict]:
    """Search tweets via twitterapi.io advanced search."""
    all_tweets = []
    cursor = ""

    for page in range(max_pages):
        try:
            resp = httpx.get(
                f"{BASE_URL}/tweet/advanced_search",
                params={
                    "query": query,
                    "queryType": "Latest",
                    "cursor": cursor,
                },
                headers=_headers(),
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()

            tweets = data.get("tweets", [])
            all_tweets.extend(tweets)
            logger.info("twitter.search_page", query=query[:30], page=page + 1, tweets=len(tweets))

            if not data.get("has_next_page") or not tweets:
                break
            cursor = data.get("next_cursor", "")

        except Exception as e:
            logger.warning("twitter.search_failed", query=query, error=str(e))
            break

    return all_tweets


def get_user_tweets(username: str, max_pages: int = 2) -> list[dict]:
    """Get recent tweets from a specific user."""
    all_tweets = []
    cursor = ""

    for page in range(max_pages):
        try:
            resp = httpx.get(
                f"{BASE_URL}/user/last_tweets",
                params={"userName": username, "cursor": cursor},
                headers=_headers(),
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()

            tweets = data.get("tweets", [])
            all_tweets.extend(tweets)

            if not data.get("has_next_page") or not tweets:
                break
            cursor = data.get("next_cursor", "")

        except Exception as e:
            logger.warning("twitter.user_failed", username=username, error=str(e))
            break

    return all_tweets


def _parse_twitter_date(date_str: str) -> datetime | None:
    """Parse Twitter date format: 'Sat Apr 25 18:03:07 +0000 2026'"""
    try:
        return datetime.strptime(date_str, "%a %b %d %H:%M:%S %z %Y")
    except (ValueError, TypeError):
        return None


def store_tweets(tweets: list[dict]) -> int:
    """Store tweets in mentions table, deduplicating by URL."""
    engine = create_engine(settings.database_url_sync)
    inserted = 0

    with engine.begin() as conn:
        for tweet in tweets:
            tweet_text = tweet.get("text", "")
            if not tweet_text or len(tweet_text) < 15:
                continue

            author = tweet.get("author", {})
            username = author.get("userName", "")
            tweet_id = tweet.get("id", "")

            # Skip retweets of content we'd already capture
            if tweet_text.startswith("RT @"):
                continue

            url = f"https://x.com/{username}/status/{tweet_id}"

            # Dedup
            exists = conn.execute(
                text("SELECT 1 FROM mentions WHERE source_url = :url"),
                {"url": url}
            ).fetchone()
            if exists:
                continue

            published = _parse_twitter_date(tweet.get("createdAt", ""))
            likes = tweet.get("likeCount", 0) or 0
            retweets = tweet.get("retweetCount", 0) or 0
            replies = tweet.get("replyCount", 0) or 0
            views = tweet.get("viewCount", 0) or 0

            conn.execute(text("""
                INSERT INTO mentions (id, source_type, source_url, source_publication, title, author,
                    published_at, ingested_at, raw_content, content_hash, language, metadata)
                VALUES (:id, :stype, :url, :pub, :title, :author, :pub_at, :ing_at, :content,
                    :hash, :lang, :meta)
                ON CONFLICT DO NOTHING
            """), {
                "id": str(uuid.uuid4()),
                "stype": "twitter",
                "url": url,
                "pub": "X / Twitter",
                "title": tweet_text[:120],
                "author": username,
                "pub_at": published,
                "ing_at": datetime.now(timezone.utc),
                "content": tweet_text,
                "hash": str(hash(tweet_text)),
                "lang": tweet.get("lang", "en"),
                "meta": f'{{"likes": {likes}, "retweets": {retweets}, "replies": {replies}, "views": {views}, "followers": {author.get("followers", 0) or 0}, "verified": {str(author.get("isVerified", False)).lower()}, "source": "twitterapi.io"}}',
            })
            inserted += 1

    return inserted


def run_twitter_ingestion():
    """Full Twitter ingestion: search queries + tracked handles."""
    if not settings.twitter_api_key:
        print("ERROR: INSYT_TWITTER_API_KEY not set.")
        return

    total_inserted = 0

    # Search queries
    for query in SEARCH_QUERIES:
        tweets = search_tweets(query, max_pages=2)
        if tweets:
            inserted = store_tweets(tweets)
            total_inserted += inserted
            print(f"  {query[:40]}: {len(tweets)} found, {inserted} new")

    # Tracked handles
    for handle in TRACKED_HANDLES:
        tweets = get_user_tweets(handle, max_pages=1)
        if tweets:
            inserted = store_tweets(tweets)
            total_inserted += inserted
            print(f"  @{handle}: {len(tweets)} found, {inserted} new")

    print(f"\nTwitter ingestion complete: {total_inserted} new tweets stored")
    return total_inserted


if __name__ == "__main__":
    run_twitter_ingestion()
