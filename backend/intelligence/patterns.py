"""
Pattern Intelligence Layer.

The third pass of analysis. Individual mentions are analyzed by Claude (pass 1).
Narratives are formed from top signals (pass 2). This layer (pass 3) looks ACROSS
all analyzed data to find patterns that no individual signal reveals:

1. Complaint clustering -- same issue across stores/platforms = systemic
2. Store health scoring -- aggregate signal quality per location
3. Trend detection -- things getting worse/better over time
4. Cross-platform correlation -- same story appearing in news + social + reviews
5. Redressal gaps -- complaints without responses
"""
import json
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, text
import structlog
import anthropic

from backend.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


def detect_patterns() -> dict:
    """Run all pattern detectors and return structured findings."""
    engine = create_engine(settings.database_url_sync)
    findings = {
        "complaint_patterns": [],
        "store_health": [],
        "trends": [],
        "cross_platform": [],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    with engine.connect() as conn:
        # ── 1. COMPLAINT CLUSTERING ──
        # Group complaints by keyword pattern across all platforms
        complaint_keywords = {
            "fraud_allegations": ["fraud", "cheat", "fake", "duplicate"],
            "scheme_misselling": ["scheme", "making charges", "hidden charges", "saubhagya", "dhanvarsha"],
            "refund_failures": ["refund", "payment", "upi", "not returned"],
            "service_failures": ["rude", "worst", "pathetic", "horrible", "untrained"],
            "hallmarking_concerns": ["hallmark", "purity", "bis", "huid"],
            "insurance_disputes": ["insurance", "policy", "coverage"],
        }

        for pattern_name, keywords in complaint_keywords.items():
            like_clauses = " OR ".join([f"m.raw_content ILIKE '%{kw}%'" for kw in keywords])
            # Only count Kalyan-specific complaints (entity-linked or review source)
            rows = conn.execute(text(f"""
                SELECT m.source_type, m.region, COUNT(*),
                       ROUND(AVG(ma.sentiment_score)::numeric, 2) as avg_sent,
                       array_agg(DISTINCT m.source_type) as platforms,
                       MAX(m.published_at) as latest
                FROM mentions m
                JOIN mention_analysis ma ON m.id = ma.mention_id
                WHERE ma.sentiment_confidence >= 0.9
                  AND ma.sentiment_score < -0.1
                  AND ({like_clauses})
                  AND (
                    m.raw_content ILIKE '%kalyan%'
                    OR m.source_publication ILIKE '%kalyan%'
                    OR (m.source_type = 'review' AND m.metadata->>'brand' = 'Kalyan Jewellers')
                  )
                GROUP BY m.source_type, m.region
                HAVING COUNT(*) >= 1
            """)).fetchall()

            if rows:
                total = sum(r[2] for r in rows)
                platforms = set()
                regions = {}
                for r in rows:
                    platforms.add(r[0])
                    region = r[1] or "Unknown"
                    if region not in regions:
                        regions[region] = 0
                    regions[region] += r[2]

                if total >= 2:
                    findings["complaint_patterns"].append({
                        "pattern": pattern_name,
                        "display_name": pattern_name.replace("_", " ").title(),
                        "total_mentions": total,
                        "platforms": list(platforms),
                        "is_cross_platform": len(platforms) >= 2,
                        "regions": regions,
                        "is_systemic": len(regions) >= 2 or total >= 5,
                        "severity": "critical" if total >= 10 else "high" if total >= 5 else "medium",
                    })

        # ── 2. STORE HEALTH SCORING ──
        store_rows = conn.execute(text("""
            SELECT
                m.metadata->>'store' as store,
                m.metadata->>'city' as city,
                m.metadata->>'state' as state,
                COUNT(*) as total_reviews,
                ROUND(AVG((m.metadata->>'rating')::float)::numeric, 2) as avg_rating,
                ROUND(AVG(ma.sentiment_score)::numeric, 2) as avg_sentiment,
                COUNT(*) FILTER (WHERE (m.metadata->>'rating')::int <= 2) as critical_reviews,
                COUNT(*) FILTER (WHERE (m.metadata->>'rating')::int >= 4) as positive_reviews,
                COUNT(*) FILTER (WHERE ma.relevance_score >= 0.9) as actionable
            FROM mentions m
            LEFT JOIN mention_analysis ma ON m.id = ma.mention_id
            WHERE m.source_type = 'review'
              AND m.metadata->>'store' IS NOT NULL
            GROUP BY store, city, state
            ORDER BY avg_rating ASC NULLS LAST
        """)).fetchall()

        for r in store_rows:
            total = r[3]
            critical = r[6]
            positive = r[7]
            rating = float(r[4]) if r[4] else 0

            # Health score: 0-100
            if total == 0:
                health = 50
            else:
                health = int((positive / total) * 70 + (rating / 5) * 30)

            status = "critical" if rating < 3.0 or critical >= 3 else "warning" if rating < 4.0 else "healthy"

            findings["store_health"].append({
                "store": r[0],
                "city": r[1],
                "state": r[2],
                "total_reviews": total,
                "avg_rating": float(r[4]) if r[4] else None,
                "avg_sentiment": float(r[5]) if r[5] else None,
                "critical_reviews": critical,
                "positive_reviews": positive,
                "actionable": r[8],
                "health_score": health,
                "status": status,
            })

        # ── 3. TREND DETECTION ──
        # Compare last 14 days vs prior 14 days
        for theme in ["consumer_experience", "crisis_signal", "competitive_threat", "stock_pressure"]:
            recent = conn.execute(text("""
                SELECT COUNT(*), ROUND(AVG(ma.sentiment_score)::numeric, 3)
                FROM mentions m
                JOIN mention_analysis ma ON m.id = ma.mention_id
                WHERE ma.sentiment_confidence >= 0.9
                  AND :theme = ANY(ma.themes)
                  AND m.published_at >= NOW() - INTERVAL '14 days'
            """), {"theme": theme}).fetchone()

            prior = conn.execute(text("""
                SELECT COUNT(*), ROUND(AVG(ma.sentiment_score)::numeric, 3)
                FROM mentions m
                JOIN mention_analysis ma ON m.id = ma.mention_id
                WHERE ma.sentiment_confidence >= 0.9
                  AND :theme = ANY(ma.themes)
                  AND m.published_at >= NOW() - INTERVAL '28 days'
                  AND m.published_at < NOW() - INTERVAL '14 days'
            """), {"theme": theme}).fetchone()

            recent_count = recent[0] or 0
            prior_count = prior[0] or 0
            recent_sent = float(recent[1]) if recent[1] else 0
            prior_sent = float(prior[1]) if prior[1] else 0

            if prior_count > 0:
                volume_change = ((recent_count - prior_count) / prior_count) * 100
                sent_change = recent_sent - prior_sent
            else:
                volume_change = 100 if recent_count > 0 else 0
                sent_change = 0

            if abs(volume_change) >= 20 or abs(sent_change) >= 0.15:
                direction = "increasing" if volume_change > 0 else "decreasing"
                findings["trends"].append({
                    "theme": theme,
                    "display_name": theme.replace("_", " ").title(),
                    "recent_count": recent_count,
                    "prior_count": prior_count,
                    "volume_change_pct": round(volume_change, 1),
                    "recent_sentiment": recent_sent,
                    "prior_sentiment": prior_sent,
                    "sentiment_change": round(sent_change, 3),
                    "direction": direction,
                })

        # ── 4. CROSS-PLATFORM CORRELATION ──
        # Themes appearing on 3+ platforms = strong signal
        cross = conn.execute(text("""
            SELECT unnest(ma.themes) as theme,
                   COUNT(DISTINCT m.source_type) as platform_count,
                   array_agg(DISTINCT m.source_type) as platforms,
                   COUNT(*) as total,
                   ROUND(AVG(ma.sentiment_score)::numeric, 2) as avg_sent
            FROM mentions m
            JOIN mention_analysis ma ON m.id = ma.mention_id
            WHERE ma.sentiment_confidence >= 0.9
              AND ma.relevance_score >= 0.5
            GROUP BY theme
            HAVING COUNT(DISTINCT m.source_type) >= 3
            ORDER BY COUNT(*) DESC
        """)).fetchall()

        for r in cross:
            findings["cross_platform"].append({
                "theme": r[0],
                "display_name": r[0].replace("_", " ").title(),
                "platform_count": r[1],
                "platforms": r[2],
                "total_signals": r[3],
                "avg_sentiment": float(r[4]) if r[4] else None,
            })

    # Sort
    findings["complaint_patterns"].sort(key=lambda x: x["total_mentions"], reverse=True)
    findings["store_health"].sort(key=lambda x: x["health_score"])

    return findings


def generate_pattern_brief(findings: dict) -> str:
    """Use Claude to write an editorial summary of the patterns found."""
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    prompt = f"""You are the intelligence editor at Insyt, a context-intelligence platform. Write a 3-4 paragraph editorial summary for a CMO based on these cross-platform pattern findings.

Findings:
{json.dumps(findings, indent=2, default=str)}

Voice and tone rules (strict):
- Write like the editorial pages of the Financial Times or Mint — measured, factual, precise
- Present patterns as observations, not alarms. Let the reader draw conclusions
- Never use: "crisis," "emergency," "devastating," "demands immediate," "critical failure," "cascading," "alarming"
- Never use bold, exclamation marks, or urgency language
- Use phrases like: "the data suggests," "a pattern worth noting," "bears watching," "merits attention"
- Name specific stores and cities with numbers, but without drama
- Compare weak-performing locations against strong ones to show the range, not just the negatives
- If the data shows a genuine concern, state it plainly — the facts are enough
- End with an observation about what the pattern implies, not a command to act
- Max 200 words
- No title or heading — start directly with the first sentence"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip()
    except Exception as e:
        logger.error("patterns.brief_failed", error=str(e))
        return ""


def run_pattern_intelligence():
    """Full pattern detection + editorial brief generation."""
    print("Detecting patterns...")
    findings = detect_patterns()

    print(f"\nComplaint patterns: {len(findings['complaint_patterns'])}")
    for p in findings["complaint_patterns"]:
        sev = p["severity"].upper()
        cross = "CROSS-PLATFORM" if p["is_cross_platform"] else ""
        systemic = "SYSTEMIC" if p["is_systemic"] else ""
        print(f"  [{sev}] {p['display_name']}: {p['total_mentions']} mentions {cross} {systemic}")
        print(f"    Regions: {p['regions']}")

    print(f"\nStore health:")
    for s in findings["store_health"][:5]:
        print(f"  [{s['status']}] {s['store'][:40]} ({s['city']}) -- score:{s['health_score']} rating:{s['avg_rating']} critical:{s['critical_reviews']}")

    print(f"\nTrends:")
    for t in findings["trends"]:
        print(f"  {t['display_name']}: {t['direction']} {t['volume_change_pct']:+.0f}% vol, {t['sentiment_change']:+.3f} sent")

    print(f"\nCross-platform signals:")
    for c in findings["cross_platform"][:5]:
        print(f"  {c['display_name']}: {c['total_signals']} signals across {c['platforms']}")

    # Generate editorial brief
    print("\nGenerating editorial brief...")
    brief = generate_pattern_brief(findings)
    if brief:
        print(f"\n{'='*60}")
        print("PATTERN INTELLIGENCE BRIEF")
        print(f"{'='*60}")
        print(brief)

    return findings, brief


if __name__ == "__main__":
    run_pattern_intelligence()
