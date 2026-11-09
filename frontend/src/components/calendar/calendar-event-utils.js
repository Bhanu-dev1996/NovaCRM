import { addMinutes } from "date-fns";

import { ACTIVITY_TYPE_STYLES } from "@/components/activities/activities-data";
import { calendarEventsFromRows } from "@/components/calendar/calendar-data";

/** Solid colors for FC inline styles (month block events) */
export const CALENDAR_TYPE_COLORS = {
  meeting: { bg: "#4338ca", border: "#3730a3" },
  call: { bg: "#d97706", border: "#b45309" },
  task: { bg: "#64748b", border: "#475569" },
  email: { bg: "#7c3aed", border: "#6d28d9" },
  note: { bg: "#475569", border: "#334155" },
};

function metaOf(row) {
  const raw = row.raw?.meta;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw;
  if (row.meta && typeof row.meta === "object") return row.meta;
  return {};
}

export function durationMinutesForRow(row) {
  const meta = metaOf(row);
  const n = Number(meta.durationMinutes);
  if (Number.isFinite(n) && n > 0) return Math.min(n, 480);
  if (row.type === "meeting") return 60;
  if (row.type === "call") return 30;
  return 30;
}

export function mergedRowFromCalendarId(calendarId) {
  const [recordKind, id] = String(calendarId || "").split(":");
  if (!recordKind || !id) return null;
  return { recordKind, id };
}

export function rowsToFullCalendarEvents(rows) {
  const events = calendarEventsFromRows(rows);
  const rowByKey = new Map(
    (rows || []).map((r) => [`${r.recordKind}:${r.id}`, r])
  );

  return events.map((ev) => {
    const row = rowByKey.get(`${ev.recordKind}:${ev.id}`) || {};
    const meta = metaOf(row);
    const start = new Date(ev.dueAt);
    const duration = durationMinutesForRow(row);
    const colors = CALENDAR_TYPE_COLORS[ev.type] || CALENDAR_TYPE_COLORS.task;
    const base = {
      id: `${ev.recordKind}:${ev.id}`,
      title: ev.title,
      start,
      end: addMinutes(start, duration),
      editable: !ev.completed,
      startEditable: !ev.completed,
      durationEditable: ev.recordKind === "activity" && !ev.completed,
      classNames: ["nova-cal-event", `nova-cal-event--${ev.type || "task"}`],
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: "#ffffff",
      extendedProps: {
        recordKind: ev.recordKind,
        rowId: ev.id,
        type: ev.type,
        completed: ev.completed,
        durationMinutes: duration,
        rrule: meta.rrule || "",
        externalSource: meta.externalSource || "",
      },
    };

    if (meta.rrule && String(meta.rrule).trim()) {
      return {
        ...base,
        rrule: String(meta.rrule).trim(),
        duration: `${duration}m`,
      };
    }

    return base;
  });
}

export function typeLegendClass(type) {
  return ACTIVITY_TYPE_STYLES[type] || ACTIVITY_TYPE_STYLES.task;
}
