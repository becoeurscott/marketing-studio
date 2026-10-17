"use client";

import { Loader2, RefreshCcw, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { usePageTitle } from "@/components/shell/ShellContext";
import type { CommunityPost } from "@/lib/community";
import { cn } from "@/lib/utils";

const TABS = [{ id: "", label: "Tout" }, { id: "image", label: "Images" }, { id: "video", label: "Vidéos" }, { id: "ugc", label: "UGC" }] as const;

/** Community feed (Higgsfield "Community"): published creations, Recreate opens the studio with the same prompt. */
export default function CommunityPage() {
  usePageTitle("Communauté");
  const router = useRouter();
  const [tab, setTab] = useState<string>("");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(true);
  const [open, setOpen] = useState<CommunityPost | null>(null);

  const load = useCallback(async (reset: boolean, before?: string) => {
    setLoading(true);
    const q = new URLSearchParams();
    if (tab) q.set("kind", tab);
    if (before) q.set("before", before);
    const res = await fetch(`/api/community?${q}`).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { posts?: CommunityPost[] } | null;
    const next = data?.posts ?? [];
    setPosts((cur) => (reset ? next : [...cur, ...next]));
    setMore(next.length === 40);
    setLoading(false);
  }, [tab]);
  useEffect(() => { void load(true); }, [load]);

  const recreate = (p: CommunityPost) => router.push(`/studio?mode=${p.kind}&prompt=${encodeURIComponent(p.prompt)}`);
  const unpublish = async (p: CommunityPost) => {
    await fetch(`/api/community/${p.id}`, { method: "DELETE" });
    setPosts((cur) => cur.filter((x) => x.id !== p.id));
    setOpen(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 md:px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Communauté</h1>
          <p className="text-text2 text-sm mt-1">Les créations publiées par les commerçants. Touchez « Recréer » pour repartir du même prompt.</p>
        </div>
        <div className="flex gap-1 rounded-full bg-white/[0.05] p-1">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className={cn("px-3.5 h-8 rounded-full text-[13px] font-medium", tab === t.id ? "bg-white text-black" : "text-white/70 hover:text-white")}>{t.label}</button>
          ))}
        </div>
      </div>

      {!loading && posts.length === 0 ? (
        <div className="py-24 text-center text-text2">
          <p>Rien de publié pour l’instant.</p>
          <p className="text-sm mt-1">Dans le Studio, ouvrez une création et touchez « Publier » pour la partager ici.</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 xl:columns-4 gap-2">
          {posts.map((p) => (
            <div key={p.id} className="group relative mb-2 break-inside-avoid overflow-hidden rounded-xl bg-white/[0.03]">
              <button type="button" onClick={() => setOpen(p)} className="block w-full">
                {p.kind === "image"
                  ? <img src={p.url} alt={p.prompt} loading="lazy" className="w-full" />
                  : <video src={p.url} poster={p.poster ?? undefined} muted loop playsInline preload="metadata" onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})} onMouseLeave={(e) => e.currentTarget.pause()} className="w-full" />}
              </button>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[12px] text-white line-clamp-2">{p.prompt}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[11px] text-white/60 truncate flex-1">{p.author} · {p.modelLabel}</span>
                  <button type="button" onClick={() => recreate(p)} className="pointer-events-auto rounded-lg bg-accent text-on-accent px-2.5 py-1 text-[12px] font-semibold flex items-center gap-1"><RefreshCcw className="size-3" />Recréer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {loading && <div className="py-10 flex justify-center"><Loader2 className="size-6 animate-spin text-white/50" /></div>}
      {!loading && more && posts.length > 0 && (
        <div className="py-6 flex justify-center"><button type="button" onClick={() => load(false, posts[posts.length - 1]?.createdAt)} className="rounded-full bg-white/[0.06] hover:bg-white/10 px-5 h-10 text-sm">Voir plus</button></div>
      )}

      {open && (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur flex flex-col md:flex-row items-center justify-center gap-4 p-4" onClick={() => setOpen(null)}>
          <button type="button" onClick={() => setOpen(null)} className="absolute top-4 right-4 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white" aria-label="Fermer"><X className="size-4" /></button>
          <div className="min-h-0 flex-1 flex items-center justify-center max-h-[70vh] md:max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {open.kind === "image"
              ? <img src={open.url} alt="" className="max-h-[70vh] md:max-h-[90vh] max-w-full rounded-xl object-contain" />
              : <video src={open.url} poster={open.poster ?? undefined} controls autoPlay muted playsInline className="max-h-[70vh] md:max-h-[90vh] max-w-full rounded-xl" />}
          </div>
          <div className="w-full md:w-80 shrink-0 rounded-2xl border border-white/10 bg-[#121214] p-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-[12px] text-white/50">{open.author} · {open.modelLabel} · {open.ratio}</p>
            <p className="mt-2 text-[14px] text-white/90 whitespace-pre-wrap max-h-48 overflow-y-auto">{open.prompt || "Sans prompt"}</p>
            <button type="button" onClick={() => recreate(open)} className="mt-4 w-full h-11 rounded-xl bg-accent text-on-accent font-semibold flex items-center justify-center gap-2"><RefreshCcw className="size-4" />Recréer</button>
            {open.mine && <button type="button" onClick={() => unpublish(open)} className="mt-2 w-full h-10 rounded-xl bg-white/[0.06] hover:bg-white/10 text-sm flex items-center justify-center gap-2"><Trash2 className="size-4" />Retirer de la communauté</button>}
          </div>
        </div>
      )}
    </div>
  );
}
