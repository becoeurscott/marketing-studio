"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProgressBar({ value, className, label }: { value: number; className?: string; label?: string }) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between text-xs text-text2 mb-1.5">
          <span>{label}</span><span>{Math.round(value)}%</span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
        <motion.div className="h-full bg-accent rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, value))}%` }} transition={{ ease: "easeOut", duration: 0.4 }} />
      </div>
    </div>
  );
}

/** Step list for multi-stage jobs (video: Preparing → Generating → Rendering → Finalizing). */
export function StepProgress({ steps, current, className }: { steps: readonly string[]; current: number; className?: string }) {
  return (
    <ol className={cn("space-y-2", className)}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className={cn("flex items-center gap-3 text-sm", done ? "text-text2" : active ? "text-text" : "text-muted")}>
            <span className={cn("size-5 rounded-full flex items-center justify-center border", done ? "bg-success/20 border-success/40" : active ? "border-accent" : "border-border-strong")}>
              {done ? <Check className="size-3 text-success" /> : active ? <Loader2 className="size-3 animate-spin text-highlight" /> : null}
            </span>
            {s}
          </li>
        );
      })}
    </ol>
  );
}

/** Dots for wizard/onboarding steps. */
export function StepDots({ total, current, className }: { total: number; current: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-label={`Étape ${current + 1} sur ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <motion.span key={i} className={cn("h-1.5 rounded-full", i <= current ? "bg-accent" : "bg-white/12")} animate={{ width: i === current ? 24 : 8 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
      ))}
    </div>
  );
}
