"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DEMO_HREF } from "./Hero";
import { CtaButton, Reveal, SectionTitle } from "./motion";

export interface UgcVideo {
  slug: string;
  style: string;
  sector: string;
}

/** Generated with Sokozia (Higgsfield Marketing Studio image → Seedance 2.5), stored in /public/showcase/ugc. */
export const UGC_VIDEOS: UgcVideo[] = [
  { slug: "temoignage-karite", style: "Témoignage selfie", sector: "Cosmétiques" },
  { slug: "vendeuse-marche-wax", style: "Vendeuse au marché", sector: "Couture & wax" },
  { slug: "unboxing-telephone", style: "Déballage", sector: "Téléphones" },
  { slug: "micro-trottoir-garba", style: "Micro-trottoir", sector: "Restauration" },
  { slug: "grwm-perruque", style: "Get ready with me", sector: "Coiffure" },
  { slug: "livraison-whatsapp", style: "Commande WhatsApp", sector: "Livraison" },
  { slug: "degustation-maquis", style: "Dégustation", sector: "Maquis" },
  { slug: "avant-apres-savon-noir", style: "Avant / après", sector: "Cosmétiques" },
  { slug: "atelier-couture", style: "Fit check atelier", sector: "Couture sur mesure" },
  { slug: "promo-tabaski", style: "Promo fête", sector: "Tabaski" },
];

/** Plays only while visible, loads nothing before: light on mobile data. */
function UgcCard({ v }: { v: UgcVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure className="relative w-[220px] sm:w-[250px] shrink-0 snap-start overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03]">
      <video
        ref={ref}
        src={`/showcase/ugc/${v.slug}.mp4`}
        poster={`/showcase/ugc/${v.slug}.jpg`}
        muted={muted}
        loop
        playsInline
        preload="none"
        className="aspect-[9/16] w-full object-cover"
        aria-label={`Vidéo UGC : ${v.style}`}
      />
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Activer le son" : "Couper le son"}
        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pt-12">
        <p className="text-sm font-semibold text-white">{v.style}</p>
        <p className="text-xs text-white/70">{v.sector}</p>
      </figcaption>
    </figure>
  );
}

export function UgcShowcase() {
  if (!UGC_VIDEOS.length) return null;
  return (
    <section id="ugc" className="scroll-mt-24 py-24 sm:py-32">
      <div className="px-4 sm:px-6">
        <SectionTitle
          eyebrow="Vidéos UGC"
          title="Des créateurs africains qui présentent vos produits"
          text="Témoignage, déballage, marché, maquis, livraison WhatsApp : dix styles de vidéos créées avec Sokozia, en français, prêtes pour TikTok, Facebook et vos statuts."
        />
      </div>
      <Reveal className="mt-14">
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:px-6 lg:justify-center lg:flex-wrap lg:overflow-visible">
          {UGC_VIDEOS.map((v) => <UgcCard key={v.slug} v={v} />)}
        </div>
      </Reveal>
      <Reveal className="mt-10 flex justify-center">
        <CtaButton href={DEMO_HREF}>Créer ma vidéo UGC</CtaButton>
      </Reveal>
    </section>
  );
}
