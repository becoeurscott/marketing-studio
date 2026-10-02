"use client";

import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { useMoney } from "@/components/account/PaymentMethodPicker";
import { TOP_UP_PACKS, USAGE_PACKS } from "@/lib/market";
import { cn, formatNumber } from "@/lib/utils";

/** Credit packs paid in Mobile Money: no subscription, credits never expire. */
export default function PricingPage() {
  const money = useMoney();
  const packs = [...USAGE_PACKS, ...TOP_UP_PACKS];
  return (
    <>
      <PageHeader title="Tarifs" description="Sans abonnement : achetez des crédits en Mobile Money quand vous en avez besoin. Ils n'expirent pas." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {packs.map((p) => (
          <div key={p.id} className={cn("relative flex flex-col rounded-2xl border p-5", p.popular ? "border-accent/50 bg-accent/10 shadow-glow" : "border-border bg-card")}>
            {p.popular && <span className="absolute -top-2.5 right-4 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-on-accent">Le plus pris</span>}
            <p className="font-semibold">{p.name}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{money(p.priceXof)}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-text2">
              <li className="flex gap-2"><Sparkles className="mt-0.5 size-4 shrink-0 text-highlight" />{formatNumber(p.credits)} crédits</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-highlight" />{p.pitch}</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-highlight" />Paiement Mobile Money</li>
            </ul>
            <Link href={`/credits?pack=${p.id}`} className="mt-5"><Button fullWidth variant={p.popular ? "primary" : "secondary"}>Acheter</Button></Link>
          </div>
        ))}
      </div>
    </>
  );
}
