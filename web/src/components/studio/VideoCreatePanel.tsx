"use client";

import { Clapperboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/Chip";
import { Textarea } from "@/components/ui/Textarea";
import { useStore } from "@/lib/store";
import { CREDIT_COSTS, RATIOS, type AspectRatio } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DURATIONS, VIDEO_CAMERAS, VIDEO_STYLES, type VideoParams } from "./constants";
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

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <ProductField label="Source image" asset={source} onChange={() => setPickerOpen(true)} onClear={() => update("sourceAssetId", null)} />
      <ProductPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={(a) => update("sourceAssetId", a.id)} selectedId={params.sourceAssetId} />

      <Textarea label="Concept" name="concept" rows={3} value={params.concept} onChange={(e) => update("concept", e.target.value)} placeholder="Slow orbit around the serum on wet marble, morning light, soft steam…" />

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text2">Duration</span>
        <div role="radiogroup" className="grid grid-cols-3 gap-1.5">
          {DURATIONS.map((d) => {
            const sel = d === params.durationSec;
            return <button key={d} role="radio" aria-checked={sel} onClick={() => update("durationSec", d)} className={cn("h-10 rounded-md border text-sm font-medium transition-colors", sel ? "bg-accent/15 border-accent/60 text-highlight" : "bg-surface border-border-strong text-text2 hover:text-text hover:border-white/25")}>{d}s</button>;
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text2">Aspect ratio</span>
        <ChipGroup<AspectRatio> size="sm" options={RATIOS.map((r) => ({ value: r, label: r }))} value={params.ratio} onChange={(v) => update("ratio", v)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text2">Camera movement</span>
        <ChipGroup<VideoParams["camera"]> size="sm" options={VIDEO_CAMERAS.map((v) => ({ value: v, label: v }))} value={params.camera} onChange={(v) => update("camera", v)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text2">Style</span>
        <ChipGroup<VideoParams["style"]> size="sm" options={VIDEO_STYLES.map((v) => ({ value: v, label: v }))} value={params.style} onChange={(v) => update("style", v)} />
      </div>

      {!hideGenerate && (
        <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-surface/95 backdrop-blur border-t border-border lg:mt-auto">
          <Button fullWidth size="lg" onClick={onGenerate} loading={generating} disabled={!canGenerate} leftIcon={<Clapperboard className="size-4" />}>
            {generating ? "Rendering…" : `Generate Video · ${CREDIT_COSTS.video} credits`}
          </Button>
          {!canGenerate && <p className="text-xs text-muted text-center mt-2">Add a concept or a source image to start.</p>}
        </div>
      )}
    </div>
  );
}
