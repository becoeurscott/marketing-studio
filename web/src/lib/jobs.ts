import "server-only";
import { adminClient, MEDIA_BUCKET } from "./insforge/admin";
import { getJob } from "./higgsfield/server";
import { refundJob } from "./account";
import type { GenerationJob, JobStatus } from "./higgsfield/types";

interface JobRow {
  id: string;
  user_id: string;
  hf_request_id: string | null;
  kind: string;
  status: string;
  outputs: { url: string; key: string; type: "image" | "video" }[];
  finalized: boolean;
  refunded: boolean;
}

const COLS = "id, user_id, hf_request_id, kind, status, outputs, finalized, refunded";

function toJob(row: JobRow, status?: JobStatus): GenerationJob {
  const images = row.outputs.filter((o) => o.type === "image").map((o) => o.url);
  const video = row.outputs.find((o) => o.type === "video")?.url ?? null;
  return { requestId: row.id, status: status ?? (row.status as JobStatus), images, videoUrl: video };
}

/** Copies each output from Higgsfield's CDN (kept ~7 days) into our bucket. */
async function rehost(row: JobRow, hf: GenerationJob) {
  const storage = adminClient().storage.from(MEDIA_BUCKET);
  const sources = [
    ...hf.images.map((url) => ({ url, type: "image" as const })),
    ...(hf.videoUrl ? [{ url: hf.videoUrl, type: "video" as const }] : []),
  ];
  const outputs: JobRow["outputs"] = [];
  for (const [i, s] of sources.entries()) {
    const file = await fetch(s.url);
    if (!file.ok) throw new Error(`Téléchargement impossible (${file.status})`);
    const blob = await file.blob();
    const ext = s.type === "video" ? "mp4" : (blob.type.split("/")[1] || "png").replace("jpeg", "jpg");
    const { data, error } = await storage.upload(`u/${row.user_id}/jobs/${row.id}/${i}.${ext}`, blob);
    if (error || !data) throw new Error(error?.message ?? "Envoi vers le stockage impossible");
    outputs.push({ url: data.url, key: data.key, type: s.type });
  }
  return outputs;
}

/**
 * Current state of a user's job. On completion the media is re-hosted once; on failure,
 * moderation or cancellation the credits are refunded once. Safe to call repeatedly.
 */
export async function syncJob(userId: string, jobId: string): Promise<GenerationJob | null> {
  const db = adminClient().database;
  const { data } = await db.from("ms_jobs").select(COLS).eq("id", jobId).eq("user_id", userId).limit(1);
  const row = data?.[0] as JobRow | undefined;
  if (!row) return null;
  if (row.finalized || !row.hf_request_id) return toJob(row);

  const hf = await getJob(row.hf_request_id);
  if (hf.status === "completed" && (hf.images.length || hf.videoUrl)) {
    // Claim the job so concurrent polls don't upload twice.
    const { data: claimed } = await db.from("ms_jobs").update({ finalized: true, status: "completed", updated_at: new Date().toISOString() })
      .eq("id", row.id).eq("finalized", false).select("id");
    if (!claimed?.length) {
      const { data: fresh } = await db.from("ms_jobs").select(COLS).eq("id", row.id).limit(1);
      return toJob(fresh?.[0] as JobRow);
    }
    try {
      const outputs = await rehost(row, hf);
      await db.from("ms_jobs").update({ outputs, updated_at: new Date().toISOString() }).eq("id", row.id);
      return toJob({ ...row, outputs, status: "completed" });
    } catch {
      // Storage failed: keep the provider URLs so the user still gets the result now.
      const outputs = [...hf.images.map((url) => ({ url, key: "", type: "image" as const })), ...(hf.videoUrl ? [{ url: hf.videoUrl, key: "", type: "video" as const }] : [])];
      await db.from("ms_jobs").update({ outputs }).eq("id", row.id);
      return toJob({ ...row, outputs, status: "completed" });
    }
  }
  if (hf.status === "failed" || hf.status === "nsfw" || hf.status === "canceled" || (hf.status === "completed")) {
    // "completed" without outputs counts as a failure.
    const final = hf.status === "completed" ? "failed" : hf.status;
    await refundJob(row.id, final);
    return toJob(row, final);
  }
  if (hf.status !== row.status) await db.from("ms_jobs").update({ status: hf.status, updated_at: new Date().toISOString() }).eq("id", row.id);
  return toJob(row, hf.status);
}

export async function attachRequest(jobId: string, hfRequestId: string, status: JobStatus) {
  await adminClient().database.from("ms_jobs").update({ hf_request_id: hfRequestId, status, updated_at: new Date().toISOString() }).eq("id", jobId);
}
