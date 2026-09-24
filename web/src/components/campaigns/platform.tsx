"use client";

import { Globe, Music2, Pin } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { AdFormat, CalendarStatus, CampaignFormat, CampaignObjective, Platform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement>;
const svg = (props: IconProps) => ({ xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...props });

/* Brand glyphs (lucide-react 1.x no longer ships brand icons). */
const Instagram = (props: IconProps) => (
  <svg {...svg(props)}><rect width="20" height="20" x="2" y="2" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
);
const Facebook = (props: IconProps) => (
  <svg {...svg(props)}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);
const Youtube = (props: IconProps) => (
  <svg {...svg(props)}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
);

export const PLATFORM_ICONS: Record<Platform, ComponentType<IconProps>> = {
  instagram: Instagram,
  tiktok: Music2,
  facebook: Facebook,
  youtube: Youtube,
  google: Globe,
  pinterest: Pin,
};

export function platformLabel(p: Platform): string {
  return PLATFORMS.find((x) => x.id === p)?.label ?? p;
}

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const Icon = PLATFORM_ICONS[platform];
  return <Icon className={cn("size-4", className)} aria-label={platformLabel(platform)} />;
}

/** Row of small platform icons (used on cards and headers). */
export function PlatformIcons({ platforms, size = "sm", className }: { platforms: Platform[]; size?: "sm" | "md"; className?: string }) {
  return (
    <div className={cn("flex items-center -space-x-1", className)}>
      {platforms.map((p) => (
        <span
          key={p}
          title={platformLabel(p)}
          className={cn("rounded-full bg-elevated border border-border-strong flex items-center justify-center text-text2", size === "sm" ? "size-6" : "size-8")}
        >
          <PlatformIcon platform={p} className={size === "sm" ? "size-3" : "size-4"} />
        </span>
      ))}
    </div>
  );
}

export const OBJECTIVES: { id: CampaignObjective; label: string; description: string }[] = [
  { id: "awareness", label: "Awareness", description: "Reach new people and introduce the product." },
  { id: "engagement", label: "Engagement", description: "Drive saves, shares and comments." },
  { id: "leads", label: "Leads", description: "Collect sign-ups, waitlists and inquiries." },
  { id: "sales", label: "Sales", description: "Turn clicks into orders with offer-led creatives." },
];

export const CAMPAIGN_FORMATS: { id: CampaignFormat; label: string; description: string }[] = [
  { id: "product-photos", label: "Product photos", description: "Studio and lifestyle packshots." },
  { id: "ugc", label: "UGC", description: "Creator-style videos with a hook and demo." },
  { id: "video-ads", label: "Video ads", description: "Short cinematic product films." },
  { id: "stories", label: "Stories", description: "Vertical 9:16 story frames." },
  { id: "carousels", label: "Carousels", description: "Multi-slide proof and benefits." },
];

export const AD_FORMATS: { id: AdFormat; label: string }[] = [
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "carousel", label: "Carousel" },
  { id: "story", label: "Story" },
  { id: "reel", label: "Reel" },
  { id: "short", label: "Short" },
];

export const CALENDAR_STATUSES: { id: CalendarStatus; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
];

export function objectiveLabel(o: CampaignObjective): string {
  return OBJECTIVES.find((x) => x.id === o)?.label ?? o;
}
export function formatLabel(f: CampaignFormat): string {
  return CAMPAIGN_FORMATS.find((x) => x.id === f)?.label ?? f;
}
export function adFormatLabel(f: AdFormat): string {
  return AD_FORMATS.find((x) => x.id === f)?.label ?? f;
}
