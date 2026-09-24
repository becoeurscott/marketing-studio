"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string = string> { value: T; label: string; count?: number; icon?: ReactNode }

export interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  variant?: "underline" | "pill";
  className?: string;
  layoutId?: string;
}

export function Tabs<T extends string>({ items, value, onChange, variant = "underline", className, layoutId = "tabs" }: TabsProps<T>) {
  const pill = variant === "pill";
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1 overflow-x-auto no-scrollbar",
        pill ? "p-1 bg-surface border border-border rounded-lg w-fit max-w-full" : "border-b border-border",
        className,
      )}
    >
      {items.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium transition-colors",
              pill ? "h-8 px-3 rounded-md" : "h-10 px-3 -mb-px",
              active ? "text-text" : "text-text2 hover:text-text",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className={cn("absolute", pill ? "inset-0 rounded-md bg-elevated border border-border-strong" : "left-0 right-0 bottom-0 h-0.5 bg-accent")}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative flex items-center gap-1.5 [&>svg]:size-4">
              {t.icon}
              {t.label}
              {typeof t.count === "number" && <span className="text-[11px] text-muted">{t.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
