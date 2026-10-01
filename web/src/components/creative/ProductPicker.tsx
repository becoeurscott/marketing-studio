"use client";

import { Check, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { useMemo, useRef, useState, type DragEvent } from "react";
import { useToast } from "@/components/ui/Toast";
import { uploadProduct, uploadSummary } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { Asset } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Pick a product image from the asset library, or upload one (mock).
 * Compact grid meant for the inspector; `limit` caps the visible assets.
 */
export function ProductPicker({ value, onChange, onClear, limit = 8, allowUpload = true }: { value: string | null; onChange: (asset: Asset) => void; onClear?: () => void; limit?: number; allowUpload?: boolean }) {
  const assets = useStore((s) => s.assets);
  const currentProjectId = useStore((s) => s.currentProjectId);
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);

  const images = useMemo(() => {
    const list = assets.filter((a) => a.type === "image");
    // Current project first, then the rest.
    return [...list.filter((a) => a.projectId === currentProjectId), ...list.filter((a) => a.projectId !== currentProjectId)].slice(0, limit);
  }, [assets, currentProjectId, limit]);

  async function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setUploading(0);
    try {
      const asset = await uploadProduct(f, {}, setUploading);
      onChange(asset);
      toast.success("Produit importé", uploadSummary(asset));
    } catch (err) {
      toast.error("Échec de l'import", err instanceof Error ? err.message : "Veuillez réessayer.");
    } finally {
      setUploading(null);
    }
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDrag(false);
    void handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {allowUpload && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={cn("aspect-square rounded-md border border-dashed flex flex-col items-center justify-center gap-1 text-muted hover:text-text hover:border-white/30 transition-colors", drag ? "border-accent text-highlight bg-accent/10" : "border-border-strong")}
            aria-label="Importer une photo produit"
          >
            {uploading !== null ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            <span className="text-[10px]">{uploading !== null ? `${uploading}%` : "Importer"}</span>
          </button>
        )}
        {images.map((a) => {
          const selected = a.id === value;
          return (
            <button key={a.id} type="button" onClick={() => (selected && onClear ? onClear() : onChange(a))} title={selected && onClear ? `Retirer ${a.name}` : a.name} aria-pressed={selected} className={cn("relative aspect-square rounded-md overflow-hidden border transition-all", selected ? "border-accent ring-2 ring-accent/40" : "border-border hover:border-white/25")}>
              <img src={a.thumbnail} alt={a.name} className="size-full object-cover" />
              {selected && <span className="absolute top-1 right-1 size-4 rounded-full bg-accent text-on-accent flex items-center justify-center"><Check className="size-3" /></span>}
            </button>
          );
        })}
        {!images.length && !allowUpload && (
          <div className="col-span-4 text-xs text-muted flex items-center gap-2"><ImagePlus className="size-4" /> Aucune image produit pour l’instant.</div>
        )}
      </div>
      {value && onClear && (
        <button type="button" onClick={onClear} className="inline-flex items-center gap-1 text-xs text-muted hover:text-text transition-colors">
          <X className="size-3.5" /> Retirer le produit
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleFiles(e.target.files)} />
    </div>
  );
}
