"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, Copy, SquarePen, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteCampaignApi,
  duplicateCampaignApi,
  fetchCampaign,
  updateCampaignApi,
} from "@/components/marketing/marketing-api";
import {
  campaignStatusLabel,
  campaignStatusStyles,
  campaignTypeLabel,
  formatSchedule,
} from "@/components/marketing/marketing-data";
import { useCampaignWizard } from "@/components/marketing/marketing-campaign-wizard-provider";
import { MarketingCampaignActivity } from "@/components/marketing/marketing-campaign-activity";
import { MarketingPerformancePanel } from "@/components/marketing/marketing-performance";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { mapMemberToOwner } from "@/components/contacts/contact-api";
import { ownerById } from "@/components/contacts/contacts-data";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";
import { MarketingOverviewSkeleton } from "@/components/marketing/marketing-overview-home";

export function MarketingCampaignDetail({ campaignId }) {
  const { openCampaignWizard } = useCampaignWizard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";
  const [campaign, setCampaign] = useState(null);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(defaultTab);

  const load = useCallback(async () => {
    const [c, members] = await Promise.all([
      fetchCampaign(campaignId),
      apiFetch("/api/workspace/members").catch(() => ({ data: [] })),
    ]);
    setCampaign(c);
    if (members?.data?.length) setOwners(members.data.map(mapMemberToOwner));
  }, [campaignId]);

  useEffect(() => {
    let cancelled = false;
    load()
      .catch((e) => toast.error(e.message))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function markCompleted() {
    try {
      await updateCampaignApi(campaignId, { status: "completed" });
      toast.success("Campaign marked completed");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <MarketingOverviewSkeleton />;
  if (!campaign) return null;

  const owner = ownerById(campaign.ownerId, owners);
  const content = campaign.content || {};

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1000px] flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <PageBreadcrumb
            items={[
              { href: "/", label: "Workspace" },
              { href: "/marketing", label: "Marketing" },
              { href: "/marketing/campaigns", label: "Campaigns" },
              { label: campaign.name },
            ]}
            className="mb-2"
          />
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] font-bold tracking-[-0.03em] text-neutral-900 dark:text-neutral-50">
              {campaign.name}
            </h1>
            <Badge className={cn("border-0", campaignStatusStyles(campaign.status))}>
              {campaignStatusLabel(campaign.status)}
            </Badge>
          </div>
          <p className={cn("mt-1", crmType.meta)}>{campaign.objective}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {campaign.status === "draft" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openCampaignWizard({ editId: campaignId })}
            >
              <SquarePen className="size-3.5" />
              Edit
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={async () => {
            const copy = await duplicateCampaignApi(campaignId);
            router.push(`/marketing/campaigns/${copy.id}`);
          }}>
            <Copy className="size-3.5" />
            Duplicate
          </Button>
          {campaign.status !== "archived" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await updateCampaignApi(campaignId, { status: "archived" });
                toast.success("Archived");
                load();
              }}
            >
              <Archive className="size-3.5" />
              Archive
            </Button>
          ) : null}
          {campaign.status === "draft" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await deleteCampaignApi(campaignId);
                  toast.success("Deleted");
                  router.push("/marketing/campaigns");
                } catch (e) {
                  toast.error(e.message);
                }
              }}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          ) : null}
          {campaign.status === "ready_for_review" ? (
            <Button size="sm" className="bg-primary-600 text-white" onClick={markCompleted}>
              Mark completed
            </Button>
          ) : null}
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-9">
          {["overview", "audience", "content", "performance", "activity"].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize text-[12px]">
              {t === "activity" ? "Activity history" : t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="rounded-2xl border-neutral-200/80 py-0 dark:border-neutral-800">
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              <Meta label="Type" value={campaignTypeLabel(campaign.campaignType)} />
              <Meta label="Owner" value={owner?.name || "Unassigned"} />
              <Meta label="Audience" value={campaign.segmentName || "—"} />
              <Meta
                label="Est. recipients"
                value={String(campaign.estimatedRecipients || 0)}
              />
              <Meta label="Schedule" value={formatSchedule(campaign)} />
              <Meta label="Description" value={campaign.description || "—"} />
            </CardContent>
          </Card>
          <LinkedCrm campaign={campaign} />
        </TabsContent>

        <TabsContent value="audience">
          <Card className="rounded-2xl border-neutral-200/80 py-0 dark:border-neutral-800">
            <CardContent className="space-y-2 p-5 text-[13px]">
              <p>
                Segment:{" "}
                {campaign.segmentId ? (
                  <Link
                    href="/marketing/audiences"
                    className="font-medium text-primary-600"
                  >
                    {campaign.segmentName}
                  </Link>
                ) : (
                  "—"
                )}
              </p>
              <p className="text-muted-foreground">
                Manual selections and filters are stored on the campaign. Suppressed contacts
                will be excluded when delivery is enabled.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card className="rounded-2xl border-neutral-200/80 py-0 dark:border-neutral-800">
            <CardContent className="space-y-3 p-5">
              <p className="text-[12px] text-muted-foreground">
                From: {content.senderName} &lt;{content.senderEmail}&gt;
              </p>
              <p className="font-semibold">{content.subject}</p>
              {content.previewText ? (
                <p className="text-[12px] text-muted-foreground">{content.previewText}</p>
              ) : null}
              <pre className="whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 text-[13px] dark:bg-neutral-900">
                {content.body || "No body yet."}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <MarketingPerformancePanel
            campaign={campaign}
            onRecorded={(updated) => setCampaign(updated)}
          />
        </TabsContent>

        <TabsContent value="activity">
          <MarketingCampaignActivity campaign={campaign} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 text-[13px]">{value}</p>
    </div>
  );
}

function LinkedCrm({ campaign }) {
  const linked = campaign.linkedRecords || {};
  const ids = linked.contactIds || [];
  if (!ids.length && !linked.dealIds?.length) {
    return (
      <p className="text-[12px] text-muted-foreground">
        Link deals or contacts when creating follow-up tasks from this campaign (Phase 1+).
      </p>
    );
  }
  return null;
}
