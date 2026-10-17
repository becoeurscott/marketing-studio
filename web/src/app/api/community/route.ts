import { NextResponse } from "next/server";
import { adminClient } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";
import type { CommunityPost } from "@/lib/community";

const COLS = "id, user_id, kind, url, poster, prompt, model_label, ratio, author, created_at";
type Row = { id: string; user_id: string; kind: CommunityPost["kind"]; url: string; poster: string | null; prompt: string; model_label: string; ratio: string; author: string; created_at: string };

/** Only media re-hosted in our own storage, under the publisher's own folder, can be published. */
function ownsMedia(url: unknown, userId: string): url is string {
  const base = process.env.NEXT_PUBLIC_INSFORGE_URL ?? "";
  return typeof url === "string" && !!base && url.startsWith(base) && decodeURIComponent(url).includes(`u/${userId}/`);
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const kind = q.get("kind");
  const before = q.get("before");
  let query = adminClient().database.from("ms_community_posts").select(COLS).eq("hidden", false).order("created_at", { ascending: false }).limit(40);
  if (kind === "image" || kind === "video" || kind === "ugc") query = query.eq("kind", kind);
  if (before) query = query.lt("created_at", before);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Impossible de charger la communauté." }, { status: 500 });
  const posts: CommunityPost[] = ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id, kind: r.kind, url: r.url, poster: r.poster, prompt: r.prompt, modelLabel: r.model_label, ratio: r.ratio, author: r.author, mine: r.user_id === user.id, createdAt: r.created_at,
  }));
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !ownsMedia(body.url, user.id)) return NextResponse.json({ error: "Seules vos propres créations peuvent être publiées." }, { status: 400 });
  const kind = body.kind === "video" || body.kind === "ugc" ? body.kind : "image";
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const row = {
    user_id: user.id, kind, url: body.url,
    poster: ownsMedia(body.poster, user.id) ? body.poster : null,
    prompt: str(body.prompt, 2000), model_label: str(body.modelLabel, 60), ratio: str(body.ratio, 8) || "4:5",
    author: (user.name || user.email.split("@")[0]).slice(0, 40),
  };
  const db = adminClient().database;
  const { data: existing } = await db.from("ms_community_posts").select("id").eq("user_id", user.id).eq("url", row.url).limit(1);
  if (existing?.length) {
    await db.from("ms_community_posts").update({ hidden: false }).eq("id", (existing[0] as { id: string }).id);
    return NextResponse.json({ id: (existing[0] as { id: string }).id });
  }
  const { data, error } = await db.from("ms_community_posts").insert([row]).select("id");
  if (error) return NextResponse.json({ error: "Publication impossible." }, { status: 500 });
  return NextResponse.json({ id: (data?.[0] as { id: string } | undefined)?.id });
}
