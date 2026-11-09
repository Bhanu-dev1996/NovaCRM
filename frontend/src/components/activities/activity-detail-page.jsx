"use client";

import {
  CalendarDays,
  CheckCircle2,
  SquarePen,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  ACTIVITY_PRIORITY_STYLES,
  activityStatusClass,
  ACTIVITY_TYPE_STYLES,
  activityTypeLabel,
  displayActivityStatus,
  formatActivityWhen,
  isOverdue,
  resolveRelatedLabel,
} from "@/components/activities/activities-data";
import { ownerById } from "@/components/contacts/contacts-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

function DetailField({ label, children }) {
  return (
    <div className="min-w-0">
      <p className={crmType.recordLabel}>{label}</p>
      <div className={cn("mt-1 text-neutral-800 dark:text-neutral-200", crmType.meta)}>
        {children}
      </div>
    </div>
  );
}

export function ActivityDetailPage({
  record,
  owners = [],
  lookups = {},
  onEdit,
  onMarkComplete,
  onCancel,
  onDelete,
}) {
  if (!record) return null;

  const owner = ownerById(record.assigneeId, owners);
  const statusLabel = displayActivityStatus(record);
  const statusStyle = activityStatusClass(record);
  const canComplete =
    record.recordKind === "task"
      ? record.status !== "done"
      : !["Completed", "Cancelled", "Logged"].includes(record.status);
  const canCancel =
    record.recordKind === "activity" &&
    !["Cancelled", "Completed", "Logged"].includes(record.status);

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-bold tracking-[-0.02em] text-neutral-900 dark:text-neutral-50">
                {record.subject || "Untitled activity"}
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "border-transparent capitalize",
                  ACTIVITY_TYPE_STYLES[record.type] || ACTIVITY_TYPE_STYLES.task
                )}
              >
                {activityTypeLabel(record.type)}
              </Badge>
              {isOverdue(record) ? (
                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                  Overdue
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {record.recordKind === "task" ? "Workspace task" : "Logged activity"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canComplete ? (
              <Button type="button" size="sm" onClick={onMarkComplete}>
                <CheckCircle2 className="size-3.5" />
                Mark complete
              </Button>
            ) : null}
            {canCancel ? (
              <Button type="button" size="sm" variant="outline" onClick={onCancel}>
                <XCircle className="size-3.5" />
                Cancel
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="outline" onClick={onEdit}>
              <SquarePen className="size-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Status">
            <Badge
              variant="outline"
              className={cn("w-fit border-transparent px-2", statusStyle)}
            >
              {statusLabel}
            </Badge>
          </DetailField>
          <DetailField label="Priority">
            <Badge
              variant="outline"
              className={cn(
                "border-transparent capitalize w-fit",
                ACTIVITY_PRIORITY_STYLES[record.priority] ||
                  ACTIVITY_PRIORITY_STYLES.medium
              )}
            >
              {record.priority || "medium"}
            </Badge>
          </DetailField>
          <DetailField label="Assigned to">{owner.name}</DetailField>
          <DetailField label="Due date">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-neutral-400" aria-hidden />
              {formatActivityWhen(record.dueAt)}
            </span>
          </DetailField>
          <DetailField label="Completed">
            {formatActivityWhen(record.completedAt)}
          </DetailField>
          <DetailField label="Related to">
            {resolveRelatedLabel(record, lookups)}
          </DetailField>
        </div>

        {record.body || record.raw?.body || record.raw?.description ? (
          <DetailField label={record.type === "note" ? "Content" : "Notes"}>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
              {record.body || record.raw?.body || record.raw?.description}
            </p>
          </DetailField>
        ) : null}

        {record.meta?.emailTo ? (
          <DetailField label="Email to">{record.meta.emailTo}</DetailField>
        ) : null}
        {record.meta?.direction ? (
          <DetailField label="Call direction">
            <span className="capitalize">{record.meta.direction}</span>
          </DetailField>
        ) : null}
        {record.meta?.outcome ? (
          <DetailField label="Outcome">
            <span className="capitalize">{String(record.meta.outcome).replace(/_/g, " ")}</span>
          </DetailField>
        ) : null}
      </CardContent>
    </Card>
  );
}
