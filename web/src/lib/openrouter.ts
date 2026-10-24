const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

export interface OpenRouterImageRequest {
  model: string;
  prompt: string;
  n?: number;
  size?: string;
}

export interface OpenRouterImageResult {
  url: string;
}

export async function generateImage(req: OpenRouterImageRequest): Promise<OpenRouterImageResult[]> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OpenRouter API key not configured.");

  const res = await fetch(`${OPENROUTER_BASE}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://marketingstudio.app",
      "X-Title": "Marketing Studio",
    },
    body: JSON.stringify({
      model: req.model,
      prompt: req.prompt,
      n: req.n ?? 1,
      size: req.size ?? "1024x1024",
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { data?: { url: string }[] };
  return (data.data ?? []).map((d) => ({ url: d.url }));
}

export const OPENROUTER_IMAGE_MODELS = [
  { id: "openai/dall-e-3", label: "DALL-E 3", provider: "OpenAI" },
  { id: "stabilityai/stable-diffusion-xl", label: "SDXL", provider: "Stability AI" },
  { id: "black-forest-labs/flux-1.1-pro", label: "Flux 1.1 Pro", provider: "Black Forest Labs" },
  { id: "black-forest-labs/flux-schnell", label: "Flux Schnell", provider: "Black Forest Labs" },
  { id: "ideogram/ideogram-v2", label: "Ideogram v2", provider: "Ideogram" },
  { id: "google/imagen-3", label: "Imagen 3", provider: "Google" },
] as const;

export type OpenRouterModelId = (typeof OPENROUTER_IMAGE_MODELS)[number]["id"];
