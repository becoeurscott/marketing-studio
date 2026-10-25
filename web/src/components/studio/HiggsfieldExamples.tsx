"use client";

import { useState } from "react";
import { higgsfieldExamples } from "@/data/higgsfield-examples";

/** Official examples for browsing inspiration, separate from generation controls. */
export function HiggsfieldExamples() {
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [category, setCategory] = useState("Tous");
  return (
    <section className="my-6 text-left" aria-label="Exemples vidéo Higgsfield">
      <h2 className="text-lg font-semibold text-white">Inspiration vidéo · Higgsfield</h2>
      <p className="mt-1 text-sm text-white/55">Exemples UGC et motion de Marketing Studio.</p>
      <div className="my-3 flex gap-2" role="group" aria-label="Catégorie">
        {["Tous", "UGC", "Motion"].map((c) => <button type="button" key={c} aria-pressed={category === c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1.5 text-sm ${category === c ? "bg-accent text-black" : "bg-white/10 text-white"}`}>{c}</button>)}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {higgsfieldExamples.filter((v) => category === "Tous" || category === v.category).map((v) => <article key={v.source} className="w-44 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          {unavailable.includes(v.url) ? <div className="aspect-[9/16] p-4 flex items-center text-sm text-white/60">Aperçu indisponible. Consultez cet exemple sur Higgsfield.</div> : <video onError={() => setUnavailable((all) => all.includes(v.url) ? all : [...all, v.url])} src={v.url} poster={v.poster} controls playsInline preload="none" className="aspect-[9/16] w-full object-cover" aria-label={v.name}>
            <a href={v.source}>Voir {v.name} sur Higgsfield</a>
          </video>}
          <div className="p-3"><p className="text-sm font-medium text-white">{v.name}</p><p className="mt-1 text-xs text-white/50">{v.category}</p><a href={v.source} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-accent underline">Voir sur Higgsfield ↗</a></div>
        </article>)}
      </div>
    </section>
  );
}
