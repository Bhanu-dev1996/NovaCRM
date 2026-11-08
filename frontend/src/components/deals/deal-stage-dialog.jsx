"use client";

import { useEffect, useState } from "react";

import { DEAL_LOSS_REASONS } from "@/components/deals/deals-data";
import { FormFieldDropdown } from "@/components/shared/form-field-dropdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DealStageDialog({
  open,
  onOpenChange,
  mode,
  dealName,
  onConfirm,
  confirming = false,
}) {
  const [lossReason, setLossReason] = useState("");
  const [actualCloseDate, setActualCloseDate] = useState("");

  useEffect(() => {
    if (!open) return;
    setLossReason("");
    setActualCloseDate(new Date().toISOString().slice(0, 10));
  }, [open, mode]);

  const title =
    mode === "lost"
      ? "Mark deal as lost"
      : mode === "won"
        ? "Mark deal as won"
        : "Change deal stage";

  const description =
    mode === "lost"
      ? `Record why ${dealName || "this deal"} did not close.`
      : mode === "won"
        ? `Confirm the actual close date for ${dealName || "this deal"}.`
        : `Update the pipeline stage for ${dealName || "this deal"}.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description}>
        <DialogBody className="space-y-4 text-[13px]">
          {mode === "lost" ? (
            <div>
              <Label>Loss reason</Label>
              <FormFieldDropdown
                value={lossReason}
                onChange={setLossReason}
                options={DEAL_LOSS_REASONS.map((r) => ({ value: r, label: r }))}
                placeholder="Select reason"
                triggerClassName="mt-1.5"
              />
            </div>
          ) : null}
          {mode === "won" ? (
            <div>
              <Label htmlFor="actual-close">Actual close date</Label>
              <Input
                id="actual-close"
                type="date"
                className="mt-1.5"
                value={actualCloseDate}
                onChange={(e) => setActualCloseDate(e.target.value)}
              />
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={confirming || (mode === "lost" && !lossReason)}
            onClick={() =>
              onConfirm?.({
                lossReason: mode === "lost" ? lossReason : "",
                actualCloseDate: mode === "won" ? actualCloseDate : "",
              })
            }
          >
            {confirming ? "Updating…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
