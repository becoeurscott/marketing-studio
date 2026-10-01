"use client";

import { motion } from "framer-motion";
import { useSyncExternalStore } from "react";
import { Bot, CalendarHeart, Camera, Gauge, Handshake, Mic, Printer, ShoppingBag, Store, Users } from "lucide-react";
import { SOKOZIA_WHATSAPP, upcomingMoments, whatsappLink } from "@/lib/market";
import { CREATIVES, Creative } from "./Creative";
import { DEMO_HREF } from "./Hero";
import { CtaButton, EASE, Reveal, SectionTitle } from "./motion";
import { GlowCard } from "./Story";

/* ───────────────────────── WhatsApp ───────────────────────── */

const WA_FEATURES = [
  { icon: Camera, title: "Statuts WhatsApp", text: "Visuels et vidéos au format 9:16, prêts à poster en statut chaque matin." },
  { icon: ShoppingBag, title: "Catalogue WhatsApp Business", text: "Une fiche propre par produit : photo, nom, description et prix." },
  { icon: Handshake, title: "Bouton « Commander sur WhatsApp »", text: "Sur chaque pub, le client arrive dans votre discussion avec un message déjà écrit." },
  { icon: Mic, title: "Notes vocales pub", text: "Un message vocal de 20 secondes à transférer dans tous vos groupes." },
];

export function WhatsAppSection() {
  const status = CREATIVES[0];
  return (
    <section id="whatsapp" className="scroll-mt-24 px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_380px]">
        <div>
          <SectionTitle
            align="left"
            eyebrow="WhatsApp d'abord"
            title={
              <>
                Là où vos clients
                <br />
                achètent déjà
              </>
            }
            text="Vos clients vous écrivent sur WhatsApp. Sokozia crée tout ce qu'il faut pour y vendre : statuts, catalogue, boutons de commande et notes vocales."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {WA_FEATURES.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                  <span className="flex size-9 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]"><Icon className="size-4" /></span>
                  <h3 className="mt-4 font-medium">{title}</h3>
                  <p className="mt-1.5 text-sm text-text2 leading-relaxed">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-4">
            <div className="flex items-start gap-3 rounded-2xl border border-dashed border-[#25D366]/40 bg-[#25D366]/[0.06] p-5">
              <Bot className="size-5 shrink-0 text-[#25D366] mt-0.5" />
              <p className="text-sm text-text2 leading-relaxed">
                <span className="font-medium text-text">Bientôt : le bot Sokozia sur WhatsApp.</span> Envoyez la photo de votre produit, recevez votre pub en retour. Sans installer d&apos;application.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Phone mockup: a WhatsApp status */}
        <Reveal className="mx-auto w-full max-w-[320px]">
          <div className="rounded-[40px] border border-white/15 bg-black p-2.5 shadow-[0_30px_80px_rgba(37,211,102,0.18)]">
            <div className="relative overflow-hidden rounded-[32px]">
              <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                    {i === 0 && <motion.span className="block h-full bg-white" initial={{ width: "0%" }} whileInView={{ width: "100%" }} transition={{ duration: 5, ease: "linear", repeat: Infinity }} />}
                  </span>
                ))}
              </div>
              <div className="absolute left-3 top-6 z-10 flex items-center gap-2 text-white">
                <span className="size-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-600" />
                <span className="text-xs font-medium">Awa Tissus · il y a 2 min</span>
              </div>
              <Creative data={status} bare className="aspect-[9/16] w-full" />
              <span className="absolute right-3 top-16 rotate-3 rounded-md bg-highlight px-2.5 py-1 text-sm font-extrabold text-on-accent shadow-lg">{status.price}</span>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pt-16">
                <p className="text-sm font-semibold text-white">Nouvel arrivage wax hollandais 🔥</p>
                <p className="mt-0.5 text-xs text-white/75">Livraison offerte cette semaine</p>
                <span className="mt-3 flex h-9 items-center justify-center rounded-full bg-[#25D366] text-xs font-semibold text-black">Commander sur WhatsApp</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── Field realities ───────────────────────── */

const TERRAIN = [
  { icon: Camera, title: "Photo floue ? Pas grave", text: "Détourage, lumière et netteté corrigés automatiquement, même avec une photo prise vite au téléphone." },
  { icon: Gauge, title: "Vidéos légères", text: "Des fichiers jusqu'à 4 fois plus petits, pour les connexions lentes et les forfaits data limités." },
  { icon: Printer, title: "Flyers et affiches", text: "Imprimez vos promos en A4 ou A5 pour la vitrine, la boutique ou l'étal au marché." },
  { icon: Mic, title: "Notes vocales", text: "Votre pub en message vocal, dans votre langue, à transférer dans vos groupes WhatsApp." },
];

export function Terrain() {
  return (
    <section className="px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Pensé pour le terrain"
          title="Un téléphone suffit"
          text="Pas besoin d'ordinateur, de studio ni d'une grosse connexion. Sokozia s'adapte à votre façon de vendre, en ligne comme en boutique."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TERRAIN.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.1}>
              <GlowCard className="h-full p-6">
                <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-accent/30 to-transparent">
                  <Icon className="size-5 text-highlight" />
                </span>
                <h3 className="mt-6 text-lg font-medium">{title}</h3>
                <p className="mt-2 text-sm text-text2 leading-relaxed">{text}</p>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Promo calendar ───────────────────────── */

const noopSubscribe = () => () => {};

export function PromoCalendar() {
  // The page is statically built, so "today" is only known in the browser. Before mount, list every moment.
  const inBrowser = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const moments = upcomingMoments(inBrowser ? new Date() : new Date(0)).slice(0, 6);
  if (!moments.length) return null; // Add next year's dates in lib/market.ts (PROMO_MOMENTS).
  return (
    <section className="px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Calendrier des fêtes"
          title="Prêt pour chaque temps fort"
          text="Tabaski, Ramadan et Korité, Noël, rentrée, fête des mères : des modèles prêts à l'emploi et un rappel trois semaines avant."
        />
        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {moments.map((m, i) => (
            <Reveal key={m.id} delay={i * 0.06}>
              <div className="flex h-full gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-accent/15 border border-accent/30 py-2">
                  <span className="text-[10px] uppercase tracking-wide text-highlight">{new Date(m.date).toLocaleDateString("fr-FR", { month: "short" })}</span>
                  <span className="text-xl font-semibold tabular-nums">{new Date(m.date).getDate()}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium flex items-center gap-1.5"><CalendarHeart className="size-4 text-highlight shrink-0" />{m.name}</h3>
                  <p className="mt-1 text-sm text-text2 leading-relaxed">{m.pitch}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted">Dates religieuses indicatives : elles peuvent varier d&apos;un jour selon la lune et le pays.</p>
      </div>
    </section>
  );
}

/* ───────────────────────── Trust: testimonials + ambassadors ───────────────────────── */

export interface Testimonial {
  name: string;
  business: string;
  city: string;
  photo: string;
  quote: string;
}

/**
 * Real merchant testimonials only (with their written consent): name, shop, city and photo.
 * The section shows a call for pilot merchants until this list has entries.
 */
export const TESTIMONIALS: Testimonial[] = [];

const AMBASSADOR_STEPS = [
  { icon: Users, title: "Faites des démos", text: "Montrez Sokozia aux commerçants de votre marché, de votre quartier ou de vos groupes." },
  { icon: Store, title: "Ils créent leurs pubs", text: "Chaque commerçant qui s'inscrit avec votre code est rattaché à vous." },
  { icon: Handshake, title: "Vous touchez une commission", text: "Sur chaque pack ou abonnement payé, versée en Mobile Money." },
];

export function Trust() {
  const joinLink = whatsappLink(SOKOZIA_WHATSAPP, "Bonjour Sokozia, je veux devenir ambassadeur dans ma ville.");
  const pilotLink = whatsappLink(SOKOZIA_WHATSAPP, "Bonjour Sokozia, je suis commerçant(e) et je veux tester l'application.");
  return (
    <section id="confiance" className="scroll-mt-24 px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Ils vendent avec Sokozia"
          title="Des commerçants comme vous"
          text="Le bouche-à-oreille compte plus que tout. Voici ceux qui nous font confiance, et comment rejoindre l'aventure."
        />

        {TESTIMONIALS.length ? (
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1}>
                <GlowCard className="h-full p-6">
                  <p className="text-sm leading-relaxed">« {t.quote} »</p>
                  <div className="mt-6 flex items-center gap-3">
                    <img src={t.photo} alt={t.name} className="size-11 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted">{t.business} · {t.city}</p>
                    </div>
                  </div>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mt-14">
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
              <p className="max-w-xl text-text2">
                Nous cherchons nos <span className="text-text font-medium">50 premiers commerçants pilotes</span> : un mois offert en échange de votre avis, avec votre photo et le nom de votre boutique.
              </p>
              <a href={pilotLink} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-black">
                Devenir commerçant pilote
              </a>
            </div>
          </Reveal>
        )}

        <Reveal className="mt-6">
          <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0b0910] p-6 sm:p-10">
            <div aria-hidden className="absolute -top-32 right-0 size-[420px] rounded-full bg-accent/25 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
              <div>
                <p className="text-sm text-highlight">Programme ambassadeurs</p>
                <h3 className="mt-2 text-3xl font-medium tracking-tight">Gagnez de l&apos;argent en aidant les commerçants</h3>
                <p className="mt-3 text-sm text-text2 leading-relaxed">Étudiants, community managers, vendeurs : faites des démonstrations dans les marchés et touchez une commission sur chaque client.</p>
                <motion.a
                  href={joinLink}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-b from-highlight to-accent2 px-5 text-sm font-medium text-on-accent"
                >
                  Devenir ambassadeur
                </motion.a>
              </div>
              <ol className="grid gap-3 md:grid-cols-3">
                {AMBASSADOR_STEPS.map(({ icon: Icon, title, text }, i) => (
                  <li key={title} className="rounded-2xl border border-white/10 bg-black/40 p-5">
                    <span className="font-mono text-xs text-highlight">0{i + 1}</span>
                    <Icon className="mt-3 size-5 text-text2" />
                    <p className="mt-3 font-medium">{title}</p>
                    <p className="mt-1.5 text-sm text-text2 leading-relaxed">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-10 flex justify-center">
          <CtaButton href={DEMO_HREF}>Essayer la démo</CtaButton>
        </Reveal>
      </div>
    </section>
  );
}
