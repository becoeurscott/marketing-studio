"use client";

import { Check, Play, Sparkles } from "lucide-react";
import { useState } from "react";
import { higgsfieldExamples, type HiggsfieldVideoPreset } from "@/data/higgsfield-examples";
import { cn } from "@/lib/utils";

export interface HiggsfieldVideoPresetPickerProps {
  selectedId?: string | null;
  onSelect?: (preset: HiggsfieldVideoPreset) => void;
}

/** Selectable public Higgsfield examples used as Seedance video references. */
export function HiggsfieldVideoPresetPicker({ selectedId, onSelect }: HiggsfieldVideoPresetPickerProps) {
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [category, setCategory] = useState("Tous");
  const selecting = !!onSelect;
  return (
    <section className={cn("text-left", selecting ? "mb-5" : "my-6")} aria-label={selecting ? "Choisir un preset vidéo Higgsfield" : "Exemples vidéo Higgsfield"}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">{selecting ? "Choisissez un preset vidéo" : "Inspiration vidéo · Higgsfield"}</h2>
          <p className="mt-1 text-sm text-white/55">{selecting ? "Sélectionnez une vidéo de référence, puis ajoutez votre avatar et votre produit dans le composeur." : "Exemples UGC et motion de Marketing Studio."}</p>
        </div>
        {selecting && <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"><Sparkles className="size-3.5" /> Seedance 2.5</span>}
      </div>
      <div className="my-3 flex gap-2" role="group" aria-label="Catégorie">
        {["Tous", "UGC", "Motion"].map((c) => <button type="button" key={c} aria-pressed={category === c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1.5 text-sm ${category === c ? "bg-accent text-black" : "bg-white/10 text-white"}`}>{c}</button>)}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {higgsfieldExamples.filter((v) => category === "Tous" || category === v.category).map((v) => {
          const selected = v.id === selectedId;
          return (
            <article key={v.id} className={cn("w-44 shrink-0 overflow-hidden rounded-xl border bg-white/[0.03] lg:w-auto", selected ? "border-accent shadow-[0_0_0_1px_rgba(209,254,23,0.35)]" : "border-white/10")}>
              <button
                type="button"
                onClick={() => onSelect?.(v)}
                disabled={!selecting}
                aria-pressed={selecting ? selected : undefined}
                className={cn("group block w-full text-left", selecting && "cursor-pointer hover:bg-white/[0.05]")}
              >
                <div className="relative aspect-[9/16] bg-white/[0.04]">
                  {unavailable.includes(v.url) ? <div className="flex size-full items-center p-4 text-sm text-white/60">Aperçu indisponible.</div> : <video onError={() => setUnavailable((all) => all.includes(v.url) ? all : [...all, v.url])} src={v.url} poster={v.poster} autoPlay muted loop playsInline preload="metadata" className="size-full object-cover" aria-label={v.name} />}
                  {selecting && <span className={cn("absolute right-2 top-2 flex size-7 items-center justify-center rounded-full border backdrop-blur", selected ? "border-accent bg-accent text-black" : "border-white/25 bg-black/45 text-white group-hover:border-white/60")}>
                    {selected ? <Check className="size-4" /> : <Play className="size-3.5 fill-current" />}
                  </span>}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-white">{v.name}</p>
                  <p className="mt-1 text-xs text-white/50">{v.category}{selected ? " · sélectionné" : ""}</p>
                </div>
              </button>
              {!selecting && <a href={v.source} target="_blank" rel="noopener noreferrer" className="mx-3 mb-3 inline-block text-xs text-accent underline">Voir sur Higgsfield ↗</a>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** Backwards-compatible browse-only version used by the legacy public URL. */
export function HiggsfieldExamples() {
  return <HiggsfieldVideoPresetPicker />;
}
