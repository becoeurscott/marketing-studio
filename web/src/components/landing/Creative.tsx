"use client";

import { Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type CreativeKind = "wax" | "shea" | "wig" | "phone" | "plate" | "jersey" | "fashion";

export interface CreativeData {
  kind: CreativeKind;
  title: string;
  tag: string;
  /** Where the creative is published (shown as a badge). */
  platform: string;
  bg: string;
  video?: boolean;
  /** Price tag shown on the visual, in local currency. */
  price?: string;
  /** Generated visual from /public: a UGC video (/showcase/ugc/*.mp4, poster .jpg alongside) or a style photo. */
  media: string;
}

/**
 * Example creatives for the hero carousel, the gallery marquee and the use cases, all generated with
 * Sokozia (Higgsfield): UGC videos in /public/showcase/ugc and style photos in /public/styles.
 * Index order matters: [0] WhatsApp status mockup, [3] upload visual, [1]/[4] publish visual.
 */
const UGC = (slug: string) => `/showcase/ugc/${slug}.mp4`;
const STYLE = (id: string) => `/styles/${id}.jpg`;

export const CREATIVES: CreativeData[] = [
  { kind: "wax", title: "Nouvel arrivage wax", tag: "Vidéo UGC", platform: "Statut WhatsApp", price: "15 000 FCFA", video: true, bg: "from-[#3b1d0a] via-[#c2410c] to-[#fbbf24]", media: UGC("vendeuse-marche-wax") },
  { kind: "plate", title: "Garba du quartier", tag: "Micro-trottoir", platform: "TikTok", video: true, bg: "from-[#1c0f08] via-[#7c3f1d] to-[#f5c28b]", media: UGC("micro-trottoir-garba") },
  { kind: "shea", title: "Beurre de karité pur", tag: "Photo produit", platform: "Instagram", price: "7 500 FCFA", bg: "from-[#2b1a05] via-[#a16207] to-[#fde68a]", media: STYLE("marche-africain") },
  { kind: "shea", title: "Fiche catalogue", tag: "Catalogue WhatsApp", platform: "WhatsApp Business", bg: "from-[#f5f5f4] via-[#e7e5e4] to-[#d6d3d1]", media: STYLE("catalogue") },
  { kind: "wig", title: "Perruque lisse 22 pouces", tag: "Get ready with me", platform: "Instagram", price: "45 000 FCFA", video: true, bg: "from-[#3b0a1e] via-[#9d174d] to-[#fbcfe8]", media: UGC("grwm-perruque") },
  { kind: "phone", title: "Boutique de téléphones", tag: "Déballage", platform: "Facebook", price: "95 000 FCFA", video: true, bg: "from-[#0f172a] via-[#1e3a8a] to-[#60a5fa]", media: UGC("unboxing-telephone") },
  { kind: "plate", title: "Livraison en 2 heures", tag: "Commande WhatsApp", platform: "Statut WhatsApp", video: true, bg: "from-[#3a0d06] via-[#c2410c] to-[#fed7aa]", media: UGC("livraison-whatsapp") },
  { kind: "fashion", title: "Tenue sur mesure", tag: "Fit check atelier", platform: "Instagram", video: true, bg: "from-[#0b0b0b] via-[#3f3f46] to-[#d4d4d8]", media: UGC("atelier-couture") },
  { kind: "shea", title: "Témoignage karité", tag: "Témoignage", platform: "TikTok", video: true, bg: "from-[#2b1a05] via-[#a16207] to-[#fde68a]", media: UGC("temoignage-karite") },
  { kind: "plate", title: "Poulet braisé", tag: "Dégustation", platform: "Facebook", video: true, bg: "from-[#1c0f08] via-[#7c3f1d] to-[#f5c28b]", media: UGC("degustation-maquis") },
  { kind: "shea", title: "Collection luxe", tag: "Style Luxe doré", platform: "Instagram", price: "12 000 FCFA", bg: "from-[#0b0b0b] via-[#3f3f46] to-[#d4d4d8]", media: STYLE("luxe-dore") },
  { kind: "fashion", title: "Bazin brodé Tabaski", tag: "Promo fête", platform: "Statut WhatsApp", video: true, bg: "from-[#3b1d0a] via-[#c2410c] to-[#fbbf24]", media: UGC("promo-tabaski") },
];

/** Plays only while on screen and loads nothing before (the gallery repeats items; keep mobile data low). */
function LazyVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? void el.play().catch(() => {}) : el.pause()), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} src={src} poster={src.replace(/\.mp4$/, ".jpg")} muted loop playsInline preload="none" className="absolute inset-0 size-full object-cover" />;
}

/** `bare` hides the platform badge and caption, for use as a plain thumbnail. */
export function Creative({ data, className, compact, bare }: { data: CreativeData; className?: string; compact?: boolean; bare?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-br", data.bg, className)}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.28),transparent_60%)]" />
      {/\.(mp4|webm|mov)(\?|$)/i.test(data.media) ? (
        <LazyVideo src={data.media} />
      ) : (
        <img src={data.media} alt={data.title} loading="lazy" className="absolute inset-0 size-full object-cover" />
      )}
      {!bare && <Overlay data={data} compact={compact} />}
    </div>
  );
}

function Overlay({ data, compact }: { data: CreativeData; compact?: boolean }) {
  return (
    <>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate rounded-full bg-black/45 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-white">{data.platform}</span>
        {data.price && !data.video && !compact && (
          <span className="ml-auto shrink-0 whitespace-nowrap rotate-3 rounded-md bg-highlight px-2 py-0.5 text-[11px] font-extrabold text-on-accent shadow-lg">{data.price}</span>
        )}
        {data.video && (
          <span className="size-6 shrink-0 rounded-full bg-white/25 backdrop-blur flex items-center justify-center">
            <Play className="size-3 text-white fill-white" />
          </span>
        )}
      </div>
      <div className={cn("absolute inset-x-0 bottom-0", compact ? "p-2.5" : "p-4")}>
        <p className={cn("font-semibold text-white leading-tight", compact ? "text-xs" : "text-base")}>{data.title}</p>
        {!compact && (
          <span className="mt-2 inline-block rounded-full bg-[#25D366] text-black px-3 py-1 text-[11px] font-semibold">Commander sur WhatsApp</span>
        )}
      </div>
    </>
  );
}
