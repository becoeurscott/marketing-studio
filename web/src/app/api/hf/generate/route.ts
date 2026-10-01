import { InsufficientCreditsError, accountSummary, jobCost, refundJob, startJob } from "@/lib/account";
import { guard } from "@/lib/higgsfield/guard";
import { errorResponse, submit, toModelInput } from "@/lib/higgsfield/server";
import type { GenerationRequest } from "@/lib/higgsfield/types";
import { getSessionUser } from "@/lib/insforge/server";
import { attachRequest } from "@/lib/jobs";

/**
 * Starts a Higgsfield generation for the signed-in user: the cost is computed and debited on the
 * server (refunded if Higgsfield rejects it), then the browser polls /api/hf/requests/[jobId].
 */
export async function POST(request: Request) {
  const blocked = guard(request, { limit: Number(process.env.HF_HOURLY_LIMIT) || 60 });
  if (blocked) return blocked;
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous pour générer." }, { status: 401 });

  let body: GenerationRequest;
  try {
    body = (await request.json()) as GenerationRequest;
    toModelInput(body); // validate before charging
  } catch (error) {
    return errorResponse(error);
  }

  const cost = jobCost(body);
  let jobId: string;
  try {
    jobId = await startJob(user.id, body, cost, `${body.kind === "video" ? "Vidéo" : "Image"} — ${String(body.prompt).slice(0, 60)}`);
  } catch (error) {
    if (error instanceof InsufficientCreditsError) return Response.json({ error: error.message, code: "insufficient-credits" }, { status: 402 });
    return errorResponse(error);
  }

  try {
    const job = await submit(body);
    await attachRequest(jobId, job.requestId, job.status);
    const { credits } = await accountSummary(user.id);
    return Response.json({ requestId: jobId, status: job.status, images: [], videoUrl: null, credits, cost });
  } catch (error) {
    await refundJob(jobId, "error");
    return errorResponse(error);
  }
}
