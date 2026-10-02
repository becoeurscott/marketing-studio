import "server-only";
import { headers } from "next/headers";
import { adminClient } from "./insforge/admin";
import { imageModel, videoCredits, videoModel } from "./higgsfield/models";
import { sanitizeShots } from "./higgsfield/server";
import type { GenerationRequest } from "./higgsfield/types";

/** Credits given once, when the account is first created. */
export const WELCOME_CREDITS = 50;
/** Extra cost of a 4k upscale over a normal image. */
const UPSCALE_EXTRA = 28;

export interface LedgerEntry {
  id: string;
  amount: number;
  balance_after: number;
  action: string;
  description: string;
  created_at: string;
}

export type WelcomeStatus = "granted" | "already" | "unverified" | "ip_limit";

export interface AccountSummary {
  credits: number;
  plan: string;
  ledger: LedgerEntry[];
  /** What happened to the welcome bonus on this call. */
  welcome: WelcomeStatus;
}

/** Caller IP (first x-forwarded-for hop), "" outside a request. */
async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
  } catch {
    return "";
  }
}

/** Creates the account on first use (with welcome credits) and returns its summary. */
export async function accountSummary(userId: string): Promise<AccountSummary> {
  const db = adminClient().database;
  const { error } = await db.rpc("ms_ensure_account", { p_user: userId, p_welcome: WELCOME_CREDITS });
  if (error) throw new Error(`Compte indisponible : ${error.message}`);
  // Welcome bonus: once, verified e-mails only, max 3 per IP address per 24 h (enforced in SQL).
  const { data: welcome } = await db.rpc("ms_grant_welcome", { p_user: userId, p_welcome: WELCOME_CREDITS, p_ip: await clientIp() });
  const [{ data: acc }, { data: ledger }] = await Promise.all([
    db.from("ms_accounts").select("credits, plan").eq("user_id", userId).limit(1),
    db.from("ms_credit_ledger").select("id, amount, balance_after, action, description, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);
  const row = (acc?.[0] as { credits: number; plan: string } | undefined) ?? { credits: 0, plan: "starter" };
  return { credits: row.credits, plan: row.plan, ledger: (ledger ?? []) as LedgerEntry[], welcome: (welcome as WelcomeStatus | null) ?? "already" };
}

/** Server-side price of one generation job, from the same catalog the UI shows. */
export function jobCost(req: GenerationRequest): number {
  if (req.kind === "image") return imageModel(req.model).credits + (req.upscale ? UPSCALE_EXTRA : 0);
  const withPhoto = (req.imageUrls?.length ?? 0) > 0 || (req.references?.length ?? 0) > 0;
  const shots = !withPhoto && videoModel(req.model).id === "kling-3.0" ? sanitizeShots(req.shots) : [];
  const seconds = shots.length ? shots.reduce((s, x) => s + x.duration, 0) : Number(req.durationSec) || 5;
  return videoCredits(req.kind === "video" && (req.references?.length ?? 0) > 0 ? "seedance-2.5" : req.model, seconds, withPhoto, req.light === true);
}

export class InsufficientCreditsError extends Error {
  constructor() {
    super("Crédits insuffisants pour cette génération.");
  }
}

/** Debits the credits and opens a job row; returns the job id. */
export async function startJob(userId: string, req: GenerationRequest, cost: number, description: string): Promise<string> {
  await accountSummary(userId); // make sure the account exists
  const { data, error } = await adminClient().database.rpc("ms_start_job", {
    p_user: userId, p_kind: req.kind, p_model: req.kind === "image" ? imageModel(req.model).id : videoModel(req.model).id, p_cost: cost, p_description: description.slice(0, 200),
  });
  if (error) {
    if (/insufficient_credits/.test(error.message)) throw new InsufficientCreditsError();
    throw new Error(error.message);
  }
  return data as string;
}

/** Refunds a job once (idempotent in the database). */
export async function refundJob(jobId: string, status: string): Promise<void> {
  await adminClient().database.rpc("ms_refund_job", { p_job: jobId, p_status: status });
}
