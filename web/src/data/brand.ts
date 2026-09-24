import type { Brand } from "@/lib/types";
import { daysAgo, img } from "@/lib/utils";

export const brands: Brand[] = [
  {
    id: "brand_luma",
    name: "Luma Skin",
    logoUrl: img("luma-logo", 400, 400),
    colors: ["#F5E9E2", "#C99A7A", "#1C1C1C", "#FFFFFF", "#A855F7"],
    fonts: { heading: "Inter", body: "Inter" },
    website: "https://lumaskin.example",
    description: "Clean, science-backed skincare for everyday routines. Vitamin C brightening and barrier support without the fuss.",
    industry: "Beauty",
    audience: "Women and men 20–35 who want a simple, effective routine.",
    styleTags: ["Premium", "Clean", "Modern", "Minimal"],
    assets: [
      { id: "ba_1", kind: "primary-logo", name: "Luma Skin wordmark", url: img("luma-wordmark", 800, 400) },
      { id: "ba_2", kind: "icon", name: "Luma icon", url: img("luma-icon", 400, 400) },
      { id: "ba_3", kind: "product", name: "Luma Glow Serum — hero", url: img("luma-serum-hero", 800, 1000) },
      { id: "ba_4", kind: "product", name: "Luma Glow Serum — packshot", url: img("luma-serum-packshot", 800, 1000) },
    ],
    voice: {
      tone: "Professional",
      writingStyle: "Short sentences. Confident. Never overly formal. Lead with the benefit, then the proof.",
      keywords: ["glow", "brightening", "everyday", "clean", "vitamin C"],
      avoid: ["miracle", "anti-aging", "clinical jargon", "exclamation marks"],
    },
    createdAt: daysAgo(180),
  },
  {
    id: "brand_urban",
    name: "Urban Coffee Co.",
    logoUrl: img("urban-coffee-logo", 400, 400),
    colors: ["#2B1D14", "#D9A066", "#F4EDE4", "#0F0F0F"],
    fonts: { heading: "Inter", body: "Inter" },
    website: "https://urbancoffee.example",
    description: "Small-batch roasts for people who take mornings seriously.",
    industry: "Food & Beverage",
    audience: "Urban professionals 25–45.",
    styleTags: ["Warm", "Craft", "Bold"],
    assets: [{ id: "ba_5", kind: "primary-logo", name: "Urban Coffee logo", url: img("urban-coffee-wordmark", 800, 400) }],
    voice: { tone: "Friendly", writingStyle: "Warm and direct. A little wit. Always about the ritual.", keywords: ["roast", "morning", "ritual"], avoid: ["corporate", "artificial"] },
    createdAt: daysAgo(120),
  },
];

export const brand = brands[0];
