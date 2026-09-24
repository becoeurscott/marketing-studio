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
  if (!ok) throw new ApiError("insufficient-credits", `You need ${cost} credits for this. You have ${useStore.getState().credits}.`);
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
  charge("image", `Image generation — ${params.prompt.slice(0, 40)}`, count / 4 < 1 ? 1 : count / 4);
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
export const VIDEO_STEPS = ["Preparing assets", "Building scene 1...", "Adding motion...", "Rendering...", "Finalizing..."] as const;
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
  charge("video", `Video — ${params.concept.slice(0, 40)}`);
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
  charge("ugc", `UGC video — ${params.creatorId.replace("creator_", "")}`);
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
  charge("product-shoot", `Product shoot — ${params.environment}`);
  await delay(1600, 2500);
  const results = Array.from({ length: count }, (_, i) => {
    const seed = `${uid("shoot")}-${i}`;
    return { id: uid("res"), url: img(seed, 1600, 2000), thumbnail: img(seed, 800, 1000), ratio: "4:5" as AspectRatio, seed };
  });
  record({ type: "image", prompt: `Product shoot in ${params.environment}, ${params.lighting} lighting, ${params.camera}`, status: "completed", thumbnails: results.map((r) => r.thumbnail), projectId: params.projectId ?? null, params: { environment: params.environment, lighting: params.lighting, camera: params.camera }, creditsUsed: CREDIT_COSTS["product-shoot"] });
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
  charge("ads", `Ad variations — ${params.platform} ${params.format}`);
  await delay(1200, 2200);
  const labels = ["A", "B", "C", "D"] as const;
  const headlines = [
    `${params.product}: ${params.offer}`,
    `Meet ${params.product}`,
    `${params.offer} — this week only`,
    `Why ${params.audience.split(" ")[0] || "people"} love ${params.product}`,
  ];
  const texts = [
    `${params.product} was made for ${params.audience}. ${params.offer}. ${params.cta} today.`,
    `Stop settling. ${params.product} does the work so you don't have to. ${params.offer}.`,
    `Limited time: ${params.offer} on ${params.product}. Perfect for ${params.audience}.`,
    `Real results, real people. See why ${params.product} is trending with ${params.audience}.`,
  ];
  const ctas = [params.cta, "Learn More", "Get Offer", params.cta];
  const results = labels.map((label, i) => ({
    id: uid("var"), label, visual: img(`${uid("ad")}-${label}`, 800, 1000), headline: headlines[i], primaryText: texts[i], cta: ctas[i], platform: params.platform, format: params.format,
  }));
  record({ type: "ad", prompt: `${params.platform} ${params.format} ad — ${params.product}, ${params.audience}, ${params.offer}, ${params.cta}`, status: "completed", thumbnails: results.map((r) => r.visual), projectId: params.projectId ?? null, params: { platform: params.platform, format: params.format }, creditsUsed: CREDIT_COSTS.ads });
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
  charge("copy", `Copy — ${params.tool}`);
  await delay(700, 1400);
  const voice = useStore.getState().brands.find((b) => b.id === useStore.getState().currentBrandId)?.voice;
  const text = buildCopy(params, voice?.writingStyle);
  const result: CopyResult = { id: uid("copy"), tool: params.tool, title: `${labelFor(params.tool)} — ${params.product}`, text, tone: params.tone, platform: params.platform, createdAt: new Date().toISOString() };
  record({ type: "copy", prompt: `${labelFor(params.tool)} for ${params.product}, ${params.audience}, ${params.tone} tone, goal: ${params.goal}`, status: "completed", thumbnails: [], projectId: params.projectId ?? null, params: { tool: params.tool, tone: params.tone }, creditsUsed: CREDIT_COSTS.copy });
  return result;
}

export async function generateHooks(params: { product: string; audience?: string; tone?: Tone; projectId?: ID | null }): Promise<string[]> {
  charge("copy", `Hooks — ${params.product}`);
  await delay(600, 1200);
  const shuffled = [...hookBank].sort(() => Math.random() - 0.5).slice(0, 10);
  const out = shuffled.map((h) => h.replace(/serum/gi, params.product.toLowerCase().includes("serum") ? "serum" : params.product));
  record({ type: "copy", prompt: `10 hooks for ${params.product}`, status: "completed", thumbnails: [], projectId: params.projectId ?? null, params: { tone: params.tone ?? "bold" }, creditsUsed: CREDIT_COSTS.copy });
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
  const steps = ["Analyzing product", "Planning formats", "Generating creatives", "Writing copy", "Building calendar"];
  for (let i = 0; i < steps.length; i++) {
    onProgress?.(steps[i], Math.round(((i + 1) / steps.length) * 100));
    await delay(400, 700);
  }
  const store = useStore.getState();
  const assetIds = store.assets.filter((a) => a.type === "image").slice(0, 8).map((a) => a.id);
  const variations = await generateAds({ platform: params.platforms[0] ?? "instagram", format: "image", product: "Luma Glow Serum", offer: "20% launch discount", audience: params.audience, cta: "Shop Now", projectId: params.projectId });
  const campaign = store.createCampaign({
    ...params,
    status: "draft",
    assetIds,
    variations,
    calendar: params.platforms.slice(0, 4).map((platform, i) => ({
      id: uid("cal"), campaignId: "", date: new Date(Date.now() + (i + 1) * 86400000).toISOString(), platform, format: "image" as AdFormat, status: "draft" as const, assetId: assetIds[i] ?? null, title: `${params.name} — post ${i + 1}`,
    })),
  });
  store.updateCampaign(campaign.id, { calendar: campaign.calendar.map((c) => ({ ...c, campaignId: campaign.id })) });
  store.pushNotification({ kind: "campaign-ready", title: `${params.name} is ready`, body: "Creatives, copy and a starter calendar were generated.", href: `/campaigns/${campaign.id}` });
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
    onProgress?.(Math.round(((i + 1) / total) * 90), `Exporting ${i + 1} of ${total}`);
    await delay(250, 500);
  }
  onProgress?.(100, "Packaging");
  await delay(400);
  const name = params.campaignId ? `Campaign export.${params.format === "mp4" ? "mp4" : "zip"}` : `Export ${new Date().toLocaleDateString()}.${total > 1 ? "zip" : params.format}`;
  const asset = useStore.getState().addAsset({ name, type: "export", url: img(uid("exp"), 1200, 1500), thumbnail: img(uid("exp"), 800, 1000), projectId: useStore.getState().currentProjectId, favorite: false, sizeKb: 1800 * total, tags: ["export", params.format, params.quality] });
  useStore.getState().pushNotification({ kind: "export-complete", title: "Export complete", body: `${name} is ready to download.`, href: "/assets" });
  return asset;
}

/* ---------- Upscale ---------- */
export async function upscaleImage(params: { url: string; assetId?: ID; projectId?: ID | null }): Promise<ImageResult> {
  charge("upscale", `Upscale image${params.assetId ? ` — ${params.assetId}` : ""}`);
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
  if (m.includes("campaign")) return { text: "I can build a full campaign for Luma Glow Serum: product photos, a UGC ad, a reel and a story set for Instagram, TikTok and Facebook. Want me to start with the Sales objective?", actions: ["Generate Campaign", "Write Ad Copy"] };
  if (m.includes("video") || m.includes("reel")) return { text: "A 10-second slow orbit works well for serums. I'll use your hero packshot as the source frame. Ready when you are.", actions: ["Generate Video", "Generate UGC"] };
  if (m.includes("copy") || m.includes("caption")) return { text: "Your brand voice is short, confident and never formal. I'll write three caption options in that voice.", actions: ["Write Ad Copy"] };
  return { text: "Upload a product photo or pick a template and I'll take it from there. What are we creating today?", actions: ["Generate Product Shoot", "Generate UGC", "Generate Campaign"] };
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

function labelFor(tool: CopyTool): string {
  return tool.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function buildCopy(p: GenerateCopyParams, style?: string): string {
  const tone = p.tone;
  const opener = tone === "luxury" ? "Some things are worth the wait." : tone === "urgent" ? "Ends Sunday." : tone === "funny" ? "Your skin called. It wants a raise." : tone === "bold" ? "This is the one." : tone === "minimal" ? `${p.product}.` : `Meet ${p.product}.`;
  switch (p.tool) {
    case "ad-copy":
      return `Headline: ${opener}\n\nPrimary text: ${p.product} was designed for ${p.audience}. Goal: ${p.goal}. Clean formula, visible results, no fuss.\n\nCTA: Shop Now`;
    case "product-description":
      return `${p.product} is a vitamin C brightening serum designed for everyday routines. Built for ${p.audience}, it targets dullness and uneven tone while staying light enough to layer under SPF. ${style ? "" : ""}Clean. Effective. Everyday.`;
    case "instagram-caption":
      return `${opener} ${p.product} is here for ${p.audience}. ${p.goal}.\n\n#skincare #glow #vitaminc #${p.product.replace(/\s+/g, "").toLowerCase()}`;
    case "tiktok-caption":
      return `${opener} pov: ${p.audience} finally found it. #${p.product.replace(/\s+/g, "").toLowerCase()} #skintok`;
    case "email":
      return `Subject: ${opener}\n\nHi there,\n\n${p.product} is live, and it was built for ${p.audience}. ${p.goal}.\n\nShop now →`;
    case "headline":
      return [`${opener}`, `${p.product}, made for ${p.audience}`, `Glow you can see in 7 days`, `One product. Zero fuss.`, `The last one you'll switch to`].map((h, i) => `${i + 1}. ${h}`).join("\n");
    case "hook":
      return hookBank.slice(0, 5).map((h, i) => `${i + 1}. ${h}`).join("\n");
    case "cta":
      return ["Shop Now", "Get 20% Off", "Try It Today", "See the Glow", "Start Your Routine"].map((c, i) => `${i + 1}. ${c}`).join("\n");
    case "ugc-script":
      return `[Hook] ${hookBank[0]}\n[Demo] Two drops of ${p.product}. Pat it in before SPF.\n[Proof] Day seven and it's the first thing people notice.\n[CTA] Link in bio. ${p.goal}.`;
    case "landing-page":
      return `Hero: ${opener}\nSub: ${p.product} for ${p.audience}. Visible glow by day seven.\n\nBenefits:\n• Stabilized vitamin C\n• Lightweight, layers under SPF\n• Clean, fragrance-free\n\nProof: 4.8★ from 1,200 reviews\n\nCTA: Shop Now`;
  }
}
