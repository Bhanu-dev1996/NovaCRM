"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, ChevronDown, ChevronUp, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MINUTE_STEP = 5;
const TIME_BTN =
  "flex h-9 w-full items-center justify-center transition-colors hover:bg-muted hover:text-foreground";

function combineDateAndTime(date, timeValue) {
  if (!date) return null;
  const [hours = "0", minutes = "0"] = String(timeValue || "09:00").split(":");
  const next = new Date(date);
  next.setHours(Number(hours), Number(minutes), 0, 0);
  return next;
}

function timeFromDate(date) {
  if (!date) return "09:00";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseTime(timeValue) {
  const [hours = "0", minutes = "0"] = String(timeValue || "09:00").split(":");
  const hour24 = Number(hours);
  const minute = Number(minutes);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  const snappedMinute =
    Math.round(minute / MINUTE_STEP) * MINUTE_STEP === 60
      ? 0
      : Math.round(minute / MINUTE_STEP) * MINUTE_STEP;
  return { hour24, hour12, minute: snappedMinute, period };
}

function toTimeValue(hour12, minute, period) {
  let hour24 = hour12 % 12;
  if (period === "PM") hour24 += 12;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hour24)}:${pad(minute)}`;
}

function formatTimeLabel(timeValue) {
  const { hour24, minute } = parseTime(timeValue);
  const date = new Date();
  date.setHours(hour24, minute, 0, 0);
  return format(date, "h:mm a");
}

function TimeStepper({ label, value, display, onIncrement, onDecrement }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex w-full flex-col overflow-hidden rounded-lg border border-border">
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={onIncrement}
          className={cn(TIME_BTN, "text-muted-foreground")}
        >
          <ChevronUp className="size-3.5" />
        </button>
        <div className="flex h-9 items-center justify-center border-y border-border bg-background text-sm font-medium tabular-nums">
          {display ?? String(value).padStart(2, "0")}
        </div>
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={onDecrement}
          className={cn(TIME_BTN, "text-muted-foreground")}
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function DateTimePicker({
  id,
  value,
  onChange,
  placeholder = "Pick date and time",
  className,
  disabled = false,
  align = "start",
}) {
  const [open, setOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const selected =
    value instanceof Date && !Number.isNaN(value.getTime()) ? value : null;
  const [draftDate, setDraftDate] = useState(selected || new Date());
  const [draftTime, setDraftTime] = useState(timeFromDate(selected));

  const label = useMemo(() => {
    if (!selected) return placeholder;
    return format(selected, "MMM d, yyyy · h:mm a");
  }, [placeholder, selected]);

  const { hour12, minute, period } = parseTime(draftTime);

  function commitParts(nextHour12, nextMinute, nextPeriod) {
    const nextTime = toTimeValue(nextHour12, nextMinute, nextPeriod);
    setDraftTime(nextTime);
    const base = draftDate || selected || new Date();
    setDraftDate(base);
    onChange?.(combineDateAndTime(base, nextTime));
  }

  function handleOpenChange(nextOpen) {
    if (nextOpen) {
      const base = selected || new Date();
      setDraftDate(base);
      setDraftTime(timeFromDate(base));
      setTimeOpen(false);
    } else {
      setTimeOpen(false);
    }
    setOpen(nextOpen);
  }

  function handleSelect(date) {
    if (!date) return;
    setDraftDate(date);
    onChange?.(combineDateAndTime(date, draftTime));
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={cn(
              "h-9 w-full justify-start gap-2 rounded-lg border-input bg-transparent px-2.5 text-sm font-normal shadow-none dark:bg-input/30",
              !selected && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{label}</span>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side="bottom"
        sideOffset={8}
        positionMethod="fixed"
        collisionPadding={16}
        collisionAvoidance={{
          side: "flip",
          align: "shift",
          fallbackAxisSide: "none",
        }}
        className="w-(--anchor-width) min-w-(--anchor-width) max-w-[calc(100vw-24px)] overflow-x-hidden overflow-y-auto rounded-xl p-0"
      >
        {!timeOpen ? (
          <Calendar
            mode="single"
            selected={draftDate}
            onSelect={handleSelect}
            defaultMonth={draftDate}
            showOutsideDays={false}
            className="w-full p-3 [--cell-size:2rem] [&_button[data-day]]:size-8 [&_button[data-day]]:min-w-8 [&_button[data-day]]:w-8"
            classNames={{
              root: "w-full",
              months: "w-full",
              month: "w-full gap-3",
              month_grid: "w-full",
              weekdays: "grid w-full grid-cols-7",
              weekday:
                "flex size-8 w-full items-center justify-center text-center",
              week: "mt-1 grid w-full grid-cols-7",
              day: "relative flex h-8 w-full items-center justify-center p-0 aspect-auto bg-transparent data-[selected=true]:bg-transparent",
              today: "bg-transparent data-[selected=true]:bg-transparent",
              selected: "bg-transparent",
            }}
          />
        ) : null}
        <div className={cn("p-3", !timeOpen && "border-t border-border")}>
          <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
            Time
          </label>
          <button
            type="button"
            onClick={() => setTimeOpen((prev) => !prev)}
            className={cn(
              "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors hover:bg-muted/60 dark:bg-input/30",
              timeOpen && "border-ring bg-muted/60 ring-3 ring-ring/50"
            )}
          >
            <span className="tabular-nums">{formatTimeLabel(draftTime)}</span>
            <Clock className="size-3.5 shrink-0 text-muted-foreground" />
          </button>
          {timeOpen ? (
            <div className="mt-3 flex w-full min-w-0 items-end gap-2">
              <TimeStepper
                label="Hour"
                value={hour12}
                onIncrement={() =>
                  commitParts(hour12 === 12 ? 1 : hour12 + 1, minute, period)
                }
                onDecrement={() =>
                  commitParts(hour12 === 1 ? 12 : hour12 - 1, minute, period)
                }
              />
              <TimeStepper
                label="Minute"
                value={minute}
                onIncrement={() =>
                  commitParts(hour12, (minute + MINUTE_STEP) % 60, period)
                }
                onDecrement={() =>
                  commitParts(hour12, (minute - MINUTE_STEP + 60) % 60, period)
                }
              />
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Period
                </span>
                <div className="flex h-[108px] w-full flex-col overflow-hidden rounded-lg border border-border">
                  {["AM", "PM"].map((item, index) => {
                    const active = period === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => commitParts(hour12, minute, item)}
                        className={cn(
                          "flex flex-1 items-center justify-center text-sm font-medium transition-colors",
                          active
                            ? "bg-primary-600 text-white"
                            : "bg-background text-foreground hover:bg-muted",
                          index === 0 && "border-b border-border"
                        )}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
