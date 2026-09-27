import type { CreditTransaction } from "@/lib/types";
import { daysAgo } from "@/lib/utils";

export const STARTING_CREDITS = 1250;

export const creditTransactions: CreditTransaction[] = [
  { id: "tx_1", action: "image", amount: -10, description: "Génération d'image — Pot de karité sur bogolan", createdAt: daysAgo(0, 9) },
  { id: "tx_2", action: "ads", amount: -20, description: "Variantes de pub — carrousel Facebook", createdAt: daysAgo(0, 8) },
  { id: "tx_3", action: "video", amount: -50, description: "Vidéo — rotation du pot 10 s", createdAt: daysAgo(1, 16) },
  { id: "tx_4", action: "copy", amount: -2, description: "Texte — statuts WhatsApp de la semaine", createdAt: daysAgo(1, 11) },
  { id: "tx_5", action: "upscale", amount: -15, description: "Upscale — packshot fin d'après-midi", createdAt: daysAgo(2, 14) },
  { id: "tx_6", action: "ugc", amount: -60, description: "UGC — routine du matin d'Aïcha", createdAt: daysAgo(3, 10) },
  { id: "tx_7", action: "product-shoot", amount: -30, description: "Shooting produit — savon noir, 6 décors", createdAt: daysAgo(4, 15) },
  { id: "tx_8", action: "image", amount: -10, description: "Génération d'image — attiéké poisson braisé", createdAt: daysAgo(5, 12) },
  { id: "tx_9", action: "purchase", amount: 1000, description: "Achat de 1 000 crédits", createdAt: daysAgo(7, 9) },
  { id: "tx_10", action: "video", amount: -50, description: "Vidéo — déballage téléphone 10 s", createdAt: daysAgo(8, 17) },
  { id: "tx_11", action: "image", amount: -10, description: "Génération d'image — coffret fête des mères", createdAt: daysAgo(9, 13) },
  { id: "tx_12", action: "bonus", amount: 500, description: "Crédits mensuels du plan Creator", createdAt: daysAgo(14, 0) },
];
