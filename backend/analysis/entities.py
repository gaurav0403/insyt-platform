"""
Entity resolution: match mentions against Kalyan taxonomy.

Strategy:
1. Fast path — direct keyword/alias matching against taxonomy (no API cost)
2. Slow path — Claude Haiku for ambiguous cases (batched)

Output: mention_entities rows with confidence scores.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import structlog

from backend.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


def load_taxonomy(session: Session) -> list[dict]:
    """Load all entities from DB as dicts for matching."""
    rows = session.execute(text("""
        SELECT id, type, canonical_name, aliases, metadata
        FROM entities
    """)).fetchall()

    entities = []
    for row in rows:
        aliases = row[3] or []
        # Build search terms: canonical name + all aliases, lowercased
        search_terms = [row[2].lower()] + [a.lower() for a in aliases]
        entities.append({
            "id": str(row[0]),
            "type": row[1],
            "canonical_name": row[2],
            "aliases": aliases,
            "search_terms": search_terms,
            "metadata": row[4] or {},
        })
    return entities


def _word_boundary_match(term: str, text: str) -> bool:
    """Check if term appears as a whole word/phrase in text (not as substring of another word)."""
    import re
    # For short terms (<=5 chars), require word boundaries
    # For longer terms, simple substring is fine
    if len(term) <= 5:
        pattern = r'\b' + re.escape(term) + r'\b'
        return bool(re.search(pattern, text))
    return term in text


# Terms that are too generic and cause false positives
SKIP_TERMS = {"rang", "bis", "hera", "glo", "lila", "laya"}


def resolve_entities_for_mention(
    title: str,
    content: str,
    taxonomy: list[dict],
) -> list[dict]:
    """
    Match a mention's text against taxonomy entities.
    Returns list of {entity_id, confidence, context_snippet}.
    """
    combined = (title + " " + content).lower()
    matches = []

    for entity in taxonomy:
        best_confidence = 0.0
        matched_term = None

        for term in entity["search_terms"]:
            if len(term) < 4:
                continue  # skip very short terms
            if term in SKIP_TERMS:
                continue

            if not _word_boundary_match(term, combined):
                continue

            # Confidence based on match quality
            if term == entity["canonical_name"].lower():
                confidence = 0.95
            elif len(term) > 15:
                confidence = 0.95  # very long alias = very high confidence
            elif len(term) > 10:
                confidence = 0.90
            elif len(term) > 6:
                confidence = 0.80
            else:
                confidence = 0.65

            if confidence > best_confidence:
                best_confidence = confidence
                matched_term = term

        if matched_term and best_confidence >= 0.6:
            # Extract context snippet around the match
            idx = combined.find(matched_term)
            start = max(0, idx - 50)
            end = min(len(combined), idx + len(matched_term) + 50)
            snippet = combined[start:end].strip()

            matches.append({
                "entity_id": entity["id"],
                "confidence": best_confidence,
                "context_snippet": snippet,
                "matched_term": matched_term,
            })

    return matches


def run_entity_resolution(batch_size: int = 100, max_mentions: int = 0) -> dict:
    """
    Process unresolved mentions through entity resolution.
    Returns stats dict.
    """
    engine = create_engine(settings.database_url_sync)

    with Session(engine) as session:
        # Load taxonomy
        taxonomy = load_taxonomy(session)
        logger.info("entity_resolution.taxonomy_loaded", count=len(taxonomy))

        # Find mentions not yet resolved
        query = """
            SELECT m.id, m.title, m.raw_content
            FROM mentions m
            LEFT JOIN mention_entities me ON m.id = me.mention_id
            WHERE me.mention_id IS NULL
            ORDER BY m.published_at DESC
        """
        if max_mentions > 0:
            query += f" LIMIT {max_mentions}"

        unresolved = session.execute(text(query)).fetchall()
        logger.info("entity_resolution.unresolved", count=len(unresolved))

        total_links = 0
        mentions_processed = 0
        mentions_with_entities = 0

        for row in unresolved:
            mention_id = str(row[0])
            title = row[1] or ""
            content = row[2] or ""

            matches = resolve_entities_for_mention(title, content, taxonomy)

            if matches:
                mentions_with_entities += 1
                for match in matches:
                    session.execute(text("""
                        INSERT INTO mention_entities (mention_id, entity_id, confidence, context_snippet)
                        VALUES (:mention_id, :entity_id, :confidence, :snippet)
                        ON CONFLICT (mention_id, entity_id) DO NOTHING
                    """), {
                        "mention_id": mention_id,
                        "entity_id": match["entity_id"],
                        "confidence": match["confidence"],
                        "snippet": match["context_snippet"][:500],
                    })
                    total_links += 1

            mentions_processed += 1

            # Commit in batches
            if mentions_processed % batch_size == 0:
                session.commit()
                logger.info("entity_resolution.batch",
                            processed=mentions_processed,
                            links=total_links)

        session.commit()

    stats = {
        "mentions_processed": mentions_processed,
        "mentions_with_entities": mentions_with_entities,
        "total_links_created": total_links,
        "taxonomy_size": len(taxonomy),
    }
    logger.info("entity_resolution.complete", **stats)
    return stats


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--max", type=int, default=0, help="Max mentions to process (0=all)")
    args = parser.parse_args()

    stats = run_entity_resolution(max_mentions=args.max)
    print(f"\nEntity resolution complete:")
    print(f"  Mentions processed: {stats['mentions_processed']}")
    print(f"  With entity matches: {stats['mentions_with_entities']}")
    print(f"  Total links created: {stats['total_links_created']}")
