import type { CopyResult, CopyTool, Tone } from "@/lib/types";
import { daysAgo } from "@/lib/utils";

export const COPY_TOOLS: { id: CopyTool; label: string; description: string }[] = [
  { id: "ad-copy", label: "Texte publicitaire", description: "Titre + texte principal pour les réseaux sociaux payants." },
  { id: "product-description", label: "Description produit", description: "Texte de fiche produit axé sur les bénéfices." },
  { id: "instagram-caption", label: "Légende Instagram", description: "Légende avec hashtags." },
  { id: "tiktok-caption", label: "Légende TikTok", description: "Légende courte et percutante." },
  { id: "email", label: "E-mail", description: "Objet + corps du message." },
  { id: "headline", label: "Titre", description: "Cinq propositions de titres." },
  { id: "hook", label: "Accroche", description: "Des ouvertures qui stoppent le scroll." },
  { id: "cta", label: "CTA", description: "Variantes d'appel à l'action." },
  { id: "ugc-script", label: "Script UGC", description: "Script créateur de 15 à 30 s." },
  { id: "landing-page", label: "Texte de landing page", description: "Hero, bénéfices, preuves, CTA." },
];

export const TONES: { id: Tone; label: string }[] = [
  { id: "professional", label: "Professionnel" },
  { id: "friendly", label: "Amical" },
  { id: "luxury", label: "Luxe" },
  { id: "bold", label: "Audacieux" },
  { id: "funny", label: "Humoristique" },
  { id: "minimal", label: "Minimaliste" },
  { id: "urgent", label: "Urgent" },
];

export const hooks: string[] = [
  "Personne ne vous dit ça sur les sérums à la vitamine C...",
  "Vous l'utilisez mal depuis toujours.",
  "POV : vous avez enfin trouvé le sérum qui marche vraiment.",
  "J'ai arrêté ma routine en 10 étapes et j'ai fait ça à la place.",
  "Les dermatos détestent à quel point c'est simple.",
  "C'est la seule chose que j'ai changée. 30 jours plus tard...",
  "Si votre peau est terne dès 15 h, regardez ça.",
  "Le sérum à 48 $ qui a remplacé trois produits sur mon étagère.",
  "Attendez l'éclat à la fin.",
  "Arrêtez de scroller si vous n'avez jamais vu votre peau comme ça.",
  "J'étais sceptique. Puis j'ai vu le septième jour.",
  "Voici ce que veut vraiment dire un sérum « clean ».",
];

export const copySamples: CopyResult[] = [
  { id: "copy_1", tool: "instagram-caption", title: "Légende lancement été", tone: "friendly", platform: "instagram", text: "Découvrez le sérum Luma Glow. Vitamine C stabilisée, fini léger et un éclat que vous remarquerez dès le septième jour. Semaine de lancement : -20 %, lien en bio.\n\n#lumaskin #vitaminc #glowup #skincareroutine", createdAt: daysAgo(1) },
  { id: "copy_2", tool: "product-description", title: "Description fiche produit", tone: "professional", text: "Le sérum Luma Glow est un sérum illuminateur à la vitamine C conçu pour les routines de soin quotidiennes. Sa formule stabilisée à 12 % cible le teint terne et irrégulier, tandis que l'acide hyaluronique garde la peau confortable. Clean, sans parfum et assez léger pour s'appliquer sous un SPF.", createdAt: daysAgo(2) },
  { id: "copy_3", tool: "email", title: "Annonce de lancement", tone: "urgent", text: "Objet : Votre éclat est arrivé (-20 % jusqu'à dimanche)\n\nAlex,\n\nLe sérum Luma Glow est disponible. La vitamine C bien faite : lumineuse, unifiante, au quotidien. Le prix de lancement prend fin dimanche à minuit.\n\nJe commande →", createdAt: daysAgo(3) },
  { id: "copy_4", tool: "ugc-script", title: "Script routine matinale de Maya", tone: "friendly", platform: "tiktok", text: "[Accroche] Personne ne vous dit ça sur les sérums à la vitamine C...\n[Démo] Deux gouttes. C'est tout. Tapotez avant le SPF.\n[Preuve] Septième jour et ma peau a l'air réveillée avant même le café.\n[CTA] Le lien est dans ma bio, la réduction de lancement se termine dimanche.", createdAt: daysAgo(4) },
  { id: "copy_5", tool: "headline", title: "Propositions de titres", tone: "bold", text: "1. Un éclat visible en 7 jours\n2. La vitamine C. Bien faite.\n3. Vos matins deviennent plus lumineux\n4. Un sérum. Zéro prise de tête.\n5. Le dernier sérum que vous adopterez", createdAt: daysAgo(5) },
];
