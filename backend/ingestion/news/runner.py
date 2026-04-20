"""
News ingestion runner: orchestrates scraping → dedup → store for a publication.
Can be called directly or via Celery task.

Usage:
    python -m backend.ingestion.news.runner --publication moneycontrol
    python -m backend.ingestion.news.runner --publication moneycontrol --no-filter
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
from backend.ingestion.news.scraper import scrape_publication

logger = structlog.get_logger()
settings = get_settings()


def run_news_ingestion(publication: str, filter_relevant: bool = True) -> int:
    """
    Run end-to-end ingestion for a publication.
    Returns count of new mentions inserted.
    """
    engine = create_engine(settings.database_url_sync)

    # Step 1: Scrape
    logger.info("ingestion.start", publication=publication)
    mentions = scrape_publication(publication, filter_relevant=filter_relevant)

    if not mentions:
        logger.info("ingestion.no_mentions", publication=publication)
        return 0

    # Step 2: Deduplicate against existing DB records
    inserted = 0
    skipped = 0

    with Session(engine) as session:
        for m in mentions:
            # Check URL dedup
            existing = session.execute(
                text("SELECT id FROM mentions WHERE source_url = :url"),
                {"url": m["source_url"]},
            ).fetchone()

            if existing:
                skipped += 1
                continue

            # Check content hash dedup
            existing_hash = session.execute(
                text("SELECT id FROM mentions WHERE content_hash = :hash"),
                {"hash": m["content_hash"]},
            ).fetchone()

            if existing_hash:
                skipped += 1
                continue

            # Step 3: Insert
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

    logger.info(
        "ingestion.complete",
        publication=publication,
        inserted=inserted,
        skipped=skipped,
    )
    return inserted


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run news ingestion for a publication")
    parser.add_argument("--publication", default="moneycontrol", help="Publication key")
    parser.add_argument("--no-filter", action="store_true", help="Skip relevance filtering (ingest all)")
    args = parser.parse_args()

    count = run_news_ingestion(args.publication, filter_relevant=not args.no_filter)
    print(f"\nDone. Inserted {count} new mentions from {args.publication}.")
