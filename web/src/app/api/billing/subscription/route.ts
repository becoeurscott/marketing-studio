import { adminClient } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";

/** Current monthly pass of the signed-in user (web + iOS). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous." }, { status: 401 });
  const { data } = await adminClient().database.from("ms_subscriptions").select("plan, status, current_period_end").eq("user_id", user.id).limit(1);
  const row = data?.[0] as { plan: string | null; status: string; current_period_end: string | null } | undefined;
  return Response.json(row ?? { plan: null, status: "none", current_period_end: null }, { headers: { "Cache-Control": "no-store" } });
}
