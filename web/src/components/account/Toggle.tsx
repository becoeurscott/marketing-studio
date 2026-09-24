"use client";

import { cn } from "@/lib/utils";

export interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

/** Accessible switch. Renders as a full-width row when `label` is given. */
export function Toggle({ checked, onChange, label, description, disabled, className }: ToggleProps) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-40",
        checked ? "bg-accent border-accent" : "bg-elevated border-border-strong",
      )}
    >
      <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
    </button>
  );
  if (!label) return control;
  return (
    <div className={cn("flex items-center justify-between gap-4 py-3", className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-text">{label}</p>
        {description && <p className="text-[13px] text-text2 mt-0.5">{description}</p>}
      </div>
      {control}
    </div>
  );
}
