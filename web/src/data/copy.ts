import type { CopyResult, CopyTool, Tone } from "@/lib/types";

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
  { id: "whatsapp-status", label: "Statuts WhatsApp", description: "Cinq statuts courts pour la semaine." },
  { id: "whatsapp-catalog", label: "Fiche catalogue", description: "Nom, description et prix pour WhatsApp Business." },
  { id: "voice-note", label: "Note vocale pub", description: "Script de 20 s à enregistrer et transférer dans vos groupes." },
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
  "Arrêtez de payer ce prix au marché…",
  "Ma cliente m'a envoyé cette photo…",
  "Personne ne vous dit ça avant d'acheter…",
  "POV : tu as enfin trouvé le bon produit, au bon prix.",
  "Le vendeur ne voulait pas que je montre ça.",
  "J'ai testé pendant 7 jours. Voici le résultat.",
  "Si tu es à Abidjan, regarde ça avant ce soir.",
  "3 erreurs que tout le monde fait en achetant ça.",
  "Le produit à 5 000 FCFA qui a remplacé trois autres chez moi.",
  "On m'a posé la question 50 fois dans mes DM, je réponds ici.",
  "Attends de voir la fin.",
  "Livraison aujourd'hui, paiement à la réception. Oui, vraiment.",
];

export const copySamples: CopyResult[] = [];
