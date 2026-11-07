export function uniqueById(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    if (!row?.id || seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

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

export function namesMatch(a, b) {
  const left = normalizeKey(a);
  const right = normalizeKey(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

export function emailsMatch(a, b) {
  const left = String(a || "")
    .trim()
    .toLowerCase();
  const right = String(b || "")
    .trim()
    .toLowerCase();
  return Boolean(left && right && left === right);
}

function excludedCompanyIds(lead) {
  return new Set((lead.related?.excludedCompanyIds || []).map(String));
}

function excludedContactIds(lead) {
  return new Set((lead.related?.excludedContactIds || []).map(String));
}

export function collectLeadCompanyIds(lead, companies = []) {
  const matched =
    companies.find((row) => row.id && row.id === lead.companyId) ||
    companies.find((row) => namesMatch(row.name, lead.company));
  return new Set(
    [lead.companyId, matched?.id, ...(lead.related?.companyIds || [])].filter(
      Boolean
    )
  );
}

export function resolveLinkedCompanies(lead, companies = []) {
  const excluded = excludedCompanyIds(lead);
  const companyIds = collectLeadCompanyIds(lead, companies);
  const linked = uniqueById(
    companies.filter(
      (row) =>
        !excluded.has(String(row.id)) &&
        (companyIds.has(row.id) || namesMatch(row.name, lead.company))
    )
  );
  if (
    lead.company &&
    !linked.some((row) => namesMatch(row.name, lead.company))
  ) {
    linked.push({
      id: `lead-company-${lead.id}`,
      name: lead.company,
      industry: lead.industry || "",
      website: "",
    });
  }
  return linked;
}

export function resolveLinkedDeals(deals = [], lead, contacts = []) {
  const seen = new Set();
  const out = [];

  function push(deal) {
    if (!deal?.id || seen.has(String(deal.id))) return;
    seen.add(String(deal.id));
    out.push(deal);
  }

  const relatedDealIds = new Set((lead?.related?.dealIds || []).map(String));
  const convertedDealId = lead?.convertedDealId
    ? String(lead.convertedDealId)
    : "";
  const convertedContactId = lead?.convertedContactId
    ? String(lead.convertedContactId)
    : "";

  for (const deal of deals) {
    const id = String(deal.id);
    if (relatedDealIds.has(id)) push(deal);
    if (convertedDealId && id === convertedDealId) push(deal);
    if (
      convertedContactId &&
      String(deal.contact_id || "") === convertedContactId
    ) {
      push(deal);
    }
  }

  const linkedContacts = resolveLinkedContacts(lead, contacts);
  const contactIds = new Set(
    linkedContacts.map((row) => String(row.id)).filter(Boolean)
  );

  for (const deal of deals) {
    const cid = String(deal.contact_id || "");
    if (cid && contactIds.has(cid)) push(deal);
  }

  return out;
}

export function formatDealMoney(amount, currency = "USD") {
  if (amount == null || amount === "") return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n}`;
  }
}

export function dealStageLabel(deal) {
  return (
    deal?.stage?.name ||
    deal?.stage_name ||
    deal?.stage ||
    (deal?.stage_id ? "Pipeline" : "—")
  );
}

export function resolveLinkedContacts(lead, contacts = [], companies = []) {
  const excluded = excludedContactIds(lead);
  const relatedContactIds = new Set(
    (lead.related?.contactIds || []).map(String)
  );

  const linked = uniqueById(
    contacts.filter((row) => {
      const id = String(row.id);
      if (excluded.has(id)) return false;
      if (relatedContactIds.has(id)) return true;
      if (lead.convertedContactId && id === String(lead.convertedContactId)) {
        return true;
      }
      if (emailsMatch(row.email, lead.email)) return true;
      return false;
    })
  );

  if (!linked.length && lead.status === "Converted") {
    linked.push({
      id: lead.convertedContactId || `contact-${lead.id}`,
      first_name: lead.firstName,
      last_name: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      title: lead.title,
    });
  }

  return linked;
}

function baseRelated(lead) {
  return {
    companyIds: [...(lead.related?.companyIds || [])],
    contactIds: [...(lead.related?.contactIds || [])],
    dealIds: [...(lead.related?.dealIds || [])],
    excludedCompanyIds: [...(lead.related?.excludedCompanyIds || [])],
    excludedContactIds: [...(lead.related?.excludedContactIds || [])],
  };
}

export function buildNextRelated(lead, kind, recordId) {
  const related = baseRelated(lead);
  const key =
    kind === "company"
      ? "companyIds"
      : kind === "contact"
        ? "contactIds"
        : "dealIds";
  const id = String(recordId || "");
  if (id && !related[key].includes(id)) {
    related[key].push(id);
  }
  related.excludedCompanyIds = related.excludedCompanyIds.filter(
    (item) => String(item) !== id
  );
  related.excludedContactIds = related.excludedContactIds.filter(
    (item) => String(item) !== id
  );
  return related;
}

export function buildUnlinkLeadPatch(lead, kind, row) {
  if (!row) return null;
  const recordId = row.id;
  const id = String(recordId || "");
  const related = baseRelated(lead);

  if (kind === "company") {
    const isLeadCompanyPlaceholder = id.startsWith("lead-company-");
    if (!isLeadCompanyPlaceholder && id) {
      related.companyIds = related.companyIds.filter(
        (item) => String(item) !== id
      );
      if (!(lead.related?.companyIds || []).map(String).includes(id)) {
        if (!related.excludedCompanyIds.map(String).includes(id)) {
          related.excludedCompanyIds.push(id);
        }
      }
    }
    const patch = { related };
    if (
      isLeadCompanyPlaceholder ||
      namesMatch(row.name, lead.company) ||
      String(lead.companyId) === id
    ) {
      patch.company_name = null;
    }
    if (String(lead.companyId) === id) {
      patch.company_id = null;
    }
    return patch;
  }

  if (kind === "contact") {
    if (lead.convertedContactId && String(lead.convertedContactId) === id) {
      return null;
    }
    if (id) {
      related.contactIds = related.contactIds.filter(
        (item) => String(item) !== id
      );
      if (!(lead.related?.contactIds || []).map(String).includes(id)) {
        if (!related.excludedContactIds.map(String).includes(id)) {
          related.excludedContactIds.push(id);
        }
      }
    }
    return { related };
  }

  return null;
}
