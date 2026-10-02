import { guard } from "@/lib/higgsfield/guard";
import { adminClient } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";

/** Text model behind "Améliorer le prompt" (InsForge model gateway). Cheap and fast. */
const MODEL = "google/gemini-2.5-flash";

interface Body {
  mode?: "image" | "video" | "ugc";
  prompt?: string;
  product?: string;
  creator?: string;
}

const GOALS: Record<NonNullable<Body["mode"]>, string> = {
  image: "an advertising product photo (setting, light, framing, mood)",
  video: "a short product video (camera movement, setting, light, action, pacing)",
  ugc: "a vertical selfie-style UGC video where the creator talks to the camera and shows the product (setting, action, tone, what they say)",
};

/**
 * Rewrites the user's short description into a precise generation prompt, in French, without
 * inventing a different product. Signed-in users only; free (the cost is negligible).
 */
export async function POST(request: Request) {
  const blocked = guard(request, { limit: 40 });
  if (blocked) return blocked;
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous pour améliorer le prompt." }, { status: 401 });

  let body: Body;
  try { body = (await request.json()) as Body; } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const mode = body.mode && body.mode in GOALS ? body.mode : "image";
  const prompt = String(body.prompt ?? "").slice(0, 800).trim();
  const product = String(body.product ?? "").slice(0, 120).trim();
  const creator = String(body.creator ?? "").slice(0, 80).trim();

  const context = [product && `Product: ${product}.`, creator && `Creator: ${creator}.`].filter(Boolean).join(" ");
  try {
    const res = await adminClient().ai.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      maxTokens: 300,
      messages: [
        {
          role: "system",
          content:
            `You improve prompts for ${GOALS[mode]} for small African merchants (West/Central Africa: markets, boutiques, maquis, WhatsApp selling). ` +
            "Write ONE improved description in French, 2 to 4 sentences, concrete and visual. Keep the user's intent and product exactly; do not invent brands, prices or text overlays. " +
            "Do not repeat the product or creator names at the start (they are already in the sentence). Reply with the description only, no quotes, no preamble.",
        },
        { role: "user", content: `${context}\nUser description: ${prompt || "(empty: propose a good one for this product)"}` },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim().replace(/^["«]\s*|\s*["»]$/g, "") ?? "";
    if (!text) throw new Error("empty");
    return Response.json({ prompt: text.slice(0, 1000) });
  } catch {
    return Response.json({ error: "Amélioration indisponible pour le moment. Réessayez." }, { status: 502 });
  }
}
