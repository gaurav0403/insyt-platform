"""
News ingestion runner: orchestrates search/RSS → dedup → store.

Usage:
    # Search-based (primary — requires INSYT_SERPER_API_KEY)
    python -m backend.ingestion.news.runner --mode search --group kalyan_core
    python -m backend.ingestion.news.runner --mode search --group competitors

    # RSS-based (supplementary, strict filtering)
    python -m backend.ingestion.news.runner --mode rss --publication economic_times

    # Both
    python -m backend.ingestion.news.runner --mode all
"""
import json
import sys
from pathlib import Path
from datetime import datetime, timezone

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import structlog

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

from backend.config import get_settings
from backend.ingestion.news.scraper import scrape_via_search, scrape_rss
from backend.ingestion.news.sources import SEARCH_QUERIES, WORKING_RSS

logger = structlog.get_logger()
settings = get_settings()


def store_mentions(mentions: list[dict]) -> int:
    """Deduplicate and store mentions. Returns count of new inserts."""
    engine = create_engine(settings.database_url_sync)
    inserted = 0
    skipped = 0

    with Session(engine) as session:
        for m in mentions:
            # URL dedup
            if m.get("source_url"):
                existing = session.execute(
                    text("SELECT id FROM mentions WHERE source_url = :url"),
                    {"url": m["source_url"]},
                ).fetchone()
                if existing:
                    skipped += 1
                    continue

            # Content hash dedup
            existing_hash = session.execute(
                text("SELECT id FROM mentions WHERE content_hash = :hash"),
                {"hash": m["content_hash"]},
            ).fetchone()
            if existing_hash:
                skipped += 1
                continue

            session.execute(
                text("""
                    INSERT INTO mentions
                    (id, source_type, source_url, source_publication, title, author,
                     published_at, ingested_at, raw_content, content_hash, language, region, metadata)
                    VALUES
                    (:id, :source_type, :source_url, :source_publication, :title, :author,
                     :published_at, :ingested_at, :raw_content, :content_hash, :language, :region, :metadata)
                """),
                {
                    "id": str(m["id"]),
                    "source_type": m["source_type"],
                    "source_url": m["source_url"],
                    "source_publication": m["source_publication"],
                    "title": m["title"],
                    "author": m["author"],
                    "published_at": m["published_at"],
                    "ingested_at": m["ingested_at"],
                    "raw_content": m["raw_content"],
                    "content_hash": m["content_hash"],
                    "language": m["language"],
                    "region": m["region"],
                    "metadata": json.dumps(m["metadata_"]) if m["metadata_"] else None,
                },
            )
            inserted += 1

        session.commit()

    logger.info("store.complete", inserted=inserted, skipped=skipped)
    return inserted


def run_search_ingestion(group: str = "kalyan_core") -> int:
    """Run search-based ingestion for a query group. Uses Serper if key available, else Google News RSS."""
    api_key = settings.serper_api_key or ""
    logger.info("ingestion.search.start", group=group, has_serper=bool(api_key))
    mentions = scrape_via_search(api_key, group)
    if not mentions:
        print(f"No relevant mentions found for query group '{group}'.")
        return 0

    count = store_mentions(mentions)
    print(f"Done. Inserted {count} new mentions via search ({group}).")
    return count


def run_rss_ingestion(publication: str) -> int:
    """Run RSS ingestion with strict relevance filtering."""
    logger.info("ingestion.rss.start", publication=publication)
    mentions = scrape_rss(publication)
    if not mentions:
        print(f"No relevant mentions from {publication} RSS feeds.")
        return 0

    count = store_mentions(mentions)
    print(f"Done. Inserted {count} relevant mentions from {publication} RSS.")
    return count


def run_all_ingestion() -> dict:
    """Run all ingestion strategies."""
    results = {}

    # Search-based (if API key available)
    if settings.serper_api_key:
        for group in SEARCH_QUERIES:
            results[f"search_{group}"] = run_search_ingestion(group)
    else:
        print("Skipping search ingestion (no INSYT_SERPER_API_KEY)")

    # RSS-based with filtering
    for pub in WORKING_RSS:
        results[f"rss_{pub}"] = run_rss_ingestion(pub)

    return results


# Keep backward compatibility for the /ingest endpoint
def run_news_ingestion(publication: str, filter_relevant: bool = True) -> int:
    """Backward-compatible entry point. Now always filters."""
    return run_rss_ingestion(publication)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run news ingestion")
    parser.add_argument("--mode", choices=["search", "rss", "all"], default="all")
    parser.add_argument("--group", default="kalyan_core", help="Search query group")
    parser.add_argument("--publication", default="economic_times", help="RSS publication key")
    args = parser.parse_args()

    if args.mode == "search":
        run_search_ingestion(args.group)
    elif args.mode == "rss":
        run_rss_ingestion(args.publication)
    else:
        results = run_all_ingestion()
        print(f"\nTotal results: {json.dumps(results, indent=2)}")
