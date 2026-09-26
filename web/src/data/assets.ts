import type { Asset, AssetType } from "@/lib/types";
import { daysAgo, img } from "@/lib/utils";

const projectIds = [
  "proj_luma_summer", "proj_summer_skincare", "proj_urban_coffee", "proj_fitness",
  "proj_watch", "proj_ugc_ads", "proj_holiday", "proj_coldbrew_tiktok", "proj_founder_story", "proj_sunscreen",
];

const imageNames = [
  "Sérum hero — marbre", "Sérum sur serviette de plage", "Sérum et agrumes", "Nature morte étagère salle de bain",
  "Packshot heure dorée", "Packshot studio fond blanc", "Main tenant le sérum", "Macro goutte de sérum",
  "Routine matinale lifestyle", "Flatlay sur lin", "Photo studio néon", "Portrait éditorial avec produit",
  "Versement de cold brew", "Gros plan latte art", "Sachet de café sur comptoir", "Macro crema d'espresso",
  "Coureur à l'aube", "Plan salle de sport", "Sprint en flou de mouvement", "Couloir de piste vu du dessus",
  "Montre au poignet — manchette", "Macro cadran de montre", "Montre sur cuir", "Déballage de l'écrin",
  "Coffret cadeau vu du dessus", "Ruban et boîte", "Nature morte fenêtre enneigée", "Bougie et sérum",
  "Flacon SPF sur le sable", "Texture crème solaire", "Produit au bord de la piscine", "Lunettes de soleil et sérum",
];

const videoNames = [
  "UGC — Routine matinale de Maya", "UGC — Sac de sport de Jordan", "UGC — GRWM de Sofia", "UGC — Avis de Marcus",
  "Reel produit — orbite lente", "Reel produit — travelling avant", "Spot cold brew 15 s", "Histoire du fondateur — montage 1",
  "Histoire du fondateur — montage 2", "Montre cinématique 10 s", "Fitness énergique 9:16", "Boucle goutte de sérum",
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
const audio = ["Fond pop entraînant", "Boucle piano douce", "Matin lo-fi", "Montée cinématique"].map((n, i) => make(i + 200, "audio", n, { thumbnail: img(`audio-${i}`, 800, 800), url: img(`audio-${i}`, 800, 800) }));
const logos = ["Logotype Luma", "Icône Luma", "Logo Urban Coffee"].map((n, i) => make(i + 300, "logo", n, { projectId: null, thumbnail: img(`logo-${i}`, 800, 800) }));
const brandAssets = ["Palette de marque", "Spécimen typographique", "Gabarit d'emballage"].map((n, i) => make(i + 400, "brand", n, { projectId: null, thumbnail: img(`brand-${i}`, 800, 800) }));
const exportsList = ["Lancement été — carrousel IG.zip", "Pubs UGC — TikTok.mp4", "Présentation campagne.pdf", "Reel montre — 4K.mp4"].map((n, i) => make(i + 500, "export", n, { thumbnail: img(`export-${i}`, 800, 1000) }));

export const assets: Asset[] = [...images, ...videos, ...audio, ...logos, ...brandAssets, ...exportsList];
