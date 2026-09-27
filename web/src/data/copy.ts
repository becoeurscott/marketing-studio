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

export const copySamples: CopyResult[] = [
  { id: "copy_1", tool: "whatsapp-status", title: "Statuts lancement karité", tone: "friendly", platform: "whatsapp", language: "fr", text: "Lundi : Il est arrivé ! Le beurre de karité pur Karité d'Or.\nMardi : 100 % naturel, sans mélange, direct de Korhogo.\nMercredi : Peau sèche ? Cheveux cassants ? Un seul pot suffit.\nJeudi : Pot de 250 g à 7 500 FCFA. Livraison partout à Abidjan.\nVendredi : Derniers pots du premier arrivage. Écris-moi « KARITÉ » pour commander.", createdAt: daysAgo(1) },
  { id: "copy_2", tool: "whatsapp-catalog", title: "Fiche catalogue WhatsApp Business", tone: "professional", platform: "whatsapp", language: "fr", text: "Beurre de karité pur — 250 g\n\nBeurre de karité non raffiné, fabriqué par une coopérative de femmes à Korhogo. Nourrit la peau sèche, adoucit les talons et protège les cheveux crépus. Sans parfum ajouté, sans produit chimique.\n\nPrix : 7 500 FCFA\nLivraison Abidjan : 1 000 FCFA, paiement Wave ou Orange Money.", createdAt: daysAgo(2) },
  { id: "copy_3", tool: "ad-copy", title: "Pub Facebook promo Tabaski", tone: "urgent", platform: "facebook", language: "fr", text: "Titre : -20 % sur tout Karité d'Or pour la Tabaski\n\nPour la fête, faites-vous belle au naturel. Beurre de karité, savon noir et huiles cheveux à -20 % jusqu'à dimanche minuit. Le pot de karité passe à 6 000 FCFA au lieu de 7 500 FCFA.\n\nCommandez sur WhatsApp, livraison le jour même à Abidjan.", createdAt: daysAgo(3) },
  { id: "copy_4", tool: "ugc-script", title: "Script routine du matin d'Aïcha", tone: "friendly", platform: "tiktok", language: "fr", text: "[Accroche] Arrêtez de payer ce prix au marché…\n[Démo] Une noisette de karité, je chauffe entre mes mains, j'applique sur les bras et les pointes.\n[Preuve] Une semaine après, ma peau ne tire plus et mes cheveux cassent beaucoup moins.\n[CTA] Le numéro WhatsApp est dans ma bio, le pot est à 7 500 FCFA.", createdAt: daysAgo(4) },
  { id: "copy_5", tool: "voice-note", title: "Note vocale arrivage savon noir", tone: "friendly", platform: "whatsapp", language: "fr", text: "Bonjour la famille, c'est Awa de Karité d'Or ! Le savon noir est enfin revenu. Il nettoie en douceur, il sent bon, et il est fait à la main. Le morceau est à 2 500 FCFA, et si tu prends trois, je te fais 6 500. Réponds juste à ce message et on te livre aujourd'hui. Merci et bonne journée !", createdAt: daysAgo(5) },
  { id: "copy_6", tool: "headline", title: "Propositions de titres", tone: "bold", language: "fr", text: "1. Une peau douce en 7 jours\n2. Le vrai karité, sans mélange\n3. Fait à Abidjan, pour ta peau\n4. Un pot. Toute la famille.\n5. Le karité que ta maman reconnaîtrait", createdAt: daysAgo(6) },
];
