import { accountSummary } from "@/lib/account";
import { appleConfigured, creditTransaction, fetchTransaction } from "@/lib/billing/apple";
import { getSessionUser } from "@/lib/insforge/server";

/**
 * iOS sends the id of a StoreKit transaction after a purchase (or a renewal seen by the app).
 * We fetch it from Apple, check it belongs to this user (appAccountToken = user id), then credit once.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous." }, { status: 401 });
  if (!appleConfigured()) return Response.json({ error: "Achats intégrés bientôt disponibles." }, { status: 503 });
  const { transactionId } = (await request.json().catch(() => ({}))) as { transactionId?: string };
  try {
    const tx = await fetchTransaction(String(transactionId ?? ""));
    if (!tx) return Response.json({ error: "Achat introuvable." }, { status: 404 });
    if (!tx.appAccountToken || tx.appAccountToken.toLowerCase() !== user.id.toLowerCase()) return Response.json({ error: "Achat introuvable." }, { status: 404 });
    const granted = await creditTransaction(tx, user.id);
    const { credits } = await accountSummary(user.id);
    return Response.json({ granted, credits });
  } catch {
    return Response.json({ error: "Vérification de l'achat impossible. Réessayez." }, { status: 502 });
  }
}
