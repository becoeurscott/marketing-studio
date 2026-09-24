"use client";

import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption { value: string; label: string }
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  compact?: boolean;
}

export function Select({ label, options, placeholder, compact, className, id, ...rest }: SelectProps) {
  const sid = id ?? rest.name;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label htmlFor={sid} className="text-[13px] font-medium text-text2">{label}</label>}
      <div className="relative">
        <select
          id={sid}
          className={cn(
            "w-full appearance-none bg-surface border border-border-strong rounded-md text-sm text-text pl-3 pr-9 transition-colors focus:border-accent focus:outline-none disabled:opacity-50",
            compact ? "h-8 text-[13px]" : "h-10",
          )}
          {...rest}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
      </div>
    </div>
  );
}
