"use client";

import { Heart, Languages } from "lucide-react";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import type { Creator } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GENDER_LABELS } from "@/lib/labels";

/** `onOpen`: main click (choose the creator). `onProfile`: optional "Voir le profil" link. */
export function CreatorCard({ creator, onOpen, onProfile, className }: { creator: Creator; onOpen?: (c: Creator) => void; onProfile?: (c: Creator) => void; className?: string }) {
  const favorites = useStore((s) => s.favorites.creator);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const fav = favorites.includes(creator.id);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Silent preview: plays while on screen (loads nothing before: light on mobile data), pauses when scrolled away.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? void el.play().catch(() => {}) : el.pause()), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [creator.id]);

  return (
    <div className={cn("relative group", className)}>
      <button
        type="button"
        onClick={() => onOpen?.(creator)}
        className="block w-full text-left rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-white/15 focus-visible:outline-accent"
      >
        <div className="relative aspect-[4/5] bg-elevated overflow-hidden">
          {creator.intro ? (
            <video ref={videoRef} src={creator.intro} poster={creator.portrait} muted loop playsInline preload="none" className="size-full object-cover" aria-label={`Présentation de ${creator.name}`} />
          ) : (
            <img src={creator.portrait} alt={creator.name} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          {creator.featured && <Badge tone="accent" className="absolute top-3 left-3">À la une</Badge>}
          <div className="absolute inset-x-3 bottom-3">
            <p className="text-base font-semibold text-white leading-tight">{creator.name}, {creator.age}</p>
            <p className="text-[12px] text-white/70 mt-0.5">{GENDER_LABELS[creator.gender]} · {creator.ageRange}</p>
          </div>
        </div>
        <div className="px-3 py-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Badge tone="neutral">{creator.style}</Badge>
          </div>
          <p className="text-[11px] text-muted flex items-center gap-1 truncate"><Languages className="size-3 shrink-0" />{creator.languages.join(", ")}</p>
        </div>
      </button>
      {onProfile && (
        <button type="button" onClick={() => onProfile(creator)} className="absolute right-3 bottom-2.5 text-[11px] font-medium text-text2 hover:text-text underline-offset-2 hover:underline">
          Voir le profil
        </button>
      )}
      <button
        type="button"
        aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={fav}
        onClick={(e) => { e.stopPropagation(); toggleFavorite("creator", creator.id); }}
        className={cn(
          "absolute top-3 right-3 size-8 rounded-full flex items-center justify-center backdrop-blur transition-colors",
          fav ? "bg-accent text-on-accent" : "bg-black/50 text-white hover:bg-black/70",
        )}
      >
        <Heart className={cn("size-4", fav && "fill-current")} />
      </button>
    </div>
  );
}
