"""
Pattern intelligence API endpoints.
Serves pre-computed patterns. Brief is generated separately and cached.
"""
from fastapi import APIRouter, Depends
from backend.intelligence.patterns import detect_patterns, generate_pattern_brief
import json
from pathlib import Path

router = APIRouter()

CACHE_PATH = Path("/tmp/insyt_pattern_cache.json")


def _get_cached_or_compute():
    """Return cached patterns if fresh, otherwise compute."""
    if CACHE_PATH.exists():
        try:
            data = json.loads(CACHE_PATH.read_text())
            return data
        except Exception:
            pass

    # Compute fresh
    findings = detect_patterns()
    brief = generate_pattern_brief(findings)
    result = {"patterns": findings, "brief": brief}

    # Cache it
    try:
        CACHE_PATH.write_text(json.dumps(result, default=str))
    except Exception:
        pass

    return result


@router.get("/")
async def get_patterns():
    """Full pattern intelligence report. Uses cache for speed."""
    return _get_cached_or_compute()


@router.get("/refresh")
async def refresh_patterns():
    """Force refresh pattern intelligence (slow -- calls Claude)."""
    findings = detect_patterns()
    brief = generate_pattern_brief(findings)
    result = {"patterns": findings, "brief": brief}
    try:
        CACHE_PATH.write_text(json.dumps(result, default=str))
    except Exception:
        pass
    return result


@router.get("/complaints")
async def get_complaint_patterns():
    """Complaint patterns only (fast, no Claude call)."""
    findings = detect_patterns()
    return {
        "complaint_patterns": findings["complaint_patterns"],
        "store_health": findings["store_health"],
    }
