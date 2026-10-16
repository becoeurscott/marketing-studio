import { after } from "next/server";
import { verifyWebhookToken } from "@/lib/higgsfield/webhook-token";
import { finalizeJob } from "@/lib/jobs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Re-hosting a video can take longer than Higgsfield's 10 s webhook timeout: finish after replying. */
export const maxDuration = 60;

/**
 * Higgsfield callback (`?hf_webhook=`) for completed / failed / nsfw jobs. The payload is never
 * trusted: we check our token, then finalizeJob re-fetches the status and acts on it (idempotent,
 * so duplicate deliveries are harmless).
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("gid") ?? "";
  const token = url.searchParams.get("t") ?? "";
  if (!UUID.test(jobId) || !verifyWebhookToken(jobId, token)) return new Response("Not found", { status: 404 });
  after(async () => {
    try { await finalizeJob(jobId); } catch { /* the reconciler retries */ }
  });
  return Response.json({ ok: true });
}
