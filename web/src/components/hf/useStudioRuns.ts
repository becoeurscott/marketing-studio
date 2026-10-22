"use client";

import { useCallback, useState } from "react";
import { ApiError, generateImage, generateUGC, generateVideo } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { AspectRatio } from "@/lib/types";
import { uid } from "@/lib/utils";
import type { ImageModelId, VideoModelId } from "@/lib/higgsfield/models";

export type RunKind = "image" | "video" | "ugc";
export interface Run {
  id: string;
  kind: RunKind;
  prompt: string;
  modelLabel: string;
  ratio: AspectRatio;
  status: "running" | "done" | "failed";
  /** Expected number of tiles while running (image count). */
  slots: number;
  urls: string[];
  poster?: string;
  error?: { code: string; message: string };
  createdAt: number;
}

export interface RunInput {
  kind: RunKind;
  prompt: string;
  modelLabel: string;
  ratio: AspectRatio;
  imageModel?: ImageModelId;
  count?: number;
  videoModel?: VideoModelId;
  durationSec?: 5 | 10 | 15;
  productAssetId?: string | null;
  creatorId?: string | null;
}

/**
 * Higgsfield-style run feed: every generation becomes a card at the top of the feed, several can run
 * at once, and finished media is saved to the library. Credits are still charged and refunded by the server.
 */
export function useStudioRuns() {
  const [runs, setRuns] = useState<Run[]>([]);
  const patch = (id: string, p: Partial<Run>) => setRuns((all) => all.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const submit = useCallback(async (input: RunInput) => {
    const s = useStore.getState();
    const projectId = s.currentProjectId;
    const id = uid("run");
    const slots = input.kind === "image" ? input.count ?? 1 : 1;
    setRuns((all) => [{ id, kind: input.kind, prompt: input.prompt, modelLabel: input.modelLabel, ratio: input.ratio, status: "running", slots, urls: [], createdAt: Date.now() }, ...all]);
    const name = (input.prompt.trim() || (input.kind === "image" ? "Visuel généré" : "Vidéo générée")).slice(0, 48);
    try {
      if (input.kind === "image") {
        const out = await generateImage({ prompt: input.prompt, ratio: input.ratio, model: input.imageModel, count: slots, productAssetId: input.productAssetId, projectId });
        for (const r of out) s.addAsset({ name, type: "image", url: r.url, thumbnail: r.thumbnail, projectId, favorite: false, width: 1600, height: 2000, sizeKb: 1400, tags: ["generated"] });
        patch(id, { status: "done", urls: out.map((r) => r.url) });
      } else {
        const src = s.assets.find((a) => a.id === input.productAssetId);
        const dur = input.durationSec ?? 5;
        const out = input.kind === "ugc" && input.creatorId
          ? await generateUGC({ creatorId: input.creatorId, script: input.prompt, durationSec: dur, productAssetId: input.productAssetId, projectId })
          : await generateVideo({ concept: input.prompt, durationSec: dur, ratio: input.ratio, model: input.videoModel, sourceAssetId: input.productAssetId, sourceUrl: src?.url, projectId });
        const poster = out.poster || src?.url || "";
        s.addAsset({ name, type: "video", url: out.url, thumbnail: out.thumbnail || poster, projectId, favorite: false, width: 1080, height: 1920, durationSec: out.durationSec, sizeKb: 4200, tags: ["generated"] });
        patch(id, { status: "done", urls: [out.url], poster });
      }
    } catch (err) {
      patch(id, { status: "failed", error: { code: err instanceof ApiError ? err.code : "failed", message: err instanceof Error ? err.message : "Erreur inconnue" } });
    }
  }, []);

  const remove = useCallback((id: string) => setRuns((all) => all.filter((r) => r.id !== id)), []);
  return { runs, submit, remove, running: runs.filter((r) => r.status === "running").length };
}
