"use client";

import { useReducedMotion } from "framer-motion";
import {
  ArrowRight, Check, Copy, Loader2, Pencil, Plus, RefreshCw, UserRound, Wand2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Appear, CtaBar, Img, MEDIA, ProductBadge, ScreenTitle, Video, type ProductInfo } from "./shared";

type RevealProps = { product: ProductInfo; onNext: () => void };

const Next = ({ onNext, label = "Continuer" }: { onNext: () => void; label?: string }) => (
  <Button size="lg" onClick={onNext} rightIcon={<ArrowRight className="size-4" />}>{label}</Button>
);

/* 9. Generation */
const GEN_STEPS = [
  "Analyse du produit", "Direction créative", "Photos produit", "Accroches",
  "Concept UGC", "Textes pub", "Variantes par plateforme", "Préparation de la campagne",
];

export function GenerationScreen({ product, onDone }: { product: ProductInfo; onDone: () => void }) {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done >= GEN_STEPS.length) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((d) => d + 1), reduce ? 250 : 700);
    return () => clearTimeout(t);
  }, [done, onDone, reduce]);
  return (
    <div className="w-full max-w-sm">
      <div className="mx-auto size-24 rounded-2xl overflow-hidden border border-accent/50 shadow-glow mb-5">
        <Img src={product.image} alt={product.name} />
      </div>
      <h1 className="text-2xl font-semibold text-center mb-6">Construction de votre campagne…</h1>
      <ul className="space-y-3" aria-live="polite">
        {GEN_STEPS.map((s, i) => {
          const state = i < done ? "done" : i === done ? "active" : "todo";
          return (
            <li key={s} className={cn("flex items-center gap-3 text-[15px] transition-opacity", state === "todo" && "opacity-35")}>
              <span className={cn("size-6 rounded-full flex items-center justify-center shrink-0",
                state === "done" ? "bg-accent text-on-accent" : "bg-white/5")}>
                {state === "done" && <Check className="size-3.5" />}
                {state === "active" && <Loader2 className="size-3.5 animate-spin text-highlight" />}
              </span>
              {s}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* 10. Photos */
export function PhotosScreen({ product, onNext }: RevealProps) {
  return (
    <div className="w-full max-w-2xl">
      <ScreenTitle title="Votre produit vient d'avoir son shooting." subtitle="Sans photographe." />
      <div className="grid grid-cols-2 gap-3">
        {MEDIA.photos.map((src, i) => (
          <Appear key={src} delay={i * 0.12} className="relative aspect-[4/5] rounded-xl overflow-hidden border border-border-strong">
            <Img src={src} alt={`Photo produit ${i + 1}`} />
            <ProductBadge product={product} />
          </Appear>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        <Button variant="secondary" size="sm" leftIcon={<Pencil className="size-3.5" />}>Modifier</Button>
        <Button variant="secondary" size="sm" leftIcon={<Wand2 className="size-3.5" />}>Générer plus</Button>
        <Button variant="secondary" size="sm" leftIcon={<Plus className="size-3.5" />}>Ajouter à la campagne</Button>
      </div>
      <CtaBar><Next onNext={onNext} /></CtaBar>
    </div>
  );
}

/* 11. UGC */
const CREATORS = [
  { name: "Maya", tag: "Lifestyle", video: MEDIA.videos[1] },
  { name: "Inès", tag: "Beauté", video: MEDIA.videos[2] },
  { name: "Léo", tag: "Tech & gadgets", video: MEDIA.videos[0] },
];

export function UgcScreen({ product, onNext }: RevealProps) {
  const [idx, setIdx] = useState(0);
  const c = CREATORS[idx];
  return (
    <div className="w-full max-w-md">
      <ScreenTitle title="Maintenant, rendons-le humain." />
      <div className="relative mx-auto w-[220px] md:w-[260px] aspect-[9/16] rounded-[28px] overflow-hidden border-4 border-elevated shadow-glow">
        <Video key={c.video} src={c.video} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />
        <div className="absolute top-3 left-3 flex items-center gap-2 text-xs">
          <span className="size-7 rounded-full bg-accent/80 flex items-center justify-center"><UserRound className="size-4" /></span>
          <span className="font-medium">{c.name} · {c.tag}</span>
        </div>
        <ProductBadge product={product} className="top-12 right-3" />
        <p className="absolute bottom-4 inset-x-4 text-sm font-medium leading-snug">
          « Franchement, ce {product.sample ? "karité" : "produit"}, je l’utilise depuis une semaine… »
        </p>
      </div>
      <p className="text-center text-xs text-muted mt-3">Concept UGC 15 s · TikTok / Reels</p>
      <div className="flex justify-center mt-3">
        <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="size-3.5" />} onClick={() => setIdx((i) => (i + 1) % CREATORS.length)}>
          Générer un autre créateur
        </Button>
      </div>
      <CtaBar><Next onNext={onNext} /></CtaBar>
    </div>
  );
}

/* 12. Ads */
export function AdsScreen({ product, onNext }: RevealProps) {
  const ads = [
    { k: "A", media: MEDIA.photos[1], headline: `Le secret d'un éclat naturel`, text: `${product.name} : visible dès la première semaine.`, cta: "Acheter", platforms: "Instagram · Facebook" },
    { k: "B", media: MEDIA.videos[0], video: true, headline: "Tout le monde en parle", text: "Rejoignez des milliers de clients conquis.", cta: "Découvrir", platforms: "TikTok · Reels" },
    { k: "C", media: MEDIA.photos[3], headline: "-20 % cette semaine", text: `Offrez-vous ${product.name} à prix doux.`, cta: "J'en profite", platforms: "Facebook · Google" },
  ];
  return (
    <div className="w-full max-w-3xl">
      <ScreenTitle title="Votre produit mérite plus d'une pub." />
      <div className="flex md:grid md:grid-cols-3 gap-3 overflow-x-auto snap-x snap-mandatory -mx-5 px-5 md:mx-0 md:px-0 pb-2">
        {ads.map((a, i) => (
          <Appear key={a.k} delay={i * 0.1} className="snap-center shrink-0 w-[72%] md:w-auto rounded-2xl bg-surface border border-border-strong overflow-hidden">
            <div className="relative aspect-square">
              {a.video ? <Video src={a.media} /> : <Img src={a.media} />}
              <span className="absolute top-2 left-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/60">Créa {a.k}</span>
              <ProductBadge product={product} />
            </div>
            <div className="p-3 space-y-1.5">
              <p className="font-semibold text-sm">{a.headline}</p>
              <p className="text-xs text-text2">{a.text}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted">{a.platforms}</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-accent text-on-accent">{a.cta}</span>
              </div>
            </div>
          </Appear>
        ))}
      </div>
      <CtaBar><Next onNext={onNext} /></CtaBar>
    </div>
  );
}

/* 13. Copy */
export function CopyScreen({ product, onNext }: RevealProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const blocks = [
    { t: "Accroche", v: `Arrêtez de scroller : ${product.name} va changer votre routine.` },
    { t: "Légende", v: `Nouvelle obsession. ${product.name}, testé et adopté. Lien en bio !` },
    { t: "Script UGC", v: `« Ok, je teste ${product.name} depuis une semaine… et honnêtement ? Je ne reviendrai pas en arrière. »` },
    { t: "Description produit", v: product.description },
  ];
  const copy = (b: { t: string; v: string }) => {
    navigator.clipboard?.writeText(b.v).catch(() => {});
    setCopied(b.t);
    setTimeout(() => setCopied(null), 1400);
  };
  return (
    <div className="w-full max-w-xl">
      <ScreenTitle title="Votre campagne a une voix." />
      <div className="space-y-3">
        {blocks.map((b, i) => (
          <Appear key={b.t} delay={i * 0.1} className="rounded-xl bg-surface border border-border-strong p-4">
            <p className="text-[11px] uppercase tracking-wider text-highlight mb-1">{b.t}</p>
            <p className="text-sm">{b.v}</p>
            <div className="flex gap-1 mt-2 -ml-2">
              <Button variant="ghost" size="sm" leftIcon={copied === b.t ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} onClick={() => copy(b)}>
                {copied === b.t ? "Copié" : "Copier"}
              </Button>
              <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="size-3.5" />}>Régénérer</Button>
              <Button variant="ghost" size="sm" leftIcon={<Pencil className="size-3.5" />}>Modifier</Button>
            </div>
          </Appear>
        ))}
      </div>
      <CtaBar><Next onNext={onNext} /></CtaBar>
    </div>
  );
}

/* 14. Full campaign */
export const CAMPAIGN_COUNTS = [
  ["Photos produit", 4], ["Vidéos UGC", 2], ["Variantes pub", 6], ["Posts sociaux", 8],
  ["Accroches", 12], ["Légendes", 6], ["Textes produit", 3],
] as const;
export const TOTAL = CAMPAIGN_COUNTS.reduce((s, [, n]) => s + n, 0);

export function FullCampaignScreen({ product, onNext }: RevealProps) {
  return (
    <div className="w-full max-w-md">
      <ScreenTitle title="Votre campagne est prête." />
      <div className="rounded-2xl bg-surface border border-accent/40 shadow-glow overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="size-12 rounded-lg overflow-hidden"><Img src={product.image} alt={product.name} /></div>
          <div><p className="font-semibold">{product.name}</p><p className="text-xs text-muted">{product.category}</p></div>
        </div>
        <ul className="p-4 space-y-2">
          {CAMPAIGN_COUNTS.map(([l, n], i) => (
            <Appear key={l} delay={i * 0.08} className="flex justify-between text-sm">
              <span className="text-text2">{l}</span><span className="font-medium">{n}</span>
            </Appear>
          ))}
        </ul>
        <div className="flex justify-between px-4 py-3 bg-accent/12 font-semibold">
          <span>TOTAL</span><span className="text-highlight">{TOTAL} contenus</span>
        </div>
      </div>
      <p className="text-center text-text2 mt-4">Une photo produit. Une campagne.</p>
      <CtaBar><Next onNext={onNext} /></CtaBar>
    </div>
  );
}

/* 15. Platform formatting */
export function FormatsScreen({ product, onNext }: RevealProps) {
  const formats = [
    { p: "TikTok", r: "9:16", cls: "aspect-[9/16] w-[88px] md:w-[120px]", media: MEDIA.videos[2], video: true },
    { p: "Instagram", r: "9:16", cls: "aspect-[9/16] w-[88px] md:w-[120px]", media: MEDIA.photos[2] },
    { p: "YouTube", r: "16:9", cls: "aspect-video w-[150px] md:w-[220px]", media: MEDIA.videos[3], video: true },
  ];
  return (
    <div className="w-full max-w-2xl">
      <ScreenTitle title="Un format pour chaque plateforme." subtitle="Chaque créa est préparée pour la plateforme ciblée." />
      <div className="flex flex-wrap items-end justify-center gap-3">
        {formats.map((f, i) => (
          <Appear key={f.p} delay={i * 0.15} className="flex flex-col items-center gap-2">
            <div className={cn("relative rounded-xl overflow-hidden border border-border-strong", f.cls)}>
              {f.video ? <Video src={f.media} /> : <Img src={f.media} />}
              <ProductBadge product={product} className="bottom-1.5 right-1.5 size-8" />
            </div>
            <span className="text-xs"><span className="font-medium">{f.p}</span> <span className="text-muted">{f.r}</span></span>
          </Appear>
        ))}
      </div>
      <CtaBar><Next onNext={onNext} /></CtaBar>
    </div>
  );
}

/* 16. Value reveal */
export function ValueScreen({ product, onNext }: RevealProps) {
  return (
    <div className="w-full max-w-xl text-center">
      <ScreenTitle title="Regardez ce que vous venez de créer." />
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="size-20 rounded-xl overflow-hidden border border-border-strong mx-auto"><Img src={product.image} alt={product.name} /></div>
          <p className="text-xs text-muted mt-1.5">1 photo</p>
        </div>
        <ArrowRight className="size-5 text-highlight" />
        <div className="grid grid-cols-3 gap-1">
          {[...MEDIA.photos, ...MEDIA.photos.slice(0, 2)].map((m, i) => (
            <div key={i} className="size-9 md:size-11 rounded-md overflow-hidden"><Img src={m} /></div>
          ))}
        </div>
        <span className="text-2xl font-semibold text-highlight">= {TOTAL}</span>
      </div>
      <p className="text-sm text-muted mt-2">contenus prêts à publier</p>
      <div className="mt-6 space-y-1.5 text-[15px] text-text2">
        {["Sans photographe.", "Sans designer.", "Sans rédacteur.", "Sans agence."].map((s, i) => (
          <Appear key={s} delay={0.2 + i * 0.15}>{s}</Appear>
        ))}
      </div>
      <CtaBar><Next onNext={onNext} /></CtaBar>
    </div>
  );
}

/* 17. Workflow avoided */
export function WorkflowScreen({ onNext }: { onNext: () => void }) {
  const old = ["Photographe", "Designer", "Vidéaste", "Rédacteur", "Designer pub", "Community manager", "Agence"];
  return (
    <div className="w-full max-w-xl">
      <ScreenTitle title="Créez votre marketing sans monter une équipe marketing." />
      <div className="rounded-2xl bg-surface border border-border p-4">
        <p className="text-xs uppercase tracking-wider text-muted mb-3">Traditionnellement</p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          {old.map((o, i) => (
            <span key={o} className="flex items-center gap-1.5">
              <span className="px-2 py-1 rounded-md bg-white/5 line-through decoration-white/30">{o}</span>
              {i < old.length - 1 && <ArrowRight className="size-3" />}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-accent/10 border border-accent/40 p-4 mt-3">
        <p className="text-xs uppercase tracking-wider text-highlight mb-3">Avec Sokozia</p>
        <div className="flex items-center justify-between gap-2 text-[11px] md:text-sm font-semibold">
          <span>UN PRODUIT</span><ArrowRight className="size-4 text-highlight shrink-0" />
          <span className="px-2 py-1 rounded-md bg-accent text-on-accent font-semibold">SOKOZIA</span><ArrowRight className="size-4 text-highlight shrink-0" />
          <span className="text-right">CAMPAGNE COMPLÈTE</span>
        </div>
      </div>
      <CtaBar><Next onNext={onNext} /></CtaBar>
    </div>
  );
}

/* 18. Campaign card */
export function CampaignCardScreen({ product, platformsCount, onNext }: RevealProps & { platformsCount: number }) {
  const tabs = ["Aperçu", "Visuels", "Pubs", "Vidéos", "Textes", "Calendrier"];
  return (
    <div className="w-full max-w-lg">
      <ScreenTitle title="Tout est rangé dans votre campagne." />
      <div className="rounded-2xl bg-surface border border-border-strong overflow-hidden">
        <div className="relative h-32"><Img src={MEDIA.photos[2]} /><div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" /></div>
        <div className="px-4 -mt-8 relative flex items-end gap-3">
          <div className="size-16 rounded-xl overflow-hidden border-2 border-surface"><Img src={product.image} alt={product.name} /></div>
          <div className="pb-1"><p className="font-semibold">Campagne · {product.name}</p><p className="text-xs text-muted">Brouillon · créée à l&apos;instant</p></div>
        </div>
        <div className="flex gap-1 overflow-x-auto px-4 mt-4 text-xs">
          {tabs.map((t, i) => <span key={t} className={cn("px-2.5 py-1.5 rounded-md whitespace-nowrap", i === 0 ? "bg-white/10 text-text" : "text-muted")}>{t}</span>)}
        </div>
        <div className="grid grid-cols-3 text-center p-4 gap-2">
          {[[TOTAL, "contenus"], [6, "variantes"], [Math.max(platformsCount, 1), "plateformes"]].map(([n, l]) => (
            <div key={l} className="rounded-lg bg-card py-3"><p className="text-lg font-semibold">{n}</p><p className="text-[11px] text-muted">{l}</p></div>
          ))}
        </div>
      </div>
      <CtaBar><Next onNext={onNext} label="Ouvrir la campagne" /></CtaBar>
    </div>
  );
}

/* 19. Calendar */
export function CalendarScreen({ product, onNext }: RevealProps) {
  const days = [
    ["LUN", "Reel Instagram", MEDIA.photos[0]], ["MAR", "UGC TikTok", MEDIA.photos[2]], ["MER", "Carrousel produit", MEDIA.photos[1]],
    ["JEU", "Story Instagram", MEDIA.photos[3]], ["VEN", "Pub TikTok", MEDIA.photos[0]],
  ];
  return (
    <div className="w-full max-w-lg">
      <ScreenTitle title="Et Sokozia peut aussi la planifier." subtitle="Votre campagne n'est pas seulement créée. Elle est organisée." />
      <ul className="space-y-2">
        {days.map(([d, l, m], i) => (
          <Appear key={d} delay={i * 0.1} className="flex items-center gap-3 rounded-xl bg-surface border border-border p-2.5">
            <span className="w-10 text-xs font-semibold text-highlight">{d}</span>
            <div className="relative size-10 rounded-md overflow-hidden"><Img src={m} /></div>
            <span className="text-sm flex-1">{l}</span>
            <div className="size-7 rounded-md overflow-hidden opacity-80"><Img src={product.image} alt="" /></div>
          </Appear>
        ))}
      </ul>
      <CtaBar><Next onNext={onNext} /></CtaBar>
    </div>
  );
}
