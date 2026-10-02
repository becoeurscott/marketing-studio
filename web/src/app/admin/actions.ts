"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions } from "@insforge/sdk/ssr";
import { adminClient } from "@/lib/insforge/admin";
import { AdminError, audit, DEFAULT_SETTINGS, getSettings, getUser, requireAdmin, type AdminSettings } from "@/lib/admin/server";

export interface ActionResult { ok: boolean; error?: string; code?: string }

const PLANS = ["starter", "creator", "studio", "agency"];

function fail(e: unknown): ActionResult {
  if (e instanceof AdminError) return { ok: false, error: e.message, code: e.code };
  return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue", code: "FAILED" };
}

/** Adds (positive) or removes (negative) credits on an account, with a reason shown in the user's history. */
export async function adjustCredits(userId: string, amount: number, reason: string): Promise<ActionResult & { balance?: number }> {
  try {
    const admin = await requireAdmin();
    const n = Math.trunc(Number(amount));
    if (!n || Math.abs(n) > 100_000) throw new AdminError("Montant invalide (entre 1 et 100 000, positif ou négatif).", "INVALID");
    const why = reason.trim().slice(0, 200);
    if (why.length < 3) throw new AdminError("Indiquez une raison (au moins 3 caractères).", "INVALID");
    const before = await getUser(userId);
    if (!before) throw new AdminError("Compte introuvable.", "NOT_FOUND");
    const { data, error } = await adminClient().database.rpc("ms_admin_adjust_credits", { p_user: userId, p_amount: n, p_reason: why });
    if (error) throw new AdminError(error.message);
    const balance = Number(data);
    await audit(admin, { action: "credits.adjust", targetType: "user", targetId: userId, before: { credits: before.credits }, after: { credits: balance }, reason: why });
    revalidatePath("/admin", "layout");
    return { ok: true, balance };
  } catch (e) {
    return fail(e);
  }
}

export async function setPlan(userId: string, plan: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!PLANS.includes(plan)) throw new AdminError("Formule inconnue.", "INVALID");
    const before = await getUser(userId);
    if (!before) throw new AdminError("Compte introuvable.", "NOT_FOUND");
    if (before.plan === plan) return { ok: true };
    const { error } = await adminClient().database.from("ms_accounts").update({ plan, updated_at: new Date().toISOString() }).eq("user_id", userId);
    if (error) throw new AdminError(error.message);
    await audit(admin, { action: "plan.update", targetType: "user", targetId: userId, before: { plan: before.plan }, after: { plan } });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Gives a job's credits back to its owner (for a bad result the system counted as completed). */
export async function refundJobCredits(jobId: string, reason: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const db = adminClient().database;
    const { data } = await db.from("ms_jobs").select("id, user_id, cost, refunded, status").eq("id", jobId).limit(1);
    const job = data?.[0] as { id: string; user_id: string; cost: number; refunded: boolean; status: string } | undefined;
    if (!job) throw new AdminError("Génération introuvable.", "NOT_FOUND");
    if (job.refunded) throw new AdminError("Cette génération a déjà été remboursée.", "INVALID");
    const why = reason.trim().slice(0, 160) || "Remboursement administrateur";
    // Mark first so a double click can't refund twice.
    const { data: claimed, error } = await db.from("ms_jobs").update({ refunded: true, updated_at: new Date().toISOString() }).eq("id", jobId).eq("refunded", false).select("id");
    if (error) throw new AdminError(error.message);
    if (!claimed?.length) throw new AdminError("Cette génération a déjà été remboursée.", "INVALID");
    if (job.cost > 0) {
      const { error: e2 } = await db.rpc("ms_admin_adjust_credits", { p_user: job.user_id, p_amount: job.cost, p_reason: `Remboursement — ${why}` });
      if (e2) throw new AdminError(e2.message);
    }
    await audit(admin, { action: "job.refund", targetType: "job", targetId: jobId, before: { refunded: false }, after: { refunded: true, credits: job.cost }, reason: why });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveSettings(patch: Partial<AdminSettings>): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const current = await getSettings();
    const next: AdminSettings = { ...DEFAULT_SETTINGS };
    for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof AdminSettings)[]) {
      const v = k in patch ? patch[k] : current[k];
      if (k === "hfBudgetSince") {
        if (typeof v !== "string" || Number.isNaN(Date.parse(v))) throw new AdminError("Date de début invalide.", "INVALID");
        (next as unknown as Record<string, unknown>)[k] = v.slice(0, 10);
      } else {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0) throw new AdminError("Les montants doivent être des nombres positifs.", "INVALID");
        (next as unknown as Record<string, unknown>)[k] = n;
      }
    }
    const changedBefore: Record<string, unknown> = {};
    const changedAfter: Record<string, unknown> = {};
    for (const k of Object.keys(next) as (keyof AdminSettings)[]) {
      if (current[k] !== next[k]) { changedBefore[k] = current[k]; changedAfter[k] = next[k]; }
    }
    if (!Object.keys(changedAfter).length) return { ok: true };
    const { error } = await adminClient().database.from("ms_admin_config")
      .upsert([{ key: "settings", value: next, updated_by: admin.email, updated_at: new Date().toISOString() }], { onConflict: "key" });
    if (error) throw new AdminError(error.message);
    await audit(admin, { action: "config.update", targetType: "config", targetId: "settings", before: changedBefore, after: changedAfter });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Signs out and returns to the admin sign-in page. */
export async function adminSignOut(): Promise<void> {
  await createAuthActions({ cookies: await cookies() }).signOut();
  redirect("/admin/connexion");
}
