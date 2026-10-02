import Link from "next/link";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Badge, Card, Empty, ErrorBox, PLAN_LABEL, Pager, SearchForm, Segmented, fmtDate, fmtNum } from "@/components/admin/ui";
import { listUsers } from "@/lib/admin/server";

const PAGE_SIZE = 25;

export default async function AdminUsers({ searchParams }: PageProps<"/admin/users">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const plan = typeof sp.plan === "string" ? sp.plan : "";
  const page = Math.max(0, Number(sp.page) || 0);
  const qs = (p: Record<string, string | number>) => "/admin/users?" + new URLSearchParams(Object.entries({ q, plan, ...p }).filter(([, v]) => String(v) !== "" && String(v) !== "0").map(([k, v]) => [k, String(v)])).toString();

  let res;
  try {
    res = await listUsers({ query: q, plan, page, pageSize: PAGE_SIZE });
  } catch (e) {
    return <><AdminTopBar title="Utilisateurs" /><ErrorBox message={e instanceof Error ? e.message : "erreur"} retryHref={qs({ page })} /></>;
  }

  return (
    <>
      <AdminTopBar title="Utilisateurs" pill={`${fmtNum(res.total)} comptes`} subtitle="Comptes Sokozia, crédits, formules et consommation" />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchForm action="/admin/users" query={q} placeholder="Rechercher par e-mail, nom ou identifiant…" hidden={{ plan }} />
        <Segmented
          active={plan || "all"}
          items={[{ key: "all", label: "Toutes", href: qs({ plan: "", page: 0 }) }, ...Object.entries(PLAN_LABEL).map(([k, l]) => ({ key: k, label: l, href: qs({ plan: k, page: 0 }) }))]}
        />
      </div>
      <Card className="p-0 sm:p-0 overflow-hidden">
        {res.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead className="sticky top-0 bg-[#121212] text-left text-[11px] uppercase tracking-wide text-muted">
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 font-medium">Compte</th>
                  <th className="px-4 py-3 font-medium">Formule</th>
                  <th className="px-4 py-3 font-medium text-right">Solde</th>
                  <th className="px-4 py-3 font-medium text-right">Consommés</th>
                  <th className="px-4 py-3 font-medium text-right">Achetés</th>
                  <th className="px-4 py-3 font-medium text-right">Générations</th>
                  <th className="px-4 py-3 font-medium">Dernière activité</th>
                  <th className="px-4 py-3 font-medium">Inscription</th>
                </tr>
              </thead>
              <tbody>
                {res.items.map((u) => (
                  <tr key={u.user_id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u.user_id}`} className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[12px] font-semibold">{(u.name || u.email).slice(0, 1).toUpperCase()}</span>
                        <span className="min-w-0 leading-tight">
                          <span className="block truncate font-medium">{u.name || "—"}</span>
                          <span className="block truncate text-[12px] text-muted">{u.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><Badge tone="orange">{PLAN_LABEL[u.plan] ?? u.plan}</Badge></td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtNum(u.credits)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtNum(u.spent)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtNum(u.purchased)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtNum(u.jobs)}</td>
                    <td className="px-4 py-3 text-text2">{fmtDate(u.last_job, true)}</td>
                    <td className="px-4 py-3 text-text2">{fmtDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty>{q || plan ? "Aucun compte ne correspond à ces filtres." : "Aucun compte pour l’instant."}</Empty>}
      </Card>
      <Pager page={page} pageSize={PAGE_SIZE} total={res.total} href={(p) => qs({ page: p })} />
    </>
  );
}
