import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { isCompleted } from "@/components/activities/activities-data";

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function dateKey(date) {
  return format(date, "yyyy-MM-dd");
}

export function buildMonthCells(month) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

/** Rows from mergeActivityRows with a due date, for calendar rendering. */
export function calendarEventsFromRows(rows) {
  return (rows || [])
    .filter((row) => {
      if (!row?.dueAt) return false;
      const d = new Date(row.dueAt);
      return !Number.isNaN(d.getTime());
    })
    .map((row) => ({
      id: row.id,
      recordKind: row.recordKind,
      title: row.subject || "Untitled",
      type: row.type || "task",
      dueAt: row.dueAt,
      completed: isCompleted(row),
    }));
}

export function groupEventsByDateKey(events) {
  const map = new Map();
  for (const event of events) {
    const d = new Date(event.dueAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = dateKey(d);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(event);
  }
  for (const list of map.values()) {
    list.sort(
      (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    );
  }
  return map;
}

export function eventsOnDay(eventsByDate, day) {
  return eventsByDate.get(dateKey(day)) || [];
}

export {
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
};
