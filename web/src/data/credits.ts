import type { CreditTransaction } from "@/lib/types";

/** Welcome credits for a new account (≈ 10 images). */
export const STARTING_CREDITS = 100;

export const creditTransactions: CreditTransaction[] = [
  { id: "tx_welcome", action: "bonus", amount: STARTING_CREDITS, description: "Crédits de bienvenue", createdAt: new Date(0).toISOString() },
];
