"use client";

import { Play, RefreshCw, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TRENDING_VIDEOS } from "@/data/trendingVideos";
import type { CommunityPost } from "@/lib/community";

interface Card { id: string; url: string; poster?: string; title: string; prompt: string }

/** Studio link that opens video mode with the prompt pre-filled, so the user can recreate the clip. */
const recreateHref = (prompt: string) => `/studio?${new URLSearchParams({ mode: "video", prompt })}`;

export function TrendingVideos() {
  const [community, setCommunity] = useState<Card[]>([]);
  const [open, setOpen] = useState<Card | null>(null);

  useEffect(() => {
    fetch(`/api/community?${new URLSearchParams({ kind: "video" })}`)
      .then((r) => r.json())
      .then((d: { posts?: CommunityPost[] }) =>
        setCommunity((d.posts ?? []).map((p) => ({ id: p.id, url: p.url, poster: p.poster ?? undefined, title: `${p.author} · ${p.modelLabel}`, prompt: p.prompt }))),
      )
      .catch(() => {});
  }, []);

  const cards: Card[] = [...TRENDING_VIDEOS, ...community];

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="size-4 text-highlight" />
        <h2 className="text-[17px] font-semibold tracking-tight">Tendances</h2>
        <span className="text-[12px] text-muted">Touchez une vidéo pour la voir et la recréer</span>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-1 snap-x">
        {cards.map((c) => <VideoCard key={c.id} card={c} onOpen={() => setOpen(c)} />)}
      </div>
      {open && <VideoViewer card={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

function VideoCard({ card, onOpen }: { card: Card; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Voir « ${card.title} »`}
      className="snap-start shrink-0 w-[180px] group relative overflow-hidden rounded-xl bg-white/[0.03] text-left focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="aspect-[9/16] relative">
        <video src={card.url} poster={card.poster} autoPlay muted loop playsInline preload="metadata" className="size-full object-cover" />
        <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid size-11 place-items-center rounded-full bg-black/55 backdrop-blur"><Play className="size-5 fill-white text-white" /></span>
        </span>
        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-[12px] font-medium text-white line-clamp-1">{card.title}</p>
          <p className="text-[10px] text-white/60 mt-0.5 line-clamp-2">{card.prompt}</p>
        </div>
      </div>
    </button>
  );
}

/** Full-screen player: the clip plays with its prompt, and "Recréer" opens Studio pre-filled. */
function VideoViewer({ card, onClose }: { card: Card; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={card.title} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      <button type="button" onClick={onClose} aria-label="Fermer" className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
        <X className="size-5" />
      </button>
      <div className="relative flex max-h-full w-full max-w-[420px] flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <video src={card.url} poster={card.poster} autoPlay loop playsInline controls className="max-h-[70vh] w-full rounded-2xl bg-black object-contain" />
        <div>
          <p className="text-[15px] font-semibold text-white">{card.title}</p>
          <p className="mt-1 text-[12px] text-white/60 line-clamp-3">{card.prompt}</p>
        </div>
        <Link href={recreateHref(card.prompt)} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-semibold text-black hover:opacity-90">
          <RefreshCw className="size-4" /> Recréer cette vidéo
        </Link>
      </div>
    </div>
  );
}
