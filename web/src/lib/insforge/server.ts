import "server-only";
import { cookies, headers } from "next/headers";
import { createClient } from "@insforge/sdk";
import { createServerClient } from "@insforge/sdk/ssr";

/** Per-request InsForge client (reads the auth cookies). */
export async function serverClient() {
  return createServerClient({ cookies: await cookies() });
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Current signed-in user, or null. Safe to call from Server Components and Server Actions.
 * The web app authenticates with httpOnly cookies; the iOS app sends `Authorization: Bearer <access token>`.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const bearer = (await headers()).get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const client = bearer
    ? createClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY, accessToken: bearer })
    : await serverClient();
  const { data } = await client.auth.getCurrentUser();
  const user = data?.user as { id: string; email: string; profile?: { name?: string } } | null | undefined;
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.profile?.name ?? "" };
}

/** Only allow internal redirects ("/studio", not "//evil.com" or "https://…"). */
export function safeNext(next: unknown, fallback = "/home"): string {
  const n = typeof next === "string" ? next : "";
  return /^\/(?![/\\])/.test(n) ? n : fallback;
}
