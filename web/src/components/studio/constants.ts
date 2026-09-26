import type { AspectRatio, ImageStyle } from "@/lib/types";

/** Image generator options (SPEC §11). */
export const BACKGROUNDS = ["Studio white", "Dark marble", "Soft gradient", "Natural stone", "Beach sand", "Linen", "Concrete", "Transparent"] as const;
export const LIGHTING = ["Natural", "Golden hour", "Studio", "Softbox", "Neon", "Dramatic"] as const;
export const IMAGE_CAMERAS = ["Close-up", "Medium", "Wide", "Macro", "Overhead"] as const;
export const COMPOSITIONS = ["Centered", "Rule of thirds", "Hero left", "Hero right", "Flatlay"] as const;
export const MODELS = [
  { id: "studio-v3", label: "Aurora 3", hint: "Qualité maximale" },
  { id: "studio-fast", label: "Aurora Flash", hint: "2x plus rapide" },
  { id: "photoreal-xl", label: "Lumen XL", hint: "Produits photoréalistes" },
  { id: "drift-2", label: "Drift 2.5", hint: "Mouvement et vidéo" },
] as const;
export type ModelId = (typeof MODELS)[number]["id"];

/** Video generator options (SPEC §14). */
export const VIDEO_CAMERAS = ["Slow zoom", "Orbit", "Handheld", "Push in", "Pull out", "Tracking", "Static"] as const;
export const VIDEO_STYLES = ["UGC", "Commercial", "Cinematic", "Product demo", "Lifestyle"] as const;
export const DURATIONS = [5, 10, 15] as const;
export type DurationSec = (typeof DURATIONS)[number];

/** Free sample clip used by the mock player (Big Buck Bunny, CC-BY). */
export const SAMPLE_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export const PROMPT_PLACEHOLDER = "Créez une publicité produit haut de gamme pour ce parfum…";

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

/* ---------- French display labels (values above stay stable for logic) ---------- */
export const BACKGROUND_LABELS: Record<(typeof BACKGROUNDS)[number], string> = {
  "Studio white": "Blanc studio", "Dark marble": "Marbre sombre", "Soft gradient": "Dégradé doux", "Natural stone": "Pierre naturelle",
  "Beach sand": "Sable de plage", Linen: "Lin", Concrete: "Béton", Transparent: "Transparent",
};
export const LIGHTING_LABELS: Record<string, string> = {
  Natural: "Naturelle", "Golden hour": "Heure dorée", Studio: "Studio", Softbox: "Softbox", Neon: "Néon", Dramatic: "Dramatique",
};
export const IMAGE_CAMERA_LABELS: Record<string, string> = {
  "Close-up": "Gros plan", Medium: "Plan moyen", Wide: "Plan large", Macro: "Macro", Overhead: "Vue de dessus",
};
export const COMPOSITION_LABELS: Record<(typeof COMPOSITIONS)[number], string> = {
  Centered: "Centrée", "Rule of thirds": "Règle des tiers", "Hero left": "Sujet à gauche", "Hero right": "Sujet à droite", Flatlay: "Flat lay",
};
export const VIDEO_CAMERA_LABELS: Record<(typeof VIDEO_CAMERAS)[number], string> = {
  "Slow zoom": "Zoom lent", Orbit: "Orbite", Handheld: "Caméra à l'épaule", "Push in": "Travelling avant", "Pull out": "Travelling arrière", Tracking: "Suivi", Static: "Fixe",
};
export const VIDEO_STYLE_LABELS: Record<(typeof VIDEO_STYLES)[number], string> = {
  UGC: "UGC", Commercial: "Publicitaire", Cinematic: "Cinématique", "Product demo": "Démo produit", Lifestyle: "Lifestyle",
};
export const IMAGE_STYLE_LABELS: Record<string, string> = {
  "Product Photography": "Photo produit", Luxury: "Luxe", Minimal: "Minimaliste", Street: "Street", Lifestyle: "Lifestyle", Editorial: "Éditorial",
  Cinematic: "Cinématique", UGC: "UGC", Studio: "Studio", Fashion: "Mode", Food: "Culinaire", Tech: "Tech",
};
export const EDITOR_TOOL_LABELS: Record<EditorTool, string> = {
  Crop: "Recadrer", Resize: "Redimensionner", "Remove Background": "Supprimer l'arrière-plan", "Replace Background": "Remplacer l'arrière-plan",
  Relight: "Rééclairer", Retouch: "Retoucher", "Add Text": "Ajouter du texte", "Add Logo": "Ajouter un logo", "Expand Image": "Agrandir l'image",
};
/** Video progress steps (VIDEO_STEPS values from the API) → French. */
export const VIDEO_STEP_LABELS: Record<string, string> = {
  "Preparing assets": "Préparation des éléments", "Building scene 1...": "Construction de la scène 1…", "Adding motion...": "Ajout du mouvement…",
  "Rendering...": "Rendu en cours…", "Finalizing...": "Finalisation…",
};
export const label = (map: Record<string, string>, v: string) => map[v] ?? v;
