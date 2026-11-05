import { guard } from "@/lib/higgsfield/guard";
import { adminClient } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";

/**
 * Video templates: the app detects the cuts on the phone and sends one small keyframe per shot.
 * We describe each shot (what to film) and read its on-screen text so the user can refilm the
 * same edit with their own clips. Free for the user (a few cheap image tokens).
 */
const MODEL = "google/gemini-2.5-flash";
const MAX_SHOTS = 30;
const MAX_FRAME_CHARS = 400_000; // ~300 KB of base64 per keyframe

interface Body {
  language?: "fr" | "en";
  shots?: { duration?: number; frame?: string }[];
}

export interface ShotDescription { description: string; overlay: string | null; framing: string }
export interface TemplateDescription { name: string; style: string; shots: ShotDescription[] }

export async function POST(request: Request) {
  const blocked = guard(request, { limit: 20 });
  if (blocked) return blocked;
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous pour créer un modèle." }, { status: 401 });

  let body: Body;
  try { body = (await request.json()) as Body; } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const shots = (Array.isArray(body.shots) ? body.shots : []).slice(0, MAX_SHOTS).map((s) => ({
    duration: Math.max(0.1, Math.min(60, Number(s.duration) || 1)),
    frame: typeof s.frame === "string" && /^[A-Za-z0-9+/=]+$/.test(s.frame) && s.frame.length < MAX_FRAME_CHARS ? s.frame : null,
  }));
  if (!shots.length || shots.some((s) => !s.frame)) return Response.json({ error: "Images des plans manquantes." }, { status: 400 });
  const en = body.language === "en";

  const instructions =
    `These are keyframes, one per shot, of a short social media video (TikTok/Reels), in order. Shot durations in seconds: ${shots.map((s) => s.duration.toFixed(1)).join(", ")}. ` +
    `For each shot, tell a small merchant what to film to recreate the same edit with their own product: a short instruction (max 10 words), ` +
    `the exact on-screen text if any (null if none), and the framing (one of: close-up, medium, wide, selfie, hands, product). ` +
    `Also give the template a short catchy name (max 4 words) and describe the overall style in one sentence. ` +
    `Write ${en ? "in English" : "in French"}. Do not mention brands or people's identity. ` +
    `Reply ONLY with JSON: {"name": string, "style": string, "shots": [{"description": string, "overlay": string|null, "framing": string}]} with exactly ${shots.length} shots.`;

  let raw = "";
  try {
    const res = await adminClient().ai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      maxTokens: 1500,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: instructions },
          ...shots.map((s) => ({ type: "image_url" as const, image_url: { url: `data:image/jpeg;base64,${s.frame}` } })),
        ],
      }],
    });
    raw = res.choices[0]?.message?.content ?? "";
  } catch {
    return Response.json({ error: "Analyse indisponible pour le moment. Réessayez." }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as Partial<TemplateDescription>;
    const clean = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
    const out: TemplateDescription = {
      name: clean(parsed.name, 40) || (en ? "My template" : "Mon modèle"),
      style: clean(parsed.style, 200),
      shots: shots.map((_, i) => {
        const s = parsed.shots?.[i] ?? ({} as ShotDescription);
        const overlay = clean(s.overlay, 120);
        return { description: clean(s.description, 90) || (en ? "Film your product" : "Filmez votre produit"), overlay: overlay && overlay !== "null" ? overlay : null, framing: clean(s.framing, 20) || "medium" };
      }),
    };
    return Response.json(out);
  } catch {
    return Response.json({ error: "Analyse illisible. Réessayez." }, { status: 502 });
  }
}
