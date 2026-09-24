import type { Generation, GenerationType } from "@/lib/types";
import { daysAgo, img } from "@/lib/utils";

const prompts: Record<GenerationType, string[]> = {
  image: [
    "Luma Glow Serum on a marble surface, golden hour light, soft shadows, luxury product photography",
    "Serum bottle with citrus slices and water droplets, bright and fresh, studio lighting",
    "Minimal packshot on beige linen, top-down, editorial skincare",
    "Serum in a modern bathroom shelf with eucalyptus, natural light",
    "Cold brew bottle sweating on a sunny cafe table, lifestyle",
    "Luxury watch on dark leather, macro dial, dramatic rim light",
    "Runner mid-stride at dawn, motion blur, cinematic fitness",
    "SPF bottle on wet sand with ocean foam, bright summer",
    "Holiday gift set with ribbon on a snowy window sill",
    "Serum drop macro on glass, purple gradient backdrop",
  ],
  video: [
    "Slow orbit around the serum bottle, 10s, cinematic",
    "Push-in on cold brew pour, 5s, commercial",
    "UGC morning routine with Maya, 15s, casual tone",
    "Watch reveal pull-out shot, 10s, luxury",
    "Handheld gym bag unboxing with Jordan, 15s",
    "Serum drop loop, 5s, product demo",
  ],
  copy: [
    "Instagram caption for the summer launch, friendly tone",
    "Product description for Luma Glow Serum, professional",
    "10 hooks for TikTok UGC, bold tone",
    "Launch email announcing 20% off, urgent",
    "Landing page hero copy, minimal tone",
    "TikTok caption for GRWM video, funny",
  ],
  ad: [
    "Instagram carousel ad, women 20–35, 20% launch offer, Shop Now",
    "TikTok video ad, skincare beginners, Try It Today",
    "Facebook image ad, reorder reminder, Get 20% Off",
    "YouTube short ad, cold brew launch, Learn More",
    "Pinterest image ad, gift sets, Shop Gifts",
  ],
};

const projectIds = ["proj_luma_summer", "proj_summer_skincare", "proj_urban_coffee", "proj_watch", "proj_fitness", "proj_ugc_ads", "proj_holiday", "proj_sunscreen"];
const statuses: Generation["status"][] = ["completed", "completed", "completed", "completed", "completed", "processing", "failed", "queued"];
const costs: Record<GenerationType, number> = { image: 10, video: 50, copy: 2, ad: 20 };

let n = 0;
function gen(type: GenerationType, prompt: string): Generation {
  n += 1;
  const count = type === "copy" ? 1 : type === "video" ? 1 : 4;
  return {
    id: `gen_${n}`,
    type,
    prompt,
    status: statuses[n % statuses.length],
    thumbnails: Array.from({ length: count }, (_, i) => img(`gen-${n}-${i}`, 800, 1000)),
    projectId: projectIds[n % projectIds.length],
    params: type === "image" ? { style: "Luxury", ratio: "4:5" } : type === "video" ? { durationSec: 10, camera: "Orbit" } : type === "ad" ? { platform: "instagram" } : { tone: "friendly" },
    creditsUsed: costs[type] * (type === "image" ? 1 : 1),
    createdAt: daysAgo(Math.floor(n / 2), 7 + (n % 12)),
  };
}

export const generations: Generation[] = [
  ...prompts.image.map((p) => gen("image", p)),
  ...prompts.video.map((p) => gen("video", p)),
  ...prompts.copy.map((p) => gen("copy", p)),
  ...prompts.ad.map((p) => gen("ad", p)),
  ...prompts.image.slice(0, 5).map((p) => gen("image", p + ", variant B")),
].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
