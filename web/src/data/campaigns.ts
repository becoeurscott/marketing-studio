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
  const heads = ["Un éclat visible en 7 jours", "Vos matins deviennent plus lumineux", "La vitamine C. Bien faite.", "Le sérum dont tout le monde parle"];
  const texts = [
    "Le sérum Luma Glow illumine, unifie le teint et s'intègre à toutes les routines. -20 % pendant la semaine de lancement.",
    "Oubliez la routine en dix étapes. Un seul sérum, un éclat visible. Offre de lancement jusqu'à dimanche.",
    "De la vitamine C stabilisée dans une formule légère. Clean, efficace, au quotidien.",
    "De vraies personnes, de vrais résultats. Découvrez pourquoi Luma Glow a été en rupture dès son premier lancement.",
  ];
  const ctas = ["Acheter", "Profiter de -20 %", "En savoir plus", "Essayer aujourd'hui"];
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
    title: ["Teaser de lancement", "Packshot hero", "Avis créateur", "Avant/après", "Rappel de l'offre", "Reel routine", "Histoire des ingrédients", "Dernier appel"][i],
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
  base("camp_luma_summer", "Lancement été Luma Glow", "proj_luma_summer", "sales", "active", ["instagram", "tiktok", "facebook"], ["product-photos", "ugc", "video-ads", "stories", "carousels"], "Femmes et hommes de 20 à 35 ans intéressés par le soin de la peau", 10, 1),
  base("camp_skincare_refresh", "Renouveau skincare de l'été", "proj_summer_skincare", "engagement", "active", ["instagram", "facebook"], ["product-photos", "carousels"], "Clients existants, 25–40 ans", 20, 2),
  base("camp_urban_launch", "Lancement du cold brew Urban Coffee", "proj_urban_coffee", "awareness", "active", ["instagram", "tiktok", "youtube"], ["video-ads", "ugc"], "Actifs urbains, 25–45 ans", 28, 3),
  base("camp_fitness_drop", "Lancement vêtements de fitness", "proj_fitness", "sales", "completed", ["instagram", "tiktok"], ["ugc", "video-ads", "stories"], "Habitués de la salle, 18–34 ans", 38, 4),
  base("camp_watch_editorial", "Série éditoriale montres", "proj_watch", "awareness", "completed", ["instagram", "youtube"], ["product-photos", "video-ads"], "Hommes 30–50 ans, acheteurs de luxe", 42, 5),
  base("camp_ugc_test", "Test d'accroches UGC — Sérum", "proj_ugc_ads", "leads", "active", ["tiktok", "facebook"], ["ugc"], "Femmes 20–30 ans, débutantes en skincare", 15, 6),
  base("camp_holiday", "Coffrets cadeaux des fêtes", "proj_holiday", "sales", "draft", ["instagram", "facebook"], ["carousels", "stories", "product-photos"], "Acheteurs de cadeaux, 25–45 ans", 55, 7),
  base("camp_coldbrew_series", "Série TikTok cold brew", "proj_coldbrew_tiktok", "engagement", "active", ["tiktok"], ["video-ads", "ugc"], "Amateurs de café de la génération Z", 20, 8),
  base("camp_founder", "Shorts histoire du fondateur", "proj_founder_story", "awareness", "draft", ["youtube", "instagram"], ["video-ads"], "Curieux de la marque, 25–40 ans", 70, 9),
  base("camp_spf", "Teaser SPF Daily Shield", "proj_sunscreen", "awareness", "draft", ["instagram", "tiktok"], ["product-photos", "stories"], "Passionnés de skincare, 20–35 ans", 4, 10),
  base("camp_retention", "Fidélisation — rappel de réachat", "proj_luma_summer", "sales", "active", ["facebook", "instagram"], ["carousels"], "Clients ayant acheté il y a plus de 45 jours", 8, 11),
];
