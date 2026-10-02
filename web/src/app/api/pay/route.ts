import { NextResponse } from "next/server";
import { adminClient } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";
import { ISO3, createPaymentPage, isPawapayConfigured, toMsisdn } from "@/lib/pay/pawapay";
import { quote } from "@/lib/pay/payments";

/** Starts a Mobile Money purchase of a credit pack and returns the pawaPay payment page URL. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous d'abord." }, { status: 401 });
  if (!isPawapayConfigured()) return NextResponse.json({ error: "Le paiement Mobile Money n'est pas encore activé." }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { packId?: string; country?: string; phone?: string };
  const q = quote(String(body.packId ?? ""), String(body.country ?? ""));
  if (!q) return NextResponse.json({ error: "Offre inconnue." }, { status: 400 });

  const depositId = crypto.randomUUID();
  const db = adminClient().database;
  const { error } = await db.from("ms_payments").insert([{
    id: depositId, user_id: user.id, pack_id: q.pack.id, credits: q.pack.credits, amount: q.amount,
    currency: q.currency, country: q.country.code, amount_xof: q.pack.priceXof,
  }]);
  if (error) return NextResponse.json({ error: "Le paiement n'a pas pu démarrer. Réessayez." }, { status: 500 });

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  try {
    const url = await createPaymentPage({
      depositId, amount: q.amount, currency: q.currency, country: ISO3[q.country.code] ?? "CIV",
      phone: toMsisdn(body.phone, q.country.dialCode), returnUrl: `${origin}/credits/paiement?id=${depositId}`,
    });
    return NextResponse.json({ url, id: depositId });
  } catch (e) {
    await db.from("ms_payments").update({ status: "failed", raw: { error: String(e) }, updated_at: new Date().toISOString() }).eq("id", depositId);
    return NextResponse.json({ error: "Le paiement n'a pas pu démarrer. Réessayez dans un instant." }, { status: 502 });
  }
}
