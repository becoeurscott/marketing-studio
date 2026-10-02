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
  updated_at: string;
}

const COLS = "id, user_id, hf_request_id, kind, status, outputs, finalized, refunded, updated_at";

function toJob(row: JobRow, status?: JobStatus): GenerationJob {
  const images = row.outputs.filter((o) => o.type === "image").map((o) => o.url);
  const video = row.outputs.find((o) => o.type === "video")?.url ?? null;
  return { requestId: row.id, status: status ?? (!row.finalized && row.status === "completed" ? "in_progress" : row.status as JobStatus), images, videoUrl: video };
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
    const file = await fetch(s.url, { signal: AbortSignal.timeout(45_000) });
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
  const { data, error } = await db.from("ms_jobs").select(COLS).eq("id", jobId).eq("user_id", userId).limit(1);
  if (error) throw new Error("Impossible de lire la génération.");
  const row = data?.[0] as JobRow | undefined;
  if (!row) return null;
  if (row.finalized || !row.hf_request_id) return toJob(row);

  const hf = await getJob(row.hf_request_id);
  if (hf.status === "completed" && (hf.images.length || hf.videoUrl)) {
    // Completed + not finalized is a five-minute storage lease, never a client success.
    // Match updated_at so only one concurrent poll acquires it; an expired lease retries
    // after a crashed worker or a temporary storage outage.
    if (row.status === "completed" && Date.now() - Date.parse(row.updated_at) < 300_000) {
      return toJob(row, "in_progress");
    }
    const leaseAt = new Date().toISOString();
    const { data: claimed, error: claimError } = await db.from("ms_jobs")
      .update({ status: "completed", updated_at: leaseAt })
      .eq("id", row.id).eq("finalized", false).eq("updated_at", row.updated_at).select("id");
    if (claimError) throw new Error("Impossible de préparer le résultat.");
    if (!claimed?.length) return toJob(row, "in_progress");
    try {
      const outputs = await rehost(row, hf);
      const { data: saved, error: saveError } = await db.from("ms_jobs")
        .update({ outputs, finalized: true, status: "completed", updated_at: new Date().toISOString() })
        .eq("id", row.id).eq("finalized", false).eq("updated_at", leaseAt).select("id");
      if (saveError) throw new Error("Impossible de sauvegarder le résultat.");
      if (!saved?.length) return toJob(row, "in_progress");
      return toJob({ ...row, outputs, finalized: true, status: "completed" });
    } catch {
      // Keep the lease retryable. Expiring provider URLs must not become saved assets.
      return toJob(row, "in_progress");
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
  const { error } = await adminClient().database.from("ms_jobs").update({ hf_request_id: hfRequestId, status, updated_at: new Date().toISOString() }).eq("id", jobId);
  if (error) throw new Error("Impossible de sauvegarder la génération acceptée.");
}
