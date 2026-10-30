"use client";

import { useEffect, useMemo, useState } from "react";
import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const DATE_RANGE_PRESETS = [
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
  "Last Month",
  "Custom Range",
];

export function resolveDateRange(preset, customRange) {
  const now = new Date();
  switch (preset) {
    case "Today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "Yesterday": {
      const day = subDays(now, 1);
      return { from: startOfDay(day), to: endOfDay(day) };
    }
    case "Last 7 Days":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "Last 30 Days":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case "This Month":
      return { from: startOfMonth(now), to: endOfDay(now) };
    case "Last Month": {
      const prev = subMonths(now, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    }
    case "Custom Range":
      if (customRange?.from && customRange?.to) {
        return {
          from: startOfDay(customRange.from),
          to: endOfDay(customRange.to),
        };
      }
      return {
        from: startOfDay(subDays(now, 13)),
        to: endOfDay(now),
      };
    default:
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
  }
}

export function formatDateRangeLabel(preset, range) {
  if (preset !== "Custom Range") return preset;
  if (!range?.from) return "Custom Range";
  if (!range.to) return format(range.from, "MMM d, yyyy");
  return `${format(range.from, "MMM d")} – ${format(range.to, "MMM d, yyyy")}`;
}

function footerLabel(draftRange) {
  if (!draftRange?.from) return "Select date range";
  if (!draftRange.to) return format(draftRange.from, "MMM d, yyyy");
  return `${format(draftRange.from, "MMM d")} – ${format(draftRange.to, "MMM d, yyyy")}`;
}

export function DateRangePicker({
  preset = "Last 30 Days",
  range,
  onChange,
  className,
  align = "end",
}) {
  const [open, setOpen] = useState(false);
  const [draftPreset, setDraftPreset] = useState(preset);
  const [draftRange, setDraftRange] = useState(
    () => range || resolveDateRange(preset)
  );
  const [month, setMonth] = useState(
    () => (range || resolveDateRange(preset)).from
  );

  useEffect(() => {
    if (!open) return;
    setDraftPreset(preset);
    const nextRange = range || resolveDateRange(preset);
    setDraftRange(nextRange);
    setMonth(nextRange.from || new Date());
  }, [open, preset, range]);

  const triggerLabel = useMemo(
    () => formatDateRangeLabel(preset, range),
    [preset, range]
  );

  function selectPreset(nextPreset) {
    setDraftPreset(nextPreset);
    if (nextPreset === "Custom Range") return;
    const nextRange = resolveDateRange(nextPreset);
    setDraftRange(nextRange);
    setMonth(nextRange.from);
  }

  function handleSelect(nextRange) {
    setDraftPreset("Custom Range");
    setDraftRange(nextRange);
  }

  function handleCancel() {
    setOpen(false);
  }

  function handleApply() {
    const appliedRange =
      draftPreset === "Custom Range"
        ? {
            from: draftRange?.from,
            to: draftRange?.to || draftRange?.from,
          }
        : resolveDateRange(draftPreset);
    if (!appliedRange?.from) return;
    onChange?.({
      preset: draftPreset,
      range: {
        from: startOfDay(appliedRange.from),
        to: endOfDay(appliedRange.to || appliedRange.from),
      },
    });
    setOpen(false);
  }

  const canApply =
    draftPreset !== "Custom Range" || Boolean(draftRange?.from && draftRange?.to);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={cn(
              "h-9 min-w-[10.5rem] justify-start rounded-lg border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900",
              className
            )}
            aria-label="Date range"
          />
        }
      >
        <CalendarDays className="size-3.5 text-neutral-400" />
        <span className="truncate">{triggerLabel}</span>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={8}
        className="w-auto max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border-neutral-200 bg-white p-0 text-neutral-900 shadow-xl ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50 dark:ring-neutral-700"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="flex shrink-0 flex-row gap-1 overflow-x-auto border-b border-neutral-100 bg-neutral-50/80 p-2 sm:w-[148px] sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0 sm:p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
            {DATE_RANGE_PRESETS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => selectPreset(item)}
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-[13px] whitespace-nowrap transition-colors",
                  draftPreset === item
                    ? "bg-primary-50 font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                    : "font-medium text-neutral-500 hover:bg-white hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="min-w-0 p-3 sm:p-4">
            <Calendar
              mode="range"
              numberOfMonths={2}
              month={month}
              onMonthChange={setMonth}
              selected={draftRange}
              onSelect={handleSelect}
              disabled={{ after: new Date() }}
              showOutsideDays={false}
              className="bg-transparent"
              classNames={{
                today: "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
                range_start: "rounded-l-lg bg-primary-50 dark:bg-primary-950/50",
                range_middle: "rounded-none bg-primary-50 dark:bg-primary-950/50",
                range_end: "rounded-r-lg bg-primary-50 dark:bg-primary-950/50",
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
            {footerLabel(draftRange)}
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="h-8 rounded-lg border-neutral-200 dark:border-neutral-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!canApply}
              onClick={handleApply}
              className="h-8 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
