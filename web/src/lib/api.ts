/**
 * Mock API. Every function is async, waits a realistic delay, deducts credits
 * through the store and returns fake-but-plausible results. Swap the bodies for
 * real fetch() calls later; keep the signatures.
 */
import { useStore } from "./store";
import { CREDIT_COSTS, type AdVariation, type AspectRatio, type Asset, type Campaign, type CopyResult, type CopyTool, type Generation, type ID, type ImageStyle, type Platform, type AdFormat, type Tone, type CampaignFormat, type CampaignObjective } from "./types";
import { hooks as hookBank } from "@/data/copy";
import { img, uid } from "./utils";

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

function charge(action: keyof typeof CREDIT_COSTS, description: string, multiplier = 1) {
  const cost = CREDIT_COSTS[action] * multiplier;
  if (cost === 0) return;
  const ok = useStore.getState().spendCredits(action, cost, description);
  if (!ok) throw new ApiError("insufficient-credits", `Il vous faut ${cost} crédits pour cette action. Vous en avez ${useStore.getState().credits}.`);
}

function record(gen: Omit<Generation, "id" | "createdAt">) {
  return useStore.getState().addGeneration(gen);
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
}
export interface ImageResult { id: ID; url: string; thumbnail: string; ratio: AspectRatio; seed: string }

export async function generateImage(params: GenerateImageParams): Promise<ImageResult[]> {
  const count = params.count ?? 4;
  charge("image", `Génération d’image — ${params.prompt.slice(0, 40)}`, count / 4 < 1 ? 1 : count / 4);
  await delay(1400, 2500);
  const [w, h] = ratioToSize(params.ratio ?? "4:5");
  const results = Array.from({ length: count }, (_, i) => {
    const seed = `${uid("img")}-${i}`;
    return { id: uid("res"), url: img(seed, w * 2, h * 2), thumbnail: img(seed, w, h), ratio: params.ratio ?? "4:5", seed };
  });
  record({ type: "image", prompt: params.prompt, status: "completed", thumbnails: results.map((r) => r.thumbnail), projectId: params.projectId ?? null, params: { style: params.style ?? "", ratio: params.ratio ?? "" }, creditsUsed: CREDIT_COSTS.image });
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
  projectId?: ID | null;
}
export interface VideoResult { id: ID; url: string; thumbnail: string; poster: string; durationSec: number; ratio: AspectRatio }

export async function generateVideo(params: GenerateVideoParams, onProgress?: (step: VideoStep, index: number, progress: number) => void): Promise<VideoResult> {
  charge("video", `Vidéo — ${params.concept.slice(0, 40)}`);
  for (let i = 0; i < VIDEO_STEPS.length; i++) {
    onProgress?.(VIDEO_STEPS[i], i, Math.round(((i + 1) / VIDEO_STEPS.length) * 100));
    await delay(600, 1100);
  }
  const seed = uid("vid");
  const [w, h] = ratioToSize(params.ratio ?? "9:16");
  const result: VideoResult = { id: uid("res"), url: params.sourceUrl ?? img(seed, w * 2, h * 2), thumbnail: img(seed, w, h), poster: img(seed, w, h), durationSec: params.durationSec, ratio: params.ratio ?? "9:16" };
  record({ type: "video", prompt: params.concept, status: "completed", thumbnails: [result.thumbnail], projectId: params.projectId ?? null, params: { durationSec: params.durationSec, camera: params.camera ?? "", style: params.style ?? "" }, creditsUsed: CREDIT_COSTS.video });
  return result;
}

/* ---------- UGC ---------- */
export interface GenerateUGCParams {
  productAssetId?: ID | null;
  creatorId: ID;
  script: string;
  location?: string;
  tone?: string;
  durationSec: 5 | 10 | 15;
  projectId?: ID | null;
}
export async function generateUGC(params: GenerateUGCParams, onProgress?: (step: VideoStep, index: number, progress: number) => void): Promise<VideoResult> {
  charge("ugc", `Vidéo UGC — ${params.creatorId.replace("creator_", "")}`);
  for (let i = 0; i < VIDEO_STEPS.length; i++) {
    onProgress?.(VIDEO_STEPS[i], i, Math.round(((i + 1) / VIDEO_STEPS.length) * 100));
    await delay(500, 900);
  }
  const seed = uid("ugc");
  const result: VideoResult = { id: uid("res"), url: img(seed, 1080, 1920), thumbnail: img(seed, 540, 960), poster: img(seed, 540, 960), durationSec: params.durationSec, ratio: "9:16" };
  record({ type: "video", prompt: params.script, status: "completed", thumbnails: [result.thumbnail], projectId: params.projectId ?? null, params: { creator: params.creatorId, tone: params.tone ?? "", durationSec: params.durationSec }, creditsUsed: CREDIT_COSTS.ugc });
  return result;
}

/* ---------- Product shoot ---------- */
export interface ProductShootParams {
  productUrl: string;
  environment: string;
  lighting: string;
  camera: string;
  count?: number;
  projectId?: ID | null;
}
export async function generateProductShoot(params: ProductShootParams): Promise<ImageResult[]> {
  const count = params.count ?? 6;
  charge("product-shoot", `Shooting produit — ${params.environment}`);
  await delay(1600, 2500);
  const results = Array.from({ length: count }, (_, i) => {
    const seed = `${uid("shoot")}-${i}`;
    return { id: uid("res"), url: img(seed, 1600, 2000), thumbnail: img(seed, 800, 1000), ratio: "4:5" as AspectRatio, seed };
  });
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
  projectId?: ID | null;
}
export async function generateAds(params: GenerateAdsParams): Promise<AdVariation[]> {
  charge("ads", `Variantes d’annonce — ${params.platform} ${params.format}`);
  await delay(1200, 2200);
  const labels = ["A", "B", "C", "D"] as const;
  const headlines = [
    `${params.product}: ${params.offer}`,
    `Découvrez ${params.product}`,
    `${params.offer} — cette semaine seulement`,
    `Pourquoi ${params.audience} adore ${params.product}`,
  ];
  const texts = [
    `${params.product} a été pensé pour ${params.audience}. ${params.offer}. ${params.cta} dès aujourd’hui.`,
    `Ne vous contentez plus de moins. ${params.product} fait le travail à votre place. ${params.offer}.`,
    `Offre limitée : ${params.offer} sur ${params.product}. Idéal pour ${params.audience}.`,
    `De vrais résultats, de vraies personnes. Découvrez pourquoi ${params.product} cartonne auprès de ${params.audience}.`,
  ];
  const ctas = [params.cta, "En savoir plus", "Profiter de l’offre", params.cta];
  const results = labels.map((label, i) => ({
    id: uid("var"), label, visual: img(`${uid("ad")}-${label}`, 800, 1000), headline: headlines[i], primaryText: texts[i], cta: ctas[i], platform: params.platform, format: params.format,
  }));
  record({ type: "ad", prompt: `${params.platform} ${params.format} annonce — ${params.product}, ${params.audience}, ${params.offer}, ${params.cta}`, status: "completed", thumbnails: results.map((r) => r.visual), projectId: params.projectId ?? null, params: { platform: params.platform, format: params.format }, creditsUsed: CREDIT_COSTS.ads });
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
  projectId?: ID | null;
}
export async function generateCopy(params: GenerateCopyParams): Promise<CopyResult> {
  charge("copy", `Rédaction — ${labelFor(params.tool)}`);
  await delay(700, 1400);
  const voice = useStore.getState().brands.find((b) => b.id === useStore.getState().currentBrandId)?.voice;
  const text = buildCopy(params, voice?.writingStyle);
  const result: CopyResult = { id: uid("copy"), tool: params.tool, title: `${labelFor(params.tool)} — ${params.product}`, text, tone: params.tone, platform: params.platform, createdAt: new Date().toISOString() };
  record({ type: "copy", prompt: `${labelFor(params.tool)} pour ${params.product}, ${params.audience}, ton ${params.tone}, objectif : ${params.goal}`, status: "completed", thumbnails: [], projectId: params.projectId ?? null, params: { tool: params.tool, tone: params.tone }, creditsUsed: CREDIT_COSTS.copy });
  return result;
}

export async function generateHooks(params: { product: string; audience?: string; tone?: Tone; projectId?: ID | null }): Promise<string[]> {
  charge("copy", `Accroches — ${params.product}`);
  await delay(600, 1200);
  const shuffled = [...hookBank].sort(() => Math.random() - 0.5).slice(0, 10);
  const out = shuffled.map((h) => h.replace(/serum/gi, params.product.toLowerCase().includes("serum") ? "serum" : params.product));
  record({ type: "copy", prompt: `10 accroches pour ${params.product}`, status: "completed", thumbnails: [], projectId: params.projectId ?? null, params: { tone: params.tone ?? "bold" }, creditsUsed: CREDIT_COSTS.copy });
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
  const variations = await generateAds({ platform: params.platforms[0] ?? "instagram", format: "image", product: "Luma Glow Serum", offer: "-20 % pour le lancement", audience: params.audience, cta: "Acheter maintenant", projectId: params.projectId });
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
  quality: "standard" | "high" | "maximum";
  campaignId?: ID;
}
export async function exportAssets(params: ExportParams, onProgress?: (progress: number, label: string) => void): Promise<Asset> {
  const total = Math.max(params.assetIds.length, 1);
  for (let i = 0; i < total; i++) {
    onProgress?.(Math.round(((i + 1) / total) * 90), `Export ${i + 1} sur ${total}`);
    await delay(250, 500);
  }
  onProgress?.(100, "Empaquetage");
  await delay(400);
  const name = params.campaignId ? `Export campagne.${params.format === "mp4" ? "mp4" : "zip"}` : `Export ${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.${total > 1 ? "zip" : params.format}`;
  const asset = useStore.getState().addAsset({ name, type: "export", url: img(uid("exp"), 1200, 1500), thumbnail: img(uid("exp"), 800, 1000), projectId: useStore.getState().currentProjectId, favorite: false, sizeKb: 1800 * total, tags: ["export", params.format, params.quality] });
  useStore.getState().pushNotification({ kind: "export-complete", title: "Export terminé", body: `${name} est prêt à être téléchargé.`, href: "/assets" });
  return asset;
}

/* ---------- Upscale ---------- */
export async function upscaleImage(params: { url: string; assetId?: ID; projectId?: ID | null }): Promise<ImageResult> {
  charge("upscale", `Agrandissement d’image${params.assetId ? ` — ${params.assetId}` : ""}`);
  await delay(1200, 2000);
  const seed = uid("up");
  return { id: uid("res"), url: img(seed, 2400, 3000), thumbnail: img(seed, 800, 1000), ratio: "4:5", seed };
}

/* ---------- Upload ---------- */
export async function uploadProduct(file: { name: string; size?: number; projectId?: ID | null }, onProgress?: (progress: number) => void): Promise<Asset> {
  for (let p = 10; p <= 100; p += 30) {
    onProgress?.(Math.min(p, 100));
    await delay(150, 300);
  }
  const seed = uid("upload");
  return useStore.getState().addAsset({ name: file.name, type: "image", url: img(seed, 1600, 2000), thumbnail: img(seed, 800, 1000), projectId: file.projectId ?? useStore.getState().currentProjectId, favorite: false, width: 1600, height: 2000, sizeKb: Math.round((file.size ?? 900000) / 1024), tags: ["upload", "product"] });
}

/* ---------- AI assistant ---------- */
export async function assistantReply(message: string): Promise<{ text: string; actions: string[] }> {
  await delay(600, 1200);
  const m = message.toLowerCase();
  if (m.includes("campaign") || m.includes("campagne")) return { text: "Je peux créer une campagne complète pour Luma Glow Serum : photos produit, une annonce UGC, un reel et une série de stories pour Instagram, TikTok et Facebook. On commence avec l’objectif Ventes ?", actions: ["Generate Campaign", "Write Ad Copy"] };
  if (m.includes("video") || m.includes("vidéo") || m.includes("reel")) return { text: "Une rotation lente de 10 secondes fonctionne très bien pour les sérums. J’utiliserai votre packshot principal comme image source. Prêt quand vous l’êtes.", actions: ["Generate Video", "Generate UGC"] };
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
};

function labelFor(tool: CopyTool): string {
  return COPY_TOOL_LABELS[tool] ?? tool;
}

function buildCopy(p: GenerateCopyParams, style?: string): string {
  const tone = p.tone;
  const opener = tone === "luxury" ? "Certaines choses valent la peine d’attendre." : tone === "urgent" ? "Jusqu’à dimanche seulement." : tone === "funny" ? "Votre peau a appelé. Elle réclame une augmentation." : tone === "bold" ? "C’est lui, le bon." : tone === "minimal" ? `${p.product}.` : `Découvrez ${p.product}.`;
  switch (p.tool) {
    case "ad-copy":
      return `Titre : ${opener}\n\nTexte principal : ${p.product} a été conçu pour ${p.audience}. Objectif : ${p.goal}. Formule clean, résultats visibles, zéro prise de tête.\n\nCTA : Acheter maintenant`;
    case "product-description":
      return `${p.product} est un sérum éclat à la vitamine C pensé pour la routine quotidienne. Conçu pour ${p.audience}, il cible le teint terne et irrégulier tout en restant assez léger pour s’appliquer sous un SPF. ${style ? "" : ""}Clean. Efficace. Au quotidien.`;
    case "instagram-caption":
      return `${opener} ${p.product} est là pour ${p.audience}. ${p.goal}.\n\n#skincare #glow #vitaminc #${p.product.replace(/\s+/g, "").toLowerCase()}`;
    case "tiktok-caption":
      return `${opener} pov : ${p.audience} l’a enfin trouvé. #${p.product.replace(/\s+/g, "").toLowerCase()} #skintok`;
    case "email":
      return `Objet : ${opener}\n\nBonjour,\n\n${p.product} est disponible, et il a été conçu pour ${p.audience}. ${p.goal}.\n\nJe découvre →`;
    case "headline":
      return [`${opener}`, `${p.product}, pensé pour ${p.audience}`, `Un éclat visible en 7 jours`, `Un seul produit. Zéro prise de tête.`, `Le dernier que vous adopterez`].map((h, i) => `${i + 1}. ${h}`).join("\n");
    case "hook":
      return hookBank.slice(0, 5).map((h, i) => `${i + 1}. ${h}`).join("\n");
    case "cta":
      return ["Acheter maintenant", "Profiter de -20 %", "Essayer dès aujourd’hui", "Voir l’éclat", "Commencer ma routine"].map((c, i) => `${i + 1}. ${c}`).join("\n");
    case "ugc-script":
      return `[Accroche] ${hookBank[0]}\n[Démo] Deux gouttes de ${p.product}. Tapotez avant le SPF.\n[Preuve] Jour sept, et c’est la première chose qu’on remarque.\n[CTA] Lien en bio. ${p.goal}.`;
    case "landing-page":
      return `Hero : ${opener}\nSous-titre : ${p.product} pour ${p.audience}. Un éclat visible dès le septième jour.\n\nBénéfices :\n• Vitamine C stabilisée\n• Texture légère, s’applique sous un SPF\n• Clean, sans parfum\n\nPreuve : 4,8★ sur 1 200 avis\n\nCTA : Acheter maintenant`;
  }
}
