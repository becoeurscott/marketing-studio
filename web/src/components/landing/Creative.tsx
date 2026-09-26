import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type CreativeKind = "serum" | "sneaker" | "coffee" | "watch" | "perfume" | "phone" | "bag" | "juice";

export interface CreativeData {
  kind: CreativeKind;
  title: string;
  tag: string;
  platform: string;
  bg: string;
  video?: boolean;
  /** Real visual from /public, e.g. "/showcase/sneaker.mp4" or "/showcase/serum.jpg". Falls back to the CSS mockup when absent. */
  media?: string;
}

/** Example creatives shown in the hero carousel and the gallery marquee. Higgsfield Marketing Studio template previews, hotlinked and credited. */
export const CREATIVES: CreativeData[] = [
  { kind: "serum", title: "Chilled Can", tag: "Photo produit", platform: "Higgsfield", bg: "from-[#2a1540] via-[#6b2fa8] to-[#e9b8ff]", media: "https://cdn.higgsfield.ai/cdn-cgi/image/width=720,quality=80,format=auto/marketing-studio-v2-product-shots-people/834bb6b2-3a9b-48dd-9889-6934c765ccc2.webp" },
  { kind: "sneaker", title: "Wheatpaste Wall", tag: "Pub vidéo", platform: "Higgsfield", bg: "from-[#0f172a] via-[#1e3a8a] to-[#60a5fa]", video: true, media: "https://cdn.higgsfield.ai/marketing-studio-motion-preview/458431c6-813b-42b2-9adc-bbf380d8c106.mp4" },
  { kind: "coffee", title: "Ice Cube Hover", tag: "Photo produit", platform: "Higgsfield", bg: "from-[#1c0f08] via-[#7c3f1d] to-[#f5c28b]", media: "https://cdn.higgsfield.ai/cdn-cgi/image/width=720,quality=80,format=auto/marketing-studio-v2-product-shot/941ef07a-c2ab-5a0e-ac67-4e6c762c8ef2.webp" },
  { kind: "watch", title: "90s Bedroom CRT", tag: "Mixed media", platform: "Higgsfield", bg: "from-[#0b0b0b] via-[#3f3f46] to-[#d4d4d8]", video: true, media: "https://cdn.higgsfield.ai/marketing-studio-motion-preview/18bbd999-1cf7-429d-9e1d-67acf7d8769f.mp4" },
  { kind: "perfume", title: "Brushed Tin", tag: "Photo lifestyle", platform: "Higgsfield", bg: "from-[#3b0a1e] via-[#9d174d] to-[#fbcfe8]", media: "https://cdn.higgsfield.ai/cdn-cgi/image/width=720,quality=80,format=auto/marketing-studio-v2-product-shots-people/862de749-aa5c-4816-b028-7e254d969759.webp" },
  { kind: "phone", title: "Pixel Block Yard", tag: "Motion", platform: "Higgsfield", bg: "from-[#052e2b] via-[#0f766e] to-[#99f6e4]", video: true, media: "https://cdn.higgsfield.ai/marketing-studio-motion-preview/353daae1-e520-486b-b7d5-83f026169305.mp4" },
  { kind: "bag", title: "Linen Lid Lift", tag: "Photo produit", platform: "Higgsfield", bg: "from-[#2b1a05] via-[#a16207] to-[#fde68a]", media: "https://cdn.higgsfield.ai/cdn-cgi/image/width=720,quality=80,format=auto/marketing-studio-v2-product-shot/36052145-6b41-51f2-95c1-7a0f0393a112.webp" },
  { kind: "juice", title: "Monospace Callouts", tag: "Pub motion", platform: "Higgsfield", bg: "from-[#3a0d06] via-[#c2410c] to-[#fed7aa]", video: true, media: "https://cdn.higgsfield.ai/marketing-studio-motion-preview/aef59e19-f388-4dcc-b55a-e43a5c48c835.mp4" },
];

function Product({ kind }: { kind: CreativeKind }) {
  const glass = "bg-gradient-to-b from-white/70 to-white/25 border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm";
  switch (kind) {
    case "serum":
      return (
        <div className="flex w-full flex-col items-center">
          <div className="w-[18%] aspect-[1/1.2] min-w-4 rounded-t-md bg-black/80" />
          <div className={cn("w-[34%] aspect-[1/1.6] rounded-2xl", glass)} />
        </div>
      );
    case "perfume":
      return (
        <div className="flex w-full flex-col items-center">
          <div className="w-[16%] aspect-square rounded-sm bg-gradient-to-b from-amber-200 to-amber-500" />
          <div className={cn("w-[46%] aspect-square rounded-[30%]", glass)} />
        </div>
      );
    case "sneaker":
      return <div className="w-[70%] aspect-[2.4/1] rounded-[60%_40%_18%_18%] bg-gradient-to-br from-white to-slate-300 shadow-[0_20px_40px_rgba(0,0,0,0.45)] border-b-8 border-slate-900/80" />;
    case "coffee":
      return (
        <div className="relative w-[44%] aspect-[1/1.1]">
          <div className="absolute inset-0 rounded-b-[40%] rounded-t-lg bg-gradient-to-b from-[#fff7ed] to-[#fcd9b0] shadow-[0_20px_40px_rgba(0,0,0,0.4)]" />
          <div className="absolute -right-[22%] top-[22%] w-[34%] aspect-square rounded-full border-[6px] border-[#fcd9b0]" />
        </div>
      );
    case "watch":
      return (
        <div className="flex w-full flex-col items-center">
          <div className="w-[22%] aspect-[1/1] bg-zinc-800 rounded-t-md" />
          <div className="w-[46%] aspect-square rounded-full bg-gradient-to-br from-zinc-100 to-zinc-400 border-[6px] border-zinc-800 shadow-[0_20px_40px_rgba(0,0,0,0.5)]" />
          <div className="w-[22%] aspect-[1/1] bg-zinc-800 rounded-b-md" />
        </div>
      );
    case "phone":
      return <div className="w-[36%] aspect-[1/2] rounded-[22%/11%] bg-gradient-to-b from-zinc-900 to-black border-2 border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.5)]" />;
    case "bag":
      return (
        <div className="relative w-[50%] aspect-square mt-[10%]">
          <div className="absolute left-1/2 -translate-x-1/2 -top-[26%] w-[46%] aspect-square rounded-full border-[6px] border-amber-900/80" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-100 to-amber-300 shadow-[0_20px_40px_rgba(0,0,0,0.4)]" />
        </div>
      );
    case "juice":
      return (
        <div className="flex w-full flex-col items-center">
          <div className="w-[20%] aspect-[1/0.5] rounded-t-sm bg-white/80" />
          <div className={cn("w-[34%] aspect-[1/1.9] rounded-xl", glass, "from-orange-100/80 to-orange-300/50")} />
        </div>
      );
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
        {data.video && (
          <span className="size-6 rounded-full bg-white/25 backdrop-blur flex items-center justify-center">
            <Play className="size-3 text-white fill-white" />
          </span>
        )}
      </div>
      <div className={cn("absolute inset-x-0 bottom-0", compact ? "p-2.5" : "p-4")}>
        <p className={cn("font-semibold text-white leading-tight", compact ? "text-xs" : "text-base")}>{data.title}</p>
        {!compact && (
          <span className="mt-2 inline-block rounded-full bg-white text-black px-3 py-1 text-[11px] font-medium">Acheter</span>
        )}
      </div>
    </>
  );
}
