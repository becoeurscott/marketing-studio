"use client";

import { Clapperboard, Download, Heart, Megaphone, RefreshCw, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Inspector } from "@/components/shell/ShellContext";
import { AssistantButton } from "@/components/studio/Assistant";
import { CampaignPicker } from "@/components/studio/CampaignPicker";
import { StudioError } from "@/components/studio/ErrorState";
import { GeneratingOverlay } from "@/components/studio/GeneratingOverlay";
import { useVideoGenerator } from "@/components/studio/useVideoGenerator";
import { VideoCreatePanel } from "@/components/studio/VideoCreatePanel";
import { VideoPlayer } from "@/components/studio/VideoPlayer";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import { CREDIT_COSTS } from "@/lib/types";

/** SPEC §14: source image, concept, duration, ratio, camera, style → step progress → mock player. */
export default function VideoGeneratorPage() {
  const vid = useVideoGenerator();
  const toast = useToast();
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const favs = useStore((s) => s.favorites.asset);
  const [sheet, setSheet] = useState(false);
  const [campaign, setCampaign] = useState(false);
  const canGenerate = !!vid.params.concept.trim() || !!vid.params.sourceAssetId;
  const fav = !!vid.savedAsset && favs.includes(vid.savedAsset.id);

  return (
    <>
      <PageHeader
        title="Video generator"
        description="Animate a product frame into a 5–15 second clip."
        eyebrow={<Link href="/studio" className="text-xs text-text2 hover:text-text">← Studio</Link>}
        actions={<span className="lg:hidden inline-flex"><Button variant="secondary" size="sm" leftIcon={<SlidersHorizontal className="size-4" />} onClick={() => setSheet(true)}>Options</Button></span>}
      />

      {vid.generating ? (
        <GeneratingOverlay label="Generating your video..." hint={`${vid.params.durationSec}s · ${vid.params.camera} · ${vid.params.style}`} steps={vid.steps} step={vid.step} className="min-h-[460px]" />
      ) : vid.error ? (
        <StudioError code={vid.error.code} message={vid.error.message} onRetry={() => void vid.generate()} />
      ) : vid.result ? (
        <div className="flex flex-col gap-4">
          <VideoPlayer result={vid.result} className="max-w-3xl mx-auto w-full" />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Download className="size-4" />} onClick={() => { const a = vid.ensureAsset(); toast.success("Download started", `${a?.name}.mp4 · ${vid.result?.durationSec}s`); }}>Download</Button>
            <Button variant="secondary" size="sm" leftIcon={<Heart className={fav ? "size-4 fill-current text-highlight" : "size-4"} />} onClick={() => { const a = vid.ensureAsset(); if (a) { toggleFavorite("asset", a.id); toast.info(fav ? "Removed from favorites" : "Added to favorites", a.name); } }}>{fav ? "Favorited" : "Favorite"}</Button>
            <Button variant="secondary" size="sm" leftIcon={<Megaphone className="size-4" />} onClick={() => setCampaign(true)}>Use in Campaign</Button>
            <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="size-4" />} onClick={() => void vid.generate()}>Regenerate</Button>
          </div>
          <p className="text-center text-xs text-muted">Prototype player: the clip is a free sample; the poster is your source frame.</p>
        </div>
      ) : (
        <EmptyState
          icon={Clapperboard}
          title="No video yet"
          description={vid.source ? `Source: ${vid.source.name}. Describe the motion and generate a ${vid.params.durationSec}s clip (${CREDIT_COSTS.video} credits).` : "Pick a source image from your assets, describe the concept and generate."}
          cta={{ label: "Open options", onClick: () => setSheet(true) }}
          className="lg:[&_button]:hidden"
        />
      )}

      <Inspector>
        <div className="p-4 flex flex-col min-h-full">
          <h2 className="text-[15px] font-semibold mb-4">Create</h2>
          <VideoCreatePanel params={vid.params} update={vid.update} onGenerate={() => void vid.generate()} generating={vid.generating} />
        </div>
      </Inspector>

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Create">
        <VideoCreatePanel params={vid.params} update={vid.update} onGenerate={() => { setSheet(false); void vid.generate(); }} generating={vid.generating} />
      </BottomSheet>
      <div className="lg:hidden fixed inset-x-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-40">
        <Button fullWidth size="lg" className="shadow-float" onClick={() => void vid.generate()} loading={vid.generating} disabled={!canGenerate} leftIcon={<Clapperboard className="size-4" />}>
          {canGenerate ? `Generate Video · ${CREDIT_COSTS.video} credits` : "Add a concept to generate"}
        </Button>
      </div>

      <CampaignPicker open={campaign} onClose={() => setCampaign(false)} getAsset={() => vid.ensureAsset()} />
      <AssistantButton />
    </>
  );
}
