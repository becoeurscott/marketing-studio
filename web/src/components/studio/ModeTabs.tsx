"use client";

import { Clapperboard, ImageIcon, Megaphone, PenLine, Rocket, UserRound } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type StudioTab = "image" | "video" | "ugc" | "ads" | "copy" | "campaign";
export type ComposeMode = "image" | "video" | "ugc";

const tabs: { value: StudioTab; label: string; icon: typeof ImageIcon; href?: string }[] = [
  { value: "image", label: "IMAGE", icon: ImageIcon },
  { value: "video", label: "VIDÉO", icon: Clapperboard },
  { value: "ugc", label: "UGC", icon: UserRound },
  { value: "ads", label: "PUBS", icon: Megaphone, href: "/studio/ads" },
  { value: "copy", label: "TEXTES", icon: PenLine, href: "/studio/copy" },
  { value: "campaign", label: "CAMPAGNE", icon: Rocket, href: "/campaigns" },
];

/** Mode tabs (SPEC §10). IMAGE/VIDEO/UGC switch in place; ADS/COPY/CAMPAIGN navigate. `compact` = floating segmented pill (mobile). */
export function ModeTabs({ value, onChange, className, compact, composeOnly }: { value: StudioTab; onChange: (v: ComposeMode) => void; className?: string; compact?: boolean; composeOnly?: boolean }) {
  const list = composeOnly ? tabs.filter((t) => !t.href) : tabs;
  return (
    <div role="tablist" className={cn("inline-flex items-center gap-0.5 p-1 overflow-x-auto no-scrollbar max-w-full", compact ? "rounded-full bg-black/70 backdrop-blur-md border border-white/10 shadow-float" : "rounded-lg bg-surface border border-border", className)}>
      {list.map((t) => {
        const active = t.value === value;
        const cls = cn("h-8 px-3 text-[12px] font-semibold tracking-wide inline-flex items-center gap-1.5 whitespace-nowrap transition-colors", compact ? "rounded-full" : "rounded-md", active ? (compact ? "bg-white text-black" : "bg-elevated border border-border-strong text-text") : "text-text2 hover:text-text");
        return t.href ? (
          <Link key={t.value} href={t.href} role="tab" aria-selected={active} className={cls}><t.icon className="size-3.5" />{t.label}</Link>
        ) : (
          <button key={t.value} role="tab" aria-selected={active} onClick={() => onChange(t.value as ComposeMode)} className={cls}><t.icon className="size-3.5" />{t.label}</button>
        );
      })}
    </div>
  );
}
