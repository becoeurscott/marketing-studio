import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** CSS-only tooltip. Wrap any element; shows on hover/focus. */
export function Tooltip({ label, children, side = "top", className }: { label: string; children: ReactNode; side?: "top" | "bottom" | "right"; className?: string }) {
  const pos =
    side === "top" ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
    : side === "bottom" ? "top-full left-1/2 -translate-x-1/2 mt-2"
    : "left-full top-1/2 -translate-y-1/2 ml-2";
  return (
    <span className={cn("relative inline-flex group/tt", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 w-max max-w-[60vw] whitespace-normal rounded-sm bg-elevated border border-border-strong px-2 py-1 text-[11px] text-text shadow-float opacity-0 transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100",
          pos,
        )}
      >
        {label}
      </span>
    </span>
  );
}
