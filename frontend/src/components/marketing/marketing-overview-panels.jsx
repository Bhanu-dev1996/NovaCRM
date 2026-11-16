"use client";

import Link from "next/link";
import { format } from "date-fns";
import { FileText, Users } from "lucide-react";

import {
  campaignStatusLabel,
  campaignStatusStyles,
  formatSchedule,
  upcomingCampaigns,
} from "@/components/marketing/marketing-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

export function MarketingPipelinePanel({ campaigns = [] }) {
  const items = upcomingCampaigns(campaigns).slice(0, 4);

  return (
    <OverviewPanel
      title="Needs attention"
      action={
        <Link
          href="/marketing/campaigns?tab=ready_for_review"
          className="text-[11px] font-medium text-primary-600 hover:underline"
        >
          View pipeline
        </Link>
      }
    >
      {items.length ? (
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/marketing/campaigns/${c.id}`}
                className="flex items-start justify-between gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-neutral-200/80 hover:bg-neutral-50/80 dark:hover:border-neutral-800 dark:hover:bg-neutral-900/50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-foreground">
                    {c.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {formatSchedule(c)}
                  </span>
                </span>
                <Badge
                  className={cn("shrink-0 border-0 text-[10px]", campaignStatusStyles(c.status))}
                >
                  {campaignStatusLabel(c.status)}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-muted-foreground">
          No scheduled or review-stage campaigns. Create a draft when you are ready.
        </p>
      )}
    </OverviewPanel>
  );
}

export function MarketingAudiencesSnapshot({ segments = [] }) {
  const top = [...segments]
    .sort((a, b) => (b.contactCount || 0) - (a.contactCount || 0))
    .slice(0, 4);
  const total = segments.reduce((n, s) => n + (s.contactCount || 0), 0);

  return (
    <OverviewPanel
      title="Audiences"
      icon={Users}
      action={
        <Link href="/marketing/audiences" className="text-[11px] font-medium text-primary-600 hover:underline">
          Manage
        </Link>
      }
    >
      <p className="text-[28px] font-bold leading-none tabular-nums text-neutral-900 dark:text-neutral-50">
        {total.toLocaleString()}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        estimated contacts · {segments.length} segment{segments.length === 1 ? "" : "s"}
      </p>
      {top.length ? (
        <ul className="mt-3 space-y-1.5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          {top.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 text-[12px]"
            >
              <span className="truncate font-medium">{s.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {(s.contactCount || 0).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 h-8 w-full rounded-lg"
          render={<Link href="/marketing/audiences?action=create" />}
        >
          Create first segment
        </Button>
      )}
    </OverviewPanel>
  );
}

export function MarketingTemplatesSnapshot({ templates = [] }) {
  const recent = [...templates]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3);

  return (
    <OverviewPanel
      title="Templates"
      icon={FileText}
      action={
        <Link href="/marketing/templates" className="text-[11px] font-medium text-primary-600 hover:underline">
          Library
        </Link>
      }
    >
      {recent.length ? (
        <ul className="space-y-2">
          {recent.map((t) => (
            <li key={t.id}>
              <Link
                href="/marketing/templates"
                className="block rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
              >
                <span className="block truncate text-[12px] font-semibold">{t.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {t.category}
                  {t.updatedAt ? (
                    <> · {format(new Date(t.updatedAt), "MMM d")}</>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-muted-foreground">
          Save email copy once, then attach it when you build campaigns.
        </p>
      )}
    </OverviewPanel>
  );
}

function OverviewPanel({ title, icon: Icon, action, children }) {
  return (
    <section className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.02)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon ? (
            <span className="flex size-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              <Icon className="size-4" aria-hidden />
            </span>
          ) : null}
          <p className={crmType.sectionLabel}>{title}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

