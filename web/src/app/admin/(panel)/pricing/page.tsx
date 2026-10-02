import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Badge, Card, CardHeader, ErrorBox, fmtNum, fmtUsd, fmtXof } from "@/components/admin/ui";
import { getSettings, requireAdmin } from "@/lib/admin/server";
import { runPricing, XOF_PER_USD } from "@/lib/admin/pricing";
import type { Estimate } from "@/lib/higgsfield/server";

export const dynamic = "force-dynamic";

export default async function AdminPricing() {
  let settings;
  try {
    await requireAdmin();
    settings = await getSettings();
  } catch (e) {
    return <><AdminTopBar title="Tarifs" /><ErrorBox message={e instanceof Error ? e.message : "erreur"} retryHref="/admin/pricing" /></>;
  }
  const [rows, candidates] = await runPricing();
  const okRows = rows.filter((r) => r.est.ok && r.est.usd !== undefined && r.est.credits);
  const usdPerHfCredit = okRows.length ? okRows.reduce((s, r) => s + r.est.usd!, 0) / okRows.reduce((s, r) => s + r.est.credits!, 0) : null;
  const priceXof = settings.xofPerCredit;

  const margin = (charge: number, est: Estimate) => {
    if (!est.ok || est.usd === undefined) return null;
    const revenue = charge * priceXof;
    const cost = est.usd * XOF_PER_USD;
    return { revenue, cost, pct: revenue > 0 ? ((revenue - cost) / revenue) * 100 : -100, breakEvenCredits: Math.ceil(cost / priceXof) };
  };

  return (
    <>
      <AdminTopBar
        title="Tarifs et marges"
        subtitle="Prix réels demandés à Higgsfield (estimation gratuite, rien n'est généré) comparés à ce que Sokozia facture"
        pill={`1 crédit Sokozia = ${fmtXof(priceXof)} · 1 $ = ${XOF_PER_USD} FCFA`}
      />

      <div className="grid gap-3 sm:grid-cols-3 mb-3">
        <Card><p className="text-[12px] text-muted">Coût réel d&apos;un crédit Higgsfield</p><p className="mt-1 text-2xl font-semibold">{usdPerHfCredit ? fmtUsd(usdPerHfCredit) : "—"}</p><p className="text-[11px] text-muted">Réglage actuel : {fmtUsd(settings.hfUsdPerCredit)}</p></Card>
        <Card><p className="text-[12px] text-muted">Scénarios estimés</p><p className="mt-1 text-2xl font-semibold">{okRows.length} / {rows.length}</p><p className="text-[11px] text-muted">Les autres ont renvoyé une erreur (voir le tableau)</p></Card>
        <Card><p className="text-[12px] text-muted">Prix de vente utilisé</p><p className="mt-1 text-2xl font-semibold">{fmtXof(priceXof)} / crédit</p><p className="text-[11px] text-muted">Modifiable dans « Higgsfield »</p></Card>
      </div>

      <Card className="p-0 sm:p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-[13px]">
            <thead className="bg-[#121212] text-left text-[11px] uppercase tracking-wide text-muted">
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 font-medium">Génération</th>
                <th className="px-4 py-3 font-medium text-right">Crédits Higgsfield</th>
                <th className="px-4 py-3 font-medium text-right">Coût réel</th>
                <th className="px-4 py-3 font-medium text-right">Facturé (cr. Sokozia)</th>
                <th className="px-4 py-3 font-medium text-right">Encaissé</th>
                <th className="px-4 py-3 font-medium text-right">Marge</th>
                <th className="px-4 py-3 font-medium text-right">Seuil (cr.)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const m = margin(r.charge, r.est);
                return (
                  <tr key={r.label} className="border-b border-white/[0.04]">
                    <td className="px-4 py-2.5">{r.label}<span className="block font-mono text-[10px] text-muted">{r.est.endpoint ?? ""}</span></td>
                    {r.est.ok ? (
                      <>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(r.est.credits ?? 0, 2)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtUsd(r.est.usd ?? 0)}<span className="block text-[11px] text-muted">{fmtXof(m!.cost)}</span></td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(r.charge)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtXof(m!.revenue)}</td>
                        <td className="px-4 py-2.5 text-right"><Badge tone={m!.pct >= 40 ? "green" : m!.pct >= 0 ? "yellow" : "red"}>{fmtNum(m!.pct, 0)} %</Badge></td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-text2">{fmtNum(m!.breakEvenCredits)}</td>
                      </>
                    ) : (
                      <td colSpan={6} className="px-4 py-2.5 text-[12px] text-danger">Estimation impossible{r.est.status ? ` (HTTP ${r.est.status})` : ""} : {r.est.error}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-3">
        <CardHeader title="Modèles candidats (Nano Banana, Seedream…)" />
        <p className="mb-3 text-[12px] text-muted">Test des noms de modèles possibles sur votre clé API. Une ligne verte = le modèle existe et voici son prix.</p>
        <ul className="space-y-1.5">
          {candidates.map((c) => (
            <li key={c.endpoint} className="flex flex-wrap items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2 text-[12px]">
              <Badge tone={c.est.ok ? "green" : "gray"}>{c.est.ok ? "Disponible" : `Non${c.est.status ? ` · ${c.est.status}` : ""}`}</Badge>
              <span className="text-text2">{c.label}</span>
              <span className="font-mono text-[11px] text-muted">{c.endpoint}</span>
              {c.est.ok && <span className="ml-auto font-medium">{fmtNum(c.est.credits ?? 0, 2)} cr. · {fmtUsd(c.est.usd ?? 0)} · {fmtXof((c.est.usd ?? 0) * XOF_PER_USD)}</span>}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
