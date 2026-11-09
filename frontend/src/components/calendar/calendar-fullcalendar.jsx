"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import "@/styles/calendar-fullcalendar.css";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";

import {
  CALENDAR_TYPE_COLORS,
  mergedRowFromCalendarId,
  rowsToFullCalendarEvents,
} from "@/components/calendar/calendar-event-utils";
import { CalendarFcToolbar } from "@/components/calendar/calendar-fc-toolbar";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function CalendarFullCalendar({
  rows,
  onDatesChange,
  onSelectSlot,
  onOpenEvent,
  onReload,
}) {
  const calendarRef = useRef(null);
  const calendarApiRef = useRef(null);
  const [calendarApi, setCalendarApi] = useState(null);
  const [toolbarTitle, setToolbarTitle] = useState("");
  const [viewType, setViewType] = useState("dayGridMonth");

  const events = useMemo(() => rowsToFullCalendarEvents(rows), [rows]);

  const handleDatesSet = useCallback(
    (arg) => {
      calendarApiRef.current = arg.view.calendar;
      setCalendarApi(arg.view.calendar);
      setToolbarTitle(arg.view.title);
      setViewType(arg.view.type);
      onDatesChange?.(arg);
    },
    [onDatesChange]
  );

  const handleChangeView = useCallback((viewId) => {
    const api =
      calendarApiRef.current ||
      calendarRef.current?.getApi?.() ||
      calendarRef.current;
    if (!api?.changeView) return;
    setViewType(viewId);
    api.changeView(viewId);
  }, []);

  const persistSchedule = useCallback(
    async (calendarId, start, end) => {
      const parsed = mergedRowFromCalendarId(calendarId);
      if (!parsed || !start) return false;

      const due_at = start.toISOString();
      const durationMinutes = end
        ? Math.max(5, Math.round((end.getTime() - start.getTime()) / 60_000))
        : 30;

      try {
        if (parsed.recordKind === "task") {
          const existing = await apiFetch(`/api/tasks/${parsed.id}`);
          const row = existing.data || {};
          await apiFetch(`/api/tasks/${parsed.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              title: row.title,
              status: row.status,
              priority: row.priority,
              due_at,
              assignee_id: row.assignee_id,
            }),
          });
        } else {
          const existing = await apiFetch(`/api/activities/${parsed.id}`);
          const row = existing.data || {};
          const prevMeta =
            row.meta && typeof row.meta === "object" ? { ...row.meta } : {};
          await apiFetch(`/api/activities/${parsed.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              due_at,
              meta: {
                ...prevMeta,
                durationMinutes,
              },
            }),
          });
        }
        return true;
      } catch (error) {
        toast.error(error.message || "Could not update schedule");
        return false;
      }
    },
    []
  );

  const handleEventDrop = useCallback(
    async (info) => {
      const ok = await persistSchedule(
        info.event.id,
        info.event.start,
        info.event.end
      );
      if (ok) {
        toast.success("Schedule updated");
        onReload?.();
      } else {
        info.revert();
      }
    },
    [onReload, persistSchedule]
  );

  const handleEventResize = useCallback(
    async (info) => {
      const ok = await persistSchedule(
        info.event.id,
        info.event.start,
        info.event.end
      );
      if (ok) {
        toast.success("Duration updated");
        onReload?.();
      } else {
        info.revert();
      }
    },
    [onReload, persistSchedule]
  );

  return (
    <div
      className={cn(
        "calendar-fc-theme min-w-0 rounded-2xl border border-neutral-200/80 bg-card px-4 py-4 shadow-sm dark:border-neutral-800",
        viewType === "dayGridMonth" ? "overflow-hidden" : "overflow-x-auto"
      )}
    >
      <CalendarFcToolbar
        calendarApi={calendarApi}
        onChangeView={handleChangeView}
        title={toolbarTitle}
        viewType={viewType}
      />
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
        initialView="dayGridMonth"
        headerToolbar={false}
        height="auto"
        expandRows={viewType === "dayGridMonth"}
        contentHeight={
          viewType === "dayGridMonth" ? 780 : viewType === "timeGridDay" ? 680 : 700
        }
        views={{
          dayGridMonth: {
            dayMaxEvents: 3,
            fixedWeekCount: false,
            eventDisplay: "block",
            displayEventTime: false,
          },
          timeGridWeek: {
            slotEventOverlap: true,
            eventMaxStack: 2,
            eventDisplay: "auto",
            displayEventTime: true,
            displayEventEnd: false,
          },
          timeGridDay: {
            slotEventOverlap: true,
            eventMaxStack: 3,
            eventDisplay: "auto",
            displayEventTime: true,
            displayEventEnd: false,
          },
        }}
        moreLinkClick="popover"
        eventTimeFormat={{
          hour: "numeric",
          minute: "2-digit",
          meridiem: "short",
        }}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="18:00:00"
        scrollTime="08:00:00"
        slotDuration="00:30:00"
        snapDuration="00:15:00"
        nowIndicator
        editable
        eventStartEditable
        eventDurationEditable
        eventResizableFromStart
        selectable
        selectMirror
        dayMaxEvents={3}
        eventMinHeight={22}
        weekends
        events={events}
        businessHours={{
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: "08:00",
          endTime: "18:00",
        }}
        datesSet={handleDatesSet}
        eventDidMount={(info) => {
          const type = info.event.extendedProps?.type || "task";
          const colors =
            CALENDAR_TYPE_COLORS[type] || CALENDAR_TYPE_COLORS.task;
          info.el.style.backgroundColor = colors.bg;
          info.el.style.borderColor = colors.border;
          info.el.style.color = "#ffffff";
          const main = info.el.querySelector(".fc-event-main");
          if (main instanceof HTMLElement) {
            main.style.color = "#ffffff";
          }
        }}
        select={(info) => onSelectSlot?.(info)}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          const { recordKind, rowId } = info.event.extendedProps || {};
          if (recordKind && rowId) {
            onOpenEvent?.({ recordKind, id: rowId });
          }
        }}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
      />
    </div>
  );
}
