import Link from "next/link";
import { ArrowRight, Check, Clapperboard } from "lucide-react";
import { MULTI_SHOT_PRESETS, UGC_TYPES } from "@/lib/creative-presets";
import { Reveal, SectionTitle } from "./motion";

const FEATURED_UGC = UGC_TYPES.slice(0, 6);

export function VideoPresetsShowcase() {
  return (
    <section id="presets" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Presets vidéo Higgsfield"
          title="Choisissez un format, ajoutez votre produit"
          text="Des formats prêts pour TikTok, WhatsApp et Facebook. Le scénario, le rythme et le style sont déjà pensés."
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_UGC.map((preset, i) => (
            <Reveal key={preset.id} delay={(i % 3) * 0.06}>
              <Link href="/studio/video" className="group block h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all hover:-translate-y-1 hover:border-accent/40 hover:bg-white/[0.05]">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-highlight"><Clapperboard className="size-5" /></span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-text2">{preset.durationSec} s</span>
                </div>
                <h3 className="mt-5 font-medium">{preset.label}</h3>
                <p className="mt-1 text-sm text-text2">{preset.hint}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-xs text-highlight">Utiliser ce preset <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-medium"><Check className="size-4 text-highlight" /> Formats multi-plans pour les publicités</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {MULTI_SHOT_PRESETS.map((preset) => <Link key={preset.id} href="/studio/video" className="rounded-full border border-white/10 px-3 py-2 text-xs text-text2 transition-colors hover:border-accent/40 hover:text-text">{preset.label}</Link>)}
          </div>
        </div>
      </div>
    </section>
  );
}
