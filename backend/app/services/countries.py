from __future__ import annotations

from functools import lru_cache
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.config import COUNTRIES_API_URL

DEFAULT_COUNTRIES_API_URL = "https://countries.dev/countries"

def _dial_code(phonecode: str) -> str | None:
    code = str(phonecode or "").strip()
    if not code or code == "0":
        return None
    return code if code.startswith("+") else f"+{code}"


def _calling_code(row: dict[str, Any]) -> str | None:
    codes = row.get("callingCodes")
    if isinstance(codes, list):
        for code in codes:
            dial = _dial_code(str(code))
            if dial:
                return dial
    legacy = row.get("phonecode")
    if legacy is not None:
        return _dial_code(str(legacy))
    return None


def _normalize_country(row: dict[str, Any]) -> dict[str, str] | None:
    country_id = str(
        row.get("alpha2Code") or row.get("iso2") or ""
    ).strip().upper()
    name = str(row.get("name") or "").strip()
    dial_code = _calling_code(row)
    flag = str(row.get("flag") or row.get("emoji") or "").strip()
    if not country_id or not name or not dial_code:
        return None
    return {
        "id": country_id,
        "name": name,
        "dialCode": dial_code,
        "flag": flag or "🏳️",
    }


def _sort_countries(countries: list[dict[str, str]]) -> list[dict[str, str]]:
    return sorted(countries, key=lambda country: country["name"].casefold())


@lru_cache(maxsize=1)
def get_phone_countries() -> tuple[dict[str, str], ...]:
    url = (COUNTRIES_API_URL or DEFAULT_COUNTRIES_API_URL).strip()
    try:
        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            response = client.get(url)
            response.raise_for_status()
            payload = response.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not load country data",
        ) from exc

    if not isinstance(payload, list):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid country data response",
        )

    countries: list[dict[str, str]] = []
    for row in payload:
        if not isinstance(row, dict):
            continue
        normalized = _normalize_country(row)
        if normalized:
            countries.append(normalized)

    if not countries:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No countries with phone codes found",
        )

    return tuple(_sort_countries(countries))
