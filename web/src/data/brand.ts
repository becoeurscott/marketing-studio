import type { Brand } from "@/lib/types";

/** Starter brand kit, empty until the user fills it in (logo, colors, WhatsApp, voice). */
export const brands: Brand[] = [
  {
    id: "brand_main",
    name: "Ma marque",
    logoUrl: "",
    colors: ["#d1fe17", "#d1fe17", "#a6cf0c", "#0A0A0A"],
    fonts: { heading: "Inter", body: "Inter" },
    website: "",
    description: "",
    industry: "",
    audience: "",
    styleTags: [],
    assets: [],
    voice: { tone: "Friendly", writingStyle: "", keywords: [], avoid: [] },
    createdAt: new Date(0).toISOString(),
  },
];

export const brand = brands[0];
