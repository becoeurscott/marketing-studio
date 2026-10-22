import { guard } from "@/lib/higgsfield/guard";
import { adminClient, MEDIA_BUCKET } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";
import { ImportError, importProduct } from "@/lib/product-import";

export const runtime = "nodejs";
export const maxDuration = 30;

/** POST { url } → the product photo re-hosted in our storage + name/price read from the page. */
export async function POST(request: Request) {
  const blocked = guard(request, { limit: 40 });
  if (blocked) return blocked;
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous pour importer un produit." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const link = typeof body?.url === "string" ? body.url.slice(0, 2000) : "";
  if (!link) return Response.json({ error: "Collez le lien de votre produit." }, { status: 400 });
  try {
    const p = await importProduct(/^https?:\/\//i.test(link) ? link : `https://${link}`);
    const { data, error } = await adminClient().storage.from(MEDIA_BUCKET)
      .upload(`u/${user.id}/uploads/${crypto.randomUUID()}.jpg`, new Blob([new Uint8Array(p.image)], { type: "image/jpeg" }));
    if (error || !data) throw new Error("upload_failed");
    return Response.json({ url: data.url, key: data.key, name: p.name, price: p.price ?? null, currency: p.currency ?? null, source: p.source });
  } catch (error) {
    if (error instanceof ImportError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Import indisponible. Réessayez ou importez la photo." }, { status: 503 });
  }
}
