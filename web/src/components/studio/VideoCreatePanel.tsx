"use client";

import { Clapperboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useStore } from "@/lib/store";
import { VIDEO_MODELS, videoCredits, videoModel, type VideoModelId } from "@/lib/higgsfield/models";
import { RATIOS, type AspectRatio } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DURATIONS, VIDEO_CAMERA_LABELS, VIDEO_CAMERAS, VIDEO_STYLE_LABELS, VIDEO_STYLES, type VideoParams } from "./constants";
import { ProductField, ProductPicker } from "./ProductPicker";

export interface VideoCreatePanelProps {
  params: VideoParams;
  update: <K extends keyof VideoParams>(key: K, value: VideoParams[K]) => void;
  onGenerate: () => void;
  generating?: boolean;
  hideGenerate?: boolean;
  className?: string;
}

/** Source image, concept, duration, ratio, camera movement, style (SPEC §14). */
export function VideoCreatePanel({ params, update, onGenerate, generating, hideGenerate, className }: VideoCreatePanelProps) {
  const assets = useStore((s) => s.assets);
  const [pickerOpen, setPickerOpen] = useState(false);
  const source = assets.find((a) => a.id === params.sourceAssetId) ?? null;
  const canGenerate = !!params.concept.trim() || !!params.sourceAssetId;
  const model = videoModel(params.model);
  const cost = videoCredits(params.model, params.durationSec, !!source);

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <ProductField label="Image source" asset={source} onChange={() => setPickerOpen(true)} onClear={() => update("sourceAssetId", null)} />
      <ProductPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={(a) => update("sourceAssetId", a.id)} selectedId={params.sourceAssetId} />

      <Textarea label="Concept" name="concept" rows={3} value={params.concept} onChange={(e) => update("concept", e.target.value)} placeholder="Orbite lente autour du pot de karité sur un pagne wax, lumière du matin…" />

      <div>
        <Select label="Modèle vidéo" name="videoModel" value={params.model} onChange={(e) => update("model", e.target.value as VideoModelId)} options={VIDEO_MODELS.map((m) => ({ value: m.id, label: `${m.label} · ${m.creditsPerSecond} cr/s` }))} />
        <p className="text-[12px] text-muted mt-1.5">{model.hint}{source && !model.i2v ? " · Avec une image source, la vidéo est rendue avec Seedance 2.5." : ""}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text2">Durée</span>
        <div role="radiogroup" className="grid grid-cols-3 gap-1.5">
          {DURATIONS.map((d) => {
            const sel = d === params.durationSec;
            return <button key={d} role="radio" aria-checked={sel} onClick={() => update("durationSec", d)} className={cn("h-10 rounded-md border text-sm font-medium transition-colors", sel ? "bg-accent/15 border-accent/60 text-highlight" : "bg-surface border-border-strong text-text2 hover:text-text hover:border-white/25")}>{d}s</button>;
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text2">Format d’image</span>
        <ChipGroup<AspectRatio> size="sm" options={RATIOS.map((r) => ({ value: r, label: r }))} value={params.ratio} onChange={(v) => update("ratio", v)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text2">Mouvement de caméra</span>
        <ChipGroup<VideoParams["camera"]> size="sm" options={VIDEO_CAMERAS.map((v) => ({ value: v, label: VIDEO_CAMERA_LABELS[v] }))} value={params.camera} onChange={(v) => update("camera", v)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text2">Style</span>
        <ChipGroup<VideoParams["style"]> size="sm" options={VIDEO_STYLES.map((v) => ({ value: v, label: VIDEO_STYLE_LABELS[v] }))} value={params.style} onChange={(v) => update("style", v)} />
      </div>

      {!hideGenerate && (
        <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-surface/95 backdrop-blur border-t border-border lg:mt-auto">
          <Button fullWidth size="lg" onClick={onGenerate} loading={generating} disabled={!canGenerate} leftIcon={<Clapperboard className="size-4" />}>
            {generating ? "Rendu en cours…" : `Générer la vidéo · ${cost} crédits`}
          </Button>
          {!canGenerate && <p className="text-xs text-muted text-center mt-2">Ajoutez un concept ou une image source pour commencer.</p>}
        </div>
      )}
    </div>
  );
}
