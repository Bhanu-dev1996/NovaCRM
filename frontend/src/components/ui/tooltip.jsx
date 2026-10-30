"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "@/lib/utils";

function TooltipProvider({ delay = 0, ...props }) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  );
}

function Tooltip({ ...props }) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 6,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        positionMethod="fixed"
        collisionBoundary="viewport"
        collisionAvoidance={{
          side: "flip",
          align: "shift",
          fallbackAxisSide: "none",
        }}
        className="isolate z-[100]"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-[100] max-w-xs rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs leading-snug whitespace-normal text-white shadow-md dark:bg-neutral-100 dark:text-neutral-900",
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
