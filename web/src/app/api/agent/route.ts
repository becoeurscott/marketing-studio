import { guard } from "@/lib/higgsfield/guard";
import { adminClient } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";

/**
 * In-app marketing agent: reads the conversation and the user's catalog (sent by the app) and
 * answers in French with at most one concrete action. Actions are only proposed here; the app
 * shows the credit cost and runs the generation when the user taps it.
 */
const MODEL = "google/gemini-2.5-flash";

type Item = { id: string; name: string; hint?: string };
interface Body {
  messages?: { role: "user" | "assistant"; content: string }[];
  products?: Item[];
  creators?: Item[];
  styles?: Item[];
  ugcFormats?: Item[];
  credits?: number;
  language?: string;
}

const ACTION_TYPES = ["ugc", "shoot", "video", "copy"] as const;
type ActionType = (typeof ACTION_TYPES)[number];

export interface AgentAction {
  type: ActionType;
  productId?: string;
  creatorId?: string;
  styleId?: string;
  ugcFormatId?: string;
  script?: string;
  prompt?: string;
  durationSec?: 5 | 10 | 15;
  summary: string;
}

const clean = (s: unknown, max: number) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const list = (items: Item[] | undefined, max = 40) =>
  (Array.isArray(items) ? items : []).slice(0, max).map((i) => ({ id: clean(i.id, 80), name: clean(i.name, 80), hint: clean(i.hint, 120) })).filter((i) => i.id && i.name);
const describe = (items: { id: string; name: string; hint: string }[]) => items.map((i) => `- ${i.id}: ${i.name}${i.hint ? ` (${i.hint})` : ""}`).join("\n") || "- (aucun)";

export async function POST(request: Request) {
  const blocked = guard(request, { limit: 30 });
  if (blocked) return blocked;
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Connectez-vous pour parler à l'assistant." }, { status: 401 });

  let body: Body;
  try { body = (await request.json()) as Body; } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }

  const products = list(body.products);
  const creators = list(body.creators);
  const styles = list(body.styles);
  const formats = list(body.ugcFormats);
  const history = (Array.isArray(body.messages) ? body.messages : [])
    .slice(-12)
    .map((m) => ({ role: m.role === "assistant" ? ("assistant" as const) : ("user" as const), content: clean(m.content, 1200) }))
    .filter((m) => m.content);
  if (!history.length || history[history.length - 1].role !== "user") return Response.json({ error: "Message vide." }, { status: 400 });

  const system =
    "Tu es l'assistant marketing de Marketing Studio, une app pour les petits commerçants d'Afrique de l'Ouest et du Centre (boutiques, marchés, maquis, vente sur WhatsApp). " +
    "Tu réponds toujours en français simple, chaleureux et court (2 à 4 phrases). Tu aides à créer : vidéos UGC (un créateur IA présente le produit), shootings produit (photos pub), vidéos produit et textes (accroches, légendes WhatsApp). " +
    "Quand la demande est assez claire, propose UNE action concrète. Utilise uniquement les identifiants des listes ci-dessous. Si une information indispensable manque (par exemple aucun produit importé pour un shooting), pose une seule question et ne propose pas d'action. " +
    "N'invente jamais de prix, de marque ni de promesse. Ne parle jamais des fournisseurs d'IA ni de dollars.\n\n" +
    `Produits de l'utilisateur :\n${describe(products)}\n\nCréateurs (avatars) :\n${describe(creators)}\n\nStyles de shooting :\n${describe(styles)}\n\nFormats UGC :\n${describe(formats)}\n\n` +
    `Crédits disponibles : ${Number(body.credits) || 0}.\n\n` +
    'Réponds UNIQUEMENT avec un objet JSON : {"reply": string, "action": null | {"type": "ugc"|"shoot"|"video"|"copy", "productId"?: string, "creatorId"?: string, "styleId"?: string, "ugcFormatId"?: string, "script"?: string, "prompt"?: string, "durationSec"?: 5|10|15, "summary": string}}. ' +
    "Pour ugc : creatorId requis, script en français (1 à 3 phrases parlées), ugcFormatId si pertinent. Pour shoot : productId et styleId requis. Pour video : prompt visuel en français, productId si utile. Pour copy : prompt = le sujet du texte. summary = une ligne qui décrit ce qui sera créé.";

  let raw = "";
  try {
    const res = await adminClient().ai.chat.completions.create({
      model: MODEL,
      temperature: 0.5,
      maxTokens: 600,
      messages: [{ role: "system", content: system }, ...history],
    });
    raw = res.choices[0]?.message?.content ?? "";
  } catch {
    return Response.json({ error: "L'assistant est indisponible pour le moment. Réessayez." }, { status: 502 });
  }

  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  let parsed: { reply?: unknown; action?: Record<string, unknown> | null };
  try { parsed = JSON.parse(json); } catch { return Response.json({ reply: clean(raw, 800) || "Pouvez-vous reformuler ?", action: null }); }

  const reply = clean(parsed.reply, 800) || "Voici ce que je vous propose.";
  return Response.json({ reply, action: validate(parsed.action, { products, creators, styles, formats }) });
}

function validate(a: Record<string, unknown> | null | undefined, ctx: Record<"products" | "creators" | "styles" | "formats", { id: string }[]>): AgentAction | null {
  if (!a || typeof a !== "object") return null;
  const type = a.type as ActionType;
  if (!ACTION_TYPES.includes(type)) return null;
  const pick = (v: unknown, items: { id: string }[]) => (typeof v === "string" && items.some((i) => i.id === v) ? v : undefined);
  const d = Number(a.durationSec);
  const action: AgentAction = {
    type,
    productId: pick(a.productId, ctx.products),
    creatorId: pick(a.creatorId, ctx.creators),
    styleId: pick(a.styleId, ctx.styles),
    ugcFormatId: pick(a.ugcFormatId, ctx.formats),
    script: clean(a.script, 400) || undefined,
    prompt: clean(a.prompt, 600) || undefined,
    durationSec: d === 5 || d === 10 || d === 15 ? d : undefined,
    summary: clean(a.summary, 160) || "Création proposée",
  };
  if (type === "ugc" && !action.creatorId) return null;
  if (type === "shoot" && (!action.productId || !action.styleId)) return null;
  if ((type === "video" || type === "copy") && !action.prompt) return null;
  return action;
}
