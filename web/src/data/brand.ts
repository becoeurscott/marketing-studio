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
    description: "Des soins clean, fondés sur la science, pour la routine de tous les jours. Éclat à la vitamine C et protection de la barrière cutanée, sans complication.",
    industry: "Beauty",
    audience: "Femmes et hommes de 20 à 35 ans qui veulent une routine simple et efficace.",
    styleTags: ["Premium", "Clean", "Moderne", "Minimaliste"],
    assets: [
      { id: "ba_1", kind: "primary-logo", name: "Logotype Luma Skin", url: img("luma-wordmark", 800, 400) },
      { id: "ba_2", kind: "icon", name: "Icône Luma", url: img("luma-icon", 400, 400) },
      { id: "ba_3", kind: "product", name: "Sérum Luma Glow — hero", url: img("luma-serum-hero", 800, 1000) },
      { id: "ba_4", kind: "product", name: "Sérum Luma Glow — packshot", url: img("luma-serum-packshot", 800, 1000) },
    ],
    voice: {
      tone: "Professional",
      writingStyle: "Phrases courtes. Ton assuré. Jamais trop formel. Le bénéfice d'abord, puis la preuve.",
      keywords: ["éclat", "illuminateur", "quotidien", "clean", "vitamine C"],
      avoid: ["miracle", "anti-âge", "jargon clinique", "points d'exclamation"],
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
    description: "Des torréfactions en petites séries pour ceux qui prennent leurs matins au sérieux.",
    industry: "Food & Beverage",
    audience: "Actifs urbains de 25 à 45 ans.",
    styleTags: ["Chaleureux", "Artisanal", "Audacieux"],
    assets: [{ id: "ba_5", kind: "primary-logo", name: "Logo Urban Coffee", url: img("urban-coffee-wordmark", 800, 400) }],
    voice: { tone: "Friendly", writingStyle: "Chaleureux et direct. Une pointe d'esprit. Toujours centré sur le rituel.", keywords: ["torréfaction", "matin", "rituel"], avoid: ["corporate", "artificiel"] },
    createdAt: daysAgo(120),
  },
];

export const brand = brands[0];
