/**
 * French display labels for union values that are otherwise shown raw.
 * Keys are the logic values (never translate them); values are UI text.
 */
import type { AdFormat, Creator, GenerationType, ImageStyle, StudioMode, TemplateCategory, Tone } from "./types";

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  "Wax & Couture": "Couture & wax",
  Cosmetics: "Cosmétiques",
  Restaurant: "Restauration",
  Electronics: "Électronique",
  Hair: "Coiffure",
  Grocery: "Alimentation",
  WhatsApp: "WhatsApp",
  Print: "Flyers & affiches",
  UGC: "UGC",
  Promo: "Promos & fêtes",
};

export const AD_FORMAT_LABELS: Record<AdFormat, string> = {
  image: "Image",
  video: "Vidéo",
  carousel: "Carrousel",
  story: "Story",
  reel: "Reel",
  short: "Short",
  status: "Statut WhatsApp",
  catalog: "Fiche catalogue",
  flyer: "Flyer / affiche",
};

export const IMAGE_STYLE_LABELS: Record<ImageStyle, string> = {
  "Product Photography": "Photo produit",
  Luxury: "Luxe",
  Minimal: "Minimaliste",
  Street: "Street",
  Lifestyle: "Lifestyle",
  Editorial: "Éditorial",
  Cinematic: "Cinématique",
  UGC: "UGC",
  Studio: "Studio",
  Fashion: "Mode",
  Food: "Food",
  Tech: "Tech",
};

export const TONE_LABELS: Record<Tone, string> = {
  professional: "Professionnel",
  friendly: "Chaleureux",
  luxury: "Luxe",
  bold: "Audacieux",
  funny: "Drôle",
  minimal: "Minimaliste",
  urgent: "Urgent",
};

export const GENDER_LABELS: Record<Creator["gender"], string> = {
  female: "Femme",
  male: "Homme",
  "non-binary": "Non binaire",
};

export const STUDIO_MODE_LABELS: Record<StudioMode, string> = {
  image: "Générateur d’images",
  video: "Générateur de vidéos",
  ugc: "Créateur UGC",
  "product-shoot": "Shooting produit IA",
  ads: "Créateur d’annonces",
  copy: "Rédacteur IA",
};

export const GENERATION_TYPE_LABELS: Record<GenerationType, string> = {
  image: "Image",
  video: "Vidéo",
  copy: "Texte",
  ad: "Annonce",
};

/** Look up a label, falling back to the raw value. */
export function labelOf<K extends string>(map: Partial<Record<K, string>>, value: K | string | undefined | null): string {
  if (!value) return "";
  return (map as Record<string, string>)[value] ?? value;
}
