/* ---------- Primitives ---------- */
import type { CountryCode, LanguageId } from "./market";

export type ID = string;
export type ISODate = string;

export type Platform = "whatsapp" | "instagram" | "tiktok" | "facebook" | "youtube" | "google" | "pinterest";
export type AdFormat = "image" | "video" | "carousel" | "story" | "reel" | "short" | "status" | "catalog" | "flyer";
export type CampaignFormat = "product-photos" | "ugc" | "video-ads" | "stories" | "carousels";
export type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9" | "3:2";
export type Tone = "professional" | "friendly" | "luxury" | "bold" | "funny" | "minimal" | "urgent";

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
  { id: "youtube", label: "YouTube" },
  { id: "google", label: "Google" },
  { id: "pinterest", label: "Pinterest" },
];

export const IMAGE_STYLES = [
  "Product Photography", "Luxury", "Minimal", "Street", "Lifestyle", "Editorial",
  "Cinematic", "UGC", "Studio", "Fashion", "Food", "Tech",
] as const;
export type ImageStyle = (typeof IMAGE_STYLES)[number];

export const RATIOS: AspectRatio[] = ["1:1", "4:5", "9:16", "16:9", "3:2"];

/* ---------- User & workspace ---------- */
export interface User {
  id: ID;
  name: string;
  email: string;
  company: string;
  role: string;
  avatarUrl: string;
  createdAt: ISODate;
}

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export interface WorkspaceMember {
  id: ID;
  name: string;
  email: string;
  role: WorkspaceRole;
  avatarUrl: string;
  status: "active" | "invited";
  joinedAt: ISODate;
}

export interface Workspace {
  id: ID;
  name: string;
  members: WorkspaceMember[];
}

/* ---------- Projects ---------- */
export type ProjectStatus = "active" | "archived";

export interface Project {
  id: ID;
  name: string;
  description: string;
  brandId: ID;
  thumbnail: string;
  status: ProjectStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ---------- Assets ---------- */
export type AssetType = "image" | "video" | "audio" | "logo" | "brand" | "export";

export interface Asset {
  id: ID;
  name: string;
  type: AssetType;
  url: string;
  thumbnail: string;
  projectId: ID | null;
  favorite: boolean;
  width?: number;
  height?: number;
  durationSec?: number;
  sizeKb: number;
  tags: string[];
  createdAt: ISODate;
}

/* ---------- Campaigns ---------- */
export type CampaignObjective = "awareness" | "engagement" | "leads" | "sales";
export type CampaignStatus = "draft" | "active" | "completed";
export type CalendarStatus = "draft" | "scheduled" | "published";

export interface CalendarItem {
  id: ID;
  campaignId: ID;
  date: ISODate;
  platform: Platform;
  format: AdFormat;
  status: CalendarStatus;
  assetId: ID | null;
  title: string;
}

export interface AdVariation {
  id: ID;
  label: "A" | "B" | "C" | "D";
  visual: string;
  headline: string;
  primaryText: string;
  cta: string;
  platform: Platform;
  format: AdFormat;
}

export interface CampaignAnalytics {
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  conversions: number;
  spend: number;
  roas: number;
  daily: { date: ISODate; impressions: number; clicks: number; conversions: number }[];
}

export interface Campaign {
  id: ID;
  name: string;
  projectId: ID;
  objective: CampaignObjective;
  audience: string;
  platforms: Platform[];
  formats: CampaignFormat[];
  status: CampaignStatus;
  assetIds: ID[];
  variations: AdVariation[];
  calendar: CalendarItem[];
  copy: CopyResult[];
  analytics?: CampaignAnalytics;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ---------- Templates ---------- */
export type TemplateCategory =
  | "Wax & Couture" | "Cosmetics" | "Restaurant" | "Electronics" | "Hair" | "Grocery"
  | "WhatsApp" | "Print" | "UGC" | "Promo";

export type StudioMode = "image" | "video" | "ugc" | "product-shoot" | "ads" | "copy";

export interface TemplatePreset {
  mode: StudioMode;
  prompt?: string;
  style?: ImageStyle;
  ratio?: AspectRatio;
  durationSec?: 5 | 10 | 15;
  camera?: string;
  platform?: Platform;
  format?: AdFormat;
  tone?: Tone;
  language?: LanguageId;
}

export interface Template {
  id: ID;
  title: string;
  description: string;
  category: TemplateCategory;
  platform: Platform;
  format: AdFormat;
  thumbnail: string;
  preset: TemplatePreset;
  popular: boolean;
  uses: number;
}

/* ---------- Creators ---------- */
export interface Creator {
  id: ID;
  name: string;
  gender: "female" | "male" | "non-binary";
  ageRange: string;
  age: number;
  style: string;
  languages: string[];
  country?: string;
  avatarUrl: string;
  /** Generated portrait (also used as avatar). */
  portrait: string;
  /** Character reference sheet (front, 3/4, profile, full body), sent as reference for videos. */
  sheet: string;
  /** Short intro clip, when generated. */
  intro?: string;
  /** Fixed appearance description, repeated in every generation prompt. */
  look: string;
  bio: string;
  featured: boolean;
}

/* ---------- Generations ---------- */
export type GenerationType = "image" | "video" | "copy" | "ad";
export type GenerationStatus = "queued" | "processing" | "completed" | "failed";

export interface Generation {
  id: ID;
  type: GenerationType;
  prompt: string;
  status: GenerationStatus;
  thumbnails: string[];
  projectId: ID | null;
  params: Record<string, string | number | boolean>;
  creditsUsed: number;
  createdAt: ISODate;
}

/* ---------- Brand ---------- */
export type BrandTone = "Luxury" | "Friendly" | "Bold" | "Playful" | "Professional";

export interface BrandVoice {
  tone: BrandTone;
  writingStyle: string;
  keywords: string[];
  avoid: string[];
}

export interface BrandAsset {
  id: ID;
  kind: "primary-logo" | "icon" | "product";
  name: string;
  url: string;
}

export interface Brand {
  id: ID;
  name: string;
  logoUrl: string;
  colors: string[];
  fonts: { heading: string; body: string };
  website: string;
  /** Number customers write to, used by "Commander sur WhatsApp" buttons. */
  whatsapp?: string;
  description: string;
  industry: string;
  audience: string;
  styleTags: string[];
  assets: BrandAsset[];
  voice: BrandVoice;
  createdAt: ISODate;
}

/* ---------- Notifications ---------- */
export type NotificationKind =
  | "generation-complete" | "campaign-ready" | "export-complete"
  | "credits-low" | "new-template" | "project-shared";

export interface Notification {
  id: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  href?: string;
  createdAt: ISODate;
}

/* ---------- Copy ---------- */
export type CopyTool =
  | "ad-copy" | "product-description" | "instagram-caption" | "tiktok-caption"
  | "email" | "headline" | "hook" | "cta" | "ugc-script" | "landing-page"
  | "whatsapp-status" | "whatsapp-catalog" | "voice-note";

export interface CopyResult {
  id: ID;
  tool: CopyTool;
  title: string;
  text: string;
  tone: Tone;
  platform?: Platform;
  language?: LanguageId;
  createdAt: ISODate;
}

export interface SavedHook {
  id: ID;
  text: string;
  product: string;
  createdAt: ISODate;
}

/* ---------- Credits, plans ---------- */
export type CreditAction = "image" | "video" | "upscale" | "copy" | "ads" | "ugc" | "product-shoot" | "export" | "purchase" | "bonus";

export const CREDIT_COSTS: Record<Exclude<CreditAction, "purchase" | "bonus">, number> = {
  image: 44,
  video: 65,
  upscale: 72,
  copy: 0, // template-based text, free until a real text model is wired
  ads: 88,
  ugc: 168,
  "product-shoot": 132,
  export: 0,
};

export interface CreditTransaction {
  id: ID;
  action: CreditAction;
  amount: number; // negative = spent, positive = added
  description: string;
  createdAt: ISODate;
}

export type PlanId = "starter" | "creator" | "studio" | "agency";

export interface Plan {
  id: PlanId;
  name: string;
  /** Monthly price in FCFA; converted per country with lib/market.ts. */
  priceXof: number;
  credits: number;
  features: {
    generations: string;
    projects: string;
    brandKits: string;
    campaigns: string;
    videoGenerations: string;
    teamMembers: string;
  };
  highlights: string[];
  popular?: boolean;
}

/* ---------- Analytics (global) ---------- */
export interface AnalyticsSummary {
  totals: { generations: number; exports: number; campaigns: number; assets: number };
  weekly: { week: string; images: number; videos: number; copy: number; ads: number }[];
  topFormats: { format: string; share: number }[];
}

/* ---------- Onboarding & prefs ---------- */
export interface OnboardingAnswers {
  creating: string | null;
  role: string | null;
  wants: string[];
  platforms: Platform[];
  goal: string | null;
  /** Campaign-first onboarding (optional for older persisted state). */
  style?: string | null;
  boldness?: string | null;
  brandKit?: boolean;
  product?: { name: string; category: string; description: string; sample: boolean } | null;
  country?: CountryCode;
}

export interface Preferences {
  defaultRatio: AspectRatio;
  defaultStyle: ImageStyle;
  reducedMotion: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  compactSidebar: boolean;
  /** Clean up blurry / badly lit phone photos before generating. */
  phonePhotoMode?: boolean;
  /** Smaller video files for slow connections and limited data plans. */
  lightVideos?: boolean;
  /** Default language for texts and voice-overs. */
  language?: LanguageId;
}

export type FavoriteKind = "asset" | "template" | "prompt" | "creator";

export interface Favorites {
  asset: ID[];
  template: ID[];
  prompt: ID[];
  creator: ID[];
}
