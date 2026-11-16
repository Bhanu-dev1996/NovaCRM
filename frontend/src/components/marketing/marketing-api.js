import { apiFetch } from "@/lib/api";

export async function fetchMarketingState() {
  const res = await apiFetch("/api/marketing");
  return res.data;
}

export async function fetchCampaign(id) {
  const res = await apiFetch(`/api/marketing/campaigns/${id}`);
  return res.data;
}

export async function createCampaignApi(body) {
  const res = await apiFetch("/api/marketing/campaigns", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function updateCampaignApi(id, patch) {
  const res = await apiFetch(`/api/marketing/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return res.data;
}

export async function duplicateCampaignApi(id) {
  const res = await apiFetch(`/api/marketing/campaigns/${id}/duplicate`, {
    method: "POST",
  });
  return res.data;
}

export async function deleteCampaignApi(id) {
  return apiFetch(`/api/marketing/campaigns/${id}`, { method: "DELETE" });
}

export async function recordCampaignPerformanceApi(id) {
  const res = await apiFetch(`/api/marketing/campaigns/${id}/record-performance`, {
    method: "POST",
  });
  return res.data;
}

export async function previewSegmentApi(body) {
  const res = await apiFetch("/api/marketing/segments/preview", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function createSegmentApi(body) {
  const res = await apiFetch("/api/marketing/segments", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function updateSegmentApi(id, body) {
  const res = await apiFetch(`/api/marketing/segments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function createTemplateApi(body) {
  const res = await apiFetch("/api/marketing/templates", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function updateTemplateApi(id, body) {
  const res = await apiFetch(`/api/marketing/templates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function deleteTemplateApi(id) {
  return apiFetch(`/api/marketing/templates/${id}`, { method: "DELETE" });
}
