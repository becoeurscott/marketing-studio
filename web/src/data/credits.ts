import type { CreditTransaction } from "@/lib/types";
import { daysAgo } from "@/lib/utils";

export const STARTING_CREDITS = 1250;

export const creditTransactions: CreditTransaction[] = [
  { id: "tx_1", action: "image", amount: -10, description: "Image generation — Serum on marble", createdAt: daysAgo(0, 9) },
  { id: "tx_2", action: "ads", amount: -20, description: "Ad variations — Instagram carousel", createdAt: daysAgo(0, 8) },
  { id: "tx_3", action: "video", amount: -50, description: "Video — Slow orbit 10s", createdAt: daysAgo(1, 16) },
  { id: "tx_4", action: "copy", amount: -2, description: "Copy — Instagram caption", createdAt: daysAgo(1, 11) },
  { id: "tx_5", action: "upscale", amount: -15, description: "Upscale — Golden hour packshot", createdAt: daysAgo(2, 14) },
  { id: "tx_6", action: "ugc", amount: -60, description: "UGC — Maya morning routine", createdAt: daysAgo(3, 10) },
  { id: "tx_7", action: "product-shoot", amount: -30, description: "Product shoot — SPF bottle, 6 environments", createdAt: daysAgo(4, 15) },
  { id: "tx_8", action: "image", amount: -10, description: "Image generation — Cold brew pour", createdAt: daysAgo(5, 12) },
  { id: "tx_9", action: "purchase", amount: 1000, description: "Purchased 1,000 credits", createdAt: daysAgo(7, 9) },
  { id: "tx_10", action: "video", amount: -50, description: "Video — Watch reveal 10s", createdAt: daysAgo(8, 17) },
  { id: "tx_11", action: "image", amount: -10, description: "Image generation — Gift set overhead", createdAt: daysAgo(9, 13) },
  { id: "tx_12", action: "bonus", amount: 500, description: "Creator plan monthly credits", createdAt: daysAgo(14, 0) },
];

export const creditPacks: { id: string; credits: number; price: number; bonus?: string }[] = [
  { id: "pack_500", credits: 500, price: 9 },
  { id: "pack_1500", credits: 1500, price: 24, bonus: "+10%" },
  { id: "pack_5000", credits: 5000, price: 69, bonus: "+20%" },
];
