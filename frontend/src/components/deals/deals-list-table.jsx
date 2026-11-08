"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, SquarePen } from "lucide-react";

import {
  DEAL_STAGE_STYLES,
  DEFAULT_PIPELINE_NAME,
  dealNameInitials,
  dealProbabilityLabel,
  formatDealAmount,
} from "@/components/deals/deals-data";
import { fullName, ownerById } from "@/components/contacts/contacts-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLeadCalendarDate } from "@/lib/lead-dates";
import { cn } from "@/lib/utils";

function formatDate(value) {
  return formatLeadCalendarDate(value);
}

function TruncateText({ value, className }) {
  const text = value || "—";
  const ref = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  function showTooltip() {
    const node = ref.current;
    if (!node || !text || text === "—") return;
    const rect = node.getBoundingClientRect();
    setTooltip({
      text,
      top: Math.max(8, rect.top - 8),
      left: Math.min(
        window.innerWidth - 16,
        Math.max(16, rect.left + rect.width / 2)
      ),
    });
  }

  return (
    <>
      <span
        ref={ref}
        className={cn("block w-full min-w-0 truncate", className)}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setTooltip(null)}
      >
        {text}
      </span>
      {tooltip
        ? createPortal(
            <div
              role="tooltip"
              style={{
                position: "fixed",
                top: tooltip.top,
                left: tooltip.left,
                transform: "translate(-50%, -100%)",
                zIndex: 9999,
                width: "max-content",
                maxWidth: "min(20rem, calc(100vw - 24px))",
                padding: "6px 10px",
                borderRadius: "6px",
                backgroundColor: "#0f172a",
                color: "#fff",
                fontSize: "12px",
                lineHeight: "1.35",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.18)",
              }}
            >
              {tooltip.text}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export function DealsListTable({
  pageRows,
  filteredCount,
  visibleColumns,
  selected,
  toggleSelect,
  toggleSelectAll,
  toggleSort,
  companyMap,
  contacts,
  stageMap,
  owners,
  page,
  pageSize,
  totalPages,
  setPage,
  setPageSize,
  pageSizes,
  onView,
  onEdit,
}) {
  return (
    <>
      <Table className="min-w-full w-full table-fixed text-xs">
        <TableHeader>
          <TableRow className="bg-muted/50 text-xs hover:bg-muted/50">
            <TableHead className="w-10 px-3">
              <Checkbox
                checked={
                  pageRows.length > 0 &&
                  pageRows.every((row) => selected.includes(row.id))
                }
                onCheckedChange={toggleSelectAll}
                aria-label="Select all on page"
              />
            </TableHead>
            {visibleColumns.includes("name") ? (
              <TableHead className="w-[240px] px-3">
                <button type="button" onClick={() => toggleSort("name")}>
                  Deal Name
                </button>
              </TableHead>
            ) : null}
            {visibleColumns.includes("company") ? (
              <TableHead className="px-3">Company</TableHead>
            ) : null}
            {visibleColumns.includes("contact") ? (
              <TableHead className="px-3">Contact</TableHead>
            ) : null}
            {visibleColumns.includes("amount") ? (
              <TableHead className="px-3">
                <button type="button" onClick={() => toggleSort("amount")}>
                  Deal Value
                </button>
              </TableHead>
            ) : null}
            {visibleColumns.includes("pipeline") ? (
              <TableHead className="px-3">Pipeline</TableHead>
            ) : null}
            {visibleColumns.includes("stage") ? (
              <TableHead className="px-3">Stage</TableHead>
            ) : null}
            {visibleColumns.includes("probability") ? (
              <TableHead className="px-3">Probability</TableHead>
            ) : null}
            {visibleColumns.includes("closeDate") ? (
              <TableHead className="px-3">
                <button type="button" onClick={() => toggleSort("closeDate")}>
                  Expected Close
                </button>
              </TableHead>
            ) : null}
            {visibleColumns.includes("owner") ? (
              <TableHead className="px-3">Owner</TableHead>
            ) : null}
            {visibleColumns.includes("createdAt") ? (
              <TableHead className="px-3">
                <button type="button" onClick={() => toggleSort("createdAt")}>
                  Created Date
                </button>
              </TableHead>
            ) : null}
            <TableHead className="w-[88px] min-w-[88px] px-3 text-center">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumns.length + 2}
                className="px-3 py-10 text-center text-xs text-muted-foreground"
              >
                No deals match your filters.
              </TableCell>
            </TableRow>
          ) : (
            pageRows.map((deal) => {
              const stage = stageMap[deal.stageId];
              const contact = contacts.find((c) => c.id === deal.contactId);
              const owner = ownerById(deal.ownerId, owners);
              const companyName = companyMap[deal.companyId] || "";
              const stageName = stage?.name || "—";
              const stageStyle =
                DEAL_STAGE_STYLES[stageName] ||
                "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200";

              return (
                <TableRow
                  key={deal.id}
                  data-state={selected.includes(deal.id) ? "selected" : undefined}
                >
                  <TableCell className="px-3 py-2.5">
                    <Checkbox
                      checked={selected.includes(deal.id)}
                      onCheckedChange={() => toggleSelect(deal.id)}
                      aria-label={`Select ${deal.name}`}
                    />
                  </TableCell>
                  {visibleColumns.includes("name") ? (
                    <TableCell className="overflow-hidden px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => onView(deal)}
                        className="flex w-full min-w-0 items-center gap-2.5 text-left"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                          {dealNameInitials(deal.name)}
                        </span>
                        <span className="min-w-0 flex-1 overflow-hidden">
                          <TruncateText
                            value={deal.name}
                            className="text-xs font-semibold"
                          />
                        </span>
                      </button>
                    </TableCell>
                  ) : null}
                  {visibleColumns.includes("company") ? (
                    <TableCell className="overflow-hidden px-3 py-2.5">
                      <TruncateText
                        value={companyName}
                        className="text-xs font-medium"
                      />
                    </TableCell>
                  ) : null}
                  {visibleColumns.includes("contact") ? (
                    <TableCell className="overflow-hidden px-3 py-2.5">
                      <TruncateText
                        value={contact ? fullName(contact) : "—"}
                        className="text-xs text-muted-foreground"
                      />
                    </TableCell>
                  ) : null}
                  {visibleColumns.includes("amount") ? (
                    <TableCell className="px-3 py-2.5 text-xs font-semibold tabular-nums">
                      {formatDealAmount(deal.amount, deal.currency)}
                    </TableCell>
                  ) : null}
                  {visibleColumns.includes("pipeline") ? (
                    <TableCell className="overflow-hidden px-3 py-2.5">
                      <TruncateText
                        value={deal.pipelineName || DEFAULT_PIPELINE_NAME}
                        className="text-xs text-muted-foreground"
                      />
                    </TableCell>
                  ) : null}
                  {visibleColumns.includes("stage") ? (
                    <TableCell className="overflow-hidden px-3 py-2.5">
                      {stageName !== "—" ? (
                        <Badge
                          variant="outline"
                          title={stageName}
                          className={cn(
                            "h-auto max-w-full overflow-hidden border-transparent text-xs",
                            stageStyle
                          )}
                        >
                          <span className="truncate">{stageName}</span>
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  ) : null}
                  {visibleColumns.includes("probability") ? (
                    <TableCell className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                      {dealProbabilityLabel(deal, stage)}
                    </TableCell>
                  ) : null}
                  {visibleColumns.includes("closeDate") ? (
                    <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                      {formatDate(deal.expectedCloseDate)}
                    </TableCell>
                  ) : null}
                  {visibleColumns.includes("owner") ? (
                    <TableCell className="overflow-hidden px-3 py-2.5">
                      <TruncateText value={owner.name} className="text-xs" />
                    </TableCell>
                  ) : null}
                  {visibleColumns.includes("createdAt") ? (
                    <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                      {formatDate(deal.createdAt)}
                    </TableCell>
                  ) : null}
                  <TableCell className="w-[88px] min-w-[88px] px-2 py-2.5">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-7 shrink-0"
                        aria-label="View deal"
                        onClick={() => onView(deal)}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-7 shrink-0"
                        aria-label="Edit deal"
                        onClick={() => onEdit(deal)}
                      >
                        <SquarePen className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-3 py-2.5 dark:border-neutral-800">
        <p className="text-[12px] text-neutral-500">
          Showing{" "}
          {filteredCount === 0 ? 0 : (page - 1) * pageSize + 1}–
          {Math.min(page * pageSize, filteredCount)} of {filteredCount}
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[108px] rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Previous
          </Button>
          <span className="text-[12px] font-medium text-neutral-500">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}
