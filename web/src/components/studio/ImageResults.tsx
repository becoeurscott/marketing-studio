"use client";

import { motion } from "framer-motion";
import { Check, Download, Heart, Loader2, Megaphone, Pencil, RefreshCw, Sparkles } from "lucide-react";
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
  return (
    <div className={cn("grid gap-3", dense ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4", className)} role="listbox" aria-label="Résultats générés">
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
            className={cn("group relative rounded-lg overflow-hidden border bg-card transition-shadow", sel ? "border-accent shadow-glow" : "border-border hover:border-white/20")}
          >
            <button onClick={() => onSelect(r.id)} className={cn("block w-full bg-surface", RATIO_CLASS[ratio])} aria-label={`Sélectionner le résultat ${i + 1}`}>
              <img src={r.thumbnail} alt={`Résultat ${i + 1}`} className="size-full object-cover" />
            </button>
            {sel && (
              <span className="absolute top-2 left-2 h-6 px-2 rounded-full bg-accent text-white text-[11px] font-semibold inline-flex items-center gap-1"><Check className="size-3" /> Sélectionné</span>
            )}
            {busy && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-sm"><Loader2 className="size-5 animate-spin text-highlight" />Agrandissement…</div>
            )}
            <div className={cn("flex items-center justify-between gap-1 px-1.5 py-1 border-t border-border bg-card", dense && "flex-wrap")}>
              <div className="flex items-center">
                <Tooltip label="Télécharger"><IconButton size="sm" label="Télécharger" onClick={() => onDownload(r)}><Download /></IconButton></Tooltip>
                <Tooltip label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}><IconButton size="sm" label="Favori" active={fav} onClick={() => onFavorite(r)}><Heart className={cn(fav && "fill-current")} /></IconButton></Tooltip>
                <Tooltip label="Modifier"><IconButton size="sm" label="Modifier" onClick={() => onEdit(r)}><Pencil /></IconButton></Tooltip>
                <Tooltip label="Agrandir · 15 cr."><IconButton size="sm" label="Agrandir" onClick={() => onUpscale(r)} disabled={busy}><Sparkles /></IconButton></Tooltip>
                <Tooltip label="Régénérer"><IconButton size="sm" label="Régénérer" onClick={onRegenerate}><RefreshCw /></IconButton></Tooltip>
              </div>
              <Tooltip label="Utiliser dans une campagne"><IconButton size="sm" label="Utiliser dans une campagne" onClick={() => onUseInCampaign(r)}><Megaphone /></IconButton></Tooltip>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
