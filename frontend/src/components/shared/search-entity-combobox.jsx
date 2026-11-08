"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Popover search picker (same interaction as Add lead → Company).
 */
export function SearchEntityCombobox({
  value,
  onChange,
  onBlur,
  items = [],
  placeholder = "Search or add a company",
  searchPlaceholder = "Type a company name",
  emptyLabel = "No companies found",
  createLabel = (name) => `Add “${name}”`,
  onCreate,
  disabled = false,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  function handleOpenChange(next) {
    if (disabled) return;
    setOpen(next);
    if (!next) {
      setQuery("");
      onBlur?.();
    }
  }

  const selected = items.find((item) => String(item.id) === String(value));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hay = `${item.label || ""} ${item.searchText || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const exactMatch = items.some(
    (item) => String(item.label || "").trim().toLowerCase() === query.trim().toLowerCase()
  );
  const canCreate = Boolean(onCreate) && query.trim().length > 0 && !exactMatch;

  function selectItem(id) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  async function handleCreate() {
    const name = query.trim();
    if (!name || !onCreate || creating) return;
    setCreating(true);
    try {
      const created = await onCreate(name);
      if (created?.id) {
        onChange(created.id);
        setOpen(false);
        setQuery("");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "mt-1.5 h-10 w-full justify-between rounded-lg border-input bg-transparent px-2.5 text-[13px] font-normal shadow-none dark:bg-input/30",
              className
            )}
          />
        }
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected?.label || placeholder}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        positionMethod="fixed"
        collisionAvoidance={{
          side: "flip",
          align: "shift",
          fallbackAxisSide: "none",
        }}
        className="w-(--anchor-width) min-w-(--anchor-width) gap-0 overflow-hidden rounded-xl p-0"
      >
        <div className="border-b border-border p-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (canCreate) handleCreate();
                else if (filtered[0]) selectItem(filtered[0].id);
              }
            }}
          />
        </div>
        <div className="max-h-48 overflow-y-auto p-1">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectItem(item.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] transition-colors hover:bg-muted",
                String(value) === String(item.id) && "bg-muted"
              )}
            >
              <Check
                className={cn(
                  "size-3.5 shrink-0",
                  String(value) === String(item.id) ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
          {filtered.length === 0 && !canCreate ? (
            <p className="px-2 py-3 text-center text-[12px] text-muted-foreground">
              {emptyLabel}
            </p>
          ) : null}
          {canCreate ? (
            <button
              type="button"
              disabled={creating}
              onClick={handleCreate}
              className="mt-0.5 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950"
            >
              <Plus className="size-3.5 shrink-0" />
              <span className="truncate">{createLabel(query.trim())}</span>
            </button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
