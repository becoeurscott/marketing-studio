"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Chip } from "./Chip";

export interface FilterOption<T extends string = string> { value: T; label: string; count?: number }

export interface FilterBarProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (v: T) => void;
  right?: ReactNode;
  className?: string;
}

/** Horizontal chip filter row with an optional right slot (sort, view toggle…). */
export function FilterBar<T extends string>({ options, value, onChange, right, className }: FilterBarProps<T>) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5">
        {options.map((o) => (
          <Chip key={o.value} size="sm" label={typeof o.count === "number" ? `${o.label} · ${o.count}` : o.label} selected={o.value === value} onClick={() => onChange(o.value)} />
        ))}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </div>
  );
}
