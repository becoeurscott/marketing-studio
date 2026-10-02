import "server-only";
import { adminClient } from "@/lib/insforge/admin";
import { getSessionUser, type SessionUser } from "@/lib/insforge/server";

/**
 * Admin dashboard data layer (server only). Access is limited to the emails listed in
 * ADMIN_EMAILS (comma separated). Every read goes through SECURITY DEFINER functions that
 * anon/authenticated cannot execute; every write is audited in ms_admin_audit.
 */

export class AdminError extends Error {
  constructor(message: string, public code: "FORBIDDEN" | "NOT_FOUND" | "INVALID" | "FAILED" = "FAILED") {
    super(message);
  }
}

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/** The signed-in admin, or null when the visitor is not signed in or not on the allow-list. */
export async function currentAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return adminEmails().includes(user.email.toLowerCase()) ? user : null;
}

export async function requireAdmin(): Promise<SessionUser> {
  const admin = await currentAdmin();
  if (!admin) throw new AdminError("Accès réservé aux administrateurs.", "FORBIDDEN");
  return admin;
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await adminClient().database.rpc(fn, args);
  if (error) throw new AdminError(error.message);
  return data as T;
}

/* ---------- Types (mirror the SQL functions in migrations/*_ms-admin.sql) ---------- */

export interface DailyPoint { day: string; credits: number; jobs: number; failed: number; users: number }
export interface Overview {
  from: string; to: string; days: number;
  users: { total: number; new: number; newPrev: number; active: number; activePrev: number; byPlan: Record<string, number> };
  credits: { outstanding: number; spent: number; spentPrev: number; spentAll: number; refunded: number; purchased: number; purchasedPrev: number; gifted: number };
  jobs: { total: number; totalPrev: number; failed: number; running: number; byStatus: Record<string, number>; byKind: Record<string, number>; byModel: { model: string; jobs: number; credits: number }[] };
  daily: DailyPoint[];
}
export interface AdminUserRow { user_id: string; email: string; name: string; credits: number; plan: string; created_at: string; jobs: number; spent: number; last_job: string | null; purchased: number }
export interface AdminUser extends AdminUserRow { email_verified: boolean; projects: number; assets: number; campaigns: number; workspace_updated_at: string | null; workspace_bytes: number | null }
export interface JobRow { id: string; user_id: string; email: string | null; hf_request_id: string | null; kind: string; model: string; cost: number; status: string; outputs: { url: string; type?: string }[]; refunded: boolean; finalized: boolean; created_at: string; updated_at: string }
export interface LedgerRow { id: string; user_id: string; email: string | null; amount: number; balance_after: number; action: string; description: string; job_id: string | null; created_at: string }
export interface Page<T> { total: number; items: T[] }
export interface AuditRow { id: string; actor_email: string; action: string; target_type: string; target_id: string | null; before: unknown; after: unknown; reason: string; created_at: string }

const num = (v: unknown) => Number(v ?? 0);

/* ---------- Reads ---------- */

export async function getOverview(days: number): Promise<Overview> {
  await requireAdmin();
  const o = await rpc<Overview>("ms_admin_overview", { p_days: days });
  // bigint values come back as strings; normalise once here.
  return {
    ...o,
    users: { ...o.users, total: num(o.users.total), new: num(o.users.new), newPrev: num(o.users.newPrev), active: num(o.users.active), activePrev: num(o.users.activePrev) },
    credits: Object.fromEntries(Object.entries(o.credits).map(([k, v]) => [k, num(v)])) as Overview["credits"],
    jobs: { ...o.jobs, total: num(o.jobs.total), totalPrev: num(o.jobs.totalPrev), failed: num(o.jobs.failed), running: num(o.jobs.running), byModel: o.jobs.byModel.map((m) => ({ ...m, jobs: num(m.jobs), credits: num(m.credits) })) },
    daily: o.daily.map((d) => ({ day: d.day, credits: num(d.credits), jobs: num(d.jobs), failed: num(d.failed), users: num(d.users) })),
  };
}

export async function listUsers(q: { query?: string; plan?: string; page?: number; pageSize?: number }): Promise<Page<AdminUserRow>> {
  await requireAdmin();
  const size = Math.min(q.pageSize ?? 25, 100);
  const r = await rpc<Page<AdminUserRow>>("ms_admin_users", { p_query: q.query ?? "", p_plan: q.plan ?? "", p_limit: size, p_offset: (q.page ?? 0) * size });
  return { total: num(r.total), items: r.items.map((u) => ({ ...u, jobs: num(u.jobs), spent: num(u.spent), purchased: num(u.purchased) })) };
}

export async function getUser(id: string): Promise<AdminUser | null> {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const u = await rpc<AdminUser | null>("ms_admin_user", { p_user: id });
  return u ? { ...u, jobs: num(u.jobs), spent: num(u.spent), purchased: num(u.purchased), projects: num(u.projects), assets: num(u.assets), campaigns: num(u.campaigns) } : null;
}

export async function listJobs(q: { status?: string; kind?: string; query?: string; userId?: string; page?: number; pageSize?: number }): Promise<Page<JobRow>> {
  await requireAdmin();
  const size = Math.min(q.pageSize ?? 25, 100);
  const r = await rpc<Page<JobRow>>("ms_admin_jobs", { p_status: q.status ?? "", p_kind: q.kind ?? "", p_query: q.query ?? "", p_user: q.userId ?? null, p_limit: size, p_offset: (q.page ?? 0) * size });
  return { total: num(r.total), items: r.items };
}

export async function listLedger(q: { action?: string; query?: string; userId?: string; page?: number; pageSize?: number }): Promise<Page<LedgerRow>> {
  await requireAdmin();
  const size = Math.min(q.pageSize ?? 25, 100);
  const r = await rpc<Page<LedgerRow>>("ms_admin_ledger", { p_action: q.action ?? "", p_query: q.query ?? "", p_user: q.userId ?? null, p_limit: size, p_offset: (q.page ?? 0) * size });
  return { total: num(r.total), items: r.items };
}

export async function listAudit(q: { targetId?: string; limit?: number } = {}): Promise<AuditRow[]> {
  await requireAdmin();
  let query = adminClient().database.from("ms_admin_audit").select("*").order("created_at", { ascending: false }).limit(Math.min(q.limit ?? 50, 200));
  if (q.targetId) query = query.eq("target_id", q.targetId);
  const { data, error } = await query;
  if (error) throw new AdminError(error.message);
  return (data ?? []) as AuditRow[];
}

/* ---------- Settings (Higgsfield cost tracking) ---------- */

export interface AdminSettings {
  /** What one Sokozia credit costs us at Higgsfield, in USD. */
  hfUsdPerCredit: number;
  /** USD loaded on the Higgsfield account since `hfBudgetSince`. */
  hfBudgetUsd: number;
  /** Start of the budget period (ISO date); spend is counted from here. */
  hfBudgetSince: string;
  /** Extra Higgsfield spend not recorded as jobs (admin asset batches…), in USD. */
  hfOtherSpendUsd: number;
  /** Warn when the remaining budget drops under this amount (USD). */
  hfAlertUsd: number;
  /** Selling price of one credit, in FCFA (for revenue estimates). */
  xofPerCredit: number;
}

export const DEFAULT_SETTINGS: AdminSettings = {
  hfUsdPerCredit: 0.0626,
  hfBudgetUsd: 0,
  hfBudgetSince: "2026-09-01",
  hfOtherSpendUsd: 0,
  hfAlertUsd: 20,
  xofPerCredit: 12,
};

export async function getSettings(): Promise<AdminSettings & { updatedAt: string | null; updatedBy: string | null }> {
  await requireAdmin();
  const { data } = await adminClient().database.from("ms_admin_config").select("value, updated_at, updated_by").eq("key", "settings").limit(1);
  const row = data?.[0] as { value: Partial<AdminSettings>; updated_at: string; updated_by: string } | undefined;
  return { ...DEFAULT_SETTINGS, ...(row?.value ?? {}), updatedAt: row?.updated_at ?? null, updatedBy: row?.updated_by ?? null };
}

/** Credits debited by non-refunded jobs since a date (the Higgsfield spend driver). */
export async function creditsSpentSince(sinceIso: string): Promise<number> {
  await requireAdmin();
  const { data, error } = await adminClient().database.from("ms_jobs").select("cost").eq("refunded", false).gte("created_at", sinceIso);
  if (error) throw new AdminError(error.message);
  return (data ?? []).reduce((s, r) => s + Number((r as { cost: number }).cost), 0);
}

export interface HfBudget { spentUsd: number; budgetUsd: number; leftUsd: number; usedPct: number; credits: number; low: boolean; configured: boolean }

export async function higgsfieldBudget(settings: AdminSettings): Promise<HfBudget> {
  const credits = await creditsSpentSince(new Date(settings.hfBudgetSince).toISOString());
  const spentUsd = credits * settings.hfUsdPerCredit + settings.hfOtherSpendUsd;
  const leftUsd = settings.hfBudgetUsd - spentUsd;
  return {
    spentUsd, budgetUsd: settings.hfBudgetUsd, leftUsd, credits,
    usedPct: settings.hfBudgetUsd > 0 ? Math.min(100, (spentUsd / settings.hfBudgetUsd) * 100) : 0,
    low: settings.hfBudgetUsd > 0 && leftUsd < settings.hfAlertUsd,
    configured: settings.hfBudgetUsd > 0,
  };
}

/* ---------- Audit ---------- */

export async function audit(actor: SessionUser, entry: { action: string; targetType: string; targetId?: string | null; before?: unknown; after?: unknown; reason?: string }): Promise<void> {
  await adminClient().database.from("ms_admin_audit").insert([{
    actor_email: actor.email, action: entry.action, target_type: entry.targetType, target_id: entry.targetId ?? null,
    before: entry.before ?? null, after: entry.after ?? null, reason: entry.reason ?? "",
  }]);
}
