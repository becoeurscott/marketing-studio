"use client";

import { ImageIcon, SlidersHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Inspector } from "@/components/shell/ShellContext";
import { AssistantButton } from "@/components/studio/Assistant";
import { StudioError } from "@/components/studio/ErrorState";
import { GeneratingOverlay } from "@/components/studio/GeneratingOverlay";
import { ImageCreatePanel } from "@/components/studio/ImageCreatePanel";
import { ImageWorkbench } from "@/components/studio/ImageWorkbench";
import { useImageGenerator } from "@/components/studio/useImageGenerator";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CREDIT_COSTS } from "@/lib/types";
import { IMAGE_STYLE_LABELS, label, MODELS } from "@/components/studio/constants";

/** SPEC §11–13: full image generator → progress → 4-result gallery with per-result actions + editor. */
export default function ImageGeneratorPage() {
  const gen = useImageGenerator();
  const [sheet, setSheet] = useState(false);
  const canGenerate = !!gen.params.prompt.trim() || !!gen.params.productAssetId;

  return (
    <>
      <PageHeader
        title="Générateur d'images"
        description="Produit, prompt, style, format, arrière-plan, éclairage, cadrage et composition."
        eyebrow={<Link href="/studio" className="text-xs text-text2 hover:text-text">← Studio</Link>}
        actions={
          <span className="lg:hidden inline-flex"><Button variant="secondary" size="sm" leftIcon={<SlidersHorizontal className="size-4" />} onClick={() => setSheet(true)}>Options</Button></span>
        }
      />

      {gen.generating ? (
        <GeneratingOverlay hint={`${label(IMAGE_STYLE_LABELS, gen.params.style)} · ${gen.params.ratio} · 4 variantes`} className="min-h-[460px]" />
      ) : gen.error ? (
        <StudioError code={gen.error.code} message={gen.error.message} onRetry={() => void gen.generate()} />
      ) : gen.results.length ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text2"><span className="text-text font-medium">{gen.results.length} résultats</span> · {label(IMAGE_STYLE_LABELS, gen.params.style)} · {gen.results[0].ratio}</p>
            <Button size="sm" variant="secondary" leftIcon={<Sparkles className="size-4" />} onClick={() => void gen.generate()}>Tout régénérer</Button>
          </div>
          <ImageWorkbench gen={gen} />
          {gen.selected && (
            <div className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center gap-3 text-[13px] text-text2">
              <span className="font-medium text-text">Sélection</span>
              <span>{gen.selected.ratio}</span><span>·</span><span>{MODELS.find((m) => m.id === gen.params.model)?.label ?? gen.params.model}</span><span>·</span><span className="truncate max-w-md">{gen.params.prompt || "Génération à partir du produit seul"}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="lg:hidden">
          <EmptyState icon={ImageIcon} title="Aucun visuel pour l'instant" description="Définissez votre prompt et vos options, puis générez quatre variantes." cta={{ label: "Ouvrir les options", onClick: () => setSheet(true) }} />
        </div>
      )}
      {!gen.generating && !gen.error && gen.results.length === 0 && (
        <div className="hidden lg:block">
          <EmptyState icon={ImageIcon} title="Aucun visuel pour l'instant" description="Remplissez le panneau Créer à droite et générez quatre variantes. Chaque génération coûte 10 crédits." />
        </div>
      )}

      <Inspector>
        <div className="p-4 flex flex-col min-h-full">
          <h2 className="text-[15px] font-semibold mb-4">Créer</h2>
          <ImageCreatePanel params={gen.params} update={gen.update} onGenerate={() => void gen.generate()} generating={gen.generating} templateName={gen.templateName} />
        </div>
      </Inspector>

      {/* Mobile: options sheet + sticky generate */}
      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Créer">
        <ImageCreatePanel params={gen.params} update={gen.update} onGenerate={() => { setSheet(false); void gen.generate(); }} generating={gen.generating} templateName={gen.templateName} />
      </BottomSheet>
      <div className="lg:hidden fixed inset-x-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-40">
        <Button fullWidth size="lg" className="shadow-float" onClick={() => void gen.generate()} loading={gen.generating} disabled={!canGenerate} leftIcon={<Sparkles className="size-4" />}>
          {canGenerate ? `Générer · ${CREDIT_COSTS.image} crédits` : "Ajoutez un prompt pour générer"}
        </Button>
      </div>

      <AssistantButton />
    </>
  );
}
