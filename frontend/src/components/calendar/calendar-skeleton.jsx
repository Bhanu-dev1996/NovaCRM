"use client";

import { SkeletonBlock } from "@/components/activities/activity-skeletons";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGridSkeleton({ className }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200/80 bg-card px-4 py-4 shadow-sm dark:border-neutral-800",
        className
      )}
      aria-hidden
    >
      <div className="mb-4 space-y-3 border-b border-border/60 pb-4">
        <SkeletonBlock className="mx-auto h-7 w-44 rounded-lg lg:mx-0" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <SkeletonBlock className="h-8 w-[4.75rem] rounded-lg" />
            <SkeletonBlock className="h-8 w-16 rounded-lg" />
          </div>
          <SkeletonBlock className="mx-auto h-9 w-[14.5rem] rounded-lg sm:mx-0" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80">
        <div className="grid grid-cols-7 border-b border-border/80 bg-muted/50">
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="border-r border-border/60 px-2 py-2.5 text-center last:border-r-0"
            >
              <SkeletonBlock className="mx-auto h-3 w-7 rounded-md" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, index) => (
            <div
              key={index}
              className="min-h-[6.75rem] border-b border-r border-border/60 bg-card p-2 [&:nth-child(7n)]:border-r-0"
            >
              <SkeletonBlock className="ml-auto h-4 w-5 rounded-md" />
              {index % 5 === 2 ? (
                <div className="mt-2 space-y-1.5">
                  <SkeletonBlock className="h-4 w-full rounded-md" />
                  <SkeletonBlock className="h-4 w-[85%] rounded-md" />
                </div>
              ) : null}
              {index % 7 === 3 ? (
                <SkeletonBlock className="mt-2 h-3 w-12 rounded-md" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SidebarCardSkeleton({ lines = 2 }) {
  return (
    <Card className="rounded-2xl py-3">
      <CardContent className="space-y-3 px-4">
        <SkeletonBlock className="h-3 w-32 rounded-md" />
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBlock
            key={i}
            className={cn(
              "h-9 w-full rounded-lg",
              i === lines - 1 && lines > 1 && "h-8 w-4/5"
            )}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <nav className="mb-2 flex items-center gap-1.5" aria-hidden>
          <SkeletonBlock className="h-3 w-14 rounded-md" />
          <span className="text-primary-300">/</span>
          <SkeletonBlock className="h-3 w-16 rounded-md" />
        </nav>
        <SkeletonBlock className="h-8 w-32 rounded-lg" />
        <SkeletonBlock className="mt-2 h-4 w-[min(52ch,100%)] max-w-xl rounded-md" />
      </div>
      <SkeletonBlock className="h-9 w-40 shrink-0 rounded-lg" />
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-5"
      aria-busy="true"
      aria-label="Loading calendar"
    >
      <HeaderSkeleton />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_252px] 2xl:grid-cols-[minmax(0,1fr)_280px]">
        <CalendarGridSkeleton />

        <aside className="flex flex-col gap-4" aria-hidden>
          <SidebarCardSkeleton lines={3} />
          <Card className="rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800">
            <CardContent className="space-y-2 px-4 py-3.5">
              <SkeletonBlock className="h-3 w-24 rounded-md" />
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-neutral-200/80 p-2 dark:border-neutral-800">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-6 w-full rounded-[5px]" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800">
            <CardContent className="space-y-2 px-4 py-3.5">
              <SkeletonBlock className="h-3 w-20 rounded-md" />
              <div className="space-y-2 rounded-xl border border-neutral-200/80 p-2 dark:border-neutral-800">
                <div className="grid grid-cols-2 gap-1.5">
                  <SkeletonBlock className="h-14 rounded-lg" />
                  <SkeletonBlock className="h-14 rounded-lg" />
                </div>
                <SkeletonBlock className="h-px w-full" />
                <SkeletonBlock className="h-2.5 w-8 rounded-md" />
                <div className="grid grid-cols-2 gap-1">
                  <SkeletonBlock className="h-7 rounded-md" />
                  <SkeletonBlock className="h-7 rounded-md" />
                  <SkeletonBlock className="col-span-2 h-7 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
