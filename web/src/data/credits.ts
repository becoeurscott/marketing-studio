import type { CreditTransaction } from "@/lib/types";

/** Welcome credits for a new account (1 photo produit + 1 portrait); must match WELCOME_CREDITS in lib/account.ts. */
export const STARTING_CREDITS = 50;

export const creditTransactions: CreditTransaction[] = [
  { id: "tx_welcome", action: "bonus", amount: STARTING_CREDITS, description: "Crédits de bienvenue", createdAt: new Date(0).toISOString() },
];
