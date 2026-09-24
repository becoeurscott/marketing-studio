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

/** SPEC §11–13: full image generator → progress → 4-result gallery with per-result actions + editor. */
export default function ImageGeneratorPage() {
  const gen = useImageGenerator();
  const [sheet, setSheet] = useState(false);
  const canGenerate = !!gen.params.prompt.trim() || !!gen.params.productAssetId;

  return (
    <>
      <PageHeader
        title="Image generator"
        description="Product, prompt, style, ratio, background, lighting, camera and composition."
        eyebrow={<Link href="/studio" className="text-xs text-text2 hover:text-text">← Studio</Link>}
        actions={
          <span className="lg:hidden inline-flex"><Button variant="secondary" size="sm" leftIcon={<SlidersHorizontal className="size-4" />} onClick={() => setSheet(true)}>Options</Button></span>
        }
      />

      {gen.generating ? (
        <GeneratingOverlay hint={`${gen.params.style} · ${gen.params.ratio} · 4 variations`} className="min-h-[460px]" />
      ) : gen.error ? (
        <StudioError code={gen.error.code} message={gen.error.message} onRetry={() => void gen.generate()} />
      ) : gen.results.length ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text2"><span className="text-text font-medium">{gen.results.length} results</span> · {gen.params.style} · {gen.results[0].ratio}</p>
            <Button size="sm" variant="secondary" leftIcon={<Sparkles className="size-4" />} onClick={() => void gen.generate()}>Regenerate all</Button>
          </div>
          <ImageWorkbench gen={gen} />
          {gen.selected && (
            <div className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center gap-3 text-[13px] text-text2">
              <span className="font-medium text-text">Selected</span>
              <span>{gen.selected.ratio}</span><span>·</span><span>{gen.params.model}</span><span>·</span><span className="truncate max-w-md">{gen.params.prompt || "Product-only generation"}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="lg:hidden">
          <EmptyState icon={ImageIcon} title="No visuals yet" description="Set your prompt and options, then generate four variations." cta={{ label: "Open options", onClick: () => setSheet(true) }} />
        </div>
      )}
      {!gen.generating && !gen.error && gen.results.length === 0 && (
        <div className="hidden lg:block">
          <EmptyState icon={ImageIcon} title="No visuals yet" description="Fill in the Create panel on the right and generate four variations. Each generation costs 10 credits." />
        </div>
      )}

      <Inspector>
        <div className="p-4 flex flex-col min-h-full">
          <h2 className="text-[15px] font-semibold mb-4">Create</h2>
          <ImageCreatePanel params={gen.params} update={gen.update} onGenerate={() => void gen.generate()} generating={gen.generating} templateName={gen.templateName} />
        </div>
      </Inspector>

      {/* Mobile: options sheet + sticky generate */}
      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Create">
        <ImageCreatePanel params={gen.params} update={gen.update} onGenerate={() => { setSheet(false); void gen.generate(); }} generating={gen.generating} templateName={gen.templateName} />
      </BottomSheet>
      <div className="lg:hidden fixed inset-x-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-40">
        <Button fullWidth size="lg" className="shadow-float" onClick={() => void gen.generate()} loading={gen.generating} disabled={!canGenerate} leftIcon={<Sparkles className="size-4" />}>
          {canGenerate ? `Generate · ${CREDIT_COSTS.image} credits` : "Add a prompt to generate"}
        </Button>
      </div>

      <AssistantButton />
    </>
  );
}
