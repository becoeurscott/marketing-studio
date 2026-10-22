import { timingSafeEqual } from "node:crypto";
import { reconcileJobs } from "@/lib/jobs";

export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  const given = request.headers.get("x-cron-secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return !!secret && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

/** Scheduled every few minutes (InsForge schedule): finishes or refunds jobs nobody is polling. */
async function handle(request: Request) {
  if (!authorized(request)) return new Response("Not found", { status: 404 });
  return Response.json(await reconcileJobs());
}

export const GET = handle;
export const POST = handle;
