"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Slide {
  tag: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  /** Real Marketing Studio-generated media from /public. */
  image: string;
  video?: string;
}

const SLIDES: Slide[] = [
  { tag: "Vidéos UGC", title: "Un créateur présente votre produit", text: "Choisissez un visage parmi nos créateurs, écrivez le texte : la vidéo est prête pour TikTok et les statuts.", cta: "Créer une vidéo UGC", href: "/studio/ugc", image: "/showcase/ugc/temoignage-karite.jpg", video: "/showcase/ugc/temoignage-karite.mp4" },
  { tag: "Shooting produit", title: "Une simple photo devient un visuel pro", text: "Prenez votre produit en photo au téléphone. Marketing Studio le place dans un décor studio, nature ou luxe.", cta: "Lancer un shooting", href: "/studio/product-shoot", image: "/styles/studio-ocre.jpg" },
  { tag: "Publicités", title: "Des pubs et flyers prêts à poster", text: "Visuel, accroche et appel à l'action pour Facebook, Instagram, TikTok ou un flyer à imprimer.", cta: "Créer une publicité", href: "/studio/ads", image: "/styles/flyer-promo.jpg" },
  { tag: "Statuts WhatsApp", title: "Vendez là où sont vos clients", text: "Des statuts et visuels au format vertical, pensés pour WhatsApp et la vente en direct.", cta: "Créer un visuel", href: "/studio/image", image: "/styles/statut-whatsapp.jpg" },
  { tag: "Campagnes", title: "Toute une campagne en quelques minutes", text: "Tabaski, rentrée, fêtes : photos, vidéos, pubs et calendrier de publication réunis au même endroit.", cta: "Nouvelle campagne", href: "/campaigns/new", image: "/showcase/ugc/promo-tabaski.jpg", video: "/showcase/ugc/promo-tabaski.mp4" },
];

const INTERVAL_MS = 6500;

/** Rotating banner on the dashboard that shows what Marketing Studio can make, each slide linking to its tool. */
export function ShowcaseBanner() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const slide = SLIDES[index];

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused || reduce) return;
    const t = setTimeout(() => go(1), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduce, go]);

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="Ce que Marketing Studio peut créer"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="relative h-[340px] sm:h-[300px] lg:h-[280px]">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.6 }}
            className="absolute inset-0"
          >
            {/* Media: full-bleed on phones, right side on larger screens */}
            <div className="absolute inset-0 sm:left-auto sm:w-[52%]">
              {slide.video ? (
                <video key={slide.video} src={slide.video} poster={slide.image} autoPlay muted loop playsInline className="size-full object-cover" />
              ) : (
                <img src={slide.image} alt="" className="size-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10 sm:bg-gradient-to-r sm:from-surface sm:via-surface/40 sm:to-transparent" />
            </div>

            <div className="relative flex h-full flex-col justify-end p-5 sm:max-w-[54%] sm:justify-center sm:p-8">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-highlight">
                {slide.tag}
              </span>
              <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]">{slide.title}</h2>
              <p className="mt-2 max-w-md text-[14px] leading-relaxed text-text2">{slide.text}</p>
              <Link href={slide.href} className="group mt-5 inline-flex h-10 w-fit items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-on-accent transition-colors hover:bg-highlight">
                {slide.cta}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 sm:bottom-5 sm:right-5">
        <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-2 backdrop-blur">
          {SLIDES.map((s, i) => (
            <button
              key={s.tag}
              type="button"
              aria-label={`Afficher : ${s.tag}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-accent" : "w-1.5 bg-white/40 hover:bg-white/70")}
            />
          ))}
        </div>
        <button type="button" aria-label="Précédent" onClick={() => go(-1)} className="hidden sm:grid size-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"><ChevronLeft className="size-4" /></button>
        <button type="button" aria-label="Suivant" onClick={() => go(1)} className="hidden sm:grid size-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"><ChevronRight className="size-4" /></button>
      </div>
    </section>
  );
}
