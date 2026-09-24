"use client";

import { ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useStore } from "@/lib/store";
import { CREDIT_COSTS, IMAGE_STYLES, RATIOS, type AspectRatio, type ImageStyle } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BACKGROUNDS, COMPOSITIONS, IMAGE_CAMERAS, LIGHTING, MODELS, PROMPT_PLACEHOLDER, type ImageParams, type ModelId } from "./constants";
import { ProductField, ProductPicker } from "./ProductPicker";

export interface ImageCreatePanelProps {
  params: ImageParams;
  update: <K extends keyof ImageParams>(key: K, value: ImageParams[K]) => void;
  onGenerate: () => void;
  generating?: boolean;
  /** Hide the Generate button (mobile bar owns it). */
  hideGenerate?: boolean;
  templateName?: string | null;
  className?: string;
}

const ratioIcon: Record<AspectRatio, string> = { "1:1": "size-3", "4:5": "w-2.5 h-3", "9:16": "w-2 h-3.5", "16:9": "w-4 h-2.5", "3:2": "w-3.5 h-2.5" };

/** Prompt, product, style, ratio, model + advanced (background, lighting, camera, composition). Reused by Studio and /studio/image. */
export function ImageCreatePanel({ params, update, onGenerate, generating, hideGenerate, templateName, className }: ImageCreatePanelProps) {
  const assets = useStore((s) => s.assets);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [advanced, setAdvanced] = useState(true);
  const product = assets.find((a) => a.id === params.productAssetId) ?? null;
  const canGenerate = !!params.prompt.trim() || !!params.productAssetId;

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {templateName && (
        <p className="text-xs text-highlight bg-accent/10 border border-accent/30 rounded-md px-3 py-2">Template applied: <span className="font-medium">{templateName}</span></p>
      )}

      <ProductField asset={product} onChange={() => setPickerOpen(true)} onClear={() => update("productAssetId", null)} />
      <ProductPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={(a) => update("productAssetId", a.id)} selectedId={params.productAssetId} />

      <Textarea
        label="Prompt"
        name="prompt"
        value={params.prompt}
        onChange={(e) => update("prompt", e.target.value)}
        placeholder={PROMPT_PLACEHOLDER}
        rows={4}
        hint="Describe the scene, mood and what should stand out."
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text2">Style</span>
        <ChipGroup<ImageStyle> size="sm" options={IMAGE_STYLES.map((s) => ({ value: s, label: s }))} value={params.style} onChange={(v) => update("style", v)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text2">Aspect ratio</span>
        <div role="radiogroup" className="grid grid-cols-5 gap-1.5">
          {RATIOS.map((r) => {
            const sel = r === params.ratio;
            return (
              <button key={r} role="radio" aria-checked={sel} onClick={() => update("ratio", r)} className={cn("h-14 rounded-md border flex flex-col items-center justify-center gap-1.5 text-[11px] font-medium transition-colors", sel ? "bg-accent/15 border-accent/60 text-highlight" : "bg-surface border-border-strong text-text2 hover:text-text hover:border-white/25")}>
                <span className={cn("rounded-[2px] border", sel ? "border-highlight" : "border-text2", ratioIcon[r])} />
                {r}
              </button>
            );
          })}
        </div>
      </div>

      <Select label="Model" name="model" value={params.model} onChange={(e) => update("model", e.target.value as ModelId)} options={MODELS.map((m) => ({ value: m.id, label: `${m.label} · ${m.hint}` }))} />

      <div>
        <button onClick={() => setAdvanced((v) => !v)} className="flex items-center gap-1.5 text-[13px] font-medium text-text2 hover:text-text" aria-expanded={advanced}>
          <ChevronDown className={cn("size-4 transition-transform", advanced && "rotate-180")} /> Settings
          <span className="text-muted font-normal">· background, lighting, camera, composition</span>
        </button>
        {advanced && (
          <div className="mt-3 grid grid-cols-1 gap-4">
            <Select label="Background" name="background" value={params.background} onChange={(e) => update("background", e.target.value as ImageParams["background"])} options={BACKGROUNDS.map((v) => ({ value: v, label: v }))} compact />
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-text2">Lighting</span>
              <ChipGroup<ImageParams["lighting"]> size="sm" options={LIGHTING.map((v) => ({ value: v, label: v }))} value={params.lighting} onChange={(v) => update("lighting", v)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-text2">Camera</span>
              <ChipGroup<ImageParams["camera"]> size="sm" options={IMAGE_CAMERAS.map((v) => ({ value: v, label: v }))} value={params.camera} onChange={(v) => update("camera", v)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-text2">Composition</span>
              <ChipGroup<ImageParams["composition"]> size="sm" options={COMPOSITIONS.map((v) => ({ value: v, label: v }))} value={params.composition} onChange={(v) => update("composition", v)} />
            </div>
          </div>
        )}
      </div>

      {!hideGenerate && (
        <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-surface/95 backdrop-blur border-t border-border lg:mt-auto">
          <Button fullWidth size="lg" onClick={onGenerate} loading={generating} disabled={!canGenerate} leftIcon={<Sparkles className="size-4" />}>
            {generating ? "Creating…" : `Generate · ${CREDIT_COSTS.image} credits`}
          </Button>
          {!canGenerate && <p className="text-xs text-muted text-center mt-2">Add a prompt or a product to start.</p>}
        </div>
      )}
    </div>
  );
}
