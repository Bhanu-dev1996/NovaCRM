"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function FormFieldDropdown({
  id,
  value,
  onChange,
  onBlur,
  options,
  placeholder = "Select",
  searchPlaceholder = "Search…",
  emptyLabel = "No matches",
  searchable = false,
  listClassName,
  invalid = false,
  triggerClassName,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const closingFromSelectRef = useRef(false);

  const normalizedValue = value == null || value === "" ? "" : String(value);

  function handleOpenChange(next) {
    setOpen(next);
    if (!next) {
      setQuery("");
      if (closingFromSelectRef.current) {
        closingFromSelectRef.current = false;
        return;
      }
      onBlur?.();
    }
  }

  const selected = options.find(
    (item) => String(item.value) === normalizedValue
  );
  const filtered = useMemo(() => {
    if (!searchable) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) =>
      (item.searchText || item.label).toLowerCase().includes(q)
    );
  }, [options, query, searchable]);

  function selectItem(nextValue) {
    onChange(nextValue);
    setQuery("");
    closingFromSelectRef.current = true;
    setOpen(false);
  }

  return (
    <DropdownMenu
      open={disabled ? false : open}
      onOpenChange={(next) => {
        if (disabled) return;
        handleOpenChange(next);
      }}
    >
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={invalid}
            className={cn(
              "mt-1.5 h-10 w-full justify-between rounded-lg border-input bg-transparent px-2.5 text-[13px] font-normal shadow-none dark:bg-input/30",
              disabled && "cursor-not-allowed opacity-60",
              triggerClassName
            )}
          />
        }
      >
        <span
          className={cn(
            "truncate text-left",
            !selected && "text-muted-foreground"
          )}
        >
          {selected?.label || placeholder}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="z-[120] w-(--anchor-width) min-w-(--anchor-width) gap-0 overflow-hidden p-0"
      >
        {searchable ? (
          <div
            className="border-b border-border p-2"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9"
              autoFocus
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (filtered[0]) selectItem(filtered[0].value);
                }
              }}
            />
          </div>
        ) : null}
        <div
          className={cn(
            "max-h-56 overflow-y-auto p-1",
            listClassName ?? "min-h-32"
          )}
        >
          {filtered.map((item) => (
            <DropdownMenuItem
              key={item.value}
              className="gap-2 py-2 text-[13px] font-normal"
              onClick={() => selectItem(item.value)}
            >
              <Check
                className={cn(
                  "size-3.5 shrink-0",
                  String(item.value) === normalizedValue
                    ? "opacity-100"
                    : "opacity-0"
                )}
              />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </DropdownMenuItem>
          ))}
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-[13px] text-muted-foreground">
              {emptyLabel}
            </p>
          ) : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
