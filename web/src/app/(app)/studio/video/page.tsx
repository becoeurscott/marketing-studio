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
import { VIDEO_CAMERA_LABELS, VIDEO_STYLE_LABELS } from "@/components/studio/constants";

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
        title="Générateur de vidéos"
        description="Animez une image produit en un clip de 5 à 15 secondes."
        eyebrow={<Link href="/studio" className="text-xs text-text2 hover:text-text">← Studio</Link>}
        actions={<span className="lg:hidden inline-flex"><Button variant="secondary" size="sm" leftIcon={<SlidersHorizontal className="size-4" />} onClick={() => setSheet(true)}>Options</Button></span>}
      />

      {vid.generating ? (
        <GeneratingOverlay label="Génération de votre vidéo…" hint={`${vid.params.durationSec} s · ${VIDEO_CAMERA_LABELS[vid.params.camera]} · ${VIDEO_STYLE_LABELS[vid.params.style]}`} steps={vid.steps} step={vid.step} className="min-h-[460px]" />
      ) : vid.error ? (
        <StudioError code={vid.error.code} message={vid.error.message} onRetry={() => void vid.generate()} />
      ) : vid.result ? (
        <div className="flex flex-col gap-4">
          <VideoPlayer result={vid.result} className="max-w-3xl mx-auto w-full" />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Download className="size-4" />} onClick={() => { const a = vid.ensureAsset(); toast.success("Téléchargement lancé", `${a?.name}.mp4 · ${vid.result?.durationSec} s`); }}>Télécharger</Button>
            <Button variant="secondary" size="sm" leftIcon={<Heart className={fav ? "size-4 fill-current text-highlight" : "size-4"} />} onClick={() => { const a = vid.ensureAsset(); if (a) { toggleFavorite("asset", a.id); toast.info(fav ? "Retiré des favoris" : "Ajouté aux favoris", a.name); } }}>{fav ? "En favori" : "Favori"}</Button>
            <Button variant="secondary" size="sm" leftIcon={<Megaphone className="size-4" />} onClick={() => setCampaign(true)}>Utiliser dans une campagne</Button>
            <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="size-4" />} onClick={() => void vid.generate()}>Régénérer</Button>
          </div>
          <p className="text-center text-xs text-muted">Lecteur de démonstration : le clip est un extrait libre de droits ; l’aperçu est votre image source.</p>
        </div>
      ) : (
        <EmptyState
          icon={Clapperboard}
          title="Aucune vidéo pour l'instant"
          description={vid.source ? `Source : ${vid.source.name}. Décrivez le mouvement et générez un clip de ${vid.params.durationSec} s (${CREDIT_COSTS.video} crédits).` : "Choisissez une image source dans vos ressources, décrivez le concept et lancez la génération."}
          cta={{ label: "Ouvrir les options", onClick: () => setSheet(true) }}
          className="lg:[&_button]:hidden"
        />
      )}

      <Inspector>
        <div className="p-4 flex flex-col min-h-full">
          <h2 className="text-[15px] font-semibold mb-4">Créer</h2>
          <VideoCreatePanel params={vid.params} update={vid.update} onGenerate={() => void vid.generate()} generating={vid.generating} />
        </div>
      </Inspector>

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Créer">
        <VideoCreatePanel params={vid.params} update={vid.update} onGenerate={() => { setSheet(false); void vid.generate(); }} generating={vid.generating} />
      </BottomSheet>
      <div className="lg:hidden fixed inset-x-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-40">
        <Button fullWidth size="lg" className="shadow-float" onClick={() => void vid.generate()} loading={vid.generating} disabled={!canGenerate} leftIcon={<Clapperboard className="size-4" />}>
          {canGenerate ? `Générer la vidéo · ${CREDIT_COSTS.video} crédits` : "Ajoutez un concept pour générer"}
        </Button>
      </div>

      <CampaignPicker open={campaign} onClose={() => setCampaign(false)} getAsset={() => vid.ensureAsset()} />
      <AssistantButton />
    </>
  );
}
