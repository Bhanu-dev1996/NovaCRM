export const ACTIVITY_META_STORAGE_KEY = "novacrm:activity-meta";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function readAllActivityMeta() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(ACTIVITY_META_STORAGE_KEY);
  const parsed = safeParse(raw || "{}");
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function readActivityMeta(id) {
  if (!id) return {};
  return readAllActivityMeta()[id] || {};
}

export function writeActivityMeta(id, patch) {
  if (typeof window === "undefined" || !id) return;
  const all = readAllActivityMeta();
  all[id] = { ...(all[id] || {}), ...patch };
  window.localStorage.setItem(ACTIVITY_META_STORAGE_KEY, JSON.stringify(all));
}

export function persistActivityMeta(record) {
  if (!record?.id) return;
  const meta = metaFromActivityRecord(record);
  writeActivityMeta(record.id, meta);
}

function metaFromActivityRecord(record) {
  return {
    status: record.status || "",
    priority: record.priority || "",
    direction: record.direction || "",
    outcome: record.outcome || "",
    emailTo: record.emailTo || "",
    visibility: record.visibility || "",
    callMode: record.callMode || "",
    summary: record.summary || "",
    durationMinutes: record.durationMinutes || "",
    rrule: record.rrule || "",
    externalSource: record.externalSource || "",
    externalId: record.externalId || "",
  };
}

function rowMetaFromApi(row) {
  const raw = row?.meta;
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
}

function priorityKey(value) {
  const key = String(value || "medium").toLowerCase();
  if (key === "urgent") return "high";
  return ["low", "medium", "high"].includes(key) ? key : "medium";
}

export function fromApiActivity(row, options = {}) {
  const stored = options.meta || readActivityMeta(row.id);
  const apiMeta = rowMetaFromApi(row);
  const mergedMeta = { ...apiMeta, ...stored };

  return {
    id: row.id,
    type: row.type || "note",
    subject: row.subject || "",
    body: row.body || "",
    status: row.status || mergedMeta.status || "",
    priority: mergedMeta.priority || row.priority || "medium",
    assigneeId: row.assignee_id || row.user_id || "",
    dueAt: row.due_at || "",
    completedAt: row.completed_at || "",
    contactId: row.contact_id || "",
    companyId: row.company_id || "",
    dealId: row.deal_id || "",
    leadId: row.lead_id || "",
    userId: row.user_id || "",
    direction: mergedMeta.direction || "",
    outcome: mergedMeta.outcome || "",
    emailTo: mergedMeta.emailTo || "",
    visibility: mergedMeta.visibility || "team",
    callMode: mergedMeta.callMode || "",
    summary: mergedMeta.summary || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    raw: row,
  };
}

export function toApiActivity(record) {
  const meta = {
    ...metaFromActivityRecord(record),
    ...(record.summary ? { summary: record.summary } : {}),
    ...(record.visibility ? { visibility: record.visibility } : {}),
    ...(record.direction ? { direction: record.direction } : {}),
    ...(record.outcome ? { outcome: record.outcome } : {}),
    ...(record.emailTo ? { emailTo: record.emailTo } : {}),
    ...(record.callMode ? { callMode: record.callMode } : {}),
    ...(record.durationMinutes
      ? { durationMinutes: Number(record.durationMinutes) }
      : {}),
    ...(record.rrule ? { rrule: record.rrule } : {}),
    ...(record.externalSource ? { externalSource: record.externalSource } : {}),
    ...(record.externalId ? { externalId: record.externalId } : {}),
  };

  return {
    type: record.type,
    subject: record.subject?.trim() || null,
    body: record.body?.trim() || record.summary?.trim() || null,
    due_at: record.dueAt || null,
    completed_at: record.completedAt || null,
    status: record.status || null,
    priority: record.priority || null,
    contact_id: record.contactId || null,
    company_id: record.companyId || null,
    deal_id: record.dealId || null,
    lead_id: record.leadId || null,
    assignee_id: record.assigneeId || null,
    user_id: record.userId || record.assigneeId || null,
    meta,
  };
}

export function fromApiTask(row) {
  return {
    id: row.id,
    title: row.title || "",
    description: row.description || "",
    status: row.status || "todo",
    priority: priorityKey(row.priority),
    assigneeId: row.assignee_id || "",
    dueAt: row.due_at || "",
    contactId: row.contact_id || "",
    companyId: row.company_id || "",
    dealId: row.deal_id || "",
    leadId: row.lead_id || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    raw: row,
  };
}

export function toApiTask(record) {
  return {
    title: record.title?.trim() || record.subject?.trim(),
    description: record.description?.trim() || null,
    status: record.status || "todo",
    priority: priorityKey(record.priority),
    due_at: record.dueAt || null,
    assignee_id: record.assigneeId || null,
    contact_id: record.contactId || null,
    company_id: record.companyId || null,
    deal_id: record.dealId || null,
    lead_id: record.leadId || null,
  };
}
