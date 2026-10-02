/**
 * Sokozia creative formats inspired by Higgsfield Marketing Studio (product shots, UGC types,
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

export interface UgcType { id: string; label: string; hint: string; direction: string; script: string }

/** UGC video formats ("type de vidéo"). Scripts are starting points the merchant edits. */
export const UGC_TYPES: UgcType[] = [
  { id: "review", label: "Avis client", hint: "Témoignage honnête", direction: "Format: honest customer review, talking to camera, shows the product while giving their opinion.", script: "Franchement, j'étais sceptique. Mais après une semaine avec ce produit, je ne peux plus m'en passer. La qualité est vraiment là, et le prix est correct. Je recommande !" },
  { id: "tutorial", label: "Tutoriel", hint: "Comment l'utiliser", direction: "Format: step-by-step tutorial, demonstrates how to use the product in clear steps, points at it while explaining.", script: "Je vous montre comment je l'utilise. Étape 1, j'ouvre. Étape 2, j'applique un peu. Étape 3, c'est prêt ! Simple et rapide." },
  { id: "tryon", label: "Essayage", hint: "Je le porte devant vous", direction: "Format: try-on haul, the person puts the product on, turns around to show the fit and reacts happily.", script: "On l'essaie ensemble ? Regardez comme ça tombe bien. La taille est parfaite et la couleur est encore plus belle en vrai." },
  { id: "beforeafter", label: "Avant / Après", hint: "Le résultat en deux temps", direction: "Format: before and after, first shows the problem, then the visible result after using the product.", script: "Avant, voilà à quoi ça ressemblait. Et maintenant, après quelques jours avec ce produit… la différence se voit tout de suite !" },
  { id: "unboxing", label: "Déballage", hint: "Ouverture du colis", direction: "Format: unboxing, opens the package on camera, discovers the product with genuine excitement.", script: "Mon colis vient d'arriver ! On ouvre ensemble… Oh, c'est encore plus beau que sur la photo. Bien emballé et livré rapidement." },
  { id: "routine", label: "Routine", hint: "Dans mon quotidien", direction: "Format: daily routine (get ready with me), the product appears naturally as part of the person's morning routine.", script: "Ma routine du matin, et le produit qui ne quitte plus ma trousse. En deux minutes, je suis prête pour la journée." },
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
