import { ArrowLeft, Coins, History, ScrollText, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { UserActions } from "@/components/admin/UserActions";
import { ACTION_LABEL, Badge, Card, CardHeader, Empty, ErrorBox, PLAN_LABEL, STATUS_LABEL, STATUS_TONE, fmtDate, fmtNum, fmtUsd } from "@/components/admin/ui";
import { getSettings, getUser, listAudit, listJobs, listLedger } from "@/lib/admin/server";

export default async function AdminUser({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  let data;
  try {
    const user = await getUser(id);
    if (!user) notFound();
    const [jobs, ledger, auditRows, settings] = await Promise.all([listJobs({ userId: id, pageSize: 20 }), listLedger({ userId: id, pageSize: 30 }), listAudit({ targetId: id, limit: 20 }), getSettings()]);
    data = { user, jobs, ledger, auditRows, settings };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // let notFound() through
    return <><AdminTopBar title="Utilisateur" /><ErrorBox message={e instanceof Error ? e.message : "erreur"} retryHref={`/admin/users/${id}`} /></>;
  }
  const { user, jobs, ledger, auditRows, settings } = data;

  const stats: [string, string][] = [
    ["Solde", `${fmtNum(user.credits)} cr.`],
    ["Consommés", `${fmtNum(user.spent)} cr.`],
    ["Coût Higgsfield", fmtUsd(user.spent * settings.hfUsdPerCredit)],
    ["Achetés", `${fmtNum(user.purchased)} cr.`],
    ["Générations", fmtNum(user.jobs)],
    ["Projets", fmtNum(user.projects)],
    ["Visuels", fmtNum(user.assets)],
    ["Campagnes", fmtNum(user.campaigns)],
  ];

  return (
    <>
      <AdminTopBar
        back={<Link href="/admin/users" className="mb-2 inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-text"><ArrowLeft className="size-3.5" /> Utilisateurs</Link>}
        title={user.name || user.email}
        pill={PLAN_LABEL[user.plan] ?? user.plan}
        subtitle={`${user.email} · inscrit le ${fmtDate(user.created_at)}${user.email_verified ? " · e-mail vérifié" : " · e-mail non vérifié"}`}
      />

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
        {stats.map(([l, v]) => (
          <Card key={l} className="p-3 sm:p-3.5">
            <p className="text-[11px] text-muted">{l}</p>
            <p className="mt-1 text-[17px] font-semibold tabular-nums truncate">{v}</p>
          </Card>
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card>
          <CardHeader icon={<Coins />} title="Actions" />
          <UserActions userId={user.user_id} plan={user.plan} credits={user.credits} />
          <p className="mt-4 text-[11px] text-muted">
            Espace de travail : {user.workspace_updated_at ? `sauvegardé le ${fmtDate(user.workspace_updated_at, true)}` : "jamais sauvegardé"}
            {user.workspace_bytes ? ` · ${fmtNum(user.workspace_bytes / 1024, 1)} Ko` : ""}
          </p>
        </Card>

        <Card>
          <CardHeader icon={<History />} title="Historique des crédits" action={<Link href={`/admin/credits?user=${user.user_id}`} className="text-[12px] text-text2 hover:text-text">Tout voir</Link>} />
          {ledger.items.length ? (
            <ul className="max-h-[340px] space-y-1 overflow-y-auto pr-1">
              {ledger.items.map((l) => (
                <li key={l.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.03]">
                  <Badge tone={l.amount >= 0 ? "green" : "gray"}>{ACTION_LABEL[l.action] ?? l.action}</Badge>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-text2">{l.description}</span>
                  <span className={`text-[13px] font-medium tabular-nums ${l.amount >= 0 ? "text-success" : ""}`}>{l.amount > 0 ? "+" : ""}{fmtNum(l.amount)}</span>
                  <span className="hidden sm:block w-28 text-right text-[11px] text-muted">{fmtDate(l.created_at, true)}</span>
                </li>
              ))}
            </ul>
          ) : <Empty>Aucun mouvement.</Empty>}
        </Card>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader icon={<Sparkles />} title="Générations" action={<Link href={`/admin/jobs?user=${user.user_id}`} className="text-[12px] text-text2 hover:text-text">Tout voir</Link>} />
          {jobs.items.length ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {jobs.items.map((j) => (
                <Link key={j.id} href={`/admin/jobs?q=${j.id}`} className="group relative aspect-square overflow-hidden rounded-xl bg-white/[0.04]">
                  {j.outputs?.[0]?.url ? (
                    (j.outputs[0].type ?? j.kind) === "video"
                      ? <video src={j.outputs[0].url} muted playsInline preload="metadata" className="size-full object-cover" />
                      : <img src={j.outputs[0].url} alt="" className="size-full object-cover" />
                  ) : <span className="grid size-full place-items-center text-[11px] text-muted">{STATUS_LABEL[j.status] ?? j.status}</span>}
                  <span className="absolute inset-x-1 bottom-1 flex justify-between"><Badge tone={STATUS_TONE[j.status]}>{j.cost} cr.</Badge></span>
                </Link>
              ))}
            </div>
          ) : <Empty>Aucune génération.</Empty>}
        </Card>

        <Card>
          <CardHeader icon={<ScrollText />} title="Actions admin sur ce compte" />
          {auditRows.length ? (
            <ul className="space-y-2">
              {auditRows.map((a) => (
                <li key={a.id} className="rounded-lg bg-white/[0.03] px-3 py-2 text-[12px]">
                  <p><span className="font-medium">{a.action}</span> <span className="text-muted">par {a.actor_email} · {fmtDate(a.created_at, true)}</span></p>
                  <p className="mt-0.5 text-text2">{JSON.stringify(a.before)} → {JSON.stringify(a.after)}{a.reason ? ` · « ${a.reason} »` : ""}</p>
                </li>
              ))}
            </ul>
          ) : <Empty>Aucune action admin.</Empty>}
        </Card>
      </div>
    </>
  );
}
