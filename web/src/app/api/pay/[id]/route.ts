import { NextResponse } from "next/server";
import { adminClient } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";
import { settlePayment } from "@/lib/pay/payments";

/** Status of the signed-in user's payment; settles it on the way (the customer is back from pawaPay). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous d'abord." }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
  const db = adminClient().database;
  const { data } = await db.from("ms_payments").select("id, user_id, pack_id, credits, amount, currency, status").eq("id", id).limit(1);
  const p = data?.[0] as { user_id: string; pack_id: string; credits: number; amount: number; currency: string; status: string } | undefined;
  if (!p || p.user_id !== user.id) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
  const status = p.status === "pending" ? await settlePayment(id).catch(() => "pending") : p.status;
  return NextResponse.json({ status, packId: p.pack_id, credits: p.credits, amount: p.amount, currency: p.currency });
}
