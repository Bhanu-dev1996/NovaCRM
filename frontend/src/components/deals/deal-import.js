import { CONTACT_OWNERS } from "@/components/contacts/contacts-data";
import {
  DEAL_CURRENCIES,
  DEAL_LEAD_SOURCES,
  DEAL_PRIORITIES,
  DEFAULT_PIPELINE_NAME,
  dealStatusFromStage,
  probabilityForStage,
  stageById,
} from "@/components/deals/deals-data";

export const DEAL_CSV_TEMPLATE = [
  "name,amount,currency,stage,company,contact_email,owner,expected_close_date,lead_source,priority,pipeline,probability,notes",
  'Acme Expansion,450000,INR,Qualified,Vertex Solutions,maya.chen@vertex.io,Alex Morgan,2026-05-15,Referral,High,Sales Pipeline,25,"Follow up on security review"',
  'Pilot — Northstar Ltd,120000,INR,New,Northstar Ltd,,Jordan Lee,2026-04-01,Website,Medium,Sales Pipeline,,',
].join("\n");

const HEADER_ALIASES = {
  name: [
    "name",
    "deal_name",
    "deal name",
    "deal",
    "opportunity",
    "opportunity_name",
    "opportunity name",
    "title",
  ],
  amount: [
    "amount",
    "value",
    "deal_value",
    "deal value",
    "deal_amount",
    "deal amount",
  ],
  currency: ["currency", "deal_currency", "deal currency"],
  stage: ["stage", "deal_stage", "deal stage", "pipeline_stage", "status"],
  company: [
    "company",
    "company_name",
    "company name",
    "account",
    "organization",
  ],
  contact_email: [
    "contact_email",
    "contact email",
    "contact",
    "email",
    "primary_contact_email",
  ],
  owner: ["owner", "owner_id", "ownerid", "deal_owner", "deal owner", "assignee"],
  expected_close_date: [
    "expected_close_date",
    "expected close date",
    "close_date",
    "close date",
    "expected_close",
    "closing_date",
  ],
  lead_source: ["lead_source", "lead source", "source"],
  priority: ["priority", "deal_priority", "deal priority"],
  pipeline: ["pipeline", "pipeline_name", "pipeline name"],
  probability: ["probability", "win_probability", "win probability", "win_%"],
  notes: ["notes", "note", "comments", "comment", "description"],
};

const STAGE_LOOKUP_ALIASES = {
  qualify: "New",
  negotiate: "Negotiation",
  "closed-won": "Closed Won",
  "closed_won": "Closed Won",
  "closedwon": "Closed Won",
  "closed-lost": "Closed Lost",
  "closed_lost": "Closed Lost",
  "closedlost": "Closed Lost",
};

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseDealCsv(text) {
  const lines = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row");
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const fieldByIndex = headers.map((header) => {
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((alias) => normalizeHeader(alias) === header)) {
        return field;
      }
    }
    return null;
  });

  if (!fieldByIndex.includes("name") || !fieldByIndex.includes("amount")) {
    throw new Error(
      "CSV must include name (or deal_name) and amount (or value) columns"
    );
  }

  return lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line);
    const row = {};
    fieldByIndex.forEach((field, cellIndex) => {
      if (!field) return;
      row[field] = cells[cellIndex] || "";
    });
    return { rowNumber: index + 2, ...row };
  });
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function matchOwnerId(value, owners = CONTACT_OWNERS, fallbackId = "") {
  const list = owners?.length ? owners : CONTACT_OWNERS;
  const fallback = fallbackId || list[0]?.id || "";
  if (!value) return fallback;

  const raw = String(value).trim().toLowerCase();
  if (UUID_RE.test(raw)) {
    const byUuid = list.find((owner) => owner.id.toLowerCase() === raw);
    return byUuid?.id || fallback;
  }

  const byId = list.find((owner) => owner.id.toLowerCase() === raw);
  if (byId?.id) return byId.id;

  const byName = list.find(
    (owner) => String(owner.name || "").trim().toLowerCase() === raw
  );
  if (byName?.id) return byName.id;

  const byEmail = list.find(
    (owner) => String(owner.email || "").trim().toLowerCase() === raw
  );
  if (byEmail?.id) return byEmail.id;

  return fallback;
}

function normalizeStageKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function matchStageId(stageValue, stages, defaultStageId) {
  const fallback = defaultStageId || stages[0]?.id || "";
  if (!String(stageValue || "").trim()) return fallback;

  const raw = normalizeStageKey(stageValue);
  const aliasName = STAGE_LOOKUP_ALIASES[raw.replace(/\s/g, "_")] || raw;
  const targetName =
    typeof aliasName === "string" && aliasName.includes(" ")
      ? aliasName
      : STAGE_LOOKUP_ALIASES[raw] || stageValue.trim();

  const match = (stages || []).find(
    (stage) =>
      normalizeStageKey(stage.name) === normalizeStageKey(targetName) ||
      normalizeStageKey(stage.name) === raw
  );
  return match?.id || fallback;
}

function matchCompanyId(companyName, companies) {
  if (!String(companyName || "").trim()) return { id: "", missing: false };
  const raw = String(companyName).trim().toLowerCase();
  const match = (companies || []).find(
    (company) => String(company.name || "").trim().toLowerCase() === raw
  );
  if (match?.id) return { id: match.id, missing: false };
  return { id: "", missing: true };
}

function matchContactId(email, contacts) {
  if (!String(email || "").trim()) return { id: "", missing: false };
  const raw = String(email).trim().toLowerCase();
  const match = (contacts || []).find(
    (contact) => String(contact.email || "").trim().toLowerCase() === raw
  );
  if (match?.id) return { id: match.id, missing: false };
  return { id: "", missing: true };
}

function matchCurrency(value) {
  if (!value) return "INR";
  const upper = String(value).trim().toUpperCase();
  const match = DEAL_CURRENCIES.find((item) => item === upper);
  return match || "INR";
}

function matchLeadSource(value) {
  if (!value) return "";
  const raw = String(value).trim().toLowerCase();
  const match = DEAL_LEAD_SOURCES.find(
    (item) => item.toLowerCase() === raw
  );
  return match || String(value).trim();
}

function matchPriority(value) {
  if (!value) return "";
  const raw = String(value).trim().toLowerCase();
  const match = DEAL_PRIORITIES.find((item) => item.toLowerCase() === raw);
  return match || "";
}

function parseCloseDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function parseProbability(value, stage) {
  if (value !== "" && value != null) {
    const n = Number(value);
    if (Number.isFinite(n)) return String(Math.min(100, Math.max(0, n)));
  }
  return String(probabilityForStage(stage));
}

export function mapCsvRowsToDeals(
  rows,
  {
    existingNames = [],
    stages = [],
    companies = [],
    contacts = [],
    owners = CONTACT_OWNERS,
    fallbackOwnerId = "",
    defaultStageId = "",
  } = {}
) {
  const seen = new Set(
    existingNames.map((name) => String(name || "").trim().toLowerCase())
  );
  const valid = [];
  const errors = [];
  const defaultOwnerId = matchOwnerId("", owners, fallbackOwnerId);
  const openStage =
    stages.find((s) => !s.is_won && !s.is_lost) || stages[0];
  const defaultStage = defaultStageId || openStage?.id || "";

  rows.forEach((item) => {
    const name = String(item.name || "").trim();
    const amountRaw = String(item.amount ?? "").replace(/,/g, "").trim();
    const amount = Number(amountRaw);
    const issues = [];

    if (!name) issues.push("deal name is required");
    else if (seen.has(name.toLowerCase())) issues.push("duplicate deal name");

    if (!amountRaw) issues.push("amount is required");
    else if (!Number.isFinite(amount) || amount < 0) {
      issues.push("amount must be a valid number");
    }

    const companyMatch = matchCompanyId(item.company, companies);
    if (companyMatch.missing) {
      issues.push(`company not found: ${String(item.company).trim()}`);
    }

    const contactMatch = matchContactId(item.contact_email, contacts);
    if (contactMatch.missing) {
      issues.push(`contact not found: ${String(item.contact_email).trim()}`);
    }

    const closeDate = parseCloseDate(item.expected_close_date);
    if (item.expected_close_date?.trim() && !closeDate) {
      issues.push("expected close date is invalid (use YYYY-MM-DD)");
    }

    if (issues.length) {
      errors.push({
        rowNumber: item.rowNumber,
        message: issues.join(", "),
        name: name || "—",
      });
      return;
    }

    seen.add(name.toLowerCase());

    const stageId = matchStageId(item.stage, stages, defaultStage);
    const stage = stageById(stages, stageId);
    const status = dealStatusFromStage(stage, "open");
    const ownerId = matchOwnerId(item.owner, owners, defaultOwnerId);

    valid.push({
      name,
      amount,
      currency: matchCurrency(item.currency),
      stageId,
      status,
      companyId: companyMatch.id,
      contactId: contactMatch.id,
      ownerId,
      expectedCloseDate: closeDate,
      leadSource: matchLeadSource(item.lead_source),
      priority: matchPriority(item.priority),
      pipelineName: String(item.pipeline || "").trim() || DEFAULT_PIPELINE_NAME,
      probability: parseProbability(item.probability, stage),
      notes: String(item.notes || "").trim(),
    });
  });

  return { valid, errors };
}

export async function parseDealCsvFile(
  file,
  {
    existingNames = [],
    stages = [],
    companies = [],
    contacts = [],
    owners = CONTACT_OWNERS,
    fallbackOwnerId = "",
    defaultStageId = "",
  } = {}
) {
  const text = await file.text();
  const rows = parseDealCsv(text);
  return mapCsvRowsToDeals(rows, {
    existingNames,
    stages,
    companies,
    contacts,
    owners,
    fallbackOwnerId,
    defaultStageId,
  });
}

export function downloadDealCsvTemplate() {
  const blob = new Blob([DEAL_CSV_TEMPLATE], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "novacrm-deals-template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
