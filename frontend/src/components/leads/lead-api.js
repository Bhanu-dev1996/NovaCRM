import { normalizeLeadTimelineDates } from "@/lib/lead-dates";

export function mapMemberToOwner(member) {
  const name = member?.name || member?.email || "Unknown";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    id: member.id,
    name,
    initials: initials || "?",
    email: member.email || "",
  };
}

function idList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((id) => String(id || "")).filter(Boolean);
}

export function parseLeadRelated(related) {
  const raw = related && typeof related === "object" ? related : {};
  return {
    companyIds: idList(raw.companyIds || raw.company_ids),
    contactIds: idList(raw.contactIds || raw.contact_ids),
    dealIds: idList(raw.dealIds || raw.deal_ids),
    excludedCompanyIds: idList(
      raw.excludedCompanyIds || raw.excluded_company_ids
    ),
    excludedContactIds: idList(
      raw.excludedContactIds || raw.excluded_contact_ids
    ),
  };
}

export function fromApiLead(row) {
  const { createdAt, lastContacted } = normalizeLeadTimelineDates(
    row.created_at,
    row.last_contacted_at
  );

  return {
    id: row.id,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    email: row.email || "",
    phone: row.phone || "",
    company: row.company_name || "",
    companyId: row.company_id || "",
    title: row.title || "",
    source: row.source || "Manual",
    industry: row.industry || "",
    status: row.status || "New",
    ownerId: row.owner_id || "",
    score: Number(row.score ?? 50),
    notes: row.notes || "",
    lastContacted,
    createdAt,
    convertedContactId: row.converted_contact_id || "",
    convertedDealId: row.converted_deal_id || "",
    related: parseLeadRelated(row.related),
  };
}

export function toApiLead(lead) {
  return {
    first_name: lead.firstName,
    last_name: lead.lastName,
    email: lead.email,
    phone: lead.phone || null,
    company_name: lead.company || null,
    title: lead.title && lead.title !== "—" ? lead.title : null,
    source: lead.source || "Manual",
    industry: lead.industry || null,
    status: lead.status || "New",
    owner_id: lead.ownerId || null,
    score: Number(lead.score ?? 50),
    notes: lead.notes || null,
    last_contacted_at: lead.lastContacted || null,
  };
}
