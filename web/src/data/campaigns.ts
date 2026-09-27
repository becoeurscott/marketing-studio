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
  // Ad spend in FCFA (average order value ≈ 29 000 FCFA).
  const spend = (900 + seed * 120) * 600;
  return { impressions, reach: Math.round(impressions * 0.72), clicks, ctr: +((clicks / impressions) * 100).toFixed(2), conversions, spend, roas: +((conversions * 48 * 600) / spend).toFixed(2), daily };
}

function variations(seed: string, platform: Platform): AdVariation[] {
  const labels = ["A", "B", "C", "D"] as const;
  const heads = ["Une peau douce en 7 jours", "Le vrai karité, sans mélange", "Fait à Abidjan, pour ta peau", "Le pot que toutes mes clientes redemandent"];
  const texts = [
    "Beurre de karité pur Karité d'Or : peau nourrie, cheveux souples, zéro produit chimique. Pot de 250 g à 7 500 FCFA, livraison partout à Abidjan.",
    "Stop aux crèmes coupées au marché. Notre karité vient directement des coopératives de Korhogo. Offre de lancement jusqu'à dimanche.",
    "Un seul pot pour le corps, le visage et les cheveux. Naturel, simple et à prix doux.",
    "De vraies clientes, de vrais résultats. Découvre pourquoi le premier arrivage est parti en trois jours.",
  ];
  const ctas = ["Commander sur WhatsApp", "Profiter de -20 %", "En savoir plus", "Écrire à la boutique"];
  return labels.map((label, i) => ({
    id: `var_${seed}_${label}`,
    label,
    visual: img(`${seed}-var-${label}`, 800, 1000),
    headline: heads[i],
    primaryText: texts[i],
    cta: ctas[i],
    platform,
    format: i % 2 === 0 ? (platform === "whatsapp" ? "status" : "image") : "video",
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
    title: ["Teaser de lancement", "Photo du pot", "Avis cliente", "Avant/après", "Rappel de l'offre", "Routine du soir", "Histoire du karité", "Dernier appel"][i],
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
  base("camp_luma_summer", "Lancement beurre de karité pur", "proj_luma_summer", "sales", "active", ["whatsapp", "tiktok", "facebook"], ["product-photos", "ugc", "video-ads", "stories", "carousels"], "Femmes de 20 à 45 ans à Abidjan qui aiment les soins naturels", 10, 1),
  base("camp_skincare_refresh", "Statuts WhatsApp de la semaine", "proj_summer_skincare", "engagement", "active", ["whatsapp", "facebook"], ["product-photos", "stories"], "Clientes existantes et contacts WhatsApp, 25–45 ans", 20, 2),
  base("camp_urban_launch", "Menu et livraison Chez Tantie Rose", "proj_urban_coffee", "awareness", "active", ["whatsapp", "tiktok", "facebook"], ["video-ads", "ugc"], "Travailleurs de Cocody et du Plateau, 20–50 ans", 28, 3),
  base("camp_fitness_drop", "Nouvel arrivage wax", "proj_fitness", "sales", "completed", ["facebook", "tiktok", "whatsapp"], ["ugc", "video-ads", "stories"], "Femmes de 18 à 40 ans qui cousent pour les cérémonies", 38, 4),
  base("camp_watch_editorial", "Promo téléphones Adjamé", "proj_watch", "awareness", "completed", ["facebook", "tiktok"], ["product-photos", "video-ads"], "Jeunes de 18 à 35 ans qui cherchent un smartphone à bon prix", 42, 5),
  base("camp_ugc_test", "Test d'accroches témoignages — Karité", "proj_ugc_ads", "leads", "active", ["tiktok", "facebook"], ["ugc"], "Femmes de 20 à 35 ans qui découvrent le karité pur", 15, 6),
  base("camp_holiday", "Coffrets fête des mères", "proj_holiday", "sales", "draft", ["whatsapp", "instagram", "facebook"], ["carousels", "stories", "product-photos"], "Enfants et maris qui cherchent un cadeau, 20–45 ans", 55, 7),
  base("camp_coldbrew_series", "Série TikTok attiéké poisson braisé", "proj_coldbrew_tiktok", "engagement", "active", ["tiktok"], ["video-ads", "ugc"], "Jeunes Abidjanais gourmands, 18–30 ans", 20, 8),
  base("camp_founder", "Vidéos histoire de la fondatrice", "proj_founder_story", "awareness", "draft", ["facebook", "tiktok"], ["video-ads"], "Curieuses de la marque et diaspora, 25–45 ans", 70, 9),
  base("camp_spf", "Flyer stand marché de Treichville", "proj_sunscreen", "awareness", "draft", ["whatsapp", "facebook"], ["product-photos", "stories"], "Clientes du marché et du quartier, 20–55 ans", 4, 10),
  base("camp_retention", "Relance clientes — réachat", "proj_luma_summer", "sales", "active", ["whatsapp", "facebook"], ["carousels"], "Clientes ayant acheté il y a plus de 45 jours", 8, 11),
];
