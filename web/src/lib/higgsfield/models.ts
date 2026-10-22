/**
 * Higgsfield models offered in Marketing Studio, priced in credits only (never provider prices).
 *
 * Pricing rule (2026-10-16): the user pays the real Higgsfield cost × 1.5 (50 % profit on every
 * generation), in credits worth 10 FCFA each (1 $ = 590 FCFA):
 *   credits = ceil(usd × 590 × 1.5 / 10)
 * Real costs measured with the Higgsfield estimate endpoint on 2026-10-16 (Seedance / Cinema
 * Studio use their published per-second token rate for 16:9 / 9:16). Update the `usd…` values
 * when Higgsfield changes prices. Shared by the browser (labels, costs) and the server (charges).
 */

/** Value of one credit for the user, in FCFA. */
export const CREDIT_XOF = 10;
/** Selling price = cost × MARGIN. */
export const MARGIN = 1.5;
/** FCFA per US dollar used to convert Higgsfield costs. */
export const XOF_PER_USD = 590;

/** Credits charged for a Higgsfield cost in dollars (rounded up, never 0). */
export const creditsForUsd = (usd: number) => Math.max(1, Math.ceil((usd * XOF_PER_USD * MARGIN) / CREDIT_XOF - 1e-9));

export type VideoModelId = "seedance-2.5" | "kling-3.0" | "minimax-h3" | "wan-3.0-prime" | "seedance-2.0" | "cinema-studio-4.0";
export type ImageModelId = "marketing-studio-1k" | "marketing-studio" | "soul-2";

export interface VideoModel {
  id: VideoModelId;
  label: string;
  hint: string;
  /** Text-to-video endpoint. */
  t2v: string;
  /** Image-to-video endpoint (animate a product photo). Models without one fall back to Seedance 2.5 for photos. */
  i2v?: string;
  /** Reference-to-video endpoint (several reference images: character sheet + product). */
  ref?: string;
  /** Higgsfield cost per second in light mode (480p, or the model's only resolution), in $. */
  usdPerSecond: number;
  /** Cost per second at 720p when it differs from light mode. */
  usdPerSecondHD?: number;
  /** Credits per second shown in pickers (light mode). Exact charges use videoCredits(). */
  creditsPerSecond: number;
  creditsPerSecondHD?: number;
  minSec: number;
  maxSec: number;
  ratios: string[];
  /** How the model takes the audio switch. */
  audio: "generate_audio" | "sound" | "none";
  /** Resolution value sent to the model (null = model default). */
  resolution: (light: boolean) => string | null;
}

export const VIDEO_MODELS: VideoModel[] = [
  {
    id: "seedance-2.5", label: "Premium", hint: "Le plus réaliste, anime vos photos produit, son inclus",
    t2v: "bytedance/seedance-2.5/text-to-video", i2v: "bytedance/seedance-2.5/image-to-video", ref: "bytedance/seedance-2.5/reference-to-video",
    usdPerSecond: 0.2056, usdPerSecondHD: 0.4622, creditsPerSecond: 0, minSec: 4, maxSec: 15, ratios: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"], audio: "generate_audio",
    resolution: (light) => (light ? "480p" : "720p"),
  },
  {
    id: "kling-3.0", label: "Rapide", hint: "Économique, plusieurs plans, son inclus",
    t2v: "kling-video/v3.0/std/text-to-video",
    usdPerSecond: 0.126, creditsPerSecond: 0, minSec: 3, maxSec: 15, ratios: ["16:9", "9:16", "1:1"], audio: "sound",
    resolution: () => null,
  },
  {
    id: "wan-3.0-prime", label: "Éco", hint: "Le moins cher, jusqu’à 30 s",
    t2v: "alibaba/wan-3.0-prime/text-to-video",
    usdPerSecond: 0.0272, usdPerSecondHD: 0.056, creditsPerSecond: 0, minSec: 2, maxSec: 30, ratios: ["16:9", "4:3", "1:1", "3:4", "9:16"], audio: "generate_audio",
    resolution: (light) => (light ? "480p" : "720p"),
  },
  {
    id: "minimax-h3", label: "Ultra HD", hint: "Très haute définition (2K)",
    t2v: "minimax/h3/text-to-video",
    usdPerSecond: 0.13, creditsPerSecond: 0, minSec: 5, maxSec: 15, ratios: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"], audio: "none",
    resolution: () => "2K",
  },
  {
    id: "seedance-2.0", label: "Standard", hint: "Bon équilibre qualité / crédits",
    t2v: "bytedance/seedance-2.0/text-to-video",
    usdPerSecond: 0.1345, usdPerSecondHD: 0.3024, creditsPerSecond: 0, minSec: 4, maxSec: 15, ratios: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"], audio: "generate_audio",
    resolution: (light) => (light ? "480p" : "720p"),
  },
  {
    id: "cinema-studio-4.0", label: "Cinéma", hint: "Rendu cinéma, mise en scène automatique",
    t2v: "higgsfield/cinema-studio/4.0",
    usdPerSecond: 0.2056, usdPerSecondHD: 0.4622, creditsPerSecond: 0, minSec: 4, maxSec: 15, ratios: ["16:9", "9:16", "1:1"], audio: "generate_audio",
    resolution: (light) => (light ? "480p" : "720p"),
  },
];

export interface ImageModel {
  id: ImageModelId;
  label: string;
  hint: string;
  endpoint: string;
  /** Higgsfield cost per image (with a product photo when accepted), in $. */
  usd: number;
  /** Credits per image (derived from usd). */
  credits: number;
  /** Accepts a product photo (edit / preset mode). */
  acceptsImages: boolean;
  /** Output resolution sent to the endpoint (Marketing Studio). */
  resolution?: "1k" | "2k";
}

/**
 * Users see quality levels (Éco / Standard / HD), never provider names. The first entry is the
 * default. Real costs checked 2026-10-02 with the Higgsfield estimate endpoint: Marketing Studio
 * 1K ≈ $0.235, 2K ≈ $0.452; Soul 2 ≈ $0.004 (the product is not kept identical).
 */
export const IMAGE_MODELS: ImageModel[] = [
  { id: "marketing-studio-1k", label: "Standard", hint: "Votre produit reste identique · idéal WhatsApp et réseaux", endpoint: "marketing-studio/image", usd: 0.235, credits: 0, acceptsImages: true, resolution: "1k" },
  { id: "marketing-studio", label: "HD", hint: "Même rendu en haute définition · affiches et impression", endpoint: "marketing-studio/image", usd: 0.452, credits: 0, acceptsImages: true, resolution: "2k" },
  { id: "soul-2", label: "Éco", hint: "Idées, portraits et mode · très économique, le produit peut changer un peu", endpoint: "higgsfield-ai/soul/v2/standard", usd: 0.006, credits: 0, acceptsImages: false },
];

for (const m of IMAGE_MODELS) m.credits = creditsForUsd(m.usd);
for (const m of VIDEO_MODELS) {
  m.creditsPerSecond = Math.ceil((m.usdPerSecond * XOF_PER_USD * MARGIN) / CREDIT_XOF);
  if (m.usdPerSecondHD) m.creditsPerSecondHD = Math.ceil((m.usdPerSecondHD * XOF_PER_USD * MARGIN) / CREDIT_XOF);
}

/** Very high definition (4K) re-render of an image: Higgsfield cost in $. */
export const UPSCALE_USD = 0.735;

export const DEFAULT_VIDEO_MODEL: VideoModelId = "seedance-2.5";

export const videoModel = (id?: string | null): VideoModel => VIDEO_MODELS.find((m) => m.id === id) ?? VIDEO_MODELS.find((m) => m.id === DEFAULT_VIDEO_MODEL)!;
export const imageModel = (id?: string | null): ImageModel => IMAGE_MODELS.find((m) => m.id === id) ?? IMAGE_MODELS[0];

/** Clamp a duration to what the model accepts. */
export const clampDuration = (m: VideoModel, sec: number) => Math.min(m.maxSec, Math.max(m.minSec, Math.round(sec) || 5));

/** Credits charged for one video. Photo-to-video always renders on the model that has an i2v mode. */
export function videoCredits(modelId: string | null | undefined, sec: number, withPhoto = false, light = true): number {
  const m = withPhoto && !videoModel(modelId).i2v ? videoModel(DEFAULT_VIDEO_MODEL) : videoModel(modelId);
  const usdPerSecond = light ? m.usdPerSecond : m.usdPerSecondHD ?? m.usdPerSecond;
  return creditsForUsd(usdPerSecond * clampDuration(m, sec));
}
