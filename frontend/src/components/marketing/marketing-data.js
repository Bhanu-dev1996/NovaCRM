export const CAMPAIGN_TYPES = [
  { id: "email", label: "Email campaign" },
  { id: "event", label: "Event / webinar" },
  { id: "product_announcement", label: "Product announcement" },
  { id: "newsletter", label: "Newsletter" },
  { id: "follow_up", label: "Follow-up campaign" },
];

export const CAMPAIGN_STATUSES = [
  { id: "draft", label: "Draft" },
  { id: "scheduled", label: "Scheduled" },
  { id: "active", label: "Active" },
  { id: "ready_for_review", label: "Ready for review" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
];

/** Muted track + primary active pill (templates, campaign workspace, etc.). */
export const MKT_SEGMENTED_TABS_LIST =
  "inline-flex w-fit max-w-full shrink-0 flex-wrap items-center justify-start gap-0.5 rounded-lg bg-neutral-100/80 p-0.5 text-muted-foreground dark:bg-neutral-900";

/** Minimum width for the full tab track (gray container). */
export const MKT_SEGMENTED_TABS_LIST_MIN_SM =
  "min-w-[min(100%,34rem)] sm:min-w-[34rem]";
export const MKT_SEGMENTED_TABS_LIST_MIN_MD =
  "min-w-[min(100%,26rem)] sm:min-w-[26rem]";

export const MKT_SEGMENTED_TAB_TRIGGER =
  "flex-1 min-w-[5.25rem] justify-center rounded-md px-3 py-1 text-center text-[12px] font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 data-active:border-transparent data-active:bg-primary-600 data-active:text-white data-active:shadow-sm data-active:[&_span]:text-white/85 dark:data-active:bg-primary-600 dark:data-active:text-white";

/** Wider pills when triggers include a count badge (campaign workspace). */
export const MKT_SEGMENTED_TAB_TRIGGER_WIDE =
  `${MKT_SEGMENTED_TAB_TRIGGER} min-w-[7.25rem] sm:min-w-[7.75rem]`;

/** Standalone filter chips (e.g. template category bar). */
export const MKT_FILTER_CHIP =
  "rounded-full border border-neutral-200/90 bg-white px-3 py-1 text-[12px] font-medium text-neutral-600 shadow-sm transition-colors hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-200";

export const MKT_FILTER_CHIP_ACTIVE =
  "border-primary-600 bg-primary-600 text-white shadow-sm hover:border-primary-600 hover:text-white dark:border-primary-600 dark:bg-primary-600 dark:text-white";

export const CAMPAIGN_LIST_TABS = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "scheduled", label: "Scheduled" },
  { id: "ready_for_review", label: "Ready for review" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
];

/** Full list / legacy metrics (API field ids). */
export const MARKETING_KPI_DEFINITIONS = [
  {
    id: "totalCampaigns",
    label: "Total Campaigns",
    hint: "Excluding archived",
    icon: "megaphone",
    iconClass:
      "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  },
  {
    id: "activeCampaigns",
    label: "Active Campaigns",
    hint: "In market now",
    icon: "activity",
    iconClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    id: "totalAudience",
    label: "Total Audience",
    hint: "Across saved segments",
    icon: "users",
    iconClass: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    id: "campaignsCompleted",
    label: "Campaigns Completed",
    hint: "Marked complete",
    icon: "check",
    iconClass:
      "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
];

/** Marketing overview (Phase 1 planning — no bulk send). */
export const MARKETING_OVERVIEW_KPIS = [
  {
    id: "pipeline",
    label: "In pipeline",
    hint: "Scheduled, active, or ready for review",
    icon: "pipeline",
    iconClass:
      "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  },
  {
    id: "drafts",
    label: "Draft campaigns",
    hint: "Still in planning",
    icon: "draft",
    iconClass:
      "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  },
  {
    id: "totalAudience",
    label: "Audience reach",
    hint: "Contacts in saved segments",
    icon: "users",
    iconClass: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    id: "templates",
    label: "Templates",
    hint: "Reusable message content",
    icon: "template",
    iconClass:
      "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
];

export const PHASE1_WORKFLOW_STEPS = [
  {
    step: 1,
    title: "Audience",
    detail: "Build a segment with filters or contact picks.",
    href: "/marketing/audiences?action=create",
  },
  {
    step: 2,
    title: "Template",
    detail: "Save subject and body for reuse in campaigns.",
    href: "/marketing/templates",
  },
  {
    step: 3,
    title: "Campaign",
    detail: "Draft content, audience, and schedule.",
    href: "/marketing/campaigns?create=1",
  },
  {
    step: 4,
    title: "Review",
    detail: "Mark ready for review when copy and audience look good.",
    href: "/marketing/campaigns?tab=ready_for_review",
  },
  {
    step: 5,
    title: "Results",
    detail: "Complete the campaign and record send metrics.",
    href: "/marketing/campaigns?tab=completed",
  },
];

export function computeMarketingOverviewMetrics({
  campaigns = [],
  segments = [],
  templates = [],
  metrics = {},
}) {
  const live = (campaigns || []).filter((c) => c.status !== "archived");
  const pipeline = live.filter((c) =>
    ["scheduled", "active", "ready_for_review"].includes(c.status)
  ).length;
  const drafts = live.filter((c) => c.status === "draft").length;
  const readyForReview = live.filter((c) => c.status === "ready_for_review").length;
  const audience =
    metrics.totalAudience ??
    (segments || []).reduce((n, s) => n + (s.contactCount || 0), 0);
  return {
    pipeline,
    drafts,
    readyForReview,
    totalAudience: audience,
    templates: (templates || []).length,
    recordedOpens: metrics.totalOpens ?? 0,
    completed: metrics.campaignsCompleted ?? 0,
  };
}

/** @deprecated use MARKETING_KPI_DEFINITIONS */
export const OVERVIEW_KPI_KEYS = MARKETING_KPI_DEFINITIONS;

export const SEGMENT_FILTER_FIELDS = [
  { id: "has_email", label: "Has email", type: "boolean" },
  { id: "owner", label: "Contact owner", type: "uuid" },
  { id: "company", label: "Company", type: "text" },
  { id: "industry", label: "Industry", type: "text" },
  { id: "created_date", label: "Created date", type: "date" },
];

export const FILTER_OPERATORS = [
  { id: "equals", label: "equals" },
  { id: "before", label: "before" },
  { id: "after", label: "after" },
  { id: "is_true", label: "is true" },
];

export const TEMPLATE_CATEGORIES = [
  "General",
  "Announcement",
  "Event",
  "Newsletter",
  "Follow-up",
];

export const MKT_VARIABLES = [
  { token: "{{contact.first_name}}", label: "Contact first name" },
  { token: "{{company.name}}", label: "Company name" },
  { token: "{{campaign.name}}", label: "Campaign name" },
];

export const MKT_TEMPLATE_PREVIEW_CTX = {
  firstName: "Alex",
  lastName: "Morgan",
  companyName: "Vertex.io",
  campaignName: "Spring product launch",
};

export function draftFieldsForCompare(draft) {
  return {
    name: (draft?.name || "").trim(),
    category: draft?.category || "General",
    subject: draft?.subject || "",
    body: draft?.body || "",
    visibility: draft?.visibility || "workspace",
  };
}

export function applyMktTemplateVariables(text, draft = {}) {
  const ctx = {
    ...MKT_TEMPLATE_PREVIEW_CTX,
    campaignName:
      (draft.name || "").trim() || MKT_TEMPLATE_PREVIEW_CTX.campaignName,
  };
  const map = {
    "{{contact.first_name}}": ctx.firstName,
    "{{contact.last_name}}": ctx.lastName,
    "{{company.name}}": ctx.companyName,
    "{{campaign.name}}": ctx.campaignName,
  };
  let out = String(text || "");
  for (const [key, val] of Object.entries(map)) {
    out = out.split(key).join(val);
  }
  return out;
}

export function campaignTypeLabel(id) {
  return CAMPAIGN_TYPES.find((t) => t.id === id)?.label || id || "—";
}

export function campaignStatusLabel(id) {
  return CAMPAIGN_STATUSES.find((s) => s.id === id)?.label || id || "—";
}

export function campaignStatusStyles(status) {
  const map = {
    draft: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    scheduled: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    ready_for_review:
      "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    completed: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    archived: "bg-neutral-100 text-neutral-500",
  };
  return map[status] || map.draft;
}

export function filterCampaigns(campaigns, { tab = "all", status, type, owner, query = "" }) {
  let list = [...(campaigns || [])];
  if (tab !== "all") {
    list = list.filter((c) => c.status === tab);
  }
  if (status && status !== "all") list = list.filter((c) => c.status === status);
  if (type && type !== "all") list = list.filter((c) => c.campaignType === type);
  if (owner && owner !== "all") list = list.filter((c) => String(c.ownerId) === owner);
  const q = query.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.objective?.toLowerCase().includes(q) ||
        c.segmentName?.toLowerCase().includes(q)
    );
  }
  return list;
}

export function formatPercentRate(rate) {
  if (rate == null || Number.isNaN(Number(rate))) return "—";
  return `${(Number(rate) * 100).toFixed(1)}%`;
}

export function formatSchedule(campaign) {
  const sched = campaign?.schedule || {};
  if (sched.sendDate) {
    return `${sched.sendDate}${sched.sendTime ? ` · ${sched.sendTime}` : ""}${
      sched.timezone ? ` (${sched.timezone})` : ""
    }`;
  }
  if (campaign?.scheduledAt) {
    try {
      return new Date(campaign.scheduledAt).toLocaleString();
    } catch {
      return "—";
    }
  }
  return "Not scheduled";
}

export function upcomingCampaigns(campaigns) {
  return (campaigns || [])
    .filter((c) => ["scheduled", "active", "ready_for_review"].includes(c.status))
    .sort((a, b) => {
      const da = new Date(a.scheduledAt || 0).getTime();
      const db = new Date(b.scheduledAt || 0).getTime();
      return da - db;
    });
}

export function recentCampaigns(campaigns, limit = 5) {
  return [...(campaigns || [])]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, limit);
}

export function draftCampaigns(campaigns) {
  return (campaigns || []).filter((c) => c.status === "draft");
}
