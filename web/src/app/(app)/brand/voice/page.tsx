"use client";

import { ArrowLeft, Check, MessageSquareQuote, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
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
  Luxury: "Elevated, restrained, sensory.",
  Friendly: "Warm, conversational, first-person.",
  Bold: "Punchy, direct, high-contrast claims.",
  Playful: "Light, witty, a little cheeky.",
  Professional: "Clear, credible, benefit-first.",
};

/** Deterministic mock copy that reflects tone + writing style; the real API would use the voice as a system prompt. */
function sampleCopy(brand: Brand, tone: BrandTone, style: string, keywords: string[], avoid: string[]) {
  const name = brand.name;
  const product = brand.industry === "Food & Beverage" ? "our new roast" : brand.industry === "Fashion" ? "the new drop" : "our new serum";
  const kw = keywords[0] ? keywords[0] : "everyday";
  const kw2 = keywords[1] ? keywords[1] : "simple";
  const short = /short/i.test(style);
  const noExcl = avoid.some((a) => /exclamation/i.test(a)) || tone === "Luxury" || tone === "Professional";
  const end = noExcl ? "." : "!";

  const caption: Record<BrandTone, string> = {
    Luxury: `${name}. ${product.charAt(0).toUpperCase() + product.slice(1)} arrives quietly, the way the best things do${end} A ${kw} ritual, refined.`,
    Friendly: `Okay, ${product} is finally here${end} We kept it ${kw2}: two drops, ${kw} results, zero fuss. Tell us what you think.`,
    Bold: `${product.charAt(0).toUpperCase() + product.slice(1)} is here${end} ${kw.charAt(0).toUpperCase() + kw.slice(1)} results. No shortcuts. No excuses${end}`,
    Playful: `Plot twist: ${product} just dropped${end} Your ${kw} routine is about to get a lot more fun${end}`,
    Professional: `Introducing ${product} from ${name}. Formulated for ${kw} use, designed to be ${kw2}. Available now.`,
  };
  const headline: Record<BrandTone, string> = {
    Luxury: `Quietly ${kw}.`,
    Friendly: `Your ${kw} just got easier${end}`,
    Bold: `${kw2.charAt(0).toUpperCase() + kw2.slice(1)}. ${kw.charAt(0).toUpperCase() + kw.slice(1)}. Done${end}`,
    Playful: `Say hello to ${kw} mode${end}`,
    Professional: `${kw.charAt(0).toUpperCase() + kw.slice(1)} performance, ${kw2} routine.`,
  };
  const cta: Record<BrandTone, string> = { Luxury: "Discover the collection", Friendly: "Try it today", Bold: "Get yours now", Playful: "Treat yourself", Professional: "Shop now" };

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
        <PageHeader title="Brand voice" />
        <EmptyState icon={MessageSquareQuote} title="No brand yet" description="Create a brand kit first, then define its voice." cta={{ label: "Go to Brand kit", href: "/brand" }} />
      </>
    );
  }
  return <VoiceEditor key={brand.id} brand={brand} onSave={(patch) => { updateBrandVoice(brand.id, patch); toast.success("Voice saved", "Generated copy will use it from now on."); }} />;
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
        eyebrow={<Link href="/brand" className="inline-flex items-center gap-1 text-[13px] text-text2 hover:text-text"><ArrowLeft className="size-3.5" /> Brand kit</Link>}
        title="Brand voice"
        description={`How ${brand.name} sounds in every caption, ad and script.`}
        actions={<Button leftIcon={<Check className="size-4" />} disabled={!dirty} onClick={() => onSave({ tone, writingStyle: style.trim(), keywords: kwList, avoid: avoidList })}>Save voice</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
        <div className="space-y-5">
          <Card>
            <h3 className="text-[15px] font-semibold mb-1">Tone</h3>
            <p className="text-[13px] text-text2 mb-3">Pick the overall personality.</p>
            <ChipGroup options={TONES.map((t) => ({ value: t, label: t }))} value={tone} onChange={setTone} />
            <p className="text-[13px] text-muted mt-3">{TONE_HINT[tone]}</p>
          </Card>

          <Card>
            <h3 className="text-[15px] font-semibold mb-1">Writing style</h3>
            <p className="text-[13px] text-text2 mb-3">Rules the copywriter follows. Be specific.</p>
            <Textarea name="style" value={style} onChange={(e) => setStyle(e.target.value)} placeholder="Short sentences. Confident. Never overly formal." rows={4} />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {["Short sentences.", "Confident.", "Never overly formal.", "Lead with the benefit.", "Use 'you'.", "No jargon."].map((s) => (
                <button key={s} type="button" onClick={() => setStyle((v) => (v.includes(s) ? v : `${v.trim()} ${s}`.trim()))} className="text-[12px] px-2.5 h-7 rounded-full border border-border-strong text-text2 hover:text-text hover:border-white/25">
                  + {s}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Keywords to use" name="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} hint="Comma separated" placeholder="glow, everyday, clean" />
              <Input label="Words to avoid" name="avoid" value={avoid} onChange={(e) => setAvoid(e.target.value)} hint="Comma separated" placeholder="miracle, anti-aging" />
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
                <h3 className="text-[15px] font-semibold">Live preview</h3>
              </div>
              <Button size="sm" variant="ghost" leftIcon={<RefreshCw className="size-4" />} onClick={() => setSeed((s) => s + 1)}>Regenerate</Button>
            </div>
            <p className="text-[12px] text-muted mb-4">Sample copy written in the {tone.toLowerCase()} voice. Updates as you type.</p>
            <div className="space-y-3">
              <div className="rounded-md bg-surface border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Headline</p>
                <p className="text-lg font-bold tracking-tight" style={{ fontFamily: brand.fonts.heading }}>{sample.headline}</p>
              </div>
              <div className="rounded-md bg-surface border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Instagram caption</p>
                <p className="text-sm text-text2 leading-relaxed" style={{ fontFamily: brand.fonts.body }}>{sample.caption}</p>
              </div>
              <div className="rounded-md bg-surface border border-border p-3 flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-wide text-muted">CTA</p>
                <span className="inline-flex h-8 px-3 items-center rounded-md bg-accent text-white text-[13px] font-medium">{sample.cta}</span>
              </div>
            </div>
          </Card>
          <p className="text-[12px] text-muted px-1">The Copywriter and Ad creator read this voice automatically. Save to apply.</p>
        </div>
      </div>
    </>
  );
}
