"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sheet({ open, onOpenChange, children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event) {
      if (event.key === "Escape") onOpenChange?.(false);
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] isolate">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-neutral-900/40"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="pointer-events-none absolute inset-0">{children}</div>
    </div>,
    document.body
  );
}

export function SheetContent({
  className,
  children,
  side = "right",
  title,
  description,
  onClose,
  hideHeader = false,
  maxWidth = 350,
  style,
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        width: "100%",
        maxWidth: `min(100vw, ${maxWidth}px)`,
        ...style,
      }}
      className={cn(
        "pointer-events-auto absolute top-0 bottom-0 z-10 flex h-full shrink-0 flex-col border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950",
        side === "right" ? "right-0 border-l" : "left-0 border-r",
        className
      )}
    >
      {hideHeader ? null : (
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
      )}
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
        "flex flex-wrap items-center justify-end gap-2 border-t border-neutral-100 px-5 py-4 dark:border-neutral-800 [&>button]:h-9 [&>button]:min-w-0 [&>button]:shrink-0 [&>button]:px-3",
        className
      )}
    >
      {children}
    </div>
  );
}
