import re
import secrets

from fastapi import HTTPException, status

from app.db import execute, fetch_all, fetch_one

DEFAULT_PROBABILITY_OPTIONS = list(range(0, 101, 5))


DEFAULT_STAGES = [
    {"name": "New", "position": 1, "probability": 10, "is_won": False, "is_lost": False},
    {"name": "Qualified", "position": 2, "probability": 25, "is_won": False, "is_lost": False},
    {"name": "Proposal", "position": 3, "probability": 50, "is_won": False, "is_lost": False},
    {"name": "Negotiation", "position": 4, "probability": 75, "is_won": False, "is_lost": False},
    {"name": "Closed Won", "position": 5, "probability": 100, "is_won": True, "is_lost": False},
    {"name": "Closed Lost", "position": 6, "probability": 0, "is_won": False, "is_lost": True},
]


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "workspace"


def _unique_slug(base: str, *, exclude_id: str | None = None) -> str:
    candidate = _slugify(base)
    for _ in range(24):
        if exclude_id:
            taken = fetch_one(
                """
                select id from organizations
                where slug = %s and id <> %s
                limit 1
                """,
                (candidate, exclude_id),
            )
        else:
            taken = fetch_one(
                "select id from organizations where slug = %s limit 1",
                (candidate,),
            )
        if not taken:
            return candidate
        candidate = f"{_slugify(base)}-{secrets.token_hex(3)}"
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not allocate a unique workspace slug",
    )


def _seed_deal_probability_options(organization_id: str) -> None:
    existing = fetch_one(
        """
        select id from deal_probability_options
        where organization_id = %s
        limit 1
        """,
        (organization_id,),
    )
    if existing:
        return
    for index, value in enumerate(DEFAULT_PROBABILITY_OPTIONS):
        execute(
            """
            insert into deal_probability_options (
              organization_id, value, position, updated_at
            )
            values (%s, %s, %s, now())
            """,
            (organization_id, value, index + 1),
        )


def _ensure_default_pipeline(organization_id: str) -> str:
    row = fetch_one(
        """
        select id from pipelines
        where organization_id = %s and is_default = true
        limit 1
        """,
        (organization_id,),
    )
    if row:
        return str(row["id"])
    row = fetch_one(
        """
        insert into pipelines (organization_id, name, is_default, updated_at)
        values (%s, %s, true, now())
        returning id
        """,
        (organization_id, "Sales Pipeline"),
    )
    return str(row["id"])


def _seed_pipeline_stages(organization_id: str) -> None:
    existing = fetch_one(
        """
        select id from pipeline_stages
        where organization_id = %s
        limit 1
        """,
        (organization_id,),
    )
    if existing:
        _seed_deal_probability_options(organization_id)
        return

    pipeline_id = _ensure_default_pipeline(organization_id)
    _seed_deal_probability_options(organization_id)

    for stage in DEFAULT_STAGES:
        execute(
            """
            insert into pipeline_stages (
              organization_id, pipeline_id, name, position, probability,
              is_won, is_lost, updated_at
            )
            values (%s, %s, %s, %s, %s, %s, %s, now())
            """,
            (
                organization_id,
                pipeline_id,
                stage["name"],
                stage["position"],
                stage["probability"],
                stage["is_won"],
                stage["is_lost"],
            ),
        )


def _org_payload(row: dict) -> dict:
    return {
        "id": row.get("id") or row.get("org_id"),
        "name": row.get("name") or row.get("org_name"),
        "slug": row.get("slug") or row.get("org_slug"),
        "website": row.get("website") or row.get("org_website"),
        "industry": row.get("industry") or row.get("org_industry"),
        "company_size": row.get("company_size") or row.get("org_company_size"),
        "logo_url": row.get("logo_url") or row.get("org_logo_url"),
        "setup_completed": bool(
            row.get("setup_completed")
            if row.get("setup_completed") is not None
            else row.get("org_setup_completed")
        ),
    }


def list_user_workspaces(user_id: str) -> list[dict]:
    rows = fetch_all(
        """
        select
          om.organization_id,
          om.role,
          o.id as org_id,
          o.name as org_name,
          o.slug as org_slug,
          o.website as org_website,
          o.industry as org_industry,
          o.company_size as org_company_size,
          o.logo_url as org_logo_url,
          o.setup_completed as org_setup_completed
        from organization_members om
        join organizations o on o.id = om.organization_id
        where om.user_id = %s
        order by
          case when om.role = 'owner' then 0 when om.role = 'admin' then 1 else 2 end,
          o.name asc
        """,
        (user_id,),
    )
    return [
        {
            **_org_payload(row),
            "role": row.get("role", "member"),
        }
        for row in rows
    ]


def get_membership(user_id: str, organization_id: str) -> dict | None:
    row = fetch_one(
        """
        select
          om.organization_id,
          om.role,
          o.id as org_id,
          o.name as org_name,
          o.slug as org_slug,
          o.website as org_website,
          o.industry as org_industry,
          o.company_size as org_company_size,
          o.logo_url as org_logo_url,
          o.setup_completed as org_setup_completed
        from organization_members om
        join organizations o on o.id = om.organization_id
        where om.user_id = %s
          and om.organization_id = %s
        limit 1
        """,
        (user_id, organization_id),
    )
    if not row:
        return None
    return {
        "organization_id": row["organization_id"],
        "role": row.get("role", "member"),
        "organization": _org_payload(row),
    }


def ensure_user_workspace(
    user: dict, *, preferred_organization_id: str | None = None
) -> dict:
    """Ensure the user belongs to an organization; create a default one if needed."""
    user_id = user["id"]

    if preferred_organization_id:
        preferred = get_membership(user_id, preferred_organization_id)
        if preferred:
            return preferred

    membership = fetch_one(
        """
        select
          om.organization_id,
          om.role,
          o.id as org_id,
          o.name as org_name,
          o.slug as org_slug,
          o.website as org_website,
          o.industry as org_industry,
          o.company_size as org_company_size,
          o.logo_url as org_logo_url,
          o.setup_completed as org_setup_completed
        from organization_members om
        join organizations o on o.id = om.organization_id
        where om.user_id = %s
        order by
          case when om.role = 'owner' then 0 when om.role = 'admin' then 1 else 2 end,
          o.created_at asc
        limit 1
        """,
        (user_id,),
    )
    if membership:
        return {
            "organization_id": membership["organization_id"],
            "role": membership.get("role", "member"),
            "organization": _org_payload(membership),
        }

    # Reclaim an org created earlier for this user if membership insert never finished.
    orphan = fetch_one(
        """
        select o.id, o.name, o.slug
        from organizations o
        where o.created_by = %s
          and not exists (
            select 1
            from organization_members om
            where om.organization_id = o.id
              and om.user_id = %s
          )
        order by o.created_at asc
        limit 1
        """,
        (user_id, user_id),
    )
    if orphan:
        execute(
            """
            insert into organization_members (organization_id, user_id, role)
            values (%s, %s, 'owner')
            on conflict (organization_id, user_id) do nothing
            """,
            (orphan["id"], user_id),
        )
        _seed_pipeline_stages(orphan["id"])
        return {
            "organization_id": orphan["id"],
            "role": "owner",
            "organization": orphan,
        }

    base_name = (user.get("name") or user.get("email") or "My").split()[0]
    org_name = f"{base_name}'s Workspace"
    slug = _unique_slug(f"{base_name}-{str(user_id)[:8]}")

    organization = fetch_one(
        """
        insert into organizations (name, slug, created_by, updated_at)
        values (%s, %s, %s, now())
        returning id, name, slug
        """,
        (org_name, slug, user_id),
    )
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create organization",
        )

    execute(
        """
        insert into organization_members (organization_id, user_id, role)
        values (%s, %s, 'owner')
        on conflict (organization_id, user_id) do nothing
        """,
        (organization["id"], user_id),
    )

    _seed_pipeline_stages(organization["id"])

    return {
        "organization_id": organization["id"],
        "role": "owner",
        "organization": organization,
    }


def list_org_stages(organization_id: str) -> list[dict]:
    return fetch_all(
        """
        select *
        from pipeline_stages
        where organization_id = %s
        order by position asc
        """,
        (organization_id,),
    )


def list_workspace_members(organization_id: str) -> list[dict]:
    rows = fetch_all(
        """
        select
          om.id as membership_id,
          om.role,
          om.created_at as joined_at,
          u.id,
          u.email,
          u.name,
          u.avatar_url,
          u.job_role,
          u.email_verified
        from organization_members om
        join users u on u.id = om.user_id
        where om.organization_id = %s
        order by
          case om.role
            when 'owner' then 0
            when 'admin' then 1
            else 2
          end,
          lower(coalesce(u.name, u.email))
        """,
        (organization_id,),
    )
    return [
        {
            "membership_id": row["membership_id"],
            "id": row["id"],
            "email": row.get("email"),
            "name": row.get("name"),
            "picture": row.get("avatar_url"),
            "job_role": row.get("job_role"),
            "email_verified": bool(row.get("email_verified")),
            "role": row.get("role") or "member",
            "joined_at": row.get("joined_at"),
        }
        for row in rows
    ]


def complete_workspace_setup(
    *,
    organization_id: str,
    user_id: str,
    name: str,
    website: str | None = None,
    industry: str | None = None,
    company_size: str | None = None,
    job_role: str | None = None,
    logo_url: str | None = None,
) -> dict:
    cleaned_name = (name or "").strip()
    if len(cleaned_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace name must be at least 2 characters.",
        )

    current = fetch_one(
        """
        select id, slug, name
        from organizations
        where id = %s
        limit 1
        """,
        (organization_id,),
    )
    if not current:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    slug = current["slug"]
    if cleaned_name.lower() != (current.get("name") or "").lower():
        slug = _unique_slug(cleaned_name, exclude_id=organization_id)

    if logo_url and len(logo_url) > 1_500_000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logo file is too large. Please use an image under 1MB.",
        )

    organization = fetch_one(
        """
        update organizations
        set name = %s,
            slug = %s,
            website = %s,
            industry = %s,
            company_size = %s,
            logo_url = %s,
            setup_completed = true,
            updated_at = now()
        where id = %s
        returning id, name, slug, website, industry, company_size, logo_url, setup_completed
        """,
        (
            cleaned_name,
            slug,
            (website or "").strip() or None,
            (industry or "").strip() or None,
            (company_size or "").strip() or None,
            logo_url or None,
            organization_id,
        ),
    )

    if job_role is not None:
        execute(
            """
            update users
            set job_role = %s, updated_at = now()
            where id = %s
            """,
            ((job_role or "").strip() or None, user_id),
        )

    return {
        "organization": _org_payload(organization),
        "job_role": (job_role or "").strip() or None,
        "status": "created",
    }
