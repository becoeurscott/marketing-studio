"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { templates } from "@/data";
import { ApiError, generateImage, upscaleImage, type ImageResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { Asset, TemplatePreset } from "@/lib/types";
import { BACKGROUNDS, COMPOSITIONS, IMAGE_CAMERAS, LIGHTING, type ImageParams } from "./constants";

export interface GenError { code: "insufficient-credits" | "failed"; message: string }
export type SaveStatus = "saved" | "saving" | "unsaved";

function applyPreset(base: ImageParams, preset?: TemplatePreset): ImageParams {
  if (!preset) return base;
  return { ...base, prompt: preset.prompt ?? base.prompt, style: preset.style ?? base.style, ratio: preset.ratio ?? base.ratio };
}

/**
 * All image-generation state for Studio IMAGE mode and /studio/image.
 * Consumes `pendingTemplateId` from the store (set by Templates "Use Template") on first mount.
 */
export function useImageGenerator() {
  const prefs = useStore((s) => s.preferences);
  const currentProjectId = useStore((s) => s.currentProjectId);
  const pendingTemplateId = useStore((s) => s.pendingTemplateId);
  const setPendingTemplate = useStore((s) => s.setPendingTemplate);
  const addAsset = useStore((s) => s.addAsset);
  const toggleFavorite = useStore((s) => s.toggleFavorite);

  const [params, setParams] = useState<ImageParams>(() => {
    const base: ImageParams = {
      prompt: "", style: prefs.defaultStyle, ratio: prefs.defaultRatio, model: "marketing-studio",
      background: BACKGROUNDS[0], lighting: LIGHTING[0], camera: IMAGE_CAMERAS[1], composition: COMPOSITIONS[0], productAssetId: null,
    };
    const tpl = pendingTemplateId ? templates.find((t) => t.id === pendingTemplateId) : undefined;
    return applyPreset(base, tpl?.preset);
  });
  const [templateName] = useState<string | null>(() => (pendingTemplateId ? templates.find((t) => t.id === pendingTemplateId)?.title ?? null : null));
  useEffect(() => { if (pendingTemplateId) setPendingTemplate(null); }, [pendingTemplateId, setPendingTemplate]);

  const [results, setResults] = useState<ImageResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<GenError | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  /* undo / redo over result sets */
  const past = useRef<ImageResult[][]>([]);
  const future = useRef<ImageResult[][]>([]);
  /* History lives in refs; mirror the lengths in state so the UI re-renders. */
  const [histLen, setHistLen] = useState({ past: 0, future: 0 });
  const syncHist = () => setHistLen({ past: past.current.length, future: future.current.length });
  const commit = useCallback((next: ImageResult[]) => {
    past.current.push(results);
    future.current = [];
    setResults(next);
    setSelectedId(next[0]?.id ?? null);
    syncHist();
  }, [results]);
  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(results);
    setResults(prev); setSelectedId(prev[0]?.id ?? null); syncHist();
  }, [results]);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(results);
    setResults(next); setSelectedId(next[0]?.id ?? null); syncHist();
  }, [results]);
  const canUndo = histLen.past > 0;
  const canRedo = histLen.future > 0;

  const markSaved = useCallback(() => {
    setSaveStatus("saving");
    window.setTimeout(() => setSaveStatus("saved"), 900);
  }, []);

  const update = useCallback(<K extends keyof ImageParams>(key: K, value: ImageParams[K]) => {
    setParams((p) => ({ ...p, [key]: value }));
    setSaveStatus("unsaved");
  }, []);

  const generate = useCallback(async () => {
    if (!params.prompt.trim() && !params.productAssetId) return;
    setGenerating(true); setError(null);
    try {
      const out = await generateImage({ ...params, projectId: currentProjectId, count: 2 });
      commit(out);
      markSaved();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "failed";
      setError({ code, message: err instanceof Error ? err.message : "Erreur inconnue" });
    } finally {
      setGenerating(false);
    }
  }, [params, currentProjectId, commit, markSaved]);

  /** Persist a result as an Asset (once) and return it. */
  const savedAssets = useRef<Map<string, Asset>>(new Map());
  const ensureAsset = useCallback((r: ImageResult): Asset => {
    const cached = savedAssets.current.get(r.id);
    if (cached) return cached;
    const name = (params.prompt.trim() || "Visuel généré").slice(0, 48);
    const asset = addAsset({ name, type: "image", url: r.url, thumbnail: r.thumbnail, projectId: currentProjectId, favorite: false, width: 1600, height: 2000, sizeKb: 1400, tags: ["generated", params.style] });
    savedAssets.current.set(r.id, asset);
    return asset;
  }, [addAsset, currentProjectId, params.prompt, params.style]);

  /** Asset id if this result was already persisted (no side effects). */
  const ensureAssetIdIfSaved = useCallback((r: ImageResult) => savedAssets.current.get(r.id)?.id, []);

  /** Toggle favorite; returns the asset and whether it is now favorited. */
  const favorite = useCallback((r: ImageResult) => {
    const a = ensureAsset(r);
    const was = useStore.getState().favorites.asset.includes(a.id);
    toggleFavorite("asset", a.id);
    return { asset: a, favorited: !was };
  }, [ensureAsset, toggleFavorite]);

  const upscale = useCallback(async (r: ImageResult) => {
    setBusyId(r.id); setError(null);
    try {
      const up = await upscaleImage({ url: r.url, projectId: currentProjectId });
      commit(results.map((x) => (x.id === r.id ? { ...up, id: r.id } : x)));
      markSaved();
      return true;
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "failed";
      setError({ code, message: err instanceof Error ? err.message : "Erreur inconnue" });
      return false;
    } finally {
      setBusyId(null);
    }
  }, [currentProjectId, results, commit, markSaved]);

  /** Replace a result (e.g. after the editor applies changes). */
  const replaceResult = useCallback((id: string, next: ImageResult) => {
    commit(results.map((x) => (x.id === id ? next : x)));
    savedAssets.current.delete(id);
    markSaved();
  }, [results, commit, markSaved]);

  const selected = results.find((r) => r.id === selectedId) ?? null;

  return {
    params, update, setParams, templateName,
    results, selected, selectedId, setSelectedId,
    generating, busyId, error, clearError: () => setError(null),
    generate, upscale, favorite, ensureAsset, ensureAssetIdIfSaved, replaceResult,
    undo, redo, canUndo, canRedo, saveStatus,
  };
}

export type ImageGenerator = ReturnType<typeof useImageGenerator>;
