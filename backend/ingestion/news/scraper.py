"""
News scraper: fetches articles via RSS feeds, extracts full text via trafilatura,
normalizes into Mention records, deduplicates, and stores.
"""
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Optional

import feedparser
import httpx
import trafilatura
from langdetect import detect, LangDetectException
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

from backend.ingestion.news.sources import SOURCES, RELEVANCE_KEYWORDS

logger = structlog.get_logger()

# Respect rate limits: shared client with timeout
HTTP_TIMEOUT = 30.0
REQUEST_HEADERS = {
    "User-Agent": "InsytBot/1.0 (context-intelligence research; contact: gauravs2017@gmail.com)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def content_hash(text: str) -> str:
    """SHA-256 hash for deduplication."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def is_relevant(title: str, summary: str = "") -> bool:
    """Check if article title/summary contains any relevance keyword."""
    combined = (title + " " + summary).lower()
    return any(kw in combined for kw in RELEVANCE_KEYWORDS)


def detect_language(text: str) -> str:
    """Detect language of text, default to 'en'."""
    try:
        return detect(text[:1000])
    except LangDetectException:
        return "en"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=15))
def fetch_url(url: str) -> Optional[str]:
    """Fetch URL content with retries."""
    with httpx.Client(timeout=HTTP_TIMEOUT, headers=REQUEST_HEADERS, follow_redirects=True) as client:
        resp = client.get(url)
        resp.raise_for_status()
        return resp.text


def extract_article_text(html: str, url: str) -> Optional[str]:
    """Extract main article text from HTML using trafilatura."""
    return trafilatura.extract(html, url=url, include_comments=False, include_tables=False)


def parse_rss_feed(feed_url: str) -> list[dict]:
    """Parse an RSS feed and return list of entry dicts."""
    try:
        feed_content = fetch_url(feed_url)
        if not feed_content:
            return []
        feed = feedparser.parse(feed_content)
        return feed.entries
    except Exception as e:
        logger.warning("rss_feed.parse_failed", url=feed_url, error=str(e))
        return []


def parse_published_date(entry) -> Optional[datetime]:
    """Extract published date from feed entry."""
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        try:
            return datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
        except (TypeError, ValueError):
            pass
    if hasattr(entry, "updated_parsed") and entry.updated_parsed:
        try:
            return datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
        except (TypeError, ValueError):
            pass
    return None


def scrape_publication(publication_key: str, filter_relevant: bool = True) -> list[dict]:
    """
    Scrape a publication's RSS feeds, extract full articles,
    and return normalized mention dicts ready for DB insertion.

    Returns list of dicts with keys matching Mention model fields.
    """
    source_config = SOURCES.get(publication_key)
    if not source_config:
        logger.error("scraper.unknown_source", key=publication_key)
        return []

    mentions = []
    seen_urls = set()

    for feed_url in source_config.get("rss_feeds", []):
        logger.info("scraper.fetching_feed", publication=publication_key, feed=feed_url)
        entries = parse_rss_feed(feed_url)
        logger.info("scraper.feed_entries", publication=publication_key, count=len(entries))

        for entry in entries:
            url = getattr(entry, "link", None)
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)

            title = getattr(entry, "title", "")
            summary = getattr(entry, "summary", "")

            # Filter by relevance if enabled
            if filter_relevant and not is_relevant(title, summary):
                continue

            # Fetch full article text
            try:
                html = fetch_url(url)
                if not html:
                    continue
                full_text = extract_article_text(html, url)
                if not full_text or len(full_text) < 100:
                    full_text = summary  # fallback to RSS summary
            except Exception as e:
                logger.warning("scraper.fetch_failed", url=url, error=str(e))
                full_text = summary

            if not full_text:
                continue

            # Build mention dict
            text_hash = content_hash(full_text)
            lang = detect_language(full_text)
            published = parse_published_date(entry)

            mention = {
                "id": uuid.uuid4(),
                "source_type": "news",
                "source_url": url,
                "source_publication": source_config["name"],
                "title": title,
                "author": getattr(entry, "author", None),
                "published_at": published or datetime.now(timezone.utc),
                "ingested_at": datetime.now(timezone.utc),
                "raw_content": full_text,
                "content_hash": text_hash,
                "language": lang,
                "region": None,
                "metadata_": {
                    "feed_url": feed_url,
                    "rss_summary": summary[:500] if summary else None,
                },
            }
            mentions.append(mention)

    logger.info(
        "scraper.complete",
        publication=publication_key,
        total_mentions=len(mentions),
    )
    return mentions
