import Link from "next/link";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { RefundButton } from "@/components/admin/RefundButton";
import { Badge, Card, Empty, ErrorBox, Pager, STATUS_LABEL, STATUS_TONE, SearchForm, Segmented, fmtDate, fmtNum, fmtUsd } from "@/components/admin/ui";
import { getSettings, listJobs } from "@/lib/admin/server";
import { imageModel, videoModel } from "@/lib/higgsfield/models";

const PAGE_SIZE = 30;
const modelLabel = (id: string) => (id === "default" ? "Non précisé" : imageModel(id).id === id ? imageModel(id).label : videoModel(id).id === id ? videoModel(id).label : id);

export default async function AdminJobs({ searchParams }: PageProps<"/admin/jobs">) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = str("q"), status = str("status"), kind = str("kind"), user = str("user");
  const page = Math.max(0, Number(sp.page) || 0);
  const qs = (p: Record<string, string | number>) => "/admin/jobs?" + new URLSearchParams(Object.entries({ q, status, kind, user, ...p }).filter(([, v]) => String(v) !== "" && String(v) !== "0").map(([k, v]) => [k, String(v)])).toString();

  let res, settings;
  try {
    [res, settings] = await Promise.all([listJobs({ query: q, status, kind, userId: /^[0-9a-f-]{36}$/i.test(user) ? user : undefined, page, pageSize: PAGE_SIZE }), getSettings()]);
  } catch (e) {
    return <><AdminTopBar title="Générations" /><ErrorBox message={e instanceof Error ? e.message : "erreur"} retryHref={qs({ page })} /></>;
  }

  return (
    <>
      <AdminTopBar title="Générations" pill={`${fmtNum(res.total)} résultats`} subtitle="Chaque appel à Higgsfield, son coût, son statut et son résultat" />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchForm action="/admin/jobs" query={q} placeholder="E-mail, modèle, identifiant…" hidden={{ status, kind, user }} />
        <Segmented active={status || "all"} items={[["all", "Tous"], ["completed", "Terminés"], ["running", "En cours"], ["failed", "Échecs"]].map(([k, l]) => ({ key: k, label: l, href: qs({ status: k === "all" ? "" : k, page: 0 }) }))} />
        <Segmented active={kind || "all"} items={[["all", "Tout"], ["image", "Images"], ["video", "Vidéos"]].map(([k, l]) => ({ key: k, label: l, href: qs({ kind: k === "all" ? "" : k, page: 0 }) }))} />
        {user && <Link href={qs({ user: "", page: 0 })} className="rounded-lg border border-white/10 px-3 py-1.5 text-[12px] text-text2 hover:text-text">× Filtre utilisateur</Link>}
      </div>

      <Card className="p-0 sm:p-0 overflow-hidden">
        {res.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-[13px]">
              <thead className="bg-[#121212] text-left text-[11px] uppercase tracking-wide text-muted">
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 font-medium">Résultat</th>
                  <th className="px-4 py-3 font-medium">Compte</th>
                  <th className="px-4 py-3 font-medium">Modèle</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium text-right">Coût</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {res.items.map((j) => {
                  const out = j.outputs?.[0];
                  const isVideo = (out?.type ?? j.kind) === "video";
                  return (
                    <tr key={j.id} className="border-b border-white/[0.04] align-middle hover:bg-white/[0.03]">
                      <td className="px-4 py-2.5">
                        {out?.url ? (
                          <a href={out.url} target="_blank" rel="noreferrer" className="block size-14 overflow-hidden rounded-lg bg-white/[0.05]">
                            {isVideo ? <video src={out.url} muted playsInline preload="metadata" className="size-full object-cover" /> : <img src={out.url} alt="" className="size-full object-cover" />}
                          </a>
                        ) : <span className="grid size-14 place-items-center rounded-lg bg-white/[0.04] text-[10px] text-muted">{j.kind === "video" ? "Vidéo" : "Image"}</span>}
                        {(j.outputs?.length ?? 0) > 1 && <span className="mt-1 block text-[10px] text-muted">+{j.outputs.length - 1} autre(s)</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/users/${j.user_id}`} className="hover:underline">{j.email ?? j.user_id.slice(0, 8)}</Link>
                        <span className="block font-mono text-[10px] text-muted">{j.id.slice(0, 8)}{j.hf_request_id ? ` · HF ${j.hf_request_id.slice(0, 8)}` : ""}</span>
                      </td>
                      <td className="px-4 py-2.5 text-text2">{modelLabel(j.model)}<span className="block text-[11px] text-muted">{j.kind === "video" ? "Vidéo" : "Image"}</span></td>
                      <td className="px-4 py-2.5">
                        <Badge tone={STATUS_TONE[j.status]}>{STATUS_LABEL[j.status] ?? j.status}</Badge>
                        {j.refunded && <span className="ml-1"><Badge tone="yellow">Remboursé</Badge></span>}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        <span className="font-medium">{j.cost} cr.</span>
                        <span className="block text-[11px] text-muted">{fmtUsd(j.cost * settings.hfUsdPerCredit)}</span>
                      </td>
                      <td className="px-4 py-2.5 text-text2">{fmtDate(j.created_at, true)}</td>
                      <td className="px-4 py-2.5 text-right">{!j.refunded && j.cost > 0 ? <RefundButton jobId={j.id} cost={j.cost} /> : <span className="text-[11px] text-muted">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <Empty>Aucune génération ne correspond.</Empty>}
      </Card>
      <Pager page={page} pageSize={PAGE_SIZE} total={res.total} href={(p) => qs({ page: p })} />
    </>
  );
}
