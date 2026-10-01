import { isAdmin } from "@/lib/admin-token";
import { errorResponse, submit } from "@/lib/higgsfield/server";
import type { GenerationRequest } from "@/lib/higgsfield/types";

/** Admin-only: starts a generation for launch assets (no user credits). */
export async function POST(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: "Not found" }, { status: 404 });
  try {
    return Response.json(await submit((await request.json()) as GenerationRequest));
  } catch (error) {
    return errorResponse(error);
  }
}
