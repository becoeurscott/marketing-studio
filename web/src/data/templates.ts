import type { Template, TemplateCategory, Platform, AdFormat, TemplatePreset } from "@/lib/types";
import { img } from "@/lib/utils";

type T = [string, string, TemplateCategory, Platform, AdFormat, TemplatePreset, boolean, number];

const rows: T[] = [
  ["Luxury Product Launch", "Editorial-grade hero visuals with dramatic lighting for a premium launch.", "Product Ads", "instagram", "image", { mode: "image", style: "Luxury", ratio: "4:5", prompt: "Luxury product advertisement, dramatic side lighting, dark marble surface" }, true, 4210],
  ["15-Second UGC Ad", "Fast, authentic creator ad with a hook, demo and CTA.", "UGC", "tiktok", "video", { mode: "ugc", durationSec: 15, tone: "friendly" }, true, 3980],
  ["New Product Reel", "Vertical reel with slow orbit and on-screen benefits.", "Social Media", "instagram", "reel", { mode: "video", durationSec: 10, camera: "Orbit", ratio: "9:16" }, true, 3120],
  ["Black Friday Campaign", "Urgent, high-contrast promo creatives across formats.", "E-commerce", "facebook", "carousel", { mode: "ads", platform: "facebook", format: "carousel", tone: "urgent" }, true, 2870],
  ["Clean Beauty Packshot", "Soft studio packshot on neutral tones for skincare.", "Beauty", "instagram", "image", { mode: "product-shoot", style: "Studio", ratio: "1:1" }, true, 2650],
  ["Fashion Lookbook Story", "Editorial story frames with typographic overlays.", "Fashion", "instagram", "story", { mode: "image", style: "Fashion", ratio: "9:16" }, false, 1540],
  ["Food Hero Shot", "Appetizing overhead with natural light and steam.", "Food", "instagram", "image", { mode: "image", style: "Food", ratio: "4:5" }, false, 1890],
  ["Tech Product Demo", "Clean product demo with macro details and specs.", "Technology", "youtube", "video", { mode: "video", durationSec: 15, camera: "Push in", ratio: "16:9" }, false, 1320],
  ["Listing Walkthrough Reel", "Real estate walkthrough with smooth tracking shots.", "Real Estate", "instagram", "reel", { mode: "video", durationSec: 15, camera: "Tracking", ratio: "9:16" }, false, 870],
  ["Gym Hype Short", "High-energy fitness short with punchy captions.", "Fitness", "youtube", "short", { mode: "video", durationSec: 10, camera: "Handheld", ratio: "9:16" }, false, 1210],
  ["Before & After Carousel", "Proof-driven carousel showing transformation.", "Beauty", "instagram", "carousel", { mode: "ads", platform: "instagram", format: "carousel", tone: "bold" }, true, 2230],
  ["Unboxing UGC", "Creator unboxing with first-impression reactions.", "UGC", "tiktok", "video", { mode: "ugc", durationSec: 15, tone: "friendly" }, false, 1760],
  ["Product on Marble", "Minimal luxury still life on stone.", "Product Ads", "pinterest", "image", { mode: "image", style: "Minimal", ratio: "3:2" }, false, 1440],
  ["Street Style Drop", "Urban lifestyle shots with motion and grit.", "Fashion", "instagram", "image", { mode: "image", style: "Street", ratio: "4:5" }, false, 980],
  ["Flash Sale Story", "24-hour promo story with countdown feel.", "E-commerce", "instagram", "story", { mode: "ads", platform: "instagram", format: "story", tone: "urgent" }, false, 1670],
  ["Coffee Ritual Reel", "Warm morning ritual reel with pour shots.", "Food", "tiktok", "reel", { mode: "video", durationSec: 10, camera: "Slow zoom", ratio: "9:16" }, false, 1130],
  ["App Feature Highlight", "Screen-in-hand demo for an app feature.", "Technology", "tiktok", "short", { mode: "video", durationSec: 10, camera: "Static", ratio: "9:16" }, false, 720],
  ["Open House Promo", "Bright, inviting property promo image set.", "Real Estate", "facebook", "image", { mode: "image", style: "Lifestyle", ratio: "16:9" }, false, 560],
  ["Trainer Testimonial", "UGC-style trainer endorsement with results.", "Fitness", "instagram", "video", { mode: "ugc", durationSec: 15, tone: "bold" }, false, 940],
  ["Search Ad Copy Pack", "Headline and description variations for Google.", "E-commerce", "google", "image", { mode: "copy", tone: "professional" }, false, 1310],
  ["Cinematic Product Film", "Ten-second cinematic film with pull-out reveal.", "Product Ads", "youtube", "video", { mode: "video", durationSec: 10, camera: "Pull out", ratio: "16:9" }, true, 2040],
  ["Skincare Routine GRWM", "Get-ready-with-me creator video with product moments.", "Beauty", "tiktok", "video", { mode: "ugc", durationSec: 15, tone: "friendly" }, true, 2580],
  ["Restaurant Menu Reel", "Dish-by-dish reel with quick cuts.", "Food", "instagram", "reel", { mode: "video", durationSec: 15, camera: "Handheld", ratio: "9:16" }, false, 690],
  ["Launch Announcement Post", "Bold announcement visual for a new drop.", "Social Media", "instagram", "image", { mode: "image", style: "Editorial", ratio: "1:1" }, false, 1480],
];

export const templates: Template[] = rows.map(([title, description, category, platform, format, preset, popular, uses], i) => ({
  id: `tpl_${i + 1}`,
  title, description, category, platform, format, preset, popular, uses,
  thumbnail: img(`template-${title}`, 800, 1000),
}));

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "Product Ads", "UGC", "Social Media", "E-commerce", "Fashion", "Beauty", "Food", "Technology", "Real Estate", "Fitness",
];
