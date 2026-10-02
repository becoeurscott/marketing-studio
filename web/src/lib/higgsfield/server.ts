import "server-only";
import { config, higgsfield } from "@higgsfield/client/v2";
import { DEFAULT_VIDEO_MODEL, clampDuration, imageModel, videoModel } from "./models";
import type { GenerationJob, GenerationKind, GenerationRequest, HfPreset, JobStatus } from "./types";

/**
 * Server-side Higgsfield access. HF_CREDENTIALS ("key-id:key-secret") is read from the
 * environment at request time and never sent to the browser or logged.
 */
const API = "https://api.higgsfield.ai";

export const MODELS = {
  image: "marketing-studio/image",
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
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clampText = (s: unknown, max = 2000) => String(s ?? "").trim().slice(0, max);
const isHttpsUrl = (u: unknown): u is string => typeof u === "string" && /^https:\/\/\S+$/.test(u) && u.length < 2048;

/** Validates the browser payload and returns [model, input]. Throws Error with a user-facing message. */
export function toModelInput(req: GenerationRequest): [string, Record<string, unknown>] {
  const prompt = clampText(req.prompt);
  if (!prompt) throw new Error("Décrivez ce que vous voulez créer.");
  const images = (req.imageUrls ?? []).filter(isHttpsUrl).slice(0, 4);

  switch (req.kind as GenerationKind) {
    case "image": {
      if (imageModel(req.model).id === "soul-2") {
        const soulRatios = ["9:16", "16:9", "4:3", "3:4", "1:1", "2:3", "3:2"];
        return [imageModel("soul-2").endpoint, { prompt, batch_size: 1, resolution: "1080p", aspect_ratio: soulRatios.includes(req.aspectRatio ?? "") ? req.aspectRatio : "3:4", enhance_prompt: true }];
      }
      const ratio = IMAGE_RATIOS.has(req.aspectRatio ?? "") ? req.aspectRatio : "auto";
      const resolution = req.upscale ? "4k" : "2k";
      if (req.presetId) {
        // Preset (enhanced) mode: product photo first, optional model reference second.
        if (!UUID.test(req.presetId)) throw new Error("Style inconnu.");
        if (!images.length) throw new Error("Ce style a besoin d’une photo de votre produit.");
        const refs = isHttpsUrl(req.modelReferenceUrl) ? [images[0], req.modelReferenceUrl] : [images[0]];
        return [MODELS.image, { prompt, image_urls: refs, preset_id: req.presetId, enhance_prompt: true, aspect_ratio: ratio, resolution }];
      }
      return [MODELS.image, { prompt, aspect_ratio: ratio, resolution, ...(images.length ? { image_urls: images } : {}) }];
    }
    case "video": {
      const refs = (req.references ?? []).filter(isHttpsUrl).slice(0, 4);
      if (refs.length) {
        // Consistent characters: Seedance 2.5 reference-to-video with the creator sheet (+ product photo).
        const m = videoModel(DEFAULT_VIDEO_MODEL);
        const ratio = m.ratios.includes(req.aspectRatio ?? "") ? req.aspectRatio : "9:16";
        return [m.ref!, { prompt, image_urls: refs, duration: clampDuration(m, Number(req.durationSec) || 5), resolution: m.resolution(!!req.light), aspect_ratio: ratio, generate_audio: req.audio ?? true }];
      }
      // A product photo can only be animated by a model with an image-to-video mode.
      const chosen = videoModel(req.model);
      const m = images.length && !chosen.i2v ? videoModel(DEFAULT_VIDEO_MODEL) : chosen;
      const duration = clampDuration(m, Number(req.durationSec) || 5);
      const input: Record<string, unknown> = { prompt, duration };
      // Multi-shot ad (Kling 3.0 only): 1–6 custom shots, total ≤ 15 s.
      const shots = sanitizeShots(req.shots);
      if (shots.length && !images.length && m.id === "kling-3.0") {
        input.multi_shots = true;
        input.multi_prompt = shots;
        input.duration = shots.reduce((s, x) => s + x.duration, 0);
      }
      const resolution = m.resolution(!!req.light);
      if (resolution) input.resolution = resolution;
      if (m.audio === "generate_audio") input.generate_audio = req.audio ?? true;
      if (m.audio === "sound") input.sound = (req.audio ?? true) ? "on" : "off";
      if (images.length && m.i2v) return [m.i2v, { ...input, image_url: images[0] }];
      input.aspect_ratio = m.ratios.includes(req.aspectRatio ?? "") ? req.aspectRatio : m.ratios.includes("9:16") ? "9:16" : m.ratios[0];
      return [m.t2v, input];
    }
    default:
      throw new Error("Type de génération inconnu.");
  }
}

/** Valid Kling custom shots: up to 6, each 1–15 s and ≤ 512 characters, total ≤ 15 s. */
export function sanitizeShots(raw: unknown): { prompt: string; duration: number }[] {
  if (!Array.isArray(raw)) return [];
  const out: { prompt: string; duration: number }[] = [];
  let total = 0;
  for (const s of raw.slice(0, 6)) {
    const p = clampText((s as { prompt?: unknown })?.prompt, 512);
    const d = Math.max(1, Math.min(15, Math.round(Number((s as { duration?: unknown })?.duration) || 0)));
    if (!p || total + d > 15) break;
    out.push({ prompt: p, duration: d });
    total += d;
  }
  return out;
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

/* ---------- Presets ---------- */

let presetCache: { at: number; items: HfPreset[] } | null = null;

function pickPreview(item: Record<string, unknown>): string | null {
  // Field name isn't documented; take the first image-looking URL the catalog returns.
  for (const [k, v] of Object.entries(item)) {
    if (typeof v === "string" && /^https:\/\//.test(v) && /(preview|thumb|cover|image|url|media)/i.test(k)) return v;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const nested = pickPreview(v as Record<string, unknown>);
      if (nested) return nested;
    }
    if (Array.isArray(v) && v.length && typeof v[0] === "object") {
      const nested = pickPreview(v[0] as Record<string, unknown>);
      if (nested) return nested;
    }
  }
  return null;
}

/** Marketing Studio presets (cached 1 h). Fetched dynamically, as the API docs require. */
export async function listPresets(): Promise<HfPreset[]> {
  if (presetCache && Date.now() - presetCache.at < 3_600_000) return presetCache.items;
  const items: HfPreset[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 10; page++) {
    const q = new URLSearchParams({ size: "50", ...(cursor ? { cursor } : {}) });
    const res = await hfFetch(`/marketing-studio/image/presets?${q}`);
    if (!res.ok) throw new Error(`Styles indisponibles (${res.status}).`);
    const data = (await res.json()) as { items?: Record<string, unknown>[]; cursor?: string | null };
    for (const it of data.items ?? []) {
      items.push({ id: String(it.id), name: String(it.name ?? it.title ?? "Style"), type: String(it.type ?? ""), preview: pickPreview(it) });
    }
    cursor = data.cursor ?? null;
    if (!cursor || !data.items?.length) break;
  }
  presetCache = { at: Date.now(), items };
  return items;
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

/* ---------- Price estimates (free: nothing is generated) ---------- */

export interface Estimate { ok: boolean; credits?: number; usd?: number; status?: number; error?: string }

/** Asks Higgsfield what a request would cost, without generating it. */
export async function estimateRaw(endpoint: string, input: Record<string, unknown>): Promise<Estimate> {
  try {
    const res = await hfFetch(`/estimate/${endpoint}`, { method: "POST", body: JSON.stringify(input) });
    const text = await res.text();
    if (!res.ok) return { ok: false, status: res.status, error: text.slice(0, 160) };
    const j = JSON.parse(text) as { credits?: string | number; usd?: string | number };
    if (j.credits === undefined || j.usd === undefined) return { ok: false, status: res.status, error: `Réponse inattendue : ${text.slice(0, 900)}` };
    return { ok: true, credits: Number(j.credits), usd: Number(j.usd) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "estimate failed" };
  }
}

/** Estimate for an app request, mapped exactly like a real generation. */
export async function estimateRequest(req: GenerationRequest): Promise<Estimate & { endpoint?: string }> {
  try {
    const [endpoint, input] = toModelInput(req);
    return { ...(await estimateRaw(endpoint, input)), endpoint };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "invalid request" };
  }
}
