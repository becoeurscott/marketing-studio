"use client";

import { Check, CreditCard, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useMoney } from "@/components/account/PaymentMethodPicker";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { MONTHLY_PLANS } from "@/lib/market";
import { cn, formatDate, formatNumber } from "@/lib/utils";

interface Current { plan: string | null; status: string; current_period_end: string | null }

/** Monthly passes paid by card (Stripe Checkout). Credits are added each paid month. */
export function SubscriptionPlans() {
  const money = useMoney();
  const toast = useToast();
  const [current, setCurrent] = useState<Current | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/billing/subscription", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then(setCurrent).catch(() => {});
  }, []);

  const active = current && ["active", "trialing", "past_due"].includes(current.status) ? current : null;

  const go = async (path: string, body?: object, key = path) => {
    setBusy(key);
    try {
      const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Réessayez.");
      window.location.href = data.url;
    } catch (e) {
      toast.error("Paiement indisponible", e instanceof Error ? e.message : undefined);
      setBusy(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Abonnements mensuels</h2>
          <p className="text-[13px] text-text2">Payés par carte. Vos crédits sont ajoutés chaque mois ; annulable à tout moment.</p>
        </div>
        {active && (
          <Button variant="secondary" size="sm" loading={busy === "portal"} leftIcon={<CreditCard className="size-4" />} onClick={() => void go("/api/billing/portal", undefined, "portal")}>
            Gérer mon abonnement
          </Button>
        )}
      </div>
      {active && (
        <p className="text-[13px] text-text2">
          Abonnement actuel : <span className="text-text font-medium">{MONTHLY_PLANS.find((p) => p.id === active.plan)?.name ?? active.plan}</span>
          {active.current_period_end ? ` · prochain renouvellement le ${formatDate(active.current_period_end)}` : ""}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {MONTHLY_PLANS.map((p) => {
          const mine = active?.plan === p.id;
          return (
            <div key={p.id} className={cn("relative flex flex-col rounded-2xl border p-5", p.popular ? "border-accent/50 bg-accent/10 shadow-glow" : "border-border bg-card")}>
              {p.popular && <span className="absolute -top-2.5 right-4 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-on-accent">Le plus pris</span>}
              <p className="font-semibold">{p.name}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{money(p.priceXof)}<span className="text-sm font-medium text-text2"> / mois</span></p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-text2">
                <li className="flex gap-2"><Sparkles className="mt-0.5 size-4 shrink-0 text-highlight" />{formatNumber(p.credits)} crédits chaque mois</li>
                <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-highlight" />{p.pitch}</li>
                <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-highlight" />Carte bancaire, sans engagement</li>
              </ul>
              <Button className="mt-5" fullWidth variant={p.popular ? "primary" : "secondary"} disabled={mine || !!active} loading={busy === p.id} onClick={() => void go("/api/billing/checkout", { plan: p.id }, p.id)}>
                {mine ? "Abonnement actuel" : active ? "Changer via « Gérer »" : "S’abonner"}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
