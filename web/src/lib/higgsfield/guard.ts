/** Per-instance abuse protection. Authentication and durable credits remain server enforced. */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_CLIENTS = 10_000;

export function createGuard(now: () => number = Date.now) {
  const hits = new Map<string, { start: number; count: number }>();
  return (request: Request, { limit }: { limit: number }): Response | null => {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        const supplied = new URL(origin);
        if (origin !== supplied.origin || supplied.origin !== new URL(request.url).origin) {
          return Response.json({ error: "Origine non autorisée." }, { status: 403 });
        }
      } catch {
        return Response.json({ error: "Origine non autorisée." }, { status: 403 });
      }
    }
    const time = now();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (hits.size >= MAX_CLIENTS) {
      for (const [key, entry] of hits) if (time - entry.start >= WINDOW_MS) hits.delete(key);
      if (!hits.has(ip) && hits.size >= MAX_CLIENTS) {
        return Response.json({ error: "Service occupé. Réessayez plus tard." }, { status: 429, headers: { "Retry-After": "60" } });
      }
    }
    const previous = hits.get(ip);
    const recent = previous && time - previous.start < WINDOW_MS ? previous : { start: time, count: 0 };
    const allowed = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 60;
    if (recent.count >= allowed) {
      const retry = Math.max(1, Math.ceil((WINDOW_MS - time + recent.start) / 1000));
      return Response.json({ error: "Trop de demandes cette heure-ci. Réessayez plus tard." }, { status: 429, headers: { "Retry-After": String(retry) } });
    }
    recent.count++;
    hits.set(ip, recent);
    return null;
  };
}

export const guard = createGuard();
