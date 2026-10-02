import { NextResponse } from "next/server";
import { settlePayment } from "@/lib/pay/payments";

/** pawaPay callback: only the id is read; the status is re-checked with pawaPay before crediting. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { depositId?: string; data?: { depositId?: string } };
  const id = String(body.depositId ?? body.data?.depositId ?? "");
  if (/^[0-9a-f-]{36}$/i.test(id)) await settlePayment(id).catch(() => null);
  return NextResponse.json({ ok: true });
}
