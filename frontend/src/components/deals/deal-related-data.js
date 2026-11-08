export function collectDealContactIds(deal) {
  const ids = new Set();
  if (deal?.contactId) ids.add(String(deal.contactId));
  for (const id of deal?.additionalContactIds || []) {
    if (id) ids.add(String(id));
  }
  return ids;
}

export function dealHasCompany(deal) {
  return Boolean(deal?.companyId);
}

export function buildUnlinkDealPatch(deal, kind, row) {
  if (!deal || !row?.id) return null;
  const contactId = String(row.id);

  if (kind === "company") {
    if (String(deal.companyId) !== contactId) return null;
    return { companyId: "" };
  }

  if (kind === "contact") {
    const primaryId = deal.contactId ? String(deal.contactId) : "";
    const additional = (deal.additionalContactIds || []).map(String);

    if (primaryId === contactId) {
      const [nextPrimary, ...rest] = additional;
      return {
        contactId: nextPrimary || "",
        additionalContactIds: rest,
      };
    }

    if (additional.includes(contactId)) {
      return {
        additionalContactIds: additional.filter((id) => id !== contactId),
      };
    }

    return null;
  }

  return null;
}

export function canUnlinkDealContact(row, deal) {
  if (!row?.id) return false;
  const id = String(row.id);
  if (deal?.contactId && String(deal.contactId) === id) return true;
  return (deal?.additionalContactIds || []).map(String).includes(id);
}
