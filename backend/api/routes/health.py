import subprocess
import os
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "insyt-api"}


@router.post("/migrate")
async def run_migrations():
    """Run alembic migrations. One-time setup endpoint."""
    try:
        result = subprocess.run(
            ["python", "-m", "alembic", "-c", "/app/backend/alembic.ini", "upgrade", "head"],
            capture_output=True,
            text=True,
            timeout=30,
            cwd="/app/backend",
        )
        return {
            "status": "ok" if result.returncode == 0 else "error",
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/seed")
async def run_seed():
    """Load taxonomy into database. One-time setup endpoint."""
    try:
        result = subprocess.run(
            ["python", "-m", "backend.db.seed"],
            capture_output=True,
            text=True,
            timeout=60,
            cwd="/app",
        )
        return {
            "status": "ok" if result.returncode == 0 else "error",
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/ingest/{publication}")
async def run_ingestion(publication: str = "economic_times"):
    """Run news ingestion for a publication. One-time data loading."""
    try:
        result = subprocess.run(
            ["python", "-m", "backend.ingestion.news.runner", "--publication", publication, "--no-filter"],
            capture_output=True,
            text=True,
            timeout=300,
            cwd="/app",
        )
        return {
            "status": "ok" if result.returncode == 0 else "error",
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
