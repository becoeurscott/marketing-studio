import Link from "next/link";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { ACTION_LABEL, Badge, Card, Empty, ErrorBox, Pager, SearchForm, Segmented, fmtDate, fmtNum } from "@/components/admin/ui";
import { listLedger } from "@/lib/admin/server";

const PAGE_SIZE = 40;
const FILTERS = ["all", "purchase", "bonus", "admin", "refund", "image", "video"];

export default async function AdminCredits({ searchParams }: PageProps<"/admin/credits">) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = str("q"), action = str("action"), user = str("user");
  const page = Math.max(0, Number(sp.page) || 0);
  const qs = (p: Record<string, string | number>) => "/admin/credits?" + new URLSearchParams(Object.entries({ q, action, user, ...p }).filter(([, v]) => String(v) !== "" && String(v) !== "0").map(([k, v]) => [k, String(v)])).toString();

  let res;
  try {
    res = await listLedger({ query: q, action, userId: /^[0-9a-f-]{36}$/i.test(user) ? user : undefined, page, pageSize: PAGE_SIZE });
  } catch (e) {
    return <><AdminTopBar title="Crédits" /><ErrorBox message={e instanceof Error ? e.message : "erreur"} retryHref={qs({ page })} /></>;
  }

  return (
    <>
      <AdminTopBar title="Crédits" pill={`${fmtNum(res.total)} mouvements`} subtitle="Historique complet : achats, bonus, consommations, remboursements et ajustements" />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchForm action="/admin/credits" query={q} placeholder="E-mail ou description…" hidden={{ action, user }} />
        <Segmented active={action || "all"} items={FILTERS.map((k) => ({ key: k, label: k === "all" ? "Tous" : ACTION_LABEL[k] ?? k, href: qs({ action: k === "all" ? "" : k, page: 0 }) }))} />
        {user && <Link href={qs({ user: "", page: 0 })} className="rounded-lg border border-white/10 px-3 py-1.5 text-[12px] text-text2 hover:text-text">× Filtre utilisateur</Link>}
      </div>
      <Card className="p-0 sm:p-0 overflow-hidden">
        {res.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead className="bg-[#121212] text-left text-[11px] uppercase tracking-wide text-muted">
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Compte</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium text-right">Montant</th>
                  <th className="px-4 py-3 font-medium text-right">Solde après</th>
                </tr>
              </thead>
              <tbody>
                {res.items.map((l) => (
                  <tr key={l.id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5 text-text2 whitespace-nowrap">{fmtDate(l.created_at, true)}</td>
                    <td className="px-4 py-2.5"><Link href={`/admin/users/${l.user_id}`} className="hover:underline">{l.email ?? l.user_id.slice(0, 8)}</Link></td>
                    <td className="px-4 py-2.5"><Badge tone={l.amount >= 0 ? "green" : "gray"}>{ACTION_LABEL[l.action] ?? l.action}</Badge></td>
                    <td className="px-4 py-2.5 text-text2 max-w-[320px] truncate">{l.description}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${l.amount >= 0 ? "text-success" : ""}`}>{l.amount > 0 ? "+" : ""}{fmtNum(l.amount)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text2">{fmtNum(l.balance_after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty>Aucun mouvement ne correspond.</Empty>}
      </Card>
      <Pager page={page} pageSize={PAGE_SIZE} total={res.total} href={(p) => qs({ page: p })} />
    </>
  );
}
