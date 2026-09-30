import { guard } from "@/lib/higgsfield/guard";
import { errorResponse, submit } from "@/lib/higgsfield/server";
import type { GenerationRequest } from "@/lib/higgsfield/types";

/** Starts a Higgsfield generation and returns the job; the browser then polls /api/hf/requests/[id]. */
export async function POST(request: Request) {
  const blocked = guard(request, { limit: Number(process.env.HF_HOURLY_LIMIT) || 30 });
  if (blocked) return blocked;
  try {
    const body = (await request.json()) as GenerationRequest;
    return Response.json(await submit(body));
  } catch (error) {
    return errorResponse(error);
  }
}
