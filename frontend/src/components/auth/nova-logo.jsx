import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export function NovaLogo({
  className,
  markClassName,
  compact = false,
  variant = "dark",
}) {
  const isLight = variant === "light";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/nova-mark.svg"
        alt=""
        width={210}
        height={190}
        className={cn("size-10 shrink-0 object-contain", markClassName)}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "font-bold tracking-tight",
              compact ? "text-[18px]" : "text-[22px]",
              isLight ? "text-neutral-900" : "text-white"
            )}
          >
            NovaCRM
          </span>
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
              isLight
                ? "border-primary-200 bg-primary-50 text-primary-700"
                : "border-primary-400/40 bg-primary-500/20 text-primary-200"
            )}
          >
            AI Engine
          </span>
        </div>
        {!compact ? (
          <p
            className={cn(
              "mt-0.5 text-[13px] font-medium",
              isLight ? "text-neutral-400" : "text-primary-200/70"
            )}
          >
            {siteConfig.tagline}
          </p>
        ) : null}
      </div>
    </div>
  );
}
