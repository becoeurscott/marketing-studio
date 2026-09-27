"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { StepProgress } from "@/components/ui/ProgressIndicator";
import { cn } from "@/lib/utils";
import { VIDEO_STEP_LABELS } from "./constants";

const label_ = (s: string) => VIDEO_STEP_LABELS[s] ?? s;

/** "Creating your visual..." animated placeholder (SPEC §44). Optional step list for video. */
export function GeneratingOverlay({ label = "Création de votre visuel…", hint, steps, step, className }: { label?: string; hint?: string; steps?: readonly string[]; step?: number; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border bg-card flex flex-col items-center justify-center text-center p-8 min-h-[320px]", className)} aria-live="polite" aria-busy>
      {/* drifting glow */}
      <motion.div
        className="pointer-events-none absolute -inset-1/2 opacity-40"
        style={{ background: "radial-gradient(closest-side, rgba(249,115,22,0.35), transparent 70%)" }}
        animate={{ x: ["-10%", "10%", "-10%"], y: ["-6%", "8%", "-6%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative">
        <motion.div
          className="size-14 rounded-2xl bg-accent/15 border border-accent/40 flex items-center justify-center mx-auto mb-4"
          animate={{ scale: [1, 1.06, 1], rotate: [0, 4, -4, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="size-6 text-highlight" />
        </motion.div>
        <p className="text-base font-semibold">{label}</p>
        {hint && <p className="text-sm text-text2 mt-1">{hint}</p>}
        {steps ? (
          <StepProgress steps={steps.map((s) => label_(s))} current={step ?? 0} className="mt-5 text-left inline-block" />
        ) : (
          <div className="mt-5 h-1 w-48 mx-auto rounded-full bg-white/8 overflow-hidden">
            <motion.div className="h-full w-1/3 bg-accent rounded-full" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} />
          </div>
        )}
      </div>
    </div>
  );
}
