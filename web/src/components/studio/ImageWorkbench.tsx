"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { ImageResult } from "@/lib/api";
import { CampaignPicker } from "./CampaignPicker";
import { ImageEditor } from "./ImageEditor";
import { ImageResults } from "./ImageResults";
import type { ImageGenerator } from "./useImageGenerator";
import { downloadUrl } from "@/lib/utils";

/**
 * Wires the result gallery to the generator: download (toast), favorite, edit (Image Editor),
 * upscale, regenerate, use in campaign (Campaign picker). Shared by Studio IMAGE mode and /studio/image.
 */
export function ImageWorkbench({ gen, dense, className }: { gen: ImageGenerator; dense?: boolean; className?: string }) {
  const toast = useToast();
  const [editing, setEditing] = useState<ImageResult | null>(null);
  const [campaignFor, setCampaignFor] = useState<ImageResult | null>(null);

  const download = (r: ImageResult) => {
    const a = gen.ensureAsset(r);
    downloadUrl(r.url, a.name);
    toast.success("Téléchargement lancé", a.name);
  };
  const favorite = (r: ImageResult) => {
    const { asset, favorited } = gen.favorite(r);
    toast.info(favorited ? "Ajouté aux favoris" : "Retiré des favoris", asset.name);
  };
  const upscale = async (r: ImageResult) => {
    const ok = await gen.upscale(r);
    if (ok) toast.success("Agrandi en 2400×3000", "15 crédits utilisés");
  };

  return (
    <>
      <ImageResults
        className={className}
        dense={dense}
        results={gen.results}
        selectedId={gen.selectedId}
        onSelect={gen.setSelectedId}
        ratio={gen.results[0]?.ratio ?? gen.params.ratio}
        busyId={gen.busyId}
        assetIdFor={(r) => gen.ensureAssetIdIfSaved(r)}
        onDownload={download}
        onFavorite={favorite}
        onEdit={setEditing}
        onUpscale={(r) => void upscale(r)}
        onRegenerate={() => void gen.generate()}
        onUseInCampaign={setCampaignFor}
      />
      <ImageEditor open={!!editing} onClose={() => setEditing(null)} result={editing} onApply={(next) => { if (editing) gen.replaceResult(editing.id, next); toast.success("Modifications enregistrées", "Le résultat a été mis à jour."); }} />
      <CampaignPicker open={!!campaignFor} onClose={() => setCampaignFor(null)} getAsset={() => (campaignFor ? gen.ensureAsset(campaignFor) : null)} />
    </>
  );
}
