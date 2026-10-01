import "server-only";
import { createAdminClient } from "@insforge/sdk";

/** Full-access InsForge client. Server code only (INSFORGE_API_KEY is an admin key). */
export function adminClient() {
  const apiKey = process.env.INSFORGE_API_KEY;
  if (!apiKey) throw new Error("INSFORGE_API_KEY manquante côté serveur.");
  return createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey });
}

/** Public bucket for generated media and uploads (random paths per user). */
export const MEDIA_BUCKET = "ms-media";
