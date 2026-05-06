"""
Ingest social signals from XPOZ MCP data into the mentions table.
Called with pre-fetched data from Twitter, Reddit, Instagram.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
import structlog

from backend.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


def ingest_twitter(posts: list[dict]) -> int:
    """Ingest Twitter posts into mentions table."""
    engine = create_engine(settings.database_url_sync)
    inserted = 0
    with engine.begin() as conn:
        for post in posts:
            tweet_text = post.get("text", "")
            if not tweet_text or len(tweet_text) < 20:
                continue
            # Skip customer service replies from official account
            if post.get("authorUsername") == "KalyanJewellers" and tweet_text.startswith("@"):
                continue

            tweet_id = post.get("id", "")
            url = f"https://x.com/{post.get('authorUsername', '_')}/status/{tweet_id}"

            # Check for duplicate
            exists = conn.execute(
                text("SELECT 1 FROM mentions WHERE source_url = :url"),
                {"url": url}
            ).fetchone()
            if exists:
                continue

            published = None
            if post.get("createdAtDate"):
                try:
                    published = datetime.fromisoformat(post["createdAtDate"].replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    pass

            engagement = (post.get("likeCount", 0) or 0) + (post.get("retweetCount", 0) or 0) * 2 + (post.get("replyCount", 0) or 0)

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
                "author": post.get("authorUsername", ""),
                "pub_at": published,
                "ing_at": datetime.now(timezone.utc),
                "content": tweet_text,
                "hash": str(hash(tweet_text)),
                "lang": post.get("lang", "en"),
                "meta": f'{{"engagement": {engagement}, "likes": {post.get("likeCount", 0) or 0}, "retweets": {post.get("retweetCount", 0) or 0}, "source": "xpoz"}}',
            })
            inserted += 1
    logger.info("social.twitter_ingested", count=inserted)
    return inserted


def ingest_reddit(posts: list[dict]) -> int:
    """Ingest Reddit posts into mentions table."""
    engine = create_engine(settings.database_url_sync)
    inserted = 0
    with engine.begin() as conn:
        for post in posts:
            title = post.get("title", "")
            selftext = post.get("selftext", "")
            content = f"{title}\n\n{selftext}".strip() if selftext else title
            if not content or len(content) < 20:
                continue

            url = post.get("url", "")
            permalink = f"https://reddit.com{post.get('permalink', '')}" if post.get("permalink") else url
            source_url = permalink or url

            exists = conn.execute(
                text("SELECT 1 FROM mentions WHERE source_url = :url"),
                {"url": source_url}
            ).fetchone()
            if exists:
                continue

            published = None
            if post.get("createdAtDate"):
                try:
                    published = datetime.fromisoformat(post["createdAtDate"].replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    pass

            subreddit = post.get("subredditName", "")
            score = post.get("score", 0) or 0

            conn.execute(text("""
                INSERT INTO mentions (id, source_type, source_url, source_publication, title, author,
                    published_at, ingested_at, raw_content, content_hash, language, metadata)
                VALUES (:id, :stype, :url, :pub, :title, :author, :pub_at, :ing_at, :content,
                    :hash, :lang, :meta)
                ON CONFLICT DO NOTHING
            """), {
                "id": str(uuid.uuid4()),
                "stype": "reddit",
                "url": source_url,
                "pub": f"r/{subreddit}" if subreddit else "Reddit",
                "title": title[:200],
                "author": post.get("authorUsername", ""),
                "pub_at": published,
                "ing_at": datetime.now(timezone.utc),
                "content": content[:2000],
                "hash": str(hash(content)),
                "lang": "en",
                "meta": f'{{"score": {score}, "comments": {post.get("commentsCount", 0) or 0}, "subreddit": "{subreddit}", "source": "xpoz"}}',
            })
            inserted += 1
    logger.info("social.reddit_ingested", count=inserted)
    return inserted


def ingest_instagram(posts: list[dict]) -> int:
    """Ingest Instagram posts into mentions table."""
    engine = create_engine(settings.database_url_sync)
    inserted = 0
    with engine.begin() as conn:
        for post in posts:
            caption = post.get("caption", "")
            if not caption or len(caption) < 20:
                continue

            post_id = post.get("id", "")
            username = post.get("username", "")
            url = f"https://instagram.com/p/{post_id}" if post_id else ""

            exists = conn.execute(
                text("SELECT 1 FROM mentions WHERE source_url = :url"),
                {"url": url}
            ).fetchone()
            if exists:
                continue

            published = None
            if post.get("createdAtDate"):
                try:
                    published = datetime.fromisoformat(post["createdAtDate"].replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    pass

            likes = post.get("likeCount", 0)
            if isinstance(likes, str):
                likes = int(likes) if likes.isdigit() else 0

            conn.execute(text("""
                INSERT INTO mentions (id, source_type, source_url, source_publication, title, author,
                    published_at, ingested_at, raw_content, content_hash, language, metadata)
                VALUES (:id, :stype, :url, :pub, :title, :author, :pub_at, :ing_at, :content,
                    :hash, :lang, :meta)
                ON CONFLICT DO NOTHING
            """), {
                "id": str(uuid.uuid4()),
                "stype": "instagram",
                "url": url,
                "pub": "Instagram",
                "title": caption[:120],
                "author": username,
                "pub_at": published,
                "ing_at": datetime.now(timezone.utc),
                "content": caption[:2000],
                "hash": str(hash(caption)),
                "lang": "en",
                "meta": f'{{"likes": {likes}, "comments": {post.get("commentCount", 0) or 0}, "username": "{username}", "source": "xpoz"}}',
            })
            inserted += 1
    logger.info("social.instagram_ingested", count=inserted)
    return inserted
