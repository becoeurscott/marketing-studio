import type { Generation, GenerationType } from "@/lib/types";
import { daysAgo, img } from "@/lib/utils";

const prompts: Record<GenerationType, string[]> = {
  image: [
    "Sérum Luma Glow sur une surface en marbre, lumière d'heure dorée, ombres douces, photographie produit de luxe",
    "Flacon de sérum avec tranches d'agrumes et gouttelettes d'eau, lumineux et frais, éclairage studio",
    "Packshot minimaliste sur lin beige, vue du dessus, skincare éditorial",
    "Sérum sur une étagère de salle de bain moderne avec eucalyptus, lumière naturelle",
    "Bouteille de cold brew perlée sur une table de café ensoleillée, lifestyle",
    "Montre de luxe sur cuir sombre, macro du cadran, contre-jour dramatique",
    "Coureur en pleine foulée à l'aube, flou de mouvement, fitness cinématique",
    "Flacon SPF sur sable mouillé avec écume, été lumineux",
    "Coffret cadeau des fêtes avec ruban sur un rebord de fenêtre enneigé",
    "Macro d'une goutte de sérum sur verre, fond en dégradé violet",
  ],
  video: [
    "Orbite lente autour du flacon de sérum, 10 s, cinématique",
    "Travelling avant sur le versement de cold brew, 5 s, publicitaire",
    "Routine matinale UGC avec Maya, 15 s, ton décontracté",
    "Révélation de la montre en travelling arrière, 10 s, luxe",
    "Déballage du sac de sport caméra à l'épaule avec Jordan, 15 s",
    "Boucle goutte de sérum, 5 s, démo produit",
  ],
  copy: [
    "Légende Instagram pour le lancement d'été, ton amical",
    "Description produit du sérum Luma Glow, ton professionnel",
    "10 accroches pour UGC TikTok, ton audacieux",
    "E-mail de lancement annonçant -20 %, ton urgent",
    "Texte hero de landing page, ton minimaliste",
    "Légende TikTok pour une vidéo GRWM, ton humoristique",
  ],
  ad: [
    "Pub carrousel Instagram, femmes 20–35 ans, offre de lancement -20 %, Acheter",
    "Pub vidéo TikTok, débutants en skincare, Essayer aujourd'hui",
    "Pub image Facebook, rappel de réachat, Profiter de -20 %",
    "Pub YouTube Short, lancement du cold brew, En savoir plus",
    "Pub image Pinterest, coffrets cadeaux, Voir les cadeaux",
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
    params: type === "image" ? { style: "Luxury", ratio: "4:5" } : type === "video" ? { durationSec: 10, camera: "Orbit" } : type === "ad" ? { platform: "instagram" } : { tone: "friendly" },
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
