/** Shared between the browser and the /api/hf routes. No secrets here. */

export type GenerationKind = "image" | "video";
export type JobStatus = "queued" | "in_progress" | "completed" | "failed" | "nsfw" | "canceled";

export interface GenerationRequest {
  kind: GenerationKind;
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
}

export interface GenerationJob {
  requestId: string;
  status: JobStatus;
  images: string[];
  videoUrl: string | null;
}

export const isFinal = (s: JobStatus) => s === "completed" || s === "failed" || s === "nsfw" || s === "canceled";
