import { demoEnrichmentForCompanyName } from "@/components/companies/companies-data";

export const COMPANY_META_STORAGE_KEY = "novacrm:company-meta";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function readAllCompanyMeta() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(COMPANY_META_STORAGE_KEY);
  const parsed = safeParse(raw || "{}");
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function readCompanyMeta(id) {
  if (!id) return {};
  return readAllCompanyMeta()[id] || {};
}

export function writeCompanyMeta(id, patch) {
  if (typeof window === "undefined" || !id) return;
  const all = readAllCompanyMeta();
  all[id] = { ...(all[id] || {}), ...patch };
  window.localStorage.setItem(COMPANY_META_STORAGE_KEY, JSON.stringify(all));
}

export function metaFromCompany(company) {
  return {
    companyType: company.companyType || "Prospect",
    status: company.status || "Active",
    annualRevenue: company.annualRevenue ?? "",
    foundedYear: company.foundedYear ?? "",
    country: company.country || "",
    state: company.state || "",
    city: company.city || "",
    address: company.address || "",
    notes: company.notes || "",
    description: company.description || "",
    logoUrl: company.logoUrl || "",
    relatedLeadIds: company.relatedLeadIds || [],
    relatedDealIds: company.relatedDealIds || [],
  };
}

export function fromApiCompany(row, options = {}) {
  const { meta: metaOverride, skipDemo = false } = options;
  const stored = metaOverride || readCompanyMeta(row.id);
  const demo = skipDemo ? null : demoEnrichmentForCompanyName(row.name);
  const merged = {
    companyType: "Prospect",
    status: "Active",
    annualRevenue: "",
    foundedYear: "",
    country: "",
    state: "",
    city: "",
    address: "",
    notes: "",
    description: "",
    logoUrl: "",
    ...(demo || {}),
    ...stored,
  };

  return {
    id: row.id,
    name: row.name || "",
    domain: row.domain || "",
    website: row.website || "",
    industry: row.industry || "",
    size: row.size || "",
    phone: row.phone || "",
    ownerId: row.owner_id || "",
    createdAt: row.created_at ? String(row.created_at).slice(0, 10) : "",
    updatedAt: row.updated_at ? String(row.updated_at).slice(0, 10) : "",
    companyType: merged.companyType,
    status: merged.status,
    annualRevenue: merged.annualRevenue,
    foundedYear: merged.foundedYear,
    country: merged.country,
    state: merged.state,
    city: merged.city,
    address: merged.address,
    notes: merged.notes,
    description: merged.description,
    logoUrl: merged.logoUrl,
    relatedLeadIds: merged.relatedLeadIds || [],
    relatedDealIds: merged.relatedDealIds || [],
  };
}

export function toApiCompany(company) {
  return {
    name: company.name?.trim() || "",
    domain: company.domain?.trim() || null,
    website: company.website?.trim() || null,
    industry: company.industry?.trim() || null,
    size: company.size?.trim() || null,
    phone: company.phone?.trim() || null,
    owner_id: company.ownerId || null,
  };
}

export function persistCompanyMeta(company) {
  writeCompanyMeta(company.id, metaFromCompany(company));
}

export { mapMemberToOwner } from "@/components/leads/lead-api";
