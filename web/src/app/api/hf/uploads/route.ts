import { guard } from "@/lib/higgsfield/guard";
import { errorResponse, uploadImage } from "@/lib/higgsfield/server";

/** Receives a product photo (raw body, Content-Type image/*) and stores it on Higgsfield. */
export async function POST(request: Request) {
  const blocked = guard(request, { limit: 60 });
  if (blocked) return blocked;
  try {
    const contentType = (request.headers.get("content-type") ?? "").split(";")[0].trim();
    const url = await uploadImage(await request.arrayBuffer(), contentType);
    return Response.json({ url });
  } catch (error) {
    return errorResponse(error);
  }
}
