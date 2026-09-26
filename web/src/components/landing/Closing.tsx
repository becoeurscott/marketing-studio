"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Check, Minus, Plus, Store, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DEMO_HREF, Logo } from "./Hero";
import { CtaButton, EASE, Particles, Reveal, ScrollText, SectionTitle } from "./motion";
import { GlowCard } from "./Story";

/* ───────────────────────── Audiences ───────────────────────── */

const AUDIENCES = [
  { icon: Store, title: "Vendeurs e-commerce", text: "Des visuels pro pour chaque produit de votre boutique, sans budget shooting." },
  { icon: Users, title: "Créateurs de contenu", text: "Publiez plus souvent, avec des idées d'accroches qui ne s'épuisent jamais." },
  { icon: Briefcase, title: "Agences & freelances", text: "Livrez plus de campagnes à vos clients, plus vite, avec une marque par client." },
];

export function Audiences() {
  return (
    <section className="px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          align="left"
          eyebrow="Pour qui"
          title={
            <>
              Pensé pour ceux
              <br />
              qui vendent
            </>
          }
          text="Que vous lanciez votre premier produit ou gériez dix marques, Sokozia s'adapte à votre façon de travailler."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {AUDIENCES.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.12}>
              <GlowCard className="group h-full p-7 transition-colors duration-500 hover:border-accent/40">
                <span className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-accent/30 to-transparent transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                  <Icon className="size-5 text-highlight" />
                </span>
                <h3 className="mt-8 text-xl font-medium">{title}</h3>
                <p className="mt-2 text-sm text-text2 leading-relaxed">{text}</p>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Pricing ───────────────────────── */

const PLANS = [
  {
    name: "Starter",
    desc: "Pour tester et lancer vos premiers contenus",
    price: 12,
    features: ["300 générations IA / mois", "Générateur d'images", "Rédaction IA", "1 kit de marque", "5 vidéos / mois"],
  },
  {
    name: "Créateur",
    desc: "Pour les marques qui publient chaque semaine",
    price: 29,
    popular: true,
    features: ["1 000 générations IA / mois", "Vidéos UGC", "Shooting produit IA", "3 kits de marque", "30 vidéos / mois", "Tous les modèles"],
  },
  {
    name: "Studio",
    desc: "Pour les équipes et les agences",
    price: 59,
    features: ["3 000 générations IA / mois", "Campagnes + calendrier", "Export 4K", "10 kits de marque", "100 vidéos / mois", "5 membres d'équipe"],
  },
];

export function Pricing() {
  return (
    <section id="tarifs" className="relative scroll-mt-24 px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Tarifs"
          title={
            <>
              Des offres simples
              <br />
              pour grandir
            </>
          }
          text="Choisissez l'offre qui correspond à votre rythme. Changez ou arrêtez quand vous voulez."
        />
        <div className="mt-16 grid gap-4 lg:grid-cols-3 lg:items-stretch">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.12}>
              <GlowCard
                className={cn(
                  "h-full p-7 transition-transform duration-500 hover:-translate-y-1",
                  p.popular && "border-accent/40 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.25),transparent_70%)]",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-medium">{p.name}</h3>
                  {p.popular && <span className="rounded-full bg-accent/20 border border-accent/40 px-2.5 py-0.5 text-[11px] text-highlight">Populaire</span>}
                </div>
                <p className="mt-2 text-sm text-text2">{p.desc}</p>
                <p className="mt-8 flex items-end gap-1.5">
                  <span className="text-5xl font-light tracking-tight bg-gradient-to-b from-white to-highlight bg-clip-text text-transparent">${p.price}</span>
                  <span className="pb-1.5 text-text2">/ mois</span>
                </p>
                <div className="my-7 h-px bg-white/10" />
                <ul className="space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-text2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/20">
                        <Check className="size-3 text-highlight" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={DEMO_HREF}
                  className={cn(
                    "mt-8 flex h-11 w-full items-center justify-center rounded-full text-sm font-medium transition-all duration-300",
                    p.popular
                      ? "bg-gradient-to-b from-highlight to-accent2 text-white shadow-[0_8px_30px_rgba(168,85,247,0.4)] hover:shadow-[0_10px_40px_rgba(168,85,247,0.6)]"
                      : "border border-white/10 bg-white/[0.04] hover:bg-white/[0.08]",
                  )}
                >
                  Essayer la démo
                </Link>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FAQ ───────────────────────── */

const FAQS = [
  { q: "Qu'est-ce que Sokozia ?", a: "Sokozia est un studio marketing propulsé par l'IA. À partir d'une photo de votre produit, il crée des photos professionnelles, des vidéos UGC, des publicités et des textes de vente prêts à publier." },
  { q: "Faut-il savoir faire du design ou du marketing ?", a: "Non. Vous choisissez un style et une plateforme, Sokozia s'occupe du cadrage, du décor, des accroches et des formats." },
  { q: "Sur quelles plateformes puis-je publier ?", a: "Les contenus sont adaptés à TikTok, Instagram, Facebook, YouTube, Pinterest et Google : bons formats, bons ratios, bons textes." },
  { q: "Est-ce que les contenus respectent ma marque ?", a: "Oui. Vous enregistrez votre logo, vos couleurs et votre ton de voix dans le kit de marque, et ils sont appliqués à chaque création." },
  { q: "Est-ce disponible dès maintenant ?", a: "Sokozia est actuellement en démo. Vous pouvez explorer le studio gratuitement dès aujourd'hui pour découvrir tout ce qu'il pourra créer pour vous." },
];

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className={cn("rounded-2xl border transition-colors duration-300", open ? "border-white/15 bg-white/[0.05]" : "border-white/[0.08] bg-white/[0.02]")}>
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-4 p-5 text-left" aria-expanded={open}>
        <span className="font-medium">{q}</span>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/10">
          {open ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm text-text2 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-24 px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionTitle
            align="left"
            eyebrow="FAQ"
            title={
              <>
                Tout ce que
                <br />
                vous devez savoir
              </>
            }
            text="Une question avant de commencer ? Voici les réponses aux plus fréquentes."
          />
        </div>
        <div className="flex flex-col gap-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.06}>
              <FaqItem q={f.q} a={f.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Platforms orbit ───────────────────────── */

const PLATFORMS = ["TikTok", "Instagram", "Facebook", "YouTube", "Pinterest", "Google"];

export function Platforms() {
  return (
    <section className="relative overflow-hidden px-4 sm:px-6 py-24 sm:py-32">
      <SectionTitle
        eyebrow="Plateformes"
        title="Vos contenus, sur tous les réseaux qui comptent"
        text="Chaque création sort au bon format pour chaque plateforme. Plus besoin de redimensionner à la main."
      />
      <Reveal className="relative mx-auto mt-16 size-[320px] sm:size-[440px]">
        <div aria-hidden className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.35),transparent_65%)] blur-xl" />
        <div className="absolute inset-[12%] rounded-full border border-white/10" />
        <div className="absolute inset-[30%] rounded-full border border-white/[0.06]" />
        <div className="absolute inset-0 m-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-highlight to-accent2 shadow-[0_0_60px_rgba(168,85,247,0.6)]">
          <span className="text-2xl font-semibold">S</span>
        </div>
        <div className="absolute inset-[12%] animate-[spin_40s_linear_infinite]">
          {PLATFORMS.map((p, i) => {
            const a = (i / PLATFORMS.length) * Math.PI * 2 - Math.PI / 2;
            // Rounded so server and browser produce the same style strings.
            const left = (50 + 50 * Math.cos(a)).toFixed(2);
            const top = (50 + 50 * Math.sin(a)).toFixed(2);
            return (
              <div key={p} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%`, top: `${top}%` }}>
                <span className="block animate-[spin_40s_linear_infinite_reverse] whitespace-nowrap rounded-full border border-white/10 bg-black/70 px-3.5 py-1.5 text-xs sm:text-sm backdrop-blur">
                  {p}
                </span>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}

/* ───────────────────────── Final CTA + footer ───────────────────────── */

export function FinalCta() {
  return (
    <section className="px-4 sm:px-6 pb-24 sm:pb-32">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0b0910] px-6 py-20 text-center sm:py-28">
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(168,85,247,0)_0px,rgba(168,85,247,0.28)_22px,rgba(168,85,247,0)_44px)] [mask-image:radial-gradient(ellipse_at_bottom,black_20%,transparent_70%)]"
            animate={{ backgroundPositionX: ["0px", "44px"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <div aria-hidden className="absolute -bottom-32 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-accent/35 blur-3xl" />
          <Particles count={30} />
          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.03em] leading-[1.05] text-balance">
              Prêt à transformer votre produit en ventes ?
            </h2>
            <ScrollText
              text="Arrêtez de deviner ce qui marche. Créez des contenus qui arrêtent le scroll et donnent envie d'acheter, dès aujourd'hui."
              className="mx-auto mt-6 max-w-xl text-text2 leading-relaxed"
            />
            <CtaButton href={DEMO_HREF} className="mt-10">
              Essayer la démo gratuite
            </CtaButton>
            <p className="mt-5 text-xs text-muted">Sans engagement · Sans carte bancaire</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] px-4 sm:px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm text-text2">Le studio marketing IA qui transforme vos produits en campagnes complètes.</p>
        </div>
        <div>
          <p className="text-sm font-medium">Liens rapides</p>
          <ul className="mt-4 space-y-2.5 text-sm text-text2">
            <li><a href="#fonctionnalites" className="hover:text-text transition-colors">Fonctionnalités</a></li>
            <li><a href="#creations" className="hover:text-text transition-colors">Créations</a></li>
            <li><a href="#tarifs" className="hover:text-text transition-colors">Tarifs</a></li>
            <li><a href="#faq" className="hover:text-text transition-colors">FAQ</a></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-white/[0.06] pt-6 text-xs text-muted">
        © {new Date().getFullYear()} Sokozia. Tous droits réservés.
      </div>
    </footer>
  );
}
