"use client";

import { ArrowDownRight, ArrowUpRight, Check, CreditCard, Gift, History, Image as ImageIcon, Megaphone, Sparkles, Video, Wand2, Camera, Type, Users, Download, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader, Section } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/ui/FilterBar";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { PaymentMethodPicker, isPaymentReady, paymentSummary, useMoney, usePaymentChoice } from "@/components/account/PaymentMethodPicker";
import { plans } from "@/data";
import { delay } from "@/lib/api";
import { useStore } from "@/lib/store";
import { TOP_UP_PACKS, USAGE_PACKS, type UsagePack } from "@/lib/market";
import { CREDIT_COSTS, type CreditAction } from "@/lib/types";
import { cn, formatDate, formatNumber, timeAgo } from "@/lib/utils";

const ACTION_META: Record<CreditAction, { label: string; icon: LucideIcon }> = {
  image: { label: "Image", icon: ImageIcon },
  video: { label: "Vidéo", icon: Video },
  upscale: { label: "Upscale", icon: Wand2 },
  copy: { label: "Texte", icon: Type },
  ads: { label: "Publicités", icon: Megaphone },
  ugc: { label: "UGC", icon: Users },
  "product-shoot": { label: "Shooting produit", icon: Camera },
  export: { label: "Export", icon: Download },
  purchase: { label: "Achat", icon: CreditCard },
  bonus: { label: "Bonus", icon: Gift },
};

const COST_ROWS: (keyof typeof CREDIT_COSTS)[] = ["image", "video", "upscale", "ugc", "product-shoot", "ads", "copy"];
type HistoryFilter = "all" | "spent" | "added";
type Pack = UsagePack;
const PACKS: Pack[] = [...USAGE_PACKS, ...TOP_UP_PACKS];

export default function CreditsPage() {
  const credits = useStore((s) => s.credits);
  const plan = useStore((s) => s.plan);
  const transactions = useStore((s) => s.transactions);
  const buyCredits = useStore((s) => s.buyCredits);
  const toast = useToast();
  const money = useMoney();
  const [payment, setPayment] = usePaymentChoice();

  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [pack, setPack] = useState<Pack | null>(null);
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState<Pack | null>(null);

  const planInfo = plans.find((p) => p.id === plan) ?? plans[1];
  const monthly = planInfo.credits;
  const pct = Math.min(100, Math.round((credits / Math.max(monthly, credits)) * 100));
  const low = credits < 200;

  const [cutoff] = useState(() => Date.now() - 30 * 86400000);
  const spentThisMonth = useMemo(
    () => transactions.filter((t) => t.amount < 0 && new Date(t.createdAt).getTime() > cutoff).reduce((s, t) => s + Math.abs(t.amount), 0),
    [transactions, cutoff],
  );

  const list = useMemo(() => transactions.filter((t) => (filter === "all" ? true : filter === "spent" ? t.amount < 0 : t.amount > 0)), [transactions, filter]);
  const counts = { all: transactions.length, spent: transactions.filter((t) => t.amount < 0).length, added: transactions.filter((t) => t.amount > 0).length };

  const confirmBuy = async () => {
    if (!pack) return;
    setBuying(true);
    await delay(900, 1400);
    buyCredits(pack.credits, `${pack.name} · ${money(pack.priceXof)} via ${paymentSummary(payment)}`);
    setBuying(false);
    setSuccess(pack);
    setPack(null);
    toast.success("Crédits ajoutés", `+${formatNumber(pack.credits)} crédits`);
  };

  return (
    <>
      <PageHeader title="Crédits" description="Chaque génération consomme des crédits. Rechargez dès 1 000 FCFA, en Mobile Money." />

      {/* Balance hero */}
      <Card elevated className="relative overflow-hidden mb-6">
        <div className="absolute -top-24 -right-24 size-64 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end gap-6">
          <div className="flex-1">
            <p className="text-[13px] text-text2 flex items-center gap-1.5"><Sparkles className="size-3.5 text-highlight" /> Solde disponible</p>
            <p className="text-5xl md:text-6xl font-bold tracking-tight mt-1 tabular-nums">{formatNumber(credits)}</p>
            <div className="mt-4 max-w-md">
              <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", low ? "bg-warning" : "bg-accent")} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[12px] text-muted mt-1.5">
                {low ? "Solde faible. Chaque génération vidéo coûte 50 crédits." : `${formatNumber(monthly)} crédits inclus chaque mois avec ${planInfo.name}.`}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:w-[300px]">
            <Stat label="Dépensés · 30 jours" value={formatNumber(spentThisMonth)} />
            <Stat label="Forfait" value={planInfo.name} sub={<Link href="/pricing" className="text-highlight hover:underline">Changer</Link>} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div>
          {/* Buy packs */}
          <Section title="Recharger" description="Sans abonnement. Paiement simulé dans ce prototype.">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {PACKS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPack(p)}
                  className={cn("relative text-left rounded-lg border p-4 transition-colors hover:border-white/20", p.popular ? "bg-accent/8 border-accent/50" : "bg-card border-border")}
                >
                  {p.popular && <Badge tone="accent" className="absolute top-3 right-3">Le plus pris</Badge>}
                  <p className="text-[13px] text-text2">{p.name}</p>
                  <p className="text-2xl font-bold tracking-tight tabular-nums mt-0.5">{money(p.priceXof)}</p>
                  <p className="text-[13px] mt-1">{p.pitch}</p>
                  <p className="text-[11px] text-muted mt-2">{formatNumber(p.credits)} crédits{p.validityDays ? ` · valables ${p.validityDays} jours` : ""}</p>
                </button>
              ))}
            </div>
          </Section>

          {/* History */}
          <Section title="Historique d’utilisation" action={<FilterBar options={[{ value: "all", label: "Tout", count: counts.all }, { value: "spent", label: "Dépensés", count: counts.spent }, { value: "added", label: "Ajoutés", count: counts.added }]} value={filter} onChange={setFilter} />}>
            {list.length ? (
              <Card padded={false} className="divide-y divide-border">
                {list.map((t) => {
                  const meta = ACTION_META[t.action];
                  const Icon = meta.icon;
                  const add = t.amount > 0;
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <span className={cn("size-9 rounded-md flex items-center justify-center shrink-0", add ? "bg-success/12 text-success" : "bg-elevated text-text2")}>
                        <Icon className="size-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.description}</p>
                        <p className="text-[12px] text-muted">{meta.label} · {timeAgo(t.createdAt)} · {formatDate(t.createdAt)}</p>
                      </div>
                      <span className={cn("text-sm font-semibold tabular-nums inline-flex items-center gap-0.5", add ? "text-success" : "text-text")}>
                        {add ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5 text-muted" />}
                        {add ? "+" : ""}{formatNumber(t.amount)}
                      </span>
                    </div>
                  );
                })}
              </Card>
            ) : (
              <EmptyState compact icon={History} title="Aucune activité pour le moment" description="Vos générations et achats apparaîtront ici." cta={{ label: "Ouvrir le Studio", href: "/studio" }} />
            )}
          </Section>
        </div>

        {/* Cost table */}
        <div className="lg:sticky lg:top-20 self-start">
          <Card>
            <h3 className="text-[15px] font-semibold mb-1">Coût des actions</h3>
            <p className="text-[13px] text-text2 mb-3">Par génération. Les exports sont gratuits.</p>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {COST_ROWS.map((k) => {
                  const meta = ACTION_META[k];
                  const Icon = meta.icon;
                  return (
                    <tr key={k}>
                      <td className="py-2.5 flex items-center gap-2 text-text2"><Icon className="size-4" />{meta.label}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">{CREDIT_COSTS[k]} <span className="text-muted font-normal text-[12px]">cr</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[12px] text-muted mt-3">Avec {formatNumber(credits)} crédits, vous pouvez créer environ {formatNumber(Math.floor(credits / CREDIT_COSTS.image))} images ou {formatNumber(Math.floor(credits / CREDIT_COSTS.video))} vidéos.</p>
          </Card>
        </div>
      </div>

      {/* Confirm purchase */}
      <Modal
        open={!!pack}
        onClose={() => !buying && setPack(null)}
        title="Confirmer l’achat"
        description="Paiement simulé : aucun montant n’est débité."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPack(null)} disabled={buying}>Annuler</Button>
            <Button onClick={confirmBuy} loading={buying} disabled={!isPaymentReady(payment)} leftIcon={<CreditCard className="size-4" />}>Payer {pack && money(pack.priceXof)}</Button>
          </>
        }
      >
        {pack && (
          <div className="space-y-3">
            <div className="rounded-md bg-surface border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text2">Pack</span><span className="font-medium">{pack.name}</span></div>
              <div className="flex justify-between"><span className="text-text2">Crédits</span><span className="font-medium">+{formatNumber(pack.credits)}{pack.validityDays ? ` · ${pack.validityDays} jours` : ""}</span></div>
              <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-text2">Nouveau solde</span><span className="font-semibold">{formatNumber(credits + pack.credits)}</span></div>
            </div>
            <PaymentMethodPicker value={payment} onChange={setPayment} />
          </div>
        )}
      </Modal>

      {/* Success */}
      <Modal open={!!success} onClose={() => setSuccess(null)} size="sm">
        <div className="pt-6 text-center">
          <div className="mx-auto size-14 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mb-4">
            <Check className="size-6 text-success" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Crédits ajoutés</h2>
          <p className="text-sm text-text2 mt-1">+{formatNumber(success?.credits ?? 0)} crédits. Votre solde est désormais de <span className="text-text font-medium">{formatNumber(credits)}</span>.</p>
          <div className="mt-5 flex flex-col gap-2">
            <Link href="/studio"><Button fullWidth leftIcon={<Wand2 className="size-4" />}>Commencer à créer</Button></Link>
            <Button fullWidth variant="ghost" onClick={() => setSuccess(null)}>Terminé</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="rounded-md bg-surface/60 border border-border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="text-xl font-bold tracking-tight mt-0.5 tabular-nums">{value}</p>
      {sub && <p className="text-[12px] mt-0.5">{sub}</p>}
    </div>
  );
}
