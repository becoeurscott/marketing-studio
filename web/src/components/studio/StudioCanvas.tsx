"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Maximize2, Minimize2, Scan, Sparkles, Upload, X, ZoomIn, ZoomOut } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ProgressBar } from "@/components/ui/ProgressIndicator";
import type { Asset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDropzone, useProductUpload } from "./ProductPicker";

export interface StudioCanvasProps {
  /** Main media to display (selected result or product). */
  media: { url: string; alt?: string; kind: "image" } | null;
  onUploaded: (asset: Asset) => void;
  onPickFromAssets: () => void;
  onStartFromPrompt: () => void;
  /** Rendered below the media (e.g. result strip). */
  footer?: ReactNode;
  /** Replaces media area entirely (generating overlay, error, video player). */
  overlay?: ReactNode;
  className?: string;
}

/**
 * Full-bleed canvas: drop zone when empty; image with Zoom / Fit / Fullscreen when filled (SPEC §9).
 * The parent owns the height; the media area fills it and the footer (results) scrolls beneath.
 */
export function StudioCanvas({ media, onUploaded, onPickFromAssets, onStartFromPrompt, footer, overlay, className }: StudioCanvasProps) {
  const { progress, uploading, upload } = useProductUpload(onUploaded);
  const dz = useDropzone(upload);
  const [zoom, setZoom] = useState(1);
  const [full, setFull] = useState(false);

  const content = overlay ? (
    <div className="flex-1 min-h-0 flex flex-col p-3 pt-14 md:p-4 [&>*]:flex-1">{overlay}</div>
  ) : media ? (
    <div className="relative flex-1 min-h-[58dvh] md:min-h-[60dvh] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,rgba(168,85,247,0.10),transparent_60%)]">
      <motion.img
        key={media.url}
        src={media.url}
        alt={media.alt ?? "Canevas"}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: zoom }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="max-h-full max-w-full object-contain select-none md:rounded-lg md:shadow-float"
        draggable={false}
      />
      <div className="absolute top-[4.25rem] right-3 md:top-auto md:right-auto md:bottom-3 md:left-1/2 md:-translate-x-1/2 flex items-center gap-0.5 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-float">
        <IconButton size="sm" label="Zoom arrière" className="rounded-full" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}><ZoomOut /></IconButton>
        <span className="hidden md:inline text-[11px] tabular-nums text-text2 w-10 text-center">{Math.round(zoom * 100)}%</span>
        <IconButton size="sm" label="Zoom avant" className="rounded-full" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}><ZoomIn /></IconButton>
        <span className="w-px h-4 bg-white/15 mx-0.5" />
        <IconButton size="sm" label="Ajuster" className="rounded-full" onClick={() => setZoom(1)}><Scan /></IconButton>
        <IconButton size="sm" label="Plein écran" className="rounded-full" onClick={() => setFull(true)}><Maximize2 /></IconButton>
      </div>
    </div>
  ) : (
    <div
      {...dz.handlers}
      className={cn("flex-1 min-h-0 flex flex-col items-center justify-center text-center p-6 pt-20 md:pt-6 transition-colors", dz.dragging ? "bg-accent/10" : "bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.09),transparent_55%)]")}
    >
      {dz.input}
      <motion.div animate={dz.dragging ? { scale: 1.08 } : { scale: 1 }} className="size-16 rounded-2xl bg-elevated border border-border flex items-center justify-center mb-5 shadow-card">
        <Upload className="size-7 text-highlight" />
      </motion.div>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Commencez à créer</h2>
      <p className="text-sm text-text2 mt-2 max-w-sm">{dz.dragging ? "Relâchez pour importer" : "Déposez une image produit ici, ou décrivez la scène ci-dessous et laissez le studio la créer."}</p>
      {uploading && <ProgressBar value={progress ?? 0} label="Import en cours" className="mt-5 max-w-xs w-full" />}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-2">
        <Button size="lg" leftIcon={<ImagePlus className="size-4" />} onClick={dz.open} loading={uploading}>Importer un produit</Button>
        <Button size="lg" variant="secondary" leftIcon={<Sparkles className="size-4" />} onClick={onStartFromPrompt}>Partir d’un prompt</Button>
      </div>
      <button onClick={onPickFromAssets} className="mt-4 text-[13px] text-text2 hover:text-text underline-offset-4 hover:underline">ou choisissez dans vos ressources</button>
    </div>
  );

  return (
    <div className={cn("flex flex-col", className)}>
      {content}
      {footer && <div className="shrink-0 px-3 md:px-4 pb-3">{footer}</div>}
      <AnimatePresence>
        {full && media && (
          <motion.div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFull(false)}>
            <img src={media.url} alt={media.alt ?? "Plein écran"} className="max-h-full max-w-full object-contain" />
            <span className="absolute top-4 right-4"><IconButton label="Quitter le plein écran" variant="solid" onClick={() => setFull(false)}><X /></IconButton></span>
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted inline-flex items-center gap-1"><Minimize2 className="size-3" /> Cliquez n’importe où pour quitter</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
