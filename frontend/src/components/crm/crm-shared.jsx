"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] text-error-text">{message}</p>;
}

export function CrmPageHeader({
  crumb,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <nav className="mb-2 flex items-center gap-1.5 text-[12px] text-primary-500/80">
          <span>Workspace</span>
          <span className="text-primary-300">/</span>
          <span className="font-medium text-primary-700 dark:text-primary-300">
            {crumb}
          </span>
        </nav>
        <h1 className="text-[26px] leading-8 font-bold tracking-[-0.03em] text-neutral-900 sm:text-[28px] dark:text-neutral-50">
          {title}
        </h1>
        <p className="mt-1 max-w-[56ch] text-[14px] text-neutral-500">
          {description}
        </p>
      </div>
      {actionLabel ? (
        <Button
          type="button"
          className="h-9 gap-1.5 rounded-lg"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function CrmEmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-5 py-14 text-center dark:border-neutral-700 dark:bg-neutral-950">
      <h2 className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-50">
        {title}
      </h2>
      <p className="mx-auto mt-1 max-w-[42ch] text-[13px] text-neutral-500">
        {description}
      </p>
      {actionLabel ? (
        <Button type="button" className="mt-5 h-9 rounded-lg" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function CrmSkeleton({ rows = 5 }) {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded bg-neutral-200/70 dark:bg-neutral-800" />
        <div className="h-8 w-48 animate-pulse rounded-xl bg-neutral-200/70 dark:bg-neutral-800" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-neutral-200/70 dark:bg-neutral-800" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-14 animate-pulse bg-neutral-100/80 dark:bg-neutral-900",
              index > 0 && "border-t border-neutral-100 dark:border-neutral-800"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

export function displayName(row) {
  const first = row?.first_name || "";
  const last = row?.last_name || "";
  const full = `${first} ${last}`.trim();
  return full || row?.email || "Untitled";
}
