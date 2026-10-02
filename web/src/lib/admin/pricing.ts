import "server-only";
import { jobCost } from "@/lib/account";
import { estimateRaw, estimateRequest } from "@/lib/higgsfield/server";
import type { GenerationRequest } from "@/lib/higgsfield/types";

/** FCFA per US dollar used to convert Higgsfield costs (XOF is pegged to the euro; adjust if the dollar moves). */
export const XOF_PER_USD = 590;
const PHOTO = "https://www.sokozia.com/products/parfum.jpg";
const SHEET = "https://www.sokozia.com/products/sac.jpg";

export const SCENARIOS: { label: string; req: GenerationRequest }[] = [
  { label: "Image Marketing Studio (2K)", req: { kind: "image", model: "marketing-studio", prompt: "Photo produit", aspectRatio: "1:1" } },
  { label: "Image Marketing Studio + photo produit", req: { kind: "image", model: "marketing-studio", prompt: "Photo produit", aspectRatio: "1:1", imageUrls: [PHOTO] } },
  { label: "Image Marketing Studio agrandie (4K)", req: { kind: "image", model: "marketing-studio", prompt: "Photo produit", aspectRatio: "1:1", upscale: true } },
  { label: "Image Soul 2", req: { kind: "image", model: "soul-2", prompt: "Portrait", aspectRatio: "3:4" } },
  { label: "Vidéo Kling 3.0 · 5 s", req: { kind: "video", model: "kling-3.0", prompt: "Plan produit", durationSec: 5, aspectRatio: "9:16" } },
  { label: "Vidéo Kling 3.0 · 10 s", req: { kind: "video", model: "kling-3.0", prompt: "Plan produit", durationSec: 10, aspectRatio: "9:16" } },
  { label: "Vidéo Wan 3.0 Prime · 5 s (480p)", req: { kind: "video", model: "wan-3.0-prime", prompt: "Plan produit", durationSec: 5, aspectRatio: "9:16", light: true } },
  { label: "Vidéo Seedance 2.0 · 5 s (480p)", req: { kind: "video", model: "seedance-2.0", prompt: "Plan produit", durationSec: 5, aspectRatio: "9:16", light: true } },
  { label: "Vidéo Seedance 2.5 · 5 s (480p)", req: { kind: "video", model: "seedance-2.5", prompt: "Plan produit", durationSec: 5, aspectRatio: "9:16", light: true } },
  { label: "Vidéo Seedance 2.5 · 10 s (720p)", req: { kind: "video", model: "seedance-2.5", prompt: "Plan produit", durationSec: 10, aspectRatio: "9:16" } },
  { label: "Photo animée (Seedance 2.5 · 5 s, 480p)", req: { kind: "video", model: "seedance-2.5", prompt: "Le produit tourne", durationSec: 5, imageUrls: [PHOTO], light: true } },
  { label: "UGC créateur (Seedance réf. · 8 s, 480p)", req: { kind: "video", prompt: "Selfie UGC", durationSec: 8, references: [SHEET, PHOTO], aspectRatio: "9:16", light: true } },
  { label: "Vidéo MiniMax H3 · 5 s (2K)", req: { kind: "video", model: "minimax-h3", prompt: "Plan produit", durationSec: 5, aspectRatio: "9:16" } },
  { label: "Vidéo Cinema Studio 4.0 · 5 s (480p)", req: { kind: "video", model: "cinema-studio-4.0", prompt: "Plan produit", durationSec: 5, aspectRatio: "9:16", light: true } },
];

/** Candidate endpoints for models not wired yet (the public docs don't list them all). */
export const CANDIDATES: { label: string; endpoint: string; input: Record<string, unknown> }[] = [
  ...["google/nano-banana-pro", "google/nano-banana-pro/text-to-image", "nano-banana-pro", "nano-banana-pro/text-to-image", "google/nano-banana-2", "nano-banana-2", "google/nano-banana", "nano-banana"].map((e) => ({ label: "Nano Banana", endpoint: e, input: { prompt: "Photo produit", aspect_ratio: "1:1" } })),
  ...["google/nano-banana-pro/edit", "nano-banana-pro/edit", "google/nano-banana/edit", "nano-banana/edit"].map((e) => ({ label: "Nano Banana (édition photo)", endpoint: e, input: { prompt: "Photo produit", image_urls: [PHOTO], aspect_ratio: "1:1" } })),
  ...["bytedance/seedream/v4/text-to-image", "bytedance/seedream-4.5/text-to-image", "bytedance/seedream/v4/edit"].map((e) => ({ label: "Seedream", endpoint: e, input: { prompt: "Photo produit", aspect_ratio: "1:1", ...(e.endsWith("edit") ? { image_urls: [PHOTO] } : {}) } })),
];

/** Runs every price estimate (free on Higgsfield's side). */
export async function runPricing() {
  return Promise.all([
    Promise.all(SCENARIOS.map(async (s) => ({ ...s, charge: jobCost(s.req), est: await estimateRequest(s.req) }))),
    Promise.all(CANDIDATES.map(async (c) => ({ ...c, est: await estimateRaw(c.endpoint, c.input) }))),
  ]);
}
