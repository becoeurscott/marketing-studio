import "server-only";

/**
 * pawaPay Mobile Money (same integration as the Sokozia video app). Sandbox unless
 * PAWAPAY_BASE_URL points to production. The token is server-only (PAWAPAY_API_TOKEN).
 */
const base = () => process.env.PAWAPAY_BASE_URL || "https://api.sandbox.pawapay.io";
const headers = () => ({ Authorization: `Bearer ${process.env.PAWAPAY_API_TOKEN}`, "Content-Type": "application/json" });

export const isPawapayConfigured = () => !!process.env.PAWAPAY_API_TOKEN;

/** ISO 3166 alpha-3 codes pawaPay expects, for the countries Sokozia sells in. */
export const ISO3: Record<string, string> = { SN: "SEN", CI: "CIV", ML: "MLI", BF: "BFA", CM: "CMR", CD: "COD", NG: "NGA", GH: "GHA", KE: "KEN" };

/** International number without "+" (e.g. 2250700000000). Côte d'Ivoire keeps its leading 0 (10 digits). */
export function toMsisdn(phone: string | null | undefined, dial: string): string | null {
  let d = String(phone ?? "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith(dial)) return d;
  if (dial !== "225") d = d.replace(/^0+/, "");
  return dial + d;
}

/** Hosted pawaPay page where the customer picks their operator and confirms on their phone. */
export async function createPaymentPage(o: { depositId: string; amount: number; currency: string; country: string; returnUrl: string; phone?: string | null }): Promise<string> {
  const res = await fetch(`${base()}/v2/paymentpage`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      depositId: o.depositId,
      returnUrl: o.returnUrl,
      amountDetails: { amount: String(o.amount), currency: o.currency },
      country: o.country,
      ...(o.phone ? { phoneNumber: o.phone } : {}),
      reason: "Credits Sokozia",
      customerMessage: "Sokozia",
      language: "FR",
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.redirectUrl) {
    const msg = json.failureReason?.failureMessage || `pawapay ${res.status}`;
    // Number refused or operator not enabled: retry without it, the page then lets the customer choose.
    if (o.phone && (/phone/i.test(msg) || json.failureReason?.failureCode === "DEPOSITS_NOT_ALLOWED")) return createPaymentPage({ ...o, phone: null });
    throw new Error(msg);
  }
  return json.redirectUrl as string;
}

/** Always re-check the status with pawaPay; never trust a callback body alone. */
export async function depositStatus(depositId: string) {
  const res = await fetch(`${base()}/v2/deposits/${depositId}`, { headers: headers(), cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  const d = json.data ?? json;
  return {
    found: res.ok,
    status: String(d.status ?? "").toUpperCase(), // COMPLETED | FAILED | ACCEPTED | SUBMITTED | …
    amount: Number(d.amount ?? 0),
    currency: String(d.currency ?? ""),
    provider: (d.payer?.accountDetails?.provider ?? null) as string | null,
    raw: json,
  };
}
