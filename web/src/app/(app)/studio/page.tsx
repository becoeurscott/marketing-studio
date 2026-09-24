"use client";

import { Clapperboard, ImageIcon, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Inspector, useImmersive, usePageTitle } from "@/components/shell/ShellContext";
import { AssistantButton } from "@/components/studio/Assistant";
import { Composer } from "@/components/studio/Composer";
import { StudioError } from "@/components/studio/ErrorState";
import { GeneratingOverlay } from "@/components/studio/GeneratingOverlay";
import { ImageCreatePanel } from "@/components/studio/ImageCreatePanel";
import { ImageWorkbench } from "@/components/studio/ImageWorkbench";
import { ModeTabs, type ComposeMode } from "@/components/studio/ModeTabs";
import { ProductPicker } from "@/components/studio/ProductPicker";
import { StudioCanvas } from "@/components/studio/StudioCanvas";
import { StudioTopBar } from "@/components/studio/StudioTopBar";
import { useImageGenerator } from "@/components/studio/useImageGenerator";
import { useIsDesktop } from "@/components/studio/useMediaQuery";
import { useVideoGenerator } from "@/components/studio/useVideoGenerator";
import { VideoCreatePanel } from "@/components/studio/VideoCreatePanel";
import { VideoPlayer } from "@/components/studio/VideoPlayer";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { templates } from "@/data";
import { useStore } from "@/lib/store";
import type { Asset } from "@/lib/types";

const MODE_ICON = { image: ImageIcon, video: Clapperboard, ugc: UserRound } as const;

export default function StudioPage() {
  usePageTitle("Studio");
  useImmersive();
  const isDesktop = useIsDesktop();
  const assets = useStore((s) => s.assets);
  const pendingTemplateId = useStore((s) => s.pendingTemplateId);
  const [mode, setMode] = useState<ComposeMode>(() => {
    // Templates hand-off: open the right mode for the preset.
    const tpl = pendingTemplateId ? templates.find((t) => t.id === pendingTemplateId) : undefined;
    return tpl?.preset.mode === "video" ? "video" : tpl?.preset.mode === "ugc" ? "ugc" : "image";
  });
  const gen = useImageGenerator();
  const vid = useVideoGenerator();
  const [picker, setPicker] = useState(false);
  const [advanced, setAdvanced] = useState(false);

  const product = assets.find((a) => a.id === gen.params.productAssetId) ?? null;
  const media = mode === "image"
    ? gen.selected ? { url: gen.selected.url, alt: "Selected result", kind: "image" as const } : product ? { url: product.url, alt: product.name, kind: "image" as const } : null
    : null;

  const setProduct = (a: Asset | null) => { gen.update("productAssetId", a?.id ?? null); vid.update("sourceAssetId", a?.id ?? null); };
  const startFromPrompt = () => document.querySelector<HTMLTextAreaElement>("textarea[name=prompt]")?.focus();
  const generate = () => { if (mode === "image") void gen.generate(); else void vid.generate(mode); };

  /* --- per-mode overlay (generating / error / video result) --- */
  let overlay: React.ReactNode = null;
  if (mode === "image") {
    if (gen.generating) overlay = <GeneratingOverlay hint={`${gen.params.style} · ${gen.params.ratio}`} />;
    else if (gen.error) overlay = <StudioError code={gen.error.code} message={gen.error.message} onRetry={generate} />;
  } else {
    if (vid.generating) overlay = <GeneratingOverlay label={mode === "ugc" ? "Filming your creator..." : "Generating your video..."} steps={vid.steps} step={vid.step} />;
    else if (vid.error) overlay = <StudioError code={vid.error.code} message={vid.error.message} onRetry={generate} />;
    else if (vid.result) overlay = <VideoPlayer result={vid.result} className="mx-auto" heightClass="h-[calc(100dvh-28rem)] md:h-[calc(100dvh-26.5rem)]" maxHeightClass="max-h-[calc(100dvh-28rem)] md:max-h-[calc(100dvh-26.5rem)]" />;
    else if (vid.source || (mode === "ugc" && vid.creator)) overlay = (
      <div className="flex flex-col items-center justify-center text-center p-6 gap-4 bg-[radial-gradient(circle_at_50%_40%,rgba(168,85,247,0.10),transparent_60%)]">
        <div className="flex items-end justify-center gap-3">
          {mode === "ugc" && vid.creator && <img src={vid.creator.avatarUrl} alt={vid.creator.name} className="size-28 md:size-40 rounded-2xl object-cover shadow-float border border-white/10" />}
          {vid.source && <img src={vid.source.thumbnail} alt={vid.source.name} className="max-h-[32vh] max-w-[60vw] rounded-2xl shadow-float object-contain border border-white/10" />}
        </div>
        <p className="text-sm text-text2 max-w-sm">
          {mode === "ugc"
            ? <>{vid.creator ? <span className="text-text">{vid.creator.name}</span> : "Pick a creator"} will present {vid.source ? <span className="text-text">{vid.source.name}</span> : "your product"}. Describe the scene and generate.</>
            : <>Source frame: <span className="text-text">{vid.source?.name}</span>. Describe the motion and generate.</>}
        </p>
        <Button variant="secondary" size="sm" leftIcon={<Clapperboard className="size-4" />} onClick={() => setPicker(true)}>{vid.source ? "Change product" : "Add product"}</Button>
      </div>
    );
  }

  const Icon = MODE_ICON[mode];
  const advancedPanel = mode === "image" ? (
    <ImageCreatePanel params={gen.params} update={gen.update} onGenerate={generate} generating={gen.generating} hideGenerate templateName={gen.templateName} />
  ) : (
    <VideoCreatePanel params={vid.params} update={vid.update} onGenerate={generate} generating={vid.generating} hideGenerate />
  );

  return (
    <div className="relative h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom))] md:h-[calc(100dvh-3.5rem)] overflow-hidden bg-bg">
      {/* Thin translucent top bar over the canvas */}
      <div className="absolute top-0 inset-x-0 z-20 bg-bg/70 backdrop-blur-md border-b border-white/5 px-3 md:px-4 h-12 flex items-center">
        <StudioTopBar
          className="flex-1 min-w-0"
          saveStatus={gen.saveStatus}
          onUndo={gen.undo}
          onRedo={gen.redo}
          canUndo={gen.canUndo}
          canRedo={gen.canRedo}
          exportKind={mode === "image" ? "image" : "video"}
          getExportAsset={() => (mode === "image" ? (gen.selected ? gen.ensureAsset(gen.selected) : product) : vid.ensureAsset())}
          center={<ModeTabs value={mode} onChange={setMode} compact composeOnly />}
        />
      </div>
      {/* Mobile: floating segmented mode pill */}
      <div className="md:hidden absolute top-14 left-3 right-14 z-20 flex justify-center">
        <ModeTabs value={mode} onChange={setMode} compact composeOnly />
      </div>

      {/* Canvas fills the column; results scroll beneath the media */}
      <div className="absolute inset-0 overflow-y-auto pt-12">
        <StudioCanvas
          className="min-h-full pb-[17rem] md:pb-[15rem]"
          media={media}
          overlay={overlay}
          onUploaded={setProduct}
          onPickFromAssets={() => setPicker(true)}
          onStartFromPrompt={startFromPrompt}
          footer={mode === "image" && gen.results.length > 0 && !gen.generating ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-medium text-text2">Results</p>
                <span className="text-xs text-muted">Tap a result to put it on the canvas</span>
              </div>
              <ImageWorkbench gen={gen} dense className="!grid-cols-2 sm:!grid-cols-4" />
            </div>
          ) : null}
        />
      </div>

      {/* Floating composer */}
      <div className="absolute z-30 bottom-2 inset-x-2 md:bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[min(760px,calc(100%-2rem))]">
        {mode === "image" ? (
          <Composer
            mode="image"
            prompt={gen.params.prompt} onPrompt={(v) => gen.update("prompt", v)}
            productId={gen.params.productAssetId} onProduct={setProduct}
            model={gen.params.model} onModel={(m) => gen.update("model", m)}
            ratio={gen.params.ratio} onRatio={(r) => gen.update("ratio", r)}
            onGenerate={generate} generating={gen.generating}
            onMore={() => setAdvanced((v) => !v)} moreActive={advanced}
            templateName={gen.templateName}
          />
        ) : (
          <Composer
            mode={mode}
            prompt={vid.params.concept} onPrompt={(v) => vid.update("concept", v)}
            productId={vid.params.sourceAssetId} onProduct={setProduct}
            creatorId={vid.params.creatorId} onCreator={(c) => vid.update("creatorId", c?.id ?? null)}
            model={vid.params.model} onModel={(m) => vid.update("model", m)}
            ratio={vid.params.ratio} onRatio={(r) => vid.update("ratio", r)}
            duration={vid.params.durationSec} onDuration={(d) => vid.update("durationSec", d)}
            onGenerate={generate} generating={vid.generating}
            onMore={() => setAdvanced((v) => !v)} moreActive={advanced}
          />
        )}
      </div>

      <ProductPicker open={picker} onClose={() => setPicker(false)} onPick={setProduct} selectedId={mode === "image" ? gen.params.productAssetId : vid.params.sourceAssetId} />

      {/* Advanced options: Inspector on desktop (toggle), BottomSheet on mobile */}
      {advanced && isDesktop && (
        <Inspector>
          <div className="p-4 flex flex-col min-h-full" key={mode}>
            <div className="flex items-center gap-2 mb-4">
              <Icon className="size-4 text-highlight" />
              <h2 className="text-[15px] font-semibold flex-1">Advanced options</h2>
              <IconButton size="sm" label="Hide options" onClick={() => setAdvanced(false)}><X /></IconButton>
            </div>
            {advancedPanel}
          </div>
        </Inspector>
      )}
      <BottomSheet open={advanced && !isDesktop} onClose={() => setAdvanced(false)} title="Advanced options">
        <div className="px-4 pb-4 overflow-y-auto">{advancedPanel}</div>
      </BottomSheet>

      <AssistantButton className="!bottom-auto !top-14 md:!top-[calc(3.5rem+3rem+0.75rem)] !h-10 md:!h-11" />
    </div>
  );
}
