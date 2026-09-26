"use client";

import { ArrowRight, Check, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { TOTAL } from "./RevealScreens";
import { CtaBar, Img, MEDIA, ScreenTitle, type ProductInfo } from "./shared";

/* 20. Account (mock) */
export function AccountScreen({ product, onNext }: { product: ProductInfo; onNext: () => void }) {
  const isApple = typeof navigator !== "undefined" && /iPhone|iPad|Mac/i.test(navigator.userAgent);
  const google = <Button key="g" variant={isApple ? "secondary" : "primary"} size="lg" fullWidth onClick={onNext}>Continuer avec Google</Button>;
  const apple = <Button key="a" variant={isApple ? "primary" : "secondary"} size="lg" fullWidth onClick={onNext}>Continuer avec Apple</Button>;
  return (
    <div className="w-full max-w-sm">
      <div className="mx-auto size-20 rounded-2xl overflow-hidden border border-accent/50 shadow-glow mb-5">
        <Img src={product.image} alt={product.name} />
      </div>
      <ScreenTitle title="Sauvegardez votre campagne." subtitle={`Vos ${TOTAL} contenus sont prêts.`} />
      <div className="space-y-2.5">
        {isApple ? [apple, google] : [google, apple]}
        <Button variant="ghost" size="lg" fullWidth leftIcon={<Mail className="size-4" />} onClick={onNext}>Continuer avec un e-mail</Button>
      </div>
      <p className="text-[11px] text-muted text-center mt-4">En continuant, vous acceptez les conditions d&apos;utilisation de Sokozia.</p>
    </div>
  );
}

/* 21. Paywall */
const PLANS = [
  { id: "free", name: "Gratuit", price: "0 $", per: "", features: ["1 campagne", "10 contenus / mois", "Filigrane Sokozia"], cta: "Continuer à créer" },
  { id: "creator", name: "Creator", price: "12 $", per: "/mois", features: ["5 campagnes / mois", "150 contenus", "Vidéos UGC", "Sans filigrane"], cta: "Lancer ma campagne" },
  { id: "studio", name: "Studio", price: "29 $", per: "/mois", popular: true, features: ["Campagnes illimitées", "500 contenus", "Kit de marque", "Planification & calendrier"], cta: "Lancer ma campagne" },
  { id: "agency", name: "Agency", price: "59 $+", per: "/mois", features: ["Multi-marques", "Collaboration d'équipe", "Exports en marque blanche", "Support prioritaire"], cta: "Lancer ma campagne" },
];

export function PaywallScreen({ product, onFinish }: { product: ProductInfo; onFinish: (plan: string) => void }) {
  const [plan, setPlan] = useState("studio");
  const current = PLANS.find((p) => p.id === plan)!;
  return (
    <div className="w-full max-w-4xl">
      <div className="flex items-center gap-3 rounded-2xl bg-surface border border-border-strong p-3 max-w-md mx-auto mb-6">
        <div className="flex -space-x-3">
          {[product.image, MEDIA.photos[1], MEDIA.photos[2]].map((m, i) => (
            <div key={i} className="size-11 rounded-lg overflow-hidden border-2 border-surface"><Img src={m} /></div>
          ))}
        </div>
        <div className="text-sm"><p className="font-medium">Campagne · {product.name}</p><p className="text-xs text-muted">{TOTAL} contenus prêts à lancer</p></div>
      </div>
      <ScreenTitle title="Choisissez votre rythme." subtitle="Changez de formule à tout moment." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPlan(p.id)} aria-pressed={plan === p.id}
            className={cn("relative text-left rounded-2xl border p-4 transition-all",
              plan === p.id ? "bg-accent/12 border-accent/70 shadow-glow" : "bg-surface border-border-strong hover:border-white/25")}>
            {p.popular && <span className="absolute -top-2.5 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent">Populaire</span>}
            <p className="font-semibold">{p.name}</p>
            <p className="mt-1"><span className="text-2xl font-semibold">{p.price}</span><span className="text-xs text-muted">{p.per}</span></p>
            <ul className="mt-3 space-y-1.5">
              {p.features.map((f) => <li key={f} className="flex gap-1.5 text-xs text-text2"><Check className="size-3.5 text-highlight shrink-0" />{f}</li>)}
            </ul>
          </button>
        ))}
      </div>
      <CtaBar>
        <Button size="lg" onClick={() => onFinish(plan)} rightIcon={<ArrowRight className="size-4" />}>{current.cta}</Button>
      </CtaBar>
    </div>
  );
}
