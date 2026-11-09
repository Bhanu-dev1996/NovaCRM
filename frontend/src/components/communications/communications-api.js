import { apiFetch } from "@/lib/api";

export async function fetchCommunicationsState() {
  const res = await apiFetch("/api/communications");
  return res.data;
}

export async function fetchCommunicationsInboxSummary() {
  const res = await apiFetch("/api/communications/summary");
  return res.data;
}

export async function patchCommunicationsSettings(patch) {
  const res = await apiFetch("/api/communications/settings", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return res.data;
}

export async function createConversation(payload) {
  const res = await apiFetch("/api/communications/conversations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateConversationApi(id, patch) {
  const res = await apiFetch(`/api/communications/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return res.data;
}

export async function deleteConversationApi(id) {
  return apiFetch(`/api/communications/conversations/${id}`, {
    method: "DELETE",
  });
}

export async function postConversationMessage(id, payload) {
  const res = await apiFetch(`/api/communications/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function createTemplateApi(body) {
  const res = await apiFetch("/api/communications/templates", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function updateTemplateApi(id, body) {
  const res = await apiFetch(`/api/communications/templates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patchBody(body)),
  });
  return res.data;
}

export async function deleteTemplateApi(id) {
  return apiFetch(`/api/communications/templates/${id}`, {
    method: "DELETE",
  });
}

function patchBody(t) {
  return {
    name: t.name,
    category: t.category,
    subject: t.subject,
    body: t.body,
    visibility: t.visibility,
  };
}

/** Merge a single conversation or message result into local state shape */
export function mergeConversation(state, conversation) {
  const list = state.conversations || [];
  const idx = list.findIndex((c) => c.id === conversation.id);
  const conversations =
    idx >= 0
      ? list.map((c) => (c.id === conversation.id ? conversation : c))
      : [conversation, ...list];
  return { ...state, conversations };
}

export function appendMessageToConversation(state, conversationId, message) {
  const conversations = (state.conversations || []).map((c) => {
    if (c.id !== conversationId) return c;
    const messages = [...(c.messages || []), message];
    return {
      ...c,
      messages,
      lastMessagePreview: message.body?.slice(0, 120) || c.lastMessagePreview,
      lastMessageAt: message.createdAt || c.lastMessageAt,
      awaitingResponse: message.direction === "inbound",
      unreadCount: message.direction === "inbound" ? (c.unreadCount || 0) + 1 : 0,
    };
  });
  return { ...state, conversations };
}
