"use client";

import { useEffect, useState } from "react";
import { templates } from "@/data";
import { useStore } from "@/lib/store";
import type { StudioMode, Template, TemplatePreset } from "@/lib/types";

/** Route a template preset to the Studio page that handles its mode. */
export function studioRouteForMode(mode: StudioMode): string {
  switch (mode) {
    case "ugc": return "/studio/ugc";
    case "ads": return "/studio/ads";
    case "copy": return "/studio/copy";
    case "product-shoot": return "/studio/product-shoot";
    default: return "/studio"; // image + video live on the main Studio canvas
  }
}

/**
 * Consume the template chosen via "Use Template" (store.pendingTemplateId) for a
 * Studio page. Returns the template only when its preset mode matches `mode`, so a
 * page can seed its initial state from it (use inside `useState` initializers),
 * and clears the pending id after the first render so it isn't applied twice.
 */
export function useTemplatePreset(mode: StudioMode): { template: Template | null; preset: TemplatePreset | null } {
  const pendingTemplateId = useStore((s) => s.pendingTemplateId);
  const setPendingTemplate = useStore((s) => s.setPendingTemplate);
  const [template] = useState<Template | null>(() => {
    const tpl = pendingTemplateId ? templates.find((t) => t.id === pendingTemplateId) : undefined;
    return tpl && tpl.preset.mode === mode ? tpl : null;
  });
  useEffect(() => { if (pendingTemplateId) setPendingTemplate(null); }, [pendingTemplateId, setPendingTemplate]);
  return { template, preset: template?.preset ?? null };
}

/** "friendly" → "Friendly" (Tone ids are lowercase; some pages use capitalised labels). */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
