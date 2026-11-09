"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIEW_OPTIONS = [
  { id: "dayGridMonth", label: "Month" },
  { id: "timeGridWeek", label: "Week" },
  { id: "timeGridDay", label: "Day" },
];

export function CalendarFcToolbar({
  calendarApi,
  onChangeView,
  title,
  viewType,
}) {
  const api = () => calendarApi;

  return (
    <header className="mb-4 space-y-3">
      <h2 className="text-center text-lg font-semibold tracking-tight text-foreground sm:text-xl lg:text-left">
        {title || "\u00a0"}
      </h2>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <div className="inline-flex divide-x divide-border overflow-hidden rounded-lg border border-border bg-background shadow-sm">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-none border-0 shadow-none hover:bg-muted"
              aria-label="Previous"
              onClick={() => api()?.prev()}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-none border-0 shadow-none hover:bg-muted"
              aria-label="Next"
              onClick={() => api()?.next()}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => api()?.today()}
          >
            Today
          </Button>
        </div>

        <div
          className="inline-flex justify-center rounded-lg border border-border bg-muted/30 p-0.5 sm:justify-end"
          role="group"
          aria-label="Calendar view"
        >
          {VIEW_OPTIONS.map((option) => {
            const active = viewType === option.id;
            return (
              <Button
                key={option.id}
                type="button"
                size="sm"
                variant={active ? "default" : "ghost"}
                className={cn(
                  "h-8 min-w-[4.5rem] rounded-md px-3 shadow-none",
                  !active && "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={active}
                onClick={() => onChangeView(option.id)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
