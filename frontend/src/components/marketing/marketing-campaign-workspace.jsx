"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Eye, Megaphone, Plus, Search } from "lucide-react";

import {
  CAMPAIGN_TYPES,
  campaignStatusLabel,
  campaignStatusStyles,
  campaignTypeLabel,
  draftCampaigns,
  formatSchedule,
  MKT_SEGMENTED_TAB_TRIGGER_WIDE,
  MKT_SEGMENTED_TABS_LIST,
  MKT_SEGMENTED_TABS_LIST_MIN_MD,
  recentCampaigns,
  upcomingCampaigns,
} from "@/components/marketing/marketing-data";
import { useCampaignWizard } from "@/components/marketing/marketing-campaign-wizard-provider";
import { CrmEmptyState } from "@/components/crm/crm-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ownerById } from "@/components/contacts/contacts-data";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const TAB_META = [
  { id: "recent", label: "Recent" },
  { id: "scheduled", label: "Scheduled" },
  { id: "drafts", label: "Drafts" },
];

const ROW_LIMIT = 8;

function baseListForTab(campaigns, tab) {
  if (tab === "scheduled") return upcomingCampaigns(campaigns);
  if (tab === "drafts") return draftCampaigns(campaigns);
  return recentCampaigns(campaigns);
}

function filterRows(rows, { query, typeFilter }) {
  let list = [...rows];
  if (typeFilter !== "all") {
    list = list.filter((c) => c.campaignType === typeFilter);
  }
  const q = query.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.objective?.toLowerCase().includes(q) ||
        c.segmentName?.toLowerCase().includes(q)
    );
  }
  return list;
}

export function MarketingCampaignWorkspace({ campaigns = [], owners = [] }) {
  const { openCampaignWizard } = useCampaignWizard();
  const [tab, setTab] = useState("recent");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const counts = useMemo(
    () => ({
      recent: recentCampaigns(campaigns).length,
      scheduled: upcomingCampaigns(campaigns).length,
      drafts: draftCampaigns(campaigns).length,
    }),
    [campaigns]
  );

  const { rows, total } = useMemo(() => {
    const base = baseListForTab(campaigns, tab);
    const filtered = filterRows(base, { query, typeFilter });
    return {
      rows: filtered.slice(0, ROW_LIMIT),
      total: filtered.length,
    };
  }, [campaigns, tab, query, typeFilter]);

  const listHref =
    tab === "drafts"
      ? "/marketing/campaigns?tab=draft"
      : tab === "scheduled"
        ? "/marketing/campaigns?tab=scheduled"
        : "/marketing/campaigns";

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_0_rgba(15,23,42,0.02)] dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 sm:px-5">
        <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
          Campaign workspace
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 rounded-lg"
          render={<Link href={listHref} />}
        >
          View all
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <TabsList
            className={cn(
              "h-9 min-h-9 w-full max-w-full lg:w-fit",
              MKT_SEGMENTED_TABS_LIST,
              MKT_SEGMENTED_TABS_LIST_MIN_MD
            )}
          >
            {TAB_META.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className={MKT_SEGMENTED_TAB_TRIGGER_WIDE}
              >
                {t.label}
                <span className="ml-1.5 tabular-nums text-[10px] text-muted-foreground">
                  {counts[t.id]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:min-w-[320px]">
            <div className="relative min-w-[160px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="h-8 rounded-lg pl-8 text-[13px]"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-full rounded-lg sm:w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {CAMPAIGN_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <CampaignTable
          rows={rows}
          total={total}
          owners={owners}
          tab={tab}
          listHref={listHref}
          onCreateCampaign={() => openCampaignWizard()}
        />
      </Tabs>
    </section>
  );
}

function CampaignTable({ rows, total, owners, tab, listHref, onCreateCampaign }) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-10 sm:px-5">
        <CrmEmptyState
          icon={Megaphone}
          title={
            tab === "scheduled"
              ? "Nothing scheduled"
              : tab === "drafts"
                ? "No drafts"
                : "No campaigns found"
          }
          description={
            tab === "recent"
              ? "Try another search or create a new campaign."
              : "Create a campaign or switch tabs to see more."
          }
          action={
            <Button
              type="button"
              size="sm"
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={onCreateCampaign}
            >
              Create Campaign
            </Button>
          }
        />
      </div>
    );
  }

  return (
  <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead className="border-b border-neutral-100 bg-neutral-50/60 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900/40">
            <tr>
              <th className="px-4 py-2.5 sm:px-5">Campaign</th>
              <th className="hidden px-4 py-2.5 md:table-cell">Type</th>
              <th className="hidden px-4 py-2.5 lg:table-cell">Audience</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="hidden px-4 py-2.5 sm:table-cell">Schedule</th>
              <th className="px-4 py-2.5 text-right sm:px-5"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const owner = ownerById(c.ownerId, owners);
              return (
                <tr
                  key={c.id}
                  className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50/80 dark:border-neutral-800/80 dark:hover:bg-neutral-900/50"
                >
                  <td className="px-4 py-3 sm:px-5">
                    <Link
                      href={`/marketing/campaigns/${c.id}`}
                      className="font-semibold text-neutral-900 hover:text-primary-600 dark:text-neutral-50"
                    >
                      {c.name}
                    </Link>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                      {owner?.name || "Unassigned"}
                      {c.estimatedRecipients
                        ? ` · ~${c.estimatedRecipients} recipients`
                        : ""}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {campaignTypeLabel(c.campaignType)}
                  </td>
                  <td className="hidden max-w-[140px] truncate px-4 py-3 text-muted-foreground lg:table-cell">
                    {c.segmentName || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn("border-0", campaignStatusStyles(c.status))}>
                      {campaignStatusLabel(c.status)}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-[12px] text-muted-foreground sm:table-cell">
                    {c.scheduledAt
                      ? format(new Date(c.scheduledAt), "MMM d, yyyy")
                      : formatSchedule(c) !== "Not scheduled"
                        ? formatSchedule(c)
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-right sm:px-5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 rounded-lg text-[11px]"
                      render={<Link href={`/marketing/campaigns/${c.id}`} />}
                    >
                      <Eye className="size-3.5" />
                      Open
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {total > ROW_LIMIT ? (
        <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5 text-[12px] dark:border-neutral-800 sm:px-5">
          <span className="text-muted-foreground">
            Showing {ROW_LIMIT} of {total} campaigns
          </span>
          <Link
            href={listHref}
            className={cn("font-semibold text-primary-600 hover:underline", crmType.linkMeta)}
          >
            View all
          </Link>
        </div>
      ) : null}
  </>
  );
}
