"use client";

import { motion } from "framer-motion";
import { Heart, ImagePlus, Palette, Send, Sparkles, Zap } from "lucide-react";
import { CREATIVES, Creative } from "./Creative";
import { DEMO_HREF } from "./Hero";
import { CtaButton, EASE, Particles, Reveal, ScrollText, SectionTitle } from "./motion";
import { GlowCard } from "./Story";

/* ───────────────────────── Benefits panel ───────────────────────── */

const BENEFITS = [
  { icon: Zap, title: "Rapide", text: "Vos visuels et vidéos en quelques minutes, pas en quelques semaines." },
  { icon: Sparkles, title: "Pensé pour vendre", text: "Accroches, formats et cadrages conçus pour arrêter le scroll et convertir." },
  { icon: Palette, title: "Fidèle à votre marque", text: "Logo, couleurs et ton de voix appliqués automatiquement à chaque création." },
];

export function Benefits() {
  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0b0910]">
          {/* Vertical light stripes, drifting slowly. */}
          <motion.div
            aria-hidden
            className="absolute inset-y-0 right-0 w-full lg:w-2/3 bg-[repeating-linear-gradient(90deg,rgba(209,254,23,0.0)_0px,rgba(209,254,23,0.22)_18px,rgba(209,254,23,0.0)_36px)] [mask-image:linear-gradient(to_left,black,transparent)]"
            animate={{ backgroundPositionX: ["0px", "36px"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <div aria-hidden className="absolute -bottom-40 right-0 size-[500px] rounded-full bg-accent/30 blur-3xl" />
          <Particles count={25} />
          <div className="relative grid gap-10 p-6 sm:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-medium tracking-[-0.03em] leading-[1.05]">
                Plus de contenu,
                <br />
                moins de stress
              </h2>
              <ScrollText
                text="Laissez Marketing Studio produire vos visuels. Vous recevez des contenus soignés, adaptés à chaque plateforme, pendant que vous vous concentrez sur vos ventes et vos clients."
                className="mt-6 max-w-md text-text2 leading-relaxed"
              />
              <CtaButton href={DEMO_HREF} className="mt-8">
                Commencer maintenant
              </CtaButton>
            </div>
            <div className="flex flex-col gap-3 lg:ml-auto lg:w-[360px]">
              {BENEFITS.map(({ icon: Icon, title, text }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: 40, filter: "blur(6px)" }}
                  whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, delay: i * 0.15, ease: EASE }}
                  className="rounded-2xl border border-white/10 bg-black/50 p-5 backdrop-blur-xl"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-highlight to-accent2">
                    <Icon className="size-4 text-on-accent" />
                  </span>
                  <h3 className="mt-6 text-lg font-medium">{title}</h3>
                  <p className="mt-1.5 text-sm text-text2 leading-relaxed">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ───────────────────────── Creations marquee ───────────────────────── */

export function Creations() {
  const row = [...CREATIVES, ...CREATIVES];
  return (
    <section id="creations" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="px-4 sm:px-6">
        <SectionTitle
          eyebrow="Créations"
          title={
            <>
              Vrais formats,
              <br />
              prêts à publier
            </>
          }
          text="Chaque création est pensée pour sa plateforme : statut WhatsApp, TikTok, Facebook ou Instagram. Bon format, bon cadrage, bonne accroche, et votre prix bien visible."
        />
        <Reveal className="mt-8 flex justify-center">
          <CtaButton href={DEMO_HREF}>Créer les miens</CtaButton>
        </Reveal>
      </div>
      <Reveal className="mt-16">
        <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="flex w-max gap-4 animate-[marquee_45s_linear_infinite] group-hover:[animation-play-state:paused]">
            {row.map((c, i) => (
              <div key={i} className="w-[220px] sm:w-[260px] shrink-0 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-2 transition-transform duration-500 hover:-translate-y-2">
                <Creative data={c} className="aspect-[9/14] w-full" />
                <div className="px-2 pb-2 pt-4">
                  <p className="text-sm font-medium">{c.tag}</p>
                  <p className="mt-0.5 text-xs text-muted">{c.title} · {c.platform}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ───────────────────────── Use cases ───────────────────────── */

const CASES = [
  { creative: CREATIVES[7], sector: "Couture & wax", title: "Vos pagnes et tenues, mis en valeur", text: "Photos portées, fiches catalogue WhatsApp et statuts prêts pour Tabaski ou la Korité." },
  { creative: CREATIVES[9], sector: "Restauration & maquis", title: "Des plats qui donnent faim", text: "Plat du jour, menu, livraison : une vidéo fraîche chaque semaine pour vos statuts et TikTok." },
  { creative: CREATIVES[2], sector: "Cosmétiques", title: "Vos soins comme en magazine", text: "Karité, savon noir, huiles : des packshots propres, sans louer de studio." },
  { creative: CREATIVES[5], sector: "Téléphones & électronique", title: "Votre vitrine, prix affichés", text: "Pubs Facebook et flyers avec les prix en FCFA et les facilités de paiement." },
  { creative: CREATIVES[4], sector: "Coiffure & beauté", title: "Chaque nouvel arrivage vendu vite", text: "Perruques, tresses, mèches : avant/après et vidéos UGC avec des créatrices africaines." },
];

function CaseCard({ c, large }: { c: (typeof CASES)[number]; large?: boolean }) {
  return (
    <GlowCard className="group h-full p-2">
      <div className="overflow-hidden rounded-2xl">
        <Creative
          data={c.creative}
          compact
          className={`w-full transition-transform duration-700 ease-out group-hover:scale-105 ${large ? "aspect-[16/10]" : "aspect-[4/3]"}`}
        />
      </div>
      <div className="p-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-text2">
          <span className="size-1.5 rounded-full bg-highlight" />
          {c.sector}
        </span>
        <h3 className={`mt-3 font-medium ${large ? "text-xl" : "text-lg"}`}>{c.title}</h3>
        <p className="mt-2 text-sm text-text2 leading-relaxed">{c.text}</p>
      </div>
    </GlowCard>
  );
}

export function UseCases() {
  return (
    <section className="px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            align="left"
            eyebrow="Pour chaque secteur"
            title="Pas juste joli : du contenu qui fait vendre"
            text="Quel que soit votre marché, Marketing Studio adapte le style, le format et le message à vos clients."
          />
          <Reveal className="shrink-0">
            <CtaButton href={DEMO_HREF}>Essayer la démo</CtaButton>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {CASES.slice(0, 2).map((c, i) => (
            <Reveal key={c.sector} delay={i * 0.1}>
              <CaseCard c={c} large />
            </Reveal>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {CASES.slice(2).map((c, i) => (
            <Reveal key={c.sector} delay={i * 0.1}>
              <CaseCard c={c} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Process ───────────────────────── */

function UploadVisual() {
  return (
    <div className="relative flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/40">
      <motion.div
        className="flex size-16 items-center justify-center rounded-2xl border border-white/15 bg-white/5"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ImagePlus className="size-7 text-white" />
      </motion.div>
      <motion.div
        className="absolute bottom-5 right-5 w-16 rotate-6 rounded-lg border border-white/20 shadow-xl"
        initial={{ x: 60, y: 40, opacity: 0, rotate: 20 }}
        whileInView={{ x: 0, y: 0, opacity: 1, rotate: 6 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.4, ease: EASE }}
      >
        <Creative data={CREATIVES[3]} bare className="aspect-square w-full" />
      </motion.div>
    </div>
  );
}

function BeforeAfter() {
  return (
    <div className="relative h-full min-h-[220px] overflow-hidden rounded-2xl border border-white/10">
      {/* After */}
      <div className="absolute inset-0">
        <Creative data={CREATIVES[2]} bare className="size-full" />
      </div>
      {/* Before: plain phone photo, revealed by a sweeping divider */}
      <motion.div
        className="absolute inset-y-0 left-0 overflow-hidden"
        animate={{ width: ["70%", "25%", "70%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 w-[400px] max-w-none bg-gradient-to-b from-zinc-500 to-zinc-700 grayscale">
          <div className="absolute left-[30%] top-[25%] h-[45%] w-[16%] rounded-xl bg-zinc-300/70" />
        </div>
        <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">Avant</span>
        <div className="absolute inset-y-0 right-0 w-0.5 bg-white shadow-[0_0_12px_white]">
          <span className="absolute top-1/2 left-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[10px] text-black">↔</span>
        </div>
      </motion.div>
      <span className="absolute top-3 right-3 rounded-full bg-accent px-2 py-0.5 text-[10px] text-on-accent">Après</span>
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
        {["Décor", "Lumière", "Texte"].map((t, i) => (
          <motion.span
            key={t}
            className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.15 }}
          >
            + {t}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function PublishVisual() {
  return (
    <div className="relative flex h-full min-h-[220px] items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4 pt-14">
      {[CREATIVES[4], CREATIVES[1]].map((c, i) => (
        <motion.div
          key={i}
          className="w-[42%] max-w-[130px]"
          animate={{ y: i === 0 ? [0, -8, 0] : [0, 8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Creative data={c} compact className="aspect-[9/16] w-full border border-white/10" />
        </motion.div>
      ))}
      <motion.span
        className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[11px] text-white backdrop-blur"
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        <Send className="size-3 text-highlight" /> Programmé · Instagram, TikTok
      </motion.span>
      <motion.span
        className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] text-on-accent"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        <Heart className="size-3 fill-white" /> J&apos;aime
      </motion.span>
    </div>
  );
}

const STEPS = [
  { n: "01", title: "Importez votre produit", text: "Une simple photo prise au téléphone suffit. Ajoutez votre logo et vos couleurs une seule fois.", visual: <UploadVisual />, wide: true },
  { n: "02", title: "Marketing Studio crée vos contenus", text: "Décor, lumière, accroche, texte : l'IA transforme votre photo en visuels et vidéos professionnels.", visual: <BeforeAfter /> },
  { n: "03", title: "Publiez partout", text: "Exportez au bon format pour chaque réseau et planifiez votre campagne dans le calendrier.", visual: <PublishVisual /> },
];

export function Process() {
  return (
    <section className="relative px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionTitle
          eyebrow="Comment ça marche"
          title="De la photo au contenu publié, en trois étapes"
          text="Pas besoin d'être designer ou marketeur. Marketing Studio vous guide de l'idée jusqu'à la publication."
        />
        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1} className={s.wide ? "md:col-span-2" : ""}>
              <GlowCard className="h-full p-2 bg-[radial-gradient(ellipse_at_top,rgba(209,254,23,0.12),transparent_70%)]">
                <div className={s.wide ? "h-64" : "h-60"}>{s.visual}</div>
                <div className="p-4">
                  <span className="font-mono text-xs text-highlight">{s.n}</span>
                  <h3 className="mt-2 text-xl font-medium">{s.title}</h3>
                  <p className="mt-2 text-sm text-text2 leading-relaxed">{s.text}</p>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
