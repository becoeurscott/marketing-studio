"use client";

import { Copy, Heart, Images, LayoutTemplate, MessageSquareQuote, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { AssetCard } from "@/components/assets/AssetCard";
import { PageHeader, Section } from "@/components/shell/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { useToast } from "@/components/ui/Toast";
import { creators as allCreators, hooks, templates as allTemplates } from "@/data";
import { useStore } from "@/lib/store";
import type { Asset } from "@/lib/types";

export default function FavoritesPage() {
  const favorites = useStore((s) => s.favorites);
  const assets = useStore((s) => s.assets);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const toast = useToast();

  const favAssets = useMemo(() => favorites.asset.map((id) => assets.find((a) => a.id === id)).filter((a): a is Asset => Boolean(a)), [favorites.asset, assets]);
  const favTemplates = useMemo(() => favorites.template.map((id) => allTemplates.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => Boolean(t)), [favorites.template]);
  const favCreators = useMemo(() => favorites.creator.map((id) => allCreators.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c)), [favorites.creator]);
  // Prompt favorites are stored as the prompt text itself (or a hook index "hook_N").
  const favPrompts = useMemo(() => favorites.prompt.map((p) => (p.startsWith("hook_") ? { id: p, text: hooks[Number(p.slice(5))] ?? p } : { id: p, text: p })), [favorites.prompt]);

  const total = favAssets.length + favTemplates.length + favCreators.length + favPrompts.length;

  return (
    <>
      <PageHeader title="Favoris" description="Les ressources, modèles, prompts et créateurs que vous avez mis en favoris." />

      {total === 0 ? (
        <EmptyState icon={Heart} title="Aucun favori pour l'instant" description="Touchez le cœur d'une ressource, d'un modèle, d'une accroche ou d'un créateur pour le retrouver ici." cta={{ label: "Parcourir les ressources", href: "/assets" }} />
      ) : (
        <>
          <Section title="Ressources" description={`${favAssets.length} enregistré${favAssets.length > 1 ? "s" : ""}`}>
            {favAssets.length === 0 ? (
              <EmptyState compact icon={Images} title="Aucune ressource favorite" cta={{ label: "Parcourir les ressources", href: "/assets" }} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {favAssets.map((a) => <AssetCard key={a.id} asset={a} favorite onToggleFavorite={(x) => toggleFavorite("asset", x.id)} href={`/assets/${a.id}`} />)}
              </div>
            )}
          </Section>

          <Section title="Modèles" description={`${favTemplates.length} enregistré${favTemplates.length > 1 ? "s" : ""}`}>
            {favTemplates.length === 0 ? (
              <EmptyState compact icon={LayoutTemplate} title="Aucun modèle favori" cta={{ label: "Parcourir les modèles", href: "/templates" }} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {favTemplates.map((t) => (
                  <div key={t.id} className="relative group">
                    <Link href={`/templates/${t.id}`} className="block rounded-lg border border-border bg-card overflow-hidden hover:border-white/15 transition-colors">
                      <div className="aspect-[4/3] bg-elevated overflow-hidden"><img src={t.thumbnail} alt="" className="size-full object-cover" loading="lazy" /></div>
                      <div className="p-3">
                        <p className="text-sm font-semibold truncate">{t.title}</p>
                        <p className="text-[12px] text-muted mt-0.5 capitalize">{t.platform} · {t.format}</p>
                      </div>
                    </Link>
                    <IconButton label="Retirer des favoris" size="sm" className="absolute top-2 right-2 bg-black/50 text-danger backdrop-blur hover:bg-black/70" onClick={() => toggleFavorite("template", t.id)}><Heart className="fill-current" /></IconButton>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Prompts" description={`${favPrompts.length} enregistré${favPrompts.length > 1 ? "s" : ""}`}>
            {favPrompts.length === 0 ? (
              <EmptyState compact icon={MessageSquareQuote} title="Aucun prompt favori" description="Enregistrez des accroches ou des prompts depuis le rédacteur." cta={{ label: "Ouvrir le rédacteur", href: "/studio/copy" }} />
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {favPrompts.map((p) => (
                  <Card key={p.id} className="flex items-start gap-3">
                    <MessageSquareQuote className="size-4 text-highlight shrink-0 mt-0.5" />
                    <p className="text-sm flex-1">{p.text}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <IconButton label="Copier" size="sm" onClick={() => { navigator.clipboard?.writeText(p.text); toast.success("Copié"); }}><Copy /></IconButton>
                      <IconButton label="Retirer des favoris" size="sm" className="text-danger" onClick={() => toggleFavorite("prompt", p.id)}><Heart className="fill-current" /></IconButton>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Section>

          <Section title="Créateurs" description={`${favCreators.length} enregistré${favCreators.length > 1 ? "s" : ""}`}>
            {favCreators.length === 0 ? (
              <EmptyState compact icon={Users} title="Aucun créateur favori" cta={{ label: "Parcourir les créateurs", href: "/creators" }} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {favCreators.map((c) => (
                  <Card key={c.id} className="relative">
                    <div className="flex items-center gap-3 pr-8">
                      <Avatar src={c.avatarUrl} name={c.name} size={48} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{c.name}</p>
                        <p className="text-[12px] text-muted">{c.age} · {c.style}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">{c.languages.map((l) => <Badge key={l} tone="outline">{l}</Badge>)}</div>
                    <IconButton label="Retirer des favoris" size="sm" className="absolute top-2 right-2 text-danger" onClick={() => toggleFavorite("creator", c.id)}><Heart className="fill-current" /></IconButton>
                  </Card>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </>
  );
}
