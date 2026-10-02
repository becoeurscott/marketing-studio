import { InsufficientCreditsError, accountSummary, jobCost, refundJob, startJob } from "@/lib/account";
import { guard } from "@/lib/higgsfield/guard";
import { errorResponse, submit, toModelInput } from "@/lib/higgsfield/server";
import type { GenerationRequest } from "@/lib/higgsfield/types";
import { getSessionUser } from "@/lib/insforge/server";
import { attachRequest } from "@/lib/jobs";

export async function POST(request: Request) {
  const blocked = guard(request, { limit: Number(process.env.HF_HOURLY_LIMIT) || 60 });
  if (blocked) return blocked;
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous pour générer." }, { status: 401 });
  let body: GenerationRequest;
  try {
    body = (await request.json()) as GenerationRequest;
    toModelInput(body);
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
  let job;
  try {
    job = await submit(body);
  } catch (error) {
    await refundJob(jobId, "error");
    return errorResponse(error);
  }
  // After provider acceptance, failures to attach or read the balance must never refund
  // an active generation. Record identifiers for operational reconciliation, without prompts.
  try {
    await attachRequest(jobId, job.requestId, job.status);
  } catch {
    console.error("generation_attachment_failed", { jobId, providerRequestId: job.requestId });
    return Response.json({ error: "Génération acceptée, mais synchronisation indisponible. Ne relancez pas cette génération ; contactez le support avec cette référence.", requestId: jobId }, { status: 503 });
  }
  let credits: number | undefined;
  try { credits = (await accountSummary(user.id)).credits; }
  catch { console.error("generation_balance_read_failed", { jobId }); }
  return Response.json({ requestId: jobId, status: job.status, images: [], videoUrl: null, credits, cost });
}
