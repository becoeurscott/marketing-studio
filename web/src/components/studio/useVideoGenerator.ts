"use client";

import { useCallback, useEffect, useState } from "react";
import { templates } from "@/data";
import { ApiError, generateUGC, generateVideo, VIDEO_STEPS, type VideoResult } from "@/lib/api";
import { creators } from "@/data";
import { useStore } from "@/lib/store";
import type { Asset } from "@/lib/types";
import { SAMPLE_VIDEO_URL, VIDEO_CAMERAS, VIDEO_STYLES, type DurationSec, type VideoParams } from "./constants";
import type { GenError } from "./useImageGenerator";

/** Video-generation state for Studio VIDEO mode and /studio/video (SPEC §14). */
export function useVideoGenerator() {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const assets = useStore((s) => s.assets);
  const addAsset = useStore((s) => s.addAsset);
  const pendingTemplateId = useStore((s) => s.pendingTemplateId);
  const setPendingTemplate = useStore((s) => s.setPendingTemplate);

  const [params, setParams] = useState<VideoParams>(() => {
    const firstImage = assets.find((a) => a.type === "image");
    const base: VideoParams = { concept: "", model: "drift-2", creatorId: creators.find((c) => c.featured)?.id ?? null, durationSec: 10, ratio: "9:16", camera: "Slow zoom", style: "Commercial", sourceAssetId: firstImage?.id ?? null };
    const tpl = pendingTemplateId ? templates.find((t) => t.id === pendingTemplateId)?.preset : undefined;
    if (!tpl || tpl.mode !== "video") return base;
    return {
      ...base,
      durationSec: (tpl.durationSec ?? base.durationSec) as DurationSec,
      ratio: tpl.ratio ?? base.ratio,
      camera: (VIDEO_CAMERAS as readonly string[]).includes(tpl.camera ?? "") ? (tpl.camera as VideoParams["camera"]) : base.camera,
      style: (VIDEO_STYLES as readonly string[]).includes(tpl.style ?? "") ? (tpl.style as VideoParams["style"]) : base.style,
      concept: tpl.prompt ?? "",
    };
  });
  useEffect(() => { if (pendingTemplateId) setPendingTemplate(null); }, [pendingTemplateId, setPendingTemplate]);

  const [result, setResult] = useState<VideoResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<GenError | null>(null);
  const [savedAsset, setSavedAsset] = useState<Asset | null>(null);

  const update = useCallback(<K extends keyof VideoParams>(key: K, value: VideoParams[K]) => setParams((p) => ({ ...p, [key]: value })), []);

  /** `kind` = "ugc" renders through generateUGC with the selected creator (60 credits); default is a product video (50). */
  const generate = useCallback(async (kind: "video" | "ugc" = "video") => {
    if (!params.concept.trim() && !params.sourceAssetId) return;
    const creatorId = params.creatorId;
    if (kind === "ugc" && !creatorId) return;
    setGenerating(true); setError(null); setStep(0); setSavedAsset(null);
    try {
      const src = assets.find((a) => a.id === params.sourceAssetId);
      const out = kind === "ugc" && creatorId
        ? await generateUGC({ creatorId, script: params.concept, durationSec: params.durationSec, productAssetId: params.sourceAssetId, tone: params.style, projectId: currentProjectId }, (_label, index) => setStep(index))
        : await generateVideo({ ...params, sourceUrl: src?.url, projectId: currentProjectId }, (_label, index) => setStep(index));
      // Mock player plays a free sample clip; poster is the generated frame.
      setResult({ ...out, url: SAMPLE_VIDEO_URL, poster: src?.url ?? out.poster, thumbnail: src?.thumbnail ?? out.thumbnail });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "failed";
      setError({ code, message: err instanceof Error ? err.message : "Erreur inconnue" });
    } finally {
      setGenerating(false);
    }
  }, [params, assets, currentProjectId]);

  const ensureAsset = useCallback((): Asset | null => {
    if (!result) return null;
    if (savedAsset) return savedAsset;
    const a = addAsset({ name: (params.concept.trim() || "Vidéo générée").slice(0, 48), type: "video", url: result.url, thumbnail: result.thumbnail, projectId: currentProjectId, favorite: false, width: 1080, height: 1920, durationSec: result.durationSec, sizeKb: 4200, tags: ["generated", params.style] });
    setSavedAsset(a);
    return a;
  }, [result, savedAsset, addAsset, params.concept, params.style, currentProjectId]);

  const source = assets.find((a) => a.id === params.sourceAssetId) ?? null;
  const creator = creators.find((c) => c.id === params.creatorId) ?? null;

  return { params, update, source, creator, result, generating, step, steps: VIDEO_STEPS, error, clearError: () => setError(null), generate, ensureAsset, savedAsset, reset: () => setResult(null) };
}

export type VideoGenerator = ReturnType<typeof useVideoGenerator>;
