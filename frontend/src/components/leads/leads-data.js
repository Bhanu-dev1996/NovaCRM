export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Nurturing",
  "Converted",
  "Lost",
];

export const LEAD_SOURCES = [
  "Website",
  "Referral",
  "LinkedIn",
  "Campaign",
  "Manual",
];

export const LEAD_INDUSTRIES = [
  "SaaS",
  "FinTech",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Media",
];

export const LEAD_OWNERS = [
  { id: "alex", name: "Alex Morgan", initials: "AM" },
  { id: "jordan", name: "Jordan Lee", initials: "JL" },
  { id: "sam", name: "Sam Rivera", initials: "SR" },
  { id: "casey", name: "Casey Morgan", initials: "CM" },
  { id: "riley", name: "Riley Chen", initials: "RC" },
];

export const LEAD_COMPANIES = [
  "Vertex Solutions",
  "Northstar Ltd",
  "Orbit Labs",
  "Acme Corp",
  "GlobalPay Inc",
  "Brightline Media",
  "CloudScale Systems",
  "BioHealth Partners",
  "Nexus Retail",
  "Fintech Architects",
];

export const LEAD_SUMMARY = [
  {
    id: "total",
    label: "Total Leads",
    value: "2,480",
    delta: "+12.4%",
    deltaPositive: true,
    icon: "users",
    iconClass: "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  },
  {
    id: "new",
    label: "New This Month",
    value: "324",
    delta: "+8.1%",
    deltaPositive: true,
    icon: "sparkles",
    iconClass: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    id: "qualified",
    label: "Qualified Leads",
    value: "186",
    delta: "+5.6%",
    deltaPositive: true,
    icon: "badge-check",
    iconClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    id: "conversion",
    label: "Conversion Rate",
    value: "24.8%",
    delta: "+1.9% pts",
    deltaPositive: true,
    icon: "trending-up",
    iconClass: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
];

export const LEAD_STAGES = [
  { id: "New", label: "New", count: 842, color: "bg-sky-500" },
  { id: "Contacted", label: "Contacted", count: 618, color: "bg-amber-500" },
  { id: "Qualified", label: "Qualified", count: 186, color: "bg-emerald-500" },
  { id: "Nurturing", label: "Nurturing", count: 412, color: "bg-violet-500" },
  { id: "Converted", label: "Converted", count: 298, color: "bg-primary-600" },
  { id: "Lost", label: "Lost", count: 124, color: "bg-neutral-400" },
];

export const LEAD_STATUS_STYLES = {
  New: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  Contacted: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Qualified:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Nurturing:
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Converted:
    "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  Lost: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

export const LEAD_SOURCE_STYLES = {
  Website: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  Referral:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  LinkedIn: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Campaign:
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Manual: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

export const LEAD_AI_INSIGHTS = [
  {
    id: "ai1",
    title: "Follow-up gap",
    body: "12 high-scoring leads have not been contacted in 7 days.",
    action: "Draft Follow-up",
  },
  {
    id: "ai2",
    title: "Source advantage",
    body: "Referral leads have a higher qualification rate this month.",
    action: "Explain Insight",
  },
  {
    id: "ai3",
    title: "Next best action",
    body: "Recommended next action: Schedule a follow-up with top-scoring open leads.",
    action: "Recommend Next Action",
  },
];

export const INITIAL_LEADS = [
  {
    id: "l1",
    firstName: "Maya",
    lastName: "Chen",
    email: "maya.chen@vertex.io",
    phone: "+1 (415) 555-0142",
    company: "Vertex Solutions",
    title: "VP of Growth",
    source: "Website",
    industry: "SaaS",
    score: 92,
    status: "Qualified",
    ownerId: "alex",
    lastContacted: "2026-10-24",
    createdAt: "2026-10-02",
    notes: "Requested enterprise pricing and SSO options.",
  },
  {
    id: "l2",
    firstName: "Jordan",
    lastName: "Blake",
    email: "j.blake@northstar.co",
    phone: "+1 (646) 555-0198",
    company: "Northstar Ltd",
    title: "Head of Sales Ops",
    source: "Referral",
    industry: "FinTech",
    score: 88,
    status: "Contacted",
    ownerId: "jordan",
    lastContacted: "2026-10-22",
    createdAt: "2026-09-28",
    notes: "Introduced by Marcus Vance. Interested in pipeline analytics.",
  },
  {
    id: "l3",
    firstName: "Priya",
    lastName: "Nair",
    email: "priya@orbitlabs.ai",
    phone: "+1 (312) 555-0177",
    company: "Orbit Labs",
    title: "Founder",
    source: "LinkedIn",
    industry: "SaaS",
    score: 76,
    status: "Nurturing",
    ownerId: "sam",
    lastContacted: "2026-10-18",
    createdAt: "2026-09-12",
    notes: "Evaluating Q1 budget approval.",
  },
  {
    id: "l4",
    firstName: "Daniel",
    lastName: "Ortiz",
    email: "dortiz@acmecorp.com",
    phone: "+1 (212) 555-0114",
    company: "Acme Corp",
    title: "Revenue Operations Manager",
    source: "Campaign",
    industry: "Manufacturing",
    score: 64,
    status: "New",
    ownerId: "casey",
    lastContacted: null,
    createdAt: "2026-10-25",
    notes: "",
  },
  {
    id: "l5",
    firstName: "Elena",
    lastName: "Vasquez",
    email: "elena.v@globalpay.com",
    phone: "+1 (305) 555-0160",
    company: "GlobalPay Inc",
    title: "Director of Partnerships",
    source: "Website",
    industry: "FinTech",
    score: 81,
    status: "Qualified",
    ownerId: "riley",
    lastContacted: "2026-10-21",
    createdAt: "2026-10-08",
    notes: "Security review scheduled with architecture team.",
  },
  {
    id: "l6",
    firstName: "Noah",
    lastName: "Kim",
    email: "noah@brightline.media",
    phone: "+1 (503) 555-0133",
    company: "Brightline Media",
    title: "COO",
    source: "Manual",
    industry: "Media",
    score: 58,
    status: "Contacted",
    ownerId: "alex",
    lastContacted: "2026-10-15",
    createdAt: "2026-09-30",
    notes: "Asked for case studies in media vertical.",
  },
  {
    id: "l7",
    firstName: "Aisha",
    lastName: "Rahman",
    email: "aisha@cloudscale.io",
    phone: "+1 (737) 555-0188",
    company: "CloudScale Systems",
    title: "Chief Revenue Officer",
    source: "Referral",
    industry: "SaaS",
    score: 95,
    status: "Converted",
    ownerId: "jordan",
    lastContacted: "2026-10-20",
    createdAt: "2026-08-19",
    notes: "Converted to opportunity — CloudScale Expansion.",
  },
  {
    id: "l8",
    firstName: "Marcus",
    lastName: "Webb",
    email: "mwebb@biohealth.com",
    phone: "+1 (617) 555-0129",
    company: "BioHealth Partners",
    title: "IT Director",
    source: "LinkedIn",
    industry: "Healthcare",
    score: 49,
    status: "Lost",
    ownerId: "sam",
    lastContacted: "2026-09-26",
    createdAt: "2026-08-04",
    notes: "Chose incumbent vendor for this cycle.",
  },
  {
    id: "l9",
    firstName: "Sofia",
    lastName: "Almeida",
    email: "sofia@nexusretail.com",
    phone: "+1 (206) 555-0155",
    company: "Nexus Retail",
    title: "Ecommerce Lead",
    source: "Campaign",
    industry: "Retail",
    score: 71,
    status: "Nurturing",
    ownerId: "casey",
    lastContacted: "2026-10-19",
    createdAt: "2026-10-05",
    notes: "Waiting on holiday season bandwidth.",
  },
  {
    id: "l10",
    firstName: "Chris",
    lastName: "Patel",
    email: "c.patel@fintecharch.com",
    phone: "+1 (408) 555-0107",
    company: "Fintech Architects",
    title: "Product Lead",
    source: "Website",
    industry: "FinTech",
    score: 84,
    status: "New",
    ownerId: "riley",
    lastContacted: null,
    createdAt: "2026-10-26",
    notes: "Downloaded ROI calculator from landing page.",
  },
];

export const LEAD_ACTIVITY = {
  l1: [
    {
      id: "a1",
      type: "email",
      title: "Sent enterprise pricing overview",
      time: "Oct 24 · 2:14 PM",
      actor: "Alex Morgan",
    },
    {
      id: "a2",
      type: "call",
      title: "Discovery call completed",
      time: "Oct 22 · 11:00 AM",
      actor: "Alex Morgan",
    },
    {
      id: "a3",
      type: "status",
      title: "Status changed to Qualified",
      time: "Oct 22 · 11:40 AM",
      actor: "System",
    },
  ],
  default: [
    {
      id: "a0",
      type: "note",
      title: "Lead created from inbound capture",
      time: "Recently",
      actor: "System",
    },
  ],
};

export function ownerById(id, owners = LEAD_OWNERS) {
  const list = owners?.length ? owners : LEAD_OWNERS;
  return (
    list.find((owner) => owner.id === id) ||
    list[0] || { id: "", name: "Unassigned", initials: "?" }
  );
}

export function fullName(lead) {
  return `${lead.firstName} ${lead.lastName}`.trim();
}

export function scoreTone(score) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-neutral-400";
}
