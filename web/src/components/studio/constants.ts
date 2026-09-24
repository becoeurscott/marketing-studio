import type { AspectRatio, ImageStyle } from "@/lib/types";

/** Image generator options (SPEC §11). */
export const BACKGROUNDS = ["Studio white", "Dark marble", "Soft gradient", "Natural stone", "Beach sand", "Linen", "Concrete", "Transparent"] as const;
export const LIGHTING = ["Natural", "Golden hour", "Studio", "Softbox", "Neon", "Dramatic"] as const;
export const IMAGE_CAMERAS = ["Close-up", "Medium", "Wide", "Macro", "Overhead"] as const;
export const COMPOSITIONS = ["Centered", "Rule of thirds", "Hero left", "Hero right", "Flatlay"] as const;
export const MODELS = [
  { id: "studio-v3", label: "Aurora 3", hint: "Best quality" },
  { id: "studio-fast", label: "Aurora Flash", hint: "2x faster" },
  { id: "photoreal-xl", label: "Lumen XL", hint: "Photoreal products" },
  { id: "drift-2", label: "Drift 2.5", hint: "Motion & video" },
] as const;
export type ModelId = (typeof MODELS)[number]["id"];

/** Video generator options (SPEC §14). */
export const VIDEO_CAMERAS = ["Slow zoom", "Orbit", "Handheld", "Push in", "Pull out", "Tracking", "Static"] as const;
export const VIDEO_STYLES = ["UGC", "Commercial", "Cinematic", "Product demo", "Lifestyle"] as const;
export const DURATIONS = [5, 10, 15] as const;
export type DurationSec = (typeof DURATIONS)[number];

/** Free sample clip used by the mock player (Big Buck Bunny, CC-BY). */
export const SAMPLE_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export const PROMPT_PLACEHOLDER = "Create a luxury product advertisement for this perfume...";

export interface ImageParams {
  prompt: string;
  style: ImageStyle;
  ratio: AspectRatio;
  model: ModelId;
  background: (typeof BACKGROUNDS)[number];
  lighting: (typeof LIGHTING)[number];
  camera: (typeof IMAGE_CAMERAS)[number];
  composition: (typeof COMPOSITIONS)[number];
  productAssetId: string | null;
}

export interface VideoParams {
  concept: string;
  model: ModelId;
  /** UGC creator (only used by the UGC composer mode). */
  creatorId: string | null;
  durationSec: DurationSec;
  ratio: AspectRatio;
  camera: (typeof VIDEO_CAMERAS)[number];
  style: (typeof VIDEO_STYLES)[number];
  sourceAssetId: string | null;
}

export const RATIO_CLASS: Record<AspectRatio, string> = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "9:16": "aspect-[9/16]",
  "16:9": "aspect-video",
  "3:2": "aspect-[3/2]",
};

export const EDITOR_TOOLS = [
  "Crop", "Resize", "Remove Background", "Replace Background", "Relight", "Retouch", "Add Text", "Add Logo", "Expand Image",
] as const;
export type EditorTool = (typeof EDITOR_TOOLS)[number];
