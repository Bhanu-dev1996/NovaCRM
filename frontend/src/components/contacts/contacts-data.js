export const CONTACT_TYPES = [
  "Customer",
  "Prospect",
  "Partner",
  "Vendor",
  "Investor",
  "Other",
];

export const LIFECYCLE_STATUSES = [
  "Active",
  "Lead",
  "Opportunity",
  "Customer",
  "Churned",
  "Inactive",
];

export const CONTACT_OWNERS = [
  { id: "alex", name: "Alex Morgan", initials: "AM" },
  { id: "jordan", name: "Jordan Lee", initials: "JL" },
  { id: "sam", name: "Sam Rivera", initials: "SR" },
  { id: "casey", name: "Casey Morgan", initials: "CM" },
  { id: "riley", name: "Riley Chen", initials: "RC" },
];

/** KPI card layout for the contacts list (values computed from API data). */
export const CONTACT_KPI_DEFINITIONS = [
  {
    id: "total",
    label: "Total Contacts",
    hint: "People in your workspace",
    icon: "users",
    iconClass:
      "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  },
  {
    id: "new",
    label: "New This Month",
    hint: "Added in the current month",
    icon: "user-plus",
    iconClass: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    id: "active",
    label: "Active Contacts",
    hint: "Lifecycle status Active or Customer",
    icon: "badge-check",
    iconClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    id: "withoutCompany",
    label: "Without Company",
    hint: "No company linked on the contact",
    icon: "building",
    iconClass:
      "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
];

export const CONTACT_TYPE_STYLES = {
  Customer:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Prospect: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  Partner:
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Vendor: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Investor: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Other: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

export const LIFECYCLE_STYLES = {
  Active:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Lead: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  Opportunity:
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Customer:
    "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  Churned: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  Inactive:
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

export const TAG_STYLES = [
  "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
];

export const CONTACT_AI_INSIGHTS = [
  {
    id: "followup",
    title: "Re-engagement window",
    body: "18 contacts with open deals have not been emailed in 14 days.",
    action: "Draft outreach",
  },
  {
    id: "champion",
    title: "Champion signal",
    body: "Priya Nair and Arjun Mehta opened your last three product updates.",
    action: "Explain insight",
  },
  {
    id: "next",
    title: "Next best action",
    body: "Schedule a QBR with top Customer contacts in FinTech this week.",
    action: "Recommend action",
  },
];

/** Demo enrichments keyed by work email (merged onto API rows in the UI). */
export const DEMO_CONTACTS = [
  {
    email: "maya.chen@vertex.io",
    linkedDealNames: ["Vertex Solutions — Enterprise"],
    contactType: "Customer",
    lifecycle: "Customer",
    tags: ["SaaS", "Champion"],
    linkedIn: "linkedin.com/in/mayachen",
    department: "Revenue",
    notes: "Executive sponsor for Vertex rollout.",
    lastActivityAt: "2026-10-31",
    ownerId: "alex",
  },
  {
    email: "aisha@cloudscale.io",
    linkedDealNames: ["CloudScale Expansion"],
    contactType: "Customer",
    lifecycle: "Customer",
    tags: ["Cloud", "Expansion"],
    linkedIn: "linkedin.com/in/aisha-cloudscale",
    department: "Growth",
    notes: "Converted lead — primary contact on expansion deal.",
    lastActivityAt: "2026-10-30",
    ownerId: "jordan",
  },
  {
    email: "priya.nair@infosys.com",
    linkedLeadEmails: ["priya@orbitlabs.ai"],
    linkedDealNames: ["Infosys Digital CRM"],
    contactType: "Customer",
    lifecycle: "Active",
    tags: ["Enterprise", "Champion"],
    linkedIn: "linkedin.com/in/priya-nair",
    department: "Digital Transformation",
    notes: "Primary stakeholder for APAC rollout. Prefers WhatsApp for urgent items.",
    lastActivityAt: "2026-10-28",
    ownerId: "sam",
  },
  {
    email: "arjun.mehta@tatasteel.com",
    linkedLeadEmails: ["dortiz@acmecorp.com"],
    linkedDealNames: ["Tata Steel — CRM Pilot"],
    contactType: "Prospect",
    lifecycle: "Opportunity",
    tags: ["Manufacturing", "Pilot"],
    linkedIn: "linkedin.com/in/arjun-mehta",
    department: "Operations",
    notes: "Evaluating CRM for plant sales teams. Budget review in Q1.",
    lastActivityAt: "2026-10-25",
    ownerId: "alex",
  },
  {
    email: "emily.chen@stripe.com",
    linkedLeadEmails: ["elena.v@globalpay.com"],
    linkedDealNames: ["GlobalPay Partnership"],
    contactType: "Partner",
    lifecycle: "Active",
    tags: ["FinTech", "Integration"],
    linkedIn: "linkedin.com/in/emilychen",
    department: "Partnerships",
    notes: "Co-marketing contact for payments integration story.",
    lastActivityAt: "2026-10-30",
    ownerId: "jordan",
  },
  {
    email: "james.okonkwo@flutterwave.com",
    contactType: "Customer",
    lifecycle: "Customer",
    tags: ["Africa", "Expansion"],
    linkedIn: "linkedin.com/in/jokonkwo",
    department: "Revenue Operations",
    notes: "Renewal discussion scheduled for November.",
    lastActivityAt: "2026-10-22",
    ownerId: "casey",
  },
  {
    email: "sophie.martin@salesforce.com",
    linkedLeadEmails: ["noah@brightline.media"],
    linkedDealNames: ["Salesforce Alliance Package"],
    contactType: "Vendor",
    lifecycle: "Active",
    tags: ["ISV", "Alliance"],
    linkedIn: "linkedin.com/in/sophiemartin",
    department: "Alliance Management",
    notes: "AppExchange listing coordination.",
    lastActivityAt: "2026-10-18",
    ownerId: "riley",
  },
  {
    email: "rahul.verma@hdfcbank.com",
    linkedLeadEmails: ["j.blake@northstar.co"],
    linkedDealNames: ["HDFC Procurement Pilot"],
    contactType: "Prospect",
    lifecycle: "Lead",
    tags: ["Banking", "Compliance"],
    linkedIn: "linkedin.com/in/rahulverma",
    department: "IT Procurement",
    notes: "Requires on-prem data residency documentation.",
    lastActivityAt: "2026-10-12",
    ownerId: "alex",
  },
  {
    email: "olivia.brown@deloitte.com",
    linkedLeadEmails: ["c.patel@fintecharch.com"],
    linkedDealNames: ["Deloitte Advisory — Referral"],
    contactType: "Partner",
    lifecycle: "Active",
    tags: ["Consulting", "Referral"],
    linkedIn: "linkedin.com/in/oliviabrown",
    department: "Customer Advisory",
    notes: "Introduced two enterprise accounts last quarter.",
    lastActivityAt: "2026-10-27",
    ownerId: "sam",
  },
  {
    email: "kenji.tanaka@sony.com",
    contactType: "Investor",
    lifecycle: "Active",
    tags: ["Media", "Board"],
    linkedIn: "linkedin.com/in/kenjitanaka",
    department: "Corporate Development",
    notes: "Interested in usage metrics for portfolio review.",
    lastActivityAt: "2026-10-20",
    ownerId: "jordan",
  },
  {
    email: "maria.garcia@telefonica.com",
    linkedLeadEmails: ["mwebb@biohealth.com"],
    linkedDealNames: ["Telefónica Madrid Hub"],
    contactType: "Customer",
    lifecycle: "Active",
    tags: ["Telco", "EMEA"],
    linkedIn: "linkedin.com/in/mariagarcia",
    department: "Customer Success",
    notes: "Champion for Madrid hub deployment.",
    lastActivityAt: "2026-10-29",
    ownerId: "casey",
  },
  {
    email: "david.kim@samsung.com",
    linkedLeadEmails: ["sofia@nexusretail.com"],
    linkedDealNames: ["Samsung Enablement Rollout"],
    contactType: "Prospect",
    lifecycle: "Opportunity",
    tags: ["Hardware", "Global"],
    linkedIn: "linkedin.com/in/davidkim",
    department: "Sales Enablement",
    notes: "Requested sandbox access for 25 users.",
    lastActivityAt: "2026-10-24",
    ownerId: "riley",
  },
];

const demoByEmail = Object.fromEntries(
  DEMO_CONTACTS.map((row) => [row.email.toLowerCase(), row])
);

/** Deal names for demo leads (contact tab + lead tab stay in sync). */
const demoDealNamesByLeadEmail = (() => {
  const map = {};
  function add(email, names) {
    const key = String(email || "").trim().toLowerCase();
    if (!key || !names?.length) return;
    map[key] = [...new Set([...(map[key] || []), ...names])];
  }
  for (const row of DEMO_CONTACTS) {
    const dealNames = row.linkedDealNames || [];
    if (dealNames.length) {
      add(row.email, dealNames);
    }
    for (const leadEmail of row.linkedLeadEmails || []) {
      add(leadEmail, dealNames);
    }
  }
  return map;
})();

export function demoEnrichmentForEmail(email) {
  return demoByEmail[String(email || "").trim().toLowerCase()] || null;
}

export function demoDealNamesForLeadEmail(email) {
  const key = String(email || "").trim().toLowerCase();
  return demoDealNamesByLeadEmail[key] || [];
}

const DEMO_DEAL_AMOUNTS = {
  "vertex solutions — enterprise": 48000,
  "cloudscale expansion": 125000,
  "infosys digital crm": 92000,
  "globalpay partnership": 67000,
  "hdfc procurement pilot": 54000,
  "salesforce alliance package": 38000,
  "tata steel — crm pilot": 72000,
  "deloitte advisory — referral": 45000,
  "telefónica madrid hub": 103000,
  "samsung enablement rollout": 88000,
};

export function demoLinkedDealSpecsForContact(email) {
  const demo = demoEnrichmentForEmail(email);
  return (demo?.linkedDealNames || []).map((name) => {
    const trimmed = String(name).trim();
    const key = trimmed.toLowerCase();
    return {
      name: trimmed,
      amount: DEMO_DEAL_AMOUNTS[key] ?? 50000,
      currency: "USD",
    };
  });
}

export function ownerById(id, owners = CONTACT_OWNERS) {
  const list = owners?.length ? owners : CONTACT_OWNERS;
  return (
    list.find((owner) => owner.id === id) ||
    list[0] || { id: "", name: "Unassigned", initials: "?" }
  );
}

export function fullName(contact) {
  return `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
}

export function initials(contact) {
  const name = fullName(contact);
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function tagStyleAt(index) {
  return TAG_STYLES[index % TAG_STYLES.length];
}
