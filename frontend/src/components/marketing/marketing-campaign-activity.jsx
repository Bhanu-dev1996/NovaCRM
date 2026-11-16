"use client";

import { formatDistanceToNow } from "date-fns";

import { campaignStatusLabel, formatSchedule } from "@/components/marketing/marketing-data";
import { Card, CardContent } from "@/components/ui/card";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

export function buildCampaignActivityTimeline(campaign) {
  if (!campaign) return [];
  const items = [];
  const perf = campaign.performance || {};

  if (campaign.createdAt) {
    items.push({
      at: campaign.createdAt,
      label: "Campaign created",
      detail: campaign.name,
      type: "created",
    });
  }
  if (campaign.scheduledAt || campaign.schedule?.sendDate) {
    items.push({
      at: campaign.scheduledAt || campaign.schedule?.sendDate,
      label: "Scheduled send",
      detail: formatSchedule(campaign),
      type: "scheduled",
    });
  }
  if (campaign.status && campaign.status !== "draft") {
    items.push({
      at: campaign.updatedAt || campaign.createdAt,
      label: campaignStatusLabel(campaign.status),
      detail: "Current workspace status",
      type: "status",
    });
  }

  for (const ev of perf.events || []) {
    if (!ev?.at) continue;
    items.push({
      at: ev.at,
      label: ev.label || ev.type,
      detail: ev.detail || "",
      type: ev.type || "event",
    });
  }

  if (perf.recordedAt && !(perf.events || []).some((e) => e.type === "metrics_recorded")) {
    items.push({
      at: perf.recordedAt,
      label: "Send metrics recorded",
      detail: perf.source === "recorded" ? "Metrics saved for this campaign." : "",
      type: "metrics_recorded",
    });
  }

  const seen = new Set();
  return items
    .filter((item) => {
      const key = `${item.at}-${item.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}

function formatWhen(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}

export function MarketingCampaignActivity({ campaign }) {
  const timeline = buildCampaignActivityTimeline(campaign);

  return (
    <Card className="rounded-2xl border-neutral-200/80 py-0 dark:border-neutral-800">
      <CardContent className="p-5">
        {timeline.length ? (
          <ul className="space-y-0">
            {timeline.map((item, index) => (
              <li
                key={`${item.at}-${item.label}-${index}`}
                className="relative flex gap-3 pb-5 last:pb-0"
              >
                {index < timeline.length - 1 ? (
                  <span
                    className="absolute left-[7px] top-4 h-[calc(100%-8px)] w-px bg-neutral-200 dark:bg-neutral-700"
                    aria-hidden
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-[1] mt-1.5 size-3.5 shrink-0 rounded-full border-2 border-white bg-primary-500 shadow-sm dark:border-neutral-900",
                    item.type === "metrics_recorded" && "bg-emerald-500",
                    item.type === "status_change" && "bg-amber-500"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className={crmType.bodySemibold}>{item.label}</p>
                  {item.detail ? (
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{item.detail}</p>
                  ) : null}
                  {item.at ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatWhen(item.at)}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted-foreground">
            Status changes and recorded send metrics appear here as you move the campaign through
            your workflow.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
