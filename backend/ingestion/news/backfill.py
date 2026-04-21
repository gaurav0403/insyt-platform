"""
Historical backfill: pull news for date ranges using SearchAPI.io date operators.

Usage:
    python -m backend.ingestion.news.backfill --start 2025-01-01 --end 2026-04-21
    python -m backend.ingestion.news.backfill --start 2025-01-01 --end 2025-02-01  # case study window
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

import structlog
from backend.config import get_settings
from backend.ingestion.news.scraper import search_searchapi, score_relevance, content_hash, detect_language, _parse_date, identify_publication
from backend.ingestion.news.runner import store_mentions
import uuid
from datetime import timezone

logger = structlog.get_logger()
settings = get_settings()

# Queries to run for each time window
BACKFILL_QUERIES = [
    '"Kalyan Jewellers"',
    '"KALYANKJIL"',
    '"Kalyan Jewellers" stock',
    '"Kalyan Jewellers" results',
    '"Candere" jewellery',
    '"Tanishq" jewellery india',
    '"Malabar Gold" india',
    '"Joyalukkas"',
    'Kalyan Jewellers Kalyanaraman',
    '"jewellery industry" india gold',
]


def backfill_window(start_date: str, end_date: str, api_key: str) -> int:
    """
    Pull news for a specific date window across all backfill queries.
    start_date, end_date in YYYY-MM-DD format.
    """
    total_mentions = []
    seen_urls = set()

    for query in BACKFILL_QUERIES:
        # Add date operators to query
        dated_query = f'{query} after:{start_date} before:{end_date}'
        results = search_searchapi(dated_query, api_key, num_results=10)
        logger.info("backfill.query", query=query[:40], window=f"{start_date}/{end_date}", results=len(results))

        for item in results:
            url = item.get("link", "")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)

            title = item.get("title", "")
            snippet = item.get("snippet", "")
            source_name = item.get("source", "")
            date_str = item.get("date", "")

            full_text = snippet if snippet else title
            if not full_text or len(full_text) < 20:
                continue

            tier, score = score_relevance(title, full_text)
            if tier in ("irrelevant", "noise"):
                continue

            publication = source_name or identify_publication(url) or "Unknown"

            mention = {
                "id": uuid.uuid4(),
                "source_type": "news",
                "source_url": url,
                "source_publication": publication,
                "title": title,
                "author": None,
                "published_at": _parse_date(date_str),
                "ingested_at": datetime.now(timezone.utc),
                "raw_content": full_text,
                "content_hash": content_hash(full_text),
                "language": detect_language(full_text),
                "region": None,
                "metadata_": {
                    "query": query,
                    "query_group": "backfill",
                    "relevance_tier": tier,
                    "relevance_score": score,
                    "window": f"{start_date}/{end_date}",
                },
            }
            total_mentions.append(mention)

    if total_mentions:
        inserted = store_mentions(total_mentions)
        logger.info("backfill.window_done", window=f"{start_date}/{end_date}", found=len(total_mentions), inserted=inserted)
        return inserted
    return 0


def run_backfill(start: str, end: str):
    """Run backfill in monthly windows from start to end."""
    api_key = settings.searchapi_key
    if not api_key:
        print("ERROR: INSYT_SEARCHAPI_KEY not set.")
        return

    start_dt = datetime.strptime(start, "%Y-%m-%d")
    end_dt = datetime.strptime(end, "%Y-%m-%d")

    total_inserted = 0
    current = start_dt

    while current < end_dt:
        # Use 2-week windows for better coverage
        window_end = min(current + timedelta(days=14), end_dt)
        window_start_str = current.strftime("%Y-%m-%d")
        window_end_str = window_end.strftime("%Y-%m-%d")

        print(f"Backfilling {window_start_str} → {window_end_str}...")
        inserted = backfill_window(window_start_str, window_end_str, api_key)
        total_inserted += inserted
        print(f"  → {inserted} new mentions")

        current = window_end

    print(f"\nBackfill complete: {total_inserted} total new mentions from {start} to {end}")
    return total_inserted


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", default="2025-01-01")
    parser.add_argument("--end", default="2026-04-21")
    args = parser.parse_args()
    run_backfill(args.start, args.end)
