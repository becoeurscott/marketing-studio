"use client";

import { AlertTriangle, Check, Download, Globe, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { AspectRatio } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Run } from "./useStudioRuns";

interface Viewed { url: string; video: boolean; kind: string; prompt: string; modelLabel: string; ratio: string; poster?: string }

const ASPECT: Record<AspectRatio, string> = { "1:1": "1 / 1", "4:5": "4 / 5", "9:16": "9 / 16", "16:9": "16 / 9", "3:2": "3 / 2" };

function Tile({ url, video, poster, ratio, onOpen }: { url: string; video?: boolean; poster?: string; ratio: AspectRatio; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="group relative overflow-hidden rounded-xl bg-white/[0.03] break-inside-avoid mb-2 w-full block" style={{ aspectRatio: ASPECT[ratio] }}>
      {video
        ? <video src={url} poster={poster} muted loop playsInline autoPlay className="size-full object-cover" />
        : <img src={url} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />}
    </button>
  );
}

/** Higgsfield-style feed: each run is a row header (prompt + model) above its tiles; history from the library follows. */
export function RunFeed({ runs, onRemove, onReuse, onMore }: { runs: Run[]; onRemove: (id: string) => void; onReuse: (prompt: string) => void; onMore?: (run: Run, mode: "variations" | "multi") => void }) {
  const assets = useStore((s) => s.assets);
  const history = assets.filter((a) => a.tags?.includes("generated") && (a.type === "image" || a.type === "video"));
  const shown = new Set(runs.flatMap((r) => r.urls));
  const [open, setOpen] = useState<Viewed | null>(null);
  const [pub, setPub] = useState<"idle" | "busy" | "done" | string>("idle");
  const view = (v: Viewed) => { setPub("idle"); setOpen(v); };
  const publish = async () => {
    if (!open || pub === "busy") return;
    setPub("busy");
    const res = await fetch("/api/community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(open) }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { error?: string } | null;
    setPub(res?.ok ? "done" : data?.error ?? "Publication impossible.");
  };

  return (
    <div className="space-y-8">
      {runs.map((r) => (
        <section key={r.id}>
          <div className="flex items-start gap-3 mb-3">
            <button type="button" onClick={() => onReuse(r.prompt)} className="flex-1 min-w-0 text-left" title="Réutiliser ce prompt">
              <p className="text-[14px] text-white/90 line-clamp-2">{r.prompt || "Sans prompt"}</p>
              <p className="text-[12px] text-white/40 mt-0.5">{r.modelLabel} · {r.ratio}{r.status === "running" && " · génération en cours…"}</p>
            </button>
            {r.status === "done" && r.kind === "image" && onMore && (
              <div className="flex gap-1.5 shrink-0">
                <button type="button" onClick={() => onMore(r, "variations")} className="h-8 px-3 rounded-full bg-white/[0.06] hover:bg-white/10 text-[12px] font-medium text-white/85">Variantes</button>
                {r.input?.creatorId && <button type="button" onClick={() => onMore(r, "multi")} className="h-8 px-3 rounded-full bg-white/[0.06] hover:bg-white/10 text-[12px] font-medium text-white/85">Autres plans</button>}
              </div>
            )}
            {r.status !== "running" && <button type="button" onClick={() => onRemove(r.id)} className="text-white/30 hover:text-white" aria-label="Masquer"><X className="size-4" /></button>}
          </div>
          {r.status === "failed" ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3 text-[13px] text-white/70">
              <AlertTriangle className="size-4 text-warning shrink-0" />
              <span className="flex-1">{r.error?.message}</span>
              {r.error?.code === "insufficient-credits" && <Link href="/credits" className="rounded-lg bg-accent text-on-accent px-3 py-1.5 font-semibold">Recharger</Link>}
            </div>
          ) : (
            <div className={cn("grid gap-2", r.slots > 1 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-4")}>
              {r.status === "running"
                ? Array.from({ length: r.slots }, (_, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden bg-white/[0.04]" style={{ aspectRatio: ASPECT[r.ratio] }}>
                    <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(209,254,23,0.08)_50%,transparent_70%)] bg-[length:200%_100%] animate-[shimmer_1.6s_linear_infinite]" />
                    <Loader2 className="absolute inset-0 m-auto size-6 text-white/40 animate-spin" />
                  </div>
                ))
                : r.urls.map((u) => <Tile key={u} url={u} video={r.kind !== "image"} poster={r.poster} ratio={r.ratio} onOpen={() => view({ url: u, video: r.kind !== "image", kind: r.kind, prompt: r.prompt, modelLabel: r.modelLabel, ratio: r.ratio, poster: r.poster })} />)}
            </div>
          )}
        </section>
      ))}

      {history.some((a) => !shown.has(a.url)) && (
        <section>
          <p className="text-[13px] font-medium text-white/50 mb-3">Vos créations</p>
          <div className="columns-2 md:columns-4 xl:columns-5 gap-2">
            {history.filter((a) => !shown.has(a.url)).slice(0, 60).map((a) => (
              <button key={a.id} type="button" onClick={() => view({ url: a.url, video: a.type === "video", kind: a.type, prompt: a.name, modelLabel: "", ratio: "4:5", poster: a.thumbnail })} className="block w-full mb-2 overflow-hidden rounded-xl bg-white/[0.03] break-inside-avoid">
                {a.type === "video"
                  ? <video src={a.url} poster={a.thumbnail} muted loop playsInline preload="none" onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})} onMouseLeave={(e) => e.currentTarget.pause()} className="w-full" />
                  : <img src={a.thumbnail || a.url} alt={a.name} loading="lazy" className="w-full" />}
              </button>
            ))}
          </div>
        </section>
      )}

      {open && (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="absolute top-4 right-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {pub !== "idle" && pub !== "busy" && pub !== "done" && <span className="text-[12px] text-warning max-w-56">{pub}</span>}
            <button type="button" onClick={publish} disabled={pub === "busy" || pub === "done"} className="h-10 px-4 rounded-full bg-accent text-on-accent text-sm font-semibold flex items-center gap-2 disabled:opacity-70">
              {pub === "busy" ? <Loader2 className="size-4 animate-spin" /> : pub === "done" ? <Check className="size-4" /> : <Globe className="size-4" />}{pub === "done" ? "Publié" : "Publier"}
            </button>
            <a href={open.url} download target="_blank" rel="noreferrer" className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white" aria-label="Télécharger"><Download className="size-4" /></a>
            <button type="button" onClick={() => setOpen(null)} className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white" aria-label="Fermer"><X className="size-4" /></button>
          </div>
          {open.video
            ? <video src={open.url} controls autoPlay muted playsInline className="max-h-full max-w-full rounded-xl" onClick={(e) => e.stopPropagation()} />
            : <img src={open.url} alt="" className="max-h-full max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />}
        </div>
      )}
    </div>
  );
}
