import "server-only";
import { config, higgsfield } from "@higgsfield/client/v2";
import type { GenerationJob, GenerationKind, GenerationRequest, JobStatus } from "./types";

/**
 * Server-side Higgsfield access. HF_CREDENTIALS ("key-id:key-secret") is read from the
 * environment at request time and never sent to the browser or logged.
 */
const API = "https://api.higgsfield.ai";

export const MODELS = {
  image: "marketing-studio/image",
  textToVideo: "bytedance/seedance-2.5/text-to-video",
  imageToVideo: "bytedance/seedance-2.5/image-to-video",
} as const;

export class NotConfiguredError extends Error {
  constructor() {
    super("La génération n’est pas encore activée sur ce serveur (clé Higgsfield manquante).");
  }
}

function credentials(): string {
  const c = process.env.HF_CREDENTIALS;
  if (!c || !c.includes(":")) throw new NotConfiguredError();
  return c;
}

let configured = false;
function client() {
  if (!configured) {
    config({ credentials: credentials() });
    configured = true;
  }
  return higgsfield;
}

async function hfFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Key ${credentials()}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
}

/* ---------- Mapping app requests → model inputs ---------- */

const IMAGE_RATIOS = new Set(["auto", "1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "21:9"]);
const VIDEO_RATIOS = new Set(["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"]);
const clampText = (s: unknown, max = 2000) => String(s ?? "").trim().slice(0, max);
const isHttpsUrl = (u: unknown): u is string => typeof u === "string" && /^https:\/\/\S+$/.test(u) && u.length < 2048;

/** Validates the browser payload and returns [model, input]. Throws Error with a user-facing message. */
export function toModelInput(req: GenerationRequest): [string, Record<string, unknown>] {
  const prompt = clampText(req.prompt);
  if (!prompt) throw new Error("Décrivez ce que vous voulez créer.");
  const images = (req.imageUrls ?? []).filter(isHttpsUrl).slice(0, 4);

  switch (req.kind as GenerationKind) {
    case "image": {
      const ratio = IMAGE_RATIOS.has(req.aspectRatio ?? "") ? req.aspectRatio : "auto";
      return [MODELS.image, { prompt, aspect_ratio: ratio, resolution: req.upscale ? "4k" : "2k", ...(images.length ? { image_urls: images } : {}) }];
    }
    case "video": {
      const duration = Math.min(15, Math.max(4, Math.round(Number(req.durationSec) || 5)));
      const resolution = req.light ? "480p" : "720p";
      if (images.length) {
        return [MODELS.imageToVideo, { image_url: images[0], prompt, duration, resolution, generate_audio: req.audio ?? true }];
      }
      const ratio = VIDEO_RATIOS.has(req.aspectRatio ?? "") ? req.aspectRatio : "9:16";
      return [MODELS.textToVideo, { prompt, duration, resolution, aspect_ratio: ratio, generate_audio: req.audio ?? true }];
    }
    default:
      throw new Error("Type de génération inconnu.");
  }
}

/* ---------- Jobs ---------- */

type RawResponse = {
  status: string;
  request_id: string;
  images?: { url: string }[];
  video?: { url: string };
};

function normalize(r: RawResponse): GenerationJob {
  const known: JobStatus[] = ["queued", "in_progress", "completed", "failed", "nsfw", "canceled"];
  const status = (known.includes(r.status as JobStatus) ? r.status : "failed") as JobStatus;
  return {
    requestId: r.request_id,
    status,
    images: r.images?.map((i) => i.url).filter(Boolean) ?? [],
    videoUrl: r.video?.url ?? null,
  };
}

/** Submits without waiting; the browser polls getJob() so no request outlives the function timeout. */
export async function submit(req: GenerationRequest): Promise<GenerationJob> {
  const [model, input] = toModelInput(req);
  const res = (await client().subscribe(model, { input, withPolling: false })) as RawResponse;
  return normalize(res);
}

const REQUEST_ID = /^[A-Za-z0-9_-]{8,80}$/;

export async function getJob(requestId: string): Promise<GenerationJob> {
  if (!REQUEST_ID.test(requestId)) throw new Error("Identifiant de requête invalide.");
  const res = await hfFetch(`/requests/${encodeURIComponent(requestId)}/status`);
  if (!res.ok) throw new Error(`Statut indisponible (${res.status}).`);
  return normalize((await res.json()) as RawResponse);
}

/* ---------- Uploads ---------- */

const UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Uploads a product photo to Higgsfield storage and returns its public URL. */
export async function uploadImage(bytes: ArrayBuffer, contentType: string): Promise<string> {
  if (!UPLOAD_TYPES.has(contentType)) throw new Error("Format non pris en charge : utilisez JPG, PNG ou WebP.");
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new Error("Photo trop lourde (4 Mo maximum).");
  const res = await hfFetch("/files/generate-upload-url", { method: "POST", body: JSON.stringify({ content_type: contentType }) });
  if (!res.ok) throw new Error(`Impossible de préparer l’envoi (${res.status}).`);
  const { upload_url, public_url, upload_headers } = (await res.json()) as { upload_url: string; public_url: string; upload_headers?: Record<string, string> };
  const put = await fetch(upload_url, { method: "PUT", headers: upload_headers ?? { "Content-Type": contentType }, body: bytes });
  if (!put.ok) throw new Error(`Échec de l’envoi de la photo (${put.status}).`);
  return public_url;
}

/** Maps SDK/API errors to a status code and a message safe to show users (never includes credentials). */
export function errorResponse(error: unknown): Response {
  if (error instanceof NotConfiguredError) return Response.json({ error: error.message }, { status: 503 });
  const name = error instanceof Error ? error.constructor.name : "";
  if (name === "AuthenticationError") return Response.json({ error: "Clé Higgsfield invalide côté serveur." }, { status: 502 });
  if (name === "NotEnoughCreditsError") return Response.json({ error: "Le compte Higgsfield n’a plus assez de crédits." }, { status: 402 });
  if (name === "ValidationError" || name === "BadInputError") return Response.json({ error: "Paramètres refusés par le modèle." }, { status: 422 });
  const message = error instanceof Error ? error.message : "Erreur inconnue.";
  return Response.json({ error: message }, { status: 400 });
}
