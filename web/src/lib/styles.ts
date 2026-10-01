/**
 * Sokozia styles: art directions built on Higgsfield Marketing Studio (edit mode keeps the
 * merchant's product identical). Each has a reference image in /public/styles/<id>.jpg,
 * shown on a different product so merchants see the style on goods like theirs.
 */
import type { AspectRatio } from "./types";

export interface SokoziaStyle {
  id: string;
  name: string;
  description: string;
  /** Art direction appended to the user's prompt. */
  direction: string;
  ratio: AspectRatio;
  /** Put an African model in the shot (uses a model reference when the preset mode is on). */
  withModel?: boolean;
  /** Product shown in the reference image. */
  product: string;
}

export const SOKOZIA_STYLES: SokoziaStyle[] = [
  { id: "marche-africain", product: "Épices", name: "Marché africain", description: "Sur un étal coloré, lumière du jour, ambiance de marché.", ratio: "4:5",
    direction: "Place the product on a colorful African market stall, wax fabrics and baskets softly blurred in the background, bright natural daylight, authentic and vibrant." },
  { id: "statut-whatsapp", product: "Smartphone", name: "Statut WhatsApp", description: "Vertical, fond vif orange et jaune, place pour le prix.", ratio: "9:16",
    direction: "Vertical promotional visual: the product centered on a bold orange and yellow gradient background, clean space at the top for a price and at the bottom for a call to action, punchy and modern." },
  { id: "studio-ocre", product: "Parfum", name: "Studio ocre", description: "Packshot propre sur fond ocre, ombres douces.", ratio: "1:1",
    direction: "Clean studio packshot on a warm ochre seamless background, soft shadow, premium commercial lighting, sharp product details." },
  { id: "luxe-dore", product: "Bijoux en or", name: "Luxe doré", description: "Fond sombre, reflets or, rendu haut de gamme.", ratio: "4:5",
    direction: "Luxury product shot on a dark background with golden accents and reflections, dramatic rim light, elegant and premium." },
  { id: "pagne-wax", product: "Sac en cuir et wax", name: "Pagne wax", description: "Vue du dessus sur un pagne wax aux motifs vifs.", ratio: "1:1",
    direction: "Top-down flatlay of the product on a vivid African wax print fabric, soft natural light, colorful and joyful." },
  { id: "nature-tropicale", product: "Jus de bissap", name: "Nature tropicale", description: "Feuilles, soleil, matières naturelles.", ratio: "4:5",
    direction: "Product among tropical leaves, raw wood and natural textures, warm sunlight with leaf shadows, fresh and natural." },
  { id: "maison-lifestyle", product: "Perruque", name: "Maison lifestyle", description: "Dans un intérieur africain moderne et chaleureux.", ratio: "4:5",
    direction: "Lifestyle shot of the product in a modern, warm West African home interior, woven decor and plants, cozy natural light." },
  { id: "porte-mannequin", product: "Pagnes wax", name: "Porté par une créatrice", description: "Une créatrice africaine présente le produit.", ratio: "4:5", withModel: true,
    direction: "A smiling young West African woman holds the product near her face and presents it to the camera, natural light, authentic UGC advertising photo." },
  { id: "flyer-promo", product: "Plat du maquis", name: "Flyer promo", description: "Affiche promo avec espace pour le texte et le prix.", ratio: "4:5",
    direction: "Promotional flyer layout: product large on the right, bold colorful shapes in orange, yellow and green, generous empty space on the left for headline and price, print-ready look." },
  { id: "catalogue", product: "Baskets", name: "Catalogue", description: "Fond blanc, idéal pour WhatsApp Business et marketplaces.", ratio: "1:1",
    direction: "E-commerce catalog photo: product on a pure white background, centered, evenly lit, no props, marketplace ready." },
];

export const styleById = (id?: string | null) => SOKOZIA_STYLES.find((s) => s.id === id) ?? null;
