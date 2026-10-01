"use client";

import { Check, ImagePlus, Upload } from "lucide-react";
import { useCallback, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressIndicator";
import { useToast } from "@/components/ui/Toast";
import { uploadProduct, uploadSummary } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { Asset } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Real drag-and-drop + file input → api.uploadProduct with progress. Returns the created Asset. */
export function useProductUpload(onUploaded: (asset: Asset) => void) {
  const [progress, setProgress] = useState<number | null>(null);
  const currentProjectId = useStore((s) => s.currentProjectId);
  const toast = useToast();

  const upload = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Fichier non pris en charge", "Déposez une photo produit PNG, JPG ou WebP.");
        return;
      }
      setProgress(0);
      try {
        const asset = await uploadProduct(file, { projectId: currentProjectId }, setProgress);
        toast.success("Produit importé", uploadSummary(asset));
        onUploaded(asset);
      } catch (err) {
        toast.error("Une erreur est survenue.", err instanceof Error ? err.message : undefined);
      } finally {
        setProgress(null);
      }
    },
    [currentProjectId, onUploaded, toast],
  );

  return { progress, uploading: progress !== null, upload };
}

export function useDropzone(onFile: (file: File | null) => void) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const onDragOver = (e: DragEvent) => { e.preventDefault(); if (!dragging) setDragging(true); };
  const onDragLeave = (e: DragEvent) => { e.preventDefault(); setDragging(false); };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files?.[0] ?? null); };
  const open = () => inputRef.current?.click();
  const input = (
    <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0] ?? null); e.target.value = ""; }} aria-label="Importer une image produit" />
  );
  return { dragging, handlers: { onDragOver, onDragLeave, onDrop }, open, input };
}

/** Modal: upload a new product photo or pick one from existing image assets. */
export function ProductPicker({ open, onClose, onPick, selectedId }: { open: boolean; onClose: () => void; onPick: (asset: Asset) => void; selectedId?: string | null }) {
  const assets = useStore((s) => s.assets);
  const images = assets.filter((a) => a.type === "image").slice(0, 24);
  const pick = useCallback((a: Asset) => { onPick(a); onClose(); }, [onPick, onClose]);
  const { progress, uploading, upload } = useProductUpload(pick);
  const dz = useDropzone(upload);

  return (
    <Modal open={open} onClose={onClose} title="Choisir un produit" description="Importez une photo ou choisissez-en une dans vos ressources." size="lg">
      <div
        {...dz.handlers}
        className={cn("rounded-lg border border-dashed p-5 flex flex-col sm:flex-row items-center gap-4 transition-colors mb-5", dz.dragging ? "border-accent bg-accent/10" : "border-border-strong bg-surface/60")}
      >
        {dz.input}
        <div className="size-11 rounded-lg bg-elevated border border-border flex items-center justify-center shrink-0"><Upload className="size-5 text-highlight" /></div>
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <p className="text-sm font-medium">Déposez l’image produit ici</p>
          <p className="text-xs text-muted">PNG, JPG ou WebP · jusqu’à 20 Mo</p>
          {uploading && <ProgressBar value={progress ?? 0} label="Import en cours" className="mt-2" />}
        </div>
        <Button variant="secondary" size="sm" onClick={dz.open} loading={uploading} leftIcon={<ImagePlus className="size-4" />}>Parcourir</Button>
      </div>

      <p className="text-[13px] font-medium text-text2 mb-2">Depuis vos ressources</p>
      {images.length ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {images.map((a) => {
            const sel = a.id === selectedId;
            return (
              <button key={a.id} onClick={() => pick(a)} className={cn("group relative aspect-square rounded-md overflow-hidden border transition-colors", sel ? "border-accent shadow-glow" : "border-border hover:border-white/25")} title={a.name}>
                <img src={a.thumbnail} alt={a.name} className="size-full object-cover" loading="lazy" />
                {sel && <span className="absolute top-1.5 right-1.5 size-5 rounded-full bg-accent flex items-center justify-center"><Check className="size-3 text-on-accent" /></span>}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted">Aucune image pour l’instant. Importez-en une ci-dessus.</p>
      )}
    </Modal>
  );
}

/** Compact product thumbnail + change/clear controls used inside Create panels. */
export function ProductField({ asset, onChange, onClear, label = "Produit" }: { asset: Asset | null; onChange: () => void; onClear?: () => void; label?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-text2">{label}</span>
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border-strong bg-surface p-2">
        <button onClick={onChange} className="size-12 rounded-sm overflow-hidden bg-elevated border border-border flex items-center justify-center shrink-0" aria-label="Changer le produit">
          {asset ? <img src={asset.thumbnail} alt="" className="size-full object-cover" /> : <ImagePlus className="size-5 text-muted" />}
        </button>
        <div className="min-w-[8rem] flex-1">
          <p className="text-sm truncate">{asset ? asset.name : "Aucun produit sélectionné"}</p>
          <p className="text-xs text-muted">{asset ? `${asset.width ?? "—"}×${asset.height ?? "—"}` : "Facultatif — génération à partir du prompt seul"}</p>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {asset && onClear && <Button size="sm" variant="ghost" onClick={onClear}>Retirer</Button>}
          <Button size="sm" variant="secondary" onClick={onChange}>{asset ? "Changer" : "Ajouter"}</Button>
        </div>
      </div>
    </div>
  );
}
