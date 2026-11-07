"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

function InfoTile({ label, value, href }) {
  return (
    <Card size="sm" className="rounded-2xl py-3.5 ring-neutral-200/80">
      <CardContent className="px-3.5">
        <p className="text-[11px] font-medium tracking-[0.06em] text-neutral-400 uppercase">
          {label}
        </p>
        {href && value ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block truncate text-[14px] font-semibold text-primary-700 hover:underline dark:text-primary-300"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1 truncate text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">
            {value || "—"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function CompanyDetailSkeleton() {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 max-w-[1440px] animate-pulse overflow-hidden rounded-xl",
        "border border-neutral-200 dark:border-neutral-800"
      )}
      aria-busy="true"
      aria-label="Loading company"
    >
      <div className="flex gap-3 p-6">
        <div className="size-11 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-6 pt-0">
        <div className="h-20 rounded-2xl bg-muted" />
        <div className="h-20 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

export function CompanyDetailView({ companyId }) {
  const [loadStatus, setLoadStatus] = useState("loading");
  const [company, setCompany] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadStatus("loading");
      try {
        const detail = await apiFetch(`/api/companies/${companyId}`);
        if (cancelled) return;
        setCompany(detail.data);
        setLoadStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load company");
          setLoadStatus("error");
        }
      }
    }
    if (companyId) load();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (loadStatus === "loading") {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4 pb-10">
        <PageBreadcrumb
          items={[{ href: "/companies", label: "Companies" }, { label: "Loading…" }]}
        />
        <CompanyDetailSkeleton />
      </div>
    );
  }

  if (loadStatus === "error" || !company) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1440px] pb-10">
        <PageBreadcrumb
          items={[{ href: "/companies", label: "Companies" }, { label: "Not found" }]}
        />
        <p className="py-16 text-center text-muted-foreground">Company not found.</p>
      </div>
    );
  }

  const website = company.website?.trim();
  const websiteHref = website
    ? website.startsWith("http")
      ? website
      : `https://${website}`
    : null;
  const websiteLabel = website
    ? website.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "";

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4 pb-10">
      <PageBreadcrumb
        items={[
          { href: "/companies", label: "Companies" },
          { label: company.name || "Company" },
        ]}
      />

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-start gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            <Building2 className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[18px] font-semibold tracking-[-0.02em] text-neutral-900 dark:text-neutral-50">
              {company.name}
            </h1>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              {company.industry || "Company profile"}
            </p>
          </div>
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-2">
          <InfoTile label="Industry" value={company.industry} />
          <InfoTile label="Size" value={company.size} />
          <InfoTile
            label="Website"
            value={websiteLabel}
            href={websiteHref}
          />
          <InfoTile label="Phone" value={company.phone} />
        </div>
      </div>
    </div>
  );
}
