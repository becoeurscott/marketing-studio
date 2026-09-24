import type { Project } from "@/lib/types";
import { daysAgo, img } from "@/lib/utils";

export const projects: Project[] = [
  { id: "proj_luma_summer", name: "Luma Skin Summer Launch", description: "Launch campaign for Luma Glow Serum across Instagram, TikTok and Facebook.", brandId: "brand_luma", thumbnail: img("luma-summer", 800, 600), status: "active", createdAt: daysAgo(12), updatedAt: daysAgo(0, 8) },
  { id: "proj_summer_skincare", name: "Summer Skincare Campaign", description: "Seasonal creative refresh for the serum and moisturizer lineup.", brandId: "brand_luma", thumbnail: img("summer-skincare", 800, 600), status: "active", createdAt: daysAgo(25), updatedAt: daysAgo(1) },
  { id: "proj_urban_coffee", name: "Urban Coffee Launch", description: "Brand launch for Urban Coffee Co. cold brew line.", brandId: "brand_urban", thumbnail: img("urban-coffee", 800, 600), status: "active", createdAt: daysAgo(30), updatedAt: daysAgo(2) },
  { id: "proj_fitness", name: "Nike-Inspired Fitness Campaign", description: "High-energy performance visuals and UGC for a fitness apparel drop.", brandId: "brand_luma", thumbnail: img("fitness-campaign", 800, 600), status: "active", createdAt: daysAgo(40), updatedAt: daysAgo(3) },
  { id: "proj_watch", name: "Luxury Watch Campaign", description: "Premium editorial visuals for a limited-edition timepiece.", brandId: "brand_luma", thumbnail: img("luxury-watch", 800, 600), status: "active", createdAt: daysAgo(45), updatedAt: daysAgo(4) },
  { id: "proj_ugc_ads", name: "New Product UGC Ads", description: "Creator-led UGC ads testing four hooks for the serum.", brandId: "brand_luma", thumbnail: img("ugc-ads", 800, 600), status: "active", createdAt: daysAgo(18), updatedAt: daysAgo(1, 15) },
  { id: "proj_holiday", name: "Holiday Gift Sets", description: "Q4 gifting bundles with carousel and story creatives.", brandId: "brand_luma", thumbnail: img("holiday-gift", 800, 600), status: "active", createdAt: daysAgo(60), updatedAt: daysAgo(9) },
  { id: "proj_retinol", name: "Night Repair Retinol", description: "Product education series for the night repair line.", brandId: "brand_luma", thumbnail: img("night-repair", 800, 600), status: "archived", createdAt: daysAgo(120), updatedAt: daysAgo(70) },
  { id: "proj_coldbrew_tiktok", name: "Cold Brew TikTok Series", description: "Ten-part short-form series for the cold brew launch.", brandId: "brand_urban", thumbnail: img("cold-brew", 800, 600), status: "active", updatedAt: daysAgo(6), createdAt: daysAgo(22) },
  { id: "proj_spring_sale", name: "Spring Sale 2026", description: "Sitewide 20% promo creatives for paid social.", brandId: "brand_luma", thumbnail: img("spring-sale", 800, 600), status: "archived", createdAt: daysAgo(200), updatedAt: daysAgo(150) },
  { id: "proj_founder_story", name: "Founder Story Video", description: "Long-form brand story cut into shorts.", brandId: "brand_luma", thumbnail: img("founder-story", 800, 600), status: "active", createdAt: daysAgo(80), updatedAt: daysAgo(14) },
  { id: "proj_sunscreen", name: "SPF 50 Daily Shield", description: "Concept exploration for a new sunscreen SKU.", brandId: "brand_luma", thumbnail: img("spf-shield", 800, 600), status: "active", createdAt: daysAgo(5), updatedAt: daysAgo(0, 11) },
];
