import "server-only";
import { cookies } from "next/headers";
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

/** Current signed-in user, or null. Safe to call from Server Components and Server Actions. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const client = await serverClient();
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
