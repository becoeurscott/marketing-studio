"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Minus, Plus, Store, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { COUNTRIES, DEFAULT_COUNTRY, PAYMENT_METHODS, TOP_UP_PACKS, USAGE_PACKS, countryOf, priceIn, type CountryCode, type PaymentMethodId } from "@/lib/market";
import { cn } from "@/lib/utils";
import { DEMO_HREF, Logo } from "./Hero";
import { CtaButton, EASE, Particles, Reveal, ScrollText, SectionTitle } from "./motion";
import { GlowCard } from "./Story";

/* ───────────────────────── Audiences ───────────────────────── */

const AUDIENCES = [
  { icon: Store, title: "Boutiques & commerçants", text: "Au marché, en boutique ou sur WhatsApp : des visuels pro pour chaque produit, sans payer de photographe." },
  { icon: Users, title: "Vendeurs en ligne & créateurs", text: "Statuts, TikTok, Facebook : publiez tous les jours avec des accroches qui ne s'épuisent jamais." },
  { icon: Briefcase, title: "Agences & community managers", text: "Gérez plusieurs clients, une marque par client, et livrez plus vite." },
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

const LANDING_PAYMENTS: PaymentMethodId[] = ["wave", "orange-money", "mtn-momo", "moov-money", "mpesa", "card"];

export function Pricing() {
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const c = countryOf(country);
  return (
    <section id="tarifs" className="relative scroll-mt-24 px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Tarifs"
          title={
            <>
              Payez à l&apos;usage,
              <br />
              en Mobile Money
            </>
          }
          text="Sans abonnement, dès 1 000 FCFA. Vos crédits n'expirent pas, rechargez quand vous voulez."
        />
        <Reveal className="mt-8 flex flex-col items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-text2">
            Prix pour
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryCode)}
              className="h-9 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm text-text focus:border-accent focus:outline-none"
            >
              {COUNTRIES.map((x) => <option key={x.code} value={x.code} className="bg-bg">{x.flag} {x.name}</option>)}
            </select>
          </label>
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Moyens de paiement acceptés">
            {LANDING_PAYMENTS.map((id) => {
              const m = PAYMENT_METHODS[id];
              const local = c.payments.includes(id);
              return (
                <li key={id} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs", local ? "border-white/15 bg-white/[0.06] text-text" : "border-white/[0.06] text-muted")}>
                  <span className="size-2.5 rounded-full" style={{ background: m.color }} />
                  {m.label}
                </li>
              );
            })}
          </ul>
        </Reveal>

        {/* Pay-as-you-go packs */}
        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          {USAGE_PACKS.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <div className={cn("h-full rounded-2xl border p-5", p.popular ? "border-accent/40 bg-accent/10" : "border-white/[0.08] bg-white/[0.03]")}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-text2">{p.name}</p>
                  {p.popular && <span className="rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[10px] text-highlight">Le plus pris</span>}
                </div>
                <p className="mt-2 text-3xl font-medium tracking-tight text-white tabular-nums">{priceIn(p.priceXof, country)}</p>
                <p className="mt-1 text-sm">{p.pitch}</p>
                <p className="mt-2 text-xs text-muted">Sans abonnement{p.validityDays ? ` · valable ${p.validityDays} jours` : ""}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-14 text-center text-sm text-text2">Vous publiez beaucoup ? Les grosses recharges donnent des crédits en plus</p>
        <div className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
          {TOP_UP_PACKS.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.12}>
              <GlowCard className="h-full p-7 transition-transform duration-500 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-medium">{p.name}</h3>
                  <span className="rounded-full bg-accent/20 border border-accent/40 px-2.5 py-0.5 text-[11px] text-highlight">{p.pitch}</span>
                </div>
                <p className="mt-6 whitespace-nowrap text-4xl font-light tracking-tight text-white tabular-nums">{priceIn(p.priceXof, country)}</p>
                <p className="mt-1 text-sm text-text2">{p.credits.toLocaleString("fr-FR")} crédits · sans abonnement, sans expiration</p>
                <Link href={DEMO_HREF} className="mt-8 flex h-11 w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-medium transition-all duration-300 hover:bg-white/[0.08]">
                  Commencer gratuitement
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

const PLATFORMS = ["WhatsApp", "TikTok", "Facebook", "Instagram", "YouTube", "Pinterest", "Google"];

export function Platforms() {
  return (
    <section className="relative overflow-hidden px-4 sm:px-6 py-24 sm:py-32">
      <SectionTitle
        eyebrow="Plateformes"
        title="Vos contenus, sur tous les réseaux qui comptent"
        text="Chaque création sort au bon format pour chaque plateforme. Plus besoin de redimensionner à la main."
      />
      <Reveal className="relative mx-auto mt-16 size-[272px] min-[360px]:size-[320px] sm:size-[440px]">
        <div aria-hidden className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.35),transparent_65%)] blur-xl" />
        <div className="absolute inset-[12%] rounded-full border border-white/10" />
        <div className="absolute inset-[30%] rounded-full border border-white/[0.06]" />
        <div className="absolute inset-0 m-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-highlight via-accent to-green text-on-accent shadow-[0_0_60px_rgba(249,115,22,0.6)]">
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
                <span className="block animate-[spin_40s_linear_infinite_reverse] whitespace-nowrap rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[11px] min-[360px]:px-3.5 min-[360px]:py-1.5 min-[360px]:text-xs sm:text-sm backdrop-blur">
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
            className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(249,115,22,0)_0px,rgba(249,115,22,0.28)_22px,rgba(249,115,22,0)_44px)] [mask-image:radial-gradient(ellipse_at_bottom,black_20%,transparent_70%)]"
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
            <p className="mt-5 text-xs text-muted">Sans engagement · Dès 1 000 FCFA · Paiement Mobile Money</p>
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
          <p className="mt-4 text-sm text-text2">Le studio marketing IA des commerçants africains : vos produits en visuels, vidéos et statuts qui font vendre.</p>
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
