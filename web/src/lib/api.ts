/**
 * Mock API. Every function is async, waits a realistic delay, deducts credits
 * through the store and returns fake-but-plausible results. Swap the bodies for
 * real fetch() calls later; keep the signatures.
 */
import { useStore } from "./store";
import { CREDIT_COSTS, type AdVariation, type AspectRatio, type Asset, type Campaign, type CopyResult, type CopyTool, type Generation, type ID, type ImageStyle, type Platform, type AdFormat, type Tone, type CampaignFormat, type CampaignObjective } from "./types";
import { hooks as hookBank } from "@/data/copy";
import { uid } from "./utils";
import { GenerationError, runJob, uploadPhoto } from "./higgsfield/client";
import { imageModel, videoCredits, type ImageModelId, type VideoModelId } from "./higgsfield/models";
import { creators as creatorsSeed, creatorSheetUrl } from "@/data/creators";
import { languageLabel, type LanguageId } from "./market";

export class ApiError extends Error {
  code: "insufficient-credits" | "failed";
  constructor(code: ApiError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

/** Sleep helper. Random between min and max when max is given. */
export function delay(ms = 800, max?: number): Promise<void> {
  const t = max ? ms + Math.random() * (max - ms) : ms;
  return new Promise((r) => setTimeout(r, t));
}

/**
 * Credits are debited and refunded on the server, per Higgsfield job (see /api/hf/generate).
 * The browser only pre-checks the balance it knows, for an instant "not enough credits" message.
 */
function precheck(cost: number) {
  const credits = useStore.getState().credits;
  if (cost > credits) throw new ApiError("insufficient-credits", `Il vous faut ${cost} crédits pour cette action. Vous en avez ${credits}.`);
}

/** Text tools use built-in templates (no AI model yet), so they are free. */
function charge(_action: keyof typeof CREDIT_COSTS, _description: string) {}

/** Reloads the balance and credit history from the server. */
export async function refreshAccount(): Promise<void> {
  try {
    const res = await fetch("/api/account", { cache: "no-store" });
    if (res.ok) useStore.getState().setAccount(await res.json());
  } catch {
    // offline: keep the last known balance
  }
}

function asApiError(error: unknown): never {
  if (error instanceof GenerationError && error.status === 402) throw new ApiError("insufficient-credits", error.message);
  throw error;
}

function record(gen: Omit<Generation, "id" | "createdAt">) {
  return useStore.getState().addGeneration(gen);
}

/* ---------- Real generation helpers (Higgsfield via /api/hf) ---------- */

/** Pre-checks the expected cost, runs the jobs (charged server-side), then syncs the balance. */
async function chargedExact<T>(_action: keyof typeof CREDIT_COSTS, _description: string, amount: number, work: () => Promise<T>): Promise<T> {
  precheck(amount);
  try {
    return await work();
  } catch (error) {
    asApiError(error);
  } finally {
    void refreshAccount();
  }
}

async function charged<T>(action: keyof typeof CREDIT_COSTS, description: string, multiplier: number, work: () => Promise<T>): Promise<T> {
  return chargedExact(action, description, CREDIT_COSTS[action] * multiplier, work);
}

/** marketing-studio/image supports these ratios; the app's 4:5 maps to the closest one. */
function imageRatio(r?: AspectRatio): string {
  if (!r) return "auto";
  return r === "4:5" ? "3:4" : r;
}

function assetUrl(id?: ID | null): string | undefined {
  if (!id) return undefined;
  const a = useStore.getState().assets.find((x) => x.id === id);
  return a?.url.startsWith("https://") ? a.url : undefined;
}

async function images(prompt: string, count: number, opts: { ratio?: AspectRatio; imageUrls?: string[]; upscale?: boolean; model?: ImageModelId }): Promise<ImageResult[]> {
  const jobs = await Promise.all(
    Array.from({ length: count }, () => runJob({ kind: "image", model: opts.model, prompt, aspectRatio: imageRatio(opts.ratio), imageUrls: opts.imageUrls, upscale: opts.upscale })),
  );
  return jobs.flatMap((j) => j.images).map((url) => ({ id: uid("res"), url, thumbnail: url, ratio: opts.ratio ?? "4:5", seed: url }));
}

/* ---------- Image ---------- */
export interface GenerateImageParams {
  prompt: string;
  style?: ImageStyle;
  ratio?: AspectRatio;
  background?: string;
  lighting?: string;
  camera?: string;
  composition?: string;
  productAssetId?: ID | null;
  projectId?: ID | null;
  count?: number;
  model?: ImageModelId;
}
export interface ImageResult { id: ID; url: string; thumbnail: string; ratio: AspectRatio; seed: string }

export async function generateImage(params: GenerateImageParams): Promise<ImageResult[]> {
  const count = Math.min(params.count ?? 2, 4);
  const product = assetUrl(params.productAssetId);
  const details = [params.style && `style ${params.style}`, params.background && `décor : ${params.background}`, params.lighting && `lumière : ${params.lighting}`, params.camera && `cadrage : ${params.camera}`, params.composition && `composition : ${params.composition}`].filter(Boolean).join(", ");
  const prompt = `${params.prompt}${details ? `. ${details}` : ""}${product ? ". Garde le produit de la photo fourni exactement identique (forme, couleurs, étiquette)." : ""}`;
  // Soul 2 can't use a product photo: it renders from the text only.
  const model = imageModel(params.model);
  const refs = product && model.acceptsImages ? [product] : undefined;
  const cost = model.credits * count;
  const results = await chargedExact("image", `Image ${model.label} — ${params.prompt.slice(0, 40)}`, cost, () => images(prompt, count, { ratio: params.ratio, imageUrls: refs, model: model.id }));
  record({ type: "image", prompt: params.prompt, status: "completed", thumbnails: results.map((r) => r.thumbnail), projectId: params.projectId ?? null, params: { style: params.style ?? "", ratio: params.ratio ?? "", model: model.id }, creditsUsed: cost });
  return results;
}

/* ---------- Video ---------- */
export const VIDEO_STEPS = ["Préparation des ressources", "Construction de la scène 1…", "Ajout du mouvement…", "Rendu en cours…", "Finalisation…"] as const;
export type VideoStep = (typeof VIDEO_STEPS)[number];

export interface GenerateVideoParams {
  sourceAssetId?: ID | null;
  sourceUrl?: string;
  concept: string;
  durationSec: 5 | 10 | 15;
  ratio?: AspectRatio;
  camera?: string;
  style?: string;
  model?: VideoModelId;
  projectId?: ID | null;
}
export interface VideoResult { id: ID; url: string; thumbnail: string; poster: string; durationSec: number; ratio: AspectRatio }

type Progress = (step: VideoStep, index: number, progress: number) => void;

/** Maps job states onto the existing progress steps (queued → rendering → done). */
function stepper(onProgress?: Progress, offset = 0) {
  return (status: string) => {
    const i = Math.min(VIDEO_STEPS.length - 1, offset + (status === "queued" ? 1 : status === "in_progress" ? 3 : 4));
    onProgress?.(VIDEO_STEPS[i], i, Math.round(((i + 1) / VIDEO_STEPS.length) * 100));
  };
}

async function video(req: { prompt: string; imageUrl?: string; durationSec: number; ratio?: AspectRatio; model?: VideoModelId }, onProgress?: Progress, offset = 0): Promise<VideoResult> {
  const light = useStore.getState().preferences.lightVideos ?? true;
  const ratio = req.ratio === "4:5" ? "3:4" : (req.ratio ?? "9:16");
  const job = await runJob({ kind: "video", model: req.model, prompt: req.prompt, imageUrls: req.imageUrl ? [req.imageUrl] : undefined, durationSec: req.durationSec, aspectRatio: ratio, light }, stepper(onProgress, offset));
  const url = job.videoUrl!;
  const poster = req.imageUrl ?? "";
  return { id: uid("res"), url, thumbnail: poster, poster, durationSec: req.durationSec, ratio: req.ratio ?? "9:16" };
}

export async function generateVideo(params: GenerateVideoParams, onProgress?: Progress): Promise<VideoResult> {
  onProgress?.(VIDEO_STEPS[0], 0, 20);
  const source = params.sourceUrl?.startsWith("https://") ? params.sourceUrl : assetUrl(params.sourceAssetId);
  const prompt = [params.concept, params.camera && `mouvement de caméra : ${params.camera}`, params.style && `style ${params.style}`].filter(Boolean).join(". ");
  const cost = videoCredits(params.model, params.durationSec, !!source);
  const result = await chargedExact("video", `Vidéo — ${params.concept.slice(0, 40)}`, cost, () => video({ prompt, imageUrl: source, durationSec: params.durationSec, ratio: params.ratio, model: params.model }, onProgress));
  record({ type: "video", prompt: params.concept, status: "completed", thumbnails: result.thumbnail ? [result.thumbnail] : [], projectId: params.projectId ?? null, params: { durationSec: params.durationSec, camera: params.camera ?? "", style: params.style ?? "", model: params.model ?? "seedance-2.5" }, creditsUsed: cost });
  return result;
}

/* ---------- UGC ---------- */
/** UGC = one Seedance 2.5 reference-to-video job (creator sheet + product). */
export const ugcCredits = (durationSec: number) => videoCredits("seedance-2.5", durationSec, true);

export interface GenerateUGCParams {
  productAssetId?: ID | null;
  creatorId: ID;
  script: string;
  location?: string;
  tone?: string;
  /** Voice-over language. */
  language?: LanguageId;
  durationSec: 5 | 10 | 15;
  projectId?: ID | null;
}

/**
 * One Seedance 2.5 reference-to-video job: the creator's character sheet (+ the product photo)
 * keeps the same face, hair and outfit in every video; the prompt repeats the creator's look.
 */
export async function generateUGC(params: GenerateUGCParams, onProgress?: Progress): Promise<VideoResult> {
  const creator = creatorsSeed.find((c) => c.id === params.creatorId) ?? creatorsSeed[0];
  const product = assetUrl(params.productAssetId);
  const place = params.location ? ` Setting: ${params.location}.` : "";
  const lang = languageLabel(params.language ?? "fr");
  const cost = ugcCredits(params.durationSec);
  const references = [creatorSheetUrl(creator), ...(product ? [product] : [])];
  const prompt = `Vertical selfie-style UGC video. The person is exactly the one in the character sheet: ${creator.look}.${product ? " She/he holds and shows the product from the product photo, keeping it identical." : ""}${place} Talking naturally to the camera in ${lang}, tone ${params.tone ?? "authentic"}, says: « ${params.script} »`;
  const result = await chargedExact("ugc", `Vidéo UGC — ${creator.name}`, cost, async () => {
    onProgress?.(VIDEO_STEPS[0], 0, 20);
    const light = useStore.getState().preferences.lightVideos ?? true;
    const job = await runJob({ kind: "video", prompt, references, durationSec: params.durationSec, aspectRatio: "9:16", light }, stepper(onProgress));
    const poster = product ?? creator.portrait;
    return { id: uid("res"), url: job.videoUrl!, thumbnail: poster, poster, durationSec: params.durationSec, ratio: "9:16" as AspectRatio };
  });
  record({ type: "video", prompt: params.script, status: "completed", thumbnails: [result.thumbnail], projectId: params.projectId ?? null, params: { creator: params.creatorId, tone: params.tone ?? "", language: params.language ?? "fr", durationSec: params.durationSec }, creditsUsed: cost });
  return result;
}

/* ---------- Product shoot ---------- */
export interface ProductShootParams {
  productUrl: string;
  environment: string;
  lighting: string;
  camera: string;
  /** Sokozia style art direction (lib/styles.ts); replaces the generic décor prompt when set. */
  styleDirection?: string;
  styleName?: string;
  count?: number;
  projectId?: ID | null;
}
export async function generateProductShoot(params: ProductShootParams): Promise<ImageResult[]> {
  if (!params.productUrl.startsWith("https://")) throw new ApiError("failed", "Importez d’abord une photo de votre produit.");
  const count = Math.min(params.count ?? 3, 4);
  const scene = params.styleDirection ?? `Place the product in this setting: ${params.environment}.`;
  const prompt = `${scene} Lighting: ${params.lighting}. Framing: ${params.camera}. Keep the product from the photo exactly identical (shape, label, colors). Sharp, realistic advertising photo.`;
  const results = await charged("product-shoot", `Shooting produit — ${params.styleName ?? params.environment}`, 1, () => images(prompt, count, { ratio: "4:5", imageUrls: [params.productUrl] }));
  record({ type: "image", prompt: `Shooting produit : ${params.environment}, éclairage ${params.lighting}, ${params.camera}`, status: "completed", thumbnails: results.map((r) => r.thumbnail), projectId: params.projectId ?? null, params: { environment: params.environment, lighting: params.lighting, camera: params.camera }, creditsUsed: CREDIT_COSTS["product-shoot"] });
  return results;
}

/* ---------- Ads ---------- */
export interface GenerateAdsParams {
  platform: Platform;
  format: AdFormat;
  product: string;
  offer: string;
  audience: string;
  cta: string;
  /** Price shown on the visual, already formatted in local currency ("7 500 FCFA"). */
  price?: string;
  /** Product photo used as the base of the visuals. */
  productAssetId?: ID | null;
  projectId?: ID | null;
}

function adRatio(platform: Platform, format: AdFormat): AspectRatio {
  if (["story", "reel", "short", "status"].includes(format) || platform === "tiktok" || platform === "whatsapp") return "9:16";
  if (format === "catalog") return "1:1";
  if (platform === "youtube" || platform === "google") return "16:9";
  return "4:5";
}

export async function generateAds(params: GenerateAdsParams): Promise<AdVariation[]> {
  const labels = ["A", "B", "C", "D"] as const;
  const headlines = [
    `${params.product}: ${params.offer}`,
    `Découvrez ${params.product}`,
    `${params.offer} — cette semaine seulement`,
    `Pourquoi ${params.audience} adore ${params.product}`,
  ];
  const priceLine = params.price ? ` Prix : ${params.price}.` : "";
  const texts = [
    `${params.product} a été pensé pour ${params.audience}. ${params.offer}.${priceLine} ${params.cta} dès aujourd’hui.`,
    `Ne vous contentez plus de moins. ${params.product} fait le travail à votre place. ${params.offer}.`,
    `Offre limitée : ${params.offer} sur ${params.product}.${priceLine} Idéal pour ${params.audience}.`,
    `De vrais résultats, de vraies personnes. Découvrez pourquoi ${params.product} cartonne auprès de ${params.audience}.`,
  ];
  const ctas = [params.cta, params.platform === "whatsapp" ? "Commander sur WhatsApp" : "En savoir plus", "Profiter de l’offre", params.cta];
  const product = assetUrl(params.productAssetId);
  const prompt = `Visuel publicitaire ${params.format === "flyer" ? "de flyer imprimable" : `pour ${params.platform}`} : ${params.product}. ${params.offer}. Pour ${params.audience}. Laisse de l’espace libre pour le texte et le prix, style marketing africain moderne, couleurs vives.${product ? " Garde le produit de la photo identique." : ""}`;
  // Two visuals shared by the four copy variants (A/C, B/D) to halve generation cost.
  const visuals = await charged("ads", `Variantes d’annonce — ${params.platform} ${params.format}`, 1, () => images(prompt, 2, { ratio: adRatio(params.platform, params.format), imageUrls: product ? [product] : undefined }));
  const results = labels.map((label, i) => ({
    id: uid("var"), label, visual: visuals[i % visuals.length].url, headline: headlines[i], primaryText: texts[i], cta: ctas[i], platform: params.platform, format: params.format,
  }));
  record({ type: "ad", prompt: `${params.platform} ${params.format} annonce — ${params.product}, ${params.audience}, ${params.offer}, ${params.cta}`, status: "completed", thumbnails: visuals.map((v) => v.url), projectId: params.projectId ?? null, params: { platform: params.platform, format: params.format }, creditsUsed: CREDIT_COSTS.ads });
  return results;
}

/* ---------- Copy ---------- */
export interface GenerateCopyParams {
  tool: CopyTool;
  product: string;
  audience: string;
  tone: Tone;
  goal: string;
  platform?: Platform;
  /** Output language (text and, for voice notes, the voice-over). Defaults to French. */
  language?: LanguageId;
  projectId?: ID | null;
}
export async function generateCopy(params: GenerateCopyParams): Promise<CopyResult> {
  charge("copy", `Rédaction — ${labelFor(params.tool)}`);
  await delay(700, 1400);
  const voice = useStore.getState().brands.find((b) => b.id === useStore.getState().currentBrandId)?.voice;
  const lang = params.language ?? "fr";
  const body = buildCopy(params, voice?.writingStyle);
  // Mock: the real model writes directly in the target language.
  const text = lang === "fr" ? body : `[${languageLabel(lang)}]\n${body}`;
  const result: CopyResult = { id: uid("copy"), tool: params.tool, title: `${labelFor(params.tool)} — ${params.product}`, text, tone: params.tone, platform: params.platform, language: lang, createdAt: new Date().toISOString() };
  record({ type: "copy", prompt: `${labelFor(params.tool)} pour ${params.product}, ${params.audience}, ton ${params.tone}, objectif : ${params.goal}`, status: "completed", thumbnails: [], projectId: params.projectId ?? null, params: { tool: params.tool, tone: params.tone }, creditsUsed: 0 });
  return result;
}

export async function generateHooks(params: { product: string; audience?: string; tone?: Tone; projectId?: ID | null }): Promise<string[]> {
  charge("copy", `Accroches — ${params.product}`);
  await delay(600, 1200);
  const shuffled = [...hookBank].sort(() => Math.random() - 0.5).slice(0, 10);
  const out = shuffled;
  record({ type: "copy", prompt: `10 accroches pour ${params.product}`, status: "completed", thumbnails: [], projectId: params.projectId ?? null, params: { tone: params.tone ?? "bold" }, creditsUsed: 0 });
  return out;
}

/* ---------- Campaign ---------- */
export interface CreateCampaignParams {
  name: string;
  projectId: ID;
  objective: CampaignObjective;
  audience: string;
  platforms: Platform[];
  formats: CampaignFormat[];
}
export async function createCampaign(params: CreateCampaignParams, onProgress?: (label: string, progress: number) => void): Promise<Campaign> {
  const steps = ["Analyse du produit", "Planification des formats", "Génération des visuels", "Rédaction des textes", "Création du calendrier"];
  for (let i = 0; i < steps.length; i++) {
    onProgress?.(steps[i], Math.round(((i + 1) / steps.length) * 100));
    await delay(400, 700);
  }
  const store = useStore.getState();
  const assetIds = store.assets.filter((a) => a.type === "image").slice(0, 8).map((a) => a.id);
  const variations = await generateAds({ platform: params.platforms[0] ?? "instagram", format: "image", product: "Beurre de karité pur", offer: "Livraison offerte cette semaine", audience: params.audience, cta: "Commander sur WhatsApp", projectId: params.projectId });
  const campaign = store.createCampaign({
    ...params,
    status: "draft",
    assetIds,
    variations,
    calendar: params.platforms.slice(0, 4).map((platform, i) => ({
      id: uid("cal"), campaignId: "", date: new Date(Date.now() + (i + 1) * 86400000).toISOString(), platform, format: "image" as AdFormat, status: "draft" as const, assetId: assetIds[i] ?? null, title: `${params.name} — publication ${i + 1}`,
    })),
  });
  store.updateCampaign(campaign.id, { calendar: campaign.calendar.map((c) => ({ ...c, campaignId: campaign.id })) });
  store.pushNotification({ kind: "campaign-ready", title: `${params.name} est prête`, body: "Visuels, textes et un calendrier de départ ont été générés.", href: `/campaigns/${campaign.id}` });
  return useStore.getState().campaigns.find((c) => c.id === campaign.id) ?? campaign;
}

/* ---------- Export ---------- */
export interface ExportParams {
  assetIds: ID[];
  format: "png" | "jpg" | "mp4" | "pdf";
  /** "light" = compressed for slow connections and WhatsApp (videos ≤ 16 Mo). */
  quality: "light" | "standard" | "high" | "maximum";
  /** Paper size for printable flyers and posters (PDF only). */
  printSize?: "A5" | "A4" | "A3";
  campaignId?: ID;
}
/**
 * Collects the real files of the selected assets and records the export. Files are downloaded
 * in their generated format; conversion and print layout (PDF) are not done server-side yet.
 */
export async function exportAssets(params: ExportParams, onProgress?: (progress: number, label: string) => void): Promise<Asset> {
  const store = useStore.getState();
  const files = params.assetIds.map((id) => store.assets.find((a) => a.id === id)).filter((a): a is Asset => !!a && a.url.startsWith("https://"));
  if (!files.length) throw new ApiError("failed", "Aucun fichier réel à exporter : générez ou importez d’abord des contenus.");
  onProgress?.(60, "Préparation des fichiers");
  await delay(200);
  onProgress?.(100, "Prêt");
  const name = params.campaignId ? `Export campagne (${files.length} fichiers)` : `Export ${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")} (${files.length} fichier${files.length > 1 ? "s" : ""})`;
  const asset = store.addAsset({ name, type: "export", url: files[0].url, thumbnail: files[0].thumbnail, projectId: store.currentProjectId, favorite: false, sizeKb: files.reduce((n, f) => n + f.sizeKb, 0), tags: ["export", params.format, params.quality, ...files.map((f) => `file:${f.url}`)] });
  store.pushNotification({ kind: "export-complete", title: "Export prêt", body: `${name} est prêt à être téléchargé.`, href: "/assets" });
  return asset;
}

/** URLs of the files included in an export asset. */
export function exportFiles(asset: Asset): string[] {
  const urls = asset.tags.filter((t) => t.startsWith("file:")).map((t) => t.slice(5));
  return urls.length ? urls : [asset.url];
}

/* ---------- Edit ---------- */
const EDIT_INSTRUCTIONS: Record<string, string> = {
  Crop: "Recadre l’image sur le sujet principal",
  Resize: "Adapte l’image au nouveau format sans déformer le sujet",
  "Remove Background": "Supprime l’arrière-plan : produit détouré sur fond blanc uni",
  "Replace Background": "Remplace l’arrière-plan",
  Relight: "Refais l’éclairage de la scène",
  Retouch: "Retouche l’image : nettoie les défauts, améliore la netteté et les couleurs",
  "Add Text": "Ajoute ce texte de façon lisible et soignée",
  "Add Logo": "Ajoute un emplacement de logo discret",
  "Expand Image": "Agrandis la scène autour du sujet en gardant le même style",
};

/** Real edit of an existing generated/uploaded image (marketing-studio/image in edit mode). */
export async function editImage(params: { url: string; tool: string; instruction?: string; ratio: AspectRatio }): Promise<ImageResult> {
  if (!params.url.startsWith("https://")) throw new ApiError("failed", "Cette image ne peut pas être modifiée : générez-la ou importez-la d’abord.");
  const prompt = `${EDIT_INSTRUCTIONS[params.tool] ?? "Modifie l’image"}${params.instruction ? ` : ${params.instruction}` : "."} Garde le produit identique.`;
  const [result] = await charged("image", `Retouche — ${params.tool}`, 1, () => images(prompt, 1, { ratio: params.ratio, imageUrls: [params.url] }));
  return result;
}

/* ---------- Upscale ---------- */
export async function upscaleImage(params: { url: string; assetId?: ID; projectId?: ID | null }): Promise<ImageResult> {
  const [result] = await charged("upscale", "Agrandissement d’image", 1, () => images("Même image, identique, en très haute définition : détails plus nets, sans rien changer.", 1, { imageUrls: [params.url], upscale: true }));
  return result;
}

/* ---------- Upload ---------- */
export async function uploadProduct(file: File, opts: { projectId?: ID | null } = {}, onProgress?: (progress: number) => void): Promise<Asset> {
  onProgress?.(20);
  const url = await uploadPhoto(file);
  onProgress?.(100);
  // "Phone photo" mode: the clean-up happens in the generation prompts (background, light, sharpness).
  const enhance = useStore.getState().preferences.phonePhotoMode ?? true;
  return useStore.getState().addAsset({ name: file.name, type: "image", url, thumbnail: url, projectId: opts.projectId ?? useStore.getState().currentProjectId, favorite: false, sizeKb: Math.round(file.size / 1024), tags: ["upload", "product", ...(enhance ? ["améliorée"] : [])] });
}

/** Toast subtitle after an upload, mentioning the automatic clean-up when it ran. */
export function uploadSummary(asset: Asset): string {
  return asset.tags.includes("améliorée") ? `${asset.name} · détourage, lumière et netteté corrigés` : asset.name;
}

/* ---------- AI assistant ---------- */
export async function assistantReply(message: string): Promise<{ text: string; actions: string[] }> {
  await delay(600, 1200);
  const m = message.toLowerCase();
  if (m.includes("campaign") || m.includes("campagne")) return { text: "Je peux créer une campagne complète pour votre beurre de karité : photos produit, une vidéo UGC, des statuts WhatsApp et des pubs Facebook avec votre prix en FCFA. On commence avec l’objectif Ventes ?", actions: ["Generate Campaign", "Write Ad Copy"] };
  if (m.includes("video") || m.includes("vidéo") || m.includes("reel")) return { text: "Une rotation lente de 10 secondes fonctionne très bien pour un pot de karité. J’utiliserai votre photo principale comme image source, en version légère pour WhatsApp. Prêt quand vous l’êtes.", actions: ["Generate Video", "Generate UGC"] };
  if (m.includes("copy") || m.includes("caption") || m.includes("texte") || m.includes("légende")) return { text: "Votre ton de marque est court, assuré et jamais guindé. Je vais rédiger trois propositions de légende dans ce ton.", actions: ["Write Ad Copy"] };
  return { text: "Importez une photo produit ou choisissez un modèle, je m’occupe du reste. Que créons-nous aujourd’hui ?", actions: ["Generate Product Shoot", "Generate UGC", "Generate Campaign"] };
}

/* ---------- helpers ---------- */
export function ratioToSize(ratio: AspectRatio): [number, number] {
  switch (ratio) {
    case "1:1": return [800, 800];
    case "4:5": return [800, 1000];
    case "9:16": return [540, 960];
    case "16:9": return [960, 540];
    case "3:2": return [900, 600];
  }
}

const COPY_TOOL_LABELS: Record<CopyTool, string> = {
  "ad-copy": "Texte d’annonce", "product-description": "Description produit", "instagram-caption": "Légende Instagram",
  "tiktok-caption": "Légende TikTok", email: "E-mail", headline: "Titre", hook: "Accroche", cta: "Appel à l’action",
  "ugc-script": "Script UGC", "landing-page": "Page de destination",
  "whatsapp-status": "Statuts WhatsApp", "whatsapp-catalog": "Fiche catalogue WhatsApp", "voice-note": "Note vocale pub",
};

function labelFor(tool: CopyTool): string {
  return COPY_TOOL_LABELS[tool] ?? tool;
}

function buildCopy(p: GenerateCopyParams, style?: string): string {
  const tone = p.tone;
  const opener = tone === "luxury" ? "La qualité se remarque tout de suite." : tone === "urgent" ? "Jusqu’à dimanche seulement." : tone === "funny" ? "Votre voisine l’a déjà. Et vous ?" : tone === "bold" ? "C’est lui, le bon." : tone === "minimal" ? `${p.product}.` : `Découvrez ${p.product}.`;
  const tag = p.product.replace(/\s+/g, "").toLowerCase();
  switch (p.tool) {
    case "ad-copy":
      return `Titre : ${opener}\n\nTexte principal : ${p.product}, pensé pour ${p.audience}. Objectif : ${p.goal}. Qualité garantie, livraison rapide, paiement à la livraison ou par Mobile Money.\n\nCTA : Commander sur WhatsApp`;
    case "product-description":
      return `${p.product} : un produit de qualité pour ${p.audience}. ${style ? "" : ""}Disponible tout de suite, livraison dans toute la ville, paiement Mobile Money ou à la livraison. Écrivez-nous sur WhatsApp pour réserver le vôtre.`;
    case "instagram-caption":
      return `${opener} ${p.product} est là pour ${p.audience}. ${p.goal}.\n\nCommandes en DM ou sur WhatsApp (lien en bio).\n#${tag} #madeinafrica #boutique #livraison`;
    case "tiktok-caption":
      return `${opener} pov : ${p.audience} l’a enfin trouvé. Commande sur WhatsApp, lien en bio. #${tag} #tiktokafrique`;
    case "email":
      return `Objet : ${opener}\n\nBonjour,\n\n${p.product} est disponible, et il a été pensé pour ${p.audience}. ${p.goal}.\n\nJe commande →`;
    case "headline":
      return [`${opener}`, `${p.product}, pensé pour ${p.audience}`, `La qualité au juste prix`, `Livré chez vous, payé en Mobile Money`, `Stock limité, réservez le vôtre`].map((h, i) => `${i + 1}. ${h}`).join("\n");
    case "hook":
      return hookBank.slice(0, 5).map((h, i) => `${i + 1}. ${h}`).join("\n");
    case "cta":
      return ["Commander sur WhatsApp", "Réserver le mien", "Payer en Mobile Money", "Écrivez-nous maintenant", "Passer à la boutique"].map((c, i) => `${i + 1}. ${c}`).join("\n");
    case "ugc-script":
      return `[Accroche] ${hookBank[0]}\n[Démo] Regardez ${p.product} de près : la finition, la qualité.\n[Preuve] Mes clientes reviennent toutes pour en reprendre.\n[CTA] Écrivez-moi sur WhatsApp, je livre aujourd’hui. ${p.goal}.`;
    case "landing-page":
      return `Hero : ${opener}\nSous-titre : ${p.product} pour ${p.audience}.\n\nBénéfices :\n• Qualité vérifiée\n• Livraison rapide dans votre ville\n• Paiement Mobile Money ou à la livraison\n\nCTA : Commander sur WhatsApp`;
    case "whatsapp-status":
      return [
        `Lundi : ${opener} ${p.product} est arrivé 🔥`,
        `Mardi : Photo du jour. Qui veut le sien ? Répondez à ce statut.`,
        `Mercredi : ${p.goal}. Prix spécial jusqu’à vendredi.`,
        `Jeudi : Une cliente satisfaite nous a envoyé ceci 🙏`,
        `Vendredi : Derniers articles en stock. Écrivez-moi en privé.`,
      ].join("\n");
    case "whatsapp-catalog":
      return `Nom : ${p.product}\nDescription : Pensé pour ${p.audience}. Qualité vérifiée, livraison rapide.\nPrix : à compléter\nLien : Commander sur WhatsApp`;
    case "voice-note":
      return `🎙 Note vocale · 20 secondes\n\nBonjour à tous ! Nouveau chez nous : ${p.product}, pensé pour ${p.audience}. Les quantités sont limitées. Pour commander, envoyez-moi simplement un message ici sur WhatsApp. On livre aujourd’hui même. Merci et à tout de suite !`;
  }
}
