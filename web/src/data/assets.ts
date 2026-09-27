import type { Asset, AssetType } from "@/lib/types";
import { daysAgo, img } from "@/lib/utils";

const projectIds = [
  "proj_luma_summer", "proj_summer_skincare", "proj_urban_coffee", "proj_fitness",
  "proj_watch", "proj_ugc_ads", "proj_holiday", "proj_coldbrew_tiktok", "proj_founder_story", "proj_sunscreen",
];

const imageNames = [
  "Pot de karité — pagne bogolan", "Pot de karité au soleil", "Karité et noix de karité", "Étagère salle de bain, pot et savon noir",
  "Packshot fin d'après-midi", "Packshot studio fond blanc", "Main qui prend le karité", "Macro texture du beurre",
  "Routine du matin lifestyle", "Flatlay sur pagne wax", "Photo studio fond ocre", "Portrait de cliente avec le pot",
  "Attiéké poisson braisé", "Alloco bien doré", "Poulet braisé et piment", "Jus de bissap en bouteille",
  "Pagne wax plié en boutique", "Mannequin en tenue wax", "Rouleaux de wax colorés", "Vitrine tissus vue du dessus",
  "Smartphone en main — marché", "Macro écran de téléphone", "Téléphones sur comptoir", "Déballage d'un téléphone",
  "Coffret fête des mères vu du dessus", "Ruban et panier tressé", "Coffret sur table en bois", "Savon noir et bougie",
  "Stand au marché de Treichville", "Texture du savon noir", "Pot de karité au bord de la lagune", "Karité et huile de coco",
];

const videoNames = [
  "UGC — Routine du matin d'Aïcha", "UGC — Avis de Kofi sur le savon noir", "UGC — Préparation de Fatou", "UGC — Test de Moussa",
  "Vidéo produit — rotation du pot", "Vidéo produit — travelling avant", "Spot attiéké 15 s", "Histoire de la fondatrice — montage 1",
  "Histoire de la fondatrice — montage 2", "Arrivage téléphones 10 s", "Défilé wax 9:16", "Boucle texture karité",
];

function make(i: number, type: AssetType, name: string, opts: Partial<Asset> = {}): Asset {
  const seed = `${type}-${i}-${name}`;
  const projectId = projectIds[i % projectIds.length];
  const isVideo = type === "video";
  const isAudio = type === "audio";
  return {
    id: `asset_${type}_${i}`,
    name,
    type,
    url: img(seed, 1200, 1500),
    thumbnail: img(seed, 800, 1000),
    projectId,
    favorite: i % 7 === 0,
    width: isAudio ? undefined : isVideo ? 1080 : 1600,
    height: isAudio ? undefined : isVideo ? 1920 : 2000,
    durationSec: isVideo ? [5, 10, 15][i % 3] : isAudio ? 30 + (i % 4) * 15 : undefined,
    sizeKb: isVideo ? 4200 + i * 310 : isAudio ? 900 + i * 40 : 420 + i * 37,
    tags: [type, projectId.replace("proj_", "").split("_")[0]],
    createdAt: daysAgo(i % 21, 8 + (i % 10)),
    ...opts,
  };
}

const images = imageNames.map((n, i) => make(i, "image", n));
const videos = videoNames.map((n, i) => make(i + 100, "video", n));
const audio = ["Afrobeat entraînant", "Boucle kora douce", "Coupé-décalé festif", "Montée percussions"].map((n, i) => make(i + 200, "audio", n, { thumbnail: img(`audio-${i}`, 800, 800), url: img(`audio-${i}`, 800, 800) }));
const logos = ["Logotype Karité d'Or", "Icône Karité d'Or", "Logo Chez Tantie Rose"].map((n, i) => make(i + 300, "logo", n, { projectId: null, thumbnail: img(`logo-${i}`, 800, 800) }));
const brandAssets = ["Palette de marque", "Spécimen typographique", "Gabarit d'emballage"].map((n, i) => make(i + 400, "brand", n, { projectId: null, thumbnail: img(`brand-${i}`, 800, 800) }));
const exportsList = ["Lancement karité — statuts WhatsApp.zip", "Témoignages — TikTok.mp4", "Flyer marché Treichville.pdf", "Arrivage téléphones — HD.mp4"].map((n, i) => make(i + 500, "export", n, { thumbnail: img(`export-${i}`, 800, 1000) }));

export const assets: Asset[] = [...images, ...videos, ...audio, ...logos, ...brandAssets, ...exportsList];
