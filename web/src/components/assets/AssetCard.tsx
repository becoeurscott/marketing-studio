"use client";

import { Check, Download, Eye, FolderInput, Heart, MoreHorizontal, Music, Pencil, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import type { Asset } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface AssetCardProps {
  asset: Asset;
  favorite: boolean;
  onToggleFavorite: (asset: Asset) => void;
  /** Multi-select mode */
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (asset: Asset) => void;
  /** Context-menu actions (omit to hide the menu) */
  onPreview?: (asset: Asset) => void;
  onDownload?: (asset: Asset) => void;
  onRename?: (asset: Asset) => void;
  onMove?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  href?: string;
  className?: string;
}

export function assetTypeLabel(type: Asset["type"]): string {
  return { image: "Image", video: "Vidéo", audio: "Audio", logo: "Logo", brand: "Marque", export: "Export" }[type];
}

export function AssetCard({ asset, favorite, onToggleFavorite, selectable, selected, onSelect, onPreview, onDownload, onRename, onMove, onDelete, href, className }: AssetCardProps) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasMenu = Boolean(onPreview || onDownload || onRename || onMove || onDelete);

  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menu]);

  const item = (label: string, Icon: typeof Eye, fn?: (a: Asset) => void, danger?: boolean) =>
    fn && (
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenu(false); fn(asset); }}
        className={cn("flex items-center gap-2 w-full px-3 h-9 text-[13px] text-left hover:bg-white/5", danger ? "text-danger" : "text-text2 hover:text-text")}
      >
        <Icon className="size-4" /> {label}
      </button>
    );

  const media = (
    <div className={cn("relative aspect-[4/5] bg-elevated overflow-hidden rounded-lg border transition-colors", selected ? "border-accent ring-2 ring-accent/40" : "border-border group-hover:border-white/15")}>
      <img src={asset.thumbnail} alt={asset.name} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
      {asset.type === "video" && (
        <span className="absolute inset-0 flex items-center justify-center"><span className="size-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"><Play className="size-4 text-white fill-white" /></span></span>
      )}
      {asset.type === "audio" && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/30"><Music className="size-8 text-white/80" /></span>
      )}
      <span className="absolute bottom-2 left-2 text-[10px] font-medium uppercase tracking-wide text-white/90 bg-black/50 backdrop-blur px-1.5 py-0.5 rounded">
        {assetTypeLabel(asset.type)}{asset.durationSec ? ` · ${asset.durationSec} s` : ""}
      </span>
      {selectable && (
        <span className={cn("absolute top-2 left-2 size-5 rounded-md border flex items-center justify-center transition-colors", selected ? "bg-accent border-accent" : "bg-black/40 border-white/40")}>
          {selected && <Check className="size-3 text-on-accent" />}
        </span>
      )}
    </div>
  );

  return (
    <div ref={ref} className={cn("relative group", className)}>
      {selectable ? (
        <button type="button" className="block w-full text-left" onClick={() => onSelect?.(asset)} aria-pressed={selected}>{media}</button>
      ) : href ? (
        <Link href={href} className="block">{media}</Link>
      ) : (
        <button type="button" className="block w-full text-left" onClick={() => onPreview?.(asset)}>{media}</button>
      )}
      <div className="mt-2 flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <p className="text-[13px] font-medium truncate">{asset.name}</p>
          <p className="text-[11px] text-muted truncate">{asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}{(Math.round(asset.sizeKb / 100) / 10).toLocaleString("fr-FR")} Mo</p>
        </div>
      </div>

      {/* Hover actions */}
      <div className={cn("absolute top-2 right-2 flex items-center gap-1 transition-opacity", favorite || menu ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100")}>
        <IconButton
          label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          size="sm"
          className={cn("bg-black/50 backdrop-blur hover:bg-black/70", favorite ? "text-danger" : "text-white")}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(asset); }}
        >
          <Heart className={cn(favorite && "fill-current")} />
        </IconButton>
        {hasMenu && (
          <IconButton label="Actions sur la ressource" size="sm" className="bg-black/50 text-white backdrop-blur hover:bg-black/70" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenu((v) => !v); }}>
            <MoreHorizontal />
          </IconButton>
        )}
      </div>
      {menu && (
        <div className="absolute left-2 right-2 w-auto sm:left-auto sm:w-52 top-11 rounded-md bg-elevated border border-border-strong shadow-float py-1 z-20">
          {item("Aperçu", Eye, onPreview)}
          {item("Télécharger", Download, onDownload)}
          {item("Renommer", Pencil, onRename)}
          {item("Déplacer vers un projet", FolderInput, onMove)}
          {item(favorite ? "Retirer des favoris" : "Ajouter aux favoris", Heart, onToggleFavorite)}
          {item("Supprimer", Trash2, onDelete, true)}
        </div>
      )}
    </div>
  );
}
