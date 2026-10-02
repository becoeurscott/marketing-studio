import "server-only";
import { adminClient } from "@/lib/insforge/admin";
import { COUNTRIES, TOP_UP_PACKS, USAGE_PACKS, convertXof, countryOf, type CountryCode } from "@/lib/market";
import { depositStatus } from "./pawapay";

export const PACKS = [...USAGE_PACKS, ...TOP_UP_PACKS];

export type PaymentStatus = "pending" | "completed" | "failed" | "unknown";

/** Server-side quote: the amount always comes from the catalog, never from the browser. */
export function quote(packId: string, countryCode: string) {
  const pack = PACKS.find((p) => p.id === packId);
  if (!pack) return null;
  const country = countryOf(COUNTRIES.some((c) => c.code === countryCode) ? (countryCode as CountryCode) : null);
  return { pack, country, amount: Math.round(convertXof(pack.priceXof, country.currency)), currency: country.currency };
}

/**
 * Settles a payment idempotently: re-checks the deposit with pawaPay, then credits once
 * (ms_complete_payment flips pending → completed in the same statement that adds the credits).
 */
export async function settlePayment(paymentId: string): Promise<PaymentStatus> {
  const db = adminClient().database;
  const { data } = await db.from("ms_payments").select("id, status, amount, currency").eq("id", paymentId).limit(1);
  const p = data?.[0] as { id: string; status: PaymentStatus; amount: number; currency: string } | undefined;
  if (!p) return "unknown";
  if (p.status !== "pending") return p.status;

  const d = await depositStatus(paymentId);
  if (d.status === "FAILED") {
    await db.from("ms_payments").update({ status: "failed", raw: d.raw, updated_at: new Date().toISOString() }).eq("id", paymentId).eq("status", "pending");
    return "failed";
  }
  if (d.status !== "COMPLETED" || d.amount < p.amount || d.currency !== p.currency) return "pending";

  const { error } = await db.rpc("ms_complete_payment", { p_payment: paymentId, p_provider: d.provider, p_raw: d.raw });
  if (error) throw new Error(error.message);
  return "completed";
}
