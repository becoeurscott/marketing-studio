import { accountSummary } from "@/lib/account";
import { getSessionUser } from "@/lib/insforge/server";

/** Credit balance, plan and recent credit history of the signed-in user (server truth). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous." }, { status: 401 });
  try {
    return Response.json(await accountSummary(user.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erreur" }, { status: 500 });
  }
}
