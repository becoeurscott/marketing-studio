"use client";

import { ArrowRight, Check, FlaskConical, Palette, Rocket, ShieldCheck, Smartphone, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import type { Platform } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Appear, CtaBar, Img, MEDIA, OptionCard, ProductBadge, ScreenTitle, Video, type ProductInfo } from "./shared";

/* 4. Goal */
export const GOALS = [
  { value: "launch", icon: Rocket, label: "Lancer un produit" },
  { value: "sell", icon: TrendingUp, label: "Vendre plus" },
  { value: "social", icon: Smartphone, label: "Développer mes réseaux" },
  { value: "test", icon: FlaskConical, label: "Tester de nouvelles créas" },
  { value: "auto", icon: Sparkles, label: "Je ne sais pas (Marketing Studio décide)" },
];

export function GoalScreen({ value, onChange, onNext }: { value: string | null; onChange: (v: string) => void; onNext: () => void }) {
  return (
    <div className="w-full max-w-xl">
      <ScreenTitle title="Quel est votre objectif ?" subtitle="On optimise toute la campagne autour de lui." />
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map((g, i) => (
          <OptionCard key={g.value} selected={value === g.value} onClick={() => onChange(g.value)}
            className={cn("flex flex-col gap-2 min-h-[104px]", i === GOALS.length - 1 && "col-span-2 min-h-0 flex-row items-center")}>
            <g.icon className="size-6 text-highlight" />
            <span className="font-medium text-[15px]">{g.label}</span>
          </OptionCard>
        ))}
      </div>
      <CtaBar>
        <Button size="lg" disabled={!value} onClick={onNext} rightIcon={<ArrowRight className="size-4" />}>Continuer</Button>
      </CtaBar>
    </div>
  );
}

/* 5. Platforms */
const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "pinterest", label: "Pinterest" },
  { value: "google", label: "Google" },
];

export function platformFeedback(p: Platform[]): string | null {
  if (p.length === 0) return null;
  if (p.includes("whatsapp")) return "Parfait. Je prépare des statuts 9:16, des fiches catalogue et un bouton « Commander sur WhatsApp ».";
  const vertical = p.filter((x) => x === "tiktok" || x === "instagram").length;
  if (vertical && p.length === vertical) return "Parfait. J'optimise la campagne pour le format vertical court.";
  if (p.includes("youtube") && vertical) return "Bien vu. Je prépare du vertical court et du format horizontal 16:9.";
  if (p.includes("google")) return "Noté. J'ajoute des textes d'annonce orientés recherche et conversion.";
  if (p.includes("pinterest")) return "Joli choix. Je soigne les visuels inspirants au format 2:3.";
  if (p.includes("facebook")) return "Parfait. Je prépare des pubs feed et stories prêtes à diffuser.";
  return "Parfait. Chaque créa sera adaptée à la plateforme.";
}

export function PlatformsScreen({ value, onChange, onNext }: { value: Platform[]; onChange: (v: Platform[]) => void; onNext: () => void }) {
  const feedback = platformFeedback(value);
  return (
    <div className="w-full max-w-xl">
      <ScreenTitle title="Où vivra cette campagne ?" subtitle="Choisissez une ou plusieurs plateformes." />
      <div className="flex flex-wrap justify-center gap-2.5">
        {PLATFORMS.map((p) => {
          const sel = value.includes(p.value);
          return (
            <Chip key={p.value} label={p.label} selected={sel} className="h-11 px-5 text-sm"
              onClick={() => onChange(sel ? value.filter((v) => v !== p.value) : [...value, p.value])} />
          );
        })}
      </div>
      <div className="min-h-[56px] mt-5">
        {feedback && (
          <Appear key={feedback} className="flex items-start gap-2 rounded-xl bg-accent/10 border border-accent/30 p-3 text-sm">
            <Sparkles className="size-4 text-highlight shrink-0 mt-0.5" />{feedback}
          </Appear>
        )}
      </div>
      <CtaBar>
        <Button size="lg" disabled={!value.length} onClick={onNext} rightIcon={<ArrowRight className="size-4" />}>Continuer</Button>
      </CtaBar>
    </div>
  );
}

/* 6. Creative direction */
export const STYLES = [
  { value: "luxe", label: "LUXE", tags: "Premium · Élégant · Éditorial", media: MEDIA.photos[2] },
  { value: "epure", label: "ÉPURÉ", tags: "Minimal · Moderne · Lumineux", media: MEDIA.photos[1] },
  { value: "ugc", label: "UGC", tags: "Authentique · Humain · Social-first", media: MEDIA.videos[1], video: true },
  { value: "audacieux", label: "AUDACIEUX", tags: "Énergique · Coloré · Accrocheur", media: MEDIA.videos[3], video: true },
];

export function StyleScreen({ product, value, onChange, onNext }: { product: ProductInfo; value: string | null; onChange: (v: string) => void; onNext: () => void }) {
  return (
    <div className="w-full max-w-2xl">
      <ScreenTitle title="Quelle sensation pour votre marque ?" subtitle="La direction créative de toute la campagne." />
      <div className="grid grid-cols-2 gap-3">
        {STYLES.map((s) => (
          <OptionCard key={s.value} selected={value === s.value} onClick={() => onChange(s.value)} className="p-0 overflow-hidden">
            <div className="relative aspect-[4/5] md:aspect-[4/3]">
              {s.video ? <Video src={s.media} /> : <Img src={s.media} />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <ProductBadge product={product} className="top-2 right-2 size-10" />
              <div className="absolute bottom-0 p-3">
                <p className="font-semibold tracking-wide">{s.label}</p>
                <p className="text-[11px] text-white/75">{s.tags}</p>
              </div>
              {value === s.value && <span className="absolute top-2 left-2 size-6 rounded-full bg-accent text-on-accent flex items-center justify-center"><Check className="size-3.5" /></span>}
            </div>
          </OptionCard>
        ))}
      </div>
      <div className="flex justify-center mt-3">
        <Chip label="Surprenez-moi" selected={value === "surprise"} onClick={() => onChange("surprise")} />
      </div>
      <CtaBar>
        <Button size="lg" disabled={!value} onClick={onNext} rightIcon={<ArrowRight className="size-4" />}>Continuer</Button>
      </CtaBar>
    </div>
  );
}

/* 7. Brand kit (optional) */
const BRAND_CHECKS = ["Logo détecté", "Couleurs détectées", "Ton identifié"];

export function BrandScreen({ value, onChange, onNext }: { value: boolean; onChange: (v: boolean) => void; onNext: () => void }) {
  const [shown, setShown] = useState(value ? BRAND_CHECKS.length : 0);
  useEffect(() => {
    if (!value || shown >= BRAND_CHECKS.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), 500);
    return () => clearTimeout(t);
  }, [value, shown]);
  return (
    <div className="w-full max-w-md">
      <ScreenTitle eyebrow="Optionnel" title="Personnalisez-la." subtitle="Ajoutez votre kit de marque : logo, couleurs, polices." />
      {!value ? (
        <button type="button" onClick={() => onChange(true)}
          className="w-full rounded-2xl border-2 border-dashed border-border-strong bg-surface hover:border-white/25 p-8 flex flex-col items-center gap-3">
          <span className="size-12 rounded-xl bg-accent/15 flex items-center justify-center"><Palette className="size-6 text-highlight" /></span>
          <span className="font-medium">Importer mon kit de marque</span>
          <span className="text-xs text-muted">Logo, charte PDF ou site web</span>
        </button>
      ) : (
        <div className="rounded-2xl bg-surface border border-border-strong p-5 space-y-3">
          {BRAND_CHECKS.map((c, i) => (
            <div key={c} className={cn("flex items-center gap-2.5 text-sm transition-opacity", i < shown ? "opacity-100" : "opacity-30")}>
              <span className={cn("size-5 rounded-full flex items-center justify-center", i < shown ? "bg-success/20 text-success" : "bg-white/5")}>
                {i < shown && <Check className="size-3" />}
              </span>{c}
            </div>
          ))}
          {shown >= BRAND_CHECKS.length && (
            <div className="flex gap-2 pt-2">{["#d1fe17", "#f5d0fe", "#111827", "#fde68a"].map((c) => <span key={c} className="size-7 rounded-full border border-white/20" style={{ background: c }} />)}</div>
          )}
        </div>
      )}
      <CtaBar>
        {!value && <Button variant="ghost" size="lg" onClick={onNext}>Je le ferai plus tard</Button>}
        {value && <Button size="lg" disabled={shown < BRAND_CHECKS.length} onClick={onNext} rightIcon={<ArrowRight className="size-4" />}>Continuer</Button>}
      </CtaBar>
    </div>
  );
}

/* 8. Boldness */
const BOLDNESS = [
  { value: "prudent", label: "PRUDENT", desc: "Éprouvé & soigné", icon: ShieldCheck },
  { value: "creatif", label: "CRÉATIF", desc: "Distinctif & engageant", icon: Palette },
  { value: "fou", label: "FOU", desc: "Inattendu & percutant", icon: Zap },
];

export function BoldnessScreen({ value, onChange, onNext }: { value: string | null; onChange: (v: string) => void; onNext: () => void }) {
  return (
    <div className="w-full max-w-xl">
      <ScreenTitle title="Jusqu'où on ose ?" subtitle="Le niveau d'audace de vos créas." />
      <div className="grid gap-3 md:grid-cols-3">
        {BOLDNESS.map((b) => (
          <OptionCard key={b.value} selected={value === b.value} onClick={() => onChange(b.value)} className="flex md:flex-col items-center md:items-start gap-3">
            <b.icon className="size-6 text-highlight" />
            <span>
              <span className="block font-semibold tracking-wide">{b.label}</span>
              <span className="block text-sm text-text2">{b.desc}</span>
            </span>
          </OptionCard>
        ))}
      </div>
      <CtaBar>
        <Button size="lg" disabled={!value} onClick={onNext} rightIcon={<ArrowRight className="size-4" />}>Construire ma campagne</Button>
      </CtaBar>
    </div>
  );
}
