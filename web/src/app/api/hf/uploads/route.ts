import { guard } from "@/lib/higgsfield/guard";
import { adminClient, MEDIA_BUCKET } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";
import { normalizePhoto, UploadError } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const blocked = guard(request, { limit: 120 });
  if (blocked) return blocked;
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous pour importer une photo." }, { status: 401 });
  try {
    const bytes = await normalizePhoto(request);
    const { data, error } = await adminClient().storage.from(MEDIA_BUCKET)
      .upload(`u/${user.id}/uploads/${crypto.randomUUID()}.jpg`, new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }));
    if (error || !data) throw new Error("upload_failed");
    return Response.json({ url: data.url, key: data.key });
  } catch (error) {
    if (error instanceof UploadError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Envoi indisponible. Réessayez plus tard." }, { status: 503 });
  }
}
