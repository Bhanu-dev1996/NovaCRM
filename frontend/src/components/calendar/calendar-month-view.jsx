"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  ACTIVITY_TYPE_STYLES,
  activityTypeLabel,
} from "@/components/activities/activities-data";
import {
  buildMonthCells,
  dateKey,
  eventsOnDay,
  groupEventsByDateKey,
  isSameDay,
  isSameMonth,
  isToday,
  WEEKDAY_LABELS,
} from "@/components/calendar/calendar-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_EVENTS = 4;

function eventPillClass(type, completed) {
  const base =
    ACTIVITY_TYPE_STYLES[type] || ACTIVITY_TYPE_STYLES.task || "";
  return cn(
    "block w-full truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight",
    base,
    completed && "opacity-55 line-through"
  );
}

export function CalendarMonthView({
  month,
  onMonthChange,
  onToday,
  events,
  selectedDay,
  onSelectDay,
  onOpenEvent,
}) {
  const cells = useMemo(() => buildMonthCells(month), [month]);
  const byDate = useMemo(() => groupEventsByDateKey(events), [events]);

  return (
    <Card className="overflow-hidden rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          {format(month, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg"
            onClick={onToday}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-lg"
            aria-label="Previous month"
            onClick={() => onMonthChange(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-lg"
            aria-label="Next month"
            onClick={() => onMonthChange(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-neutral-100 bg-neutral-50/80 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="border-r border-neutral-100 px-2 py-2 text-center last:border-r-0 dark:border-neutral-800"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day) => {
          const key = dateKey(day);
          const dayEvents = eventsOnDay(byDate, day);
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);
          const selected = selectedDay && isSameDay(day, selectedDay);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "min-h-[7.5rem] border-b border-r border-neutral-100 p-1.5 text-left align-top transition-colors hover:bg-neutral-50/80 dark:border-neutral-800 dark:hover:bg-neutral-900/50 sm:min-h-[6.75rem] md:min-h-[7.25rem] lg:min-h-[8.5rem]",
                !inMonth && "bg-neutral-50/50 text-neutral-400 dark:bg-neutral-900/30",
                today && "bg-primary-50/40 dark:bg-primary-950/25",
                selected && "ring-2 ring-inset ring-primary-500 dark:ring-primary-400"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                  today
                    ? "bg-primary-600 text-white"
                    : inMonth
                      ? "text-neutral-800 dark:text-neutral-100"
                      : "text-neutral-400"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((ev) => (
                  <span
                    key={`${ev.recordKind}:${ev.id}`}
                    role="button"
                    tabIndex={0}
                    title={`${activityTypeLabel(ev.type)} · ${ev.title}`}
                    className={eventPillClass(ev.type, ev.completed)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEvent?.(ev);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenEvent?.(ev);
                      }
                    }}
                  >
                    {format(new Date(ev.dueAt), "h:mm a")} {ev.title}
                  </span>
                ))}
                {dayEvents.length > MAX_VISIBLE_EVENTS ? (
                  <span className="block px-1 text-[10px] font-medium text-neutral-500">
                    +{dayEvents.length - MAX_VISIBLE_EVENTS} more
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
