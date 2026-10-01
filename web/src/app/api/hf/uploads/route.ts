import { guard } from "@/lib/higgsfield/guard";
import { errorResponse } from "@/lib/higgsfield/server";
import { adminClient, MEDIA_BUCKET } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 4 * 1024 * 1024;

/** Stores a product photo in the user's space (public URL Higgsfield can read, never expires). */
export async function POST(request: Request) {
  const blocked = guard(request, { limit: 120 });
  if (blocked) return blocked;
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous pour importer une photo." }, { status: 401 });
  try {
    const type = (request.headers.get("content-type") ?? "").split(";")[0].trim();
    const ext = TYPES[type];
    if (!ext) return Response.json({ error: "Format non pris en charge : utilisez JPG, PNG ou WebP." }, { status: 415 });
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) return Response.json({ error: "Photo trop lourde (4 Mo maximum)." }, { status: 413 });
    const { data, error } = await adminClient().storage.from(MEDIA_BUCKET)
      .upload(`u/${user.id}/uploads/${crypto.randomUUID()}.${ext}`, new Blob([bytes], { type }));
    if (error || !data) throw new Error(error?.message ?? "Envoi impossible");
    return Response.json({ url: data.url });
  } catch (error) {
    return errorResponse(error);
  }
}
