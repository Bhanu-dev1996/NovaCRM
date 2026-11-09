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
    <Card className="rounded-2xl py-4">
      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-3">
            <SkeletonBlock className="h-3 w-24 rounded-md" />
            <SkeletonBlock className="h-8 w-16 rounded-lg" />
          </div>
          <SkeletonBlock className="size-9 shrink-0 rounded-full" />
        </div>
        <SkeletonBlock className="mt-3 h-3 w-36 rounded-md" />
      </CardContent>
    </Card>
  );
}

function ActivityTableRowSkeleton() {
  return (
    <TableRow>
      <TableCell className="w-10 px-3 py-2.5">
        <SkeletonBlock className="size-4 rounded-[4px]" />
      </TableCell>
      <TableCell className="w-[260px] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <SkeletonBlock className="size-8 shrink-0 rounded-lg" />
          <SkeletonBlock className="h-3 min-w-0 flex-1 rounded-md" />
        </div>
      </TableCell>
      <TableCell className="w-[110px] px-3 py-2.5">
        <SkeletonBlock className="h-5 w-14 rounded-full" />
      </TableCell>
      <TableCell className="w-[180px] px-3 py-2.5">
        <SkeletonBlock className="mb-1 h-3 w-24 rounded-md" />
        <SkeletonBlock className="h-2.5 w-20 rounded-md" />
      </TableCell>
      <TableCell className="w-[150px] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <SkeletonBlock className="size-6 shrink-0 rounded-full" />
          <SkeletonBlock className="h-3 min-w-0 flex-1 rounded-md" />
        </div>
      </TableCell>
      <TableCell className="w-[120px] px-3 py-2.5">
        <SkeletonBlock className="h-3 w-16 rounded-md" />
      </TableCell>
      <TableCell className="w-[100px] px-3 py-2.5">
        <SkeletonBlock className="h-5 w-14 rounded-full" />
      </TableCell>
      <TableCell className="w-[120px] px-3 py-2.5">
        <SkeletonBlock className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell className="px-3 py-2.5">
        <div className="flex items-center justify-center gap-1">
          <SkeletonBlock className="size-8 rounded-lg" />
          <SkeletonBlock className="size-8 rounded-lg" />
          <SkeletonBlock className="size-8 rounded-lg" />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ActivitiesSkeleton() {
  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6"
      aria-busy="true"
      aria-label="Loading activities"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav
            className={cn("mb-2 flex items-center gap-1.5", crmType.breadcrumb)}
            aria-hidden
          >
            <SkeletonBlock className="h-3 w-16 rounded-md" />
            <span className="text-primary-300">/</span>
            <SkeletonBlock className="h-3 w-16 rounded-md" />
          </nav>
          <SkeletonBlock className="h-8 w-28 rounded-lg sm:h-[28px] sm:w-32" />
          <SkeletonBlock className="mt-1 h-4 w-[min(56ch,100%)] max-w-xl rounded-md" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock
            key="activities-skel-create"
            className="h-9 w-[132px] shrink-0 rounded-lg"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SummaryCardSkeleton key={index} />
        ))}
      </div>

      <Card className="overflow-hidden rounded-2xl py-0">
        <div className="flex items-center justify-between gap-2 border-b px-3 pt-1">
          <div className="flex gap-2 overflow-x-auto py-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-8 w-28 shrink-0 rounded-md" />
            ))}
          </div>
          <SkeletonBlock className="mb-1 h-8 w-36 shrink-0 rounded-lg" />
        </div>
        <div className="flex flex-col gap-3 border-t border-neutral-100 p-3 dark:border-neutral-800">
          <div className="flex flex-wrap items-center gap-2">
            <SkeletonBlock className="h-9 min-w-[280px] max-w-xl flex-1 rounded-lg" />
            <SkeletonBlock className="h-9 w-[88px] rounded-lg" />
            <SkeletonBlock className="h-9 w-[72px] rounded-lg" />
            <SkeletonBlock className="h-9 w-[96px] rounded-lg" />
          </div>
        </div>

        <Table className="min-w-[1180px] table-fixed text-xs">
          <TableHeader>
            <TableRow className="bg-neutral-50/80">
              <TableHead className="w-10 px-3">
                <SkeletonBlock className="size-4 rounded-[4px]" />
              </TableHead>
              <TableHead className="w-[260px] px-3">
                <SkeletonBlock className="h-3 w-14 rounded-md" />
              </TableHead>
              <TableHead className="w-[110px] px-3">
                <SkeletonBlock className="h-3 w-10 rounded-md" />
              </TableHead>
              <TableHead className="w-[180px] px-3">
                <SkeletonBlock className="h-3 w-16 rounded-md" />
              </TableHead>
              <TableHead className="w-[150px] px-3">
                <SkeletonBlock className="h-3 w-20 rounded-md" />
              </TableHead>
              <TableHead className="w-[120px] px-3">
                <SkeletonBlock className="h-3 w-16 rounded-md" />
              </TableHead>
              <TableHead className="w-[100px] px-3">
                <SkeletonBlock className="h-3 w-12 rounded-md" />
              </TableHead>
              <TableHead className="w-[120px] px-3">
                <SkeletonBlock className="h-3 w-12 rounded-md" />
              </TableHead>
              <TableHead className="px-3 text-center">
                <SkeletonBlock className="mx-auto h-3 w-12 rounded-md" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, index) => (
              <ActivityTableRowSkeleton key={index} />
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

function DetailFieldSkeleton() {
  return (
    <div className="min-w-0 space-y-1.5">
      <SkeletonBlock className="h-2.5 w-16 rounded-md" />
      <SkeletonBlock className="h-4 w-full max-w-[180px] rounded-md" />
    </div>
  );
}

function TitleRowSkeleton({ large = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SkeletonBlock
        className={cn(
          "rounded-lg",
          large ? "h-7 w-56 max-w-full" : "h-6 w-40 max-w-full"
        )}
      />
      <SkeletonBlock className="h-5 w-14 rounded-full" />
      <SkeletonBlock className="h-5 w-20 rounded-full" />
    </div>
  );
}

export function ActivityDetailSkeleton() {
  return (
    <div
      className="mx-auto w-full min-w-0 max-w-[960px] space-y-6"
      aria-busy="true"
      aria-label="Loading activity"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <nav
            className={cn("flex items-center gap-1.5", crmType.breadcrumb)}
            aria-hidden
          >
            <SkeletonBlock className="h-3 w-14 rounded-md" />
            <span className="text-primary-300">/</span>
            <SkeletonBlock className="h-3 w-16 rounded-md" />
          </nav>
          <TitleRowSkeleton />
        </div>
        <div className="flex flex-wrap gap-2">
          <SkeletonBlock className="h-9 w-24 rounded-lg" />
          <SkeletonBlock className="h-9 w-28 rounded-lg" />
          <SkeletonBlock className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="space-y-5 p-5">
          <TitleRowSkeleton large />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <DetailFieldSkeleton key={index} />
            ))}
          </div>
          <div className="space-y-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
            <SkeletonBlock className="h-2.5 w-12 rounded-md" />
            <SkeletonBlock className="h-20 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
