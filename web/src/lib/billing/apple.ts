import "server-only";
import { createSign } from "node:crypto";
import { adminClient } from "@/lib/insforge/admin";
import { uuidFor } from "./stripe";

/**
 * Apple in-app purchases (iOS). Credits are computed on Apple's net payout (price × 0.85 with the
 * App Store Small Business Program) at 10 FCFA per credit, so the 50 % margin on generations holds.
 * Transactions are never trusted from the app: we re-fetch them from the App Store Server API.
 */
export const APPLE_PRODUCTS: Record<string, { credits: number; kind: "pack" | "subscription"; label: string }> = {
  "com.sokozia.app.credits.99": { credits: 99, kind: "pack", label: "99 crédits" },
  "com.sokozia.app.credits.250": { credits: 250, kind: "pack", label: "250 crédits" },
  "com.sokozia.app.credits.501": { credits: 501, kind: "pack", label: "501 crédits" },
  "com.sokozia.app.credits.1002": { credits: 1002, kind: "pack", label: "1 002 crédits" },
  "com.sokozia.app.sub.starter": { credits: 500, kind: "subscription", label: "Starter · 500 crédits / mois" },
  "com.sokozia.app.sub.pro": { credits: 1253, kind: "subscription", label: "Pro · 1 253 crédits / mois" },
  "com.sokozia.app.sub.business": { credits: 3510, kind: "subscription", label: "Business · 3 510 crédits / mois" },
};

export const appleConfigured = () => !!(process.env.APPLE_ISSUER_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY);

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

/** App Store Server API token (ES256, 20 min). */
function apiToken(): string {
  const header = { alg: "ES256", kid: process.env.APPLE_KEY_ID, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: process.env.APPLE_ISSUER_ID, iat: now, exp: now + 1200, aud: "appstoreconnect-v1", bid: process.env.APPLE_BUNDLE_ID ?? "com.sokozia.app" };
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const key = (process.env.APPLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  const sig = createSign("SHA256").update(data).sign({ key, dsaEncoding: "ieee-p1363" });
  return `${data}.${b64url(sig)}`;
}

/** Decodes a JWS payload (only used on data we fetched from Apple ourselves, over TLS). */
export const jwsPayload = <T>(jws: string): T => JSON.parse(Buffer.from(jws.split(".")[1] ?? "", "base64url").toString("utf8")) as T;

export interface AppleTransaction {
  transactionId: string;
  originalTransactionId: string;
  bundleId: string;
  productId: string;
  appAccountToken?: string;
  revocationDate?: number;
  expiresDate?: number;
  environment: string;
}

/** Fetches a transaction from Apple (production first, then sandbox for TestFlight / review). */
export async function fetchTransaction(transactionId: string): Promise<AppleTransaction | null> {
  if (!/^\d{1,30}$/.test(transactionId)) return null;
  for (const host of ["https://api.storekit.itunes.apple.com", "https://api.storekit-sandbox.itunes.apple.com"]) {
    const res = await fetch(`${host}/inApps/v1/transactions/${transactionId}`, { headers: { Authorization: `Bearer ${apiToken()}` }, cache: "no-store" });
    if (res.status === 404) continue;
    if (!res.ok) throw new Error(`App Store ${res.status}`);
    const { signedTransactionInfo } = (await res.json()) as { signedTransactionInfo: string };
    return jwsPayload<AppleTransaction>(signedTransactionInfo);
  }
  return null;
}

/** Grants the credits of one verified transaction to its owner, exactly once. Returns the credits granted (0 if already done). */
export async function creditTransaction(tx: AppleTransaction, userId: string): Promise<number> {
  const product = APPLE_PRODUCTS[tx.productId];
  if (!product || tx.revocationDate) return 0;
  if (tx.bundleId !== (process.env.APPLE_BUNDLE_ID ?? "com.sokozia.app")) return 0;
  const db = adminClient().database;
  const id = uuidFor(`apple:${tx.transactionId}`);
  await db.from("ms_payments").upsert([{
    id, user_id: userId, pack_id: tx.productId, credits: product.credits, amount: 1, currency: "USD", country: "XX", amount_xof: product.credits * 10,
  }], { onConflict: "id", ignoreDuplicates: true });
  const { data, error } = await db.rpc("ms_complete_payment", { p_payment: id, p_provider: "apple", p_raw: { transactionId: tx.transactionId, env: tx.environment } });
  if (error) throw new Error(error.message);
  return data === true ? product.credits : 0;
}
