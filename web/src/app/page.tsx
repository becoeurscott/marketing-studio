import type { Metadata } from "next";
import { Faq, FinalCta, Pricing, SiteFooter } from "@/components/landing/Closing";
import { Hero, SiteHeader } from "@/components/landing/Hero";
import { LandingMotion } from "@/components/landing/LandingMotion";
import { StylesShowcase } from "@/components/landing/StylesShowcase";
import { UgcShowcase } from "@/components/landing/UgcShowcase";
import { VideoPresetsShowcase } from "@/components/landing/VideoPresetsShowcase";

export const metadata: Metadata = {
  title: { absolute: "Marketing Studio — Votre studio marketing IA" },
  description: "Transformez une photo produit en publicité prête pour WhatsApp, TikTok et Facebook.",
  openGraph: {
    title: "Marketing Studio — Votre studio marketing IA",
    description: "Une photo. Un style. Une publicité prête à vendre.",
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
          <UgcShowcase />
          <VideoPresetsShowcase />
          <StylesShowcase />
          <Pricing />
          <Faq />
          <FinalCta />
        </main>
        <SiteFooter />
      </div>
    </LandingMotion>
  );
}
