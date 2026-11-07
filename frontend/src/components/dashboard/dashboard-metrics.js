import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from "date-fns";

import { fromApiLead, mapMemberToOwner } from "@/components/leads/lead-api";
const SOURCE_COLORS = {
  Website: "#6366F1",
  Referral: "#7C3AED",
  Campaign: "#3B82F6",
  LinkedIn: "#14B8A6",
  Manual: "#EAB308",
};

const STAGE_COLORS = [
  "#6366F1",
  "#2563EB",
  "#A855F7",
  "#F97316",
  "#14B8A6",
];

function parseWhen(value) {
  if (!value) return null;
  try {
    const d = typeof value === "string" ? parseISO(value) : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function formatCount(n) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function formatMoney(amount) {
  const n = Number(amount) || 0;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function formatMoneyFull(amount) {
  return `$${Math.round(Number(amount) || 0).toLocaleString("en-US")}`;
}

function pctDelta(current, previous) {
  if (!previous) return current ? "+100%" : "0%";
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

function ownerIdForName(members, ownerLabel) {
  if (!ownerLabel || ownerLabel === "All Sales Owners") return null;
  const row = members.find((m) => m.name === ownerLabel);
  return row?.id || null;
}

export function buildSalesOwners(members) {
  const names = (members || []).map((m) => m.name).filter(Boolean);
  return ["All Sales Owners", ...names];
}

export function filterWorkspaceData(
  { leads, deals, tasks, activities },
  { ownerId, range }
) {
  const from = range?.from ? new Date(range.from) : null;
  const to = range?.to ? new Date(range.to) : null;
  to?.setHours(23, 59, 59, 999);

  function inRange(dateValue) {
    const d = parseWhen(dateValue);
    if (!d) return true;
    if (from && isBefore(d, from)) return false;
    if (to && isAfter(d, to)) return false;
    return true;
  }

  function byOwner(row) {
    if (!ownerId) return true;
    const oid = row.owner_id || row.ownerId || row.assignee_id;
    return String(oid) === String(ownerId);
  }

  return {
    leads: (leads || []).filter(
      (row) => byOwner(row) && inRange(row.created_at || row.createdAt)
    ),
    deals: (deals || []).filter(
      (row) =>
        byOwner(row) && inRange(row.updated_at || row.created_at || row.createdAt)
    ),
    tasks: (tasks || []).filter((row) => byOwner(row) && inRange(row.due_at || row.created_at)),
    activities: (activities || []).filter(
      (row) => inRange(row.created_at || row.updated_at)
    ),
  };
}

function weeklyBuckets(range, count = 4) {
  const end = range?.to ? new Date(range.to) : new Date();
  const start = range?.from
    ? new Date(range.from)
    : new Date(end.getTime() - 30 * 86_400_000);
  const span = Math.max(1, end.getTime() - start.getTime());
  const step = span / count;
  const buckets = [];
  for (let i = 0; i < count; i += 1) {
    const bStart = new Date(start.getTime() + step * i);
    const bEnd = new Date(start.getTime() + step * (i + 1));
    buckets.push({ start: bStart, end: bEnd, label: `Week ${i + 1}` });
  }
  return buckets;
}

function sumDealsInWindow(deals, start, end, { wonOnly = false, openOnly = false } = {}) {
  return deals.reduce((sum, deal) => {
    const status = String(deal.status || "open").toLowerCase();
    if (wonOnly && status !== "won") return sum;
    if (openOnly && status !== "open") return sum;
    const d = parseWhen(deal.updated_at || deal.created_at);
    if (!d || d < start || d > end) return sum;
    return sum + Number(deal.amount || 0);
  }, 0);
}

export function buildRevenueFromDeals(deals, metric, range) {
  const buckets = weeklyBuckets(range, 4);
  const rangeEnd = range?.to ? new Date(range.to) : new Date();
  const rangeStart = range?.from
    ? new Date(range.from)
    : new Date(rangeEnd.getTime() - 30 * 86_400_000);
  const spanMs = Math.max(1, rangeEnd.getTime() - rangeStart.getTime());
  const priorEnd = new Date(rangeStart.getTime() - 1);
  const priorStart = new Date(priorEnd.getTime() - spanMs);

  const series = buckets.map((bucket, index) => {
    const current = sumDealsInWindow(deals, bucket.start, bucket.end, {
      wonOnly: metric === "Net New",
      openOnly: metric === "ARR" || metric === "MRR",
    });
    const step = spanMs / buckets.length;
    const prevBucketStart = new Date(priorStart.getTime() + step * index);
    const prevBucketEnd = new Date(priorStart.getTime() + step * (index + 1));
    const previous = sumDealsInWindow(deals, prevBucketStart, prevBucketEnd, {
      wonOnly: metric === "Net New",
      openOnly: metric === "ARR" || metric === "MRR",
    });
    let scaled = current;
    if (metric === "MRR") scaled = current / 12;
    if (metric === "ARR") scaled = current;
    const prevScaled =
      metric === "MRR" ? previous / 12 : previous;
    const change =
      prevScaled > 0 ? ((scaled - prevScaled) / prevScaled) * 100 : 0;
    return {
      month: bucket.label,
      current: Math.round(scaled),
      previous: Math.round(prevScaled),
      nova: Math.round(scaled * 0.96),
      forecast: index === buckets.length - 1,
      ahead:
        prevScaled > 0
          ? `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs previous`
          : null,
      label: `${bucket.label} · ${metric}`,
    };
  });

  const latest = series[series.length - 1] || { current: 0, previous: 0 };
  const deltaPct =
    latest.previous > 0
      ? ((latest.current - latest.previous) / latest.previous) * 100
      : 0;

  const subtitles = {
    ARR: "Open pipeline value in the selected period",
    MRR: "Monthly view of open pipeline value",
    "Net New": "Booked (won) revenue in the selected period",
  };

  return {
    metric,
    subtitle: subtitles[metric] || subtitles.ARR,
    delta: `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%`,
    deltaPositive: deltaPct >= 0,
    currentTotal: latest.current,
    previousTotal: latest.previous,
    series,
  };
}

function sparkFromWeeklyCounts(rows, dateKey, weeks = 10) {
  const now = new Date();
  const out = [];
  for (let w = weeks - 1; w >= 0; w -= 1) {
    const end = new Date(now);
    end.setDate(end.getDate() - w * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    const count = rows.filter((row) => {
      const d = parseWhen(row[dateKey] || row.created_at || row.createdAt);
      return d && d >= start && d <= end;
    }).length;
    out.push(count);
  }
  return out.length ? out : [0];
}

export function buildKpiCards(allLeads, allDeals) {
  const total = allLeads.length;
  const ownerDeals = allDeals;
  const qualified = allLeads.filter((l) => {
    const status = l.status || fromApiLead(l).status;
    return status === "Qualified";
  }).length;
  const openDeals = ownerDeals.filter(
    (d) => String(d.status || "open").toLowerCase() === "open"
  );
  const pipelineValue = openDeals.reduce((s, d) => s + Number(d.amount || 0), 0);
  const wonDeals = ownerDeals.filter(
    (d) => String(d.status || "").toLowerCase() === "won"
  );
  const revenue = wonDeals.reduce((s, d) => s + Number(d.amount || 0), 0);
  const converted = allLeads.filter((l) => {
    const status = l.status || fromApiLead(l).status;
    return status === "Converted";
  }).length;
  const conversionRate = total ? (converted / total) * 100 : 0;

  const thisMonth = allLeads.filter((l) => {
    const d = parseWhen(l.created_at || l.createdAt);
    if (!d) return false;
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;
  const lastMonth = allLeads.filter((l) => {
    const d = parseWhen(l.created_at || l.createdAt);
    if (!d) return false;
    const now = new Date();
    const m = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return (
      d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear()
    );
  }).length;

  const leadSpark = sparkFromWeeklyCounts(allLeads, "created_at");
  const dealSpark = sparkFromWeeklyCounts(ownerDeals, "updated_at");

  return [
    {
      id: "total-leads",
      label: "Total Leads",
      value: formatCount(total),
      delta: pctDelta(thisMonth, lastMonth),
      deltaPositive: thisMonth >= lastMonth,
      icon: "user-plus",
      iconClass: "bg-[#EEF0FF] text-[#4F46E5]",
      href: "/leads",
      spark: leadSpark,
    },
    {
      id: "qualified-leads",
      label: "Qualified Leads",
      value: formatCount(qualified),
      delta: total ? pctDelta(qualified, total - qualified) : "0%",
      deltaPositive: qualified >= total / 2,
      icon: "user-check",
      iconClass: "bg-[#E0F2FE] text-[#0284C7]",
      href: "/leads?status=Qualified",
      spark: leadSpark,
    },
    {
      id: "open-deals",
      label: "Open Deals",
      value: formatCount(openDeals.length),
      delta: pctDelta(openDeals.length, Math.max(0, ownerDeals.length - openDeals.length)),
      deltaPositive: openDeals.length > 0,
      icon: "circle-dollar",
      iconClass: "bg-[#F3E8FF] text-[#7C3AED]",
      href: "/deals?status=open",
      spark: dealSpark,
    },
    {
      id: "pipeline-value",
      label: "Pipeline Value",
      value: formatMoney(pipelineValue),
      fullValue: formatMoneyFull(pipelineValue),
      delta: openDeals.length ? `+${openDeals.length} open` : "0 open",
      deltaPositive: pipelineValue > 0,
      icon: "wallet",
      iconClass: "bg-[#EEF0FF] text-[#6366F1]",
      href: "/deals",
      spark: dealSpark,
    },
    {
      id: "revenue",
      label: "Revenue",
      value: formatMoney(revenue),
      fullValue: formatMoneyFull(revenue),
      delta: pctDelta(revenue, pipelineValue),
      deltaPositive: revenue > 0,
      icon: "banknote",
      iconClass: "bg-[#ECFDF5] text-[#059669]",
      href: "/deals?status=won",
      spark: dealSpark,
    },
    {
      id: "conversion-rate",
      label: "Conversion Rate",
      value: `${conversionRate.toFixed(1)}%`,
      delta: `${formatCount(converted)} converted`,
      deltaPositive: conversionRate > 0,
      icon: "percent",
      iconClass: "bg-[#F3F0FF] text-[#5B21B6]",
      href: "/leads?status=Converted",
      spark: leadSpark,
      hideSpark: false,
    },
  ];
}

export function buildPipelineStages(deals, stages) {
  const ordered = [...(stages || [])].sort(
    (a, b) => Number(a.position) - Number(b.position)
  );
  const grouped = new Map();
  for (const stage of ordered) {
    grouped.set(stage.id, { stage, deals: [], value: 0 });
  }
  for (const deal of deals || []) {
    const key = deal.stage_id;
    if (!key || !grouped.has(key)) continue;
    const row = grouped.get(key);
    row.deals.push(deal);
    row.value += Number(deal.amount || 0);
  }
  const rows = [...grouped.values()];
  const maxValue = Math.max(...rows.map((r) => r.value), 1);

  return rows.map((row, index) => ({
    id: row.stage.id,
    name: row.stage.name,
    deals: row.deals.length,
    value: formatMoneyFull(row.value),
    pct: Math.round((row.value / maxValue) * 100),
    color: STAGE_COLORS[index % STAGE_COLORS.length],
    href: `/deals?stage=${row.stage.id}`,
  }));
}

export function buildLeadSources(leads) {
  const mapped = (leads || []).map((row) =>
    row.status ? row : fromApiLead(row)
  );
  const total = mapped.length || 1;
  const groups = new Map();
  for (const lead of mapped) {
    const source = lead.source || "Manual";
    groups.set(source, (groups.get(source) || 0) + 1);
  }
  return [...groups.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      count,
      color: SOURCE_COLORS[name] || SOURCE_COLORS.Manual,
      href: `/leads?source=${encodeURIComponent(name)}`,
    }));
}

export function buildTeamPerformance(deals, members, currentUserId) {
  const won = (deals || []).filter(
    (d) => String(d.status || "").toLowerCase() === "won"
  );
  const quota = 100_000;
  return (members || []).map((member) => {
    const owned = won.filter(
      (d) => String(d.owner_id) === String(member.id)
    );
    const revenue = owned.reduce((s, d) => s + Number(d.amount || 0), 0);
    const target = Math.min(100, Math.round((revenue / quota) * 100));
    const you = String(member.id) === String(currentUserId);
    let status = "Needs Attention";
    let statusClass =
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
    let barClass = "bg-amber-500";
    let valueClass = "text-amber-600 dark:text-amber-400";
    if (target >= 100) {
      status = "Exceeding";
      statusClass =
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
      barClass = "bg-emerald-500";
      valueClass = "text-emerald-600 dark:text-emerald-400";
    } else if (target >= 60) {
      status = "On Track";
      statusClass =
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
      barClass = "bg-emerald-500";
      valueClass = "text-emerald-600 dark:text-emerald-400";
    }
    return {
      name: member.name,
      role: member.email || "Sales",
      initials: member.initials,
      avatarClass: you
        ? "bg-primary-100 text-primary-700"
        : "bg-violet-100 text-violet-700",
      dealsWon: owned.length,
      revenue: formatMoneyFull(revenue),
      target,
      barClass,
      valueClass,
      status,
      statusClass,
      you,
    };
  });
}

function activityTitle(activity) {
  const type = activity.type;
  const subject = activity.subject || activity.body || "Activity";
  if (type === "meeting") return `Meeting: ${subject}`;
  if (type === "email") return `Email: ${subject}`;
  if (type === "call") return `Call: ${subject}`;
  if (type === "note") return `Note: ${subject}`;
  return subject;
}

export function buildRecentActivity(activities, members, limit = 5) {
  const memberById = Object.fromEntries(
    (members || []).map((m) => [m.id, m.name])
  );
  return [...(activities || [])]
    .sort(
      (a, b) =>
        (parseWhen(b.created_at)?.getTime() || 0) -
        (parseWhen(a.created_at)?.getTime() || 0)
    )
    .slice(0, limit)
    .map((row) => {
      let type = "deal";
      if (row.type === "meeting") type = "meeting";
      if (row.type === "email" || row.type === "call") type = "lead";
      if (row.type === "note") type = "task";
      const when = parseWhen(row.created_at);
      return {
        id: row.id,
        type,
        title: activityTitle(row),
        meta: row.user_id ? `By ${memberById[row.user_id] || "Team"}` : null,
        time: when ? formatDistanceToNow(when, { addSuffix: true }) : "Recently",
        href: row.deal_id
          ? `/deals?deal=${row.deal_id}`
          : row.contact_id
            ? `/contacts/${row.contact_id}`
            : "/calendar",
      };
    });
}

function formatDueLabel(dueAt) {
  const d = parseWhen(dueAt);
  if (!d) return "Soon";
  const now = new Date();
  if (format(d, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")) return "Today";
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (format(d, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd")) {
    return "Tomorrow";
  }
  return format(d, "EEE");
}

export function buildMyTasks(tasks, limit = 4) {
  return [...(tasks || [])]
    .filter((t) => String(t.status || "todo") !== "done")
    .sort(
      (a, b) =>
        (parseWhen(a.due_at)?.getTime() || Infinity) -
        (parseWhen(b.due_at)?.getTime() || Infinity)
    )
    .slice(0, limit)
    .map((task) => {
      const raw = String(task.priority || "medium").toLowerCase();
      const priority =
        raw === "high" ? "HIGH" : raw === "low" ? "LOW" : "MED";
      return {
        id: task.id,
        title: task.title,
        company: task.description?.slice(0, 40) || "Task",
        priority,
        due: formatDueLabel(task.due_at),
      };
    });
}

export function buildUpcomingMeetings(activities, limit = 4) {
  const now = new Date();
  return [...(activities || [])]
    .filter((row) => row.type === "meeting" && parseWhen(row.due_at))
    .filter((row) => isAfter(parseWhen(row.due_at), now))
    .sort(
      (a, b) =>
        (parseWhen(a.due_at)?.getTime() || 0) -
        (parseWhen(b.due_at)?.getTime() || 0)
    )
    .slice(0, limit)
    .map((row) => {
      const d = parseWhen(row.due_at);
      return {
        id: row.id,
        title: row.subject || "Meeting",
        with: row.body?.slice(0, 48) || "Attendees",
        when: d ? `${format(d, "MMM d")}, ${format(d, "h:mm a")}` : "Soon",
        type: "Video Call",
        icon: "video",
      };
    });
}

export function buildNovaCopilot({ leads, deals, tasks, activities }) {
  const mappedLeads = (leads || []).map((r) => (r.email ? r : fromApiLead(r)));
  const staleLeads = mappedLeads.filter((lead) => {
    if (!["Qualified", "Contacted", "Nurturing"].includes(lead.status)) {
      return false;
    }
    const last = parseWhen(lead.lastContacted || lead.last_contacted_at);
    if (!last) return true;
    const days =
      (Date.now() - last.getTime()) / 86_400_000;
    return days >= 7;
  });
  const bigDeals = (deals || []).filter(
    (d) =>
      String(d.status || "open") === "open" && Number(d.amount || 0) >= 50_000
  );
  const sources = buildLeadSources(mappedLeads);
  const topSource = sources[0];
  const openTasks = (tasks || []).filter((t) => t.status !== "done");
  const meetingsSoon = (activities || []).filter(
    (a) => a.type === "meeting" && parseWhen(a.due_at)
  );

  const items = [];
  if (staleLeads.length) {
    items.push({
      id: "c1",
      priority: "High Priority",
      priorityClass:
        "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
      recordLink: `Leads (${staleLeads.length})`,
      recordHref: "/leads?status=Qualified",
      body: `${staleLeads.length} qualified lead${staleLeads.length === 1 ? "" : "s"} need a follow-up this week.`,
      action: "Draft Batch Follow-ups",
      actionIcon: "mail",
      href: "/leads",
    });
  }
  if (bigDeals.length) {
    items.push({
      id: "c2",
      priority: "High Priority",
      priorityClass:
        "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
      recordLink: `Deals (${bigDeals.length})`,
      recordHref: "/deals",
      body: `${bigDeals.length} high-value open deal${bigDeals.length === 1 ? "" : "s"} in your pipeline.`,
      action: "Schedule Deal Review",
      actionIcon: "calendar",
      href: "/deals",
    });
  }
  if (topSource) {
    items.push({
      id: "c3",
      priority: "Medium Priority",
      priorityClass:
        "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      recordLink: "Lead Sources",
      recordHref: topSource.href,
      body: `${topSource.name} leads make up ${topSource.value}% of your pipeline (${topSource.count} records).`,
      action: "View Leads",
      actionIcon: "megaphone",
      href: topSource.href,
    });
  }
  if (openTasks.length || meetingsSoon.length) {
    items.push({
      id: "c4",
      priority: "Low Priority",
      priorityClass:
        "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
      recordLink: `Tasks (${openTasks.length})`,
      recordHref: "/tasks",
      body: `${openTasks.length} open task${openTasks.length === 1 ? "" : "s"} and ${meetingsSoon.length} upcoming meeting${meetingsSoon.length === 1 ? "" : "s"}.`,
      action: "Open Tasks",
      actionIcon: "calendar",
      href: "/tasks",
    });
  }
  return items.length ? items : buildNovaCopilotFallback();
}

function buildNovaCopilotFallback() {
  return [
    {
      id: "c0",
      priority: "Low Priority",
      priorityClass:
        "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
      recordLink: "Get started",
      recordHref: "/leads?action=create",
      body: "Add leads and deals to unlock pipeline insights and recommendations.",
      action: "Add Lead",
      actionIcon: "megaphone",
      href: "/leads?action=create",
    },
  ];
}

export function buildDashboardView({
  leads,
  deals,
  tasks,
  activities,
  stages,
  members,
  currentUserId,
  ownerLabel,
  range,
  revenueMetric,
}) {
  const ownerId = ownerIdForName(members, ownerLabel);
  const filtered = filterWorkspaceData(
    { leads, deals, tasks, activities },
    { ownerId, range }
  );
  const allLeads = (leads || []).filter((row) =>
    ownerId
      ? String(row.ownerId || row.owner_id) === String(ownerId)
      : true
  );
  const allDeals = (deals || []).filter((row) =>
    ownerId ? String(row.owner_id) === String(ownerId) : true
  );

  return {
    kpiCards: buildKpiCards(allLeads, allDeals),
    pipelineStages: buildPipelineStages(allDeals, stages),
    leadSources: buildLeadSources(allLeads),
    totalLeadsCount: allLeads.length,
    teamPerformance: buildTeamPerformance(allDeals, members, currentUserId),
    recentActivity: buildRecentActivity(filtered.activities, members),
    myTasks: buildMyTasks(
      tasks.filter((t) =>
        currentUserId
          ? !t.assignee_id || String(t.assignee_id) === String(currentUserId)
          : true
      )
    ),
    upcomingMeetings: buildUpcomingMeetings(activities),
    novaCopilot: buildNovaCopilot({
      leads: allLeads,
      deals: allDeals,
      tasks,
      activities,
    }),
    revenueView: buildRevenueFromDeals(allDeals, revenueMetric, range),
    isEmpty:
      !allLeads.length &&
      !allDeals.length &&
      !(activities || []).length &&
      !(tasks || []).length,
  };
}

export function mapWorkspaceMembers(rows) {
  return (rows || []).map(mapMemberToOwner);
}
