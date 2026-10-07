import {
  Bell, BookOpen, Building2, CreditCard, FolderKanban, Heart, History, Home, Images, LayoutTemplate,
  Megaphone, Palette, Settings, Sparkles, User, Users, Wand2, type LucideIcon,
} from "lucide-react";

export interface NavItem { href: string; label: string; icon: LucideIcon; match?: (path: string) => boolean }

export const primaryNav: NavItem[] = [
  { href: "/home", label: "Accueil", icon: Home },
  { href: "/studio", label: "Studio", icon: Wand2, match: (p) => p.startsWith("/studio") },
  { href: "/projects", label: "Projets", icon: FolderKanban, match: (p) => p.startsWith("/projects") },
  { href: "/assets", label: "Ressources", icon: Images, match: (p) => p.startsWith("/assets") },
  { href: "/campaigns", label: "Campagnes", icon: Megaphone, match: (p) => p.startsWith("/campaigns") },
  { href: "/templates", label: "Modèles", icon: LayoutTemplate, match: (p) => p.startsWith("/templates") },
  { href: "/brand", label: "Marque", icon: Palette, match: (p) => p.startsWith("/brand") },
  { href: "/creators", label: "Créateurs", icon: Users },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export const secondaryNav: NavItem[] = [
  { href: "/generations", label: "Historique", icon: History },
  { href: "/favorites", label: "Favoris", icon: Heart },
  { href: "/credits", label: "Crédits", icon: Sparkles },
  { href: "/pricing", label: "Tarifs", icon: CreditCard },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/workspace", label: "Espace de travail", icon: Building2 },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/help", label: "Aide", icon: BookOpen },
];

/** Default page titles by route prefix (TopBar falls back to these). */
export const routeTitles: [string, string][] = [
  ["/home", "Accueil"], ["/studio/image", "Générateur d’images"], ["/studio/video", "Générateur de vidéos"], ["/studio/ugc", "Créateur UGC"],
  ["/studio/product-shoot", "Shooting produit IA"], ["/studio/ads", "Créateur d’annonces"], ["/studio/copy", "Rédacteur IA"], ["/studio", "Studio"],
  ["/projects", "Projets"], ["/assets", "Ressources"], ["/campaigns", "Campagnes"], ["/templates", "Modèles"],
  ["/brand/voice", "Ton de marque"], ["/brand", "Kit de marque"], ["/creators", "Créateurs"], ["/generations", "Historique des générations"],
  ["/favorites", "Favoris"], ["/credits", "Crédits"], ["/pricing", "Tarifs"], ["/notifications", "Notifications"],
  ["/workspace", "Espace de travail"], ["/profile", "Profil"], ["/settings", "Paramètres"], ["/help", "Aide"],
];

export function titleForPath(path: string): string {
  return routeTitles.find(([p]) => path === p || path.startsWith(p + "/"))?.[1] ?? "Marketing Studio";
}

export function isActive(item: NavItem, path: string): boolean {
  return item.match ? item.match(path) : path === item.href || path.startsWith(item.href + "/");
}
