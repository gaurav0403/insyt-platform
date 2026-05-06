"""
Complaint redressal tracking.

Identifies customer complaints, matches them with official brand responses,
and tracks resolution status. This is a key CMO signal -- unresolved complaints
at scale indicate systemic service failures.
"""
import json
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
import structlog
import anthropic

from backend.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

COMPLAINT_ANALYSIS_PROMPT = """You are analyzing customer complaints about jewellery brands on social media.

For each complaint, produce a JSON object with:
1. "is_complaint": boolean — is this genuinely a customer complaint (not news, not stock discussion)?
2. "brand": which brand is being complained about (Kalyan Jewellers, Tanishq, Malabar Gold, etc.)
3. "category": one of: quality, service, pricing, hallmarking, exchange_policy, delivery, fraud, making_charges, staff_behavior, other
4. "severity": 1-5 (1=minor gripe, 3=service failure, 5=fraud/legal)
5. "summary": One sentence summary of the complaint
6. "has_response": boolean — does the content suggest the brand has responded?
7. "resolution_status": "unresolved" | "acknowledged" | "resolved" | "escalated" | "unknown"
8. "engagement_reach": "low" (<100 views), "medium" (100-10k), "high" (10k+), "viral" (100k+)

Return JSON array, one per mention."""


def analyze_complaints():
    """Find and analyze all complaint-pattern mentions."""
    engine = create_engine(settings.database_url_sync)
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    with engine.begin() as conn:
        # Find complaint-like mentions across all social platforms
        rows = conn.execute(text("""
            SELECT m.id, m.title, m.raw_content, m.source_type, m.source_publication,
                   m.author, m.published_at, m.source_url, m.metadata
            FROM mentions m
            WHERE m.source_type IN ('twitter', 'reddit', 'instagram')
            AND (
                m.raw_content ILIKE '%complaint%'
                OR m.raw_content ILIKE '%worst%'
                OR m.raw_content ILIKE '%fraud%'
                OR m.raw_content ILIKE '%cheat%'
                OR m.raw_content ILIKE '%bad experience%'
                OR m.raw_content ILIKE '%never buy%'
                OR m.raw_content ILIKE '%disappointed%'
                OR m.raw_content ILIKE '%pathetic%'
                OR m.raw_content ILIKE '%horrible%'
                OR m.raw_content ILIKE '%scam%'
                OR m.raw_content ILIKE '%refund%'
                OR m.raw_content ILIKE '%exchange policy%'
                OR m.raw_content ILIKE '%making charges%'
                OR m.raw_content ILIKE '%overcharg%'
                OR m.raw_content ILIKE '%poor quality%'
                OR m.raw_content ILIKE '%fake gold%'
                OR m.raw_content ILIKE '%not respond%'
                OR m.raw_content ILIKE '%customer care%'
                OR m.raw_content ILIKE '%apologize%'
                OR m.raw_content ILIKE '%inconvenience%'
            )
            ORDER BY m.published_at DESC NULLS LAST
        """)).fetchall()

        logger.info("complaints.found", count=len(rows))

        if not rows:
            print("No complaint-pattern mentions found.")
            return

        # Format for Claude
        formatted = []
        for r in rows:
            meta = r[8] or {}
            if isinstance(meta, str):
                try:
                    meta = json.loads(meta)
                except Exception:
                    meta = {}

            engagement = ""
            views = meta.get("views", 0) or 0
            likes = meta.get("likes", 0) or 0
            if views or likes:
                engagement = f" | Views: {views}, Likes: {likes}"

            formatted.append(
                f"ID: {r[0]} | @{r[5]} on {r[3]} | {r[6]}{engagement}\n"
                f"Content: {(r[2] or r[1] or '')[:500]}"
            )

        # Analyze in batches
        batch_size = 20
        all_analyses = []
        for i in range(0, len(formatted), batch_size):
            batch = formatted[i:i + batch_size]
            prompt = f"Analyze these {len(batch)} social media posts for customer complaints:\n\n" + "\n\n---\n\n".join(batch)

            try:
                response = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=4096,
                    system=COMPLAINT_ANALYSIS_PROMPT,
                    messages=[{"role": "user", "content": prompt}],
                )
                result = response.content[0].text.strip()
                if result.startswith("```"):
                    result = result.split("```")[1]
                    if result.startswith("json"):
                        result = result[4:]
                analyses = json.loads(result)
                all_analyses.extend(analyses)
            except Exception as e:
                logger.error("complaints.analysis_failed", error=str(e))

        # Report
        complaints = [a for a in all_analyses if a.get("is_complaint")]
        print(f"\n=== Complaint Analysis ===")
        print(f"Total posts scanned: {len(rows)}")
        print(f"Genuine complaints: {len(complaints)}")

        if complaints:
            by_brand = {}
            by_category = {}
            by_status = {}
            high_severity = []

            for c in complaints:
                brand = c.get("brand", "Unknown")
                by_brand[brand] = by_brand.get(brand, 0) + 1
                cat = c.get("category", "other")
                by_category[cat] = by_category.get(cat, 0) + 1
                status = c.get("resolution_status", "unknown")
                by_status[status] = by_status.get(status, 0) + 1
                if c.get("severity", 0) >= 4:
                    high_severity.append(c)

            print(f"\nBy brand: {json.dumps(by_brand, indent=2)}")
            print(f"\nBy category: {json.dumps(by_category, indent=2)}")
            print(f"\nResolution status: {json.dumps(by_status, indent=2)}")

            if high_severity:
                print(f"\nHIGH SEVERITY ({len(high_severity)}):")
                for c in high_severity:
                    print(f"  [{c.get('brand')}] sev:{c.get('severity')} | {c.get('summary')}")
                    print(f"    Status: {c.get('resolution_status')} | Reach: {c.get('engagement_reach')}")


if __name__ == "__main__":
    analyze_complaints()
