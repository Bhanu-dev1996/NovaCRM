"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  CalendarDays,
  ListTodo,
  Mail,
  Phone,
  Plus,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  LEAD_INDUSTRIES,
  fullName,
  ownerById,
} from "@/components/leads/leads-data";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const TECH_STACK = {
  SaaS: "Salesforce/HubSpot",
  FinTech: "Stripe/Plaid",
  Healthcare: "Epic/Salesforce",
  Retail: "Shopify/Klaviyo",
  Manufacturing: "SAP/Salesforce",
  Media: "HubSpot/Marketo",
};

const ACCOUNT_BY_COMPANY = {
  "Vertex Solutions": {
    employees: "180 Employees",
    stage: "Series B",
    location: "Austin, TX",
  },
  "Northstar Ltd": {
    employees: "95 Employees",
    stage: "Series A",
    location: "London, UK",
  },
  "Orbit Labs": {
    employees: "60 Employees",
    stage: "Series A",
    location: "Seattle, WA",
  },
  "Acme Corp": {
    employees: "1,200 Employees",
    stage: "Public",
    location: "Chicago, IL",
  },
  "GlobalPay Inc": {
    employees: "420 Employees",
    stage: "Series D",
    location: "New York, NY",
  },
  "Brightline Media": {
    employees: "75 Employees",
    stage: "Series B",
    location: "Los Angeles, CA",
  },
  "CloudScale Systems": {
    employees: "280 Employees",
    stage: "Series C",
    location: "San Francisco, CA",
  },
  "BioHealth Partners": {
    employees: "310 Employees",
    stage: "Series C",
    location: "Boston, MA",
  },
  "Nexus Retail": {
    employees: "640 Employees",
    stage: "Series D",
    location: "Dallas, TX",
  },
  "Fintech Architects": {
    employees: "140 Employees",
    stage: "Series B",
    location: "New York, NY",
  },
};

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001+"];

const EMPTY_ACCOUNT_FORM = {
  mode: "create",
  name: "",
  industry: "",
  size: "",
  existingId: "",
};

const EMPTY_CONTACT_FORM = {
  mode: "create",
  firstName: "",
  lastName: "",
  email: "",
  title: "",
  companyId: "",
  existingId: "",
};

const ACCOUNT_BY_INDUSTRY = {
  SaaS: {
    employees: "120 Employees",
    stage: "Series B",
    location: "San Francisco, CA",
  },
  FinTech: {
    employees: "85 Employees",
    stage: "Series B",
    location: "New York, NY",
  },
  Healthcare: {
    employees: "340 Employees",
    stage: "Series C",
    location: "Boston, MA",
  },
  Retail: {
    employees: "210 Employees",
    stage: "Series B",
    location: "Chicago, IL",
  },
  Manufacturing: {
    employees: "520 Employees",
    stage: "Series D",
    location: "Austin, TX",
  },
  Media: {
    employees: "95 Employees",
    stage: "Series A",
    location: "Los Angeles, CA",
  },
};

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(
      /\b(inc|llc|ltd|corp|co|the|systems|technologies|technology|partners|media)\b/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(a, b) {
  const left = normalizeKey(a);
  const right = normalizeKey(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function mentions(text, ...needles) {
  const hay = String(text || "").toLowerCase();
  return needles.some((needle) => {
    const value = String(needle || "").trim().toLowerCase();
    return value.length >= 3 && hay.includes(value);
  });
}

function emailsMatch(a, b) {
  const left = String(a || "")
    .trim()
    .toLowerCase();
  const right = String(b || "")
    .trim()
    .toLowerCase();
  return Boolean(left && right && left === right);
}

function formatMoney(amount, currency = "USD") {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value.toLocaleString("en-US")}`;
  }
}

function formatWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function titleCase(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function convertedDealName(lead) {
  const match = String(lead?.notes || "").match(/opportunity\s*[—–-]\s*(.+)/i);
  if (match) return match[1].split("\n")[0].trim();
  if (lead?.company) return `${lead.company} Expansion`;
  return "Converted opportunity";
}

function accountFallback(lead) {
  if (!lead?.company) return null;
  const profile =
    ACCOUNT_BY_COMPANY[lead.company] ||
    ACCOUNT_BY_INDUSTRY[lead.industry] || {
      employees: "50 Employees",
      stage: "Seed",
      location: "Remote",
    };
  return {
    name: lead.company,
    meta: [profile.employees, profile.stage, profile.location].join(" • "),
  };
}

function contactLabel(row) {
  const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  return name || row.email || "Untitled contact";
}

function uniqueById(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    if (!row?.id || seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

function buildRelatedGroups(lead, siblings = [], catalog = {}) {
  if (!lead) return [];
  const name = fullName(lead);
  const companies = catalog.companies || [];
  const contacts = catalog.contacts || [];
  const deals = catalog.deals || [];
  const tasks = catalog.tasks || [];
  const activities = catalog.activities || [];

  const relatedCompanyIds = lead.related?.companyIds || [];
  const relatedContactIds = lead.related?.contactIds || [];
  const relatedDealIds = lead.related?.dealIds || [];

  const matchedCompany =
    companies.find((row) => row.id && row.id === lead.companyId) ||
    companies.find((row) => namesMatch(row.name, lead.company));
  const companyIds = new Set(
    [lead.companyId, matchedCompany?.id, ...relatedCompanyIds].filter(Boolean)
  );

  const fallback = accountFallback(lead);
  const linkedCompanies = uniqueById(
    companies.filter(
      (row) => companyIds.has(row.id) || namesMatch(row.name, lead.company)
    )
  );
  const accountItems = linkedCompanies.map((row) => ({
    id: row.id,
    title: row.name,
    meta:
      [
        row.size,
        row.industry,
        row.website || row.domain,
      ]
        .filter(Boolean)
        .join(" • ") ||
      (namesMatch(row.name, lead.company) ? fallback?.meta : "") ||
      "Linked account",
    href: "/companies",
    actionLabel: "View Account",
    icon: Building2,
  }));
  if (
    fallback &&
    !accountItems.some((item) => namesMatch(item.title, fallback.name))
  ) {
    accountItems.push({
      id: `account-${lead.id}`,
      title: fallback.name,
      meta: fallback.meta,
      href: "/companies",
      actionLabel: "View Account",
      icon: Building2,
    });
  }

  const relatedContacts = uniqueById(
    contacts.filter(
      (row) =>
        relatedContactIds.includes(row.id) ||
        (lead.convertedContactId && row.id === lead.convertedContactId) ||
        emailsMatch(row.email, lead.email) ||
        (row.company_id && companyIds.has(row.company_id))
    )
  );
  if (!relatedContacts.length && lead.status === "Converted") {
    relatedContacts.push({
      id: lead.convertedContactId || `contact-${lead.id}`,
      first_name: lead.firstName,
      last_name: lead.lastName,
      email: lead.email,
      title: lead.title,
    });
  }

  const relatedDeals = uniqueById(
    deals.filter(
      (row) =>
        relatedDealIds.includes(row.id) ||
        (lead.convertedDealId && row.id === lead.convertedDealId) ||
        (row.company_id && companyIds.has(row.company_id)) ||
        namesMatch(row.name, lead.company) ||
        (lead.status === "Converted" &&
          namesMatch(row.name, convertedDealName(lead)))
    )
  );
  if (!relatedDeals.length && lead.status === "Converted") {
    relatedDeals.push({
      id: lead.convertedDealId || `deal-${lead.id}`,
      name: convertedDealName(lead),
      amount: null,
      status: "open",
    });
  }

  const relatedLeads = (siblings || []).filter(
    (row) =>
      row.id !== lead.id &&
      lead.company &&
      namesMatch(row.company, lead.company)
  );

  const relatedTasks = uniqueById(
    tasks.filter(
      (row) =>
        mentions(row.title, name, lead.company, lead.email) ||
        mentions(row.description, name, lead.company, lead.email)
    )
  );

  const relatedActivities = uniqueById(
    activities.filter(
      (row) =>
        (row.company_id && companyIds.has(row.company_id)) ||
        (row.contact_id &&
          relatedContacts.some((contact) => contact.id === row.contact_id)) ||
        mentions(row.subject, name, lead.company) ||
        mentions(row.body, name, lead.company, lead.email)
    )
  );

  const groups = [
    {
      id: "accounts",
      label: "Accounts",
      addType: "account",
      items: accountItems,
    },
    {
      id: "contacts",
      label: "Contacts",
      addType: "contact",
      items: relatedContacts.map((row) => ({
        id: row.id,
        title: contactLabel(row),
        meta: [row.title, row.email].filter(Boolean).join(" • ") || "Contact",
        href: "/contacts",
        actionLabel: "View Contact",
        icon: User,
      })),
    },
  ];
  if (relatedDeals.length) {
    groups.push({
      id: "deals",
      label: "Deals",
      items: relatedDeals.map((row) => ({
        id: row.id,
        title: row.name,
        meta:
          [
            row.amount != null && row.amount !== ""
              ? formatMoney(row.amount, row.currency)
              : null,
            titleCase(row.status),
          ]
            .filter(Boolean)
            .join(" • ") || "Opportunity",
        href: "/deals",
        actionLabel: "View Deal",
        icon: Briefcase,
      })),
    });
  }
  if (relatedLeads.length) {
    groups.push({
      id: "leads",
      label: "Leads",
      items: relatedLeads.map((row) => ({
        id: row.id,
        title: fullName(row),
        meta: [row.title, row.status].filter(Boolean).join(" • "),
        actionLabel: "View Lead",
        leadId: row.id,
        icon: Users,
      })),
    });
  }
  if (relatedTasks.length) {
    groups.push({
      id: "tasks",
      label: "Tasks",
      items: relatedTasks.map((row) => ({
        id: row.id,
        title: row.title,
        meta: [
          row.priority ? `${titleCase(row.priority)} priority` : null,
          titleCase(row.status),
          formatWhen(row.due_at),
        ]
          .filter(Boolean)
          .join(" • "),
        href: "/tasks",
        actionLabel: "View Task",
        icon: ListTodo,
      })),
    });
  }

  const meetings = relatedActivities.filter((row) => row.type === "meeting");
  const emails = relatedActivities.filter((row) => row.type === "email");
  const calls = relatedActivities.filter((row) => row.type === "call");

  if (meetings.length) {
    groups.push({
      id: "meetings",
      label: "Meetings",
      items: meetings.map((row) => ({
        id: row.id,
        title: row.subject || "Untitled meeting",
        meta: formatWhen(row.due_at || row.created_at) || "Scheduled meeting",
        href: "/calendar",
        actionLabel: "View Meeting",
        icon: CalendarDays,
      })),
    });
  }
  if (emails.length) {
    groups.push({
      id: "emails",
      label: "Emails",
      items: emails.map((row) => ({
        id: row.id,
        title: row.subject || "Email",
        meta: row.body
          ? String(row.body).split("\n")[0]
          : formatWhen(row.created_at) || "Logged email",
        icon: Mail,
      })),
    });
  }
  if (calls.length) {
    groups.push({
      id: "calls",
      label: "Calls",
      items: calls.map((row) => ({
        id: row.id,
        title: row.subject || "Call",
        meta: formatWhen(row.created_at) || "Logged call",
        icon: Phone,
      })),
    });
  }

  return groups;
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatLeadCode(id) {
  const compact = String(id || "")
    .replace(/-/g, "")
    .slice(-6)
    .toUpperCase();
  return compact ? `LD-${compact}` : "LD-000000";
}

export function formatNoteDate(value) {
  if (!value) return "";
  const iso = String(value).slice(0, 10);
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return String(value);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function serializeNote(author, body) {
  const iso = new Date().toISOString().slice(0, 10);
  return `[${author} | ${iso}]\n${body}`;
}

export function parseLeadNotes(notes, fallback = {}) {
  if (!notes?.trim()) return [];
  return notes
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const match = block.match(
        /^\[(.+?)\s*\|\s*(.+?)\](?:\n([\s\S]*))?$/
      );
      if (match) {
        return {
          id: `note-${index}`,
          author: match[1].trim(),
          date: formatNoteDate(match[2].trim()) || match[2].trim(),
          body: (match[3] || "").trim(),
        };
      }
      return {
        id: `note-${index}`,
        author: fallback.author || "Team",
        date: formatNoteDate(fallback.date),
        body: block,
      };
    })
    .reverse();
}

function winLikelihood(score) {
  return Math.min(99, Math.max(12, Math.round(58 + Number(score || 0) * 0.48)));
}

function icpTier(score) {
  if (score >= 80) return "Tier 1";
  if (score >= 60) return "Tier 2";
  return "Tier 3";
}

function budgetAuthority(title = "") {
  return /vp|director|chief|founder|head|coo|cro|ceo|owner|president/i.test(
    title
  )
    ? "Verified"
    : "Inferred";
}

function aiFitCopy(lead, name) {
  const company = lead.company || "This account";
  const first = name.split(" ")[0] || "This lead";
  const role = lead.title || "decision-maker";
  const industry = lead.industry || "their market";
  return `${company} is expanding in ${industry} and is a strong ICP match. ${first}'s role as ${role} aligns with our ideal buyer persona.`;
}

const TOUCHPOINT_DOT = {
  email: "bg-primary-600",
  form: "bg-violet-500",
  call: "bg-sky-500",
  note: "bg-violet-500",
  status: "bg-violet-500",
  created: "bg-neutral-400",
};

export function buildTouchpointHistory(lead) {
  const company = lead.company || "this account";
  const items = [];

  if (
    ["Qualified", "Converted", "Nurturing"].includes(lead.status) ||
    Number(lead.score) >= 75
  ) {
    items.push({
      id: `${lead.id}-email`,
      type: "email",
      title: "AI Sequence Email Opened & Clicked",
      detail: `Subject: “NovaCRM for ${company}” (Link clicked 2x).`,
      time: "2 hours ago",
    });
  }

  if (
    lead.lastContacted ||
    ["Contacted", "Qualified", "Nurturing", "Converted"].includes(lead.status)
  ) {
    items.push({
      id: `${lead.id}-form`,
      type: "form",
      title: "Completed Demo Form Submission",
      detail: lead.notes
        ? lead.notes.split("\n")[0]
        : `Requested pricing and a walkthrough for ${company}.`,
      time: "Yesterday, 3:15 PM",
    });
  }

  items.push({
    id: `${lead.id}-created`,
    type: "created",
    title: "Lead Created & Enriched",
    detail: `Auto-enriched via ${lead.source || "inbound"}. Initial fit score assigned: ${lead.score}.`,
    time: "3 days ago",
  });

  return items;
}

function recommendedAction(lead) {
  if (lead.status === "Qualified" || Number(lead.score) >= 80) {
    return {
      title: "Schedule 20-min Architecture Review",
      detail: "Optimal outreach window: Tomorrow at 10:30 AM EST",
    };
  }
  if (!lead.lastContacted) {
    return {
      title: "Schedule intro discovery call",
      detail: "Optimal outreach window: Tomorrow at 10:30 AM EST",
    };
  }
  return {
    title: "Send a personalized follow-up",
    detail: "Optimal outreach window: Tomorrow at 10:30 AM EST",
  };
}

export function LeadDetailSheet({
  variant = "sheet",
  open,
  onOpenChange,
  lead,
  leads = [],
  owners,
  currentUserId,
  onConvert,
  onUpdateNotes,
  onPatchLead,
  onSelectLead,
}) {
  const isActive = variant === "page" || open;
  const [tab, setTab] = useState("overview");
  const [noteDraft, setNoteDraft] = useState("");
  const [postingNote, setPostingNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggedItems, setLoggedItems] = useState([]);
  const [logOpen, setLogOpen] = useState(false);
  const [logTitle, setLogTitle] = useState("");
  const [logDetail, setLogDetail] = useState("");
  const [catalog, setCatalog] = useState({
    companies: [],
    contacts: [],
    deals: [],
    tasks: [],
    activities: [],
  });
  const [addType, setAddType] = useState(null);
  const [addSaving, setAddSaving] = useState(false);
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT_FORM);
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT_FORM);

  useEffect(() => {
    if (!isActive) return;
    setTab("overview");
    setNoteDraft("");
    setPostingNote(false);
    setLoggedItems([]);
    setLogOpen(false);
    setLogTitle("");
    setLogDetail("");
    setAddType(null);
    setAccountForm(EMPTY_ACCOUNT_FORM);
    setContactForm(EMPTY_CONTACT_FORM);
  }, [isActive, lead?.id]);

  useEffect(() => {
    if (!isActive || !lead?.id) return;
    let cancelled = false;
    async function loadRelated() {
      try {
        const [companies, contacts, deals, tasks, activities] =
          await Promise.all([
            apiFetch("/api/companies?order_by=name&limit=200"),
            apiFetch("/api/contacts?order_by=created_at&limit=200"),
            apiFetch("/api/deals?order_by=created_at&limit=200"),
            apiFetch("/api/tasks?order_by=due_at&limit=200"),
            apiFetch("/api/activities?order_by=created_at&limit=200"),
          ]);
        if (cancelled) return;
        setCatalog({
          companies: companies.data || [],
          contacts: contacts.data || [],
          deals: deals.data || [],
          tasks: tasks.data || [],
          activities: activities.data || [],
        });
      } catch {
        if (!cancelled) {
          setCatalog({
            companies: [],
            contacts: [],
            deals: [],
            tasks: [],
            activities: [],
          });
        }
      }
    }
    loadRelated();
    return () => {
      cancelled = true;
    };
  }, [isActive, lead?.id]);

  const owner = useMemo(
    () => (lead ? ownerById(lead.ownerId, owners) : null),
    [lead, owners]
  );
  const activity = useMemo(() => {
    if (!lead) return [];
    return [...loggedItems, ...buildTouchpointHistory(lead)];
  }, [lead, loggedItems]);
  const relatedGroups = useMemo(
    () => buildRelatedGroups(lead, leads, catalog),
    [lead, leads, catalog]
  );
  const relatedCount = relatedGroups.reduce(
    (total, group) => total + group.items.length,
    0
  );

  if (variant === "sheet" && !open) return null;
  if (!lead) return null;

  function dismiss() {
    onOpenChange?.(false);
  }

  const name = fullName(lead);
  const authorName =
    owners?.find((row) => row.id === currentUserId)?.name ||
    owner?.name ||
    "You";
  const parsedNotes = parseLeadNotes(lead.notes, {
    author: owner?.name || "Team",
    date: lead.lastContacted || lead.createdAt,
  });
  const notesTotal = parsedNotes.length;
  const likelihood = winLikelihood(lead.score);
  const nextAction = recommendedAction(lead);
  const subtitle = [lead.title, lead.company].filter(Boolean).join(" at ");

  async function handleAddNote() {
    if (!noteDraft.trim() || postingNote) return;
    setPostingNote(true);
    try {
      await onUpdateNotes?.(
        lead.id,
        serializeNote(authorName, noteDraft.trim())
      );
      setNoteDraft("");
      toast.success("Note added");
    } catch {
      // Parent shows the error toast.
    } finally {
      setPostingNote(false);
    }
  }

  function handleLogInteraction() {
    if (!logTitle.trim()) {
      toast.error("Add a title for this interaction");
      return;
    }
    setLoggedItems((prev) => [
      {
        id: `log-${Date.now()}`,
        type: "note",
        title: logTitle.trim(),
        detail: logDetail.trim() || "Logged from the lead record.",
        time: "Just now",
      },
      ...prev,
    ]);
    setLogTitle("");
    setLogDetail("");
    setLogOpen(false);
    toast.success("Interaction logged");
  }

  async function handleSaveChanges() {
    setSaving(true);
    try {
      if (noteDraft.trim()) {
        await onUpdateNotes?.(
          lead.id,
          serializeNote(authorName, noteDraft.trim())
        );
        setNoteDraft("");
      }
      toast.success("Changes saved");
      if (variant === "sheet") dismiss();
    } catch {
      // Parent shows the error toast.
    } finally {
      setSaving(false);
    }
  }

  const linkedCompanyIds = new Set(
    [lead.companyId, ...(lead.related?.companyIds || [])].filter(Boolean)
  );
  const shownContactIds = new Set(
    (relatedGroups.find((group) => group.id === "contacts")?.items || [])
      .map((item) => item.id)
      .filter((id) => id && !String(id).startsWith("contact-"))
  );
  const availableCompanies = catalog.companies.filter(
    (row) => !linkedCompanyIds.has(row.id)
  );
  const availableContacts = catalog.contacts.filter(
    (row) => !shownContactIds.has(row.id)
  );
  const companyChoices = uniqueById([
    ...catalog.companies.filter((row) => linkedCompanyIds.has(row.id)),
    ...catalog.companies.filter((row) => namesMatch(row.name, lead.company)),
  ]);

  function openAdd(type) {
    if (type === "account") {
      setAccountForm(EMPTY_ACCOUNT_FORM);
    } else {
      setContactForm({
        ...EMPTY_CONTACT_FORM,
        companyId: lead.companyId || companyChoices[0]?.id || "",
      });
    }
    setAddType(type);
  }

  function nextRelated(kind, recordId) {
    const related = {
      companyIds: [...(lead.related?.companyIds || [])],
      contactIds: [...(lead.related?.contactIds || [])],
      dealIds: [...(lead.related?.dealIds || [])],
    };
    const key =
      kind === "account"
        ? "companyIds"
        : kind === "contact"
          ? "contactIds"
          : "dealIds";
    if (recordId && !related[key].includes(recordId)) {
      related[key].push(recordId);
    }
    return related;
  }

  async function handleAddAccount() {
    if (addSaving) return;
    const creating = accountForm.mode === "create";
    const name = accountForm.name.trim();
    const existingId = accountForm.existingId;
    if (creating && !name) {
      toast.error("Company name is required");
      return;
    }
    if (!creating && !existingId) {
      toast.error("Select a company to link");
      return;
    }
    setAddSaving(true);
    try {
      let company = creating
        ? null
        : catalog.companies.find((row) => row.id === existingId);
      if (creating) {
        const result = await apiFetch("/api/companies", {
          method: "POST",
          body: JSON.stringify({
            name,
            industry: accountForm.industry || null,
            size: accountForm.size || null,
            owner_id: currentUserId || null,
          }),
        });
        company = result.data;
        setCatalog((prev) => ({
          ...prev,
          companies: [company, ...prev.companies],
        }));
      }
      if (!company?.id) {
        toast.error("Could not link that company");
        return;
      }
      const payload = { related: nextRelated("account", company.id) };
      if (!lead.companyId && !lead.company) {
        payload.company_id = company.id;
        payload.company_name = company.name;
      } else if (!lead.companyId && namesMatch(company.name, lead.company)) {
        payload.company_id = company.id;
      }
      if (!onPatchLead) {
        toast.error("Could not save related company");
        return;
      }
      await onPatchLead(lead.id, payload);
      setAddType(null);
      toast.success(creating ? "Company added" : "Company linked");
    } catch (error) {
      toast.error(error.message || "Could not add company");
    } finally {
      setAddSaving(false);
    }
  }

  async function handleAddContact() {
    if (addSaving) return;
    const creating = contactForm.mode === "create";
    const existingId = contactForm.existingId;
    if (creating) {
      if (!contactForm.firstName.trim() || !contactForm.lastName.trim()) {
        toast.error("First and last name are required");
        return;
      }
      if (
        contactForm.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim())
      ) {
        toast.error("Enter a valid email");
        return;
      }
    } else if (!existingId) {
      toast.error("Select a contact to link");
      return;
    }
    setAddSaving(true);
    try {
      let contact = creating
        ? null
        : catalog.contacts.find((row) => row.id === existingId);
      if (creating) {
        const result = await apiFetch("/api/contacts", {
          method: "POST",
          body: JSON.stringify({
            first_name: contactForm.firstName.trim(),
            last_name: contactForm.lastName.trim(),
            email: contactForm.email.trim() || null,
            title: contactForm.title.trim() || null,
            company_id: contactForm.companyId || null,
            owner_id: currentUserId || null,
          }),
        });
        contact = result.data;
        setCatalog((prev) => ({
          ...prev,
          contacts: [contact, ...prev.contacts],
        }));
      }
      if (!contact?.id) {
        toast.error("Could not link that contact");
        return;
      }
      if (!onPatchLead) {
        toast.error("Could not save related contact");
        return;
      }
      await onPatchLead(lead.id, {
        related: nextRelated("contact", contact.id),
      });
      setAddType(null);
      toast.success(creating ? "Contact added" : "Contact linked");
    } catch (error) {
      toast.error(error.message || "Could not add contact");
    } finally {
      setAddSaving(false);
    }
  }

  const header = (
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-[13px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              {initials(name)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-[18px] font-semibold tracking-[-0.02em] text-neutral-900 dark:text-neutral-50">
                  {name}
                </h2>
                <Badge className="h-5 gap-1 border-transparent bg-emerald-50 px-1.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Sparkles className="size-3" />
                  Score {lead.score}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                {subtitle || "Lead details"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-lg bg-primary-600 px-3 text-white hover:bg-primary-700"
              onClick={onConvert}
              disabled={lead.status === "Converted"}
            >
              Convert Lead
            </Button>
            {variant === "sheet" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Close"
                onClick={dismiss}
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
  );

  const tabsPanel = (
          <Tabs value={tab} onValueChange={setTab} className="gap-4">
            <TabsList
              variant="line"
              className="h-auto w-full justify-start gap-5 rounded-none border-b border-neutral-100 p-0 dark:border-neutral-800"
            >
              <TabsTrigger
                value="overview"
                className="h-9 flex-none px-0 text-[13px] after:bg-primary-600 data-active:bg-transparent data-active:text-primary-700"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="h-9 flex-none px-0 text-[13px] after:bg-primary-600 data-active:bg-transparent data-active:text-primary-700"
              >
                Activity Timeline
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="h-9 flex-none px-0 text-[13px] after:bg-primary-600 data-active:bg-transparent data-active:text-primary-700"
              >
                Notes{notesTotal ? ` (${notesTotal})` : ""}
              </TabsTrigger>
              <TabsTrigger
                value="related"
                className="h-9 flex-none px-0 text-[13px] after:bg-primary-600 data-active:bg-transparent data-active:text-primary-700"
              >
                Related Records{relatedCount ? ` (${relatedCount})` : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-1 space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100/80 p-4 dark:from-primary-950/70 dark:via-secondary-950/40 dark:to-primary-900/50">
                <div className="flex items-start justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-primary-700 dark:text-primary-300">
                    <Sparkles className="size-3.5" />
                    Nova AI Fit Analysis
                  </p>
                  <p className="shrink-0 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {likelihood}% Win Likelihood
                  </p>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-neutral-600 dark:text-neutral-300">
                  {aiFitCopy(lead, name)}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <FitChip label="ICP Match" value={icpTier(lead.score)} />
                  <FitChip
                    label="Budget Authority"
                    value={budgetAuthority(lead.title)}
                  />
                  <FitChip
                    label="Tech Stack"
                    value={TECH_STACK[lead.industry] || "Salesforce/HubSpot"}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile label="Email address" value={lead.email || "—"} />
                <InfoTile label="Direct phone" value={lead.phone || "—"} />
                <InfoTile label="Source channel" value={lead.source || "—"} />
                <InfoTile
                  label="Owner assigned"
                  value={owner?.name || "Unassigned"}
                />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                  Next recommended action
                </p>
                <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3.5 py-3 dark:border-neutral-800 dark:bg-neutral-950">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
                    <CalendarDays className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-50">
                      {nextAction.title}
                    </p>
                    <p className="truncate text-[12px] text-neutral-500">
                      {nextAction.detail}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto shrink-0 px-0 text-primary-600"
                    onClick={() =>
                      toast.success("Action queued", {
                        description: nextAction.title,
                      })
                    }
                  >
                    Execute
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-1">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                  Touchpoint history
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto gap-1 px-0 text-[13px] font-medium text-primary-600 no-underline hover:no-underline hover:text-primary-700"
                  onClick={() => setLogOpen(true)}
                >
                  <Plus className="size-3.5" />
                  Log Interaction
                </Button>
              </div>
              <ol>
                {activity.map((item, index) => (
                  <li
                    key={item.id}
                    className="relative flex gap-3 pb-6 last:pb-0"
                  >
                    {index < activity.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-3 left-[5px] h-[calc(100%-6px)] w-px bg-neutral-200 dark:bg-neutral-800"
                      />
                    ) : null}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-white dark:ring-neutral-950",
                        TOUCHPOINT_DOT[item.type] || "bg-neutral-400"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-5 font-semibold text-neutral-900 dark:text-neutral-50">
                        {item.title}
                      </p>
                      {item.detail ? (
                        <p className="mt-0.5 text-[12px] leading-5 text-neutral-500">
                          {item.detail}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 pt-0.5 text-right text-[12px] whitespace-nowrap text-neutral-400">
                      {item.time}
                    </p>
                  </li>
                ))}
              </ol>
            </TabsContent>

            <TabsContent value="notes" className="mt-1 space-y-4">
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleAddNote();
                }}
              >
                <Input
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder="Type a new internal note..."
                  className="h-11 rounded-full border-transparent bg-primary-50 px-4 text-[13px] shadow-none placeholder:text-neutral-400 focus-visible:border-primary-200 focus-visible:ring-primary-100 dark:bg-primary-950/50"
                />
                <Button
                  type="submit"
                  disabled={!noteDraft.trim() || postingNote}
                  className="h-11 rounded-full bg-primary-600 px-5 text-[13px] font-semibold text-white hover:bg-primary-700"
                >
                  Post
                </Button>
              </form>
              {parsedNotes.length ? (
                <div className="space-y-3">
                  {parsedNotes.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50">
                          {item.author}
                        </p>
                        {item.date ? (
                          <p className="shrink-0 text-[12px] text-neutral-400">
                            {item.date}
                          </p>
                        ) : null}
                      </div>
                      {item.body ? (
                        <p className="mt-1 whitespace-pre-wrap text-[13px] leading-5 text-neutral-500">
                          {item.body}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-neutral-400">No notes yet.</p>
              )}
            </TabsContent>

            <TabsContent value="related" className="mt-1 space-y-5">
              {relatedGroups.map((group) => (
                <RelatedSection
                  key={group.id}
                  group={group}
                  onAdd={group.addType ? () => openAdd(group.addType) : undefined}
                  onSelectLead={onSelectLead}
                />
              ))}
            </TabsContent>
          </Tabs>
  );

  const footer = (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800 [&>button]:flex-none">
          <p className="mr-auto text-[12px] text-neutral-400">
            Lead ID: {formatLeadCode(lead.id)}
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={dismiss}
          >
            {variant === "page" ? "Back to Leads" : "Close"}
          </Button>
          <Button
            type="button"
            className="rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            disabled={saving}
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        </div>
  );

  const dialogs = (
    <>
    <Dialog open={logOpen} onOpenChange={setLogOpen}>
      <DialogContent
        title="Log Interaction"
        description="Add a touchpoint to this lead’s activity timeline."
        onClose={() => setLogOpen(false)}
      >
        <DialogBody className="space-y-3">
          <div>
            <Label htmlFor="log-title">Title</Label>
            <Input
              id="log-title"
              value={logTitle}
              onChange={(event) => setLogTitle(event.target.value)}
              placeholder="e.g. Follow-up call completed"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="log-detail">Details</Label>
            <Textarea
              id="log-detail"
              value={logDetail}
              onChange={(event) => setLogDetail(event.target.value)}
              rows={3}
              placeholder="What happened?"
              className="mt-1.5"
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setLogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-primary-600 text-white hover:bg-primary-700"
            onClick={handleLogInteraction}
          >
            Log Interaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog
      open={Boolean(addType)}
      onOpenChange={(open) => {
        if (!open) setAddType(null);
      }}
    >
      {addType === "account" ? (
        <DialogContent
          title="Add company"
          description="Create a new account or link one that already exists in this workspace."
          onClose={() => setAddType(null)}
        >
          <DialogBody className="space-y-3">
            <ModeToggle
              mode={accountForm.mode}
              onChange={(mode) =>
                setAccountForm((prev) => ({ ...prev, mode }))
              }
            />
            {accountForm.mode === "create" ? (
              <>
                <div>
                  <Label htmlFor="related-company-name">Company name</Label>
                  <Input
                    id="related-company-name"
                    className="mt-1.5"
                    value={accountForm.name}
                    onChange={(event) =>
                      setAccountForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="CloudScale Systems"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="related-company-industry">Industry</Label>
                    <select
                      id="related-company-industry"
                      className={nativeSelectClass}
                      value={accountForm.industry}
                      onChange={(event) =>
                        setAccountForm((prev) => ({
                          ...prev,
                          industry: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select</option>
                      {LEAD_INDUSTRIES.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="related-company-size">Size</Label>
                    <select
                      id="related-company-size"
                      className={nativeSelectClass}
                      value={accountForm.size}
                      onChange={(event) =>
                        setAccountForm((prev) => ({
                          ...prev,
                          size: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select</option>
                      {COMPANY_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : availableCompanies.length ? (
              <div>
                <Label htmlFor="related-company-existing">Existing company</Label>
                <select
                  id="related-company-existing"
                  className={nativeSelectClass}
                  value={accountForm.existingId}
                  onChange={(event) =>
                    setAccountForm((prev) => ({
                      ...prev,
                      existingId: event.target.value,
                    }))
                  }
                >
                  <option value="">Select a company</option>
                  {availableCompanies.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-[13px] text-neutral-500">
                No other companies in this workspace yet. Create one instead.
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddType(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              disabled={addSaving}
              onClick={handleAddAccount}
            >
              {addSaving ? "Saving…" : "Add Company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent
          title="Add contact"
          description="Create another person on this lead or link an existing contact."
          onClose={() => setAddType(null)}
        >
          <DialogBody className="space-y-3">
            <ModeToggle
              mode={contactForm.mode}
              onChange={(mode) =>
                setContactForm((prev) => ({ ...prev, mode }))
              }
            />
            {contactForm.mode === "create" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="related-contact-first">First name</Label>
                    <Input
                      id="related-contact-first"
                      className="mt-1.5"
                      value={contactForm.firstName}
                      onChange={(event) =>
                        setContactForm((prev) => ({
                          ...prev,
                          firstName: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="related-contact-last">Last name</Label>
                    <Input
                      id="related-contact-last"
                      className="mt-1.5"
                      value={contactForm.lastName}
                      onChange={(event) =>
                        setContactForm((prev) => ({
                          ...prev,
                          lastName: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="related-contact-email">Email</Label>
                  <Input
                    id="related-contact-email"
                    className="mt-1.5"
                    value={contactForm.email}
                    onChange={(event) =>
                      setContactForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    placeholder="name@company.com"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="related-contact-title">Title</Label>
                    <Input
                      id="related-contact-title"
                      className="mt-1.5"
                      value={contactForm.title}
                      onChange={(event) =>
                        setContactForm((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="related-contact-company">Company</Label>
                    <select
                      id="related-contact-company"
                      className={nativeSelectClass}
                      value={contactForm.companyId}
                      onChange={(event) =>
                        setContactForm((prev) => ({
                          ...prev,
                          companyId: event.target.value,
                        }))
                      }
                    >
                      <option value="">No company</option>
                      {companyChoices.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : availableContacts.length ? (
              <div>
                <Label htmlFor="related-contact-existing">Existing contact</Label>
                <select
                  id="related-contact-existing"
                  className={nativeSelectClass}
                  value={contactForm.existingId}
                  onChange={(event) =>
                    setContactForm((prev) => ({
                      ...prev,
                      existingId: event.target.value,
                    }))
                  }
                >
                  <option value="">Select a contact</option>
                  {availableContacts.map((row) => (
                    <option key={row.id} value={row.id}>
                      {contactLabel(row)}
                      {row.email ? ` · ${row.email}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-[13px] text-neutral-500">
                No other contacts in this workspace yet. Create one instead.
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddType(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              disabled={addSaving}
              onClick={handleAddContact}
            >
              {addSaving ? "Saving…" : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
    </>
  );

  if (variant === "page") {
    return (
      <>
        <div className="overflow-hidden rounded-none border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          {header}
          <div className="px-6 py-4">{tabsPanel}</div>
          {footer}
        </div>
        {dialogs}
      </>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          title={name}
          hideHeader
          maxWidth={840}
          onClose={dismiss}
          className="overflow-hidden rounded-none"
        >
          {header}
          <SheetBody className="px-6 py-4">{tabsPanel}</SheetBody>
          <SheetFooter className="justify-between px-6 [&>button]:flex-none">
            <p className="mr-auto text-[12px] text-neutral-400">
              Lead ID: {formatLeadCode(lead.id)}
            </p>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={dismiss}
            >
              Close
            </Button>
            <Button
              type="button"
              className="rounded-lg bg-primary-600 text-white hover:bg-primary-700"
              disabled={saving}
              onClick={handleSaveChanges}
            >
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {dialogs}
    </>
  );
}

const nativeSelectClass =
  "mt-1.5 h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function ModeToggle({ mode, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant={mode === "create" ? "default" : "outline"}
        className="h-9"
        onClick={() => onChange("create")}
      >
        Create new
      </Button>
      <Button
        type="button"
        variant={mode === "existing" ? "default" : "outline"}
        className="h-9"
        onClick={() => onChange("existing")}
      >
        Link existing
      </Button>
    </div>
  );
}

function RelatedSection({ group, onAdd, onSelectLead }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          {group.label}
          {group.items.length > 1 ? ` (${group.items.length})` : ""}
        </p>
        {onAdd ? (
          <Button
            type="button"
            variant="link"
            className="h-auto gap-1 px-0 text-[13px] font-medium text-primary-600 no-underline hover:no-underline hover:text-primary-700"
            onClick={onAdd}
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        ) : null}
      </div>
      {group.items.length ? (
        <div className="space-y-2">
          {group.items.map((item) => (
            <RelatedRecordCard
              key={item.id}
              item={item}
              onSelectLead={onSelectLead}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-neutral-200 px-4 py-3 text-[13px] text-neutral-400 dark:border-neutral-800">
          None yet. Use + Add to link one.
        </p>
      )}
    </section>
  );
}

function RelatedRecordCard({ item, onSelectLead }) {
  const Icon = item.icon || Building2;
  const action = item.leadId ? (
    <button
      type="button"
      className="shrink-0 text-[13px] font-medium text-primary-600 hover:text-primary-700"
      onClick={() => onSelectLead?.(item.leadId)}
    >
      {item.actionLabel || "View"}
    </button>
  ) : item.href ? (
    <Link
      href={item.href}
      className="shrink-0 text-[13px] font-medium text-primary-600 hover:text-primary-700"
    >
      {item.actionLabel || "View"}
    </Link>
  ) : null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-950">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">
          {item.title}
        </p>
        {item.meta ? (
          <p className="mt-0.5 truncate text-[12px] text-neutral-500">
            {item.meta}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function FitChip({ label, value }) {
  return (
    <span className="inline-flex items-center rounded-md bg-white/80 px-2 py-0.5 text-[11px] text-primary-800 ring-1 ring-primary-100 dark:bg-primary-950/80 dark:text-primary-200 dark:ring-primary-800">
      {label}: {value}
    </span>
  );
}

function InfoTile({ label, value }) {
  return (
    <Card size="sm" className="rounded-2xl py-3.5 ring-neutral-200/80">
      <CardContent className="px-3.5">
        <p className="text-[11px] font-medium tracking-[0.06em] text-neutral-400 uppercase">
          {label}
        </p>
        <p className="mt-1 truncate text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
