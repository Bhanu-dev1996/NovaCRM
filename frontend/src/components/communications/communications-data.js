import { CONTACT_OWNERS } from "@/components/contacts/contacts-data";

export const COMM_CHANNELS = [
  { id: "email", label: "Email", active: true },
  { id: "call", label: "Calls", active: true },
];

export const INBOX_NAV_ITEMS = [
  { id: "all", label: "All Conversations" },
  { id: "mine", label: "My Conversations" },
  { id: "unread", label: "Unread" },
  { id: "starred", label: "Starred" },
  { id: "archived", label: "Archived" },
];

export const INBOX_TABS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "assigned", label: "Assigned to Me" },
  { id: "unassigned", label: "Unassigned" },
  { id: "archived", label: "Archived" },
];

export const COMM_KPI_DEFINITIONS = [
  {
    id: "total",
    label: "Total Conversations",
    hint: "Across all channels",
    icon: "inbox",
    iconClass:
      "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  },
  {
    id: "unread",
    label: "Unread Messages",
    hint: "Need attention",
    icon: "mail",
    iconClass: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    id: "awaiting",
    label: "Awaiting Response",
    hint: "Customer last spoke",
    icon: "clock",
    iconClass:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  {
    id: "sentToday",
    label: "Sent Today",
    hint: "Outbound messages",
    icon: "send",
    iconClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
];

export const TEMPLATE_CATEGORIES = [
  "Introduction",
  "Follow-up",
  "Meeting Confirmation",
  "Product Demo",
  "Proposal",
  "Thank You",
  "Sales Closing",
];

export const TEMPLATE_VARIABLES = [
  "{{contact.first_name}}",
  "{{contact.last_name}}",
  "{{company.name}}",
  "{{deal.name}}",
  "{{deal.value}}",
  "{{owner.name}}",
];

const DAYS_AGO = (n, h = 10, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const DEFAULT_SENDER = {
  name: "NovaCRM Sales",
  email: "sales@novacrm.app",
  replyTo: "sales@novacrm.app",
  signature:
    "—\nAlex Morgan\nAccount Executive · NovaCRM\nsales@novacrm.app",
};

export const DEFAULT_SETTINGS = {
  channels: {
    email: { status: "connected", label: "Email" },
    call: { status: "connected", label: "Call history (Activities)" },
  },
  email: DEFAULT_SENDER,
  notifications: {
    newMessage: true,
    unreadAlerts: true,
    assignedAlerts: true,
  },
  permissions: {
    sendEmail: "all_members",
    accessConversations: "all_members",
    manageTemplates: "admins",
  },
};

export const SEED_TEMPLATES = [
  {
    id: "tpl-intro",
    name: "Warm introduction",
    category: "Introduction",
    subject: "Introduction — {{company.name}} × NovaCRM",
    body: "Hi {{contact.first_name}},\n\nI’m {{owner.name}} from NovaCRM. I’d love to learn how {{company.name}} is handling customer conversations today.\n\nWould you be open to a short call this week?\n\nBest,",
    visibility: "workspace",
    updatedAt: DAYS_AGO(12),
  },
  {
    id: "tpl-followup",
    name: "Post-demo follow-up",
    category: "Follow-up",
    subject: "Following up on our demo",
    body: "Hi {{contact.first_name}},\n\nThanks again for your time on the product demo. As discussed, I’m sharing next steps for {{deal.name}} ({{deal.value}}).\n\nLet me know if you have questions.\n\n{{owner.name}}",
    visibility: "workspace",
    updatedAt: DAYS_AGO(3),
  },
  {
    id: "tpl-meeting",
    name: "Meeting confirmation",
    category: "Meeting Confirmation",
    subject: "Confirmed: meeting with {{company.name}}",
    body: "Hi {{contact.first_name}},\n\nThis confirms our upcoming meeting. I’ve added an agenda to the calendar invite.\n\nTalk soon,\n{{owner.name}}",
    visibility: "private",
    updatedAt: DAYS_AGO(1),
  },
];

function msg(id, convId, direction, body, hoursAgo, extra = {}) {
  const d = new Date();
  d.setHours(d.getHours() - hoursAgo);
  return {
    id,
    conversationId: convId,
    direction,
    body,
    createdAt: d.toISOString(),
    status: direction === "outbound" ? "delivered" : "read",
    attachments: [],
    ...extra,
  };
}

export const SEED_CONVERSATIONS = [
  {
    id: "conv-vertex",
    channel: "email",
    subject: "Vertex security questionnaire",
    contactId: "",
    contactName: "Maya Chen",
    contactEmail: "maya.chen@vertex.io",
    companyId: "",
    companyName: "Vertex.io",
    dealId: "",
    dealName: "Vertex Platform Expansion",
    jobTitle: "VP Engineering",
    phone: "+1 (415) 555-0142",
    assigneeId: "alex",
    starred: true,
    archived: false,
    unreadCount: 2,
    awaitingResponse: true,
    lastMessagePreview:
      "Can you send the SOC 2 summary before Friday’s review?",
    lastMessageAt: DAYS_AGO(0, 9, 42),
    messages: [
      msg("m1", "conv-vertex", "outbound", "Hi Maya — attaching our security pack ahead of procurement review.", 48, {
        senderName: "Alex Morgan",
        senderEmail: "alex@novacrm.app",
      }),
      msg("m2", "conv-vertex", "inbound", "Thanks Alex. Can you send the SOC 2 summary before Friday’s review?", 2, {
        senderName: "Maya Chen",
        senderEmail: "maya.chen@vertex.io",
      }),
    ],
  },
  {
    id: "conv-northstar",
    channel: "email",
    subject: "Northstar proposal adjustments",
    contactName: "Jordan Blake",
    contactEmail: "j.blake@northstar.co",
    companyName: "Northstar Ltd",
    dealName: "Northstar Renewal",
    jobTitle: "Director of Ops",
    phone: "+1 (312) 555-0198",
    assigneeId: "jordan",
    starred: false,
    archived: false,
    unreadCount: 0,
    awaitingResponse: false,
    lastMessagePreview: "Looks good — proceed with the revised tier.",
    lastMessageAt: DAYS_AGO(1, 14, 10),
    messages: [
      msg("m3", "conv-northstar", "inbound", "Can we adjust seats to 120 for year one?", 30, {
        senderName: "Jordan Blake",
      }),
      msg("m4", "conv-northstar", "outbound", "Updated proposal attached with 120 seats.", 28, {
        senderName: "Jordan Lee",
      }),
      msg("m5", "conv-northstar", "inbound", "Looks good — proceed with the revised tier.", 26, {
        senderName: "Jordan Blake",
      }),
    ],
  },
  {
    id: "conv-orbit",
    channel: "email",
    subject: "Orbit Labs demo scheduling",
    contactName: "Priya Sharma",
    contactEmail: "priya@orbitlabs.ai",
    companyName: "Orbit Labs",
    dealName: "Orbit AI Suite",
    assigneeId: "sam",
    starred: true,
    archived: false,
    unreadCount: 1,
    awaitingResponse: true,
    lastMessagePreview: "Can we move the demo to Thursday 3pm IST?",
    lastMessageAt: DAYS_AGO(0, 7, 15),
    messages: [
      msg("m6", "conv-orbit", "inbound", "Can we move the demo to Thursday 3pm IST?", 5, {
        senderName: "Priya Sharma",
      }),
    ],
  },
  {
    id: "conv-brightline",
    channel: "email",
    subject: "Brightline expo follow-up",
    contactName: "Noah Kim",
    contactEmail: "noah@brightline.media",
    companyName: "Brightline Media",
    assigneeId: "casey",
    starred: false,
    archived: false,
    unreadCount: 0,
    awaitingResponse: false,
    lastMessagePreview: "Got it — see you at the booth.",
    lastMessageAt: DAYS_AGO(2, 11, 0),
    messages: [
      msg("m7", "conv-brightline", "outbound", "Reminder: expo meetup tomorrow 2pm.", 50, {
        senderName: "Casey Morgan",
      }),
      msg("m8", "conv-brightline", "inbound", "Got it — see you at the booth.", 48, {
        senderName: "Noah Kim",
      }),
    ],
  },
  {
    id: "conv-acme-call",
    channel: "call",
    contactName: "Dana Ortiz",
    contactEmail: "dortiz@acmecorp.com",
    companyName: "Acme Corp",
    dealName: "Acme CRM Rollout",
    assigneeId: "alex",
    starred: false,
    archived: false,
    unreadCount: 0,
    awaitingResponse: false,
    lastMessagePreview: "Call completed · 18 min · Discovery",
    lastMessageAt: DAYS_AGO(1, 16, 30),
    messages: [
      msg(
        "m9",
        "conv-acme-call",
        "inbound",
        "Call logged from activity: discovery call. Outcome — interested in pilot. Follow-up email scheduled.",
        40,
        {
          senderName: "Dana Ortiz",
          channel: "call",
          status: "logged",
        }
      ),
    ],
  },
  {
    id: "conv-globalpay",
    channel: "email",
    contactName: "Elena Vasquez",
    contactEmail: "elena.v@globalpay.com",
    companyName: "GlobalPay",
    dealName: "GlobalPay Integration",
    assigneeId: "",
    starred: false,
    archived: false,
    unreadCount: 3,
    awaitingResponse: true,
    lastMessagePreview: "Who is the technical contact for SSO?",
    lastMessageAt: DAYS_AGO(0, 8, 5),
    messages: [
      msg("m10", "conv-globalpay", "inbound", "Who is the technical contact for SSO?", 6, {
        senderName: "Elena Vasquez",
      }),
    ],
  },
  {
    id: "conv-stripe",
    channel: "email",
    contactName: "Emily Chen",
    contactEmail: "emily.chen@stripe.com",
    companyName: "Stripe",
    assigneeId: "riley",
    starred: false,
    archived: true,
    unreadCount: 0,
    awaitingResponse: false,
    lastMessagePreview: "Thanks — we'll circle back Q3.",
    lastMessageAt: DAYS_AGO(14, 10, 0),
    messages: [
      msg("m11", "conv-stripe", "inbound", "Thanks — we'll circle back Q3.", 336, {
        senderName: "Emily Chen",
      }),
    ],
  },
];

export function ownerById(id) {
  return CONTACT_OWNERS.find((o) => o.id === id) || { id: "", name: "Unassigned", initials: "?" };
}

export function channelLabel(channel) {
  return COMM_CHANNELS.find((c) => c.id === channel)?.label || channel;
}

export function formatCommTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function computeCommKpis(conversations, messagesSentToday = 0) {
  const active = (conversations || []).filter((c) => !c.archived);
  const unread = active.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const awaiting = active.filter((c) => c.awaitingResponse).length;
  return {
    total: active.length,
    unread,
    awaiting,
    sentToday: messagesSentToday,
  };
}

export function broadcastCommunicationsUnread(unread) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("novacrm:communications-unread", {
      detail: { unread: Math.max(0, Number(unread) || 0) },
    })
  );
}

export function formatNavUnreadBadge(count) {
  const n = Math.max(0, Number(count) || 0);
  if (n <= 0) return null;
  if (n > 99) return "99+";
  return String(n);
}

export function filterConversations(
  conversations,
  {
    navId = "all",
    tabId = "all",
    channel = "all",
    search = "",
    ownerFilter = "all",
    unreadOnly = false,
    currentUserId = "",
  }
) {
  let list = [...(conversations || [])];

  const q = search.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (c) =>
        c.contactName?.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.contactEmail?.toLowerCase().includes(q) ||
        c.lastMessagePreview?.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q)
    );
  }

  if (channel !== "all") {
    list = list.filter((c) => c.channel === channel);
  }

  if (ownerFilter !== "all") {
    list = list.filter((c) => String(c.assigneeId || "") === ownerFilter);
  }

  if (unreadOnly) {
    list = list.filter((c) => (c.unreadCount || 0) > 0);
  }

  if (navId === "mine" && currentUserId) {
    list = list.filter((c) => c.assigneeId === currentUserId);
  } else if (navId === "unread") {
    list = list.filter((c) => (c.unreadCount || 0) > 0);
  } else if (navId === "starred") {
    list = list.filter((c) => c.starred);
  } else if (navId === "archived") {
    list = list.filter((c) => c.archived);
  } else if (navId === "all") {
    list = list.filter((c) => !c.archived);
  }

  if (tabId === "unread") {
    list = list.filter((c) => (c.unreadCount || 0) > 0 && !c.archived);
  } else if (tabId === "assigned" && currentUserId) {
    list = list.filter((c) => c.assigneeId === currentUserId && !c.archived);
  } else if (tabId === "unassigned") {
    list = list.filter((c) => !c.assigneeId && !c.archived);
  } else if (tabId === "archived") {
    list = list.filter((c) => c.archived);
  } else if (tabId === "all") {
    if (navId !== "archived") list = list.filter((c) => !c.archived);
  }

  list.sort(
    (a, b) =>
      new Date(b.lastMessageAt || 0).getTime() -
      new Date(a.lastMessageAt || 0).getTime()
  );

  return list;
}

export function conversationsForContact(conversations, contact) {
  if (!contact) return [];
  const email = String(contact.email || "").toLowerCase();
  const name = String(
    contact.firstName
      ? `${contact.firstName} ${contact.lastName || ""}`.trim()
      : contact.name || ""
  ).toLowerCase();
  return (conversations || []).filter((c) => {
    if (contact.id && c.contactId === contact.id) return true;
    if (email && c.contactEmail?.toLowerCase() === email) return true;
    if (name && c.contactName?.toLowerCase() === name) return true;
    return false;
  });
}

export function commPermissionAllows(level, role) {
  if (level === "admins") return ["owner", "admin"].includes(role);
  if (level === "sales_team") {
    return ["owner", "admin", "member"].includes(role);
  }
  return true;
}

export function applyTemplateVariables(text, context = {}) {
  const map = {
    "{{contact.first_name}}": context.firstName || "there",
    "{{contact.last_name}}": context.lastName || "",
    "{{company.name}}": context.companyName || "your team",
    "{{deal.name}}": context.dealName || "the opportunity",
    "{{deal.value}}": context.dealValue || "TBD",
    "{{owner.name}}": context.ownerName || "NovaCRM Team",
  };
  let out = String(text || "");
  for (const [key, val] of Object.entries(map)) {
    out = out.split(key).join(val);
  }
  return out;
}

export function buildForwardQuote(conversation) {
  const lines = (conversation?.messages || []).map((m) => {
    const who = m.senderName || (m.direction === "outbound" ? "You" : conversation?.contactName);
    const when = m.createdAt
      ? new Date(m.createdAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "";
    return `On ${when}, ${who} wrote:\n${m.body || ""}`;
  });
  return `\n\n---------- Forwarded thread ----------\n${lines.join("\n\n")}`;
}

export function activitiesCreateUrlFromConversation(conv, type = "email") {
  if (!conv) return "/activities?action=create";
  const params = new URLSearchParams();
  params.set("action", "create");
  params.set("type", type);
  if (conv.contactId) params.set("contact_id", String(conv.contactId));
  if (conv.companyId) params.set("company_id", String(conv.companyId));
  if (conv.dealId) params.set("deal_id", String(conv.dealId));
  if (conv.subject) params.set("subject", `Follow up: ${conv.subject}`);
  return `/activities?${params.toString()}`;
}
