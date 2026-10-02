"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useMoney } from "@/components/account/PaymentMethodPicker";
import { cn } from "@/lib/utils";
import { TOP_UP_PACKS, USAGE_PACKS } from "@/lib/market";
import { TOTAL } from "./RevealScreens";
import { CtaBar, Img, MEDIA, ScreenTitle, type ProductInfo } from "./shared";

/* 21. Paywall: credit packs paid in Mobile Money (no subscription). */
const PACKS = [...USAGE_PACKS, ...TOP_UP_PACKS];

export function PaywallScreen({ product, onFinish }: { product: ProductInfo; onFinish: (packId: string | null) => void }) {
  const [plan, setPlan] = useState(USAGE_PACKS.find((p) => p.popular)?.id ?? USAGE_PACKS[0].id);
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
      <ScreenTitle title="Gardez votre élan." subtitle="Vos 50 crédits offerts sont déjà là. Rechargez en Mobile Money quand vous voulez, sans abonnement." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {PACKS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPlan(p.id)} aria-pressed={plan === p.id}
            className={cn("relative text-left rounded-2xl border p-4 transition-all",
              plan === p.id ? "bg-accent/12 border-accent/70 shadow-glow" : "bg-surface border-border-strong hover:border-white/25")}>
            {p.popular && <span className="absolute -top-2.5 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-on-accent">Populaire</span>}
            <p className="font-semibold">{p.name}</p>
            <p className="mt-1"><span className="text-2xl font-semibold">{money(p.priceXof)}</span></p>
            <p className="mt-2 flex gap-1.5 text-xs text-text2"><Check className="size-3.5 text-highlight shrink-0" />{p.credits.toLocaleString("fr-FR")} crédits</p>
            <p className="mt-1 flex gap-1.5 text-xs text-text2"><Check className="size-3.5 text-highlight shrink-0" />{p.pitch}</p>
          </button>
        ))}
      </div>
      <CtaBar>
        <Button size="lg" variant="ghost" onClick={() => onFinish(null)}>Continuer avec mes crédits offerts</Button>
        <Button size="lg" onClick={() => onFinish(plan)} rightIcon={<ArrowRight className="size-4" />}>Recharger en Mobile Money</Button>
      </CtaBar>
    </div>
  );
}
