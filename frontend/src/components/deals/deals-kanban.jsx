"use client";

import { useState } from "react";
import { Building2, Calendar, GripVertical } from "lucide-react";

import { ownerById } from "@/components/contacts/contacts-data";
import {
  DEAL_PRIORITY_STYLES,
  dealNameInitials,
  dealsForStageColumn,
  dealStageAccentColor,
  formatDealAmount,
} from "@/components/deals/deals-data";
import { LEAD_SOURCE_STYLES } from "@/components/leads/leads-data";
import { Badge } from "@/components/ui/badge";
import { formatLeadCalendarDate } from "@/lib/lead-dates";
import { cn } from "@/lib/utils";

function dealWinProbability(deal, stage) {
  if (deal.probability !== "" && deal.probability != null) {
    const n = Number(deal.probability);
    if (Number.isFinite(n)) return Math.min(100, Math.max(0, n));
  }
  const s = Number(stage?.probability ?? 0);
  return Number.isFinite(s) ? Math.min(100, Math.max(0, s)) : 0;
}

function scoreRingColor(score) {
  if (score >= 80) {
    return {
      stroke: "#10b981",
      text: "text-emerald-700 dark:text-emerald-300",
    };
  }
  if (score >= 60) {
    return {
      stroke: "#f59e0b",
      text: "text-amber-700 dark:text-amber-300",
    };
  }
  return {
    stroke: "#94a3b8",
    text: "text-neutral-600 dark:text-neutral-300",
  };
}

function ScoreRing({ score, size = 36, strokeWidth = 3 }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const tone = scoreRingColor(value);

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      title={`${value}% probability`}
      aria-label={`Win probability ${value} percent`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-200 dark:text-neutral-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className={cn(
          "absolute text-xs font-semibold tabular-nums",
          tone.text
        )}
      >
        {value}
      </span>
    </span>
  );
}

function DealKanbanCard({
  deal,
  stage,
  companyName,
  owner,
  isDragging,
  onDragStart,
  onDragEnd,
  onOpen,
}) {
  const accent = dealStageAccentColor(stage);
  const probability = dealWinProbability(deal, stage);
  const amountLine = formatDealAmount(deal.amount, deal.currency);
  const source = deal.leadSource?.trim();
  const priority = deal.priority?.trim();
  const closeLabel = deal.expectedCloseDate
    ? formatLeadCalendarDate(deal.expectedCloseDate)
    : "No close date";

  const badgeSource = source;
  const badgePriority = !badgeSource && priority ? priority : null;

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "group relative cursor-grab rounded-xl bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-neutral-200/80 transition-all",
        "hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-8px_rgba(15,23,42,0.18)] hover:ring-neutral-300",
        "active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
        "dark:bg-neutral-900 dark:ring-neutral-800 dark:hover:ring-neutral-700",
        isDragging &&
          "scale-[0.98] opacity-50 shadow-none ring-primary-300 dark:ring-primary-700"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-3 left-0 w-[3px] rounded-full",
          accent
        )}
      />

      <div className="flex items-start gap-2.5 pl-1.5">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[11px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
          {dealNameInitials(deal.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-neutral-900 dark:text-neutral-50">
                {deal.name}
              </p>
              <p className="mt-0.5 truncate text-[11px] font-medium tabular-nums text-neutral-500">
                {amountLine}
              </p>
            </div>
            <ScoreRing score={probability} size={32} strokeWidth={3} />
          </div>
          {companyName ? (
            <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[12px] text-neutral-600 dark:text-neutral-300">
              <Building2 className="size-3 shrink-0 text-neutral-400" />
              <span className="truncate">{companyName}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 pl-1.5">
        {badgeSource ? (
          <Badge
            variant="outline"
            className={cn(
              "h-5 max-w-[70%] overflow-hidden border-transparent text-[10px]",
              LEAD_SOURCE_STYLES[badgeSource] || LEAD_SOURCE_STYLES.Manual
            )}
          >
            <span className="truncate">{badgeSource}</span>
          </Badge>
        ) : badgePriority ? (
          <Badge
            variant="outline"
            className={cn(
              "h-5 max-w-[70%] overflow-hidden border-transparent text-[10px]",
              DEAL_PRIORITY_STYLES[badgePriority] || DEAL_PRIORITY_STYLES.Medium
            )}
          >
            <span className="truncate">{badgePriority}</span>
          </Badge>
        ) : (
          <span />
        )}
        <GripVertical className="size-3.5 text-neutral-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-neutral-600" />
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2.5 pl-1.5 dark:border-neutral-800">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold">
            {owner.initials}
          </span>
          <span className="truncate text-[11px] text-neutral-500">
            {owner.name}
          </span>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 text-[11px]",
            deal.expectedCloseDate
              ? "text-neutral-400"
              : "text-amber-600 dark:text-amber-400"
          )}
        >
          <Calendar className="size-3" />
          {closeLabel}
        </span>
      </div>
    </article>
  );
}

function KanbanColumn({
  stage,
  deals,
  totalValue,
  currency,
  companyMap,
  owners,
  draggingId,
  isDropTarget,
  onOpenDeal,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  variant = "active",
}) {
  const accent = dealStageAccentColor(stage);
  const valueLabel = formatDealAmount(totalValue, currency || "INR");

  return (
    <section
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex w-[300px] shrink-0 flex-col rounded-xl bg-neutral-50/90 ring-1 ring-neutral-200/80 transition-colors dark:bg-neutral-950/50 dark:ring-neutral-800",
        variant === "lost" &&
          "border border-dashed border-neutral-300 dark:border-neutral-700",
        isDropTarget &&
          "bg-primary-50/70 ring-primary-200 dark:bg-primary-950/30 dark:ring-primary-800"
      )}
    >
      <header className="border-b border-neutral-200/70 px-3 pt-3 pb-2.5 dark:border-neutral-800">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn("size-2 shrink-0 rounded-full", accent)} />
            <h3 className="truncate text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
              {stage.name}
            </h3>
          </div>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white px-1.5 text-[11px] font-semibold text-neutral-500 ring-1 ring-neutral-200/80 dark:bg-neutral-900 dark:ring-neutral-700">
            {deals.length}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
          <span className="text-neutral-500">{stage.probability ?? 0}% win odds</span>
          <span className="font-semibold tabular-nums text-primary-700 dark:text-primary-300">
            {valueLabel}
          </span>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 max-h-[min(70vh,620px)]">
        {deals.map((deal) => (
          <DealKanbanCard
            key={deal.id}
            deal={deal}
            stage={stage}
            companyName={companyMap[deal.companyId]}
            owner={ownerById(deal.ownerId, owners)}
            isDragging={draggingId === deal.id}
            onDragStart={(e) => onDragStart(e, deal.id)}
            onDragEnd={onDragEnd}
            onOpen={() => onOpenDeal?.(deal.id)}
          />
        ))}
        {deals.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 items-center justify-center rounded-xl border border-dashed px-3 py-8 text-center text-[12px] text-muted-foreground",
              isDropTarget
                ? "border-primary-300 bg-primary-50/50 text-primary-600 dark:border-primary-700 dark:bg-primary-950/20 dark:text-primary-300"
                : "border-neutral-200 dark:border-neutral-800"
            )}
          >
            Drop deals here
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function DealsKanban({
  stages,
  deals,
  companies,
  contacts,
  owners,
  allStages = [],
  onOpenDeal,
  onMoveDeal,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStageId, setDragOverStageId] = useState(null);

  const companyMap = Object.fromEntries(
    (companies || []).map((c) => [c.id, c.name])
  );

  function handleDragStart(event, dealId) {
    setDraggingId(dealId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dealId);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverStageId(null);
  }

  function handleDragOver(event, stageId) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverStageId(stageId);
  }

  function handleDragLeave(event, stageId) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDragOverStageId((prev) => (prev === stageId ? null : prev));
    }
  }

  function handleDrop(event, stageId) {
    event.preventDefault();
    const dealId = event.dataTransfer.getData("text/plain") || draggingId;
    handleDragEnd();
    if (!dealId || !stageId) return;
    onMoveDeal?.(dealId, stageId);
  }

  function stageTotal(list) {
    return list.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  }

  const primaryCurrency = deals[0]?.currency || "INR";
  const pipelineColumns = [
    ...(stages.active || []),
    ...(stages.won || []),
    ...(stages.lost || []),
  ];
  const stageCatalog =
    allStages.length > 0
      ? allStages
      : [
          ...(stages.active || []),
          ...(stages.won || []),
          ...(stages.lost || []),
        ];
  const openValue = deals
    .filter((d) => {
      const stage = stageCatalog.find((s) => String(s.id) === String(d.stageId));
      return stage && !stage.is_won && !stage.is_lost;
    })
    .reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const columnProps = (stage, variant) => {
    const columnDeals = dealsForStageColumn(stage, stageCatalog, deals);
    return {
      stage,
      deals: columnDeals,
      totalValue: stageTotal(columnDeals),
      currency: primaryCurrency,
      companyMap,
      owners,
      draggingId,
      isDropTarget: dragOverStageId === stage.id,
      onOpenDeal,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onDragOver: (e) => handleDragOver(e, stage.id),
      onDragLeave: (e) => handleDragLeave(e, stage.id),
      onDrop: (e) => handleDrop(e, stage.id),
      variant,
    };
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
        <p className="text-[12px] text-neutral-500">
          Drag cards between stages to update the pipeline.
        </p>
        <p className="text-[12px] font-medium text-neutral-700 dark:text-neutral-200">
          Open pipeline:{" "}
          <span className="font-semibold text-primary-700 dark:text-primary-300">
            {formatDealAmount(openValue, primaryCurrency)}
          </span>
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-h-[28rem] min-w-max items-stretch gap-3">
          {pipelineColumns.map((stage) => (
            <KanbanColumn
              key={stage.id}
              {...columnProps(
                stage,
                stage.is_lost ? "lost" : stage.is_won ? "won" : "active"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
