/**
 * Higgsfield models offered in Sokozia, priced in Sokozia credits only (never in provider prices).
 * Credits are set from the real Higgsfield cost (estimate endpoint, see /admin/pricing, checked 2026-10-02:
 * 1 Higgsfield credit ≈ $0.0626) for ≈ 50 % gross margin when a Sokozia credit sells 12 FCFA (1 $ = 590 FCFA):
 * credits ≈ cost in FCFA / 6; update them here
 * when provider pricing changes. Shared by the browser (labels, costs) and the server (endpoints).
 */

export type VideoModelId = "seedance-2.5" | "kling-3.0" | "minimax-h3" | "wan-3.0-prime" | "seedance-2.0" | "cinema-studio-4.0";
export type ImageModelId = "marketing-studio" | "soul-2";

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
  /** Sokozia credits per second in light mode (480p, or the model's only resolution). */
  creditsPerSecond: number;
  /** Credits per second at 720p when it costs more than light mode. */
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
    id: "seedance-2.5", label: "Seedance 2.5", hint: "Le plus réaliste, anime vos photos produit, son inclus",
    t2v: "bytedance/seedance-2.5/text-to-video", i2v: "bytedance/seedance-2.5/image-to-video", ref: "bytedance/seedance-2.5/reference-to-video",
    creditsPerSecond: 21, creditsPerSecondHD: 46, minSec: 4, maxSec: 15, ratios: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"], audio: "generate_audio",
    resolution: (light) => (light ? "480p" : "720p"),
  },
  {
    id: "kling-3.0", label: "Kling 3.0", hint: "Rapide et économique, plans multiples, son inclus",
    t2v: "kling-video/v3.0/std/text-to-video",
    creditsPerSecond: 13, minSec: 3, maxSec: 15, ratios: ["16:9", "9:16", "1:1"], audio: "sound",
    resolution: () => null,
  },
  {
    id: "wan-3.0-prime", label: "Wan 3.0 Prime", hint: "Économique, jusqu’à 30 s",
    t2v: "alibaba/wan-3.0-prime/text-to-video",
    creditsPerSecond: 7, creditsPerSecondHD: 15, minSec: 2, maxSec: 30, ratios: ["16:9", "4:3", "1:1", "3:4", "9:16"], audio: "generate_audio",
    resolution: (light) => (light ? "480p" : "720p"),
  },
  {
    id: "minimax-h3", label: "MiniMax H3", hint: "Très haute définition (2K)",
    t2v: "minimax/h3/text-to-video",
    creditsPerSecond: 13, minSec: 5, maxSec: 15, ratios: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"], audio: "none",
    resolution: () => "2K",
  },
  {
    id: "seedance-2.0", label: "Seedance 2.0", hint: "Bon équilibre qualité / crédits",
    t2v: "bytedance/seedance-2.0/text-to-video",
    creditsPerSecond: 14, creditsPerSecondHD: 30, minSec: 4, maxSec: 15, ratios: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"], audio: "generate_audio",
    resolution: (light) => (light ? "480p" : "720p"),
  },
  {
    id: "cinema-studio-4.0", label: "Cinema Studio 4.0", hint: "Rendu cinéma, mise en scène automatique",
    t2v: "higgsfield/cinema-studio/4.0",
    creditsPerSecond: 21, creditsPerSecondHD: 46, minSec: 4, maxSec: 15, ratios: ["16:9", "9:16", "1:1"], audio: "generate_audio",
    resolution: (light) => (light ? "480p" : "720p"),
  },
];

export interface ImageModel {
  id: ImageModelId;
  label: string;
  hint: string;
  endpoint: string;
  credits: number;
  /** Accepts a product photo (edit / preset mode). */
  acceptsImages: boolean;
}

export const IMAGE_MODELS: ImageModel[] = [
  { id: "marketing-studio", label: "Marketing Studio", hint: "Photos produit et pubs, garde votre produit identique", endpoint: "marketing-studio/image", credits: 44, acceptsImages: true },
  { id: "soul-2", label: "Soul 2", hint: "Portraits et mode réalistes, sans photo produit", endpoint: "higgsfield-ai/soul/v2/standard", credits: 4, acceptsImages: false },
];

export const DEFAULT_VIDEO_MODEL: VideoModelId = "seedance-2.5";

export const videoModel = (id?: string | null): VideoModel => VIDEO_MODELS.find((m) => m.id === id) ?? VIDEO_MODELS[0];
export const imageModel = (id?: string | null): ImageModel => IMAGE_MODELS.find((m) => m.id === id) ?? IMAGE_MODELS[0];

/** Clamp a duration to what the model accepts. */
export const clampDuration = (m: VideoModel, sec: number) => Math.min(m.maxSec, Math.max(m.minSec, Math.round(sec) || 5));

/** Credits charged for one video. Photo-to-video always renders on the model that has an i2v mode. */
export function videoCredits(modelId: string | null | undefined, sec: number, withPhoto = false, light = true): number {
  const m = withPhoto && !videoModel(modelId).i2v ? videoModel(DEFAULT_VIDEO_MODEL) : videoModel(modelId);
  const perSecond = light ? m.creditsPerSecond : m.creditsPerSecondHD ?? m.creditsPerSecond;
  return perSecond * clampDuration(m, sec);
}
