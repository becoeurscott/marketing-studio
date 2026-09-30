import type { Template, TemplateCategory, Platform, AdFormat, TemplatePreset } from "@/lib/types";
import { img } from "@/lib/utils";

type T = [string, string, TemplateCategory, Platform, AdFormat, TemplatePreset, boolean, number];

/** Sector templates for local merchants. Ids are referenced by the promo calendar (lib/market.ts). */
const rows: T[] = [
  ["Boubou de Tabaski", "Tenue de fête portée par un mannequin, fond cour familiale, lumière de fin d'après-midi.", "Wax & Couture", "whatsapp", "status", { mode: "image", style: "Fashion", ratio: "9:16", prompt: "Model wearing an embroidered bazin boubou, festive family courtyard, warm late afternoon light" }, true, 4210],
  ["Nouvel arrivage de perruques", "Vidéo UGC d'une créatrice qui essaie trois perruques et donne le prix.", "Hair", "tiktok", "video", { mode: "ugc", durationSec: 15, tone: "friendly", language: "fr" }, true, 3980],
  ["Rentrée : téléphones et tablettes", "Reel produit rythmé avec prix et facilités de paiement à l'écran.", "Electronics", "facebook", "reel", { mode: "video", durationSec: 10, camera: "Orbit", ratio: "9:16" }, true, 3120],
  ["Fiche catalogue pagne wax", "Photo produit nette sur fond clair, prête pour le catalogue WhatsApp Business.", "Wax & Couture", "whatsapp", "catalog", { mode: "product-shoot", style: "Studio", ratio: "1:1" }, true, 2870],
  ["Beurre de karité naturel", "Packshot doux sur bois et noix de karité, lumière naturelle.", "Cosmetics", "instagram", "image", { mode: "product-shoot", style: "Studio", ratio: "1:1" }, true, 2650],
  ["Menu du maquis", "Plat vu du dessus, poisson braisé et attiéké, vapeur et lumière chaude.", "Restaurant", "whatsapp", "status", { mode: "image", style: "Food", ratio: "9:16", prompt: "Top-down braised fish with attieke and chili, warm maquis lighting, steam" }, true, 2540],
  ["Coffret fête des mères", "Visuel cadeau avec ruban et message, pour cosmétiques et bijoux.", "Cosmetics", "facebook", "image", { mode: "image", style: "Lifestyle", ratio: "4:5" }, false, 1890],
  ["Boutique de téléphones", "Vitrine de smartphones avec prix en FCFA et bouton Commander sur WhatsApp.", "Electronics", "whatsapp", "status", { mode: "ads", platform: "whatsapp", format: "status", tone: "bold" }, false, 1820],
  ["Promo Tabaski : électroménager", "Carrousel promo pour congélateurs, ventilateurs et télés.", "Promo", "facebook", "carousel", { mode: "ads", platform: "facebook", format: "carousel", tone: "urgent" }, true, 2230],
  ["Affiche promo de fin d'année", "Affiche A4 imprimable pour la vitrine ou l'étal au marché.", "Print", "facebook", "flyer", { mode: "ads", platform: "facebook", format: "flyer", tone: "urgent" }, false, 1540],
  ["Dattes et jus du Ramadan", "Visuel chaleureux pour la rupture du jeûne : dattes, bissap, gingembre.", "Grocery", "whatsapp", "status", { mode: "image", style: "Food", ratio: "9:16" }, false, 1760],
  ["Tresses et coiffures de fête", "Avant/après en carrousel pour un salon de coiffure.", "Hair", "instagram", "carousel", { mode: "ads", platform: "instagram", format: "carousel", tone: "bold" }, false, 1670],
  ["Note vocale promo", "Message vocal de 20 secondes à transférer dans vos groupes WhatsApp.", "WhatsApp", "whatsapp", "status", { mode: "copy", tone: "friendly" }, true, 2100],
  ["Lookbook tailleur sur mesure", "Série de tenues en pagne portées en extérieur, style street.", "Wax & Couture", "instagram", "image", { mode: "image", style: "Street", ratio: "4:5" }, false, 980],
  ["Savon et huiles naturelles", "Vidéo UGC : routine peau avec des produits locaux.", "Cosmetics", "tiktok", "video", { mode: "ugc", durationSec: 15, tone: "friendly" }, false, 1440],
  ["Plat du jour en vidéo", "Reel court du plat en préparation, prix et adresse à la fin.", "Restaurant", "tiktok", "reel", { mode: "video", durationSec: 10, camera: "Handheld", ratio: "9:16" }, false, 1130],
  ["Flyer ouverture de boutique", "Flyer A5 à distribuer dans le quartier, avec plan et numéro WhatsApp.", "Print", "facebook", "flyer", { mode: "ads", platform: "facebook", format: "flyer", tone: "friendly" }, false, 720],
  ["Sacs de riz et huile en gros", "Visuel prix de gros pour commerçants et revendeurs.", "Grocery", "facebook", "image", { mode: "image", style: "Product Photography", ratio: "1:1" }, false, 560],
  ["Témoignage cliente", "Une cliente raconte son achat, façon vidéo UGC, en français ou en langue locale.", "UGC", "facebook", "video", { mode: "ugc", durationSec: 15, tone: "friendly" }, false, 940],
  ["Textes de statut WhatsApp", "Cinq messages courts pour vos statuts de la semaine.", "WhatsApp", "whatsapp", "status", { mode: "copy", tone: "friendly" }, false, 1310],
  ["Accessoires téléphone", "Film produit sur écouteurs, chargeurs et coques, révélation en travelling.", "Electronics", "tiktok", "video", { mode: "video", durationSec: 10, camera: "Pull out", ratio: "9:16" }, false, 1040],
  ["Démo UGC cosmétique", "Créatrice qui applique le produit et montre le résultat.", "Cosmetics", "tiktok", "video", { mode: "ugc", durationSec: 15, tone: "friendly" }, true, 2580],
  ["Livraison de repas", "Story promo livraison avec numéro WhatsApp et zones desservies.", "Restaurant", "instagram", "story", { mode: "ads", platform: "instagram", format: "story", tone: "urgent" }, false, 690],
  ["Tenues de Korité", "Visuel d'annonce pour les commandes de tenues avant la fête.", "Promo", "whatsapp", "status", { mode: "image", style: "Fashion", ratio: "9:16" }, false, 1480],
];

export const templates: Template[] = rows.map(([title, description, category, platform, format, preset, popular, uses], i) => ({
  id: `tpl_${i + 1}`,
  title, description, category, platform, format, preset, popular, uses,
  thumbnail: img(`template-${title}`, 800, 1000, title.split(" ").slice(0, 3).join(" ")),
}));

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "Wax & Couture", "Cosmetics", "Restaurant", "Electronics", "Hair", "Grocery", "WhatsApp", "Print", "UGC", "Promo",
];
