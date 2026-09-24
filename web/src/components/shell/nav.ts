import {
  Bell, BookOpen, Building2, CreditCard, FolderKanban, Heart, History, Home, Images, LayoutTemplate,
  Megaphone, Palette, Settings, Sparkles, User, Users, Wand2, type LucideIcon,
} from "lucide-react";

export interface NavItem { href: string; label: string; icon: LucideIcon; match?: (path: string) => boolean }

export const primaryNav: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/studio", label: "Studio", icon: Wand2, match: (p) => p.startsWith("/studio") },
  { href: "/projects", label: "Projects", icon: FolderKanban, match: (p) => p.startsWith("/projects") },
  { href: "/assets", label: "Assets", icon: Images, match: (p) => p.startsWith("/assets") },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone, match: (p) => p.startsWith("/campaigns") },
  { href: "/templates", label: "Templates", icon: LayoutTemplate, match: (p) => p.startsWith("/templates") },
  { href: "/brand", label: "Brand", icon: Palette, match: (p) => p.startsWith("/brand") },
  { href: "/creators", label: "Creators", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const secondaryNav: NavItem[] = [
  { href: "/generations", label: "History", icon: History },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/credits", label: "Credits", icon: Sparkles },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/workspace", label: "Workspace", icon: Building2 },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/help", label: "Help", icon: BookOpen },
];

/** Default page titles by route prefix (TopBar falls back to these). */
export const routeTitles: [string, string][] = [
  ["/home", "Home"], ["/studio/image", "Image generator"], ["/studio/video", "Video generator"], ["/studio/ugc", "UGC creator"],
  ["/studio/product-shoot", "AI product shoot"], ["/studio/ads", "Ad creator"], ["/studio/copy", "Copywriter"], ["/studio", "Studio"],
  ["/projects", "Projects"], ["/assets", "Assets"], ["/campaigns", "Campaigns"], ["/templates", "Templates"],
  ["/brand/voice", "Brand voice"], ["/brand", "Brand kit"], ["/creators", "Creators"], ["/generations", "Generation history"],
  ["/favorites", "Favorites"], ["/credits", "Credits"], ["/pricing", "Pricing"], ["/notifications", "Notifications"],
  ["/workspace", "Workspace"], ["/profile", "Profile"], ["/settings", "Settings"], ["/help", "Help"],
];

export function titleForPath(path: string): string {
  return routeTitles.find(([p]) => path === p || path.startsWith(p + "/"))?.[1] ?? "Marketing Studio";
}

export function isActive(item: NavItem, path: string): boolean {
  return item.match ? item.match(path) : path === item.href || path.startsWith(item.href + "/");
}
