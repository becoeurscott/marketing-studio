import { Wallet } from "lucide-react";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Ring } from "@/components/admin/charts";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { Card, CardHeader, ErrorBox, fmtDate, fmtNum, fmtUsd } from "@/components/admin/ui";
import { getSettings, higgsfieldBudget } from "@/lib/admin/server";

export default async function AdminSettings() {
  let settings, budget;
  try {
    settings = await getSettings();
    budget = await higgsfieldBudget(settings);
  } catch (e) {
    return <><AdminTopBar title="Higgsfield" /><ErrorBox message={e instanceof Error ? e.message : "erreur"} retryHref="/admin/settings" /></>;
  }
  const { updatedAt, updatedBy, ...values } = settings;

  return (
    <>
      <AdminTopBar title="Higgsfield et coûts" subtitle="Le budget restant est calculé à partir des crédits consommés depuis la dernière recharge" />
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader icon={<Wallet />} title="Budget Higgsfield" />
          <div className="flex items-center gap-5">
            <Ring pct={budget.configured ? 100 - budget.usedPct : 0} size={96} color={budget.low ? "#ef4444" : "#22c55e"} />
            <div>
              <p className="text-[12px] text-muted">Restant estimé</p>
              <p className={`text-3xl font-semibold tabular-nums ${budget.low ? "text-danger" : ""}`}>{budget.configured ? fmtUsd(budget.leftUsd) : "—"}</p>
              <p className="mt-1 text-[12px] text-text2">{fmtUsd(budget.spentUsd)} dépensés sur {fmtUsd(budget.budgetUsd)} depuis le {fmtDate(values.hfBudgetSince)}</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-2 text-[12px]">
            {[
              ["Crédits consommés (période)", `${fmtNum(budget.credits)} cr.`],
              ["Coût des générations", fmtUsd(budget.credits * values.hfUsdPerCredit)],
              ["Autres dépenses saisies", fmtUsd(values.hfOtherSpendUsd)],
              ["Seuil d'alerte", fmtUsd(values.hfAlertUsd)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white/[0.03] p-3"><dt className="text-muted">{k}</dt><dd className="mt-0.5 text-[14px] font-medium">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Higgsfield ne fournit pas de solde lisible par l&apos;app : ce montant est une estimation. Comparez-le de temps en temps avec le solde affiché sur votre compte Higgsfield
            et corrigez le coût par crédit si besoin. Les images générées depuis la route d&apos;administration (visuels du site) ne sont pas comptées : ajoutez-les dans « Autres dépenses ».
          </p>
        </Card>

        <Card>
          <CardHeader icon={<Wallet />} title="Réglages" />
          <SettingsForm initial={values} />
          {updatedAt && <p className="mt-4 text-[11px] text-muted">Dernière modification le {fmtDate(updatedAt, true)} par {updatedBy}</p>}
        </Card>
      </div>
    </>
  );
}
