import {
  DEFAULT_SETTINGS,
  SEED_CONVERSATIONS,
  SEED_TEMPLATES,
} from "@/components/communications/communications-data";

const STORAGE_KEY = "novacrm:communications:v2";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadCommunicationsState() {
  if (typeof window === "undefined") {
    return defaultState();
  }
  const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY));
  if (!parsed?.conversations?.length) {
    const initial = defaultState();
    saveCommunicationsState(initial);
    return initial;
  }
  return normalizeState({
    conversations: parsed.conversations,
    templates: parsed.templates?.length ? parsed.templates : SEED_TEMPLATES,
    settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    sentTodayCount: parsed.sentTodayCount ?? 12,
    sentTodayDate: parsed.sentTodayDate || todayKey(),
  });
}

function normalizeState(state) {
  const remapChannel = (ch) =>
    ch === "whatsapp" || ch === "sms" ? "email" : ch;
  const conversations = (state.conversations || []).map((c) => ({
    ...c,
    channel: remapChannel(c.channel),
    messages: (c.messages || []).map((m) => ({
      ...m,
      channel: remapChannel(m.channel || c.channel),
    })),
  }));
  const settings = {
    ...DEFAULT_SETTINGS,
    ...state.settings,
    channels: {
      ...DEFAULT_SETTINGS.channels,
      ...(state.settings?.channels || {}),
    },
  };
  delete settings.channels.whatsapp;
  delete settings.channels.sms;
  return { ...state, conversations, settings };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function defaultState() {
  return normalizeState({
    conversations: SEED_CONVERSATIONS.map((c) => ({
      ...c,
      messages: [...(c.messages || [])],
    })),
    templates: [...SEED_TEMPLATES],
    settings: { ...DEFAULT_SETTINGS },
    sentTodayCount: 86,
    sentTodayDate: todayKey(),
  });
}

export function saveCommunicationsState(state) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function bumpSentToday(state) {
  const key = todayKey();
  const count =
    state.sentTodayDate === key ? (state.sentTodayCount || 0) + 1 : 1;
  return { ...state, sentTodayCount: count, sentTodayDate: key };
}

export function updateConversation(state, conversationId, patch) {
  const conversations = state.conversations.map((c) =>
    c.id === conversationId ? { ...c, ...patch } : c
  );
  return { ...state, conversations };
}

export function appendMessage(state, conversationId, message) {
  const conversations = state.conversations.map((c) => {
    if (c.id !== conversationId) return c;
    const messages = [...(c.messages || []), message];
    return {
      ...c,
      messages,
      lastMessagePreview: message.body.slice(0, 120),
      lastMessageAt: message.createdAt,
      awaitingResponse: message.direction === "inbound",
      unreadCount:
        message.direction === "inbound" ? (c.unreadCount || 0) + 1 : 0,
    };
  });
  return bumpSentToday({ ...state, conversations });
}

export function addConversation(state, conversation) {
  return {
    ...state,
    conversations: [conversation, ...state.conversations],
  };
}
