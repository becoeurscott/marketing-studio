"use client";

import { SlidersHorizontal, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Inspector } from "@/components/shell/ShellContext";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Studio page scaffold: controls go to the desktop Inspector (lg+) and to a
 * BottomSheet on smaller screens, opened from a floating bar that also holds
 * the primary Generate action.
 */
export function StudioControls({
  title = "Settings",
  controls,
  generateLabel,
  generateIcon: Icon,
  onGenerate,
  loading,
  disabled,
  cost,
}: {
  title?: string;
  controls: ReactNode;
  generateLabel: string;
  generateIcon?: LucideIcon;
  onGenerate: () => void;
  loading?: boolean;
  disabled?: boolean;
  cost?: number;
}) {
  const [open, setOpen] = useState(false);
  const generate = (
    <Button fullWidth size="lg" loading={loading} disabled={disabled} leftIcon={Icon ? <Icon className="size-4" /> : undefined} onClick={() => { setOpen(false); onGenerate(); }}>
      <span className="truncate">{generateLabel}</span>
      {typeof cost === "number" && <span className="text-white/70 text-[13px] font-normal shrink-0">· {cost} cr</span>}
    </Button>
  );
  return (
    <>
      <Inspector>
        <div className="flex flex-col min-h-full">
          <div className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</div>
          <div className="px-4 pb-4 space-y-5 flex-1">{controls}</div>
          <div className="sticky bottom-0 p-4 border-t border-border bg-surface/95 backdrop-blur">{generate}</div>
        </div>
      </Inspector>

      {/* Mobile / tablet floating bar */}
      <div className="lg:hidden fixed z-40 left-4 right-4 bottom-[4.25rem] md:bottom-6 flex items-center gap-2 p-2 rounded-xl bg-elevated/95 backdrop-blur border border-border-strong shadow-float">
        <Button variant="secondary" size="lg" leftIcon={<SlidersHorizontal className="size-4" />} onClick={() => setOpen(true)} className="shrink-0" aria-label="Settings"><span className="hidden sm:inline">Settings</span></Button>
        <div className="flex-1 min-w-0">{generate}</div>
      </div>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={title}>
        <div className="space-y-5 pb-2">{controls}</div>
        <div className="pt-4">{generate}</div>
      </BottomSheet>
    </>
  );
}

/** Labelled group inside the inspector. */
export function ControlField({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-text2">{label}</span>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/** Dominant canvas area that keeps a consistent frame across studio pages. */
export function Canvas({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative rounded-xl border border-border bg-surface min-h-[60vh] lg:min-h-[calc(100dvh-12rem)] flex flex-col overflow-hidden", className)}>
      {children}
    </div>
  );
}
