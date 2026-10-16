import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Higgsfield doesn't sign webhooks, so the callback URL carries our own token:
 * HMAC-SHA256(jobId, HF_WEBHOOK_SECRET). The webhook also never trusts the payload:
 * it re-fetches the status from Higgsfield before acting.
 */
function sign(jobId: string): string | null {
  const secret = process.env.HF_WEBHOOK_SECRET;
  return secret ? createHmac("sha256", secret).update(jobId).digest("hex") : null;
}

/** Public callback URL for a job, or undefined when webhooks aren't configured (the reconciler still finishes jobs). */
export function webhookUrlFor(jobId: string): string | undefined {
  const token = sign(jobId);
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!token || !base?.startsWith("https://")) return undefined;
  return `${base}/api/webhooks/higgsfield?gid=${encodeURIComponent(jobId)}&t=${token}`;
}

export function verifyWebhookToken(jobId: string, token: string): boolean {
  const expected = sign(jobId);
  if (!expected || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
