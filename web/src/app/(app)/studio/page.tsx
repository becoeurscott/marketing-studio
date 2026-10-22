"use client";

import { useEffect, useMemo, useState } from "react";
import { useImmersive, usePageTitle } from "@/components/shell/ShellContext";
import { PromptDock, type DockModel } from "@/components/hf/PromptDock";
import { RunFeed } from "@/components/hf/RunFeed";
import { useStudioRuns, type RunKind } from "@/components/hf/useStudioRuns";
import { creators } from "@/data";
import { ugcCredits } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { AspectRatio, Asset } from "@/lib/types";
import { IMAGE_MODELS, VIDEO_MODELS, imageModel, videoCredits, videoModel, type ImageModelId, type VideoModelId } from "@/lib/higgsfield/models";

const IMAGE_DOCK: DockModel[] = IMAGE_MODELS.map((m) => ({ id: m.id, label: m.label, hint: m.hint, price: `✦ ${m.credits} / image`, badge: m.id === "marketing-studio-1k" ? "Recommandé" : undefined }));
const VIDEO_DOCK: DockModel[] = VIDEO_MODELS.map((m) => ({ id: m.id, label: m.label, hint: m.hint, price: `✦ ${m.creditsPerSecond}/s`, badge: m.id === "seedance-2.5" ? "Top" : undefined }));

const EXAMPLES = [
  "Bouteille de parfum sur un pagne wax, lumière dorée du matin, photo publicitaire",
  "Sneakers posées sur un toit d'Abidjan au coucher du soleil, style éditorial",
  "Plat de thiéboudienne vu de dessus, décor coloré, photo culinaire premium",
];

/** Studio, Higgsfield layout: generations feed in the middle, prompt dock pinned to the bottom. */
export default function StudioPage() {
  usePageTitle("Studio");
  useImmersive();
  const { runs, submit, remove, running } = useStudioRuns();
  const hasHistory = useStore((s) => s.assets.some((a) => a.tags?.includes("generated")));
  const light = useStore((s) => s.preferences.lightVideos ?? true);

  const [kind, setKind] = useState<RunKind>("image");
  const [prompt, setPrompt] = useState("");
  const [imgModel, setImgModel] = useState<ImageModelId>("marketing-studio-1k");
  const [vidModel, setVidModel] = useState<VideoModelId>("kling-3.0");
  const [ratio, setRatio] = useState<AspectRatio>("4:5");
  const [count, setCount] = useState(1);
  const [duration, setDuration] = useState<5 | 10 | 15>(5);
  const [productId, setProductId] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [shotMode, setShotMode] = useState<"multi" | "variations">("variations");
  const [shot, setShot] = useState("hold");

  // Deep links: /studio?mode=ugc&creator=<id>, /studio?mode=video&model=<id>
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const m = q.get("mode");
    if (m === "ugc" || m === "video" || m === "image") setKind(m);
    const c = q.get("creator");
    if (c && creators.some((x) => x.id === c)) { setKind("ugc"); setCreatorId(c); }
    const model = q.get("model");
    if (model && IMAGE_MODELS.some((x) => x.id === model)) { setKind("image"); setImgModel(model as ImageModelId); }
    if (model && VIDEO_MODELS.some((x) => x.id === model)) { setKind("video"); setVidModel(model as VideoModelId); }
    const pr = q.get("prompt");
    if (pr) setPrompt(pr.slice(0, 2000));
    if (m || c || model || pr) window.history.replaceState(null, "", "/studio");
  }, []);

  const changeKind = (k: RunKind) => { setKind(k); setRatio(k === "image" ? "4:5" : "9:16"); };

  const cost = useMemo(() => {
    if (kind === "image") return imageModel(imgModel).credits * count;
    if (kind === "ugc") return ugcCredits(duration);
    return videoCredits(vidModel, duration, !!productId, light);
  }, [kind, imgModel, count, vidModel, duration, productId, light]);

  const generate = () => {
    const creatorName = creators.find((c) => c.id === creatorId)?.name ?? "";
    const modelLabel = kind === "image" && creatorId ? `Influenceur · ${creatorName} · ${imageModel(imgModel).label}` : kind === "image" ? imageModel(imgModel).label : kind === "ugc" ? `UGC · ${creators.find((c) => c.id === creatorId)?.name ?? ""}` : videoModel(vidModel).label;
    void submit({ kind, prompt, modelLabel, ratio: kind === "ugc" ? "9:16" : ratio, imageModel: imgModel, count, videoModel: vidModel, durationSec: duration, productAssetId: productId, creatorId, shotMode, shot });
  };

  const empty = runs.length === 0 && !hasHistory;

  return (
    <div className="relative h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom))] md:h-[calc(100dvh-3.5rem)] overflow-hidden bg-[#030304]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_50%_0%,rgba(209,254,23,0.10),transparent_65%)]" />
      <div className="absolute inset-0 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-3 md:px-6 pt-6 pb-64">
          {empty ? (
            <div className="min-h-[55vh] flex flex-col items-center justify-center text-center">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">Créez vos pubs <span className="text-accent">en un prompt</span></h1>
              <p className="mt-3 text-white/55 max-w-lg">Photos produit, vidéos et UGC avec des créateurs africains. Ajoutez la photo de votre produit, décrivez la scène, générez.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl">
                {EXAMPLES.map((e) => (
                  <button key={e} type="button" onClick={() => setPrompt(e)} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] text-white/75 hover:bg-white/10 hover:text-white">{e}</button>
                ))}
              </div>
            </div>
          ) : (
            <RunFeed runs={runs} onRemove={remove} onReuse={setPrompt} onMore={(r, mode) => r.input && void submit({ ...r.input, count: 4, shotMode: mode, modelLabel: `${r.input.modelLabel} · ${mode === "multi" ? "autres plans" : "variantes"}` })} />
          )}
        </div>
      </div>

      <div className="absolute z-30 bottom-2 inset-x-2 md:bottom-5 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[min(860px,calc(100%-3rem))]">
        {running > 0 && <p className="mb-2 text-center text-[12px] text-white/50">{running} génération{running > 1 ? "s" : ""} en cours · vous pouvez en lancer d’autres</p>}
        <PromptDock
          kind={kind} onKind={changeKind}
          prompt={prompt} onPrompt={setPrompt}
          models={kind === "image" ? IMAGE_DOCK : VIDEO_DOCK}
          model={kind === "image" ? imgModel : vidModel}
          onModel={(id) => (kind === "image" ? setImgModel(id as ImageModelId) : setVidModel(id as VideoModelId))}
          ratio={ratio} onRatio={setRatio}
          count={count} onCount={setCount}
          duration={duration} onDuration={setDuration}
          productId={productId} onProduct={(a: Asset | null) => setProductId(a?.id ?? null)}
          creatorId={creatorId} onCreator={setCreatorId}
          shotMode={shotMode} onShotMode={setShotMode} shot={shot} onShot={setShot}
          cost={cost}
          onGenerate={generate}
        />
      </div>
    </div>
  );
}
