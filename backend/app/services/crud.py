import re
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from psycopg import sql
from psycopg.types.json import Jsonb

from app.db import get_connection, serialize_row, serialize_rows

ALLOWED_TABLES = {
    "companies",
    "contacts",
    "pipelines",
    "pipeline_stages",
    "deal_probability_options",
    "deals",
    "leads",
    "activities",
    "tasks",
}

COLUMN_RE = re.compile(r"^[a-z_][a-z0-9_]*$")


def _bind_value(value: Any) -> Any:
    if isinstance(value, dict):
        return Jsonb(value)
    return value


def _require_table(table: str) -> str:
    if table not in ALLOWED_TABLES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown resource: {table}",
        )
    return table


def _require_column(column: str) -> str:
    if not COLUMN_RE.match(column) or column in {"organization_id"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid column: {column}",
        )
    return column


def list_rows(
    table: str,
    *,
    organization_id: str,
    filters: dict[str, Any] | None = None,
    order_by: str | None = None,
    ascending: bool = True,
    limit: int = 100,
) -> list[dict]:
    table = _require_table(table)
    clauses = [sql.SQL("organization_id = %s")]
    params: list[Any] = [organization_id]

    for key, value in (filters or {}).items():
        if value is None or value == "":
            continue
        column = _require_column(key)
        clauses.append(sql.SQL("{} = %s").format(sql.Identifier(column)))
        params.append(value)

    query = sql.SQL("select * from {} where {}").format(
        sql.Identifier(table),
        sql.SQL(" and ").join(clauses),
    )

    if order_by:
        direction = sql.SQL("asc" if ascending else "desc")
        query += sql.SQL(" order by {} {}").format(
            sql.Identifier(_require_column(order_by)),
            direction,
        )

    query += sql.SQL(" limit %s")
    params.append(limit)

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            return serialize_rows(cursor.fetchall())


def count_rows(
    table: str,
    *,
    organization_id: str,
    filters: dict[str, Any] | None = None,
) -> int:
    table = _require_table(table)
    clauses = [sql.SQL("organization_id = %s")]
    params: list[Any] = [organization_id]

    for key, value in (filters or {}).items():
        if value is None or value == "":
            continue
        column = _require_column(key)
        clauses.append(sql.SQL("{} = %s").format(sql.Identifier(column)))
        params.append(value)

    query = sql.SQL("select count(*)::int as count from {} where {}").format(
        sql.Identifier(table),
        sql.SQL(" and ").join(clauses),
    )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            row = cursor.fetchone()
            if not row:
                return 0
            return int(row["count"])


def get_row(table: str, *, organization_id: str, row_id: str) -> dict:
    table = _require_table(table)
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                sql.SQL(
                    "select * from {} where organization_id = %s and id = %s limit 1"
                ).format(sql.Identifier(table)),
                (organization_id, row_id),
            )
            row = serialize_row(cursor.fetchone())
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return row


def create_row(table: str, *, organization_id: str, payload: dict) -> dict:
    table = _require_table(table)
    data = {**payload}
    data.pop("id", None)
    data["organization_id"] = organization_id
    data["updated_at"] = datetime.now(timezone.utc)

    columns = []
    values = []
    for key, value in data.items():
        if not COLUMN_RE.match(key):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid column: {key}",
            )
        columns.append(sql.Identifier(key))
        values.append(_bind_value(value))

    query = sql.SQL("insert into {} ({}) values ({}) returning *").format(
        sql.Identifier(table),
        sql.SQL(", ").join(columns),
        sql.SQL(", ").join(sql.Placeholder() for _ in values),
    )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            row = serialize_row(cursor.fetchone())
            connection.commit()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Insert failed",
        )
    return row


def update_row(
    table: str, *, organization_id: str, row_id: str, payload: dict
) -> dict:
    table = _require_table(table)
    data = {**payload}
    data.pop("id", None)
    data.pop("organization_id", None)
    data["updated_at"] = datetime.now(timezone.utc)

    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    assignments = []
    values: list[Any] = []
    for key, value in data.items():
        if key != "updated_at" and not COLUMN_RE.match(key):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid column: {key}",
            )
        assignments.append(sql.SQL("{} = %s").format(sql.Identifier(key)))
        values.append(_bind_value(value))

    values.extend([organization_id, row_id])
    query = sql.SQL(
        "update {} set {} where organization_id = %s and id = %s returning *"
    ).format(sql.Identifier(table), sql.SQL(", ").join(assignments))

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            row = serialize_row(cursor.fetchone())
            connection.commit()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return row


def delete_row(table: str, *, organization_id: str, row_id: str) -> dict:
    table = _require_table(table)
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                sql.SQL(
                    "delete from {} where organization_id = %s and id = %s returning id"
                ).format(sql.Identifier(table)),
                (organization_id, row_id),
            )
            row = serialize_row(cursor.fetchone())
            connection.commit()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return {"ok": True, "id": row["id"]}
