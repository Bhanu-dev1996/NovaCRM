export const DEAL_META_STORAGE_KEY = "novacrm:deal-meta";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function readAllDealMeta() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(DEAL_META_STORAGE_KEY);
  const parsed = safeParse(raw || "{}");
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function readDealMeta(id) {
  if (!id) return {};
  return readAllDealMeta()[id] || {};
}

export function writeDealMeta(id, patch) {
  if (typeof window === "undefined" || !id) return;
  const all = readAllDealMeta();
  all[id] = { ...(all[id] || {}), ...patch };
  window.localStorage.setItem(DEAL_META_STORAGE_KEY, JSON.stringify(all));
}

export function persistDealMeta(deal) {
  if (!deal?.id) return;
  writeDealMeta(deal.id, metaFromDeal(deal));
}

function metaFromDeal(deal) {
  return {
    description: deal.description || "",
    priority: deal.priority || "",
    leadSource: deal.leadSource || "",
    nextStep: deal.nextStep || "",
    notes: deal.notes || "",
    tags: deal.tags || [],
    additionalContactIds: deal.additionalContactIds || [],
    pipelineName: deal.pipelineName || "",
    probability: deal.probability ?? "",
    lossReason: deal.lossReason || "",
    actualCloseDate: deal.actualCloseDate || "",
    stageHistory: deal.stageHistory || [],
  };
}

function dealMetaFromRow(row) {
  const raw = row?.meta;
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
}

export function fromApiDeal(row, options = {}) {
  const stored = options.meta || readDealMeta(row.id);
  const meta = dealMetaFromRow(row);
  const probabilityFromDb =
    row.probability != null && row.probability !== ""
      ? String(row.probability)
      : "";

  return {
    id: row.id,
    name: row.name || "",
    amount: row.amount ?? 0,
    currency: row.currency || "INR",
    stageId: row.stage_id || "",
    pipelineId: row.pipeline_id || "",
    companyId: row.company_id || "",
    contactId: row.contact_id || "",
    ownerId: row.owner_id || "",
    expectedCloseDate: row.expected_close_date
      ? String(row.expected_close_date).slice(0, 10)
      : "",
    status: row.status || "open",
    createdAt: row.created_at ? String(row.created_at).slice(0, 10) : "",
    updatedAt: row.updated_at ? String(row.updated_at).slice(0, 10) : "",
    description: row.description || stored.description || "",
    priority: row.priority || stored.priority || "",
    leadSource: row.lead_source || stored.leadSource || "",
    nextStep: row.next_step || stored.nextStep || "",
    notes: row.notes || stored.notes || "",
    tags: meta.tags || stored.tags || [],
    additionalContactIds:
      meta.additional_contact_ids || stored.additionalContactIds || [],
    pipelineName: meta.pipeline_name || stored.pipelineName || "",
    probability: probabilityFromDb || (stored.probability ?? ""),
    lossReason: row.loss_reason || stored.lossReason || "",
    actualCloseDate: row.actual_close_date
      ? String(row.actual_close_date).slice(0, 10)
      : stored.actualCloseDate || "",
    stageHistory: meta.stage_history || stored.stageHistory || [],
  };
}

export function toApiDeal(deal) {
  const probability =
    deal.probability !== "" && deal.probability != null
      ? Number(deal.probability)
      : null;

  return {
    name: deal.name?.trim() || "",
    amount: Number(deal.amount || 0),
    currency: deal.currency || "INR",
    stage_id: deal.stageId || null,
    pipeline_id: deal.pipelineId || null,
    company_id: deal.companyId || null,
    contact_id: deal.contactId || null,
    owner_id: deal.ownerId || null,
    expected_close_date: deal.expectedCloseDate || null,
    actual_close_date: deal.actualCloseDate || null,
    probability: Number.isFinite(probability) ? probability : null,
    lead_source: deal.leadSource?.trim() || null,
    priority: deal.priority?.trim() || null,
    description: deal.description?.trim() || null,
    notes: deal.notes || null,
    next_step: deal.nextStep?.trim() || null,
    loss_reason: deal.lossReason?.trim() || null,
    status: deal.status || "open",
    meta: {
      additional_contact_ids: deal.additionalContactIds || [],
      stage_history: deal.stageHistory || [],
      tags: deal.tags || [],
      pipeline_name: deal.pipelineName?.trim() || "",
    },
  };
}

export function appendStageHistory(deal, fromStageId, toStageId, extras = {}) {
  const entry = {
    at: new Date().toISOString(),
    fromStageId: fromStageId || null,
    toStageId: toStageId || null,
    ...extras,
  };
  return [...(deal.stageHistory || []), entry];
}
