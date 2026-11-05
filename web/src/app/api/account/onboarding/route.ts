import { adminClient } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous." }, { status: 401 });
  const db = adminClient().database;
  const { error } = await db.rpc("ms_complete_onboarding", { p_user: user.id });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
