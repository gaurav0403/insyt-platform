import subprocess
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "insyt-api"}


@router.post("/migrate")
async def run_migrations():
    """Run alembic migrations."""
    try:
        result = subprocess.run(
            ["python", "-m", "alembic", "-c", "/app/backend/alembic.ini", "upgrade", "head"],
            capture_output=True, text=True, timeout=30, cwd="/app/backend",
        )
        return {"status": "ok" if result.returncode == 0 else "error",
                "stdout": result.stdout, "stderr": result.stderr}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/seed")
async def run_seed():
    """Load taxonomy into database."""
    try:
        result = subprocess.run(
            ["python", "-m", "backend.db.seed"],
            capture_output=True, text=True, timeout=60, cwd="/app",
        )
        return {"status": "ok" if result.returncode == 0 else "error",
                "stdout": result.stdout, "stderr": result.stderr}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/ingest/search/{group}")
async def run_search_ingest(group: str = "kalyan_core"):
    """Run search-based news ingestion for a query group."""
    try:
        result = subprocess.run(
            ["python", "-m", "backend.ingestion.news.runner", "--mode", "search", "--group", group],
            capture_output=True, text=True, timeout=300, cwd="/app",
        )
        return {"status": "ok" if result.returncode == 0 else "error",
                "stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/ingest/rss/{publication}")
async def run_rss_ingest(publication: str = "economic_times"):
    """Run RSS-based news ingestion with strict relevance filtering."""
    try:
        result = subprocess.run(
            ["python", "-m", "backend.ingestion.news.runner", "--mode", "rss", "--publication", publication],
            capture_output=True, text=True, timeout=300, cwd="/app",
        )
        return {"status": "ok" if result.returncode == 0 else "error",
                "stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/purge-mentions")
async def purge_all_mentions():
    """Delete all mentions. Used to clean noise data during development."""
    try:
        result = subprocess.run(
            ["python", "-c", "from sqlalchemy import create_engine, text; from backend.config import get_settings; e=create_engine(get_settings().database_url_sync); c=e.connect(); r=c.execute(text('DELETE FROM mentions')); c.commit(); print(f'Deleted {r.rowcount} mentions')"],
            capture_output=True, text=True, timeout=30, cwd="/app",
        )
        return {"status": "ok" if result.returncode == 0 else "error",
                "stdout": result.stdout, "stderr": result.stderr}
    except Exception as e:
        return {"status": "error", "message": str(e)}
