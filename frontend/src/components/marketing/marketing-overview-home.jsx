"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  FileText,
  Megaphone,
  PenLine,
  Plus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { fetchMarketingState } from "@/components/marketing/marketing-api";
import { useCampaignWizard } from "@/components/marketing/marketing-campaign-wizard-provider";
import { MarketingCampaignWorkspace } from "@/components/marketing/marketing-campaign-workspace";
import {
  MarketingAudiencesSnapshot,
  MarketingPipelinePanel,
  MarketingTemplatesSnapshot,
} from "@/components/marketing/marketing-overview-panels";
import { MarketingPerformancePanel } from "@/components/marketing/marketing-performance";
import {
  MARKETING_OVERVIEW_KPIS,
  computeMarketingOverviewMetrics,
  recentCampaigns,
} from "@/components/marketing/marketing-data";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { mapMemberToOwner } from "@/components/contacts/contact-api";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const KPI_ICONS = {
  pipeline: CalendarClock,
  draft: PenLine,
  users: Users,
  template: FileText,
  megaphone: Megaphone,
};

function Panel({ className, children }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_0_rgba(15,23,42,0.02)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none",
        className
      )}
    >
      {children}
    </section>
  );
}

export function MarketingOverviewSkeleton() {
  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-4"
      aria-busy="true"
    >
      <Skeleton className="h-20 w-full max-w-xl rounded-xl" />
      <KpiRowSkeleton />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[420px] rounded-2xl" />
        <SidebarColumnSkeleton />
      </div>
    </div>
  );
}

function SidebarColumnSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-52 rounded-2xl" />
    </div>
  );
}

function KpiRowSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[100px] rounded-2xl" />
      ))}
    </div>
  );
}

export function MarketingOverviewHome() {
  const { openCampaignWizard } = useCampaignWizard();
  const [state, setState] = useState(null);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadError("");
      try {
        const [data, members] = await Promise.all([
          fetchMarketingState(),
          apiFetch("/api/workspace/members").catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setState(data);
        if (members?.data?.length) {
          setOwners(members.data.map(mapMemberToOwner));
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e.message || "Could not load marketing";
          setLoadError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const campaigns = state?.campaigns || [];
  const segments = state?.segments || [];
  const templates = state?.templates || [];
  const metrics = state?.metrics || {};

  const overviewMetrics = useMemo(
    () =>
      computeMarketingOverviewMetrics({
        campaigns,
        segments,
        templates,
        metrics,
      }),
    [campaigns, segments, templates, metrics]
  );

  const showcase = useMemo(() => {
    const recent = recentCampaigns(campaigns);
    return (
      campaigns.find((c) => c.hasDeliveryData) ||
      campaigns.find((c) => c.status === "completed") ||
      recent[0]
    );
  }, [campaigns]);

  if (loading) return <MarketingOverviewSkeleton />;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-4 pb-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <PageBreadcrumb
            items={[
              { href: "/", label: "Workspace" },
              { label: "Marketing" },
            ]}
            className="mb-2"
          />
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-neutral-900 dark:text-neutral-50">
            Marketing
          </h1>
          <p className={cn("mt-1 max-w-[56ch]", crmType.pageDescription)}>
            Audiences, templates, and campaigns in one place.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg"
            render={<Link href="/marketing/templates" />}
          >
            <FileText className="size-3.5" />
            Templates
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg"
            render={<Link href="/marketing/audiences" />}
          >
            <Users className="size-3.5" />
            Audiences
          </Button>
          <Button
            type="button"
            className="h-9 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            onClick={() => openCampaignWizard()}
          >
            <Plus className="size-3.5" />
            New campaign
          </Button>
        </div>
      </header>

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[12px] text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {loadError}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MARKETING_OVERVIEW_KPIS.map((def) => {
          const Icon = KPI_ICONS[def.icon] || Megaphone;
          const value = overviewMetrics[def.id] ?? 0;
          return (
            <Panel key={def.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-muted-foreground">{def.label}</p>
                  <p className="mt-1 text-[28px] font-bold leading-none tracking-tight text-neutral-900 tabular-nums dark:text-neutral-50">
                    {Number(value).toLocaleString()}
                  </p>
                  <p className="mt-2 text-[11px] text-neutral-500">{def.hint}</p>
                </div>
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    def.iconClass
                  )}
                >
                  <Icon className="size-[18px]" aria-hidden />
                </span>
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <MarketingCampaignWorkspace campaigns={campaigns} owners={owners} />

        <aside className="flex flex-col gap-4">
          <MarketingPipelinePanel campaigns={campaigns} />
          <MarketingAudiencesSnapshot segments={segments} />
          <MarketingTemplatesSnapshot templates={templates} />
          {showcase ? (
            <MarketingPerformancePanel campaign={showcase} compact />
          ) : (
            <Panel className="p-4 sm:p-5">
              <p className={crmType.sectionLabel}>Performance</p>
              <p className="mt-2 text-[12px] text-muted-foreground">
                Complete a campaign and record send metrics to see engagement here.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 rounded-lg"
                render={<Link href="/marketing/campaigns" />}
              >
                View campaigns
              </Button>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}
