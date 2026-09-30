import type { AnalyticsSummary } from "@/lib/types";

/** No usage analytics yet (to be computed from real activity). */
export const analytics: AnalyticsSummary = { totals: { generations: 0, exports: 0, campaigns: 0, assets: 0 }, weekly: [], topFormats: [] };

export const trendingFormats: { id: string; title: string; description: string; growth: string; mode: "image" | "video" | "ugc" | "product-shoot" | "ads" | "copy" }[] = [];
