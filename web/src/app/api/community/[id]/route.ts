import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin/server";
import { adminClient } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";

/** Unpublish: the author removes their post, an admin hides anyone's. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const db = adminClient().database;
  if (await currentAdmin()) {
    await db.from("ms_community_posts").update({ hidden: true }).eq("id", id);
  } else {
    await db.from("ms_community_posts").delete().eq("id", id).eq("user_id", user.id);
  }
  return NextResponse.json({ ok: true });
}
