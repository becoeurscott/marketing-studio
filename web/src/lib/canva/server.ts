import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export class CanvaError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const SESSION = "ms_canva";
export const FLOW = "ms_canva_flow";
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/api/canva" };
export function configured() {
  return Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET && process.env.CANVA_REDIRECT_URI && /^[a-f0-9]{64}$/i.test(process.env.CANVA_COOKIE_KEY ?? ""));
}
function key() {
  if (!configured()) throw new CanvaError("La connexion Canva n’est pas encore configurée.", 503);
  return Buffer.from(process.env.CANVA_COOKIE_KEY!, "hex");
}
export function seal(value: object) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}
export function unseal<T>(value?: string): T | null {
  if (!value) return null;
  try {
    const bytes = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString()) as T;
  } catch { return null; }
}
interface Tokens { userId: string; access: string; refresh: string; expires: number }
export async function session(userId: string) {
  const value = unseal<Tokens>((await cookies()).get(SESSION)?.value);
  return value?.userId === userId ? value : null;
}
export async function exchange(params: Record<string, string>) {
  key();
  const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Basic ${Buffer.from(`${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  if (!response.ok) throw new CanvaError("Reconnectez votre compte Canva.", 401);
  return await response.json() as { access_token: string; refresh_token: string; expires_in: number };
}
export async function storeTokens(userId: string, token: Awaited<ReturnType<typeof exchange>>) {
  const value = seal({ userId, access: token.access_token, refresh: token.refresh_token, expires: Date.now() + token.expires_in * 1000 });
  if (value.length > 3800) throw new CanvaError("Connexion Canva trop volumineuse.", 503);
  (await cookies()).set(SESSION, value, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
  return token.access_token;
}
export async function accessToken(userId: string) {
  const current = await session(userId);
  if (!current) throw new CanvaError("Connectez votre compte Canva.", 401);
  if (current.expires > Date.now() + 60000) return current.access;
  return storeTokens(userId, await exchange({ grant_type: "refresh_token", refresh_token: current.refresh }));
}
export async function canva<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.canva.com/rest/v1${path}`, {
    ...init, cache: "no-store", signal: AbortSignal.timeout(25000),
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    if (response.status === 401) throw new CanvaError("Reconnectez votre compte Canva.", 401);
    if (response.status === 403) throw new CanvaError("Vérifiez votre forfait Canva et l’accès à ce modèle.", 403);
    if (response.status === 429) throw new CanvaError("Canva est occupé. Réessayez dans une minute.", 429);
    throw new CanvaError("Canva n’a pas pu traiter cette demande. Vérifiez les champs du modèle.", 502);
  }
  return response.json() as Promise<T>;
}
export interface Job { id: string; status: "in_progress" | "success" | "failed"; asset?: { id: string }; result?: { design: { id: string; urls?: { edit_url?: string } } }; urls?: string[] }
export function ticket(userId: string, kind: string, id: string) { return seal({ userId, kind, id, expires: Date.now() + 3600000 }); }
export function readTicket(value: string, userId: string, kind: string) {
  const data = unseal<{ userId: string; kind: string; id: string; expires: number }>(value);
  if (!data || data.userId !== userId || data.kind !== kind || data.expires < Date.now()) throw new CanvaError("Cette opération a expiré. Recommencez.");
  return encodeURIComponent(data.id);
}
export function allowedTemplate(id: string) {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) throw new CanvaError("Modèle invalide.");
  const curated = (process.env.CANVA_TEMPLATE_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
  if (curated.length && !curated.includes(id)) throw new CanvaError("Modèle indisponible.", 403);
}
export function failure(error: unknown) {
  return Response.json({ error: error instanceof CanvaError ? error.message : "Canva est indisponible. Réessayez." }, { status: error instanceof CanvaError ? error.status : 503 });
}
