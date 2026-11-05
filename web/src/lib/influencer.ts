/**
 * "Influencer photo": one of our creators posing with the merchant's product.
 * The user writes a short idea; the server wraps it in this director prompt so every shot
 * keeps the same face (character sheet) and the exact product (product photo).
 * Shared by web and iOS (the clients only send creatorId + shot + the short prompt).
 */

export interface InfluencerShot { id: string; label: string; direction: string }

/** Shot list used for "Multi-plans" (each image a different angle) and for single shots. */
export const INFLUENCER_SHOTS: InfluencerShot[] = [
  { id: "hold", label: "Tient le produit", direction: "medium shot from the waist up, the person holds the product near the chest and presents it to the camera with a genuine smile, product label facing the lens" },
  { id: "selfie", label: "Selfie", direction: "front-camera selfie at arm's length, slight high angle, the person holds the product next to the face, casual and spontaneous like a real Instagram story" },
  { id: "use", label: "En utilisation", direction: "candid lifestyle moment, the person is actually using or wearing the product in a natural everyday situation, looking at the product, not posing" },
  { id: "closeup", label: "Gros plan", direction: "tight beauty close-up of the face and hands, the product held close to the cheek, shallow depth of field, crisp detail on the product" },
  { id: "unboxing", label: "Déballage", direction: "the person opens the package and reveals the product with an excited expression, hands and product clearly visible, home setting" },
  { id: "street", label: "En ville", direction: "full-body street style shot outdoors in a lively African city street or market, the person walks or stands confidently holding the product, golden hour light" },
];

export const influencerShot = (id?: string | null) => INFLUENCER_SHOTS.find((s) => s.id === id) ?? INFLUENCER_SHOTS[0];

export function influencerPrompt(p: { name: string; look: string; country: string; userPrompt: string; shot?: string | null; hasProduct: boolean; variation?: number }): string {
  const shot = influencerShot(p.shot);
  const idea = p.userPrompt.trim().slice(0, 400);
  return [
    `Photorealistic influencer marketing photo, shot on a recent iPhone, natural colors, real skin texture with pores, no plastic or AI look.`,
    `PERSON: exactly the same person as in the first reference image (character sheet of ${p.name}): ${p.look}. Keep the face, skin tone, hair and body identical; same identity in every detail.`,
    p.hasProduct
      ? `PRODUCT: the exact product from the second reference image. Keep its shape, colors, proportions, label, logo and text identical and readable; do not redesign, recolor or invent packaging. Correct scale relative to the hands, realistic grip with five fingers, natural contact shadows and reflections.`
      : `The person presents a product naturally.`,
    `SHOT: ${shot.direction}.`,
    idea ? `SCENE AND IDEA FROM THE MERCHANT (priority): ${idea}.` : `Setting: a tasteful, modern ${p.country} setting that fits the product.`,
    `Authentic West/Central African context (${p.country}), flattering soft light, clean uncluttered background, sharp focus on face and product, commercial quality ready for WhatsApp, Instagram and TikTok ads.`,
    `No text, no captions, no watermark, no logo overlay, no extra people, no distorted hands, no duplicated product.`,
    p.variation ? `Variation ${p.variation}: change pose, expression and framing slightly while keeping the same person, product and scene.` : "",
  ].filter(Boolean).join(" ");
}
