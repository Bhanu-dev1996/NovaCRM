"use client";

import { cn } from "@/lib/utils";
import { SkeletonBlock } from "@/components/leads/lead-skeletons";

const panelShell =
  "overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950";

function LeadFieldSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonBlock className="h-2.5 w-16 rounded-md" />
      <SkeletonBlock className="h-3.5 w-full max-w-[180px] rounded-md" />
    </div>
  );
}

function SidebarPanelSkeleton({ tall = false }) {
  return (
    <div className={cn(panelShell, "p-4")}>
      <SkeletonBlock className="mb-3 h-2.5 w-20 rounded-md" />
      <SkeletonBlock className={cn("w-full rounded-lg", tall ? "h-28" : "h-20")} />
    </div>
  );
}

export function DealDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading deal">
      <div className={cn(panelShell, "overflow-hidden")}>
        <div className="border-b border-neutral-100 bg-gradient-to-r from-primary-50/60 to-white px-6 py-5 dark:border-neutral-800 dark:from-primary-950/40 dark:to-neutral-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 gap-3">
              <SkeletonBlock className="size-12 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <SkeletonBlock className="h-6 w-44 max-w-full rounded-lg" />
                  <SkeletonBlock className="h-5 w-16 rounded-full" />
                  <SkeletonBlock className="h-5 w-20 rounded-full" />
                </div>
                <SkeletonBlock className="h-3.5 w-56 max-w-full rounded-md" />
              </div>
            </div>
            <div className="flex w-full justify-end gap-2 sm:w-auto">
              <SkeletonBlock className="h-8 w-20 rounded-full" />
              <SkeletonBlock className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 px-6 py-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <LeadFieldSkeleton key={index} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className={cn(panelShell, "min-w-0 px-6 py-4")}>
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock
                key={index}
                className={cn("h-4 rounded-md", index === 0 ? "w-16" : "w-28")}
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
