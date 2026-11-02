from fastapi import APIRouter

from app.services.countries import get_phone_countries

router = APIRouter(prefix="/api", tags=["countries"])


@router.get("/countries")
def list_countries() -> dict:
    return {"data": list(get_phone_countries())}
