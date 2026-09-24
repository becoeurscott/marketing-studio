import type { Asset, AssetType } from "@/lib/types";
import { daysAgo, img } from "@/lib/utils";

const projectIds = [
  "proj_luma_summer", "proj_summer_skincare", "proj_urban_coffee", "proj_fitness",
  "proj_watch", "proj_ugc_ads", "proj_holiday", "proj_coldbrew_tiktok", "proj_founder_story", "proj_sunscreen",
];

const imageNames = [
  "Serum hero — marble", "Serum on beach towel", "Serum with citrus", "Bathroom shelf still life",
  "Golden hour packshot", "Studio white packshot", "Hand holding serum", "Serum drop macro",
  "Lifestyle morning routine", "Flatlay with linen", "Neon studio shot", "Editorial portrait with product",
  "Cold brew pour", "Latte art close-up", "Coffee bag on counter", "Espresso crema macro",
  "Runner at dawn", "Gym floor shot", "Sprint motion blur", "Track lane overhead",
  "Watch on wrist — cuff", "Watch macro dial", "Watch on leather", "Watch box unboxing",
  "Gift set overhead", "Ribbon and box", "Snow window still", "Candle and serum",
  "SPF bottle on sand", "Sunscreen swatch", "Pool edge product", "Sunglasses and serum",
];

const videoNames = [
  "UGC — Maya morning routine", "UGC — Jordan gym bag", "UGC — Sofia GRWM", "UGC — Marcus review",
  "Product reel — slow orbit", "Product reel — push in", "Cold brew 15s spot", "Founder story cut 1",
  "Founder story cut 2", "Watch cinematic 10s", "Fitness hype 9:16", "Serum drop loop",
];

function make(i: number, type: AssetType, name: string, opts: Partial<Asset> = {}): Asset {
  const seed = `${type}-${i}-${name}`;
  const projectId = projectIds[i % projectIds.length];
  const isVideo = type === "video";
  const isAudio = type === "audio";
  return {
    id: `asset_${type}_${i}`,
    name,
    type,
    url: img(seed, 1200, 1500),
    thumbnail: img(seed, 800, 1000),
    projectId,
    favorite: i % 7 === 0,
    width: isAudio ? undefined : isVideo ? 1080 : 1600,
    height: isAudio ? undefined : isVideo ? 1920 : 2000,
    durationSec: isVideo ? [5, 10, 15][i % 3] : isAudio ? 30 + (i % 4) * 15 : undefined,
    sizeKb: isVideo ? 4200 + i * 310 : isAudio ? 900 + i * 40 : 420 + i * 37,
    tags: [type, projectId.replace("proj_", "").split("_")[0]],
    createdAt: daysAgo(i % 21, 8 + (i % 10)),
    ...opts,
  };
}

const images = imageNames.map((n, i) => make(i, "image", n));
const videos = videoNames.map((n, i) => make(i + 100, "video", n));
const audio = ["Upbeat pop bed", "Soft piano loop", "Lo-fi morning", "Cinematic rise"].map((n, i) => make(i + 200, "audio", n, { thumbnail: img(`audio-${i}`, 800, 800), url: img(`audio-${i}`, 800, 800) }));
const logos = ["Luma wordmark", "Luma icon", "Urban Coffee logo"].map((n, i) => make(i + 300, "logo", n, { projectId: null, thumbnail: img(`logo-${i}`, 800, 800) }));
const brandAssets = ["Brand palette", "Type specimen", "Packaging dieline"].map((n, i) => make(i + 400, "brand", n, { projectId: null, thumbnail: img(`brand-${i}`, 800, 800) }));
const exportsList = ["Summer launch — IG carousel.zip", "UGC ads — TikTok.mp4", "Campaign deck.pdf", "Watch reel — 4K.mp4"].map((n, i) => make(i + 500, "export", n, { thumbnail: img(`export-${i}`, 800, 1000) }));

export const assets: Asset[] = [...images, ...videos, ...audio, ...logos, ...brandAssets, ...exportsList];
