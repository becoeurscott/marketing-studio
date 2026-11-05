import { CheckCircle2, Clock, Repeat, Wallet } from "lucide-react";
import Link from "next/link";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Badge, Card, Empty, ErrorBox, KpiCard, Pager, SearchForm, Segmented, fmtDate, fmtNum, fmtXof } from "@/components/admin/ui";
import { listPayments } from "@/lib/admin/server";

const PAGE_SIZE = 40;
const FILTERS = [
  { key: "all", label: "Tous" },
  { key: "completed", label: "Payés" },
  { key: "pending", label: "En attente" },
  { key: "failed", label: "Échoués" },
];
const TONE: Record<string, string> = { completed: "green", pending: "yellow", failed: "red" };

export default async function AdminPayments({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = str("q"), status = str("status");
  const page = Math.max(0, Number(sp.page) || 0);
  const qs = (p: Record<string, string | number>) => "/admin/payments?" + new URLSearchParams(Object.entries({ q, status, ...p }).filter(([, v]) => String(v) !== "" && String(v) !== "0").map(([k, v]) => [k, String(v)])).toString();

  let res;
  try {
    res = await listPayments({ query: q, status, page, pageSize: PAGE_SIZE });
  } catch (e) {
    return <><AdminTopBar title="Paiements" /><ErrorBox message={e instanceof Error ? e.message : "erreur"} retryHref={qs({ page })} /></>;
  }
  const s = res.summary;
  const onboardPct = s.accounts ? Math.round((s.onboarded / s.accounts) * 100) : 0;

  return (
    <>
      <AdminTopBar title="Paiements" pill={`${fmtNum(res.total)} paiements`} subtitle="Achats de crédits (Mobile Money / carte), abonnements et onboarding" />
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<Wallet />} title="Revenu 30 jours" value={fmtXof(s.revenueXof30)} sub={`${fmtXof(s.revenueXofAll)} au total`} />
        <KpiCard icon={<CheckCircle2 />} title="Paiements réussis (30 j)" value={fmtNum(s.completed30)} sub={`${fmtNum(s.buyers)} acheteurs · ${fmtNum(s.failed30)} échecs`} />
        <KpiCard icon={<Clock />} title="En attente" value={fmtNum(s.pending)} sub="Non confirmés par le prestataire" />
        <KpiCard icon={<Repeat />} title="Abonnements actifs" value={fmtNum(s.activeSubs)} sub={`Onboarding terminé : ${onboardPct} % (${fmtNum(s.onboarded)}/${fmtNum(s.accounts)})`} />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchForm action="/admin/payments" query={q} placeholder="E-mail, pack ou ID…" hidden={{ status }} />
        <Segmented active={status || "all"} items={FILTERS.map((f) => ({ key: f.key, label: f.label, href: qs({ status: f.key === "all" ? "" : f.key, page: 0 }) }))} />
      </div>
      <Card className="p-0 sm:p-0 overflow-hidden">
        {res.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead className="bg-[#121212] text-left text-[11px] uppercase tracking-wide text-muted">
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Compte</th>
                  <th className="px-4 py-3 font-medium">Pack</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Pays / moyen</th>
                  <th className="px-4 py-3 font-medium text-right">Crédits</th>
                  <th className="px-4 py-3 font-medium text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {res.items.map((p) => (
                  <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5 text-text2 whitespace-nowrap">{fmtDate(p.created_at, true)}</td>
                    <td className="px-4 py-2.5"><Link href={`/admin/users/${p.user_id}`} className="hover:underline">{p.email ?? p.user_id.slice(0, 8)}</Link></td>
                    <td className="px-4 py-2.5 text-text2">{p.pack_id}</td>
                    <td className="px-4 py-2.5"><Badge tone={TONE[p.status] ?? "gray"}>{FILTERS.find((f) => f.key === p.status)?.label ?? p.status}</Badge></td>
                    <td className="px-4 py-2.5 text-text2">{p.country}{p.provider ? ` · ${p.provider}` : ""}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(p.credits)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                      {fmtNum(p.amount)} {p.currency}
                      {p.currency !== "XOF" && <span className="block text-[11px] font-normal text-muted">≈ {fmtXof(p.amount_xof)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty>Aucun paiement ne correspond.</Empty>}
      </Card>
      <Pager page={page} pageSize={PAGE_SIZE} total={res.total} href={(p) => qs({ page: p })} />
    </>
  );
}
