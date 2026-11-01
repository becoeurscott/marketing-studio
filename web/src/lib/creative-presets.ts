/**
 * Marketing Studio creative formats inspired by Higgsfield Marketing Studio (product shots, UGC types,
 * multi-shot ads). Higgsfield only exposes its ad templates through the API, so these are
 * rebuilt as art direction sent with the generation (Marketing Studio image, Seedance UGC, Kling multi-shot).
 */

export interface ShotType { id: string; label: string; hint: string; direction: string }

/** Product shoot framing ("type de plan"). */
export const SHOT_TYPES: ShotType[] = [
  { id: "packshot", label: "Packshot", hint: "Produit seul, fond uni", direction: "Clean e-commerce packshot: the product alone, centered, on a seamless plain background, soft even light, no people." },
  { id: "closeup", label: "Gros plan", hint: "Détail, texture, étiquette", direction: "Macro close-up of the product: fill the frame with its texture, material and label details, shallow depth of field, no people." },
  { id: "lifestyle", label: "Mise en situation", hint: "Dans son décor d'usage", direction: "Lifestyle scene: the product in a real everyday setting where it is used, natural light, believable props, no faces." },
  { id: "hand", label: "En main, sans visage", hint: "Mains seulement", direction: "Faceless shot: only a person's hands holding and using the product, close framing, no face visible, natural skin tones." },
  { id: "fullbody", label: "Porté, corps entier", hint: "Mannequin en pied", direction: "Full-body fashion shot: an African model wearing or holding the product, head to toe in frame, confident pose, editorial light." },
  { id: "flatlay", label: "Flat lay", hint: "Vue de dessus", direction: "Top-down flat lay: the product arranged with matching accessories on a styled surface, shot from directly above, no people." },
];

export interface UgcType { id: string; label: string; hint: string; icon: string; durationSec: 5 | 10 | 15; direction: string; script: string }

/** UGC video formats (same list as the iOS app): the user picks one, then a creator and a product. */
export const UGC_TYPES: UgcType[] = [
  { id: "before-after", label: "Avant / Après", hint: "Montre le résultat du produit", icon: "ArrowLeftRight", durationSec: 10, direction: "Format: Before-and-after UGC. First half: the person looks tired or frustrated with the problem, soft dull light. Quick jump cut. Second half: same person, glowing and happy after using the product, bright light, shows the product to the camera.", script: "Avant, j’avais ce problème… Depuis que j’utilise ce produit, regardez la différence !" },
  { id: "unboxing", label: "Unboxing", hint: "Déballage enthousiaste", icon: "Package", durationSec: 10, direction: "Format: Unboxing UGC on a table, handheld selfie angle. The person opens the package with excitement, pulls out the product, turns it slowly toward the camera, close-up on details, then smiles.", script: "Mon colis vient d’arriver ! On ouvre ensemble… Regardez la qualité, je suis trop contente." },
  { id: "testimonial", label: "Témoignage", hint: "Avis client sincère", icon: "Quote", durationSec: 15, direction: "Format: Honest testimonial UGC. The person sits at home facing the camera, holding the product near the face, speaking sincerely with natural gestures, warm daylight, slight handheld movement.", script: "Je vous donne mon avis honnête : ce produit a vraiment changé mon quotidien. Je le recommande." },
  { id: "demo", label: "Démo produit", hint: "Explique comment l’utiliser", icon: "Hand", durationSec: 15, direction: "Format: Product demo UGC. The person shows step by step how to use the product, close-ups of hands using it, then back to the face explaining the result.", script: "Je vous montre comment l’utiliser : c’est très simple, en trois étapes. Et voilà le résultat !" },
  { id: "routine", label: "Routine beauté", hint: "Soin, cosmétique, cheveux", icon: "Sparkles", durationSec: 15, direction: "Format: Morning beauty routine UGC in a bright bathroom mirror. The person applies the product on skin or hair, gentle close-ups of texture, then shows the glowing result to the camera.", script: "Ma routine du matin avec mon produit préféré. La texture est incroyable et ma peau est toute douce." },
  { id: "tasting", label: "Dégustation", hint: "Plat, boisson, épicerie", icon: "UtensilsCrossed", durationSec: 10, direction: "Format: Food tasting UGC at a lively maquis or kitchen. The person presents the product, takes a bite or sip, reacts with genuine delight, nods and points at it.", script: "On goûte ensemble ? Hmm… C’est trop bon ! Vous devez absolument essayer." },
  { id: "fashion", label: "Essayage mode", hint: "Vêtements, pagne, accessoires", icon: "Shirt", durationSec: 10, direction: "Format: Fashion try-on UGC in a boutique fitting area. The person shows the item, quick outfit reveal, turns around to show the fit, poses confidently in front of a mirror.", script: "Regardez cette tenue ! La coupe est parfaite et le tissu est de très bonne qualité." },
  { id: "wow", label: "Réaction « wow »", hint: "Accroche forte en 3 s", icon: "Zap", durationSec: 10, direction: "Format: Hook-style UGC. The person stops scrolling, looks surprised, leans toward the camera, then reveals the product with an amazed expression and fast energetic delivery.", script: "Attendez ! Vous ne connaissez pas encore ça ? C’est exactement ce qu’il vous faut." },
  { id: "street", label: "Interview de rue", hint: "Ambiance micro-trottoir", icon: "Mic", durationSec: 10, direction: "Format: Street interview UGC in a busy African market street. The person holds a small microphone, talks to the camera, shows the product, passers-by softly blurred behind.", script: "On est au marché et je vous présente le produit dont tout le monde parle en ce moment." },
  { id: "promo", label: "Offre promo", hint: "Annonce une réduction", icon: "Tag", durationSec: 10, direction: "Format: Promotional UGC. The person holds the product, points at it enthusiastically, counts on fingers, announces a limited offer with urgency, ends with a call to action gesture.", script: "Promo spéciale cette semaine seulement ! Commandez vite sur WhatsApp avant la fin du stock." },
  { id: "comparison", label: "Comparatif", hint: "Ce produit vs les autres", icon: "Scale", durationSec: 15, direction: "Format: Comparison UGC. The person holds an ordinary unbranded alternative in one hand and the product in the other, compares them, then puts the alternative away and keeps the product, convinced.", script: "J’ai comparé avec ce que j’utilisais avant : franchement, il n’y a pas photo." },
  { id: "gift", label: "Idée cadeau", hint: "Fêtes, anniversaires", icon: "Gift", durationSec: 10, direction: "Format: Gift idea UGC in a cozy decorated room. The person wraps or presents the product as a gift, smiles warmly, shows why it is the perfect present.", script: "Vous cherchez un cadeau qui fait plaisir ? Voici mon idée parfaite." },
];

export interface MultiShotPreset { id: string; label: string; hint: string; shots: { name: string; prompt: string; duration: number }[] }

/** Multi-shot ads (Kling 3.0 custom shots, durations summed for generation and billing). */
export const MULTI_SHOT_PRESETS: MultiShotPreset[] = [
  {
    id: "three-angles", label: "3 angles · 15 s", hint: "Plan large, gros plan, plan final",
    shots: [
      { name: "Plan large", prompt: "Wide establishing shot of the product in its setting, slow push-in.", duration: 5 },
      { name: "Gros plan", prompt: "Close-up on the product details, slow orbit around it.", duration: 5 },
      { name: "Plan final", prompt: "Hero shot from the front, product centered, gentle zoom out, space for the offer text.", duration: 5 },
    ],
  },
  {
    id: "problem-solution", label: "Problème → solution · 15 s", hint: "Le besoin, le produit, le résultat",
    shots: [
      { name: "Le problème", prompt: "A person facing the everyday problem the product solves, slightly frustrated.", duration: 4 },
      { name: "Le produit", prompt: "The product is revealed and used, close-up on hands and product.", duration: 6 },
      { name: "Le résultat", prompt: "Happy result, the person smiles, product visible in frame.", duration: 5 },
    ],
  },
  {
    id: "quick-cuts", label: "Rythme rapide · 10 s", hint: "5 plans courts pour TikTok",
    shots: [
      { name: "Accroche", prompt: "Fast dynamic reveal of the product, energetic motion.", duration: 2 },
      { name: "Détail 1", prompt: "Snappy close-up on a key product detail.", duration: 2 },
      { name: "Détail 2", prompt: "Another angle of the product, quick pan.", duration: 2 },
      { name: "Usage", prompt: "Someone uses the product, quick and lively.", duration: 2 },
      { name: "Final", prompt: "Product hero shot, bright and clean.", duration: 2 },
    ],
  },
];

export const shotsDuration = (shots: { duration: number }[]) => shots.reduce((s, x) => s + x.duration, 0);
