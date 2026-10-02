import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Card, Empty, ErrorBox, fmtDate } from "@/components/admin/ui";
import { listAudit } from "@/lib/admin/server";

const LABEL: Record<string, string> = {
  "credits.adjust": "Crédits ajustés", "plan.update": "Formule modifiée", "job.refund": "Génération remboursée", "config.update": "Réglages modifiés",
};

export default async function AdminAudit() {
  let rows;
  try {
    rows = await listAudit({ limit: 200 });
  } catch (e) {
    return <><AdminTopBar title="Journal" /><ErrorBox message={e instanceof Error ? e.message : "erreur"} retryHref="/admin/audit" /></>;
  }
  return (
    <>
      <AdminTopBar title="Journal des actions" pill={`${rows.length} dernières`} subtitle="Toutes les modifications faites depuis ce tableau de bord, avec l'avant / après" />
      <Card className="p-0 sm:p-0 overflow-hidden">
        {rows.length ? (
          <ul className="divide-y divide-white/[0.05]">
            {rows.map((a) => (
              <li key={a.id} className="px-4 py-3 text-[13px]">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p><span className="font-medium">{LABEL[a.action] ?? a.action}</span> <span className="text-muted">· {a.target_type} {a.target_id?.slice(0, 8)}</span></p>
                  <p className="text-[11px] text-muted">{a.actor_email} · {fmtDate(a.created_at, true)}</p>
                </div>
                <p className="mt-1 font-mono text-[11px] text-text2 break-all">{JSON.stringify(a.before)} → {JSON.stringify(a.after)}</p>
                {a.reason && <p className="mt-0.5 text-[12px] text-muted">« {a.reason} »</p>}
              </li>
            ))}
          </ul>
        ) : <Empty>Aucune action pour l&apos;instant.</Empty>}
      </Card>
    </>
  );
}
