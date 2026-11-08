export const DEFAULT_PIPELINE_NAME = "Sales Pipeline";

export const DEAL_STAGE_COLUMN_COLORS = {
  New: "bg-sky-500",
  Qualified: "bg-cyan-500",
  Proposal: "bg-violet-500",
  Negotiation: "bg-amber-500",
  "Closed Won": "bg-emerald-500",
  "Closed Lost": "bg-red-500",
  Qualify: "bg-sky-500",
  Negotiate: "bg-amber-500",
  "Closed-Won": "bg-emerald-500",
  "Closed-Lost": "bg-red-500",
};

export function dealStageAccentColor(stage) {
  if (!stage) return "bg-neutral-400";
  if (stage.is_lost) return "bg-red-500";
  if (stage.is_won) return "bg-emerald-500";
  return DEAL_STAGE_COLUMN_COLORS[stage.name] || "bg-primary-500";
}

export const DEAL_STAGE_STYLES = {
  New: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  Qualified: "bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  Proposal: "bg-violet-50 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  Negotiation: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "Closed Won": "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  "Closed Lost": "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  Qualify: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  Negotiate: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "Closed-Won": "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  "Closed-Lost": "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export const DEAL_ALL_COLUMNS = [
  { id: "name", label: "Deal Name" },
  { id: "company", label: "Company" },
  { id: "contact", label: "Contact" },
  { id: "amount", label: "Deal Value" },
  { id: "pipeline", label: "Pipeline" },
  { id: "stage", label: "Stage" },
  { id: "probability", label: "Probability" },
  { id: "closeDate", label: "Expected Close Date" },
  { id: "owner", label: "Owner" },
  { id: "createdAt", label: "Created Date" },
];

export const DEAL_DEFAULT_VISIBLE_COLUMNS = [
  "name",
  "company",
  "contact",
  "amount",
  "stage",
  "probability",
  "closeDate",
  "owner",
];

export const DEAL_PAGE_SIZES = [10, 20, 40, 50, 100];

export function dealNameInitials(name) {
  const text = String(name || "").trim();
  if (!text) return "?";
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function dealProbabilityLabel(deal, stage) {
  if (deal?.probability !== "" && deal?.probability != null) {
    return `${deal.probability}%`;
  }
  if (stage?.probability != null) {
    return `${stage.probability}%`;
  }
  return "—";
}

export const DEAL_CURRENCIES = ["INR", "USD", "EUR", "GBP"];

export const DEAL_PRIORITIES = ["Low", "Medium", "High", "Urgent"];

/** Map `deal_probability_options` rows — dropdown shows only `value` from the table. */
export function probabilityOptionsFromApi(rows) {
  return (rows || [])
    .map((row) => {
      const value = Number(row.value);
      if (!Number.isFinite(value)) return null;
      return {
        value: String(value),
        label: `${value}%`,
        position: Number(row.position) || value,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.position - b.position || Number(a.value) - Number(b.value))
    .map(({ value, label }) => ({ value, label }));
}

export const DEAL_PRIORITY_STYLES = {
  Low: "bg-neutral-100 text-neutral-600 ring-neutral-200/80",
  Medium: "bg-sky-50 text-sky-700 ring-sky-200/80",
  High: "bg-amber-50 text-amber-800 ring-amber-200/80",
  Urgent: "bg-rose-50 text-rose-700 ring-rose-200/80",
};

export const DEAL_LOSS_REASONS = [
  "Price too high",
  "Competitor selected",
  "Budget unavailable",
  "Project cancelled",
  "No response",
  "Other",
];

export const DEAL_LEAD_SOURCES = [
  "Website",
  "Referral",
  "LinkedIn",
  "Cold outreach",
  "Trade show",
  "Partner",
  "Existing customer",
  "Other",
];

export const DEAL_KPI_DEFINITIONS = [
  {
    id: "pipelineValue",
    label: "Total Pipeline Value",
    icon: "trending",
    hint: "Open opportunities",
  },
  {
    id: "openDeals",
    label: "Open Deals",
    icon: "layers",
    hint: "In active stages",
  },
  {
    id: "wonDeals",
    label: "Deals Won",
    icon: "badge-check",
    hint: "Closed successfully",
  },
  {
    id: "lostDeals",
    label: "Deals Lost",
    icon: "x-circle",
    hint: "Closed unsuccessfully",
  },
];

export function formatDealAmount(amount, currency = "INR") {
  const value = Number(amount || 0);
  if (!Number.isFinite(value)) return "—";
  try {
    const locale = currency === "INR" ? "en-IN" : undefined;
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value}`;
  }
}

export function stageById(stages, stageId) {
  return (stages || []).find((s) => String(s.id) === String(stageId));
}

export function stageIsWon(stage) {
  return Boolean(stage?.is_won);
}

export function stageIsLost(stage) {
  return Boolean(stage?.is_lost);
}

const LEGACY_STAGE_NAMES = new Set([
  "Qualify",
  "Negotiate",
  "Closed-Won",
  "Closed-Lost",
]);

/** Legacy workspace stages → canonical column (when both exist in DB). */
const LEGACY_TO_CANONICAL = {
  Qualify: "New",
  Negotiate: "Negotiation",
  "Closed-Won": "Closed Won",
  "Closed-Lost": "Closed Lost",
};

/** Drop legacy stages when the modern pipeline (New …) is present. */
export function pipelineStagesForUi(stages) {
  const all = [...(stages || [])].sort(
    (a, b) => Number(a.position || 0) - Number(b.position || 0)
  );
  const hasModernPipeline = all.some((s) => s.name === "New");
  const visible = hasModernPipeline
    ? all.filter((s) => !LEGACY_STAGE_NAMES.has(s.name))
    : all;
  return { all, visible, hasModernPipeline };
}

/** Kanban: active columns, then won, lost shown separately */
export function partitionPipelineStages(stages) {
  const sorted = [...(stages || [])].sort(
    (a, b) => Number(a.position || 0) - Number(b.position || 0)
  );
  const active = sorted.filter((s) => !s.is_won && !s.is_lost);
  const won = sorted.filter((s) => s.is_won);
  const lost = sorted.filter((s) => s.is_lost);
  return { active, won, lost, all: sorted };
}

export function dealsForStageColumn(columnStage, allStages, deals) {
  if (!columnStage) return [];
  const canonicalName = columnStage.name;
  const aliasNames = Object.entries(LEGACY_TO_CANONICAL)
    .filter(([, target]) => target === canonicalName)
    .map(([legacy]) => legacy);
  const stageIds = new Set(
    (allStages || [])
      .filter(
        (s) =>
          s.id === columnStage.id ||
          s.name === canonicalName ||
          aliasNames.includes(s.name)
      )
      .map((s) => String(s.id))
  );
  return (deals || []).filter((d) => stageIds.has(String(d.stageId)));
}

export function probabilityForStage(stage) {
  if (!stage) return 0;
  const n = Number(stage.probability);
  return Number.isFinite(n) ? n : 0;
}

export function dealStatusFromStage(stage, previous = "open") {
  if (stageIsWon(stage)) return "won";
  if (stageIsLost(stage)) return "lost";
  return previous === "won" || previous === "lost" ? "open" : previous || "open";
}

export function computeDealKpis(deals, stages) {
  const stageMap = Object.fromEntries(
    (stages || []).map((s) => [String(s.id), s])
  );
  let pipelineValue = 0;
  let open = 0;
  let won = 0;
  let lost = 0;

  for (const deal of deals || []) {
    const status = deal.status || "open";
    const stage = stageMap[String(deal.stage_id)];
    const amount = Number(deal.amount || 0);
    if (status === "won" || stageIsWon(stage)) {
      won += 1;
    } else if (status === "lost" || stageIsLost(stage)) {
      lost += 1;
    } else {
      open += 1;
      if (Number.isFinite(amount)) pipelineValue += amount;
    }
  }

  return { pipelineValue, open, won, lost };
}

export function ownerLabel(owners, ownerId) {
  if (!ownerId) return "Unassigned";
  const match = (owners || []).find((o) => String(o.id) === String(ownerId));
  if (!match) return "Unassigned";
  return match.name || match.label || match.email || "Team member";
}

export function isOpenDeal(deal, stageMap = {}) {
  const status = deal?.status || "open";
  if (status === "won" || status === "lost") return false;
  const stage = stageMap[String(deal?.stageId)];
  if (stage && (stageIsWon(stage) || stageIsLost(stage))) return false;
  return true;
}

export function overdueOpenDeals(deals, stageMap) {
  const today = new Date().toISOString().slice(0, 10);
  return (deals || []).filter(
    (deal) =>
      isOpenDeal(deal, stageMap) &&
      deal.expectedCloseDate &&
      String(deal.expectedCloseDate).slice(0, 10) < today
  );
}

export function topOpenDealsByAmount(deals, stageMap, limit = 3) {
  return (deals || [])
    .filter((deal) => isOpenDeal(deal, stageMap))
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
    .slice(0, limit);
}

export function pipelineValueByStage(deals, stages, stageMap) {
  return (stages || [])
    .map((stage) => {
      const inStage = (deals || []).filter(
        (deal) =>
          isOpenDeal(deal, stageMap) &&
          String(deal.stageId) === String(stage.id)
      );
      const value = inStage.reduce(
        (sum, deal) => sum + Number(deal.amount || 0),
        0
      );
      return {
        stageId: stage.id,
        stageName: stage.name,
        count: inStage.length,
        value,
      };
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.value - a.value);
}

export function buildDealFollowUpDraft(targets, companyMap = {}) {
  if (targets.length === 1) {
    const deal = targets[0];
    const company = companyMap[deal.companyId] || "your team";
    return `Hi,\n\nFollowing up on ${deal.name} for ${company}. We'd like to confirm timeline, stakeholders, and any blockers before the expected close.\n\nCould we schedule 20 minutes this week?\n\nBest,\nNovaCRM`;
  }
  return `Hi,\n\nChecking in on a few open opportunities that need a close-date refresh. A short call would help us align on next steps and remove blockers.\n\nAre you available tomorrow or Thursday?\n\nBest,\nNovaCRM`;
}

/** Demo enrichments for seeded deals (matched by lowercased deal name). */
const DEMO_DEAL_META_BY_NAME = {
  "vertex solutions — enterprise": {
    priority: "High",
    leadSource: "Referral",
    description: "Enterprise expansion including SSO and regional rollout.",
    nextStep: "Finalize security questionnaire",
  },
  "cloudscale expansion": {
    priority: "Urgent",
    leadSource: "Website",
    description: "Multi-year expansion across APAC subsidiaries.",
    nextStep: "Executive pricing review",
  },
  "infosys digital crm": {
    priority: "Medium",
    leadSource: "Partner",
    description: "CRM pilot for digital transformation unit.",
  },
  "hdfc procurement pilot": {
    priority: "High",
    leadSource: "Referral",
    nextStep: "Procurement committee sign-off",
  },
  "telefónica madrid hub": {
    priority: "Medium",
    leadSource: "Trade show",
  },
  "brightline media — annual": {
    priority: "Low",
    leadSource: "Existing customer",
    actualCloseDate: "2026-01-20",
  },
  "orbit labs ai suite": {
    priority: "Medium",
    lossReason: "Budget unavailable",
  },
  "northstar co — migration": {
    lossReason: "Competitor selected",
  },
};

export function demoMetaForDealName(name) {
  const key = String(name || "").trim().toLowerCase();
  return DEMO_DEAL_META_BY_NAME[key] || null;
}

export function mergeDemoDealMeta(deal) {
  const demo = demoMetaForDealName(deal?.name);
  if (!demo) return deal;
  return {
    ...deal,
    ...demo,
    tags: deal.tags?.length ? deal.tags : demo.tags || [],
  };
}
