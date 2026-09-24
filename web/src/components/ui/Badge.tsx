import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "outline";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-white/6 text-text2",
  accent: "bg-accent/15 text-highlight",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  outline: "border border-border-strong text-text2",
};

export function Badge({ tone = "neutral", className, dot, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; dot?: boolean }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap", tones[tone], className)}
      {...rest}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {rest.children}
    </span>
  );
}

export function statusTone(status: string): BadgeTone {
  switch (status) {
    case "active": case "completed": case "published": return "success";
    case "draft": case "queued": return "neutral";
    case "scheduled": case "processing": return "accent";
    case "archived": return "outline";
    case "failed": return "danger";
    default: return "neutral";
  }
}
