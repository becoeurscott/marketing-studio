"use client";

import { ExternalLink, FileText, History, Images, Layers, RefreshCw, Video } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { statusLabel } from "@/components/campaigns/platform";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/ui/FilterBar";
import { SearchBar } from "@/components/ui/SearchBar";
import { useStore } from "@/lib/store";
import type { Generation, GenerationType } from "@/lib/types";
import { cn, formatDate, timeAgo } from "@/lib/utils";

type Filter = "all" | GenerationType;

const TYPE_META: Record<GenerationType, { label: string; icon: typeof Images; studio: string }> = {
  image: { label: "Image", icon: Images, studio: "/studio/image" },
  video: { label: "Vidéo", icon: Video, studio: "/studio/video" },
  copy: { label: "Texte", icon: FileText, studio: "/studio/copy" },
  ad: { label: "Publicité", icon: Layers, studio: "/studio/ads" },
};

export default function GenerationsPage() {
  const generations = useStore((s) => s.generations);
  const projects = useStore((s) => s.projects);
  const assets = useStore((s) => s.assets);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: generations.length, image: 0, video: 0, copy: 0, ad: 0 };
    for (const g of generations) c[g.type] += 1;
    return c;
  }, [generations]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return generations.filter((g) => filter === "all" || g.type === filter).filter((g) => !needle || g.prompt.toLowerCase().includes(needle));
  }, [generations, filter, q]);

  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.name ?? "Aucun projet";
  const open = generations.find((g) => g.id === openId) ?? null;
  const openAsset = open ? assets.find((a) => a.projectId === open.projectId && (open.type === "video" ? a.type === "video" : a.type === "image")) : null;

  return (
    <>
      <PageHeader title="Historique des générations" description="Toutes vos générations d'images, de vidéos, de textes et de pubs, avec le prompt utilisé." />

      {generations.length === 0 ? (
        <EmptyState icon={History} title="Aucune génération pour l'instant" description="Votre historique de générations apparaîtra ici, avec les prompts et les résultats." cta={{ label: "Ouvrir le Studio", href: "/studio" }} />
      ) : (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
            <SearchBar value={q} onChange={setQ} placeholder="Rechercher un prompt…" className="lg:w-72" />
            <FilterBar
              className="flex-1"
              options={[
                { value: "all", label: "Toutes", count: counts.all },
                { value: "image", label: "Images", count: counts.image },
                { value: "video", label: "Vidéos", count: counts.video },
                { value: "copy", label: "Textes", count: counts.copy },
                { value: "ad", label: "Pubs", count: counts.ad },
              ]}
              value={filter}
              onChange={setFilter}
            />
          </div>

          {list.length === 0 ? (
            <EmptyState compact icon={History} title="Aucun résultat" description="Essayez un autre type ou un autre terme de recherche." cta={{ label: "Effacer", onClick: () => { setFilter("all"); setQ(""); } }} />
          ) : (
            <div className="rounded-lg border border-border bg-card divide-y divide-border">
              {list.map((g) => <Row key={g.id} g={g} projectName={projectName(g.projectId)} onClick={() => setOpenId(g.id)} active={openId === g.id} />)}
            </div>
          )}
        </>
      )}

      <Drawer open={Boolean(open)} onClose={() => setOpenId(null)} title="Génération" width={440}>
        {open && (
          <div className="space-y-5">
            {open.thumbnails.length > 0 ? (
              <div className={cn("grid gap-2", open.thumbnails.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                {open.thumbnails.map((t, i) => <img key={i} src={t} alt="" className="w-full aspect-[4/5] object-cover rounded-md border border-border" />)}
              </div>
            ) : (
              <div className="rounded-md border border-border bg-surface p-4 text-[13px] text-text2"><FileText className="size-4 mb-2 text-muted" />Génération de texte — ouvrez le rédacteur pour la relancer.</div>
            )}
            <div>
              <p className="text-[12px] text-muted mb-1">Prompt</p>
              <p className="text-sm leading-relaxed">{open.prompt}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              <div><dt className="text-muted">Type</dt><dd className="mt-0.5">{TYPE_META[open.type].label}</dd></div>
              <div><dt className="text-muted">Statut</dt><dd className="mt-0.5"><Badge tone={statusTone(open.status)} dot>{statusLabel(open.status)}</Badge></dd></div>
              <div><dt className="text-muted">Projet</dt><dd className="mt-0.5 truncate">{projectName(open.projectId)}</dd></div>
              <div><dt className="text-muted">Crédits</dt><dd className="mt-0.5">{open.creditsUsed}</dd></div>
              <div><dt className="text-muted">Date</dt><dd className="mt-0.5">{formatDate(open.createdAt)}</dd></div>
              {Object.entries(open.params).filter(([, v]) => v !== "").map(([k, v]) => (
                <div key={k}><dt className="text-muted capitalize">{k}</dt><dd className="mt-0.5">{String(v)}</dd></div>
              ))}
            </dl>
            <div className="flex flex-col gap-2 pt-2">
              <Link href={`${TYPE_META[open.type].studio}?prompt=${encodeURIComponent(open.prompt)}`}><Button fullWidth leftIcon={<RefreshCw className="size-4" />}>Relancer dans le Studio</Button></Link>
              {openAsset && <Link href={`/assets/${openAsset.id}`}><Button fullWidth variant="secondary" leftIcon={<ExternalLink className="size-4" />}>Ouvrir la ressource</Button></Link>}
              {open.projectId && <Link href={`/projects/${open.projectId}`}><Button fullWidth variant="ghost">Voir le projet</Button></Link>}
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

function Row({ g, projectName, onClick, active }: { g: Generation; projectName: string; onClick: () => void; active: boolean }) {
  const Icon = TYPE_META[g.type].icon;
  return (
    <button type="button" onClick={onClick} className={cn("w-full flex items-center gap-3 md:gap-4 p-3 text-left hover:bg-white/[0.03] transition-colors", active && "bg-white/[0.04]")}>
      <div className="size-14 md:size-16 rounded-md bg-elevated border border-border overflow-hidden shrink-0 flex items-center justify-center">
        {g.thumbnails[0] ? <img src={g.thumbnails[0]} alt="" className="size-full object-cover" loading="lazy" /> : <Icon className="size-5 text-muted" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{g.prompt}</p>
        <div className="flex items-center gap-2 mt-1 text-[12px] text-muted flex-wrap">
          <span className="inline-flex items-center gap-1 text-text2"><Icon className="size-3.5" /> {TYPE_META[g.type].label}</span>
          <span>·</span><span className="truncate max-w-40">{projectName}</span>
          <span>·</span><span>{timeAgo(g.createdAt)}</span>
          <span className="hidden sm:inline">·</span><span className="hidden sm:inline">{g.creditsUsed} crédits</span>
        </div>
      </div>
      <Badge tone={statusTone(g.status)} dot className="shrink-0">{statusLabel(g.status)}</Badge>
    </button>
  );
}
