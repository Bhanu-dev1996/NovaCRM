"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  Copy,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  SquarePen,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  deleteCampaignApi,
  duplicateCampaignApi,
  fetchMarketingState,
  updateCampaignApi,
} from "@/components/marketing/marketing-api";
import {
  CAMPAIGN_LIST_TABS,
  CAMPAIGN_STATUSES,
  CAMPAIGN_TYPES,
  campaignStatusLabel,
  campaignStatusStyles,
  campaignTypeLabel,
  filterCampaigns,
  formatSchedule,
} from "@/components/marketing/marketing-data";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { mapMemberToOwner } from "@/components/contacts/contact-api";
import { ownerById } from "@/components/contacts/contacts-data";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";
import { useCampaignWizard } from "@/components/marketing/marketing-campaign-wizard-provider";
import { MarketingOverviewSkeleton } from "@/components/marketing/marketing-overview-home";

export function MarketingCampaignsHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openCampaignWizard } = useCampaignWizard();
  const [state, setState] = useState(null);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(searchParams.get("tab") || "all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [deleteId, setDeleteId] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const data = await fetchMarketingState();
    setState(data);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [data, members] = await Promise.all([
          fetchMarketingState(),
          apiFetch("/api/workspace/members").catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setState(data);
        if (members?.data?.length) setOwners(members.data.map(mapMemberToOwner));
      } catch (e) {
        toast.error(e.message || "Could not load campaigns");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
  }, []);

  const rows = useMemo(
    () =>
      filterCampaigns(state?.campaigns, {
        tab,
        status: statusFilter,
        type: typeFilter,
        owner: ownerFilter,
        query,
      }),
    [state, tab, statusFilter, typeFilter, ownerFilter, query]
  );

  async function handleDuplicate(id) {
    try {
      const copy = await duplicateCampaignApi(id);
      toast.success("Campaign duplicated as draft");
      await refresh();
      router.push(`/marketing/campaigns/${copy.id}`);
    } catch (e) {
      toast.error(e.message || "Duplicate failed");
    }
  }

  async function handleArchive(id) {
    try {
      await updateCampaignApi(id, { status: "archived" });
      toast.success("Campaign archived");
      refresh();
    } catch (e) {
      toast.error(e.message || "Could not archive");
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setBusy(true);
    try {
      await deleteCampaignApi(deleteId);
      toast.success("Draft deleted");
      setDeleteId(null);
      refresh();
    } catch (e) {
      toast.error(e.message || "Only drafts can be deleted");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <MarketingOverviewSkeleton />;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <PageBreadcrumb
            items={[
              { href: "/", label: "Workspace" },
              { href: "/marketing", label: "Marketing" },
              { label: "Campaigns" },
            ]}
            className="mb-2"
          />
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-neutral-900 dark:text-neutral-50">
            Campaigns
          </h1>
          <p className={cn("mt-1 max-w-[56ch]", crmType.pageDescription)}>
            Track drafts, scheduled sends, and completed programs.
          </p>
        </div>
        <Button
          type="button"
          className="h-9 shrink-0 bg-primary-600 text-white hover:bg-primary-700"
          onClick={() => openCampaignWizard()}
        >
          <Plus className="size-3.5" />
          Create Campaign
        </Button>
      </header>

      <Card className="rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800">
        <CardContent className="p-0">
          <Tabs value={tab} onValueChange={setTab} className="gap-0">
            <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
              <TabsList className="h-9 bg-transparent p-0">
                {CAMPAIGN_LIST_TABS.map((t) => (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className={cn("rounded-lg px-3 text-[12px]", crmType.tabLine)}
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search campaigns…"
                  className="h-9 rounded-lg pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-[160px] rounded-lg">
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
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="h-9 w-[140px] rounded-lg">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {owners.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-[13px]">
                <thead className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-semibold text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900/40">
                  <tr>
                    <th className="px-4 py-2.5">Campaign</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Audience</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Scheduled</th>
                    <th className="px-4 py-2.5">Owner</th>
                    <th className="px-4 py-2.5">Created</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                        No campaigns match your filters.
                      </td>
                    </tr>
                  ) : (
                    rows.map((c) => {
                      const owner = ownerById(c.ownerId, owners);
                      return (
                        <tr
                          key={c.id}
                          className="border-b border-neutral-100 dark:border-neutral-800/80"
                        >
                          <td className="px-4 py-3 font-medium">
                            <Link
                              href={`/marketing/campaigns/${c.id}`}
                              className="hover:text-primary-600"
                            >
                              {c.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {campaignTypeLabel(c.campaignType)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {c.segmentName || "—"}
                            {c.estimatedRecipients
                              ? ` (${c.estimatedRecipients})`
                              : ""}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn("border-0", campaignStatusStyles(c.status))}>
                              {campaignStatusLabel(c.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatSchedule(c)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {owner?.name || "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {c.createdAt
                              ? format(new Date(c.createdAt), "MMM d, yyyy")
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button type="button" size="icon" variant="ghost" className="size-8" />
                                }
                              >
                                <MoreHorizontal className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  render={<Link href={`/marketing/campaigns/${c.id}`} />}
                                >
                                  <Eye className="size-3.5" />
                                  View
                                </DropdownMenuItem>
                                {c.status === "draft" ? (
                                  <DropdownMenuItem
                                    onClick={() => openCampaignWizard({ editId: c.id })}
                                  >
                                    <SquarePen className="size-3.5" />
                                    Edit draft
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem onClick={() => handleDuplicate(c.id)}>
                                  <Copy className="size-3.5" />
                                  Duplicate
                                </DropdownMenuItem>
                                {c.status !== "archived" ? (
                                  <DropdownMenuItem onClick={() => handleArchive(c.id)}>
                                    <Archive className="size-3.5" />
                                    Archive
                                  </DropdownMenuItem>
                                ) : null}
                                {c.status === "draft" ? (
                                  <DropdownMenuItem onClick={() => setDeleteId(c.id)}>
                                    <Trash2 className="size-3.5" />
                                    Delete draft
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem
                                  render={<Link href={`/marketing/campaigns/${c.id}?tab=performance`} />}
                                >
                                  View performance
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <DialogContent
          title="Delete draft campaign?"
          description="Scheduled and active campaigns must be archived instead."
          onClose={() => setDeleteId(null)}
          maxWidth={440}
        >
          <DialogBody>
            <p className="text-[13px] text-muted-foreground">
              This removes the draft permanently from your workspace.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={busy} onClick={confirmDelete}>
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
