/** Shared between the browser and the /api/hf routes. No secrets here. */

export type GenerationKind = "image" | "video";
export type JobStatus = "queued" | "in_progress" | "completed" | "failed" | "nsfw" | "canceled";

export interface GenerationRequest {
  kind: GenerationKind;
  /** VideoModelId or ImageModelId from ./models (defaults: Seedance 2.5 / Marketing Studio). */
  model?: string;
  prompt: string;
  /** Uploaded product/reference images (public Higgsfield URLs). Image: edit mode. Video: first frame. */
  imageUrls?: string[];
  aspectRatio?: string;
  durationSec?: number;
  /** Lighter video (480p) for slow connections and WhatsApp. */
  light?: boolean;
  audio?: boolean;
  /** Image only: render at 4k (used for upscaling an existing image). */
  upscale?: boolean;
  /** Image only: Higgsfield Marketing Studio preset (enhanced mode, needs a product photo in imageUrls[0]). */
  presetId?: string;
  /** Image only, with a preset: optional model/person reference photo placed after the product. */
  modelReferenceUrl?: string;
}

export interface HfPreset {
  id: string;
  name: string;
  type: string;
  /** Preview/cover image when the catalog provides one. */
  preview: string | null;
}

export interface GenerationJob {
  requestId: string;
  status: JobStatus;
  images: string[];
  videoUrl: string | null;
}

export const isFinal = (s: JobStatus) => s === "completed" || s === "failed" || s === "nsfw" || s === "canceled";
