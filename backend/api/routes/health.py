import subprocess
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
            env=None,  # inherit all env vars
        )
        return {
            "status": "ok" if result.returncode == 0 else "error",
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
