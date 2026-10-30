"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

const ACTION_TITLES = {
  create: "Create",
  schedule: "Schedule Meeting",
};

function ModulePlaceholderInner({ title, description }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const source = searchParams.get("source");
  const stage = searchParams.get("stage");
  const status = searchParams.get("status");

  const filters = [
    source ? `Source: ${source}` : null,
    stage ? `Stage: ${stage}` : null,
    status ? `Status: ${status}` : null,
  ].filter(Boolean);

  const isCreate = action === "create" || action === "schedule";
  const heading = isCreate
    ? action === "schedule"
      ? "Schedule Meeting"
      : `${ACTION_TITLES.create} ${title.replace(/s$/, "")}`
    : title;

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col items-start gap-2 py-10">
      <h1 className="text-[28px] leading-8 font-bold tracking-[-0.03em] text-neutral-900 dark:text-neutral-50">
        {heading}
      </h1>
      <p className="max-w-[48ch] text-[14px] leading-6 text-neutral-500">
        {isCreate
          ? "Prototype destination — a full form will connect here next."
          : description}
      </p>

      {filters.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <span
              key={filter}
              className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300"
            >
              {filter}
            </span>
          ))}
        </div>
      ) : null}

      {isCreate ? (
        <div className="mt-6 w-full rounded-xl border border-primary-100 bg-primary-50/40 px-5 py-8 dark:border-primary-900 dark:bg-primary-950/30">
          <p className="text-center text-[13px] text-neutral-500">
            Ready for the {title.toLowerCase()} form wiring.
          </p>
          <div className="mt-4 flex justify-center">
            <Link
              href={pathname}
              className="inline-flex h-9 items-center rounded-lg border border-neutral-200 bg-white px-3 text-[13px] font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            >
              Back to {title}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 w-full rounded-xl border border-dashed border-neutral-200 bg-white px-5 py-10 text-center text-[13px] text-neutral-400 dark:border-neutral-700 dark:bg-neutral-950">
          <p>Module screens will connect here next.</p>
          <Link
            href={`${pathname}?action=${pathname.includes("calendar") ? "schedule" : "create"}`}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-primary-600 px-3 text-[13px] font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="size-3.5" />
            {pathname.includes("calendar") ? "Schedule Meeting" : `New ${title.replace(/s$/, "")}`}
          </Link>
        </div>
      )}
    </div>
  );
}

export function ModulePlaceholder(props) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[720px] py-10 text-[14px] text-neutral-400">
          Loading…
        </div>
      }
    >
      <ModulePlaceholderInner {...props} />
    </Suspense>
  );
}
