import type { Generation, GenerationType } from "@/lib/types";
import { daysAgo, img } from "@/lib/utils";

const prompts: Record<GenerationType, string[]> = {
  image: [
    "Pot de beurre de karité Karité d'Or sur un pagne bogolan, lumière de fin d'après-midi, ombres douces, photo produit premium",
    "Pot de karité entouré de noix de karité et de feuilles, lumineux et naturel, éclairage studio",
    "Packshot minimaliste sur fond ocre, vue du dessus, soin naturel",
    "Pot de karité et savon noir sur une étagère de salle de bain, plantes vertes, lumière naturelle",
    "Assiette d'attiéké poisson braisé avec piment et oignons, table de maquis, photo gourmande",
    "Smartphone posé sur un comptoir de boutique à Adjamé, affiche promo en fond, lumière nette",
    "Mannequin en tenue wax colorée dans une rue d'Abidjan, style éditorial mode",
    "Stand Karité d'Or au marché de Treichville, pots alignés, ambiance vivante",
    "Coffret fête des mères avec karité, savon noir et ruban doré dans un panier tressé",
    "Macro de la texture du beurre de karité sur une spatule en bois, fond dégradé orange",
  ],
  video: [
    "Rotation lente autour du pot de karité, 10 s, cinématique",
    "Travelling avant sur l'assiette d'attiéké poisson braisé, 5 s, publicitaire",
    "Routine du matin UGC avec Aïcha, 15 s, ton naturel",
    "Déballage d'un smartphone en boutique, 10 s, rythmé",
    "Défilé tenue wax caméra à l'épaule avec Fatou, 15 s",
    "Boucle texture du karité qui fond sur la main, 5 s, démo produit",
  ],
  copy: [
    "Cinq statuts WhatsApp pour le lancement du beurre de karité, ton amical",
    "Fiche catalogue WhatsApp Business du pot de karité 250 g, ton professionnel",
    "10 accroches pour vidéos témoignages TikTok, ton audacieux",
    "Message de relance clientes avec -20 % pour la Tabaski, ton urgent",
    "Note vocale de 20 s pour annoncer l'arrivage de savon noir, ton chaleureux",
    "Légende TikTok pour une vidéo de préparation, ton humoristique",
  ],
  ad: [
    "Pub carrousel Facebook, femmes 20–45 ans à Abidjan, pot à 7 500 FCFA, Commander sur WhatsApp",
    "Pub vidéo TikTok, découverte du karité pur, Écrire à la boutique",
    "Statut WhatsApp, relance réachat, Profiter de -20 %",
    "Pub vidéo Facebook, plat du jour Chez Tantie Rose, Commander",
    "Flyer boutique, coffrets fête des mères à 15 000 FCFA, Passer au stand",
  ],
};

const projectIds = ["proj_luma_summer", "proj_summer_skincare", "proj_urban_coffee", "proj_watch", "proj_fitness", "proj_ugc_ads", "proj_holiday", "proj_sunscreen"];
const statuses: Generation["status"][] = ["completed", "completed", "completed", "completed", "completed", "processing", "failed", "queued"];
const costs: Record<GenerationType, number> = { image: 10, video: 50, copy: 2, ad: 20 };

let n = 0;
function gen(type: GenerationType, prompt: string): Generation {
  n += 1;
  const count = type === "copy" ? 1 : type === "video" ? 1 : 4;
  return {
    id: `gen_${n}`,
    type,
    prompt,
    status: statuses[n % statuses.length],
    thumbnails: Array.from({ length: count }, (_, i) => img(`gen-${n}-${i}`, 800, 1000)),
    projectId: projectIds[n % projectIds.length],
    params: type === "image" ? { style: "Product Photography", ratio: "4:5" } : type === "video" ? { durationSec: 10, camera: "Orbit" } : type === "ad" ? { platform: "whatsapp" } : { tone: "friendly" },
    creditsUsed: costs[type] * (type === "image" ? 1 : 1),
    createdAt: daysAgo(Math.floor(n / 2), 7 + (n % 12)),
  };
}

export const generations: Generation[] = [
  ...prompts.image.map((p) => gen("image", p)),
  ...prompts.video.map((p) => gen("video", p)),
  ...prompts.copy.map((p) => gen("copy", p)),
  ...prompts.ad.map((p) => gen("ad", p)),
  ...prompts.image.slice(0, 5).map((p) => gen("image", p + ", variante B")),
].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
