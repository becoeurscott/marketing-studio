import type { Template, TemplateCategory, Platform, AdFormat, TemplatePreset } from "@/lib/types";
import { img } from "@/lib/utils";

type T = [string, string, TemplateCategory, Platform, AdFormat, TemplatePreset, boolean, number];

const rows: T[] = [
  ["Lancement produit de luxe", "Visuels hero de qualité éditoriale avec un éclairage dramatique pour un lancement premium.", "Product Ads", "instagram", "image", { mode: "image", style: "Luxury", ratio: "4:5", prompt: "Luxury product advertisement, dramatic side lighting, dark marble surface" }, true, 4210],
  ["Pub UGC de 15 secondes", "Pub créateur rapide et authentique avec accroche, démo et CTA.", "UGC", "tiktok", "video", { mode: "ugc", durationSec: 15, tone: "friendly" }, true, 3980],
  ["Reel nouveau produit", "Reel vertical en orbite lente avec bénéfices à l'écran.", "Social Media", "instagram", "reel", { mode: "video", durationSec: 10, camera: "Orbit", ratio: "9:16" }, true, 3120],
  ["Campagne Black Friday", "Créas promo urgentes et très contrastées, tous formats.", "E-commerce", "facebook", "carousel", { mode: "ads", platform: "facebook", format: "carousel", tone: "urgent" }, true, 2870],
  ["Packshot beauté clean", "Packshot studio doux sur tons neutres pour le soin de la peau.", "Beauty", "instagram", "image", { mode: "product-shoot", style: "Studio", ratio: "1:1" }, true, 2650],
  ["Story lookbook mode", "Écrans de story éditoriaux avec incrustations typographiques.", "Fashion", "instagram", "story", { mode: "image", style: "Fashion", ratio: "9:16" }, false, 1540],
  ["Photo hero culinaire", "Vue du dessus appétissante, lumière naturelle et vapeur.", "Food", "instagram", "image", { mode: "image", style: "Food", ratio: "4:5" }, false, 1890],
  ["Démo produit tech", "Démo produit épurée avec détails en macro et caractéristiques.", "Technology", "youtube", "video", { mode: "video", durationSec: 15, camera: "Push in", ratio: "16:9" }, false, 1320],
  ["Reel visite de bien", "Visite immobilière en plans de suivi fluides.", "Real Estate", "instagram", "reel", { mode: "video", durationSec: 15, camera: "Tracking", ratio: "9:16" }, false, 870],
  ["Short motivation salle de sport", "Short fitness plein d'énergie avec sous-titres percutants.", "Fitness", "youtube", "short", { mode: "video", durationSec: 10, camera: "Handheld", ratio: "9:16" }, false, 1210],
  ["Carrousel avant/après", "Carrousel axé sur la preuve qui montre la transformation.", "Beauty", "instagram", "carousel", { mode: "ads", platform: "instagram", format: "carousel", tone: "bold" }, true, 2230],
  ["Déballage UGC", "Déballage par un créateur avec ses premières impressions.", "UGC", "tiktok", "video", { mode: "ugc", durationSec: 15, tone: "friendly" }, false, 1760],
  ["Produit sur marbre", "Nature morte luxe et minimaliste sur pierre.", "Product Ads", "pinterest", "image", { mode: "image", style: "Minimal", ratio: "3:2" }, false, 1440],
  ["Lancement street style", "Photos lifestyle urbaines, en mouvement et brutes.", "Fashion", "instagram", "image", { mode: "image", style: "Street", ratio: "4:5" }, false, 980],
  ["Story vente flash", "Story promo de 24 h avec effet compte à rebours.", "E-commerce", "instagram", "story", { mode: "ads", platform: "instagram", format: "story", tone: "urgent" }, false, 1670],
  ["Reel rituel café", "Reel chaleureux du rituel matinal avec plans de versement.", "Food", "tiktok", "reel", { mode: "video", durationSec: 10, camera: "Slow zoom", ratio: "9:16" }, false, 1130],
  ["Focus fonctionnalité d'app", "Démo écran en main d'une fonctionnalité d'application.", "Technology", "tiktok", "short", { mode: "video", durationSec: 10, camera: "Static", ratio: "9:16" }, false, 720],
  ["Promo portes ouvertes", "Série d'images lumineuses et accueillantes pour un bien immobilier.", "Real Estate", "facebook", "image", { mode: "image", style: "Lifestyle", ratio: "16:9" }, false, 560],
  ["Témoignage de coach", "Recommandation d'un coach façon UGC, résultats à l'appui.", "Fitness", "instagram", "video", { mode: "ugc", durationSec: 15, tone: "bold" }, false, 940],
  ["Pack de textes pour annonces Search", "Variantes de titres et descriptions pour Google.", "E-commerce", "google", "image", { mode: "copy", tone: "professional" }, false, 1310],
  ["Film produit cinématique", "Film cinématique de dix secondes avec révélation en travelling arrière.", "Product Ads", "youtube", "video", { mode: "video", durationSec: 10, camera: "Pull out", ratio: "16:9" }, true, 2040],
  ["Routine skincare GRWM", "Vidéo créateur « get ready with me » avec moments produit.", "Beauty", "tiktok", "video", { mode: "ugc", durationSec: 15, tone: "friendly" }, true, 2580],
  ["Reel menu de restaurant", "Reel plat par plat avec coupes rapides.", "Food", "instagram", "reel", { mode: "video", durationSec: 15, camera: "Handheld", ratio: "9:16" }, false, 690],
  ["Post d'annonce de lancement", "Visuel d'annonce audacieux pour une nouveauté.", "Social Media", "instagram", "image", { mode: "image", style: "Editorial", ratio: "1:1" }, false, 1480],
];

export const templates: Template[] = rows.map(([title, description, category, platform, format, preset, popular, uses], i) => ({
  id: `tpl_${i + 1}`,
  title, description, category, platform, format, preset, popular, uses,
  thumbnail: img(`template-${title}`, 800, 1000),
}));

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "Product Ads", "UGC", "Social Media", "E-commerce", "Fashion", "Beauty", "Food", "Technology", "Real Estate", "Fitness",
];
