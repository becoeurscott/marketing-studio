import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Clapperboard,
  Megaphone,
  Palette,
  PenLine,
  CalendarDays,
  Sparkles,
  Store,
  Users,
  Briefcase,
  Wand2,
} from "lucide-react";

export const metadata: Metadata = {
  title: { absolute: "Sokozia — Votre studio marketing IA" },
  description:
    "Photos produit, vidéos UGC, publicités et textes : Sokozia transforme votre produit en campagne marketing complète, en quelques minutes.",
  openGraph: {
    title: "Sokozia — Votre studio marketing IA",
    description: "Transformez votre produit en campagne marketing complète, en quelques minutes.",
    url: "https://sokozia.com",
    siteName: "Sokozia",
    locale: "fr_FR",
    type: "website",
  },
};

const DEMO_HREF = "/onboarding";

const STEPS = [
  { n: "01", title: "Montrez votre produit", text: "Importez une simple photo, ou décrivez votre idée en une phrase." },
  { n: "02", title: "Choisissez le style", text: "Luxe, minimaliste, lifestyle, UGC… Sokozia s'adapte à votre marque." },
  { n: "03", title: "Générez vos contenus", text: "Photos, vidéos, pubs et textes sortent prêts à publier." },
  { n: "04", title: "Lancez la campagne", text: "Organisez tout dans un calendrier et exportez pour chaque réseau." },
];

const FEATURES = [
  { icon: Camera, title: "Shooting produit IA", text: "Placez votre produit dans une salle de bain de luxe, sur une plage ou en studio, sans photographe." },
  { icon: Clapperboard, title: "Vidéos UGC", text: "Des créateurs virtuels présentent votre produit face caméra, comme sur TikTok." },
  { icon: Megaphone, title: "Publicités prêtes à tester", text: "Plusieurs variantes par plateforme : visuel, accroche, texte et bouton d'action." },
  { icon: PenLine, title: "Rédaction qui vend", text: "Accroches, légendes, descriptions produit et scripts dans le ton de votre marque." },
  { icon: CalendarDays, title: "Campagnes & calendrier", text: "De l'objectif à la planification : tout votre lancement au même endroit." },
  { icon: Palette, title: "Kit de marque", text: "Logo, couleurs et voix de marque appliqués automatiquement à chaque création." },
];

const AUDIENCES = [
  { icon: Store, title: "Vendeurs e-commerce", text: "Des visuels pro pour chaque produit, sans budget shooting." },
  { icon: Users, title: "Créateurs de contenu", text: "Publiez plus souvent, avec des idées qui ne s'épuisent jamais." },
  { icon: Briefcase, title: "Agences & freelances", text: "Livrez plus de campagnes à vos clients, plus vite." },
];

const PLATFORMS = ["TikTok", "Instagram", "Facebook", "YouTube", "Pinterest", "Google"];

export default function LandingPage() {
  return (
    <div lang="fr" className="min-h-dvh bg-bg text-text overflow-x-hidden">
      <SiteHeader />
      <main>
        <Hero />
        <PlatformStrip />
        <HowItWorks />
        <Features />
        <Audiences />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="size-7 rounded-md bg-gradient-to-br from-accent to-accent2 flex items-center justify-center">
        <Sparkles className="size-4 text-white" />
      </span>
      Sokozia
    </Link>
  );
}

function PrimaryCta({ className = "" }: { className?: string }) {
  return (
    <Link
      href={DEMO_HREF}
      className={`inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-accent text-white text-[15px] font-medium hover:bg-highlight transition-colors shadow-glow ${className}`}
    >
      Essayer la démo
      <ArrowRight className="size-4" />
    </Link>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm text-text2">
          <a href="#fonctionnement" className="hover:text-text transition-colors">Comment ça marche</a>
          <a href="#fonctionnalites" className="hover:text-text transition-colors">Fonctionnalités</a>
          <a href="#pour-qui" className="hover:text-text transition-colors">Pour qui</a>
        </nav>
        <Link
          href={DEMO_HREF}
          className="inline-flex items-center h-9 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
        >
          Essayer
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.25),transparent_65%)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-3 py-1 text-xs text-text2">
          <Wand2 className="size-3.5 text-highlight" />
          Studio marketing propulsé par l&apos;IA
        </span>
        <h1 className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto">
          De votre produit à une campagne complète,{" "}
          <span className="bg-gradient-to-r from-highlight to-accent bg-clip-text text-transparent">en quelques minutes.</span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-text2 max-w-2xl mx-auto">
          Photos produit, vidéos UGC, publicités et textes de vente. Sokozia crée tout le contenu dont votre marque a
          besoin, sans photographe, sans agence.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <PrimaryCta className="w-full sm:w-auto" />
          <a
            href="#fonctionnement"
            className="inline-flex items-center justify-center h-12 px-6 rounded-lg border border-border-strong bg-elevated text-[15px] font-medium hover:border-white/20 transition-colors w-full sm:w-auto"
          >
            Voir comment ça marche
          </a>
        </div>
        <p className="mt-4 text-xs text-muted">Démo gratuite · Aucune carte bancaire</p>
        <StudioMockup />
      </div>
    </section>
  );
}

/** Illustrative preview of the studio, drawn in CSS so the page needs no image assets. */
function StudioMockup() {
  const tiles = [
    "from-[#3b1d5c] via-[#7c3aed] to-[#c084fc]",
    "from-[#1c1c1c] via-[#4c1d95] to-[#a855f7]",
    "from-[#2e1065] via-[#6d28d9] to-[#f0abfc]",
    "from-[#101010] via-[#581c87] to-[#c084fc]",
  ];
  return (
    <div className="mt-16 mx-auto max-w-5xl rounded-2xl border border-border-strong bg-surface shadow-float overflow-hidden text-left">
      <div className="flex items-center gap-2 px-4 h-11 border-b border-border">
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="ml-3 text-xs text-muted truncate">Lancement Sérum Éclat · Studio</span>
      </div>
      <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((g, i) => (
          <div key={i} className={`relative aspect-[4/5] rounded-xl bg-gradient-to-br ${g} overflow-hidden`}>
            <div className="absolute inset-x-6 bottom-8 top-10 rounded-[40%_40%_12px_12px] bg-white/10 backdrop-blur-sm border border-white/15" />
            {i === 0 && (
              <span className="absolute top-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                Sélectionné
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-card p-2">
          <span className="flex-1 min-w-0 truncate px-2 text-sm text-text2">
            Une publicité luxe pour ce sérum, lumière dorée, fond marbre…
          </span>
          <span className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-accent text-white text-sm font-medium">
            <Sparkles className="size-4" />
            <span className="hidden sm:inline">Générer</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function PlatformStrip() {
  return (
    <section className="border-y border-border bg-surface/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-10">
        <p className="text-sm text-muted shrink-0">Des contenus prêts pour</p>
        <ul className="flex flex-wrap justify-center sm:justify-start gap-x-8 gap-y-3 text-text2 font-semibold">
          {PLATFORMS.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-medium text-highlight">{eyebrow}</p>
      <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">{title}</h2>
      {text && <p className="mt-4 text-text2">{text}</p>}
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="fonctionnement" className="scroll-mt-16 mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
      <SectionHeading
        eyebrow="Comment ça marche"
        title="Quatre étapes, zéro prise de tête."
        text="Pas besoin d'être designer ou marketeur. Sokozia vous guide de l'idée au contenu publié."
      />
      <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <li key={s.n} className="rounded-xl border border-border bg-card p-6">
            <span className="text-sm font-mono text-highlight">{s.n}</span>
            <h3 className="mt-4 font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-text2">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Features() {
  return (
    <section id="fonctionnalites" className="scroll-mt-16 border-t border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        <SectionHeading
          eyebrow="Fonctionnalités"
          title="Tout votre marketing, dans un seul studio."
          text="Arrêtez de jongler entre dix outils. Créez, organisez et exportez depuis un même espace."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-6">
              <span className="size-10 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
                <Icon className="size-5 text-highlight" />
              </span>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-text2">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Audiences() {
  return (
    <section id="pour-qui" className="scroll-mt-16 mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
      <SectionHeading eyebrow="Pour qui" title="Pensé pour ceux qui vendent." />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {AUDIENCES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-6">
            <Icon className="size-6 text-highlight" />
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-text2">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20 sm:pb-28">
      <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent2/30 via-card to-card px-6 py-14 sm:px-12 sm:py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-3xl mx-auto text-balance">
          Votre prochaine campagne commence ici.
        </h2>
        <p className="mt-4 text-text2 max-w-xl mx-auto">
          Découvrez le studio en quelques clics et voyez ce que Sokozia peut créer pour votre marque.
        </p>
        <PrimaryCta className="mt-8" />
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <Logo />
        <p>© {new Date().getFullYear()} Sokozia. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
