import { useStore } from "@/lib/store";

const EN: Record<string, string> = {
  "Accueil": "Home", "Studio": "Studio", "Communauté": "Community", "Projets": "Projects", "Ressources": "Assets", "Campagnes": "Campaigns", "Modèles": "Templates", "Marque": "Brand", "Créateurs": "Creators", "Paramètres": "Settings", "Historique": "History", "Favoris": "Favorites", "Crédits": "Credits", "Tarifs": "Pricing", "Notifications": "Notifications", "Espace de travail": "Workspace", "Profil": "Profile", "Aide": "Help", "Plus": "More", "Se déconnecter": "Sign out", "Compte": "Account", "Pays et langues": "Country and languages", "Boutique": "Business", "Apparence": "Appearance", "Crédits et paiement": "Credits and payments", "Sécurité": "Security",
};

export function useInterfaceLanguage() {
  const language = useStore((s) => s.preferences.interfaceLanguage ?? "fr");
  return { language, t: (french: string) => language === "en" ? (EN[french] ?? french) : french };
}
