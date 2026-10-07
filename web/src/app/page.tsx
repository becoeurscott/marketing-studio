import type { Metadata } from "next";
import { Audiences, Faq, FinalCta, Platforms, Pricing, SiteFooter } from "@/components/landing/Closing";
import { Hero, SiteHeader } from "@/components/landing/Hero";
import { LandingMotion } from "@/components/landing/LandingMotion";
import { PromoCalendar, Terrain, Trust, WhatsAppSection } from "@/components/landing/Local";
import { Benefits, Creations, Process, UseCases } from "@/components/landing/Showcase";
import { StylesShowcase } from "@/components/landing/StylesShowcase";
import { UgcShowcase } from "@/components/landing/UgcShowcase";
import { Problem, Services, Solution } from "@/components/landing/Story";

export const metadata: Metadata = {
  title: { absolute: "Marketing Studio — Votre studio marketing IA" },
  description:
    "Photos produit, vidéos UGC, statuts WhatsApp et pubs avec vos prix en FCFA : le studio marketing IA des commerçants africains. Dès 1 000 FCFA, en Mobile Money.",
  openGraph: {
    title: "Marketing Studio — Votre studio marketing IA",
    description: "Transformez votre produit en campagne marketing complète, en quelques minutes.",
    url: "https://sokozia.vercel.app",
    siteName: "Marketing Studio",
    locale: "fr_FR",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <LandingMotion>
      <div lang="fr" className="min-h-dvh overflow-x-clip bg-bg text-text">
        <SiteHeader />
        <main>
          <Hero />
          <Problem />
          <Solution />
          <Services />
          <Benefits />
          <WhatsAppSection />
          <Creations />
          <UgcShowcase />
          <StylesShowcase />
          <UseCases />
          <Process />
          <Terrain />
          <PromoCalendar />
          <Audiences />
          <Trust />
          <Pricing />
          <Faq />
          <Platforms />
          <FinalCta />
        </main>
        <SiteFooter />
      </div>
    </LandingMotion>
  );
}
