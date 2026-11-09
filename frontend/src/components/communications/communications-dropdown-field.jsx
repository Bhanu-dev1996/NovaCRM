"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function CommunicationsDropdown({
  value,
  onChange,
  options,
  placeholder = "Choose…",
  triggerClassName,
  align = "start",
}) {
  const selected = options.find((o) => o.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-9 w-full justify-between gap-2 px-2.5 font-normal",
              triggerClassName
            )}
          />
        }
      >
        <span className="truncate text-left text-[13px]">
          {selected?.label || placeholder}
        </span>
        <ChevronDown className="size-3.5 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="max-h-64 min-w-[var(--anchor-width)] overflow-y-auto">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
