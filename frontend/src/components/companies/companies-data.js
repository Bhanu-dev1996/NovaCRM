export const COMPANY_TYPES = [
  "Prospect",
  "Customer",
  "Partner",
  "Vendor",
  "Investor",
  "Other",
];

export const COMPANY_INDUSTRIES = [
  "Technology",
  "Software / SaaS",
  "Financial Services",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Professional Services",
  "Telecommunications",
  "Other",
];

export const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001+",
];

export const COMPANY_STATUSES = ["Active", "Inactive", "Churned"];

export const COMPANY_TYPE_STYLES = {
  Customer:
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200",
  Prospect: "bg-sky-50 text-sky-800 dark:bg-sky-950/80 dark:text-sky-200",
  Partner: "bg-violet-50 text-violet-800 dark:bg-violet-950/80 dark:text-violet-200",
  Vendor: "bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200",
  Investor: "bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200",
  Other: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
};

export const COMPANY_STATUS_STYLES = {
  Active:
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200",
  Inactive:
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  Churned: "bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200",
};

export const COMPANY_KPI_DEFINITIONS = [
  {
    id: "total",
    label: "Total Companies",
    hint: "Organizations in your workspace",
    icon: "building",
    iconClass:
      "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  },
  {
    id: "new",
    label: "New This Month",
    hint: "Created in the current month",
    icon: "sparkles",
    iconClass: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    id: "active",
    label: "Active Companies",
    hint: "Lifecycle status Active",
    icon: "badge-check",
    iconClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    id: "withoutContacts",
    label: "Companies Without Contacts",
    hint: "No linked people records",
    icon: "users",
    iconClass:
      "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
];

import {
  demoEnrichmentForEmail,
  demoLinkedDealSpecsForContact,
} from "@/components/contacts/contacts-data";

/** Primary contact emails per company (seed + sidebar). */
export const COMPANY_PRIMARY_CONTACTS = {
  "vertex solutions": ["maya.chen@vertex.io", "hannah.reeves@vertex.io"],
  "cloudscale systems": ["aisha@cloudscale.io", "leo.nguyen@cloudscale.io"],
  infosys: ["priya.nair@infosys.com", "vikram.shetty@infosys.com"],
  stripe: ["emily.chen@stripe.com", "lena.fischer@stripe.com"],
  "tata steel": ["arjun.mehta@tatasteel.com"],
  flutterwave: ["james.okonkwo@flutterwave.com"],
  salesforce: ["sophie.martin@salesforce.com"],
  "hdfc bank": ["rahul.verma@hdfcbank.com"],
  deloitte: ["olivia.brown@deloitte.com"],
  sony: ["kenji.tanaka@sony.com"],
  telefónica: ["maria.garcia@telefonica.com"],
  telefonica: ["maria.garcia@telefonica.com"],
  samsung: ["david.kim@samsung.com"],
};

/** Demo enrichments keyed by company name (location, revenue — not in DB schema). */
export const DEMO_COMPANIES = [
  {
    name: "BluePeak Technologies",
    companyType: "Customer",
    status: "Active",
    city: "San Francisco",
    state: "California",
    country: "United States",
    annualRevenue: 42000000,
    foundedYear: 2014,
    description: "Enterprise analytics and revenue intelligence platform.",
  },
  {
    name: "Vertex Cloud Solutions",
    companyType: "Customer",
    status: "Active",
    city: "Austin",
    state: "Texas",
    country: "United States",
    annualRevenue: 18500000,
    foundedYear: 2016,
  },
  {
    name: "Vertex Solutions",
    companyType: "Customer",
    status: "Active",
    city: "Austin",
    state: "Texas",
    country: "United States",
    annualRevenue: 18500000,
    foundedYear: 2016,
    notes:
      "[Alex Morgan | 2026-10-18]\nEnterprise tier evaluation in progress; legal reviewing MSA.\n\n[Sam Rivera | 2026-10-22]\nMaya requested SSO timeline — follow up with solutions engineering.",
  },
  {
    name: "Nexora Systems",
    companyType: "Prospect",
    status: "Active",
    city: "Seattle",
    state: "Washington",
    country: "United States",
    annualRevenue: 9200000,
    foundedYear: 2019,
  },
  {
    name: "BrightPath Solutions",
    companyType: "Partner",
    status: "Active",
    city: "Chicago",
    state: "Illinois",
    country: "United States",
    annualRevenue: 6800000,
    foundedYear: 2012,
  },
  {
    name: "Northstar Digital",
    companyType: "Prospect",
    status: "Active",
    city: "New York",
    state: "New York",
    country: "United States",
    annualRevenue: 24000000,
    foundedYear: 2011,
  },
  {
    name: "Elevate Financial Services",
    companyType: "Customer",
    status: "Active",
    city: "Boston",
    state: "Massachusetts",
    country: "United States",
    annualRevenue: 87000000,
    foundedYear: 2008,
  },
  {
    name: "Orbit Labs",
    companyType: "Prospect",
    status: "Active",
    city: "Denver",
    state: "Colorado",
    country: "United States",
    annualRevenue: 4100000,
    foundedYear: 2020,
  },
  {
    name: "GlobalPay Inc",
    companyType: "Partner",
    status: "Active",
    city: "Miami",
    state: "Florida",
    country: "United States",
    annualRevenue: 120000000,
    foundedYear: 2005,
  },
  {
    name: "CloudScale Systems",
    companyType: "Customer",
    status: "Active",
    city: "Austin",
    state: "Texas",
    country: "United States",
    annualRevenue: 28000000,
    foundedYear: 2017,
    description: "Cloud infrastructure and platform automation.",
    notes:
      "[Jordan Lee | 2026-10-20]\nExpansion deal on track; procurement wants phased rollout.\n\n[Casey Nguyen | 2026-10-28]\nAisha confirmed exec sponsor for Q4 steering committee.",
  },
  {
    name: "Infosys",
    companyType: "Customer",
    status: "Active",
    city: "Bengaluru",
    country: "India",
    annualRevenue: 18000000000,
    foundedYear: 1981,
    notes:
      "[Sam Rivera | 2026-10-15]\nAPAC rollout workshop scheduled with digital transformation team.\n\n[Alex Morgan | 2026-10-26]\nSecurity questionnaire returned — share data residency doc pack.",
  },
  {
    name: "Tata Steel",
    companyType: "Customer",
    status: "Active",
    city: "Mumbai",
    country: "India",
    annualRevenue: 27000000000,
    foundedYear: 1907,
  },
  {
    name: "Stripe",
    companyType: "Partner",
    status: "Active",
    city: "San Francisco",
    state: "California",
    country: "United States",
    annualRevenue: 14000000000,
    foundedYear: 2010,
  },
  {
    name: "Flutterwave",
    companyType: "Prospect",
    status: "Active",
    city: "Lagos",
    country: "Nigeria",
    annualRevenue: 250000000,
    foundedYear: 2016,
  },
  {
    name: "Salesforce",
    companyType: "Customer",
    status: "Active",
    city: "San Francisco",
    state: "California",
    country: "United States",
    annualRevenue: 34000000000,
    foundedYear: 1999,
  },
  {
    name: "HDFC Bank",
    companyType: "Customer",
    status: "Active",
    city: "Mumbai",
    country: "India",
    annualRevenue: 21000000000,
    foundedYear: 1994,
  },
  {
    name: "Deloitte",
    companyType: "Partner",
    status: "Active",
    city: "New York",
    state: "New York",
    country: "United States",
    annualRevenue: 65000000000,
    foundedYear: 1845,
  },
  {
    name: "Sony",
    companyType: "Customer",
    status: "Active",
    city: "Tokyo",
    country: "Japan",
    annualRevenue: 88000000000,
    foundedYear: 1946,
  },
  {
    name: "Telefónica",
    companyType: "Prospect",
    status: "Active",
    city: "Madrid",
    country: "Spain",
    annualRevenue: 42000000000,
    foundedYear: 1924,
  },
  {
    name: "Samsung",
    companyType: "Customer",
    status: "Active",
    city: "Seoul",
    country: "South Korea",
    annualRevenue: 200000000000,
    foundedYear: 1938,
  },
];

const demoByName = Object.fromEntries(
  DEMO_COMPANIES.map((row) => [row.name.toLowerCase(), row])
);

export function demoEnrichmentForCompanyName(name) {
  return demoByName[String(name || "").trim().toLowerCase()] || null;
}

function defaultDemoTasks(companyName) {
  const name = String(companyName || "Account").trim();
  return [
    {
      title: `${name} — account map refresh`,
      description: `Update stakeholders and champions for ${name}.`,
      priority: "high",
      dueInDays: 4,
      status: "todo",
    },
    {
      title: `${name} — pipeline review`,
      description: `Sync open leads and deals tied to ${name}.`,
      priority: "medium",
      dueInDays: 9,
      status: "doing",
    },
  ];
}

function defaultDemoMeetings(companyName) {
  const name = String(companyName || "Account").trim();
  return [
    {
      subject: `Executive check-in — ${name}`,
      body: `Quarterly alignment with ${name} leadership and account team.`,
      dueInDays: 6,
    },
  ];
}

/** Aggregated link + tab seed spec for company detail bootstrap. */
export function buildCompanyBootstrapSpec(company, contacts = []) {
  if (!company?.id) return null;
  const key = String(company.name || "").trim().toLowerCase();
  const mappedEmails = COMPANY_PRIMARY_CONTACTS[key] || [];
  const linkedEmails = (contacts || [])
    .filter((row) => String(row.companyId) === String(company.id))
    .map((row) => row.email)
    .filter(Boolean);
  const contactEmails = [
    ...new Set(
      [...mappedEmails, ...linkedEmails].map((e) => String(e).trim().toLowerCase())
    ),
  ];
  const enrichment = demoEnrichmentForCompanyName(company.name);

  const linkedLeadEmails = new Set();
  const linkedDealNames = new Set();
  for (const email of contactEmails) {
    const demo = demoEnrichmentForEmail(email);
    if (!demo) continue;
    for (const leadEmail of demo.linkedLeadEmails || []) {
      linkedLeadEmails.add(String(leadEmail).trim().toLowerCase());
    }
    for (const dealName of demo.linkedDealNames || []) {
      linkedDealNames.add(String(dealName).trim());
    }
  }

  if (
    !contactEmails.length &&
    !linkedLeadEmails.size &&
    !linkedDealNames.size &&
    !enrichment?.notes
  ) {
    return null;
  }

  return {
    contactEmails,
    linkedLeadEmails: [...linkedLeadEmails],
    linkedDealNames: [...linkedDealNames],
    notes: enrichment?.notes || "",
    tasks: defaultDemoTasks(company.name),
    meetings: defaultDemoMeetings(company.name),
  };
}

export function demoLinkedDealSpecsForCompany(name) {
  const key = String(name || "").trim().toLowerCase();
  const emails = COMPANY_PRIMARY_CONTACTS[key] || [];
  const seen = new Set();
  const specs = [];
  for (const email of emails) {
    for (const spec of demoLinkedDealSpecsForContact(email)) {
      const dealKey = spec.name.trim().toLowerCase();
      if (seen.has(dealKey)) continue;
      seen.add(dealKey);
      specs.push(spec);
    }
  }
  return specs;
}

export function formatCompanyRevenue(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n.toLocaleString("en-US")}`;
}

export function companyInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export function locationLabel(company) {
  const city = company?.city;
  const country = company?.country;
  if (city && country) return `${city}, ${country}`;
  return city || country || "—";
}
