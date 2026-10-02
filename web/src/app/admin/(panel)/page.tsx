import { AlertTriangle, BarChart3, CheckCircle2, Coins, Flame, Layers, Sparkles, UserPlus, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { MiniBlocks, PillBars, Ring, ShareBars, type BarPoint } from "@/components/admin/charts";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Badge, Card, CardHeader, Delta, ErrorBox, KpiCard, PLAN_LABEL, STATUS_LABEL, STATUS_TONE, Segmented, fmtDate, fmtNum, fmtUsd, fmtXof, trend } from "@/components/admin/ui";
import { getOverview, getSettings, higgsfieldBudget, listJobs, listUsers, type DailyPoint } from "@/lib/admin/server";
import { imageModel, videoModel } from "@/lib/higgsfield/models";

const RANGES = [
  { days: 7, label: "1 sem" }, { days: 30, label: "1 mois" }, { days: 90, label: "3 mois" }, { days: 180, label: "6 mois" }, { days: 365, label: "1 an" },
];

/** Daily buckets for ≤ 30 days, ISO weeks (Monday) up to 180 days, calendar months beyond. Sums keep totals exact. */
function bucket(daily: DailyPoint[], days: number): (DailyPoint & { label: string })[] {
  const day = (d: string) => new Date(d);
  if (days <= 30) return daily.map((d) => ({ ...d, label: new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(day(d.day)) }));
  const groups = new Map<string, DailyPoint & { label: string }>();
  for (const d of daily) {
    const t = day(d.day);
    let key: string; let label: string;
    if (days <= 180) {
      const monday = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - ((t.getUTCDay() + 6) % 7)));
      key = monday.toISOString();
      label = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(monday);
    } else {
      key = `${t.getUTCFullYear()}-${t.getUTCMonth()}`;
      label = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" }).format(t);
    }
    const g = groups.get(key) ?? { day: key, label, credits: 0, jobs: 0, failed: 0, users: 0 };
    g.credits += d.credits; g.jobs += d.jobs; g.failed += d.failed; g.users += d.users;
    groups.set(key, g);
  }
  return [...groups.values()];
}

const modelLabel = (id: string) => (id === "default" ? "Non précisé (anciens jobs)" : imageModel(id).id === id ? imageModel(id).label : videoModel(id).id === id ? videoModel(id).label : id);

export default async function AdminOverview({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const days = RANGES.some((r) => String(r.days) === sp.days) ? Number(sp.days) : 30;

  let data;
  try {
    const [o, settings, jobs, users] = await Promise.all([getOverview(days), getSettings(), listJobs({ pageSize: 8 }), listUsers({ pageSize: 6 })]);
    data = { o, settings, jobs, users, budget: await higgsfieldBudget(settings) };
  } catch (e) {
    return <><AdminTopBar title="Vue d’ensemble" /><ErrorBox message={e instanceof Error ? e.message : "erreur"} retryHref={`/admin?days=${days}`} /></>;
  }
  const { o, settings, jobs, users, budget } = data;

  const series = bucket(o.daily, days);
  const bars: BarPoint[] = series.map((d) => ({ label: d.label, value: d.credits, secondary: d.jobs }));
  const spark = (k: keyof DailyPoint) => series.slice(-8).map((d) => Number(d[k]));
  const periodUsd = o.credits.spent * settings.hfUsdPerCredit;
  const failRate = o.jobs.total ? (o.jobs.failed / o.jobs.total) * 100 : 0;
  const rangeLabel = RANGES.find((r) => r.days === days)?.label ?? "";

  const alerts: { tone: "red" | "orange" | "green"; text: React.ReactNode; href?: string }[] = [];
  if (!budget.configured) alerts.push({ tone: "orange", text: <>Le budget Higgsfield n&apos;est pas renseigné : impossible de calculer ce qu&apos;il reste.</>, href: "/admin/settings" });
  else if (budget.leftUsd <= 0) alerts.push({ tone: "red", text: <>Budget Higgsfield <b>épuisé</b> ({fmtUsd(budget.leftUsd)}). Les générations vont échouer.</>, href: "/admin/settings" });
  else if (budget.low) alerts.push({ tone: "red", text: <>Il ne reste que <b>{fmtUsd(budget.leftUsd)}</b> sur Higgsfield. Pensez à recharger.</>, href: "/admin/settings" });
  if (o.jobs.total >= 5 && failRate >= 10) alerts.push({ tone: "red", text: <><b>{fmtNum(failRate, 1)} %</b> des générations ont échoué sur la période ({o.jobs.failed}).</>, href: "/admin/jobs?status=failed" });
  if (o.jobs.running > 0) alerts.push({ tone: "orange", text: <><b>{o.jobs.running}</b> génération(s) en cours ou bloquée(s).</>, href: "/admin/jobs?status=running" });
  if (o.credits.outstanding > 0) alerts.push({ tone: "orange", text: <>Les utilisateurs détiennent <b>{fmtNum(o.credits.outstanding)}</b> crédits non utilisés, soit environ <b>{fmtUsd(o.credits.outstanding * settings.hfUsdPerCredit)}</b> de coût Higgsfield potentiel.</> });
  if (o.users.new > 0) alerts.push({ tone: "green", text: <><b>{o.users.new}</b> nouveau(x) compte(s) sur la période.</>, href: "/admin/users" });
  if (!alerts.length) alerts.push({ tone: "green", text: <>Tout est normal sur la période.</> });

  return (
    <>
      <AdminTopBar
        title="Vue d’ensemble"
        subtitle="Comptes, crédits et dépenses Higgsfield en temps réel"
        pill={`${fmtDate(o.from)} → ${fmtDate(new Date(new Date(o.to).getTime() - 864e5).toISOString())}`}
        actions={<Segmented active={String(days)} items={RANGES.map((r) => ({ key: String(r.days), label: r.label, href: `/admin?days=${r.days}` }))} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<Users />} title="Utilisateurs"
          value={fmtNum(o.users.total)} sub={`+${fmtNum(o.users.new)} sur ${rangeLabel} · ${fmtNum(o.users.active)} actifs`}
          graphic={<MiniBlocks values={spark("users")} color="#3b82f6" />}
          footer={<><span>Nouveaux vs période préc.</span><Delta value={trend(o.users.new, o.users.newPrev)} /></>}
        />
        <KpiCard
          icon={<Coins />} title="Crédits consommés"
          value={fmtNum(o.credits.spent)} sub={`${fmtNum(o.jobs.total)} générations · ${fmtNum(o.credits.refunded)} remboursés`}
          graphic={<MiniBlocks values={spark("credits")} color="#a855f7" />}
          footer={<><span>vs période préc.</span><Delta value={trend(o.credits.spent, o.credits.spentPrev)} /></>}
        />
        <KpiCard
          icon={<Flame />} title="Dépense Higgsfield"
          value={fmtUsd(periodUsd)} sub={`≈ ${fmtUsd(o.credits.spentAll * settings.hfUsdPerCredit)} depuis le début`}
          graphic={<MiniBlocks values={spark("credits")} color="#f97316" />}
          footer={<><span>{fmtUsd(settings.hfUsdPerCredit)} / crédit</span><Delta value={trend(o.credits.spent, o.credits.spentPrev)} invert /></>}
        />
        <KpiCard
          icon={<Wallet />} title="Budget Higgsfield restant"
          value={budget.configured ? fmtUsd(budget.leftUsd) : "À configurer"}
          sub={budget.configured ? `${fmtUsd(budget.spentUsd)} dépensés sur ${fmtUsd(budget.budgetUsd)}` : "Renseignez le montant rechargé"}
          graphic={budget.configured ? <Ring pct={100 - budget.usedPct} color={budget.low ? "#ef4444" : "#22c55e"} /> : undefined}
          footer={<><span>Depuis le {fmtDate(settings.hfBudgetSince)}</span><Link href="/admin/settings" className="text-accent hover:underline">Modifier</Link></>}
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader icon={<BarChart3 />} title="Crédits consommés" action={<span className="text-[12px] text-muted">{fmtNum(o.credits.spent)} crédits · {fmtNum(o.jobs.total)} générations · {rangeLabel}</span>} />
          <PillBars data={bars} primaryLabel="Crédits" secondaryLabel="Générations" />
        </Card>

        <Card className="flex flex-col">
          <CardHeader icon={<Sparkles />} title="Dernières générations" action={<Link href="/admin/jobs" className="text-[12px] text-text2 hover:text-text">Tout voir</Link>} />
          {jobs.items.length ? (
            <ul className="space-y-1.5 overflow-y-auto max-h-[300px] pr-1">
              {jobs.items.map((j) => (
                <li key={j.id}>
                  <Link href={`/admin/jobs?q=${j.id}`} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 hover:bg-white/[0.06]">
                    <span className="size-9 shrink-0 overflow-hidden rounded-lg bg-white/[0.06]">
                      {j.outputs?.[0]?.url && (j.outputs[0].type ?? j.kind) !== "video" ? <img src={j.outputs[0].url} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center text-[10px] text-muted">{j.kind === "video" ? "▶" : "IMG"}</span>}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[13px]">{j.email ?? "—"}</span>
                      <span className="block truncate text-[11px] text-muted">{modelLabel(j.model)} · {fmtDate(j.created_at, true)}</span>
                    </span>
                    <span className="text-right leading-tight">
                      <span className="block text-[13px] font-medium tabular-nums">{j.cost} cr.</span>
                      <Badge tone={STATUS_TONE[j.status]}>{STATUS_LABEL[j.status] ?? j.status}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="py-10 text-center text-[13px] text-muted">Aucune génération pour l&apos;instant.</p>}
        </Card>

        <Card className="flex flex-col overflow-hidden relative">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-accent/20 blur-3xl" />
          <CardHeader icon={<AlertTriangle />} title="Alertes" />
          <ul className="relative space-y-3 flex-1">
            {alerts.map((a, i) => {
              const body = (
                <span className="flex items-start gap-3">
                  <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${a.tone === "red" ? "bg-danger/15 text-danger" : a.tone === "orange" ? "bg-accent/15 text-accent" : "bg-success/15 text-success"}`}>
                    {a.tone === "green" ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                  </span>
                  <span className="text-[13px] leading-snug text-text2 [&_b]:text-text">{a.text}</span>
                </span>
              );
              return <li key={i}>{a.href ? <Link href={a.href} className="block rounded-lg hover:bg-white/[0.03]">{body}</Link> : body}</li>;
            })}
          </ul>
          <Link href="/admin/settings" className="relative mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-[#ef4444] text-[13px] font-medium text-white hover:opacity-90">
            <Wallet className="size-4" /> Mettre à jour le budget Higgsfield
          </Link>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader icon={<Flame />} title="Dépense par modèle" action={<span className="text-[12px] text-muted">{rangeLabel}</span>} />
          {o.jobs.byModel.length ? (
            <ShareBars unit=" cr." items={o.jobs.byModel.map((m, i) => ({ label: modelLabel(m.model), value: m.credits, hint: `${fmtUsd(m.credits * settings.hfUsdPerCredit)} · ${m.jobs} jobs`, color: ["#f97316", "#facc15", "#22c55e", "#a855f7", "#3b82f6", "#ef4444"][i % 6] }))} />
          ) : <p className="py-6 text-center text-[13px] text-muted">Aucune dépense sur la période.</p>}
        </Card>

        <Card>
          <CardHeader icon={<Layers />} title="Comptes et formules" />
          <ShareBars items={Object.entries(o.users.byPlan).map(([plan, n], i) => ({ label: PLAN_LABEL[plan] ?? plan, value: Number(n), color: ["#22c55e", "#f97316", "#facc15", "#a855f7"][i % 4] }))} />
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[["Achetés", o.credits.purchased], ["Offerts", o.credits.gifted], ["En stock", o.credits.outstanding]].map(([l, v]) => (
              <div key={l as string} className="rounded-xl bg-white/[0.03] p-2.5">
                <p className="text-[15px] font-semibold tabular-nums">{fmtNum(v as number)}</p>
                <p className="text-[11px] text-muted">{l} (cr.)</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted">Valeur des crédits achetés sur la période : ≈ {fmtXof(o.credits.purchased * settings.xofPerCredit)}</p>
        </Card>

        <Card>
          <CardHeader icon={<UserPlus />} title="Derniers inscrits" action={<Link href="/admin/users" className="text-[12px] text-text2 hover:text-text">Tout voir</Link>} />
          <ul className="space-y-1.5">
            {users.items.map((u) => (
              <li key={u.user_id}>
                <Link href={`/admin/users/${u.user_id}`} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 hover:bg-white/[0.06]">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[12px] font-semibold">{(u.name || u.email).slice(0, 1).toUpperCase()}</span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-[13px]">{u.name || u.email}</span>
                    <span className="block truncate text-[11px] text-muted">{fmtDate(u.created_at)} · {PLAN_LABEL[u.plan] ?? u.plan}</span>
                  </span>
                  <span className="text-[13px] font-medium tabular-nums">{fmtNum(u.credits)} cr.</span>
                </Link>
              </li>
            ))}
            {!users.items.length && <p className="py-6 text-center text-[13px] text-muted">Aucun compte.</p>}
          </ul>
        </Card>
      </div>
    </>
  );
}
