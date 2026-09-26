import type { AnalyticsSummary } from "@/lib/types";

export const analytics: AnalyticsSummary = {
  totals: { generations: 1284, exports: 212, campaigns: 11, assets: 58 },
  weekly: [
    { week: "W1", images: 62, videos: 9, copy: 41, ads: 12 },
    { week: "W2", images: 74, videos: 12, copy: 38, ads: 16 },
    { week: "W3", images: 58, videos: 14, copy: 52, ads: 10 },
    { week: "W4", images: 91, videos: 18, copy: 47, ads: 21 },
    { week: "W5", images: 103, videos: 22, copy: 60, ads: 24 },
    { week: "W6", images: 88, videos: 19, copy: 55, ads: 19 },
  ],
  topFormats: [
    { format: "Vidéo UGC", share: 32 },
    { format: "Photos produit", share: 27 },
    { format: "Reels", share: 18 },
    { format: "Carrousels", share: 13 },
    { format: "Stories", share: 10 },
  ],
};

export const trendingFormats: { id: string; title: string; description: string; growth: string; mode: "image" | "video" | "ugc" | "product-shoot" | "ads" | "copy" }[] = [
  { id: "tf_ugc", title: "Pubs vidéo UGC", description: "Pubs de 15 s portées par un créateur : accroche, démo et CTA.", growth: "+38%", mode: "ugc" },
  { id: "tf_shoot", title: "Shooting produit IA", description: "Une photo → neuf décors en quelques secondes.", growth: "+27%", mode: "product-shoot" },
  { id: "tf_reel", title: "Reels verticaux", description: "Reels produit en orbite lente et travelling avant pour IG et TikTok.", growth: "+19%", mode: "video" },
  { id: "tf_carousel", title: "Carrousels de preuve", description: "Carrousels avant/après et témoignages qui convertissent.", growth: "+14%", mode: "ads" },
  { id: "tf_hooks", title: "Packs d'accroches", description: "Dix accroches qui stoppent le scroll par produit, en un clic.", growth: "+11%", mode: "copy" },
];
