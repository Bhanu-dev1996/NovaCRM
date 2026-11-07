from fastapi import APIRouter, Query

from app.services.location import (
    get_location_cities,
    get_location_countries,
    get_location_states,
)

router = APIRouter(prefix="/api/location", tags=["location"])


@router.get("/countries")
def list_location_countries() -> dict:
    return {"data": list(get_location_countries())}


@router.get("/states")
def list_location_states(country: str = Query(..., min_length=1)) -> dict:
    return {"data": list(get_location_states(country))}


@router.get("/cities")
def list_location_cities(
    country: str = Query(..., min_length=1),
    state: str = Query(..., min_length=1),
) -> dict:
    return {"data": list(get_location_cities(country, state))}
