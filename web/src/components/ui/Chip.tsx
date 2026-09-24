"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}

export function Chip({ label, selected, onClick, icon, size = "md", disabled, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-150 select-none whitespace-nowrap",
        size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-[13px]",
        selected
          ? "bg-accent/15 border-accent/60 text-highlight"
          : "bg-surface border-border-strong text-text2 hover:text-text hover:border-white/25",
        disabled && "opacity-40 pointer-events-none",
        className,
      )}
    >
      {selected && !icon ? <Check className="size-3.5" /> : icon}
      {label}
    </button>
  );
}

export interface ChipOption<T extends string = string> { value: T; label: string; icon?: ReactNode }

interface BaseGroup<T extends string> { options: ChipOption<T>[]; size?: "sm" | "md"; className?: string }
export type ChipGroupProps<T extends string> =
  | (BaseGroup<T> & { multiple?: false; value: T | null; onChange: (v: T) => void })
  | (BaseGroup<T> & { multiple: true; value: T[]; onChange: (v: T[]) => void });

export function ChipGroup<T extends string>(props: ChipGroupProps<T>) {
  const { options, size, className } = props;
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role={props.multiple ? "group" : "radiogroup"}>
      {options.map((o) => {
        const selected = props.multiple ? props.value.includes(o.value) : props.value === o.value;
        return (
          <Chip
            key={o.value}
            label={o.label}
            icon={o.icon}
            size={size}
            selected={selected}
            onClick={() => {
              if (props.multiple) {
                props.onChange(selected ? props.value.filter((v) => v !== o.value) : [...props.value, o.value]);
              } else props.onChange(o.value);
            }}
          />
        );
      })}
    </div>
  );
}
