import { demoEnrichmentForEmail } from "@/components/contacts/contacts-data";

export const CONTACT_META_STORAGE_KEY = "novacrm:contact-meta";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function readAllContactMeta() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(CONTACT_META_STORAGE_KEY);
  const parsed = safeParse(raw || "{}");
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function readContactMeta(id) {
  if (!id) return {};
  return readAllContactMeta()[id] || {};
}

export function writeContactMeta(id, patch) {
  if (typeof window === "undefined" || !id) return;
  const all = readAllContactMeta();
  all[id] = { ...(all[id] || {}), ...patch };
  window.localStorage.setItem(CONTACT_META_STORAGE_KEY, JSON.stringify(all));
}

function idList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((id) => String(id || "")).filter(Boolean);
}

export function metaFromContact(contact) {
  return {
    contactType: contact.contactType || "Prospect",
    lifecycle: contact.lifecycle || "Lead",
    tags: Array.isArray(contact.tags) ? contact.tags : [],
    linkedIn: contact.linkedIn || "",
    notes: contact.notes || "",
    lastActivityAt: contact.lastActivityAt || null,
    department: contact.department || "",
    relatedLeadIds: idList(contact.relatedLeadIds),
    relatedDealIds: idList(contact.relatedDealIds),
  };
}

export function fromApiContact(row, options = {}) {
  const { meta: metaOverride, skipDemo = false } = options;
  const stored = metaOverride || readContactMeta(row.id);
  const demo = skipDemo ? null : demoEnrichmentForEmail(row.email);
  const mergedMeta = {
    contactType: "Prospect",
    lifecycle: "Lead",
    tags: [],
    linkedIn: "",
    notes: "",
    lastActivityAt: row.updated_at
      ? String(row.updated_at).slice(0, 10)
      : row.created_at
        ? String(row.created_at).slice(0, 10)
        : null,
    department: "",
    ...(demo || {}),
    ...stored,
  };

  return {
    id: row.id,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    email: row.email || "",
    phone: row.phone || "",
    title: row.title || "",
    companyId: row.company_id || "",
    ownerId: row.owner_id || demo?.ownerId || "",
    createdAt: row.created_at ? String(row.created_at).slice(0, 10) : "",
    updatedAt: row.updated_at ? String(row.updated_at).slice(0, 10) : "",
    contactType: mergedMeta.contactType,
    lifecycle: mergedMeta.lifecycle,
    tags: mergedMeta.tags,
    linkedIn: mergedMeta.linkedIn,
    notes: mergedMeta.notes,
    lastActivityAt: mergedMeta.lastActivityAt,
    department: mergedMeta.department,
    relatedLeadIds: idList(mergedMeta.relatedLeadIds),
    relatedDealIds: idList(mergedMeta.relatedDealIds),
  };
}

export function toApiContact(contact) {
  return {
    first_name: contact.firstName?.trim() || "",
    last_name: contact.lastName?.trim() || "",
    email: contact.email?.trim() || null,
    phone: contact.phone?.trim() || null,
    title: contact.title?.trim() || null,
    company_id: contact.companyId || null,
    owner_id: contact.ownerId || null,
  };
}

export function persistContactMeta(contact) {
  writeContactMeta(contact.id, metaFromContact(contact));
}

export { mapMemberToOwner } from "@/components/leads/lead-api";
