from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("")
@router.get("/")
def health() -> dict:
    return {
        "ok": True,
        "service": "novacrm-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
