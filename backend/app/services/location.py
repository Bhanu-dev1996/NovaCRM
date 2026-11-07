from __future__ import annotations

from functools import lru_cache
from typing import Any

import httpx
from fastapi import HTTPException, status

LOCATION_API_BASE = "https://countriesnow.space/api/v0.1"


def _request_json(
    method: str,
    path: str,
    *,
    json_body: dict[str, Any] | None = None,
) -> Any:
    url = f"{LOCATION_API_BASE}{path}"
    try:
        with httpx.Client(timeout=45.0, follow_redirects=True) as client:
            if method.upper() == "GET":
                response = client.get(url)
            else:
                response = client.post(url, json=json_body or {})
            response.raise_for_status()
            payload = response.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not load location data",
        ) from exc

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid location API response",
        )
    if payload.get("error"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(payload.get("msg") or "Location not found"),
        )
    return payload.get("data")


@lru_cache(maxsize=1)
def get_location_countries() -> tuple[str, ...]:
    data = _request_json("GET", "/countries/iso")
    if not isinstance(data, list):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid countries list",
        )
    names: list[str] = []
    for row in data:
        if not isinstance(row, dict):
            continue
        name = str(row.get("name") or "").strip()
        if name:
            names.append(name)
    if not names:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No countries returned",
        )
    return tuple(sorted(names, key=str.casefold))


@lru_cache(maxsize=256)
def get_location_states(country: str) -> tuple[str, ...]:
    key = str(country or "").strip()
    if not key:
        return tuple()
    data = _request_json(
        "POST",
        "/countries/states",
        json_body={"country": key},
    )
    if not isinstance(data, dict):
        return tuple()
    states = data.get("states")
    if not isinstance(states, list):
        return tuple()
    names: list[str] = []
    for row in states:
        if isinstance(row, dict):
            name = str(row.get("name") or "").strip()
        else:
            name = str(row or "").strip()
        if name:
            names.append(name)
    return tuple(sorted(names, key=str.casefold))


@lru_cache(maxsize=512)
def get_location_cities(country: str, state: str) -> tuple[str, ...]:
    country_key = str(country or "").strip()
    state_key = str(state or "").strip()
    if not country_key or not state_key:
        return tuple()
    data = _request_json(
        "POST",
        "/countries/state/cities",
        json_body={"country": country_key, "state": state_key},
    )
    if not isinstance(data, list):
        return tuple()
    cities = [str(name).strip() for name in data if str(name).strip()]
    return tuple(sorted(cities, key=str.casefold))
