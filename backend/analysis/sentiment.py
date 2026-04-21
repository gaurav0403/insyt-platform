"""
Sentiment analysis: score mentions from -1 (very negative) to +1 (very positive).

Strategy:
1. Fast path — keyword-based for clear signals (no API cost)
2. Standard path — Claude Haiku with brand-context prompting

Output: mention_analysis rows with sentiment_score and confidence.
"""
import os
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import structlog

from backend.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

# Fast-path sentiment signals
STRONG_POSITIVE = [
    "shares jump", "stock rises", "surge", "rally", "strong growth",
    "profit doubles", "revenue jumps", "expansion", "new showroom",
    "award", "record sales", "outperform", "buy call", "upgrade",
    "strong q", "robust growth", "bullish", "target raised",
]

STRONG_NEGATIVE = [
    "shares fall", "stock tumble", "crash", "plunge", "decline",
    "loss", "fraud", "raid", "bribery", "allegation", "controversy",
    "downgrade", "sell call", "52-week low", "slump", "warning",
    "concern", "risk", "crisis", "violation", "complaint",
]

MODERATE_POSITIVE = [
    "growth", "positive", "opportunity", "expansion", "launch",
    "partnership", "collection", "festive", "celebration",
    "demand", "innovation",
]

MODERATE_NEGATIVE = [
    "pressure", "challenge", "volatility", "uncertainty", "drop",
    "muted", "tepid", "weak", "concern", "slowdown",
]


def fast_sentiment(title: str, content: str) -> Optional[tuple[float, float]]:
    """
    Quick keyword-based sentiment for clear-signal cases.
    Returns (score, confidence) or None if ambiguous.
    """
    combined = (title + " " + content).lower()

    strong_pos_hits = sum(1 for kw in STRONG_POSITIVE if kw in combined)
    strong_neg_hits = sum(1 for kw in STRONG_NEGATIVE if kw in combined)
    mod_pos_hits = sum(1 for kw in MODERATE_POSITIVE if kw in combined)
    mod_neg_hits = sum(1 for kw in MODERATE_NEGATIVE if kw in combined)

    pos_signal = strong_pos_hits * 2 + mod_pos_hits
    neg_signal = strong_neg_hits * 2 + mod_neg_hits

    total_signal = pos_signal + neg_signal
    if total_signal == 0:
        return (0.0, 0.3)  # neutral with low confidence

    # Clear positive
    if pos_signal > 0 and neg_signal == 0:
        score = min(0.3 + (pos_signal * 0.15), 0.9)
        return (score, 0.7 + min(strong_pos_hits * 0.1, 0.2))

    # Clear negative
    if neg_signal > 0 and pos_signal == 0:
        score = max(-0.3 - (neg_signal * 0.15), -0.9)
        return (score, 0.7 + min(strong_neg_hits * 0.1, 0.2))

    # Mixed signals — compute net
    net = pos_signal - neg_signal
    if abs(net) <= 1:
        return (0.0, 0.4)  # ambiguous, low confidence

    if net > 0:
        score = min(0.1 + (net * 0.1), 0.6)
    else:
        score = max(-0.1 + (net * 0.1), -0.6)

    return (score, 0.5)


def haiku_sentiment(title: str, content: str, entity_context: str = "") -> tuple[float, float]:
    """
    Use Claude Haiku for nuanced sentiment analysis.
    Returns (score, confidence).
    """
    api_key = settings.anthropic_api_key
    if not api_key:
        # Fallback to fast path if no API key
        result = fast_sentiment(title, content)
        return result if result else (0.0, 0.3)

    import anthropic
    client = anthropic.Anthropic(api_key=api_key)

    prompt = f"""Analyze the sentiment of this news article about the Indian jewellery industry.
Score from -1.0 (very negative for the mentioned brand/company) to +1.0 (very positive).
Consider: stock impact, brand reputation, business growth, regulatory risk, customer perception.

Title: {title}
Content: {content[:800]}
{f"Entity context: {entity_context}" if entity_context else ""}

Respond with ONLY two numbers separated by a comma: sentiment_score,confidence
Example: 0.6,0.85 or -0.4,0.70"""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=20,
            messages=[{"role": "user", "content": prompt}],
        )
        text_response = response.content[0].text.strip()
        parts = text_response.split(",")
        score = max(-1.0, min(1.0, float(parts[0].strip())))
        confidence = max(0.0, min(1.0, float(parts[1].strip())))
        return (score, confidence)
    except Exception as e:
        logger.warning("haiku_sentiment.failed", error=str(e))
        result = fast_sentiment(title, content)
        return result if result else (0.0, 0.3)


def extract_themes(title: str, content: str) -> list[str]:
    """Extract relevant themes from mention content."""
    combined = (title + " " + content).lower()

    theme_keywords = {
        "stock_movement": ["share price", "stock", "nse", "bse", "market cap", "52-week"],
        "earnings": ["quarter", "results", "revenue", "profit", "earnings", "q1", "q2", "q3", "q4", "fy2"],
        "expansion": ["new store", "showroom", "expansion", "launch", "franchise", "outlet"],
        "festive_sales": ["akshaya tritiya", "dhanteras", "diwali", "onam", "pongal", "festive"],
        "gold_market": ["gold price", "gold demand", "gold rate", "bullion", "import"],
        "regulatory": ["sebi", "bis", "hallmark", "compliance", "regulation", "filing"],
        "competition": ["tanishq", "malabar", "joyalukkas", "senco", "titan", "competitor"],
        "brand_campaign": ["campaign", "ambassador", "advertisement", "brand", "marketing"],
        "crisis": ["controversy", "allegation", "fraud", "raid", "crash", "crisis"],
        "digital": ["online", "candere", "e-commerce", "digital", "app"],
        "investor": ["analyst", "buy", "hold", "sell", "target price", "rating", "upgrade"],
    }

    themes = []
    for theme, keywords in theme_keywords.items():
        if any(kw in combined for kw in keywords):
            themes.append(theme)

    return themes[:5]  # max 5 themes per mention


def run_sentiment_analysis(batch_size: int = 50, use_haiku: bool = False, max_mentions: int = 0) -> dict:
    """
    Process mentions through sentiment analysis.
    Populates mention_analysis table.
    """
    engine = create_engine(settings.database_url_sync)

    with Session(engine) as session:
        # Find mentions not yet analyzed
        query = """
            SELECT m.id, m.title, m.raw_content
            FROM mentions m
            LEFT JOIN mention_analysis ma ON m.id = ma.mention_id
            WHERE ma.mention_id IS NULL
            ORDER BY m.published_at DESC
        """
        if max_mentions > 0:
            query += f" LIMIT {max_mentions}"

        unanalyzed = session.execute(text(query)).fetchall()
        logger.info("sentiment.unanalyzed", count=len(unanalyzed))

        processed = 0
        positive = 0
        negative = 0
        neutral = 0

        for row in unanalyzed:
            mention_id = str(row[0])
            title = row[1] or ""
            content = row[2] or ""

            # Get sentiment
            if use_haiku:
                score, confidence = haiku_sentiment(title, content)
            else:
                result = fast_sentiment(title, content)
                score, confidence = result if result else (0.0, 0.3)

            # Extract themes
            themes = extract_themes(title, content)

            # Categorize
            if score > 0.15:
                positive += 1
            elif score < -0.15:
                negative += 1
            else:
                neutral += 1

            # Insert analysis
            session.execute(text("""
                INSERT INTO mention_analysis
                (mention_id, sentiment_score, sentiment_confidence, relevance_score, themes, analyzed_at)
                VALUES (:mention_id, :sentiment, :confidence, :relevance, :themes, :analyzed_at)
                ON CONFLICT (mention_id) DO UPDATE SET
                    sentiment_score = :sentiment,
                    sentiment_confidence = :confidence,
                    themes = :themes,
                    analyzed_at = :analyzed_at
            """), {
                "mention_id": mention_id,
                "sentiment": score,
                "confidence": confidence,
                "relevance": 0.8,  # all search-sourced mentions are pre-filtered for relevance
                "themes": themes,
                "analyzed_at": datetime.now(timezone.utc),
            })

            processed += 1
            if processed % batch_size == 0:
                session.commit()
                logger.info("sentiment.batch", processed=processed)

        session.commit()

    stats = {
        "processed": processed,
        "positive": positive,
        "negative": negative,
        "neutral": neutral,
    }
    logger.info("sentiment.complete", **stats)
    return stats


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--haiku", action="store_true", help="Use Claude Haiku (costs money)")
    parser.add_argument("--max", type=int, default=0, help="Max mentions (0=all)")
    args = parser.parse_args()

    stats = run_sentiment_analysis(use_haiku=args.haiku, max_mentions=args.max)
    print(f"\nSentiment analysis complete:")
    print(f"  Processed: {stats['processed']}")
    print(f"  Positive: {stats['positive']}")
    print(f"  Negative: {stats['negative']}")
    print(f"  Neutral: {stats['neutral']}")
