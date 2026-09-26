"use client";

import { Check, Download, Heart, Megaphone, Save } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";

/** Image result tile with select/favorite/download/save/use-in-campaign. */
export function ResultImageCard({
  src, alt, selected, favorite, saved, ratioClass = "aspect-[4/5]", onSelect, onFavorite, onDownload, onSave, onUse, badge,
}: {
  src: string; alt: string; selected?: boolean; favorite?: boolean; saved?: boolean; ratioClass?: string;
  onSelect?: () => void; onFavorite?: () => void; onDownload?: () => void; onSave?: () => void; onUse?: () => void; badge?: string;
}) {
  return (
    <div className={cn("relative group rounded-lg overflow-hidden border bg-card transition-all", selected ? "border-accent ring-2 ring-accent/40" : "border-border hover:border-white/20")}>
      <button type="button" onClick={onSelect} className={cn("block w-full", ratioClass)} aria-pressed={selected} aria-label={`Sélectionner ${alt}`}>
        <img src={src} alt={alt} className="size-full object-cover" />
      </button>
      {badge && <span className="absolute top-2 left-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-text">{badge}</span>}
      {selected && <span className="absolute top-2 right-2 size-6 rounded-full bg-accent text-white flex items-center justify-center"><Check className="size-3.5" /></span>}
      <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-end gap-1 bg-gradient-to-t from-black/70 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        {onFavorite && <IconButton label="Favori" size="sm" variant="solid" active={favorite} onClick={onFavorite}><Heart className={cn("size-4", favorite && "fill-danger text-danger")} /></IconButton>}
        {onDownload && <IconButton label="Télécharger" size="sm" variant="solid" onClick={onDownload}><Download className="size-4" /></IconButton>}
        {onSave && <IconButton label={saved ? "Enregistré" : "Enregistrer dans le projet"} size="sm" variant="solid" active={saved} onClick={onSave}>{saved ? <Check className="size-4 text-success" /> : <Save className="size-4" />}</IconButton>}
        {onUse && <IconButton label="Utiliser dans une campagne" size="sm" variant="solid" onClick={onUse}><Megaphone className="size-4" /></IconButton>}
      </div>
    </div>
  );
}
