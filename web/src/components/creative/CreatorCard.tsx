"use client";

import { Check } from "lucide-react";
import type { Creator } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CreatorCard({ creator, selected, onSelect, compact }: { creator: Creator; selected?: boolean; onSelect?: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative text-left rounded-lg border overflow-hidden transition-all group",
        selected ? "border-accent ring-2 ring-accent/40" : "border-border hover:border-white/25",
        compact ? "flex items-center gap-3 p-2 bg-surface" : "bg-card",
      )}
    >
      <img src={creator.avatarUrl} alt={creator.name} className={cn("object-cover", compact ? "size-11 rounded-md shrink-0" : "w-full aspect-[4/5]")} />
      <div className={cn(compact ? "min-w-0" : "p-3")}>
        <p className="text-sm font-semibold truncate">{creator.name}</p>
        <p className="text-xs text-text2 truncate">{creator.age} · {creator.style}</p>
        {!compact && <p className="text-[11px] text-muted mt-1 line-clamp-2">{creator.bio}</p>}
      </div>
      {selected && <span className="absolute top-2 right-2 size-5 rounded-full bg-accent text-white flex items-center justify-center"><Check className="size-3" /></span>}
    </button>
  );
}
