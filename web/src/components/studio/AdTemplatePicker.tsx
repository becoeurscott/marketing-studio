"use client";

import { Check, LayoutTemplate } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import type { HfPreset } from "@/lib/higgsfield/types";

/**
 * Higgsfield Marketing Studio ad templates (75 layouts available through the API).
 * The selected template is applied to the merchant's product photo.
 */
export function AdTemplatePicker({ value, onChange, disabled }: { value: string | null; onChange: (preset: HfPreset | null) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<HfPreset[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open || items) return;
    let alive = true;
    fetch("/api/hf/presets")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { items: HfPreset[] }) => { if (alive) setItems(d.items.filter((p) => p.preview)); })
      .catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [open, items]);

  const selected = items?.find((p) => p.id === value) ?? null;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-md border border-border-strong bg-surface p-2 text-left hover:border-white/25 disabled:opacity-50"
      >
        {selected?.preview ? (
          <img src={selected.preview} alt="" className="size-11 shrink-0 rounded object-cover" />
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded bg-elevated text-text2"><LayoutTemplate className="size-5" /></span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{selected?.name ?? (value ? "Modèle choisi" : "Mise en page libre")}</span>
          <span className="block text-[12px] text-muted">{disabled ? "Ajoutez d'abord une photo produit" : "75 modèles de pub · toucher pour choisir"}</span>
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Modèles de pub" description="Choisissez une mise en page : votre photo produit est placée dedans." size="lg">
        {error ? (
          <p className="py-8 text-center text-sm text-text2">Impossible de charger les modèles. Réessayez plus tard.</p>
        ) : !items ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-md bg-elevated" />)}</div>
        ) : (
          <div className="grid max-h-[65vh] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
            <button type="button" onClick={() => { onChange(null); setOpen(false); }} className={cn("relative grid aspect-[3/4] place-items-center rounded-md border text-center text-[12px] text-text2", value === null ? "border-accent" : "border-border-strong hover:border-white/25")}>
              Mise en page libre
            </button>
            {items.map((p) => (
              <button key={p.id} type="button" onClick={() => { onChange(p); setOpen(false); }} className={cn("group relative aspect-[3/4] overflow-hidden rounded-md border", p.id === value ? "border-accent ring-2 ring-accent/40" : "border-border-strong hover:border-white/25")}>
                <img src={p.preview!} alt={p.name} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-1.5 pt-6 text-left text-[11px] font-medium text-white line-clamp-2">{p.name}</span>
                {p.id === value && <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-accent text-on-accent"><Check className="size-3" /></span>}
              </button>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
