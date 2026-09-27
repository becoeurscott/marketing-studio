"use client";

import { ArrowRight, Check, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useMoney } from "@/components/account/PaymentMethodPicker";
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
/** Prices in FCFA, shown in the user's currency. "free" = pay-as-you-go pack, no subscription. */
const PLANS = [
  { id: "free", name: "Pack Découverte", priceXof: 1000, per: " sans abonnement", features: ["5 visuels", "Paiement Mobile Money", "Sans engagement"], cta: "Commencer avec 5 visuels" },
  { id: "creator", name: "Creator", priceXof: 14900, per: "/mois", features: ["1 000 crédits / mois", "Vidéos UGC", "Statuts et catalogue WhatsApp", "Sans filigrane"], cta: "Lancer ma campagne" },
  { id: "studio", name: "Studio", priceXof: 29900, per: "/mois", popular: true, features: ["Campagnes illimitées", "3 000 crédits / mois", "Calendrier des fêtes", "Flyers imprimables"], cta: "Lancer ma campagne" },
  { id: "agency", name: "Agency", priceXof: 79900, per: "/mois", features: ["Multi-marques", "Collaboration d'équipe", "Exports en marque blanche", "Support prioritaire"], cta: "Lancer ma campagne" },
];

export function PaywallScreen({ product, onFinish }: { product: ProductInfo; onFinish: (plan: string) => void }) {
  const [plan, setPlan] = useState("studio");
  const current = PLANS.find((p) => p.id === plan)!;
  const money = useMoney();
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
      <ScreenTitle title="Choisissez votre rythme." subtitle="Payez en Mobile Money. Changez de formule à tout moment." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPlan(p.id)} aria-pressed={plan === p.id}
            className={cn("relative text-left rounded-2xl border p-4 transition-all",
              plan === p.id ? "bg-accent/12 border-accent/70 shadow-glow" : "bg-surface border-border-strong hover:border-white/25")}>
            {p.popular && <span className="absolute -top-2.5 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent">Populaire</span>}
            <p className="font-semibold">{p.name}</p>
            <p className="mt-1"><span className="text-2xl font-semibold">{money(p.priceXof)}</span><span className="text-xs text-muted">{p.per}</span></p>
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
