"use client";

import { ArrowRight, Check, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { planRank } from "@/components/account/PaywallModal";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { plans } from "@/data";
import { delay } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { Plan } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";

type Cycle = "monthly" | "yearly";
const YEARLY_DISCOUNT = 0.2;

const FEATURE_ROWS: { key: keyof Plan["features"]; label: string }[] = [
  { key: "generations", label: "Générations IA" },
  { key: "projects", label: "Projets" },
  { key: "brandKits", label: "Kits de marque" },
  { key: "campaigns", label: "Campagnes" },
  { key: "videoGenerations", label: "Générations vidéo" },
  { key: "teamMembers", label: "Membres de l’équipe" },
];

const CYCLE_LABELS: Record<Cycle, string> = { monthly: "Mensuel", yearly: "Annuel" };

const priceFor = (p: Plan, cycle: Cycle) => (cycle === "yearly" ? Math.round(p.priceMonthly * (1 - YEARLY_DISCOUNT)) : p.priceMonthly);

export default function PricingPage() {
  const current = useStore((s) => s.plan);
  const setPlan = useStore((s) => s.setPlan);
  const buyCredits = useStore((s) => s.buyCredits);
  const toast = useToast();

  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [target, setTarget] = useState<Plan | null>(null);
  const [working, setWorking] = useState(false);
  const [success, setSuccess] = useState<Plan | null>(null);

  const confirm = async () => {
    if (!target) return;
    setWorking(true);
    await delay(900, 1400);
    const upgrade = planRank(target.id) > planRank(current);
    setPlan(target.id);
    if (upgrade) buyCredits(target.credits, `Crédits du forfait ${target.name}`);
    setWorking(false);
    setSuccess(target);
    setTarget(null);
    toast.success(upgrade ? `Vous êtes passé à ${target.name}` : `Forfait changé pour ${target.name}`);
  };

  return (
    <>
      <PageHeader
        title="Forfaits et tarifs"
        description="Choisissez le forfait adapté à votre rythme de création. Modifiable ou résiliable à tout moment."
        actions={
          <div className="inline-flex items-center p-1 rounded-full bg-surface border border-border">
            {(["monthly", "yearly"] as Cycle[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCycle(c)}
                aria-pressed={cycle === c}
                className={cn("h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors", cycle === c ? "bg-elevated text-text border border-border-strong" : "text-text2 hover:text-text")}
              >
                {CYCLE_LABELS[c]} {c === "yearly" && <span className="text-success text-[11px] ml-1">−20%</span>}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {plans.map((p) => {
          const isCurrent = p.id === current;
          const rank = planRank(p.id) - planRank(current);
          const price = priceFor(p, cycle);
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-xl border p-5 bg-card",
                p.popular ? "border-accent/60 shadow-glow" : "border-border",
                isCurrent && "ring-1 ring-success/40",
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-base font-semibold">{p.name}</h3>
                {isCurrent ? <Badge tone="success" dot>Forfait actuel</Badge> : p.popular ? <Badge tone="accent">Le plus populaire</Badge> : null}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight tabular-nums">{price} $</span>
                <span className="text-sm text-text2">/mois</span>
              </div>
              <p className="text-[12px] text-muted mt-1 h-4">{cycle === "yearly" ? `Facturé ${price * 12} $/an` : "Facturé mensuellement"}</p>
              <p className="text-[13px] text-text2 mt-3 flex items-center gap-1.5"><Sparkles className="size-3.5 text-highlight" />{formatNumber(p.credits)} crédits / mois</p>

              <ul className="mt-4 space-y-2 text-[13px]">
                {FEATURE_ROWS.map((f) => (
                  <li key={f.key} className="flex items-start gap-2 text-text2"><Check className="size-3.5 text-success shrink-0 mt-0.5" /><span>{p.features[f.key]}</span></li>
                ))}
              </ul>
              <div className="my-4 border-t border-border" />
              <ul className="space-y-1.5 text-[13px] text-text2 flex-1">
                {p.highlights.map((h) => <li key={h} className="flex items-start gap-2"><ArrowRight className="size-3.5 text-muted shrink-0 mt-0.5" />{h}</li>)}
              </ul>

              <Button
                className="mt-5"
                fullWidth
                variant={isCurrent ? "secondary" : rank > 0 ? "primary" : "ghost"}
                disabled={isCurrent}
                onClick={() => setTarget(p)}
              >
                {isCurrent ? "Votre forfait" : rank > 0 ? `Passer à ${p.name}` : `Basculer vers ${p.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-surface/50 p-5 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-5 text-[13px] text-text2">
        <div><p className="text-text font-medium mb-1">À quoi servent les crédits ?</p>Chaque génération consomme des crédits : 10 par image, 50 par vidéo, 15 par upscale. Les crédits mensuels sont ajoutés au renouvellement de votre forfait ; les recharges n’expirent jamais.</div>
        <div><p className="text-text font-medium mb-1">Puis-je changer de forfait ?</p>Oui : une montée en gamme s’applique immédiatement et vous recevez tout de suite les crédits du nouveau forfait. Une rétrogradation s’applique au prochain renouvellement.</div>
        <div><p className="text-text font-medium mb-1">Besoin de plus ?</p>Achetez un pack ponctuel sur la page <Link href="/credits" className="text-highlight hover:underline">Crédits</Link>, ou contactez-nous pour un volume Entreprise.</div>
      </div>

      {/* Upgrade modal */}
      <Modal
        open={!!target}
        onClose={() => !working && setTarget(null)}
        title={target && planRank(target.id) > planRank(current) ? `Passer à ${target?.name}` : `Basculer vers ${target?.name}`}
        description="Paiement simulé : aucun montant n’est débité."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTarget(null)} disabled={working}>Annuler</Button>
            <Button onClick={confirm} loading={working}>Confirmer</Button>
          </>
        }
      >
        {target && (
          <div className="space-y-3">
            <div className="rounded-md bg-surface border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text2">Forfait</span><span className="font-medium">{target.name}</span></div>
              <div className="flex justify-between"><span className="text-text2">Facturation</span><span className="font-medium">{CYCLE_LABELS[cycle]}</span></div>
              <div className="flex justify-between"><span className="text-text2">Prix</span><span className="font-medium">{priceFor(target, cycle)} $/mois{cycle === "yearly" && ` · ${priceFor(target, cycle) * 12} $/an`}</span></div>
              <div className="flex justify-between"><span className="text-text2">Paiement</span><span className="font-medium">Visa •••• 4242</span></div>
              <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-text2">Crédits ajoutés maintenant</span><span className="font-semibold">{planRank(target.id) > planRank(current) ? `+${formatNumber(target.credits)}` : "Au renouvellement"}</span></div>
            </div>
            <ul className="text-[13px] text-text2 space-y-1">
              {target.highlights.map((h) => <li key={h} className="flex items-center gap-2"><Check className="size-3.5 text-success" />{h}</li>)}
            </ul>
          </div>
        )}
      </Modal>

      {/* Success screen */}
      <Modal open={!!success} onClose={() => setSuccess(null)} size="sm">
        <div className="pt-6 text-center">
          <div className="mx-auto size-14 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mb-4">
            <Check className="size-6 text-success" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Bienvenue dans {success?.name}</h2>
          <p className="text-sm text-text2 mt-1">Votre abonnement est actif. {success && `${formatNumber(success.credits)} crédits par mois, dès maintenant.`}</p>
          <div className="mt-5 flex flex-col gap-2">
            <Link href="/studio"><Button fullWidth leftIcon={<Wand2 className="size-4" />}>Commencer à créer</Button></Link>
            <Button fullWidth variant="ghost" onClick={() => setSuccess(null)}>Terminé</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
