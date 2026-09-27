import { Play } from "lucide-react";
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
  /** Real visual from /public, e.g. "/showcase/food-street.mp4". Falls back to the CSS mockup when absent. */
  media?: string;
}

/**
 * Example creatives for the hero carousel, the gallery marquee and the use cases: products local merchants
 * actually sell. Items without `media` render a CSS mockup; drop a photo in /public/showcase and set `media`
 * to replace it.
 */
export const CREATIVES: CreativeData[] = [
  { kind: "wax", title: "Pagne wax 6 yards", tag: "Photo produit", platform: "Statut WhatsApp", price: "15 000 FCFA", bg: "from-[#3b1d0a] via-[#c2410c] to-[#fbbf24]" },
  { kind: "plate", title: "Garba du maquis", tag: "Vidéo UGC", platform: "TikTok", video: true, bg: "from-[#1c0f08] via-[#7c3f1d] to-[#f5c28b]", media: "/showcase/food-street.mp4" },
  { kind: "shea", title: "Beurre de karité pur", tag: "Photo produit", platform: "Instagram", price: "7 500 FCFA", bg: "from-[#2b1a05] via-[#a16207] to-[#fde68a]" },
  { kind: "jersey", title: "Maillots de foot", tag: "Vidéo UGC", platform: "TikTok", video: true, bg: "from-[#052e16] via-[#15803d] to-[#fde047]", media: "/showcase/jersey-brazil.mp4" },
  { kind: "wig", title: "Perruque lisse 22 pouces", tag: "Photo lifestyle", platform: "Instagram", price: "45 000 FCFA", bg: "from-[#3b0a1e] via-[#9d174d] to-[#fbcfe8]" },
  { kind: "phone", title: "Boutique de téléphones", tag: "Pub produit", platform: "Facebook", price: "95 000 FCFA", bg: "from-[#0f172a] via-[#1e3a8a] to-[#60a5fa]" },
  { kind: "plate", title: "Livraison de repas", tag: "Vidéo UGC", platform: "Statut WhatsApp", video: true, bg: "from-[#3a0d06] via-[#c2410c] to-[#fed7aa]", media: "/showcase/food-catch.mp4" },
  { kind: "fashion", title: "Nouvel arrivage mode", tag: "Photo lifestyle", platform: "Instagram", bg: "from-[#0b0b0b] via-[#3f3f46] to-[#d4d4d8]", media: "/showcase/street-fashion.webp" },
];

/** Repeating wax-print motif (concentric circles + diamonds), pure CSS. */
const WAX_PATTERN =
  "radial-gradient(circle at 25% 25%, #fde047 0 14%, #7c2d12 14% 20%, transparent 20%), radial-gradient(circle at 75% 75%, #16a34a 0 14%, #fde047 14% 20%, transparent 20%), conic-gradient(from 45deg at 50% 50%, #c2410c 0 25%, #1d4ed8 0 50%, #c2410c 0 75%, #1d4ed8 0)";

function Product({ kind }: { kind: CreativeKind }) {
  switch (kind) {
    case "wax":
      return (
        <div className="relative w-[62%] aspect-[1/1.1]">
          {/* Folded stack of fabric */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute inset-x-0 h-[34%] rounded-md border border-black/20 shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
              style={{ bottom: `${i * 30}%`, backgroundImage: WAX_PATTERN, backgroundSize: "28px 28px", filter: i === 1 ? "hue-rotate(140deg)" : i === 2 ? "hue-rotate(260deg)" : undefined }}
            />
          ))}
        </div>
      );
    case "shea":
      return (
        <div className="flex w-full flex-col items-center">
          <div className="w-[46%] aspect-[1/0.28] rounded-t-lg bg-gradient-to-b from-amber-700 to-amber-900" />
          <div className="relative w-[50%] aspect-[1/0.8] rounded-b-2xl rounded-t-sm bg-gradient-to-b from-[#fff7e6] to-[#f3dfb8] shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-x-[14%] top-[28%] bottom-[28%] rounded-md bg-amber-800/85 flex items-center justify-center">
              <span className="text-[9px] font-bold tracking-wide text-amber-100">KARITÉ</span>
            </div>
          </div>
        </div>
      );
    case "wig":
      return (
        <div className="relative w-[48%] aspect-[1/1.5]">
          <div className="absolute inset-x-0 top-0 h-[40%] rounded-t-full bg-gradient-to-b from-zinc-800 to-zinc-950" />
          <div className="absolute inset-x-[-6%] top-[26%] bottom-0 rounded-b-[40%] bg-[repeating-linear-gradient(90deg,#18181b_0_6px,#3f3f46_6px_8px)] shadow-[0_20px_40px_rgba(0,0,0,0.45)]" />
          <div className="absolute inset-x-[24%] top-[22%] h-[40%] rounded-full bg-[#8a5a3b]" />
        </div>
      );
    case "phone":
      return (
        <div className="flex items-end gap-[6%] w-full justify-center">
          {[0.82, 1, 0.82].map((scale, i) => (
            <div key={i} className="w-[24%] aspect-[1/2] rounded-[22%/11%] bg-gradient-to-b from-zinc-800 to-black border-2 border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.5)]" style={{ transform: `scale(${scale})` }}>
              <div className="m-[10%] h-[80%] rounded-[16%/8%] bg-gradient-to-br from-sky-400 to-fuchsia-500 opacity-80" />
            </div>
          ))}
        </div>
      );
    case "plate":
    case "jersey":
    case "fashion":
      return <div className="w-[55%] aspect-square rounded-full bg-white/20 border border-white/30" />;
  }
}

/** `bare` hides the platform badge and caption, for use as a plain thumbnail. */
export function Creative({ data, className, compact, bare }: { data: CreativeData; className?: string; compact?: boolean; bare?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-br", data.bg, className)}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.28),transparent_60%)]" />
      {data.media ? (
        /\.(mp4|webm|mov)(\?|$)/i.test(data.media) ? (
          <video src={data.media} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 size-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.media} alt={data.title} className="absolute inset-0 size-full object-cover" />
        )
      ) : (
        <div className="absolute inset-0 flex items-center justify-center pb-[18%]">
          {/* Square box sized by card height, so products keep proportions in any aspect ratio. */}
          <div className="flex h-[80%] max-w-full aspect-square items-center justify-center">
            <Product kind={data.kind} />
          </div>
        </div>
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
        <span className="rounded-full bg-black/45 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-white">{data.platform}</span>
        {data.price && !data.video && (
          <span className="ml-auto rotate-3 rounded-md bg-highlight px-2 py-0.5 text-[11px] font-extrabold text-white shadow-lg">{data.price}</span>
        )}
        {data.video && (
          <span className="size-6 rounded-full bg-white/25 backdrop-blur flex items-center justify-center">
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
