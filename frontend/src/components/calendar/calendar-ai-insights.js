import {
  activityTypeLabel,
  isCompleted,
  isOverdue,
  parseWhen,
} from "@/components/activities/activities-data";
import { calendarEventsFromRows } from "@/components/calendar/calendar-data";
import { addDays, format, startOfDay } from "date-fns";

function scoreCalendarItem(row, userId) {
  let score = 0;
  const reasons = [];

  if (isOverdue(row)) {
    score += 100;
    reasons.push("Overdue");
  }

  const due = parseWhen(row.dueAt);
  if (due) {
    const hoursUntil = (due.getTime() - Date.now()) / 3_600_000;
    if (hoursUntil >= 0 && hoursUntil <= 24) {
      score += 40;
      reasons.push("Due within 24h");
    } else if (hoursUntil >= 0 && hoursUntil <= 72) {
      score += 22;
      reasons.push("Due this week");
    }
  }

  const type = String(row.type || "");
  if (type === "meeting") {
    score += 14;
    if (!reasons.includes("Meeting")) reasons.push("Meeting");
  } else if (type === "call") {
    score += 10;
    if (!reasons.includes("Call")) reasons.push("Call");
  }

  const uid = String(userId || "");
  if (uid && String(row.assigneeId) === uid) {
    score += 8;
    reasons.push("Assigned to you");
  }

  return { score, reason: reasons[0] || "Scheduled" };
}

/** Ranked open calendar work for the AI assistant sheet. */
export function buildCalendarFocusQueue(rows, userId, limit = 15) {
  const cap = Math.max(1, Number(limit) || 15);
  return (rows || [])
    .filter((row) => !isCompleted(row) && parseWhen(row.dueAt))
    .map((row) => {
      const { score, reason } = scoreCalendarItem(row, userId);
      return { row, score, reason };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aDue = parseWhen(a.row.dueAt)?.getTime() ?? Infinity;
      const bDue = parseWhen(b.row.dueAt)?.getTime() ?? Infinity;
      if (aDue !== bDue) return aDue - bDue;
      return String(a.row.subject || "").localeCompare(String(b.row.subject || ""));
    })
    .slice(0, cap);
}

export function nextMeetingRow(rows) {
  const now = Date.now();
  const upcoming = (rows || [])
    .filter((row) => !isCompleted(row) && String(row.type) === "meeting")
    .map((row) => ({ row, t: parseWhen(row.dueAt)?.getTime() }))
    .filter((item) => item.t != null && item.t >= now)
    .sort((a, b) => a.t - b.t);
  return upcoming[0]?.row ?? null;
}

export function buildCalendarAiInsights(rows, userId) {
  const events = calendarEventsFromRows(rows);
  const openCount = events.filter((e) => !e.completed).length;
  const overdueCount = (rows || []).filter((row) => isOverdue(row)).length;
  const queue = buildCalendarFocusQueue(rows, userId, 1);
  const topReason = queue[0]?.reason;

  const dayCounts = new Map();
  const windowStart = startOfDay(new Date());
  for (const ev of events) {
    if (ev.completed) continue;
    const due = parseWhen(ev.dueAt);
    if (!due || due < windowStart || due > addDays(windowStart, 7)) continue;
    const key = format(due, "yyyy-MM-dd");
    dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
  }

  let busiestDay = null;
  let busiestCount = 0;
  for (const [key, count] of dayCounts) {
    if (count > busiestCount) {
      busiestCount = count;
      busiestDay = key;
    }
  }

  const meetingCount = events.filter(
    (ev) => !ev.completed && ev.type === "meeting"
  ).length;
  const nextMeet = nextMeetingRow(rows);

  return [
    {
      id: "focus",
      title: "Focus queue",
      body: openCount
        ? `${openCount} open item${openCount === 1 ? "" : "s"} on your calendar${overdueCount ? ` · ${overdueCount} overdue` : ""}${topReason ? ` · Top signal: ${topReason.toLowerCase()}` : ""}.`
        : "Your calendar is clear — schedule follow-ups while you have bandwidth.",
      action: "View focus queue",
    },
    {
      id: "capacity",
      title: "Capacity signal",
      body:
        busiestDay && busiestCount > 1
          ? `Busiest day in the next 7 days: ${format(new Date(`${busiestDay}T12:00:00`), "EEE MMM d")} (${busiestCount} items). Consider moving prep or internal work.`
          : meetingCount > 0
            ? `${meetingCount} open meeting${meetingCount === 1 ? "" : "s"} on the calendar — balance with call blocks for pipeline work.`
            : "Light schedule ahead — good window for prospect calls and deal follow-ups.",
      action: "Explain insight",
    },
    {
      id: "prep",
      title: "Meeting prep",
      body: nextMeet
        ? `Next up: “${nextMeet.subject || "Untitled"}” (${activityTypeLabel(nextMeet.type)}). Draft an agenda and talking points.`
        : "No upcoming meetings — use Schedule Meeting to book your next stakeholder touchpoint.",
      action: "Draft prep notes",
    },
  ];
}

export function buildMeetingPrepDraft(row) {
  const title = row?.subject || "Upcoming meeting";
  const when = parseWhen(row?.dueAt);
  const whenLabel = when ? format(when, "EEEE, MMM d · h:mm a") : "TBD";

  return `[Agenda draft]\n${title}\n${whenLabel}\n\n1. Objective & desired outcome\n2. Attendee context / last touchpoint\n3. Open items from CRM activities\n4. Next steps & owners\n\n[Nova AI prep — edit before the call]`;
}

export function serializeCalendarAiNote(body) {
  const iso = new Date().toISOString().slice(0, 10);
  return `[Nova AI | ${iso}]\n${body}`;
}
