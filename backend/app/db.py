from contextlib import contextmanager
from datetime import date, datetime
from decimal import Decimal
from functools import lru_cache
from typing import Any, Iterator
from uuid import UUID

from fastapi import HTTPException, status
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import DATABASE_URL


def serialize_value(value: Any) -> Any:
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def serialize_row(row: dict | None) -> dict | None:
    if row is None:
        return None
    return {key: serialize_value(value) for key, value in row.items()}


def serialize_rows(rows: list[dict]) -> list[dict]:
    return [serialize_row(row) for row in rows]


@lru_cache
def get_pool() -> ConnectionPool:
    if not DATABASE_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DATABASE_URL is not configured",
        )
    return ConnectionPool(
        conninfo=DATABASE_URL,
        min_size=1,
        max_size=10,
        kwargs={"row_factory": dict_row},
        open=True,
    )


@contextmanager
def get_connection() -> Iterator:
    pool = get_pool()
    with pool.connection() as connection:
        yield connection


def fetch_one(query: str, params: tuple | dict | None = None) -> dict | None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            return serialize_row(cursor.fetchone())


def fetch_all(query: str, params: tuple | dict | None = None) -> list[dict]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            return serialize_rows(cursor.fetchall())


def execute(query: str, params: tuple | dict | None = None) -> None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            connection.commit()
