"use client";

import { ArrowLeft, Check, MessageSquareQuote, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toneLabel } from "@/components/account/BrandEditModal";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChipGroup } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { selectCurrentBrand, useStore } from "@/lib/store";
import type { Brand, BrandTone } from "@/lib/types";

const TONES: BrandTone[] = ["Luxury", "Friendly", "Bold", "Playful", "Professional"];
const TONE_HINT: Record<BrandTone, string> = {
  Luxury: "Raffiné, sobre, sensoriel.",
  Friendly: "Chaleureux, conversationnel, proche.",
  Bold: "Percutant, direct, promesses fortes.",
  Playful: "Léger, spirituel, un brin espiègle.",
  Professional: "Clair, crédible, axé sur les bénéfices.",
};

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

/** Deterministic mock copy that reflects tone + writing style; the real API would use the voice as a system prompt. */
function sampleCopy(brand: Brand, tone: BrandTone, style: string, keywords: string[], avoid: string[]) {
  const name = brand.name;
  const product = brand.industry === "Food & Beverage" ? "notre nouveau plat du jour" : brand.industry === "Fashion" ? "la nouvelle collection" : "notre nouveau beurre de karité";
  const kw = keywords[0] ? keywords[0] : "au quotidien";
  const kw2 = keywords[1] ? keywords[1] : "simple";
  const short = /short|court/i.test(style);
  const noExcl = avoid.some((a) => /exclamation/i.test(a)) || tone === "Luxury" || tone === "Professional";
  const end = noExcl ? "." : "\u00a0!";

  const caption: Record<BrandTone, string> = {
    Luxury: `${name}. ${cap(product)} arrive en toute discrétion, comme les plus belles choses${end} Un rituel ${kw}, sublimé.`,
    Friendly: `Ça y est, ${product} est enfin là${end} On a fait ${kw2} : deux gouttes, des résultats ${kw}, zéro prise de tête. Dites-nous ce que vous en pensez.`,
    Bold: `${cap(product)} est là${end} Des résultats ${kw}. Sans raccourci. Sans excuse${end}`,
    Playful: `Rebondissement : ${product} vient de sortir${end} Votre routine ${kw} va devenir bien plus fun${end}`,
    Professional: `Découvrez ${product} signé ${name}. Conçu pour un usage ${kw}, pensé pour rester ${kw2}. Disponible dès maintenant.`,
  };
  const headline: Record<BrandTone, string> = {
    Luxury: `Simplement ${kw}.`,
    Friendly: `${cap(kw)}, en toute simplicité${end}`,
    Bold: `${cap(kw2)}. ${cap(kw)}. Point${end}`,
    Playful: `Passez en mode ${kw}${end}`,
    Professional: `Performance ${kw}, routine ${kw2}.`,
  };
  const cta: Record<BrandTone, string> = { Luxury: "Découvrir la collection", Friendly: "Essayez-le dès aujourd’hui", Bold: "Je le veux", Playful: "Faites-vous plaisir", Professional: "Acheter maintenant" };

  let c = caption[tone];
  if (short) c = c.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  return { caption: c, headline: headline[tone], cta: cta[tone] };
}

export default function BrandVoicePage() {
  const brand = useStore(selectCurrentBrand);
  const updateBrandVoice = useStore((s) => s.updateBrandVoice);
  const toast = useToast();

  if (!brand) {
    return (
      <>
        <PageHeader title="Ton de marque" />
        <EmptyState icon={MessageSquareQuote} title="Aucune marque pour le moment" description="Créez d’abord un kit de marque, puis définissez son ton." cta={{ label: "Aller au kit de marque", href: "/brand" }} />
      </>
    );
  }
  return <VoiceEditor key={brand.id} brand={brand} onSave={(patch) => { updateBrandVoice(brand.id, patch); toast.success("Ton enregistré", "Vos textes générés l’utiliseront désormais."); }} />;
}

function VoiceEditor({ brand, onSave }: { brand: Brand; onSave: (patch: Brand["voice"]) => void }) {
  const [tone, setTone] = useState<BrandTone>(brand.voice.tone);
  const [style, setStyle] = useState(brand.voice.writingStyle);
  const [keywords, setKeywords] = useState(brand.voice.keywords.join(", "));
  const [avoid, setAvoid] = useState(brand.voice.avoid.join(", "));
  const [seed, setSeed] = useState(0);

  const kwList = useMemo(() => keywords.split(",").map((k) => k.trim()).filter(Boolean), [keywords]);
  const avoidList = useMemo(() => avoid.split(",").map((k) => k.trim()).filter(Boolean), [avoid]);
  const sample = useMemo(() => sampleCopy(brand, tone, style, seed % 2 ? [...kwList].reverse() : kwList, avoidList), [brand, tone, style, kwList, avoidList, seed]);

  const dirty = tone !== brand.voice.tone || style !== brand.voice.writingStyle || kwList.join(",") !== brand.voice.keywords.join(",") || avoidList.join(",") !== brand.voice.avoid.join(",");

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/brand" className="inline-flex items-center gap-1 text-[13px] text-text2 hover:text-text"><ArrowLeft className="size-3.5" /> Kit de marque</Link>}
        title="Ton de marque"
        description={`La façon dont ${brand.name} s’exprime dans chaque légende, publicité et script.`}
        actions={<Button leftIcon={<Check className="size-4" />} disabled={!dirty} onClick={() => onSave({ tone, writingStyle: style.trim(), keywords: kwList, avoid: avoidList })}>Enregistrer le ton</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
        <div className="space-y-5">
          <Card>
            <h3 className="text-[15px] font-semibold mb-1">Ton</h3>
            <p className="text-[13px] text-text2 mb-3">Choisissez la personnalité globale.</p>
            <ChipGroup options={TONES.map((t) => ({ value: t, label: toneLabel(t) }))} value={tone} onChange={setTone} />
            <p className="text-[13px] text-muted mt-3">{TONE_HINT[tone]}</p>
          </Card>

          <Card>
            <h3 className="text-[15px] font-semibold mb-1">Style d’écriture</h3>
            <p className="text-[13px] text-text2 mb-3">Les règles que suit le rédacteur. Soyez précis.</p>
            <Textarea name="style" value={style} onChange={(e) => setStyle(e.target.value)} placeholder="Phrases courtes. Ton assuré. Jamais trop formel." rows={4} />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {["Phrases courtes.", "Ton assuré.", "Jamais trop formel.", "Commencer par le bénéfice.", "Vouvoyer le lecteur.", "Pas de jargon."].map((s) => (
                <button key={s} type="button" onClick={() => setStyle((v) => (v.includes(s) ? v : `${v.trim()} ${s}`.trim()))} className="text-[12px] px-2.5 h-7 rounded-full border border-border-strong text-text2 hover:text-text hover:border-white/25">
                  + {s}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Mots-clés à utiliser" name="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} hint="Séparés par des virgules" placeholder="éclat, quotidien, naturel" />
              <Input label="Mots à éviter" name="avoid" value={avoid} onChange={(e) => setAvoid(e.target.value)} hint="Séparés par des virgules" placeholder="miracle, anti-âge" />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {kwList.map((k) => <Badge key={`k-${k}`} tone="success">{k}</Badge>)}
              {avoidList.map((k) => <Badge key={`a-${k}`} tone="danger" className="line-through">{k}</Badge>)}
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 self-start space-y-4">
          <Card elevated>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-highlight" />
                <h3 className="text-[15px] font-semibold">Aperçu en direct</h3>
              </div>
              <Button size="sm" variant="ghost" leftIcon={<RefreshCw className="size-4" />} onClick={() => setSeed((s) => s + 1)}>Régénérer</Button>
            </div>
            <p className="text-[12px] text-muted mb-4">Exemple de texte rédigé avec le ton « {toneLabel(tone).toLowerCase()} ». Mis à jour pendant la saisie.</p>
            <div className="space-y-3">
              <div className="rounded-md bg-surface border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Titre</p>
                <p className="text-lg font-bold tracking-tight" style={{ fontFamily: brand.fonts.heading }}>{sample.headline}</p>
              </div>
              <div className="rounded-md bg-surface border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Légende Instagram</p>
                <p className="text-sm text-text2 leading-relaxed" style={{ fontFamily: brand.fonts.body }}>{sample.caption}</p>
              </div>
              <div className="rounded-md bg-surface border border-border p-3 flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-wide text-muted">CTA</p>
                <span className="inline-flex h-8 px-3 items-center rounded-md bg-accent text-white text-[13px] font-medium">{sample.cta}</span>
              </div>
            </div>
          </Card>
          <p className="text-[12px] text-muted px-1">Le Rédacteur et le Créateur de publicités utilisent ce ton automatiquement. Enregistrez pour l’appliquer.</p>
        </div>
      </div>
    </>
  );
}
