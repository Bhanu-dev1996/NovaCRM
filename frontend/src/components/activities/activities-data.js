export const ACTIVITY_TYPES = {
  task: { value: "task", label: "Task" },
  meeting: { value: "meeting", label: "Meeting" },
  call: { value: "call", label: "Call" },
  email: { value: "email", label: "Email" },
  note: { value: "note", label: "Note" },
};

export const ACTIVITY_TYPE_LIST = Object.values(ACTIVITY_TYPES);

export const TASK_STATUSES = ["todo", "doing", "done"];

export const ACTIVITY_STATUSES = [
  "Scheduled",
  "Completed",
  "Cancelled",
  "Logged",
];

export const ACTIVITY_PRIORITIES = ["low", "medium", "high", "urgent"];

export const ACTIVITY_STATUS_STYLES = {
  todo: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
  doing:
    "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "To do":
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
  "In progress":
    "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  Done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Scheduled:
    "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  Completed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Cancelled:
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  Logged:
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

export const ACTIVITY_PRIORITY_STYLES = {
  low: "bg-neutral-100 text-neutral-600 ring-neutral-200/80",
  medium: "bg-sky-50 text-sky-700 ring-sky-200/80",
  high: "bg-amber-50 text-amber-800 ring-amber-200/80",
  urgent: "bg-rose-50 text-rose-700 ring-rose-200/80",
};

export const ACTIVITY_TYPE_STYLES = {
  task: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
  meeting: "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  call: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  email: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  note: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
};

export const ACTIVITY_KPI_DEFINITIONS = [
  {
    id: "total",
    label: "Total Activities",
    icon: "layers",
    valueClass: "text-neutral-900 dark:text-neutral-50",
    iconClass:
      "bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300",
  },
  {
    id: "upcoming",
    label: "Upcoming",
    icon: "calendar",
    valueClass: "text-violet-700 dark:text-violet-300",
    iconClass:
      "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  },
  {
    id: "completed",
    label: "Completed",
    icon: "check",
    valueClass: "text-emerald-700 dark:text-emerald-300",
    iconClass:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    id: "overdue",
    label: "Overdue",
    icon: "alert",
    valueClass: "text-rose-600 dark:text-rose-400",
    iconClass:
      "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
  },
];

export const ACTIVITY_PAGE_SIZES = [10, 20, 40, 50, 100];

export const ACTIVITY_TABS = [
  { id: "all", label: "All Activities" },
  { id: "mine", label: "My Activities" },
  { id: "upcoming", label: "Upcoming" },
  { id: "overdue", label: "Overdue" },
  { id: "completed", label: "Completed" },
];

export const ACTIVITY_SUBJECT_ICON_STYLES = {
  task: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
  meeting: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  call: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  email: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  note: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

export const ACTIVITY_STATUS_DOT_STYLES = {
  todo: "bg-sky-500",
  doing: "bg-amber-400",
  done: "bg-emerald-500",
  "To do": "bg-sky-500",
  "In progress": "bg-amber-400",
  Done: "bg-emerald-500",
  Scheduled: "bg-sky-500",
  Completed: "bg-emerald-500",
  Cancelled: "bg-neutral-400",
  Logged: "bg-violet-500",
};

export const ACTIVITY_TABLE_COLUMNS = [
  { id: "subject", label: "Subject" },
  { id: "type", label: "Type" },
  { id: "related", label: "Related To" },
  { id: "owner", label: "Assigned To" },
  { id: "dueAt", label: "Due Date" },
  { id: "priority", label: "Priority" },
  { id: "status", label: "Status" },
];

export const DEFAULT_VISIBLE_ACTIVITY_COLUMNS = [
  "subject",
  "type",
  "related",
  "owner",
  "dueAt",
  "priority",
  "status",
];

export const ACTIVITY_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "todo", label: "To do" },
  { value: "doing", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "Scheduled", label: "Scheduled" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Logged", label: "Logged" },
];

function parseWhen(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isCompleted(row) {
  if (!row) return false;
  if (row.recordKind === "task") {
    return row.status === "done" || Boolean(row.completedAt);
  }
  const status = String(row.status || "");
  return (
    status === "Completed" ||
    status === "Cancelled" ||
    status === "Logged" ||
    Boolean(row.completedAt)
  );
}

export function isUpcoming(row) {
  if (!row || isCompleted(row)) return false;
  const due = parseWhen(row.dueAt);
  if (!due) return false;
  return due.getTime() > Date.now();
}

export function isOverdue(row) {
  if (!row || isCompleted(row)) return false;
  const due = parseWhen(row.dueAt);
  if (!due) return false;
  return due.getTime() < Date.now();
}

export function displayActivityStatus(row) {
  if (!row) return "—";
  if (row.recordKind === "task") {
    if (row.status === "todo") return "To do";
    if (row.status === "doing") return "In progress";
    if (row.status === "done") return "Done";
    return row.status || "To do";
  }
  if (row.status) return row.status;
  if (row.completedAt) return "Completed";
  if (row.dueAt) return "Scheduled";
  return "Logged";
}

export function activityStatusStyleKey(row) {
  if (!row) return "Scheduled";
  if (row.recordKind === "task") {
    const key = String(row.status || "todo").toLowerCase();
    if (key === "doing") return "doing";
    if (key === "done") return "done";
    return "todo";
  }
  const status = String(row.status || "").trim();
  if (status && ACTIVITY_STATUS_STYLES[status]) return status;
  return displayActivityStatus(row);
}

export function activityStatusClass(row) {
  const key = activityStatusStyleKey(row);
  const label = displayActivityStatus(row);
  return (
    ACTIVITY_STATUS_STYLES[key] ||
    ACTIVITY_STATUS_STYLES[label] ||
    ACTIVITY_STATUS_STYLES.Scheduled
  );
}

export function activityStatusDotClass(row) {
  const key = activityStatusStyleKey(row);
  const label = displayActivityStatus(row);
  return (
    ACTIVITY_STATUS_DOT_STYLES[key] ||
    ACTIVITY_STATUS_DOT_STYLES[label] ||
    ACTIVITY_STATUS_DOT_STYLES.Scheduled
  );
}

export function countUpcomingInDays(rows, days = 7) {
  const now = Date.now();
  const end = now + days * 86_400_000;
  return (rows || []).filter((row) => {
    if (isCompleted(row)) return false;
    const due = parseWhen(row.dueAt);
    if (!due) return false;
    const t = due.getTime();
    return t > now && t <= end;
  }).length;
}

export function countLinkedAccounts(rows) {
  const ids = new Set();
  for (const row of rows || []) {
    if (row.relatedCompanyId) ids.add(String(row.relatedCompanyId));
  }
  return ids.size;
}

export function resolveRelatedDisplay(row, lookups = {}) {
  const { contacts = [], companies = [], deals = [], leads = [], fullName } =
    lookups;
  let primary = "—";
  let secondary = "";

  if (row.relatedCompanyId) {
    const company = companies.find(
      (c) => String(c.id) === String(row.relatedCompanyId)
    );
    if (company?.name) primary = company.name;
  }
  if (row.relatedDealId) {
    const deal = deals.find((d) => String(d.id) === String(row.relatedDealId));
    if (deal?.name) {
      secondary = deal.name;
      if (primary === "—") primary = deal.name;
    }
  }
  if (row.relatedContactId && !secondary) {
    const contact = contacts.find(
      (c) => String(c.id) === String(row.relatedContactId)
    );
    if (contact) {
      const name = fullName ? fullName(contact) : contact.email || "Contact";
      if (primary === "—") primary = name;
      else secondary = name;
    }
  }
  if (row.relatedLeadId && !secondary) {
    const lead = leads.find((l) => String(l.id) === String(row.relatedLeadId));
    if (lead) {
      const name = fullName
        ? fullName({ firstName: lead.firstName, lastName: lead.lastName })
        : `${lead.firstName || ""} ${lead.lastName || ""}`.trim();
      if (name) {
        if (primary === "—") primary = name;
        else if (!secondary) secondary = name;
      }
    }
  }

  if (primary !== "—" && !secondary) {
    secondary = resolveRelatedLabel(row, lookups);
    if (secondary === primary) secondary = "";
  }

  return { primary, secondary };
}

export function formatActivityDueDisplay(value) {
  if (!value) return { dateLabel: "—", timeLabel: "" };
  const due = parseWhen(value);
  if (!due) return { dateLabel: "—", timeLabel: "" };

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const dueDay = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate()
  ).getTime();
  const dayDiff = Math.round((dueDay - startOfToday) / 86_400_000);

  let dateLabel;
  if (dayDiff === 0) dateLabel = "Today";
  else if (dayDiff === -1) dateLabel = "Yesterday";
  else if (dayDiff === 1) dateLabel = "Tomorrow";
  else if (dayDiff > 1 && dayDiff <= 7) {
    dateLabel = due.toLocaleDateString("en-US", { weekday: "long" });
  } else {
    dateLabel = due.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  const timeLabel = due.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return { dateLabel, timeLabel };
}

function normalizePriority(value) {
  const key = String(value || "medium").toLowerCase();
  return ACTIVITY_PRIORITIES.includes(key) ? key : "medium";
}

function activityStatusFromRow(row, meta) {
  if (row.status) return row.status;
  if (row.completed_at) return "Completed";
  if (meta?.callMode === "log" || meta?.logged) return "Logged";
  if (row.due_at) return "Scheduled";
  return "Logged";
}

export function fromTaskRow(row) {
  const completedAt =
    row.status === "done" && row.updated_at
      ? String(row.updated_at)
      : row.completed_at || "";
  return {
    id: row.id,
    recordKind: "task",
    type: "task",
    subject: row.title || "",
    status: row.status || "todo",
    priority: normalizePriority(row.priority),
    assigneeId: row.assignee_id || "",
    dueAt: row.due_at || "",
    completedAt,
    relatedContactId: row.contact_id || "",
    relatedCompanyId: row.company_id || "",
    relatedDealId: row.deal_id || "",
    relatedLeadId: row.lead_id || "",
    createdAt: row.created_at || "",
    raw: row,
  };
}

export function fromActivityRow(row) {
  const meta =
    row.meta && typeof row.meta === "object" && !Array.isArray(row.meta)
      ? row.meta
      : {};
  return {
    id: row.id,
    recordKind: "activity",
    type: row.type || "note",
    subject: row.subject || "",
    status: activityStatusFromRow(row, meta),
    priority: normalizePriority(row.priority || meta.priority),
    assigneeId: row.assignee_id || row.user_id || "",
    dueAt: row.due_at || "",
    completedAt: row.completed_at || "",
    relatedContactId: row.contact_id || "",
    relatedCompanyId: row.company_id || "",
    relatedDealId: row.deal_id || "",
    relatedLeadId: row.lead_id || "",
    createdAt: row.created_at || "",
    body: row.body || "",
    meta,
    raw: row,
  };
}

export function mergeActivityRows(tasks = [], activities = []) {
  const rows = [
    ...tasks.map(fromTaskRow),
    ...activities.map(fromActivityRow),
  ];
  return rows.sort((a, b) => {
    const aDue = parseWhen(a.dueAt)?.getTime() ?? Infinity;
    const bDue = parseWhen(b.dueAt)?.getTime() ?? Infinity;
    if (aDue !== bDue) return aDue - bDue;
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
}

export function resolveRelatedLabel(row, lookups = {}) {
  const { contacts = [], companies = [], deals = [], leads = [], fullName } =
    lookups;
  const chunks = [];
  if (row.relatedDealId) {
    const deal = deals.find((d) => String(d.id) === String(row.relatedDealId));
    if (deal?.name) chunks.push(deal.name);
  }
  if (row.relatedContactId) {
    const contact = contacts.find(
      (c) => String(c.id) === String(row.relatedContactId)
    );
    if (contact) {
      chunks.push(fullName ? fullName(contact) : contact.email || "Contact");
    }
  }
  if (row.relatedCompanyId) {
    const company = companies.find(
      (c) => String(c.id) === String(row.relatedCompanyId)
    );
    if (company?.name) chunks.push(company.name);
  }
  if (row.relatedLeadId) {
    const lead = leads.find((l) => String(l.id) === String(row.relatedLeadId));
    if (lead) {
      const name = fullName
        ? fullName({ firstName: lead.firstName, lastName: lead.lastName })
        : `${lead.firstName || ""} ${lead.lastName || ""}`.trim();
      if (name) chunks.push(name);
    }
  }
  return chunks.length ? chunks.join(" · ") : "—";
}

const PRIORITY_SCORE = {
  urgent: 28,
  high: 24,
  medium: 10,
  low: 2,
};

export function scoreActivityPriority(row, currentUserId) {
  if (!row || isCompleted(row)) {
    return { score: -Infinity, reason: "Completed" };
  }

  let score = 0;
  const reasons = [];
  const due = parseWhen(row.dueAt);

  if (isOverdue(row) && due) {
    const days = Math.max(
      1,
      Math.floor((Date.now() - due.getTime()) / 86_400_000)
    );
    score += 100 + Math.min(days * 4, 60);
    reasons.push(days === 1 ? "Overdue since yesterday" : `Overdue ${days} days`);
  } else if (due) {
    const hours = (due.getTime() - Date.now()) / 3_600_000;
    if (hours <= 0) {
      score += 85;
      reasons.push("Due now");
    } else if (hours <= 24) {
      score += 72;
      reasons.push("Due within 24 hours");
    } else if (hours <= 48) {
      score += 58;
      reasons.push("Due tomorrow");
    } else if (hours <= 168) {
      score += 38;
      reasons.push("Due this week");
    } else {
      score += 18;
      reasons.push("Scheduled ahead");
    }
  } else {
    score += 12;
    reasons.push("No due date — still open");
  }

  const priority = String(row.priority || "medium").toLowerCase();
  score += PRIORITY_SCORE[priority] ?? PRIORITY_SCORE.medium;
  if (priority === "urgent" || priority === "high") {
    reasons.push("High priority");
  }

  if (row.recordKind === "task" && row.status === "doing") {
    score += 16;
    reasons.push("In progress");
  }

  const uid = String(currentUserId || "");
  if (uid && String(row.assigneeId) === uid) {
    score += 22;
    reasons.push("Assigned to you");
  }

  const type = String(row.type || "");
  if (type === "meeting" || type === "call") {
    score += 6;
  }

  const headline =
    reasons.find((r) => r.startsWith("Overdue") || r.startsWith("Due")) ||
    reasons[0] ||
    "Open work item";

  return { score, reason: headline, signals: reasons };
}

export function buildPrioritizedQueue(rows, currentUserId, limit = 25) {
  const ranked = (rows || [])
    .filter((row) => !isCompleted(row))
    .map((row) => {
      const { score, reason, signals } = scoreActivityPriority(
        row,
        currentUserId
      );
      return { row, score, reason, signals };
    })
    .filter((item) => item.score > -Infinity)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aDue = parseWhen(a.row.dueAt)?.getTime() ?? Infinity;
      const bDue = parseWhen(b.row.dueAt)?.getTime() ?? Infinity;
      if (aDue !== bDue) return aDue - bDue;
      return String(a.row.subject || "").localeCompare(String(b.row.subject || ""));
    });

  const cap = Math.max(1, Number(limit) || 25);
  return ranked.slice(0, cap);
}

export function computeActivityKpis(rows, currentUserId) {
  const uid = String(currentUserId || "");
  let mine = 0;
  let upcoming = 0;
  let overdue = 0;
  let completed = 0;
  for (const row of rows || []) {
    if (uid && String(row.assigneeId) === uid) mine += 1;
    if (isUpcoming(row)) upcoming += 1;
    if (isOverdue(row)) overdue += 1;
    if (isCompleted(row)) completed += 1;
  }
  return {
    total: (rows || []).length,
    mine,
    upcoming,
    overdue,
    completed,
  };
}

export function filterActivityTab(rows, tab, currentUserId) {
  const uid = String(currentUserId || "");
  const list = rows || [];
  if (tab === "mine") {
    return list.filter((row) => uid && String(row.assigneeId) === uid);
  }
  if (tab === "upcoming") {
    return list.filter((row) => isUpcoming(row));
  }
  if (tab === "overdue") {
    return list.filter((row) => isOverdue(row));
  }
  if (tab === "completed") {
    return list.filter((row) => isCompleted(row));
  }
  return list;
}

export function formatActivityWhen(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function activityTypeLabel(type) {
  return ACTIVITY_TYPES[type]?.label || type || "Activity";
}
