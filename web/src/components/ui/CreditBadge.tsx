"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { cn, formatNumber } from "@/lib/utils";

export function CreditBadge({ className, compact }: { className?: string; compact?: boolean }) {
  const credits = useStore((s) => s.credits);
  const low = credits < 200;
  return (
    <Link
      href="/credits"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 h-8 text-[13px] font-medium transition-colors",
        low ? "border-warning/40 bg-warning/10 text-warning" : "border-border-strong bg-surface text-text hover:border-white/25",
        className,
      )}
      title={`${formatNumber(credits)} credits`}
    >
      <Sparkles className={cn("size-3.5", low ? "text-warning" : "text-highlight")} />
      {!compact && <span>{formatNumber(credits)}</span>}
    </Link>
  );
}
