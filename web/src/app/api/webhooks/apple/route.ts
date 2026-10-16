import { creditTransaction, fetchTransaction, jwsPayload } from "@/lib/billing/apple";

/**
 * App Store Server Notifications V2 (renewals while the app is closed). The notification body is
 * only used to learn the transaction id: the transaction itself is re-fetched from Apple, and its
 * owner comes from appAccountToken (our user id, set at purchase).
 */
export async function POST(request: Request) {
  try {
    const { signedPayload } = (await request.json()) as { signedPayload?: string };
    if (!signedPayload) return new Response("Bad request", { status: 400 });
    const n = jwsPayload<{ notificationType: string; data?: { signedTransactionInfo?: string } }>(signedPayload);
    const info = n.data?.signedTransactionInfo ? jwsPayload<{ transactionId: string }>(n.data.signedTransactionInfo) : null;
    if (info && ["SUBSCRIBED", "DID_RENEW", "ONE_TIME_CHARGE"].includes(n.notificationType)) {
      const tx = await fetchTransaction(info.transactionId);
      if (tx?.appAccountToken) await creditTransaction(tx, tx.appAccountToken);
    }
  } catch {
    return new Response("Retry later", { status: 500 });
  }
  return Response.json({ ok: true });
}
