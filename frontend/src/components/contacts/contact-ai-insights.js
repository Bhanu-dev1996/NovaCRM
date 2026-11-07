import { fullName } from "@/components/contacts/contacts-data";

export const CONTACT_STALE_DAYS = 14;

const ENGAGEMENT_LIFECYCLES = new Set([
  "Opportunity",
  "Lead",
  "Active",
  "Customer",
]);

export function daysSinceActivity(value) {
  if (!value) return Number.POSITIVE_INFINITY;
  const iso = String(value).slice(0, 10);
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return Number.POSITIVE_INFINITY;
  const then = Date.UTC(year, month - 1, day);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today - then) / 86_400_000);
}

function openDealsForContact(contactId, deals) {
  return (deals || []).filter(
    (row) =>
      String(row.contact_id || "") === String(contactId) &&
      String(row.status || "open").toLowerCase() === "open"
  );
}

/** Contacts with open deals and no recent activity. */
export function reEngagementTargets(contacts, deals = []) {
  const stale = contacts.filter((contact) => {
    if (!ENGAGEMENT_LIFECYCLES.has(contact.lifecycle)) return false;
    const linkedDeals = openDealsForContact(contact.id, deals);
    if (!linkedDeals.length) return false;
    const activity = contact.lastActivityAt || contact.updatedAt || contact.createdAt;
    return daysSinceActivity(activity) >= CONTACT_STALE_DAYS;
  });
  if (stale.length) return stale;

  return contacts
    .filter(
      (contact) =>
        ENGAGEMENT_LIFECYCLES.has(contact.lifecycle) &&
        openDealsForContact(contact.id, deals).length > 0
    )
    .sort(
      (a, b) =>
        daysSinceActivity(b.lastActivityAt || b.updatedAt) -
        daysSinceActivity(a.lastActivityAt || a.updatedAt)
    )
    .slice(0, 3);
}

/** Highly engaged champions (tag or recent customer activity). */
export function championContacts(contacts, limit = 4) {
  const tagged = contacts.filter((contact) =>
    (contact.tags || []).some((tag) => /champion/i.test(String(tag)))
  );
  const recentCustomers = contacts.filter((contact) => {
    if (contact.contactType !== "Customer") return false;
    const activity = contact.lastActivityAt || contact.updatedAt;
    return daysSinceActivity(activity) <= 7;
  });

  const seen = new Set();
  const merged = [];
  for (const row of [...tagged, ...recentCustomers]) {
    if (!row?.id || seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
  }
  return merged.slice(0, limit);
}

/** Customer accounts suited for a relationship review. */
export function qbrTargets(contacts, limit = 3) {
  const scored = contacts
    .filter(
      (contact) =>
        contact.contactType === "Customer" ||
        contact.lifecycle === "Customer" ||
        (contact.tags || []).some((tag) =>
          /fintech|enterprise|champion/i.test(String(tag))
        )
    )
    .sort((a, b) => {
      const aCustomer =
        a.contactType === "Customer" || a.lifecycle === "Customer" ? 1 : 0;
      const bCustomer =
        b.contactType === "Customer" || b.lifecycle === "Customer" ? 1 : 0;
      if (bCustomer !== aCustomer) return bCustomer - aCustomer;
      return daysSinceActivity(a.lastActivityAt || a.updatedAt) -
        daysSinceActivity(b.lastActivityAt || b.updatedAt);
    });
  return scored.slice(0, limit);
}

export function buildContactAiInsights(contacts, deals = []) {
  const reengage = reEngagementTargets(contacts, deals);
  const champions = championContacts(contacts);
  const qbr = qbrTargets(contacts);

  const staleWithDeals = contacts.filter((contact) => {
    if (!openDealsForContact(contact.id, deals).length) return false;
    const activity = contact.lastActivityAt || contact.updatedAt || contact.createdAt;
    return daysSinceActivity(activity) >= CONTACT_STALE_DAYS;
  }).length;

  const championNames = champions.map((c) => fullName(c)).filter(Boolean);
  const championLabel =
    championNames.length >= 2
      ? `${championNames[0]} and ${championNames[1]}`
      : championNames[0] ||
        (champions.length ? fullName(champions[0]) : "Top customers");

  return [
    {
      id: "followup",
      title: "Re-engagement window",
      body: staleWithDeals
        ? `${staleWithDeals} contact${staleWithDeals === 1 ? "" : "s"} with open deals ${staleWithDeals === 1 ? "has" : "have"} not been engaged in ${CONTACT_STALE_DAYS} days.`
        : reengage.length
          ? `${reengage.length} contact${reengage.length === 1 ? "" : "s"} with pipeline deals could use a check-in.`
          : "No overdue deal stakeholders — draft outreach for your next best accounts.",
      action: "Draft outreach",
    },
    {
      id: "champion",
      title: "Champion signal",
      body: champions.length
        ? `${championLabel}${championNames.length > 2 ? ` and ${championNames.length - 2} more` : ""} show strong engagement signals.`
        : "Tag champions or mark Customers with recent activity to surface advocates here.",
      action: "Explain insight",
    },
    {
      id: "next",
      title: "Next best action",
      body: qbr.length
        ? `Schedule a QBR with ${qbr.map((c) => fullName(c)).join(", ")} this week.`
        : "Add Customer contacts to recommend quarterly business reviews.",
      action: "Recommend action",
    },
  ];
}

export function buildOutreachDraft(targets) {
  if (targets.length === 1) {
    const contact = targets[0];
    const first = contact.firstName || fullName(contact);
    return `Hi ${first},\n\nI wanted to reconnect on the open opportunity we’re tracking together. It’s been a couple of weeks since we last synced, and I’d like to align on next steps and timing for your team.\n\nDo you have 20 minutes this week for a quick call?\n\nBest,\nNovaCRM`;
  }
  return `Hi,\n\nI’m reaching out to reconnect on a few active opportunities where we haven’t synced recently. I’d like to confirm priorities and next steps for each account.\n\nCould we book a short check-in this week?\n\nBest,\nNovaCRM`;
}

export function serializeContactAiNote(body) {
  const iso = new Date().toISOString().slice(0, 10);
  return `[Nova AI | ${iso}]\n${body}`;
}
