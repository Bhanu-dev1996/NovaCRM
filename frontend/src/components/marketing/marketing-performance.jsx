"use client";

import { BarChart3, Info, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { recordCampaignPerformanceApi } from "@/components/marketing/marketing-api";
import { formatPercentRate } from "@/components/marketing/marketing-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const METRIC_LABELS = [
  { key: "recipients", label: "Recipients" },
  { key: "delivered", label: "Delivered" },
  { key: "bounced", label: "Bounced" },
  { key: "opens", label: "Opens" },
  { key: "clicks", label: "Clicks" },
  { key: "unsubscribes", label: "Unsubscribes" },
];

const RATE_ROWS = [
  { key: "deliveryRate", label: "Delivery rate" },
  { key: "openRate", label: "Open rate" },
  { key: "clickRate", label: "Click rate" },
  { key: "clickToOpenRate", label: "Click-to-open" },
];

export function MarketingPerformancePanel({
  campaign,
  compact = false,
  onRecorded,
}) {
  const perf = campaign?.performance || {};
  const rates = campaign?.performanceRates || {};
  const hasData = campaign?.hasDeliveryData;
  const canRecord =
    !hasData &&
    ["ready_for_review", "completed", "active"].includes(campaign?.status || "");

  async function recordMetrics() {
    if (!campaign?.id) return;
    try {
      const updated = await recordCampaignPerformanceApi(campaign.id);
      toast.success("Send metrics recorded");
      onRecorded?.(updated);
    } catch (e) {
      toast.error(e.message || "Could not record metrics");
    }
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800">
      <CardContent className={cn("p-0", compact ? "p-4" : "")}>
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary-600" aria-hidden />
            <div>
              <p className={crmType.bodySemibold}>Campaign performance</p>
              {hasData && perf.recordedAt ? (
                <p className="text-[11px] text-muted-foreground">
                  Recorded {new Date(perf.recordedAt).toLocaleString()}
                  {perf.source === "recorded" ? " · workspace snapshot" : ""}
                </p>
              ) : null}
            </div>
          </div>
          {canRecord ? (
            <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg" onClick={recordMetrics}>
              <RefreshCw className="size-3.5" />
              Record metrics
            </Button>
          ) : null}
        </div>

        {!hasData ? (
          <div className="space-y-3 p-4">
            <div className="flex gap-2 rounded-xl border border-dashed border-neutral-200/90 bg-neutral-50/80 px-3 py-2.5 text-[12px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-200">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <p>
                No send metrics yet. Mark the campaign completed or use{" "}
                <span className="font-semibold">Record metrics</span> to capture delivery and
                engagement numbers from your review (until an email provider is connected).
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {METRIC_LABELS.map((m) => (
                <MetricTile key={m.key} label={m.label} value="—" muted />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {METRIC_LABELS.map((m) => (
                <MetricTile
                  key={m.key}
                  label={m.label}
                  value={formatCount(perf[m.key])}
                />
              ))}
            </div>
            {!compact ? (
              <div className="grid gap-2 border-t border-neutral-100 pt-3 sm:grid-cols-2 dark:border-neutral-800">
                {RATE_ROWS.map((r) => (
                  <div
                    key={r.key}
                    className="flex items-center justify-between rounded-lg bg-neutral-50/80 px-3 py-2 dark:bg-neutral-900/40"
                  >
                    <span className="text-[12px] text-muted-foreground">{r.label}</span>
                    <span className="text-[13px] font-semibold tabular-nums">
                      {formatPercentRate(rates[r.key])}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatCount(n) {
  if (n == null || n === "") return "—";
  return Number(n).toLocaleString();
}

function MetricTile({ label, value, muted }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200/80 px-3 py-2 dark:border-neutral-800",
        muted && "bg-neutral-50/50 dark:bg-neutral-900/40"
      )}
    >
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-[15px] font-semibold tabular-nums",
          muted && "text-neutral-400"
        )}
      >
        {value}
      </p>
    </div>
  );
}
