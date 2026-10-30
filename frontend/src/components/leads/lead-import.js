import { LEAD_OWNERS, LEAD_SOURCES, LEAD_STATUSES } from "@/components/leads/leads-data";

export const LEAD_CSV_TEMPLATE = [
  "first_name,last_name,email,phone,company,title,source,industry,status,owner,score,notes",
  'Maya,Chen,maya.chen@example.com,+1 (415) 555-0142,Vertex Solutions,VP of Growth,Website,SaaS,New,Alex Morgan,80,"Interested in enterprise plan"',
  "Jordan,Blake,j.blake@example.com,+1 (646) 555-0198,Northstar Ltd,Head of Sales Ops,Referral,FinTech,Contacted,Jordan Lee,72,",
].join("\n");

const HEADER_ALIASES = {
  first_name: ["first_name", "firstname", "first name", "given_name", "given name"],
  last_name: ["last_name", "lastname", "last name", "surname", "family_name"],
  email: ["email", "work_email", "work email", "email_address", "email address"],
  phone: ["phone", "phone_number", "phone number", "mobile", "tel"],
  company: ["company", "company_name", "company name", "organization", "account"],
  title: ["title", "job_title", "job title", "role", "position"],
  source: ["source", "lead_source", "lead source"],
  industry: ["industry", "sector"],
  status: ["status", "lead_status", "lead status", "stage"],
  owner: ["owner", "owner_id", "ownerid", "lead_owner", "lead owner", "assignee"],
  score: ["score", "lead_score", "lead score"],
  notes: ["notes", "note", "comments", "comment"],
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

export function parseCsv(text) {
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

  if (!fieldByIndex.includes("first_name") || !fieldByIndex.includes("email")) {
    throw new Error(
      "CSV must include first_name (or First Name) and email columns"
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

function matchSource(value) {
  if (!value) return "Manual";
  const match = LEAD_SOURCES.find(
    (item) => item.toLowerCase() === String(value).trim().toLowerCase()
  );
  return match || "Manual";
}

function matchStatus(value) {
  if (!value) return "New";
  const match = LEAD_STATUSES.find(
    (item) => item.toLowerCase() === String(value).trim().toLowerCase()
  );
  return match || "New";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function matchOwnerId(value, owners = LEAD_OWNERS, fallbackId = "") {
  const list = owners?.length ? owners : LEAD_OWNERS;
  const fallback = fallbackId || list[0]?.id || "";
  if (!value) return fallback;

  const raw = String(value).trim().toLowerCase();
  if (UUID_RE.test(raw)) {
    const byUuid = list.find((owner) => owner.id.toLowerCase() === raw);
    return byUuid?.id || fallback;
  }

  const byId = list.find((owner) => owner.id.toLowerCase() === raw);
  if (byId && UUID_RE.test(byId.id)) return byId.id;

  const byName = list.find((owner) => owner.name.toLowerCase() === raw);
  if (byName && UUID_RE.test(byName.id)) return byName.id;

  const byEmail = list.find(
    (owner) => String(owner.email || "").toLowerCase() === raw
  );
  if (byEmail && UUID_RE.test(byEmail.id)) return byEmail.id;

  return fallback;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function mapCsvRowsToLeads(
  rows,
  { existingEmails = [], owners = LEAD_OWNERS, fallbackOwnerId = "" } = {}
) {
  const seen = new Set(
    existingEmails.map((email) => String(email || "").trim().toLowerCase())
  );
  const valid = [];
  const errors = [];
  const defaultOwnerId = matchOwnerId("", owners, fallbackOwnerId);

  rows.forEach((item) => {
    const firstName = String(item.first_name || "").trim();
    const lastName = String(item.last_name || "").trim();
    const email = String(item.email || "").trim().toLowerCase();
    const issues = [];

    if (!firstName) issues.push("first name is required");
    if (!lastName) issues.push("last name is required");
    if (!email) issues.push("email is required");
    else if (!isValidEmail(email)) issues.push("email is invalid");
    else if (seen.has(email)) issues.push("duplicate email");

    if (issues.length) {
      errors.push({
        rowNumber: item.rowNumber,
        message: issues.join(", "),
        email: email || "—",
      });
      return;
    }

    seen.add(email);

    const scoreRaw = Number(item.score);
    const score = Number.isFinite(scoreRaw)
      ? Math.min(100, Math.max(0, scoreRaw))
      : 50;

    valid.push({
      id: `import-${Date.now()}-${item.rowNumber}-${Math.random().toString(36).slice(2, 7)}`,
      firstName,
      lastName,
      email,
      phone: String(item.phone || "").trim(),
      company: String(item.company || "").trim() || "Unknown Company",
      title: String(item.title || "").trim() || "—",
      source: matchSource(item.source),
      industry: String(item.industry || "").trim() || "SaaS",
      status: matchStatus(item.status),
      ownerId: matchOwnerId(item.owner, owners, defaultOwnerId),
      score,
      notes: String(item.notes || "").trim(),
      lastContacted: null,
      createdAt: new Date().toISOString().slice(0, 10),
    });
  });

  return { valid, errors };
}

export function downloadLeadCsvTemplate() {
  const blob = new Blob([LEAD_CSV_TEMPLATE], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "novacrm-leads-template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
