export const KPI_CARDS = [
  {
    id: "total-leads",
    label: "Total Leads",
    value: "2,480",
    delta: "+12.8%",
    deltaPositive: true,
    icon: "user-plus",
    iconClass: "bg-[#EEF0FF] text-[#4F46E5]",
    href: "/reports?metric=total-leads",
    spark: [18, 22, 19, 24, 28, 26, 32, 30, 34, 38],
  },
  {
    id: "qualified-leads",
    label: "Qualified Leads",
    value: "684",
    delta: "+8.4%",
    deltaPositive: true,
    icon: "user-check",
    iconClass: "bg-[#E0F2FE] text-[#0284C7]",
    href: "/reports?metric=qualified-leads",
    spark: [12, 14, 13, 16, 15, 18, 17, 20, 22, 21],
  },
  {
    id: "open-deals",
    label: "Open Deals",
    value: "156",
    delta: "+6.2%",
    deltaPositive: true,
    icon: "circle-dollar",
    iconClass: "bg-[#F3E8FF] text-[#7C3AED]",
    href: "/deals?status=open",
    spark: [40, 42, 41, 45, 44, 48, 47, 50, 52, 51],
  },
  {
    id: "pipeline-value",
    label: "Pipeline Value",
    value: "$428.5k",
    fullValue: "$428,500",
    delta: "+14.6%",
    deltaPositive: true,
    icon: "wallet",
    iconClass: "bg-[#EEF0FF] text-[#6366F1]",
    href: "/reports?metric=pipeline-value",
    spark: [28, 30, 32, 31, 36, 38, 40, 42, 45, 48],
  },
  {
    id: "revenue",
    label: "Revenue",
    value: "$124.8k",
    fullValue: "$124,800",
    delta: "+10.3%",
    deltaPositive: true,
    icon: "banknote",
    iconClass: "bg-[#ECFDF5] text-[#059669]",
    href: "/reports?metric=revenue",
    spark: [20, 22, 21, 25, 24, 27, 29, 28, 32, 35],
  },
  {
    id: "conversion-rate",
    label: "Conversion Rate",
    value: "24.6%",
    delta: "+2.1% pts",
    deltaPositive: true,
    icon: "percent",
    iconClass: "bg-[#F3F0FF] text-[#5B21B6]",
    spark: [18, 19, 19, 20, 21, 21, 22, 23, 24, 25],
  },
];

export const REVENUE_METRICS = ["MRR", "ARR", "Net New"];

export const REVENUE_BY_METRIC = {
  ARR: {
    delta: "+14.6%",
    subtitle: "Annual recurring revenue with Nova AI trendline",
    series: [
      {
        month: "Week 1",
        current: 72000,
        previous: 64000,
        nova: 70000,
        ahead: null,
      },
      {
        month: "Week 2",
        current: 86000,
        previous: 71000,
        nova: 82000,
        ahead: "+12.1% ahead of target",
      },
      {
        month: "Week 3",
        current: 98400,
        previous: 78000,
        nova: 94000,
        ahead: "+18.4% ahead of target",
      },
      {
        month: "Week 4",
        current: 112000,
        previous: 86000,
        nova: 108000,
        ahead: "+16.2% ahead of target",
      },
      {
        month: "Forecast",
        current: 124800,
        previous: 92000,
        nova: 121000,
        forecast: true,
        ahead: "+14.6% ahead of target",
      },
    ],
  },
  MRR: {
    delta: "+9.8%",
    subtitle: "Monthly recurring revenue trajectory",
    series: [
      {
        month: "Week 1",
        current: 9800,
        previous: 9100,
        nova: 9600,
        ahead: null,
      },
      {
        month: "Week 2",
        current: 10400,
        previous: 9400,
        nova: 10100,
        ahead: "+8.2% ahead of target",
      },
      {
        month: "Week 3",
        current: 11200,
        previous: 9800,
        nova: 10800,
        ahead: "+11.4% ahead of target",
      },
      {
        month: "Week 4",
        current: 11800,
        previous: 10200,
        nova: 11500,
        ahead: "+10.1% ahead of target",
      },
      {
        month: "Forecast",
        current: 12400,
        previous: 10800,
        nova: 12100,
        forecast: true,
        ahead: "+9.8% ahead of target",
      },
    ],
  },
  "Net New": {
    delta: "+22.4%",
    subtitle: "Net-new booked revenue vs prior period",
    series: [
      {
        month: "Week 1",
        current: 8200,
        previous: 6400,
        nova: 7800,
        ahead: null,
      },
      {
        month: "Week 2",
        current: 11400,
        previous: 8200,
        nova: 10200,
        ahead: "+21.6% ahead of target",
      },
      {
        month: "Week 3",
        current: 14600,
        previous: 9800,
        nova: 13200,
        ahead: "+28.1% ahead of target",
      },
      {
        month: "Week 4",
        current: 12800,
        previous: 10400,
        nova: 12400,
        ahead: "+19.4% ahead of target",
      },
      {
        month: "Forecast",
        current: 16200,
        previous: 11800,
        nova: 15400,
        forecast: true,
        ahead: "+22.4% ahead of target",
      },
    ],
  },
};

/** Scale factor when dashboard date/owner filters change (demo data). */
export function revenueFilterScale(dateRange, owner, customRange) {
  const rangeScale = {
    Today: 0.42,
    Yesterday: 0.4,
    "Last 7 Days": 0.72,
    "Last 30 Days": 1,
    "This Month": 1.08,
    "Last Month": 0.96,
    "Custom Range": 1,
  };
  let rangeFactor = rangeScale[dateRange] || 1;
  if (customRange?.from && customRange?.to) {
    const days = Math.max(
      1,
      Math.round(
        (customRange.to.getTime() - customRange.from.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
    if (dateRange === "Custom Range" || !rangeScale[dateRange]) {
      rangeFactor = Math.min(1.5, Math.max(0.4, days / 30));
    }
  }
  const ownerScale =
    !owner || owner === "All Sales Owners"
      ? 1
      : owner === "Jordan Lee"
        ? 0.94
        : owner === "Sam Rivera"
          ? 0.88
          : owner === "Casey Morgan"
            ? 0.76
            : owner === "Riley Chen"
              ? 0.61
              : 0.82;
  return rangeFactor * ownerScale;
}

export function buildRevenueView(metric, dateRange, owner, customRange) {
  const config = REVENUE_BY_METRIC[metric] || REVENUE_BY_METRIC.ARR;
  const scale = revenueFilterScale(dateRange, owner, customRange);
  const series = config.series.map((point) => {
    const current = Math.round(point.current * scale);
    const previous = Math.round(point.previous * scale);
    const nova = Math.round(point.nova * scale);
    const change =
      previous > 0 ? ((current - previous) / previous) * 100 : 0;
    return {
      ...point,
      current,
      previous,
      nova,
      label: `${point.month} Active ${metric}`,
      ahead:
        point.ahead == null
          ? null
          : `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs previous`,
    };
  });

  const latest = series[series.length - 1];
  const currentTotal = latest.current;
  const previousTotal = latest.previous;
  const deltaPct =
    previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

  return {
    metric,
    subtitle: config.subtitle,
    delta: `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%`,
    deltaPositive: deltaPct >= 0,
    currentTotal,
    previousTotal,
    series,
  };
}

export const PIPELINE_STAGES = [
  {
    id: "qualification",
    name: "Qualification",
    deals: 48,
    value: "$142,000",
    pct: 100,
    color: "#6366F1",
    href: "/deals?stage=qualification",
  },
  {
    id: "discovery",
    name: "Discovery",
    deals: 38,
    value: "$118,500",
    pct: 84,
    color: "#2563EB",
    href: "/deals?stage=discovery",
  },
  {
    id: "proposal",
    name: "Proposal",
    deals: 26,
    value: "$84,200",
    pct: 59,
    color: "#A855F7",
    href: "/deals?stage=proposal",
  },
  {
    id: "negotiation",
    name: "Negotiation",
    deals: 14,
    value: "$46,800",
    pct: 33,
    color: "#F97316",
    href: "/deals?stage=negotiation",
  },
  {
    id: "won",
    name: "Won",
    deals: 30,
    value: "$98,400",
    pct: 69,
    color: "#14B8A6",
    href: "/deals?stage=won",
  },
];

export const LEAD_SOURCES = [
  {
    name: "Website",
    value: 42,
    count: 1042,
    color: "#6366F1",
    href: "/leads?source=website",
  },
  {
    name: "Referrals",
    value: 24,
    count: 595,
    color: "#7C3AED",
    href: "/leads?source=referrals",
  },
  {
    name: "Campaigns",
    value: 18,
    count: 446,
    color: "#3B82F6",
    href: "/leads?source=campaigns",
  },
  {
    name: "Social",
    value: 11,
    count: 273,
    color: "#14B8A6",
    href: "/leads?source=social",
  },
  {
    name: "Other / Outbound",
    value: 5,
    count: 124,
    color: "#EAB308",
    href: "/leads?source=other",
  },
];

export const TOTAL_LEADS_COUNT = 2480;

export const TEAM_PERFORMANCE = [
  {
    name: "Sarah Chen",
    role: "Enterprise AE",
    initials: "SC",
    avatarClass: "bg-primary-100 text-primary-700",
    dealsWon: 18,
    revenue: "$48,200",
    target: 114,
    barClass: "bg-emerald-500",
    valueClass: "text-emerald-600 dark:text-emerald-400",
    status: "Exceeding",
    statusClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    name: "Marcus Vance",
    role: "Senior AE",
    initials: "MV",
    avatarClass: "bg-violet-100 text-violet-700",
    dealsWon: 14,
    revenue: "$36,500",
    target: 102,
    barClass: "bg-emerald-500",
    valueClass: "text-emerald-600 dark:text-emerald-400",
    status: "On Track",
    statusClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    name: "Elena Rostova",
    role: "Mid-Market AE",
    initials: "ER",
    avatarClass: "bg-sky-100 text-sky-700",
    dealsWon: 11,
    revenue: "$24,800",
    target: 88,
    barClass: "bg-amber-500",
    valueClass: "text-amber-600 dark:text-amber-400",
    status: "Needs Attention",
    statusClass:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  {
    name: "Alex Morgan",
    role: "RevOps Lead",
    you: true,
    initials: "AM",
    avatarClass: "bg-primary-100 text-primary-700",
    dealsWon: 6,
    revenue: "$15,300",
    target: 95,
    barClass: "bg-primary-500",
    valueClass: "text-primary-600 dark:text-primary-400",
    status: "On Track",
    statusClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
];

export const RECENT_ACTIVITY = [
  {
    id: "a1",
    type: "lead",
    title: "New lead created: David Miller from Apex Corp",
    meta: "Added by Alex Morgan",
    time: "12m ago",
    href: "/leads?id=david-miller",
  },
  {
    id: "a2",
    type: "deal",
    title: "Deal moved to Proposal: CloudScale Expansion ($68,000)",
    meta: "Updated by Sarah Chen",
    time: "45m ago",
    href: "/deals?id=cloudscale-expansion",
  },
  {
    id: "a3",
    type: "task",
    title:
      "Follow-up task completed: Sent technical architecture review to FinTech Systems",
    meta: null,
    time: "2h ago",
    href: "/tasks?id=fintech-architecture",
  },
  {
    id: "a4",
    type: "meeting",
    title: "Meeting scheduled: Executive Discovery with BioHealth Labs",
    meta: "Scheduled by Alex Morgan",
    time: "3h ago",
    href: "/calendar?id=biohealth-discovery",
  },
  {
    id: "a5",
    type: "won",
    title:
      "Deal marked Won: Nexus Retail Annual Enterprise License ($42,500)",
    meta: "Closed by Sarah Chen",
    time: "4h ago",
    href: "/deals?id=nexus-retail",
  },
];

export const MY_TASKS = [
  {
    id: "t1",
    title: "Follow up with Acme Corp",
    company: "Acme Corp",
    priority: "HIGH",
    due: "Today",
  },
  {
    id: "t2",
    title: "Send proposal to Northstar Ltd",
    company: "Northstar Ltd",
    priority: "HIGH",
    due: "Tomorrow",
  },
  {
    id: "t3",
    title: "Review qualified leads",
    company: "Lead inbox",
    priority: "MED",
    due: "Wed",
  },
  {
    id: "t4",
    title: "Prepare the quarterly forecast",
    company: "Finance",
    priority: "LOW",
    due: "Fri",
  },
];

export const UPCOMING_MEETINGS = [
  {
    id: "m1",
    title: "Product Demo & Pricing Review",
    with: "Vertex Solutions",
    when: "Today, 3:30 PM",
    type: "Video Call",
    icon: "video",
  },
  {
    id: "m2",
    title: "Security Architecture Review",
    with: "GlobalPay Inc",
    when: "Tomorrow, 10:00 AM",
    type: "Video Call",
    icon: "shield",
  },
  {
    id: "m3",
    title: "Quarterly Business Review",
    with: "Orbit Labs",
    when: "Thu, 4:00 PM",
    type: "In Person",
    icon: "pin",
  },
  {
    id: "m4",
    title: "Contract Negotiation Call",
    with: "Northstar Ltd",
    when: "Fri, 11:00 AM",
    type: "Video Call",
    icon: "video",
  },
];

export const NOVA_COPILOT = [
  {
    id: "c1",
    priority: "High Priority",
    priorityClass:
      "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    recordLink: "Filtered Leads (12)",
    recordHref: "/leads?status=qualified&stale=48h",
    body: "12 qualified leads have not received a follow-up in the last 48 hours.",
    action: "Draft Batch Follow-ups",
    actionIcon: "mail",
    href: "/leads?status=qualified&stale=48h&action=follow-up",
  },
  {
    id: "c2",
    priority: "High Priority",
    priorityClass:
      "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    recordLink: "View Deals (3)",
    recordHref: "/deals?risk=high",
    body: "Three high-value deals may require attention before the end of the month.",
    action: "Schedule Deal Review",
    actionIcon: "calendar",
    href: "/calendar?action=schedule&context=deal-review",
  },
  {
    id: "c3",
    priority: "Medium Priority",
    priorityClass:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    recordLink: "Lead Sources",
    recordHref: "/leads?source=referrals",
    body: "Referral leads are converting better than the current average (+34% win rate).",
    action: "Expand Referral Incentives",
    actionIcon: "megaphone",
    href: "/marketing?focus=referrals",
  },
  {
    id: "c4",
    priority: "Low Priority",
    priorityClass:
      "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
    recordLink: "Meetings (2)",
    recordHref: "/calendar?filter=upcoming",
    body: "Two discovery calls this week have no attached notes or next steps recorded.",
    action: "Add Meeting Notes",
    actionIcon: "calendar",
    href: "/calendar?action=notes",
  },
];

export const SALES_OWNERS = [
  "All Sales Owners",
  "Alex Morgan",
  "Jordan Lee",
  "Sam Rivera",
  "Casey Morgan",
  "Riley Chen",
];

export const DATE_RANGES = [
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
  "Last Month",
  "Custom Range",
];
