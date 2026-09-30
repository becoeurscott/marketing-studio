import "server-only";

/**
 * Minimal abuse guard for the generation routes (there are no user accounts yet):
 * same-origin requests only, plus a per-IP hourly limit. The limit is per server instance,
 * so it slows abuse down but is not a substitute for real authentication.
 */
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

export function guard(request: Request, { limit }: { limit: number }): Response | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return Response.json({ error: "Origine non autorisée." }, { status: 403 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    return Response.json({ error: "Trop de générations cette heure-ci. Réessayez plus tard." }, { status: 429 });
  }
  recent.push(now);
  hits.set(ip, recent);
  return null;
}
