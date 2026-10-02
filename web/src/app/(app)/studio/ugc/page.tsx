"use client";

import { Clapperboard, Megaphone, RefreshCw, Save, Video, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Canvas, ControlField, CreatorCard, ErrorState, ProductPicker, StudioControls } from "@/components/creative";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { StepProgress } from "@/components/ui/ProgressIndicator";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { creators } from "@/data";
import { generateUGC, ugcCredits, VIDEO_STEPS, type VideoResult } from "@/lib/api";
import { UGC_TYPES } from "@/lib/creative-presets";
import { capitalize, useTemplatePreset } from "@/components/studio/useTemplatePreset";
import { VIDEO_STEP_LABELS } from "@/components/studio/constants";
import { LANGUAGES, countryOf, languageLabel, type LanguageId } from "@/lib/market";
import { selectCountry, useStore } from "@/lib/store";
import { type Asset } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEFAULT_SCRIPT = "Créez une vidéo de 15 secondes façon TikTok pour présenter ce produit.";
const TONES = ["Excited", "Casual", "Professional", "Funny", "Luxury", "Authentic"] as const;
type UgcTone = (typeof TONES)[number];
const TONE_LABELS: Record<UgcTone, string> = { Excited: "Enthousiaste", Casual: "Décontracté", Professional: "Professionnel", Funny: "Drôle", Luxury: "Luxe", Authentic: "Authentique" };
const LOCATIONS = ["Boutique", "Marché", "Maquis", "Salon de coiffure", "Cour familiale", "Salon", "Chambre", "Cuisine", "Rue", "Studio"];
const DURATIONS = ["5", "10", "15"] as const;

type Phase = { kind: "idle" } | { kind: "loading"; step: number } | { kind: "done"; result: VideoResult } | { kind: "error"; error: unknown };

function UGCPage() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const assets = useStore((s) => s.assets);
  const currentProjectId = useStore((s) => s.currentProjectId);
  const addAsset = useStore((s) => s.addAsset);
  const favoriteCreators = useStore((s) => s.favorites.creator);
  const { template, preset } = useTemplatePreset("ugc");
  const country = countryOf(useStore(selectCountry));
  const defaultLanguage = useStore((s) => s.preferences.language);
  const [language, setLanguage] = useState<LanguageId>(preset?.language ?? defaultLanguage ?? country.languages[0]);

  // No product until the user picks or imports one (the video works without it).
  const [productId, setProductId] = useState<string | null>(null);
  // A creator chosen elsewhere (creators page, profile modal) arrives as ?creator=<id>.
  const [creatorId, setCreatorId] = useState(() => {
    const wanted = params.get("creator");
    return creators.some((c) => c.id === wanted) ? wanted! : creators[0].id;
  });
  const [script, setScript] = useState(() => params.get("script") || DEFAULT_SCRIPT);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [ugcTypeId, setUgcTypeId] = useState(UGC_TYPES[0].id);
  const ugcType = UGC_TYPES.find((t) => t.id === ugcTypeId) ?? UGC_TYPES[0];
  const pickUgcType = (id: string) => {
    const next = UGC_TYPES.find((t) => t.id === id);
    if (!next) return;
    // Swap the script only if it is still the default or another format's starter script.
    if (script === DEFAULT_SCRIPT || UGC_TYPES.some((t) => t.script === script)) setScript(next.script);
    setUgcTypeId(id);
  };
  const [tone, setTone] = useState<UgcTone>(() => {
    const t = preset?.tone ? capitalize(preset.tone) : "";
    return (TONES as readonly string[]).includes(t) ? (t as UgcTone) : "Authentic";
  });
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(() => (preset?.durationSec ? (String(preset.durationSec) as (typeof DURATIONS)[number]) : "15"));
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [savedId, setSavedId] = useState<string | null>(null);

  const product = useMemo(() => assets.find((a) => a.id === productId) ?? null, [assets, productId]);
  const creator = creators.find((c) => c.id === creatorId) ?? creators[0];
  // Creators who speak the chosen language first, then favorites, then featured.
  // A creator picked from the creators page always shows up, even outside the top 8.
  const featured = useMemo(() => {
    const speaks = (c: (typeof creators)[number]) => Number(c.languages.includes(languageLabel(language)));
    const top = [...creators].sort((a, b) => speaks(b) - speaks(a) || Number(favoriteCreators.includes(b.id)) - Number(favoriteCreators.includes(a.id)) || Number(b.featured) - Number(a.featured)).slice(0, 8);
    return top.some((c) => c.id === creator.id) ? top : [creator, ...top.slice(0, 7)];
  }, [favoriteCreators, language, creator]);
  const loading = phase.kind === "loading";

  async function generate() {
    if (!script.trim()) { toast.error("Ajoutez d'abord un script"); return; }
    setPhase({ kind: "loading", step: 0 });
    setSavedId(null);
    try {
      const result = await generateUGC(
        { creatorId, script, durationSec: Number(duration) as 5 | 10 | 15, location, tone, language, productAssetId: productId, projectId: currentProjectId, formatDirection: ugcType.direction },
        (_step, index) => setPhase({ kind: "loading", step: index }),
      );
      setPhase({ kind: "done", result });
      toast.success("Vidéo UGC prête", `${creator.name} · ${languageLabel(language)} · ${duration} s`);
    } catch (error) {
      setPhase({ kind: "error", error });
    }
  }

  function save(): Asset | null {
    if (phase.kind !== "done") return null;
    if (savedId) { toast.info("Déjà enregistrée dans le projet"); return null; }
    const asset = addAsset({ name: `UGC — ${creator.name} ${duration}s`, type: "video", url: phase.result.url, thumbnail: phase.result.thumbnail, projectId: currentProjectId, favorite: false, width: 1080, height: 1920, durationSec: phase.result.durationSec, sizeKb: 4200 * (phase.result.durationSec / 5), tags: ["ugc", creator.name.toLowerCase(), tone.toLowerCase()] });
    setSavedId(asset.id);
    toast.success("Enregistrée dans le projet", asset.name);
    return asset;
  }
  function addToCampaign() {
    const asset = savedId ? assets.find((a) => a.id === savedId) ?? null : save();
    if (asset) router.push(`/campaigns?asset=${asset.id}`);
  }

  const controls = (
    <>
      <ControlField label="Produit" hint={product?.name}>
        <ProductPicker value={productId} onChange={(a) => setProductId(a.id)} onClear={() => setProductId(null)} />
      </ControlField>
      <Select label="Langue de la voix" value={language} onChange={(e) => setLanguage(e.target.value as LanguageId)} options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))} />
      <ControlField label="Créateur" hint={creator.languages.includes(languageLabel(language)) ? undefined : `${creator.name} sera doublé(e) en ${languageLabel(language).toLowerCase()}`}>
        <div className="grid grid-cols-1 gap-2">
          {featured.map((c) => <CreatorCard key={c.id} creator={c} compact selected={c.id === creatorId} onSelect={() => setCreatorId(c.id)} />)}
        </div>
      </ControlField>
      <ControlField label="Type de vidéo" hint={ugcType.hint}>
        <ChipGroup size="sm" options={UGC_TYPES.map((t) => ({ value: t.id, label: t.label }))} value={ugcTypeId} onChange={pickUgcType} />
      </ControlField>
      <Textarea label="Script" value={script} onChange={(e) => setScript(e.target.value)} rows={4} hint={`${script.length} caractères`} />
      <Select label="Lieu" value={location} onChange={(e) => setLocation(e.target.value)} options={LOCATIONS.map((l) => ({ value: l, label: l }))} />
      <ControlField label="Ton">
        <ChipGroup size="sm" options={TONES.map((t) => ({ value: t, label: TONE_LABELS[t] }))} value={tone} onChange={setTone} />
      </ControlField>
      <ControlField label="Durée">
        <ChipGroup size="sm" options={DURATIONS.map((d) => ({ value: d, label: `${d} s` }))} value={duration} onChange={setDuration} />
      </ControlField>
    </>
  );

  return (
    <>
      <PageHeader title="Créateur UGC" description="Choisissez un créateur, écrivez le script et générez une vidéo produit authentique." eyebrow={<div className="flex flex-wrap items-center gap-1.5"><Badge tone="accent">Studio · UGC</Badge>{template && <Badge tone="outline">Modèle · {template.title}</Badge>}</div>} />
      <StudioControls title="Paramètres UGC" controls={controls} generateLabel={phase.kind === "done" ? "Régénérer" : "Générer la vidéo UGC"} generateIcon={Clapperboard} onGenerate={generate} loading={loading} cost={ugcCredits(Number(duration))} />

      <Canvas>
        {phase.kind === "error" ? (
          <ErrorState error={phase.error} onRetry={generate} />
        ) : (
          <div className="flex-1 grid grid-cols-[minmax(0,1fr)] 2xl:grid-cols-[minmax(0,1fr)_300px] gap-0 min-w-0">
            {/* Video / preview column */}
            <div className="flex items-center justify-center p-4 xl:p-8 min-h-[420px]">
              <div className="relative w-full max-w-[300px] aspect-[9/16] rounded-2xl overflow-hidden border border-border-strong bg-elevated shadow-float">
                {phase.kind === "done" ? (
                  <>
                    <video src={phase.result.url} poster={phase.result.poster || undefined} controls playsInline className="size-full object-cover" aria-label="Vidéo UGC générée" />
                    <span className="absolute top-3 left-3 text-[11px] font-medium px-2 py-0.5 rounded-full bg-black/60 backdrop-blur">{phase.result.durationSec} s · 9:16</span>
                    <div className="pointer-events-none absolute top-10 inset-x-0 p-3 flex items-center gap-2">
                      <div className="min-w-0"><p className="text-xs font-semibold">@{creator.name.toLowerCase()}</p><p className="text-[11px] text-white/70 truncate">{script}</p></div>
                    </div>
                  </>
                ) : (
                  <>
                    {creator.intro ? (
                      <video key={creator.id} src={creator.intro} poster={creator.portrait} autoPlay muted loop playsInline controls className={cn("size-full object-cover transition-opacity", loading && "opacity-40")} aria-label={`Présentation de ${creator.name}`} />
                    ) : (
                      <img src={creator.portrait} alt={creator.name} className={cn("size-full object-cover transition-opacity", loading ? "opacity-40" : "opacity-80")} />
                    )}
                    {product && <img src={product.thumbnail} alt={product.name} className="pointer-events-none absolute bottom-24 right-3 w-20 aspect-[4/5] object-cover rounded-md border border-white/30 shadow-float" />}
                    <div className="pointer-events-none absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/70 to-transparent">
                      <p className="text-xs font-semibold">@{creator.name.toLowerCase()} · {location}</p>
                      <p className="text-[11px] text-white/70 line-clamp-2">{script}</p>
                    </div>
                    {loading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-sm p-4">
                        <Video className="size-6 text-highlight animate-pulse" />
                        <StepProgress steps={VIDEO_STEPS.map((s) => VIDEO_STEP_LABELS[s] ?? s)} current={phase.step} className="text-left" />
                      </div>
                    )}
                    {!loading && <span className="absolute top-3 left-3 text-[11px] font-medium px-2 py-0.5 rounded-full bg-black/60 backdrop-blur">Aperçu · {duration} s</span>}
                  </>
                )}
              </div>
            </div>

            {/* Summary column */}
            <aside className="min-w-0 border-t 2xl:border-t-0 2xl:border-l border-border p-4 md:p-5 space-y-5 pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-5">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted mb-2">Créateur</p>
                <CreatorCard creator={creator} compact selected={false} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted mb-2">Produit</p>
                {product ? (
                  <div className="flex items-center gap-3"><img src={product.thumbnail} alt="" className="size-11 rounded-md object-cover border border-border" /><div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{product.name}</p><p className="text-xs text-muted">{product.width ?? 800}×{product.height ?? 1000}</p></div><button type="button" onClick={() => setProductId(null)} className="size-8 shrink-0 rounded-md flex items-center justify-center text-muted hover:text-text hover:bg-elevated transition-colors" aria-label="Retirer le produit" title="Retirer le produit"><X className="size-4" /></button></div>
                ) : <p className="text-sm text-muted">Aucun produit (facultatif). Importez-en un dans les paramètres.</p>}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted mb-2">Script</p>
                <p className="text-sm text-text2 whitespace-pre-wrap">{script}</p>
                <div className="flex flex-wrap gap-1.5 mt-3"><Badge tone="outline">{TONE_LABELS[tone]}</Badge><Badge tone="outline">{location}</Badge><Badge tone="outline">{duration} s</Badge></div>
              </div>
              {phase.kind === "done" && (
                <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border">
                  <Button variant="secondary" leftIcon={<Save className="size-4" />} onClick={save} disabled={!!savedId}>{savedId ? "Enregistrée" : "Enregistrer"}</Button>
                  <Button variant="secondary" leftIcon={<Megaphone className="size-4" />} onClick={addToCampaign}>Utiliser dans une campagne</Button>
                  <Button variant="ghost" leftIcon={<RefreshCw className="size-4" />} onClick={generate}>Régénérer</Button>
                </div>
              )}
            </aside>
          </div>
        )}
      </Canvas>
    </>
  );
}

export default function Page() {
  return <Suspense fallback={null}><UGCPage /></Suspense>;
}
