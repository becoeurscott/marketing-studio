"use client";

import { motion } from "framer-motion";
import { Check, Download, Heart, Loader2, Megaphone, MoreHorizontal, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import type { ImageResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { AspectRatio } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RATIO_CLASS } from "./constants";

export interface ImageResultsProps {
  results: ImageResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDownload: (r: ImageResult) => void;
  onFavorite: (r: ImageResult) => void;
  onEdit: (r: ImageResult) => void;
  onUpscale: (r: ImageResult) => void;
  onRegenerate: () => void;
  onUseInCampaign: (r: ImageResult) => void;
  busyId?: string | null;
  /** Map result id → asset id (for favorite state). */
  assetIdFor: (r: ImageResult) => string | undefined;
  ratio: AspectRatio;
  /** Studio canvas variant: 2×2 thumbnails, smaller actions. */
  dense?: boolean;
  className?: string;
}

/** 4-result gallery with selection highlight and per-result actions (SPEC §12). */
export function ImageResults({ results, selectedId, onSelect, onDownload, onFavorite, onEdit, onUpscale, onRegenerate, onUseInCampaign, busyId, assetIdFor, ratio, dense, className }: ImageResultsProps) {
  const favs = useStore((s) => s.favorites.asset);
  /** Dense mode: id of the result whose "…" menu is open. */
  const [menuId, setMenuId] = useState<string | null>(null);
  useEffect(() => {
    if (!menuId) return;
    const onDoc = (e: Event) => { if (!(e.target as Element | null)?.closest?.("[data-result-menu]")) setMenuId(null); };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [menuId]);
  const menuItem = (label: string, Icon: typeof Download, fn: () => void, disabled?: boolean) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => { setMenuId(null); fn(); }}
      className="flex items-center gap-2 w-full px-3 h-9 text-[13px] text-left text-text2 hover:text-text hover:bg-white/5 disabled:opacity-50"
    >
      <Icon className="size-4 shrink-0" /> <span className="truncate">{label}</span>
    </button>
  );
  return (
    <div className={cn("grid gap-3", dense ? "grid-cols-2" : "grid-cols-2 xl:grid-cols-4", className)} role="listbox" aria-label="Résultats générés">
      {results.map((r, i) => {
        const sel = r.id === selectedId;
        const assetId = assetIdFor(r);
        const fav = !!assetId && favs.includes(assetId);
        const busy = busyId === r.id;
        return (
          <motion.div
            key={r.id}
            role="option"
            aria-selected={sel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={cn("group relative rounded-lg border bg-card transition-shadow", sel ? "border-accent shadow-glow" : "border-border hover:border-white/20")}
          >
            <button onClick={() => onSelect(r.id)} className={cn("block w-full bg-surface overflow-hidden rounded-t-[inherit]", RATIO_CLASS[ratio])} aria-label={`Sélectionner le résultat ${i + 1}`}>
              <img src={r.thumbnail} alt={`Résultat ${i + 1}`} className="size-full object-cover" />
            </button>
            {sel && (
              <span className="absolute top-2 left-2 h-6 px-2 rounded-full bg-accent text-on-accent text-[11px] font-semibold inline-flex items-center gap-1"><Check className="size-3" /> Sélectionné</span>
            )}
            {busy && (
              <div className="absolute inset-0 rounded-[inherit] bg-black/60 flex flex-col items-center justify-center gap-2 text-sm"><Loader2 className="size-5 animate-spin text-highlight" />Agrandissement…</div>
            )}
            {dense ? (
              /* Dense (small cards): 3 main actions + "…" menu for the rest */
              <div className="relative flex items-center justify-between gap-1 px-1.5 py-1 border-t border-border bg-card rounded-b-[inherit]">
                <div className="flex items-center min-w-0">
                  <IconButton size="sm" label="Télécharger" onClick={() => onDownload(r)}><Download /></IconButton>
                  <IconButton size="sm" label="Modifier" onClick={() => onEdit(r)}><Pencil /></IconButton>
                  <IconButton size="sm" label={fav ? "Retirer des favoris" : "Ajouter aux favoris"} active={fav} onClick={() => onFavorite(r)}><Heart className={cn(fav && "fill-current")} /></IconButton>
                </div>
                <span data-result-menu className="inline-flex">
                  <IconButton size="sm" label="Plus d'actions" active={menuId === r.id} onClick={() => setMenuId((v) => (v === r.id ? null : r.id))}><MoreHorizontal /></IconButton>
                </span>
                {menuId === r.id && (
                  <div data-result-menu className="absolute right-1 bottom-full mb-1 w-52 max-w-[calc(100vw-2rem)] rounded-md bg-elevated border border-border-strong shadow-float py-1 z-30">
                    {menuItem("Agrandir · 15 cr.", Sparkles, () => onUpscale(r), busy)}
                    {menuItem("Régénérer", RefreshCw, onRegenerate)}
                    {menuItem("Utiliser dans une campagne", Megaphone, () => onUseInCampaign(r))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-1 px-1.5 py-1 border-t border-border bg-card rounded-b-[inherit]">
                <div className="flex flex-wrap items-center">
                  <Tooltip label="Télécharger"><IconButton size="sm" label="Télécharger" onClick={() => onDownload(r)}><Download /></IconButton></Tooltip>
                  <Tooltip label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}><IconButton size="sm" label="Favori" active={fav} onClick={() => onFavorite(r)}><Heart className={cn(fav && "fill-current")} /></IconButton></Tooltip>
                  <Tooltip label="Modifier"><IconButton size="sm" label="Modifier" onClick={() => onEdit(r)}><Pencil /></IconButton></Tooltip>
                  <Tooltip label="Agrandir · 15 cr."><IconButton size="sm" label="Agrandir" onClick={() => onUpscale(r)} disabled={busy}><Sparkles /></IconButton></Tooltip>
                  <Tooltip label="Régénérer"><IconButton size="sm" label="Régénérer" onClick={onRegenerate}><RefreshCw /></IconButton></Tooltip>
                </div>
                <Tooltip label="Utiliser dans une campagne"><IconButton size="sm" label="Utiliser dans une campagne" onClick={() => onUseInCampaign(r)}><Megaphone /></IconButton></Tooltip>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
