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

export function fromApiLead(row) {
  return {
    id: row.id,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    email: row.email || "",
    phone: row.phone || "",
    company: row.company_name || "",
    title: row.title || "",
    source: row.source || "Manual",
    industry: row.industry || "",
    status: row.status || "New",
    ownerId: row.owner_id || "",
    score: Number(row.score ?? 50),
    notes: row.notes || "",
    lastContacted: row.last_contacted_at
      ? String(row.last_contacted_at).slice(0, 10)
      : null,
    createdAt: row.created_at ? String(row.created_at).slice(0, 10) : "",
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
