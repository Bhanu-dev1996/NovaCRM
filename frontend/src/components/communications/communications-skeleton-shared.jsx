import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CommSkeletonBlock({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-neutral-200/70 dark:bg-neutral-800",
        className
      )}
    />
  );
}
