/**
 * "Photo produit" styles — Canva-inspired product photography templates.
 * When the merchant adds a product photo but no creator, they pick a style
 * and the server wraps it in a professional photography prompt.
 */

export interface ProductStyle {
  id: string;
  label: string;
  emoji: string;
  hint: string;
  direction: string;
}

export const PRODUCT_STYLES: ProductStyle[] = [
  {
    id: "studio",
    label: "Studio",
    emoji: "📸",
    hint: "Fond blanc, éclairage pro",
    direction: "professional product photography on a clean white background, soft studio lighting with gentle shadows, the product is perfectly centered and well-lit from multiple angles, commercial catalog quality, sharp focus, no distractions",
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    emoji: "🏠",
    hint: "Mise en situation naturelle",
    direction: "lifestyle product photography, the product is placed naturally in an elegant real-world setting: modern table, kitchen counter, or desk — as if someone just set it down, warm natural light from a window, shallow depth of field, cozy and aspirational",
  },
  {
    id: "flatlay",
    label: "Flat lay",
    emoji: "🎨",
    hint: "Vue du dessus, composition soignée",
    direction: "flat lay product photography, bird's-eye view, the product is centered with tasteful complementary props arranged around it (fabrics, plants, small accessories that match the color palette), clean geometric composition on a textured surface, soft even lighting",
  },
  {
    id: "outdoor",
    label: "Plein air",
    emoji: "🌿",
    hint: "Nature, lumière dorée",
    direction: "outdoor product photography, golden hour sunlight, the product is placed on a natural surface (stone, wood, leaves), bokeh background with greenery, warm tones, fresh and organic feeling, African landscape context",
  },
  {
    id: "bold",
    label: "Pub audacieuse",
    emoji: "⚡",
    hint: "Couleurs vives, impact visuel",
    direction: "bold advertising product photography, vibrant colorful background with a striking complementary color behind the product, dramatic directional lighting with sharp shadows, high contrast, the product pops, editorial magazine quality, eye-catching and modern",
  },
  {
    id: "minimal",
    label: "Minimaliste",
    emoji: "◻️",
    hint: "Épuré, tons neutres",
    direction: "minimalist product photography, the product on a smooth matte surface in a neutral tone (beige, light grey, cream), very clean composition with lots of negative space, subtle shadow, Scandinavian aesthetic, premium and understated",
  },
  {
    id: "social",
    label: "Réseaux sociaux",
    emoji: "📱",
    hint: "Prêt pour Instagram / TikTok",
    direction: "social media product photography optimized for Instagram and TikTok, trendy composition, the product is held by a hand or placed next to everyday items, bright and punchy colors, slightly overhead angle, engaging and scroll-stopping, modern and youthful",
  },
  {
    id: "luxury",
    label: "Luxe",
    emoji: "✨",
    hint: "Haut de gamme, reflets subtils",
    direction: "luxury product photography, the product on a dark reflective surface (black marble or glass), dramatic moody lighting with subtle golden highlights, elegant and sophisticated atmosphere, premium brand quality, subtle reflections and specular highlights",
  },
];

export const productStyle = (id?: string | null) => PRODUCT_STYLES.find((s) => s.id === id) ?? PRODUCT_STYLES[0];

export function productStylePrompt(p: { style: string; userPrompt: string }): string {
  const style = productStyle(p.style);
  const idea = p.userPrompt.trim().slice(0, 400);
  return [
    `Ultra-high quality product photography, shot with a professional camera, 85mm lens, f/2.8.`,
    `PRODUCT: the exact product from the reference image. Keep its shape, colors, proportions, label, logo and text identical and perfectly readable; do not redesign, recolor or invent anything. Correct scale, realistic contact shadows and reflections on the surface.`,
    `STYLE: ${style.direction}.`,
    idea ? `SCENE IDEA FROM THE MERCHANT (priority): ${idea}.` : "",
    `4K resolution quality, sharp focus on the product, professional color grading, no text overlay, no watermark, no logo, no extra objects that distract from the product.`,
  ].filter(Boolean).join(" ");
}
