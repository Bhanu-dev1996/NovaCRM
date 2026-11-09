"""Seed demo tasks and activities (all interaction types) for the primary workspace.

Idempotent: skips rows that already exist by stable title/subject per organization.
Run after: seed_organization, seed_users, seed_contacts, seed_leads, seed_deals (optional).
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
import psycopg

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.company_seed_data import OWNER_EMAIL_BY_KEY  # noqa: E402

load_dotenv(ROOT / ".env")

PRIMARY_ORG_ID = "a8414d8d-a9fd-4880-a557-01c9ef16046c"

# Stable keys for idempotent upsert-by-existence checks
SEED_TASKS = [
    {
        "title": "[seed] Send Vertex security questionnaire",
        "description": "Compile answers for SSO, data residency, and audit logs.",
        "status": "todo",
        "priority": "high",
        "due_offset_days": 3,
        "owner_key": "alex",
        "contact_email": "maya.chen@vertex.io",
        "company_name": "Vertex Solutions",
        "lead_email": "maya.chen@vertex.io",
    },
    {
        "title": "[seed] Prepare Northstar demo deck",
        "description": "Pipeline analytics story + ROI one-pager.",
        "status": "doing",
        "priority": "medium",
        "due_offset_days": 1,
        "owner_key": "jordan",
        "contact_email": "j.blake@northstar.co",
        "company_name": "Northstar Ltd",
        "lead_email": "j.blake@northstar.co",
    },
    {
        "title": "[seed] Follow up on Orbit Labs contract",
        "description": "Legal redlines still open on MSA section 4.",
        "status": "todo",
        "priority": "low",
        "due_offset_days": -2,
        "owner_key": "sam",
        "lead_email": "priya@orbitlabs.ai",
        "company_name": "Orbit Labs",
    },
    {
        "title": "[seed] Close GlobalPay onboarding checklist",
        "description": "Provisioning, admin training, and success metrics.",
        "status": "done",
        "priority": "medium",
        "due_offset_days": -5,
        "owner_key": "riley",
        "lead_email": "elena.v@globalpay.com",
        "company_name": "GlobalPay Inc",
    },
    {
        "title": "[seed] Review Acme Corp discovery notes",
        "description": "Summarize pain points for next stakeholder map.",
        "status": "todo",
        "priority": "high",
        "due_offset_days": 7,
        "owner_key": "casey",
        "lead_email": "dortiz@acmecorp.com",
        "company_name": "Acme Corp",
    },
    {
        "title": "[seed] Schedule Brightline executive briefing",
        "description": "Align COO and RevOps on rollout phases.",
        "status": "todo",
        "priority": "medium",
        "due_offset_days": 10,
        "owner_key": "alex",
        "lead_email": "noah@brightline.media",
    },
]

SEED_ACTIVITIES = [
    {
        "type": "meeting",
        "subject": "[seed] Product walkthrough — Vertex Solutions",
        "body": "60 min session with RevOps and IT admin.",
        "status": "Scheduled",
        "priority": "high",
        "due_offset_days": 5,
        "owner_key": "alex",
        "company_name": "Vertex Solutions",
        "lead_email": "maya.chen@vertex.io",
    },
    {
        "type": "meeting",
        "subject": "[seed] Discovery kickoff — Northstar Ltd",
        "body": "Completed discovery; recording linked in workspace drive.",
        "status": "Completed",
        "priority": "medium",
        "due_offset_days": -7,
        "completed_offset_days": -6,
        "owner_key": "jordan",
        "company_name": "Northstar Ltd",
    },
    {
        "type": "call",
        "subject": "[seed] Check-in call with Priya (Orbit Labs)",
        "body": "Budget timeline and champion intro.",
        "status": "Scheduled",
        "priority": "medium",
        "due_offset_days": 2,
        "owner_key": "sam",
        "lead_email": "priya@orbitlabs.ai",
    },
    {
        "type": "call",
        "subject": "[seed] Logged call — Daniel Ortiz",
        "body": "Left voicemail; interested in manufacturing use cases.",
        "status": "Logged",
        "priority": "low",
        "due_offset_days": -1,
        "completed_offset_days": -1,
        "owner_key": "casey",
        "lead_email": "dortiz@acmecorp.com",
        "meta": {"callMode": "log", "logged": True},
    },
    {
        "type": "email",
        "subject": "[seed] Send pricing breakdown — GlobalPay",
        "body": "Attach tiered seats + implementation services.",
        "status": "Scheduled",
        "priority": "high",
        "due_offset_days": 4,
        "owner_key": "riley",
        "lead_email": "elena.v@globalpay.com",
    },
    {
        "type": "email",
        "subject": "[seed] Intro email — Elena Vasquez",
        "body": "Warm intro from partner team; sent template A.",
        "status": "Completed",
        "priority": "medium",
        "due_offset_days": -10,
        "completed_offset_days": -9,
        "owner_key": "riley",
        "contact_email": "emily.chen@stripe.com",
    },
    {
        "type": "note",
        "subject": "[seed] Note — security requirements captured",
        "body": "Needs SOC2 Type II report and EU data residency option.",
        "status": "Logged",
        "priority": "medium",
        "due_offset_days": -4,
        "owner_key": "alex",
        "company_name": "Vertex Solutions",
        "contact_email": "maya.chen@vertex.io",
    },
    {
        "type": "note",
        "subject": "[seed] Note — champion at Brightline Media",
        "body": "Noah Kim (COO) driving evaluation; finance is blocker.",
        "status": "Logged",
        "priority": "low",
        "due_offset_days": -8,
        "owner_key": "alex",
        "lead_email": "noah@brightline.media",
        "company_name": "Brightline Media",
    },
    {
        "type": "meeting",
        "subject": "[seed] Canceled onsite — Acme Corp",
        "body": "Customer postponed plant visit to Q2.",
        "status": "Cancelled",
        "priority": "medium",
        "due_offset_days": -3,
        "owner_key": "casey",
        "company_name": "Acme Corp",
    },
    {
        "type": "call",
        "subject": "[seed] Renewal discussion — CloudScale Expansion",
        "body": "Discuss expansion seats and premium support.",
        "status": "Scheduled",
        "priority": "urgent",
        "due_offset_days": 1,
        "owner_key": "jordan",
        "deal_name": "CloudScale Expansion",
    },
]

# Minimum rows per table (activities UI merges tasks + activities; Supabase shows them separately).
TARGET_ACTIVITIES_TABLE = 50
TARGET_TASKS_TABLE = 25

TASK_STATUSES = ("todo", "doing", "done")
TASK_PRIORITIES = ("low", "medium", "high")
ACTIVITY_TYPES = ("meeting", "call", "email", "note")
ACTIVITY_STATUSES = {
    "meeting": ("Scheduled", "Completed", "Cancelled"),
    "call": ("Scheduled", "Completed", "Logged"),
    "email": ("Scheduled", "Completed"),
    "note": ("Logged",),
}
ACTIVITY_PRIORITIES = ("low", "medium", "high")
OWNER_KEYS = tuple(OWNER_EMAIL_BY_KEY.keys())


def _row_id(
    conn: psycopg.Connection,
    sql: str,
    args: tuple,
) -> str | None:
    row = conn.execute(sql, args).fetchone()
    return str(row[0]) if row else None


def _table_row_counts(conn: psycopg.Connection, org_id: str) -> tuple[int, int]:
    tasks = conn.execute(
        "select count(*)::int from tasks where organization_id = %s",
        (org_id,),
    ).fetchone()[0]
    activities = conn.execute(
        "select count(*)::int from activities where organization_id = %s",
        (org_id,),
    ).fetchone()[0]
    return tasks, activities


def _fetch_related_pools(conn: psycopg.Connection, org_id: str) -> dict:
    contacts = conn.execute(
        """
        select id, email, company_id
        from contacts
        where organization_id = %s
        order by created_at
        limit 200
        """,
        (org_id,),
    ).fetchall()
    leads = conn.execute(
        """
        select id, email, company_id
        from leads
        where organization_id = %s
        order by created_at
        limit 200
        """,
        (org_id,),
    ).fetchall()
    companies = conn.execute(
        """
        select id, name
        from companies
        where organization_id = %s
        order by name
        limit 200
        """,
        (org_id,),
    ).fetchall()
    deals = conn.execute(
        """
        select id, name, company_id, contact_id
        from deals
        where organization_id = %s
        order by created_at
        limit 200
        """,
        (org_id,),
    ).fetchall()
    return {
        "contacts": contacts,
        "leads": leads,
        "companies": companies,
        "deals": deals,
    }


def _backfill_sparse_rows(
    conn: psycopg.Connection,
    org_id: str,
    default_owner: str,
    now: datetime,
) -> tuple[int, int]:
    tasks_updated = conn.execute(
        """
        update tasks t
        set
          assignee_id = coalesce(t.assignee_id, %s),
          due_at = coalesce(t.due_at, t.created_at + interval '2 days'),
          priority = coalesce(nullif(t.priority, ''), 'medium'),
          description = coalesce(nullif(trim(t.description), ''), 'Follow-up for seeded demo task.'),
          company_id = coalesce(
            t.company_id,
            (select c.company_id from contacts c where c.id = t.contact_id limit 1)
          ),
          lead_id = coalesce(
            t.lead_id,
            (select l.id from leads l
             join contacts c on lower(c.email) = lower(l.email)
             where c.id = t.contact_id and l.organization_id = t.organization_id
             limit 1)
          ),
          updated_at = %s
        where t.organization_id = %s
          and (
            t.assignee_id is null
            or t.due_at is null
            or t.priority is null
            or t.description is null or trim(t.description) = ''
            or (t.contact_id is not null and t.company_id is null)
          )
        """,
        (default_owner, now, org_id),
    ).rowcount

    activities_updated = conn.execute(
        """
        update activities a
        set
          assignee_id = coalesce(a.assignee_id, a.user_id, %s),
          user_id = coalesce(a.user_id, a.assignee_id, %s),
          due_at = coalesce(a.due_at, a.completed_at, a.created_at + interval '1 day'),
          priority = coalesce(nullif(a.priority, ''), 'medium'),
          status = coalesce(
            nullif(a.status, ''),
            case a.type
              when 'note' then 'Logged'
              when 'call' then 'Logged'
              else 'Scheduled'
            end
          ),
          body = coalesce(nullif(trim(a.body), ''), 'Seeded interaction notes for demo workspace.'),
          company_id = coalesce(
            a.company_id,
            (select c.company_id from contacts c where c.id = a.contact_id limit 1),
            (select l.company_id from leads l where l.id = a.lead_id limit 1),
            (select d.company_id from deals d where d.id = a.deal_id limit 1)
          ),
          lead_id = coalesce(
            a.lead_id,
            (select l.id from leads l
             join contacts c on lower(c.email) = lower(l.email)
             join deals d on d.id = a.deal_id and d.contact_id = c.id
             where l.organization_id = a.organization_id
             limit 1)
          ),
          contact_id = coalesce(
            a.contact_id,
            (select c.id from contacts c
             join leads l on lower(c.email) = lower(l.email)
             where l.id = a.lead_id and c.organization_id = a.organization_id
             limit 1)
          ),
          updated_at = %s
        where a.organization_id = %s
          and (
            a.assignee_id is null
            or a.due_at is null
            or a.priority is null
            or a.status is null
            or a.body is null or trim(a.body) = ''
            or (a.lead_id is not null and a.contact_id is null)
            or (a.deal_id is not null and a.company_id is null)
          )
        """,
        (default_owner, default_owner, now, org_id),
    ).rowcount
    return tasks_updated, activities_updated


def _backfill_missing_deal_links(
    conn: psycopg.Connection,
    org_id: str,
    now: datetime,
) -> int:
    deals = conn.execute(
        """
        select id from deals
        where organization_id = %s
        order by created_at
        """,
        (org_id,),
    ).fetchall()
    if not deals:
        return 0

    activity_ids = conn.execute(
        """
        select id from activities
        where organization_id = %s and deal_id is null
        order by created_at
        """,
        (org_id,),
    ).fetchall()
    updated = 0
    for idx, (activity_id,) in enumerate(activity_ids):
        deal_id = deals[idx % len(deals)][0]
        conn.execute(
            """
            update activities
            set deal_id = %s, updated_at = %s
            where id = %s and deal_id is null
            """,
            (deal_id, now, activity_id),
        )
        updated += 1

    task_ids = conn.execute(
        """
        select id from tasks
        where organization_id = %s and deal_id is null
        order by created_at
        """,
        (org_id,),
    ).fetchall()
    for idx, (task_id,) in enumerate(task_ids):
        deal_id = deals[idx % len(deals)][0]
        conn.execute(
            """
            update tasks
            set deal_id = %s, updated_at = %s
            where id = %s and deal_id is null
            """,
            (deal_id, now, task_id),
        )
        updated += 1

    return updated


def _seed_bulk_rows(
    conn: psycopg.Connection,
    org_id: str,
    owner_by_key: dict[str, str],
    default_owner: str,
    pools: dict,
    now: datetime,
    target_activities: int,
    target_tasks: int,
) -> tuple[int, int]:
    tasks_created = 0
    activities_created = 0
    contacts = pools["contacts"]
    leads = pools["leads"]
    companies = pools["companies"]
    deals = pools["deals"]
    if not (contacts or leads or companies):
        return 0, 0

    tasks_in_db, activities_in_db = _table_row_counts(conn, org_id)

    index = 0
    while activities_in_db < target_activities:
        index += 1
        if index > target_activities * 3:
            break
        owner_key = OWNER_KEYS[index % len(OWNER_KEYS)]
        assignee = owner_by_key.get(owner_key) or default_owner
        due_at = now + timedelta(days=-20 + (index % 41))
        act_type = ACTIVITY_TYPES[index % len(ACTIVITY_TYPES)]
        subject = f"[seed] Demo {act_type} #{index:03d}"
        exists = conn.execute(
            """
            select id from activities
            where organization_id = %s and subject = %s
            limit 1
            """,
            (org_id, subject),
        ).fetchone()
        if exists:
            continue

        contact = contacts[(index + 1) % len(contacts)] if contacts else None
        lead = leads[(index + 2) % len(leads)] if leads else None
        company = companies[(index + 3) % len(companies)] if companies else None
        deal = deals[(index + 4) % len(deals)] if deals else None

        statuses = ACTIVITY_STATUSES[act_type]
        status = statuses[index % len(statuses)]
        priority = ACTIVITY_PRIORITIES[index % len(ACTIVITY_PRIORITIES)]
        completed_at = None
        if status == "Completed":
            completed_at = due_at + timedelta(hours=4)
        elif status == "Logged":
            completed_at = due_at

        conn.execute(
            """
            insert into activities (
              organization_id, deal_id, contact_id, company_id, lead_id,
              user_id, assignee_id,
              type, subject, body,
              status, priority, meta,
              due_at, completed_at,
              created_at, updated_at
            ) values (
              %s,%s,%s,%s,%s,
              %s,%s,
              %s,%s,%s,
              %s,%s,%s::jsonb,
              %s,%s,
              %s,%s
            )
            """,
            (
                org_id,
                str(deal[0]) if deal else None,
                str(contact[0]) if contact else None,
                str(company[0])
                if company
                else (str(contact[2]) if contact and contact[2] else None),
                str(lead[0]) if lead else None,
                assignee,
                assignee,
                act_type,
                subject,
                f"Seeded {act_type} row {index} — full column coverage for Activities table.",
                status,
                priority,
                json.dumps({"seedBulk": True, "index": index}),
                due_at,
                completed_at,
                now - timedelta(days=index % 10),
                completed_at or now,
            ),
        )
        activities_created += 1
        activities_in_db += 1

    tasks_in_db, _ = _table_row_counts(conn, org_id)
    t_index = 0
    while tasks_in_db < target_tasks:
        t_index += 1
        if t_index > target_tasks * 3:
            break
        owner_key = OWNER_KEYS[t_index % len(OWNER_KEYS)]
        assignee = owner_by_key.get(owner_key) or default_owner
        due_at = now + timedelta(days=-15 + (t_index % 31))
        title = f"[seed] Demo task #{t_index:03d} — pipeline follow-up"
        exists = conn.execute(
            """
            select id from tasks
            where organization_id = %s and title = %s
            limit 1
            """,
            (org_id, title),
        ).fetchone()
        if exists:
            continue

        contact = contacts[t_index % len(contacts)] if contacts else None
        lead = leads[t_index % len(leads)] if leads else None
        company = companies[t_index % len(companies)] if companies else None
        deal = deals[t_index % len(deals)] if deals else None

        status = TASK_STATUSES[t_index % len(TASK_STATUSES)]
        priority = TASK_PRIORITIES[t_index % len(TASK_PRIORITIES)]
        completed_at = due_at + timedelta(hours=2) if status == "done" else None

        conn.execute(
            """
            insert into tasks (
              organization_id, deal_id, contact_id, company_id, lead_id,
              assignee_id, title, description,
              status, priority, due_at,
              created_at, updated_at
            ) values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                org_id,
                str(deal[0]) if deal else None,
                str(contact[0]) if contact else None,
                str(company[0])
                if company
                else (str(contact[2]) if contact and contact[2] else None),
                str(lead[0]) if lead else None,
                assignee,
                title,
                f"Auto-seeded task {t_index} with owner, due date, priority, and CRM links.",
                status,
                priority,
                due_at,
                now - timedelta(days=t_index % 14),
                completed_at or now,
            ),
        )
        tasks_created += 1
        tasks_in_db += 1

    return tasks_created, activities_created


def _user_ids(conn: psycopg.Connection) -> dict[str, str]:
    users = conn.execute(
        """
        select id, email from users
        where lower(email) = any(%s)
        """,
        ([email.lower() for email in OWNER_EMAIL_BY_KEY.values()],),
    ).fetchall()
    by_email = {email.lower(): str(uid) for uid, email in users}
    by_key = {
        key: by_email.get(email.lower(), "")
        for key, email in OWNER_EMAIL_BY_KEY.items()
    }
    return by_key, by_email.get(OWNER_EMAIL_BY_KEY["alex"].lower(), "")


def main() -> None:
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL missing", file=sys.stderr)
        sys.exit(1)

    now = datetime.now(timezone.utc)
    tasks_created = 0
    activities_created = 0

    with psycopg.connect(url) as conn:
        org = conn.execute(
            "select id, name from organizations where id = %s",
            (PRIMARY_ORG_ID,),
        ).fetchone()
        if not org:
            print(
                f"Primary organization {PRIMARY_ORG_ID} not found. Run seed_organization.py first.",
                file=sys.stderr,
            )
            sys.exit(1)

        owner_by_key, default_owner = _user_ids(conn)
        if not default_owner:
            print("Missing seed users. Run seed_users.py first.", file=sys.stderr)
            sys.exit(1)

        def contact_id(email: str | None) -> str | None:
            if not email:
                return None
            return _row_id(
                conn,
                """
                select id from contacts
                where organization_id = %s and lower(email) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, email),
            )

        def lead_id(email: str | None) -> str | None:
            if not email:
                return None
            return _row_id(
                conn,
                """
                select id from leads
                where organization_id = %s and lower(email) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, email),
            )

        def company_id(name: str | None) -> str | None:
            if not name:
                return None
            return _row_id(
                conn,
                """
                select id from companies
                where organization_id = %s and lower(name) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, name),
            )

        def deal_id(name: str | None) -> str | None:
            if not name:
                return None
            return _row_id(
                conn,
                """
                select id from deals
                where organization_id = %s and lower(name) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, name),
            )

        for spec in SEED_TASKS:
            exists = conn.execute(
                """
                select id from tasks
                where organization_id = %s and title = %s
                limit 1
                """,
                (PRIMARY_ORG_ID, spec["title"]),
            ).fetchone()
            if exists:
                continue

            assignee = owner_by_key.get(spec["owner_key"]) or default_owner
            due_at = now + timedelta(days=spec["due_offset_days"])
            cid = contact_id(spec.get("contact_email"))
            comp = company_id(spec.get("company_name"))
            lid = lead_id(spec.get("lead_email"))

            conn.execute(
                """
                insert into tasks (
                  organization_id, contact_id, company_id, lead_id,
                  assignee_id, title, description,
                  status, priority, due_at,
                  created_at, updated_at
                ) values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    PRIMARY_ORG_ID,
                    cid,
                    comp,
                    lid,
                    assignee,
                    spec["title"],
                    spec["description"],
                    spec["status"],
                    spec["priority"],
                    due_at,
                    now,
                    now if spec["status"] != "done" else due_at,
                ),
            )
            tasks_created += 1

        for spec in SEED_ACTIVITIES:
            exists = conn.execute(
                """
                select id from activities
                where organization_id = %s and subject = %s
                limit 1
                """,
                (PRIMARY_ORG_ID, spec["subject"]),
            ).fetchone()
            if exists:
                continue

            assignee = owner_by_key.get(spec["owner_key"]) or default_owner
            due_offset = spec.get("due_offset_days")
            due_at = (
                now + timedelta(days=due_offset) if due_offset is not None else None
            )
            completed_offset = spec.get("completed_offset_days")
            completed_at = (
                now + timedelta(days=completed_offset)
                if completed_offset is not None
                else None
            )

            meta = spec.get("meta") or {}
            priority = spec.get("priority") or "medium"
            if priority == "urgent":
                priority = "high"

            conn.execute(
                """
                insert into activities (
                  organization_id, deal_id, contact_id, company_id, lead_id,
                  user_id, assignee_id,
                  type, subject, body,
                  status, priority, meta,
                  due_at, completed_at,
                  created_at, updated_at
                ) values (
                  %s,%s,%s,%s,%s,
                  %s,%s,
                  %s,%s,%s,
                  %s,%s,%s::jsonb,
                  %s,%s,
                  %s,%s
                )
                """,
                (
                    PRIMARY_ORG_ID,
                    deal_id(spec.get("deal_name")),
                    contact_id(spec.get("contact_email")),
                    company_id(spec.get("company_name")),
                    lead_id(spec.get("lead_email")),
                    assignee,
                    assignee,
                    spec["type"],
                    spec["subject"],
                    spec.get("body") or "",
                    spec.get("status"),
                    priority,
                    json.dumps(meta),
                    due_at,
                    completed_at,
                    now,
                    completed_at or now,
                ),
            )
            activities_created += 1

        pools = _fetch_related_pools(conn, PRIMARY_ORG_ID)
        bulk_tasks, bulk_activities = _seed_bulk_rows(
            conn,
            PRIMARY_ORG_ID,
            owner_by_key,
            default_owner,
            pools,
            now,
            TARGET_ACTIVITIES_TABLE,
            TARGET_TASKS_TABLE,
        )
        tasks_created += bulk_tasks
        activities_created += bulk_activities

        tasks_backfilled, activities_backfilled = _backfill_sparse_rows(
            conn, PRIMARY_ORG_ID, default_owner, now
        )
        deals_linked = _backfill_missing_deal_links(conn, PRIMARY_ORG_ID, now)

        conn.commit()
        tasks_total, activities_total = _table_row_counts(conn, PRIMARY_ORG_ID)
        print(
            f"Activities seed: +{tasks_created} tasks, +{activities_created} activities; "
            f"backfilled {tasks_backfilled} tasks, {activities_backfilled} activities; "
            f"linked {deals_linked} deal_id values; "
            f"totals — tasks {tasks_total}, activities {activities_total} ({org[1]})"
        )


if __name__ == "__main__":
    main()
