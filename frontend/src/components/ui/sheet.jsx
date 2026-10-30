"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sheet({ open, onOpenChange, children }) {
  useEffect(() => {
    if (!open) return;
    function onKey(event) {
      if (event.key === "Escape") onOpenChange?.(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-neutral-900/40"
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </div>
  );
}

export function SheetContent({
  className,
  children,
  side = "right",
  title,
  description,
  onClose,
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={cn(
        "absolute inset-y-0 flex h-full w-full max-w-[350px] flex-col border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950",
        side === "right" ? "right-0 border-l" : "left-0 border-r",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
        <div className="min-w-0">
          {title ? (
            <h2 className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-50">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-0.5 text-[12px] text-neutral-500">{description}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>
      {children}
    </div>
  );
}

export function SheetBody({ className, children }) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4", className)}>
      {children}
    </div>
  );
}

export function SheetFooter({ className, children }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-t border-neutral-100 px-5 py-4 dark:border-neutral-800 [&>button]:h-9 [&>button]:min-w-0 [&>button]:flex-1 [&>button]:px-3",
        className
      )}
    >
      {children}
    </div>
  );
}
