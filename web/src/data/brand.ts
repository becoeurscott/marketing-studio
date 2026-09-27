import type { Brand } from "@/lib/types";
import { daysAgo, img } from "@/lib/utils";

export const brands: Brand[] = [
  {
    id: "brand_luma",
    name: "Karité d'Or",
    logoUrl: img("karite-dor-logo", 400, 400),
    colors: ["#F6EBDD", "#C8872E", "#5A3A22", "#FFFFFF", "#E4572E"],
    fonts: { heading: "Inter", body: "Inter" },
    website: "https://karitedor.example",
    description: "Soins naturels faits à Abidjan : beurre de karité pur, savon noir et huiles pour le corps et les cheveux. Des produits simples, fabriqués avec des coopératives de femmes du nord de la Côte d'Ivoire.",
    industry: "Beauty",
    audience: "Femmes de 20 à 45 ans à Abidjan, Dakar et Douala qui veulent des soins naturels, efficaces et à bon prix pour la peau et les cheveux.",
    styleTags: ["Naturel", "Chaleureux", "Authentique", "Fait en Afrique"],
    assets: [
      { id: "ba_1", kind: "primary-logo", name: "Logotype Karité d'Or", url: img("karite-dor-wordmark", 800, 400) },
      { id: "ba_2", kind: "icon", name: "Icône Karité d'Or", url: img("karite-dor-icon", 400, 400) },
      { id: "ba_3", kind: "product", name: "Beurre de karité pur — pot hero", url: img("karite-pot-hero", 800, 1000) },
      { id: "ba_4", kind: "product", name: "Savon noir au karité — packshot", url: img("savon-noir-packshot", 800, 1000) },
    ],
    voice: {
      tone: "Friendly",
      writingStyle: "Phrases courtes, ton proche comme une grande sœur. On parle du résultat d'abord, puis de l'origine naturelle. Tutoiement possible sur WhatsApp et TikTok.",
      keywords: ["naturel", "karité pur", "peau douce", "fait à Abidjan", "cheveux nourris", "prix doux"],
      avoid: ["éclaircissant", "miracle", "produits chimiques agressifs", "promesses médicales"],
    },
    createdAt: daysAgo(180),
  },
  {
    id: "brand_urban",
    name: "Chez Tantie Rose",
    logoUrl: img("tantie-rose-logo", 400, 400),
    colors: ["#7A2E12", "#F2A33A", "#FFF4E3", "#1E7A46"],
    fonts: { heading: "Inter", body: "Inter" },
    website: "https://cheztantierose.example",
    description: "Maquis familial à Cocody : attiéké poisson braisé, alloco, poulet braisé et jus de bissap maison. Sur place, à emporter et en livraison.",
    industry: "Food & Beverage",
    audience: "Travailleurs et familles d'Abidjan de 20 à 50 ans qui commandent le midi ou le week-end.",
    styleTags: ["Chaleureux", "Gourmand", "Populaire", "Coloré"],
    assets: [{ id: "ba_5", kind: "primary-logo", name: "Logo Chez Tantie Rose", url: img("tantie-rose-wordmark", 800, 400) }],
    voice: { tone: "Friendly", writingStyle: "Chaleureux, gourmand et direct. Un peu de nouchi quand ça passe. On donne envie, puis le prix et le numéro WhatsApp.", keywords: ["braisé", "fait maison", "garba du chef", "livraison", "bissap"], avoid: ["réchauffé", "fast-food", "prix cachés"] },
    createdAt: daysAgo(120),
  },
];

export const brand = brands[0];
