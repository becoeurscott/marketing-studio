import type { CreditTransaction } from "@/lib/types";
import { daysAgo } from "@/lib/utils";

export const STARTING_CREDITS = 1250;

export const creditTransactions: CreditTransaction[] = [
  { id: "tx_1", action: "image", amount: -10, description: "Génération d'image — Sérum sur marbre", createdAt: daysAgo(0, 9) },
  { id: "tx_2", action: "ads", amount: -20, description: "Variantes de pub — carrousel Instagram", createdAt: daysAgo(0, 8) },
  { id: "tx_3", action: "video", amount: -50, description: "Vidéo — orbite lente 10 s", createdAt: daysAgo(1, 16) },
  { id: "tx_4", action: "copy", amount: -2, description: "Texte — légende Instagram", createdAt: daysAgo(1, 11) },
  { id: "tx_5", action: "upscale", amount: -15, description: "Upscale — packshot heure dorée", createdAt: daysAgo(2, 14) },
  { id: "tx_6", action: "ugc", amount: -60, description: "UGC — routine matinale de Maya", createdAt: daysAgo(3, 10) },
  { id: "tx_7", action: "product-shoot", amount: -30, description: "Shooting produit — flacon SPF, 6 décors", createdAt: daysAgo(4, 15) },
  { id: "tx_8", action: "image", amount: -10, description: "Génération d'image — versement de cold brew", createdAt: daysAgo(5, 12) },
  { id: "tx_9", action: "purchase", amount: 1000, description: "Achat de 1 000 crédits", createdAt: daysAgo(7, 9) },
  { id: "tx_10", action: "video", amount: -50, description: "Vidéo — révélation montre 10 s", createdAt: daysAgo(8, 17) },
  { id: "tx_11", action: "image", amount: -10, description: "Génération d'image — coffret cadeau vu du dessus", createdAt: daysAgo(9, 13) },
  { id: "tx_12", action: "bonus", amount: 500, description: "Crédits mensuels du plan Creator", createdAt: daysAgo(14, 0) },
];

export const creditPacks: { id: string; credits: number; price: number; bonus?: string }[] = [
  { id: "pack_500", credits: 500, price: 9 },
  { id: "pack_1500", credits: 1500, price: 24, bonus: "+10 % offerts" },
  { id: "pack_5000", credits: 5000, price: 69, bonus: "+20 % offerts" },
];
