import type { AdVariation, CalendarItem, Campaign, CampaignAnalytics, Platform } from "@/lib/types";
import { daysAgo, img } from "@/lib/utils";

function analytics(seed: number): CampaignAnalytics {
  const daily = Array.from({ length: 14 }, (_, i) => ({
    date: daysAgo(13 - i),
    impressions: 4000 + ((seed * 37 + i * 91) % 5000),
    clicks: 120 + ((seed * 13 + i * 29) % 260),
    conversions: 6 + ((seed * 7 + i * 5) % 22),
  }));
  const impressions = daily.reduce((a, d) => a + d.impressions, 0);
  const clicks = daily.reduce((a, d) => a + d.clicks, 0);
  const conversions = daily.reduce((a, d) => a + d.conversions, 0);
  const spend = 900 + seed * 120;
  return { impressions, reach: Math.round(impressions * 0.72), clicks, ctr: +((clicks / impressions) * 100).toFixed(2), conversions, spend, roas: +((conversions * 48) / spend).toFixed(2), daily };
}

function variations(seed: string, platform: Platform): AdVariation[] {
  const labels = ["A", "B", "C", "D"] as const;
  const heads = ["Glow you can see in 7 days", "Your morning just got brighter", "Vitamin C. Done right.", "The serum everyone's asking about"];
  const texts = [
    "Luma Glow Serum brightens, evens tone and fits into any routine. 20% off for launch week.",
    "Skip the ten-step routine. One serum, visible glow. Launch offer ends Sunday.",
    "Stabilized vitamin C in a lightweight formula. Clean, effective, everyday.",
    "Real people, real results. See why Luma Glow sold out its first drop.",
  ];
  const ctas = ["Shop Now", "Get 20% Off", "Learn More", "Try It Today"];
  return labels.map((label, i) => ({
    id: `var_${seed}_${label}`,
    label,
    visual: img(`${seed}-var-${label}`, 800, 1000),
    headline: heads[i],
    primaryText: texts[i],
    cta: ctas[i],
    platform,
    format: i % 2 === 0 ? "image" : "video",
  }));
}

function calendar(campaignId: string, platforms: Platform[]): CalendarItem[] {
  const formats = ["image", "reel", "story", "carousel", "video"] as const;
  const statuses = ["published", "published", "scheduled", "scheduled", "draft", "draft"] as const;
  return Array.from({ length: 8 }, (_, i) => ({
    id: `cal_${campaignId}_${i}`,
    campaignId,
    date: daysAgo(3 - i, 9 + i),
    platform: platforms[i % platforms.length],
    format: formats[i % formats.length],
    status: statuses[i % statuses.length],
    assetId: `asset_image_${(i * 3) % 32}`,
    title: ["Launch teaser", "Hero packshot", "Creator review", "Before/after", "Offer reminder", "Routine reel", "Ingredient story", "Last call"][i],
  }));
}

const base = (
  id: string, name: string, projectId: string, objective: Campaign["objective"], status: Campaign["status"],
  platforms: Platform[], formats: Campaign["formats"], audience: string, createdDays: number, seed: number,
): Campaign => ({
  id, name, projectId, objective, status, platforms, formats, audience,
  assetIds: Array.from({ length: 6 + (seed % 5) }, (_, i) => `asset_image_${(seed * 3 + i) % 32}`),
  variations: variations(id, platforms[0]),
  calendar: calendar(id, platforms),
  copy: [],
  analytics: status === "draft" ? undefined : analytics(seed),
  createdAt: daysAgo(createdDays),
  updatedAt: daysAgo(Math.max(0, createdDays - 3)),
});

export const campaigns: Campaign[] = [
  base("camp_luma_summer", "Luma Glow Summer Launch", "proj_luma_summer", "sales", "active", ["instagram", "tiktok", "facebook"], ["product-photos", "ugc", "video-ads", "stories", "carousels"], "Women and men 20–35 interested in skincare", 10, 1),
  base("camp_skincare_refresh", "Summer Skincare Refresh", "proj_summer_skincare", "engagement", "active", ["instagram", "facebook"], ["product-photos", "carousels"], "Existing customers, 25–40", 20, 2),
  base("camp_urban_launch", "Urban Coffee Cold Brew Launch", "proj_urban_coffee", "awareness", "active", ["instagram", "tiktok", "youtube"], ["video-ads", "ugc"], "Urban professionals 25–45", 28, 3),
  base("camp_fitness_drop", "Fitness Apparel Drop", "proj_fitness", "sales", "completed", ["instagram", "tiktok"], ["ugc", "video-ads", "stories"], "Gym-goers 18–34", 38, 4),
  base("camp_watch_editorial", "Watch Editorial Series", "proj_watch", "awareness", "completed", ["instagram", "youtube"], ["product-photos", "video-ads"], "Men 30–50, luxury shoppers", 42, 5),
  base("camp_ugc_test", "UGC Hook Test — Serum", "proj_ugc_ads", "leads", "active", ["tiktok", "facebook"], ["ugc"], "Women 20–30, skincare beginners", 15, 6),
  base("camp_holiday", "Holiday Gift Sets", "proj_holiday", "sales", "draft", ["instagram", "facebook"], ["carousels", "stories", "product-photos"], "Gift shoppers 25–45", 55, 7),
  base("camp_coldbrew_series", "Cold Brew TikTok Series", "proj_coldbrew_tiktok", "engagement", "active", ["tiktok"], ["video-ads", "ugc"], "Gen Z coffee drinkers", 20, 8),
  base("camp_founder", "Founder Story Shorts", "proj_founder_story", "awareness", "draft", ["youtube", "instagram"], ["video-ads"], "Brand-curious 25–40", 70, 9),
  base("camp_spf", "SPF Daily Shield Teaser", "proj_sunscreen", "awareness", "draft", ["instagram", "tiktok"], ["product-photos", "stories"], "Skincare enthusiasts 20–35", 4, 10),
  base("camp_retention", "Retention — Reorder Reminder", "proj_luma_summer", "sales", "active", ["facebook", "instagram"], ["carousels"], "Customers who purchased 45+ days ago", 8, 11),
];
