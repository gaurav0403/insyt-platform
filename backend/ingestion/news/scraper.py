"""
News scraper: two ingestion strategies
1. Search-based: Google News via Serper API — high signal, targeted queries
2. RSS-based: general feeds with strict relevance filtering — supplementary

All articles get full-text extraction via trafilatura, language detection,
content hashing for dedup.
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

from backend.ingestion.news.sources import (
    PUBLICATIONS, WORKING_RSS, SEARCH_QUERIES,
    score_relevance,
)

logger = structlog.get_logger()

HTTP_TIMEOUT = 30.0
REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def detect_language(text: str) -> str:
    try:
        return detect(text[:1000])
    except LangDetectException:
        return "en"


def identify_publication(url: str) -> str | None:
    """Match a URL to a known publication."""
    for key, pub in PUBLICATIONS.items():
        if pub["domain"] in url:
            return pub["name"]
    return None


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=15))
def fetch_url(url: str) -> Optional[str]:
    with httpx.Client(timeout=HTTP_TIMEOUT, headers=REQUEST_HEADERS, follow_redirects=True) as client:
        resp = client.get(url)
        resp.raise_for_status()
        return resp.text


def extract_article_text(html: str, url: str) -> Optional[str]:
    return trafilatura.extract(html, url=url, include_comments=False, include_tables=False)


# ============================================================
# SEARCH INGESTION — Google News RSS (free) + Serper API (paid)
# ============================================================

def search_google_news_rss(query: str) -> list[dict]:
    """
    Search Google News via its public RSS feed. Free, no API key needed.
    Returns list of dicts with title, link, snippet, source, date.
    """
    import urllib.parse
    encoded = urllib.parse.quote_plus(query)
    rss_url = f"https://news.google.com/rss/search?q={encoded}&hl=en-IN&gl=IN&ceid=IN:en"

    try:
        content = fetch_url(rss_url)
        if not content:
            return []
        feed = feedparser.parse(content)
        results = []
        for entry in feed.entries[:15]:
            results.append({
                "title": getattr(entry, "title", ""),
                "link": getattr(entry, "link", ""),
                "snippet": getattr(entry, "summary", ""),
                "source": getattr(entry, "source", {}).get("title", "") if hasattr(entry, "source") else "",
                "date": getattr(entry, "published", ""),
            })
        return results
    except Exception as e:
        logger.warning("google_news_rss.failed", query=query, error=str(e))
        return []


def search_serper(query: str, api_key: str, num_results: int = 10) -> list[dict]:
    """Search Google News via Serper API (paid)."""
    try:
        resp = httpx.post(
            "https://google.serper.dev/news",
            json={"q": query, "num": num_results, "gl": "in", "hl": "en"},
            headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("news", [])
    except Exception as e:
        logger.warning("serper.search_failed", query=query, error=str(e))
        return []


def search_google_news(query: str, api_key: str = "", num_results: int = 10) -> list[dict]:
    """
    Search for news. Uses Serper if API key available, falls back to
    Google News RSS (free, no key needed).
    """
    if api_key:
        results = search_serper(query, api_key, num_results)
        if results:
            return results
    # Fallback to free Google News RSS
    return search_google_news_rss(query)


def scrape_via_search(api_key: str, query_group: str = "kalyan_core") -> list[dict]:
    """
    Use Serper to find relevant news, then extract full text.
    Returns normalized mention dicts.
    """
    queries = SEARCH_QUERIES.get(query_group, [])
    if not queries:
        logger.error("scraper.unknown_query_group", group=query_group)
        return []

    mentions = []
    seen_urls = set()

    for query in queries:
        results = search_google_news(query, api_key)
        logger.info("scraper.search_results", query=query, count=len(results))

        for item in results:
            url = item.get("link", "")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)

            title = item.get("title", "")
            snippet = item.get("snippet", "")
            source_name = item.get("source", "")
            date_str = item.get("date", "")

            # Extract full article
            try:
                html = fetch_url(url)
                if not html:
                    continue
                full_text = extract_article_text(html, url)
                if not full_text or len(full_text) < 100:
                    full_text = snippet
            except Exception as e:
                logger.warning("scraper.fetch_failed", url=url[:80], error=str(e))
                full_text = snippet

            if not full_text:
                continue

            # Score relevance
            tier, score = score_relevance(title, full_text)
            if tier == "irrelevant":
                logger.debug("scraper.skipped_irrelevant", title=title[:60])
                continue
            if tier == "noise":
                continue

            publication = identify_publication(url) or source_name

            mention = {
                "id": uuid.uuid4(),
                "source_type": "news",
                "source_url": url,
                "source_publication": publication,
                "title": title,
                "author": None,
                "published_at": _parse_serper_date(date_str),
                "ingested_at": datetime.now(timezone.utc),
                "raw_content": full_text,
                "content_hash": content_hash(full_text),
                "language": detect_language(full_text),
                "region": None,
                "metadata_": {
                    "query": query,
                    "query_group": query_group,
                    "relevance_tier": tier,
                    "relevance_score": score,
                    "serper_snippet": snippet[:300],
                },
            }
            mentions.append(mention)

    logger.info("scraper.search_complete", group=query_group, total=len(mentions))
    return mentions


def _parse_serper_date(date_str: str) -> datetime:
    """Parse Serper date strings like '2 hours ago', 'Apr 20, 2026'."""
    from dateutil import parser as dateparser
    try:
        return dateparser.parse(date_str).replace(tzinfo=timezone.utc)
    except Exception:
        return datetime.now(timezone.utc)


# ============================================================
# RSS-BASED INGESTION (supplementary, with strict filtering)
# ============================================================

def parse_rss_feed(feed_url: str) -> list:
    try:
        feed_content = fetch_url(feed_url)
        if not feed_content:
            return []
        return feedparser.parse(feed_content).entries
    except Exception as e:
        logger.warning("rss.parse_failed", url=feed_url, error=str(e))
        return []


def parse_published_date(entry) -> Optional[datetime]:
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        try:
            return datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
        except (TypeError, ValueError):
            pass
    return None


def scrape_rss(publication_key: str) -> list[dict]:
    """
    Scrape RSS feeds for a publication WITH strict relevance filtering.
    Only returns mentions that score 'strong' or 'sector'.
    """
    feeds = WORKING_RSS.get(publication_key, [])
    pub_info = PUBLICATIONS.get(publication_key, {})
    pub_name = pub_info.get("name", publication_key)

    if not feeds:
        logger.warning("rss.no_feeds", publication=publication_key)
        return []

    mentions = []
    seen_urls = set()

    for feed_url in feeds:
        logger.info("rss.fetching", publication=publication_key, feed=feed_url)
        entries = parse_rss_feed(feed_url)

        for entry in entries:
            url = getattr(entry, "link", None)
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)

            title = getattr(entry, "title", "")
            summary = getattr(entry, "summary", "")

            # Quick pre-filter on title+summary before fetching full article
            pre_tier, _ = score_relevance(title, summary)
            if pre_tier in ("irrelevant", "noise"):
                continue

            # Fetch full text
            try:
                html = fetch_url(url)
                full_text = extract_article_text(html, url) if html else summary
                if not full_text or len(full_text) < 100:
                    full_text = summary
            except Exception:
                full_text = summary

            if not full_text:
                continue

            # Final relevance check on full text
            tier, score = score_relevance(title, full_text)
            if tier in ("irrelevant", "noise"):
                continue

            mention = {
                "id": uuid.uuid4(),
                "source_type": "news",
                "source_url": url,
                "source_publication": pub_name,
                "title": title,
                "author": getattr(entry, "author", None),
                "published_at": parse_published_date(entry) or datetime.now(timezone.utc),
                "ingested_at": datetime.now(timezone.utc),
                "raw_content": full_text,
                "content_hash": content_hash(full_text),
                "language": detect_language(full_text),
                "region": None,
                "metadata_": {
                    "feed_url": feed_url,
                    "relevance_tier": tier,
                    "relevance_score": score,
                },
            }
            mentions.append(mention)

    logger.info("rss.complete", publication=publication_key, total=len(mentions))
    return mentions
