/**
 * Browser helpers for the /api/hf routes. Credentials never reach the browser:
 * every call goes through our server, which talks to Higgsfield.
 */
import { isFinal, type GenerationJob, type GenerationRequest, type JobStatus } from "./types";

const POLL_MS = 4000;
const MAX_WAIT_MS = 15 * 60 * 1000;

export class GenerationError extends Error {
  constructor(message: string, readonly status?: JobStatus | number) {
    super(message);
  }
}

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new GenerationError(data.error ?? `Erreur serveur (${res.status}).`, res.status);
  return data;
}

const FAILURE: Record<string, string> = {
  failed: "La génération a échoué. Vos crédits ont été rendus, vous pouvez réessayer.",
  nsfw: "Le contenu a été refusé par la modération. Modifiez la description ou la photo.",
  canceled: "La génération a été annulée.",
};

/** Starts a job and polls until it finishes. Resolves only on success with at least one output. */
export async function runJob(req: GenerationRequest, onStatus?: (s: JobStatus) => void): Promise<GenerationJob> {
  let job = await readJson<GenerationJob>(
    await fetch("/api/hf/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req) }),
  );
  const started = Date.now();
  onStatus?.(job.status);
  while (!isFinal(job.status)) {
    if (Date.now() - started > MAX_WAIT_MS) throw new GenerationError("La génération prend trop de temps. Réessayez plus tard.");
    await new Promise((r) => setTimeout(r, POLL_MS));
    job = await readJson<GenerationJob>(await fetch(`/api/hf/requests/${encodeURIComponent(job.requestId)}`, { cache: "no-store" }));
    onStatus?.(job.status);
  }
  if (job.status !== "completed") throw new GenerationError(FAILURE[job.status] ?? FAILURE.failed, job.status);
  if (!job.images.length && !job.videoUrl) throw new GenerationError(FAILURE.failed, "failed");
  return job;
}

/** Shrinks a phone photo (max 2000 px, JPEG) so it stays under the upload limit, then uploads it. */
export async function uploadPhoto(file: File): Promise<string> {
  const body = await compress(file);
  const res = await fetch("/api/hf/uploads", { method: "POST", headers: { "Content-Type": body.type }, body });
  return (await readJson<{ url: string }>(res)).url;
}

async function compress(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new GenerationError("Choisissez une photo (JPG, PNG ou WebP).");
  if (file.size < 1.5 * 1024 * 1024 && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new GenerationError("Impossible de lire cette photo."))), "image/jpeg", 0.88),
  );
}
