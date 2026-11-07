"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const PIPELINE_PILL_CLASSES = [
  "w-[72px]",
  "w-[88px]",
  "w-[104px]",
  "w-[96px]",
  "w-[108px]",
  "w-[92px]",
  "w-[76px]",
];

export function SkeletonBlock({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-neutral-200/70 dark:bg-neutral-800",
        className
      )}
    />
  );
}

function SummaryCardSkeleton() {
  return (
    <Card className="py-4">
      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-3">
            <SkeletonBlock className="h-3 w-24 rounded-md" />
            <SkeletonBlock className="h-7 w-20 rounded-lg" />
          </div>
          <SkeletonBlock className="size-8 shrink-0 rounded-full" />
        </div>
        <SkeletonBlock className="mt-3 h-3 w-36 rounded-md" />
      </CardContent>
    </Card>
  );
}

function LeadTableRowSkeleton() {
  return (
    <TableRow>
      <TableCell className="w-10 px-3 py-2.5">
        <SkeletonBlock className="size-4 rounded-[4px]" />
      </TableCell>
      <TableCell className="w-[240px] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <SkeletonBlock className="size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <SkeletonBlock className="h-3 w-[85%] max-w-[140px] rounded-md" />
            <SkeletonBlock className="h-3 w-[70%] max-w-[120px] rounded-md" />
          </div>
        </div>
      </TableCell>
      <TableCell className="w-[160px] px-3 py-2.5">
        <SkeletonBlock className="h-3 w-24 rounded-md" />
      </TableCell>
      <TableCell className="px-3 py-2.5">
        <SkeletonBlock className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell className="px-3 py-2.5">
        <SkeletonBlock className="size-9 rounded-full" />
      </TableCell>
      <TableCell className="w-[120px] px-3 py-2.5">
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </TableCell>
      <TableCell className="w-[150px] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <SkeletonBlock className="size-6 shrink-0 rounded-full" />
          <SkeletonBlock className="h-3 min-w-0 flex-1 rounded-md" />
        </div>
      </TableCell>
      <TableCell className="px-3 py-2.5">
        <div className="flex items-center justify-center gap-1">
          <SkeletonBlock className="size-8 rounded-lg" />
          <SkeletonBlock className="size-8 rounded-lg" />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function LeadsSkeleton() {
  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6"
      aria-busy="true"
      aria-label="Loading leads"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav
            className={cn("mb-2 flex items-center gap-1.5", crmType.breadcrumb)}
            aria-hidden
          >
            <SkeletonBlock className="h-3 w-16 rounded-md" />
            <span className="text-primary-300">/</span>
            <SkeletonBlock className="h-3 w-10 rounded-md" />
          </nav>
          <SkeletonBlock className="h-8 w-24 rounded-lg sm:h-[28px] sm:w-28" />
          <SkeletonBlock className="mt-1 h-4 w-[min(56ch,100%)] max-w-xl rounded-md" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-9 w-[118px] rounded-lg" />
          <SkeletonBlock className="h-9 w-9 rounded-lg" />
          <SkeletonBlock className="h-9 w-9 rounded-lg" />
          <SkeletonBlock className="h-9 w-[104px] rounded-lg" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SummaryCardSkeleton key={index} />
        ))}
      </div>

      <div className="min-w-0 w-full overflow-x-auto">
        <div className="flex flex-nowrap items-center gap-4 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 dark:border-neutral-800 dark:bg-neutral-950">
          <SkeletonBlock className="h-3 w-14 shrink-0 rounded-md" />
          {PIPELINE_PILL_CLASSES.map((widthClass, index) => (
            <SkeletonBlock
              key={index}
              className={cn("h-7 shrink-0 rounded-md", widthClass)}
            />
          ))}
        </div>
      </div>

      <Card className="overflow-hidden py-0">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-3 dark:border-neutral-800">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <SkeletonBlock className="h-9 min-w-[280px] max-w-xl flex-1 rounded-lg" />
              <SkeletonBlock className="h-9 w-[88px] rounded-lg" />
              <SkeletonBlock className="h-9 w-[72px] rounded-lg" />
              <SkeletonBlock className="h-9 w-[96px] rounded-lg" />
            </div>
            <SkeletonBlock className="h-9 w-[148px] shrink-0 rounded-lg" />
          </div>
        </div>

        <Table className="min-w-[1100px] table-fixed text-xs">
          <TableHeader>
            <TableRow className="bg-muted/50 text-xs hover:bg-muted/50">
              <TableHead className="w-10 px-3">
                <SkeletonBlock className="size-4 rounded-[4px]" />
              </TableHead>
              <TableHead className="w-[240px] px-3">
                <SkeletonBlock className="h-3 w-16 rounded-md" />
              </TableHead>
              <TableHead className="w-[160px] px-3">
                <SkeletonBlock className="h-3 w-14 rounded-md" />
              </TableHead>
              <TableHead className="px-3">
                <SkeletonBlock className="h-3 w-[72px] rounded-md" />
              </TableHead>
              <TableHead className="px-3">
                <SkeletonBlock className="h-3 w-16 rounded-md" />
              </TableHead>
              <TableHead className="w-[120px] px-3">
                <SkeletonBlock className="h-3 w-12 rounded-md" />
              </TableHead>
              <TableHead className="w-[150px] px-3">
                <SkeletonBlock className="h-3 w-[68px] rounded-md" />
              </TableHead>
              <TableHead className="px-3 text-center">
                <SkeletonBlock className="mx-auto h-3 w-12 rounded-md" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, index) => (
              <LeadTableRowSkeleton key={index} />
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-3 py-2.5 dark:border-neutral-800">
          <SkeletonBlock className="h-3 w-40 rounded-md" />
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-8 w-[108px] rounded-lg" />
            <SkeletonBlock className="h-8 w-[76px] rounded-lg" />
            <SkeletonBlock className="h-3 w-10 rounded-md" />
            <SkeletonBlock className="h-8 w-[52px] rounded-lg" />
          </div>
        </div>
      </Card>
    </div>
  );
}

const panelShell =
  "overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950";

function LeadFieldSkeleton() {
  return (
    <div className="min-w-0 space-y-1.5">
      <SkeletonBlock className="h-2.5 w-12 rounded-md" />
      <SkeletonBlock className="h-4 w-full max-w-[140px] rounded-md" />
    </div>
  );
}

function SidebarPanelSkeleton({ tall = false }) {
  return (
    <div className={cn(panelShell, "p-4", tall ? "min-h-[120px]" : "min-h-[100px]")}>
      <SkeletonBlock className="mb-3 h-2.5 w-20 rounded-md" />
      <SkeletonBlock className="h-16 w-full rounded-lg" />
    </div>
  );
}

export function LeadDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading lead">
      <div className={cn(panelShell, "px-6 py-4")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <SkeletonBlock className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <SkeletonBlock className="h-6 w-44 max-w-full rounded-lg" />
                <SkeletonBlock className="h-5 w-14 rounded-full" />
                <SkeletonBlock className="h-5 w-20 rounded-full" />
              </div>
              <SkeletonBlock className="h-3.5 w-56 max-w-full rounded-md" />
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <SkeletonBlock className="h-8 w-24 rounded-lg" />
            <SkeletonBlock className="h-8 w-28 rounded-lg" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-neutral-100 pt-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-neutral-800">
          {Array.from({ length: 6 }).map((_, index) => (
            <LeadFieldSkeleton key={index} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className={cn(panelShell, "min-w-0 px-6 py-4")}>
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBlock
                key={index}
                className={cn(
                  "h-4 rounded-md",
                  index === 0 ? "w-16" : "w-24"
                )}
              />
            ))}
          </div>
          <div className="mt-4 space-y-4">
            <SkeletonBlock className="h-24 w-full rounded-lg" />
            <div className="space-y-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex gap-3">
                  <SkeletonBlock className="size-8 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonBlock className="h-3.5 w-28 rounded-md" />
                    <SkeletonBlock className="h-12 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <SidebarPanelSkeleton />
          <SidebarPanelSkeleton />
          <SidebarPanelSkeleton tall />
        </aside>
      </div>
    </div>
  );
}
