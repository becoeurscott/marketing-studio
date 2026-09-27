"use client";

import { motion, useInView } from "framer-motion";
import { Camera, Clapperboard, Megaphone, Play, TrendingDown } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DEMO_HREF } from "./Hero";
import { Counter, CtaButton, EASE, Particles, Reveal, SectionTitle } from "./motion";

function GlowCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ───────────────────────── Problem ───────────────────────── */

function CostChart() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const bars = [
    { label: "Photo", h: 35 },
    { label: "Modèle", h: 52 },
    { label: "Vidéo", h: 70 },
    { label: "Montage", h: 84 },
    { label: "Pub", h: 100 },
  ];
  return (
    <div ref={ref} className="p-5">
      <p className="text-xs text-muted">Budget par campagne</p>
      <p className="mt-1 text-3xl font-medium">
        <Counter to={5} suffix=" prestataires" />
      </p>
      <p className="mt-1 flex items-center gap-1 text-xs text-danger">
        <TrendingDown className="size-3.5 rotate-180" /> Le coût grimpe à chaque étape
      </p>
      <div className="mt-5 flex h-28 items-end gap-2.5">
        {bars.map((b, i) => (
          <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
            <motion.div
              className="w-full rounded-md bg-gradient-to-t from-accent2/40 to-highlight"
              initial={{ height: 0 }}
              animate={inView ? { height: `${b.h}%` } : {}}
              transition={{ duration: 1, delay: 0.2 + i * 0.12, ease: EASE }}
            />
            <span className="text-[10px] text-muted">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EngagementRing() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted">Taux d&apos;engagement</p>
          <p className="mt-1 text-3xl font-medium">
            <Counter to={2} suffix="%" />
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text2">Scroll ↓</span>
      </div>
      <div className="relative mx-auto mt-3 size-36">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#ring)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 0.18 } : {}}
            transition={{ duration: 1.6, delay: 0.3, ease: EASE }}
          />
          <defs>
            <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
        </svg>
        <motion.span
          className="absolute inset-0 m-auto size-14 rounded-full bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Play className="size-5 fill-white text-white" />
        </motion.span>
      </div>
    </div>
  );
}

function PostingDots() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const days = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
  const active = [true, false, false, true, false, false, true];
  return (
    <div ref={ref} className="p-5">
      <p className="text-xs text-muted">Activité de publication</p>
      <p className="mt-1 text-lg font-medium">Pas le temps de publier</p>
      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {days.map((d, i) => (
          <div key={d} className="flex flex-col items-center gap-2">
            <span className="text-[9px] text-muted">{d}</span>
            <motion.span
              className={cn("size-7 sm:size-8 rounded-full border", active[i] ? "bg-gradient-to-br from-highlight to-accent2 border-transparent shadow-[0_0_14px_rgba(168,85,247,0.6)]" : "border-white/10 bg-white/[0.03]")}
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: EASE }}
            />
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-[10px] tracking-wider text-muted">CONTENUS PUBLIÉS</p>
          <p className="text-2xl font-medium">
            3 <span className="text-muted text-base">/ 10</span>
          </p>
        </div>
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-highlight"
            initial={{ width: 0 }}
            animate={inView ? { width: "30%" } : {}}
            transition={{ duration: 1.2, delay: 0.6, ease: EASE }}
          />
        </div>
      </div>
    </div>
  );
}

const PROBLEMS = [
  { visual: <CostChart />, title: "Des visuels hors de prix", text: "Photographe, modèle, monteur, graphiste… chaque campagne coûte une fortune avant même d'être publiée." },
  { visual: <EngagementRing />, title: "Du contenu qui n'accroche pas", text: "Photos amateurs, vidéos sans accroche : les clients scrollent sans jamais s'arrêter sur votre produit." },
  { visual: <PostingDots />, title: "Aucune régularité", text: "Sans système, on publie quand on peut. Et sans régularité, les algorithmes vous oublient." },
];

export function Problem() {
  return (
    <section className="relative px-4 sm:px-6 py-24 sm:py-32">
      <Particles count={30} />
      <div className="relative mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Le problème"
          title={
            <>
              Un bon produit,
              <br />
              mais pas de ventes ?
            </>
          }
          text="Vous passez des heures à créer du contenu, mais les résultats ne suivent pas. Le problème n'est pas votre produit, c'est la façon dont il est présenté."
        />
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.12}>
              <GlowCard className="h-full">
                <div className="m-2 rounded-2xl border border-white/[0.06] bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.18),transparent_70%)] bg-black/40">
                  {p.visual}
                </div>
                <div className="px-5 pb-6 pt-3">
                  <h3 className="text-lg font-medium">{p.title}</h3>
                  <p className="mt-2 text-sm text-text2 leading-relaxed">{p.text}</p>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Solution ───────────────────────── */

const STATS = [
  { to: 8, suffix: "", label: "Langues", text: "Français, anglais, wolof, dioula, bambara, lingala, swahili et pidgin, pour les textes et les voix off." },
  { to: 4, suffix: "", label: "Variantes par génération", text: "Comparez plusieurs propositions et gardez la meilleure." },
  { to: 13, suffix: "", label: "Outils de rédaction", text: "Accroches, statuts WhatsApp, fiches catalogue, notes vocales, scripts UGC…" },
  { to: 7, suffix: "", label: "Plateformes", text: "WhatsApp, TikTok, Facebook, Instagram, YouTube, Pinterest et Google." },
];

export function Solution() {
  return (
    <section id="fonctionnalites" className="relative scroll-mt-24 px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            align="left"
            eyebrow="La solution"
            title="Un studio IA qui crée vos contenus à votre place"
            text="Pas besoin de photographe ni d'agence. Vous importez une photo de votre produit, Sokozia s'occupe du reste : visuels, vidéos, pubs et textes."
          />
          <Reveal className="shrink-0">
            <CtaButton href={DEMO_HREF}>Essayer la démo</CtaButton>
          </Reveal>
        </div>
        <Reveal>
          <div className="mt-14 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <GlowCard className="h-full p-6 bg-[radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.14),transparent_70%)]">
                <p className="text-sm text-text2">{s.label}</p>
                <p className="mt-4 text-6xl font-light tracking-tight bg-gradient-to-b from-highlight to-accent2 bg-clip-text text-transparent">
                  <Counter to={s.to} suffix={s.suffix} />
                </p>
                <p className="mt-6 text-sm text-text2 leading-relaxed">{s.text}</p>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Services ───────────────────────── */

const SERVICES = [
  { icon: Camera, title: "Photos", accent: "produit", text: "Une photo prise au téléphone suffit : votre produit en studio, au marché ou porté par un mannequin africain." },
  { icon: Clapperboard, title: "Vidéos", accent: "UGC", text: "Des créatrices et créateurs africains virtuels présentent votre produit face caméra, dans votre langue." },
  { icon: Megaphone, title: "Publicités", accent: "prêtes", text: "Plusieurs variantes par plateforme, avec votre prix en FCFA et un bouton « Commander sur WhatsApp »." },
];

export function Services() {
  return (
    <section className="relative px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Ce que vous créez"
          title="De la simple photo au contenu prêt à publier"
          text="Que vous vendiez un produit ou gériez plusieurs marques, Sokozia vous donne la puissance créative d'une agence entière."
        />
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {SERVICES.map(({ icon: Icon, title, accent, text }, i) => (
            <Reveal key={title} delay={i * 0.12}>
              <GlowCard className="group h-full p-8 text-center transition-colors duration-500 hover:border-accent/40">
                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.18),transparent_70%)]" />
                <h3 className="relative text-2xl font-medium">
                  {title} <span className="text-highlight">{accent}</span>
                </h3>
                <motion.div
                  className="relative mx-auto my-10 size-36 sm:size-40"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, delay: i * 0.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="absolute inset-4 rounded-full bg-accent/40 blur-3xl transition-all duration-500 group-hover:bg-accent/60" />
                  <div className="relative size-full rounded-[34%] border border-white/25 bg-gradient-to-br from-white/25 via-white/5 to-accent2/40 shadow-[inset_0_2px_0_rgba(255,255,255,0.35),inset_0_-10px_30px_rgba(124,58,237,0.5),0_30px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                    <Icon className="size-16 text-white drop-shadow-[0_0_20px_rgba(192,132,252,0.9)]" strokeWidth={1.5} />
                  </div>
                </motion.div>
                <p className="relative text-sm text-text2 leading-relaxed">{text}</p>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export { GlowCard };
