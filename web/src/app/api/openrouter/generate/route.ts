import { NextResponse } from "next/server";
import { accountSummary } from "@/lib/account";
import { guard } from "@/lib/higgsfield/guard";
import { getSessionUser } from "@/lib/insforge/server";
import { generateImage, isOpenRouterConfigured, OPENROUTER_IMAGE_MODELS } from "@/lib/openrouter";

const CREDITS_PER_IMAGE = 15;

export async function POST(request: Request) {
  const blocked = guard(request, { limit: Number(process.env.HF_HOURLY_LIMIT) || 60 });
  if (blocked) return blocked;

  if (!isOpenRouterConfigured()) {
    return NextResponse.json({ error: "Génération d'images OpenRouter non disponible." }, { status: 503 });
  }

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous pour générer." }, { status: 401 });

  const body = (await request.json()) as { model: string; prompt: string; n?: number; size?: string };
  if (!body.prompt || typeof body.prompt !== "string") {
    return NextResponse.json({ error: "Prompt requis." }, { status: 400 });
  }

  const model = OPENROUTER_IMAGE_MODELS.find((m) => m.id === body.model);
  if (!model) return NextResponse.json({ error: "Modèle non supporté." }, { status: 400 });

  const count = Math.min(Math.max(body.n ?? 1, 1), 4);
  const totalCredits = CREDITS_PER_IMAGE * count;

  const account = await accountSummary(user.id);
  if (account.credits < totalCredits) {
    return NextResponse.json({ error: "Crédits insuffisants.", needed: totalCredits, balance: account.credits }, { status: 402 });
  }

  try {
    const results = await generateImage({ model: body.model, prompt: body.prompt, n: count, size: body.size });
    return NextResponse.json({ images: results, credits: totalCredits });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur de génération.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    available: isOpenRouterConfigured(),
    models: OPENROUTER_IMAGE_MODELS.map((m) => ({ id: m.id, label: m.label, provider: m.provider })),
    creditsPerImage: CREDITS_PER_IMAGE,
  });
}
