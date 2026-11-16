"""Campaign delivery metrics (Phase 1: recorded / simulated until ESP integration)."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _json_obj(val: Any) -> dict:
    return val if isinstance(val, dict) else {}


def _json_list(val: Any) -> list:
    return val if isinstance(val, list) else []


_OPEN_BASE = {
    "newsletter": 0.34,
    "product_announcement": 0.29,
    "event": 0.38,
    "follow_up": 0.41,
    "email": 0.28,
}


def build_simulated_performance(
    *,
    campaign_id: str,
    estimated_recipients: int,
    campaign_type: str,
    existing: dict | None = None,
) -> dict:
    """Deterministic demo metrics from audience size (stable per campaign id)."""
    recipients = max(int(estimated_recipients or 0), 1)
    digest = hashlib.sha256(str(campaign_id).encode()).hexdigest()
    h = int(digest[:8], 16)

    bounce_rate = 0.015 + (h % 7) / 1000
    bounced = max(1, int(round(recipients * bounce_rate))) if recipients > 3 else 0
    delivered = max(0, recipients - bounced)

    open_base = _OPEN_BASE.get((campaign_type or "email").lower(), 0.28)
    open_rate = min(0.62, open_base + (h % 80) / 1000)
    opens = int(round(delivered * open_rate)) if delivered else 0

    click_share = 0.22 + (h % 25) / 100
    clicks = min(opens, int(round(opens * click_share))) if opens else 0
    unsubscribes = max(0, int(round(delivered * (0.002 + (h % 5) / 10000))))

    now = _utc_now().isoformat()
    prior_events = _json_list((existing or {}).get("events"))
    events = list(prior_events)
    events.append(
        {
            "at": now,
            "type": "metrics_recorded",
            "label": "Send metrics recorded",
            "detail": (
                f"{delivered:,} delivered to {recipients:,} recipients "
                f"({opens:,} opens, {clicks:,} clicks)."
            ),
        }
    )

    return {
        "recipients": recipients,
        "delivered": delivered,
        "bounced": bounced,
        "opens": opens,
        "clicks": clicks,
        "unsubscribes": unsubscribes,
        "source": "recorded",
        "recordedAt": now,
        "events": events[-50:],
    }


def append_status_event(
    performance: dict,
    *,
    status: str,
    previous_status: str | None = None,
) -> dict:
    perf = dict(performance or {})
    events = list(_json_list(perf.get("events")))
    labels = {
        "ready_for_review": "Marked ready for review",
        "completed": "Campaign completed",
        "scheduled": "Scheduled for send",
        "active": "Campaign active",
        "archived": "Archived",
        "draft": "Moved to draft",
    }
    label = labels.get(status, f"Status → {status}")
    detail = (
        f"From {previous_status} to {status}."
        if previous_status and previous_status != status
        else None
    )
    events.append(
        {
            "at": _utc_now().isoformat(),
            "type": "status_change",
            "label": label,
            "detail": detail,
        }
    )
    perf["events"] = events[-50:]
    return perf


def performance_has_delivery(perf: dict | None) -> bool:
    p = _json_obj(perf)
    if p.get("delivered") or p.get("recipients"):
        return True
    return False
