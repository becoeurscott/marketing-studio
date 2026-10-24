"use client";

import { Download, Images, Play, Save } from "lucide-react";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";
import type { Generation } from "@/lib/types";
import { cn, downloadUrl, timeAgo } from "@/lib/utils";
import { GENERATION_TYPE_LABELS, labelOf } from "@/lib/labels";

const CATEGORIES = [
  { id: "all", label: "Tout" },
  { id: "image", label: "Images" },
  { id: "video", label: "Vidéos" },
  { id: "ad", label: "Annonces" },
  { id: "ugc", label: "UGC" },
  { id: "short", label: "Shorts" },
  { id: "copy", label: "Textes" },
] as const;

type Cat = (typeof CATEGORIES)[number]["id"];

function classify(g: Generation): Cat[] {
  const cats: Cat[] = [g.type as Cat];
  const p = (g.params as Record<string, unknown>) ?? {};
  if (p.ugc || p.creatorId) cats.push("ugc");
  if (g.type === "video" && (g.params as Record<string, unknown>)?.durationSec && Number((g.params as Record<string, unknown>).durationSec) <= 15) cats.push("short");
  return cats;
}

export function UserGallery() {
  const generations = useStore((s) => s.generations);
  const addAsset = useStore((s) => s.addAsset);
  const [cat, setCat] = useState<Cat>("all");
  const [pinned, setPinned] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const completed = useMemo(
    () => generations.filter((g) => g.status === "completed" && g.thumbnails.length).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [generations],
  );

  const filtered = useMemo(
    () => (cat === "all" ? completed : completed.filter((g) => classify(g).includes(cat))),
    [completed, cat],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: completed.length };
    for (const g of completed) for (const k of classify(g)) c[k] = (c[k] ?? 0) + 1;
    return c;
  }, [completed]);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([e]) => setPinned(!e.isIntersecting), { threshold: [1], rootMargin: "-1px 0px 0px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const saveToResources = useCallback((g: Generation) => {
    for (const url of g.thumbnails) {
      const isVideo = g.type === "video" || url.endsWith(".mp4");
      addAsset({
        name: g.prompt.slice(0, 60) || "Génération",
        type: isVideo ? "video" : "image",
        url,
        thumbnail: url,
        projectId: g.projectId,
        favorite: false,
        sizeKb: 0,
        tags: ["generated", g.type],
      });
    }
  }, [addAsset]);

  if (completed.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-[17px] font-semibold tracking-tight mb-3">Mes créations</h2>

      <div
        ref={tabsRef}
        className={cn(
          "sticky top-0 z-30 -mx-4 px-4 md:mx-0 md:px-0 py-2 transition-colors",
          pinned && "bg-bg/90 backdrop-blur border-b border-border",
        )}
      >
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((c) => {
            const count = counts[c.id] ?? 0;
            if (c.id !== "all" && count === 0) return null;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={cn(
                  "shrink-0 px-3.5 h-8 rounded-full text-[13px] font-medium transition-colors",
                  cat === c.id
                    ? "bg-white text-black"
                    : "bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/10",
                )}
              >
                {c.label}
                {count > 0 && <span className="ml-1.5 text-[11px] opacity-60">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-text2 text-sm">Aucune création dans cette catégorie.</div>
      ) : (
        <div className="columns-2 md:columns-3 xl:columns-4 gap-2 mt-3">
          {filtered.map((g) => (
            <GenerationCard key={g.id} gen={g} onSave={saveToResources} />
          ))}
        </div>
      )}
    </section>
  );
}

function GenerationCard({ gen, onSave }: { gen: Generation; onSave: (g: Generation) => void }) {
  const isVideo = gen.type === "video";
  const url = gen.thumbnails[0];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group relative mb-2 break-inside-avoid overflow-hidden rounded-xl bg-white/[0.03]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isVideo ? (
        <video
          src={url}
          muted
          loop
          playsInline
          preload="metadata"
          autoPlay={hovered}
          className="w-full"
          ref={(el) => { if (el) hovered ? el.play().catch(() => {}) : el.pause(); }}
        />
      ) : (
        <img src={url} alt={gen.prompt} loading="lazy" className="w-full" />
      )}

      {isVideo && !hovered && (
        <span className="absolute top-2 right-2 size-7 rounded-full bg-black/50 flex items-center justify-center backdrop-blur">
          <Play className="size-3.5 text-white fill-white" />
        </span>
      )}

      <div className="absolute top-2 left-2">
        <span className="rounded-full bg-black/50 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-white">
          {labelOf(GENERATION_TYPE_LABELS, gen.type)}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[11px] text-white line-clamp-2">{gen.prompt}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-[10px] text-white/50 flex-1 truncate">{timeAgo(gen.createdAt)} · {gen.creditsUsed} cr.</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSave(gen); }}
            className="pointer-events-auto rounded-lg bg-white/10 hover:bg-white/20 p-1.5 text-white"
            title="Enregistrer dans Ressources"
          >
            <Save className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); downloadUrl(url, `gen-${gen.id}`); }}
            className="pointer-events-auto rounded-lg bg-white/10 hover:bg-white/20 p-1.5 text-white"
            title="Télécharger"
          >
            <Download className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
