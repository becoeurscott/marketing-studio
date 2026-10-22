import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { adminClient } from "@/lib/insforge/admin";
import { MONTHLY_PLANS, type MonthlyPlan } from "@/lib/market";

/**
 * Stripe monthly passes (card). Plain REST calls, no SDK. Credits are granted per paid invoice
 * through ms_complete_payment (exactly once), at 10 FCFA per credit like the packs.
 */
const API = "https://api.stripe.com/v1";
export const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY ?? "xof").toLowerCase();

export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

function form(params: Record<string, string | number | undefined>, prefix = ""): string[] {
  return Object.entries(params).flatMap(([k, v]) => (v === undefined ? [] : [`${encodeURIComponent(prefix ? `${prefix}[${k}]` : k)}=${encodeURIComponent(String(v))}`]));
}

export async function stripe<T = Record<string, unknown>>(path: string, params?: Record<string, string | number | undefined>, method = "POST"): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe n'est pas configuré.");
  const body = params ? form(params).join("&") : undefined;
  const res = await fetch(`${API}${path}${method === "GET" && body ? `?${body}` : ""}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "GET" ? undefined : body,
    cache: "no-store",
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? `Stripe ${res.status}`);
  return json;
}

export const planById = (id: unknown): MonthlyPlan | undefined => MONTHLY_PLANS.find((p) => p.id === id);

/** Stripe customer of a user, created on first checkout. */
export async function customerFor(userId: string, email: string): Promise<string> {
  const db = adminClient().database;
  const { data } = await db.from("ms_subscriptions").select("customer_id").eq("user_id", userId).limit(1);
  const existing = (data?.[0] as { customer_id: string } | undefined)?.customer_id;
  if (existing) return existing;
  const c = await stripe<{ id: string }>("/customers", { email, "metadata[user_id]": userId });
  await db.from("ms_subscriptions").upsert([{ user_id: userId, customer_id: c.id, status: "none", updated_at: new Date().toISOString() }], { onConflict: "user_id" });
  return c.id;
}

/** Verifies the Stripe-Signature header (v1 HMAC, 5 min tolerance). */
export function verifyStripeSignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  return header.split(",").some((p) => {
    const [k, v] = p.split("=");
    return k === "v1" && v?.length === expected.length && timingSafeEqual(Buffer.from(v), Buffer.from(expected));
  });
}

/** Stable UUID for a Stripe object id, so the same invoice can only be credited once. */
export function uuidFor(stripeId: string): string {
  const h = createHash("sha256").update(`stripe:${stripeId}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** Credits a paid invoice once (ms_payments row keyed by the invoice id). */
export async function creditInvoice(invoiceId: string, userId: string, plan: MonthlyPlan, amount: number): Promise<boolean> {
  const db = adminClient().database;
  const id = uuidFor(invoiceId);
  await db.from("ms_payments").upsert([{
    id, user_id: userId, pack_id: `abonnement_${plan.id}`, credits: plan.credits, amount: Math.max(1, amount),
    currency: STRIPE_CURRENCY.toUpperCase(), country: "XX", amount_xof: plan.priceXof,
  }], { onConflict: "id", ignoreDuplicates: true });
  const { data, error } = await db.rpc("ms_complete_payment", { p_payment: id, p_provider: "stripe", p_raw: { invoice: invoiceId } });
  if (error) throw new Error(error.message);
  return data === true;
}

export async function saveSubscription(row: { user_id: string; customer_id: string; subscription_id: string; plan: string; status: string; current_period_end: string | null }) {
  await adminClient().database.from("ms_subscriptions").upsert([{ ...row, updated_at: new Date().toISOString() }], { onConflict: "user_id" });
}
