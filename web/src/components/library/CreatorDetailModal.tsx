"use client";

import { Heart, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { Creator } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GENDER_LABELS } from "@/lib/labels";

export function CreatorDetailModal({ creator, onClose }: { creator: Creator | null; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const favorites = useStore((s) => s.favorites.creator);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const fav = creator ? favorites.includes(creator.id) : false;

  const useInUGC = () => {
    if (!creator) return;
    toast.success(`${creator.name} sélectionné(e)`, "Ouverture du créateur UGC.");
    onClose();
    router.push(`/studio/ugc?creator=${encodeURIComponent(creator.id)}`);
  };

  return (
    <Modal open={!!creator} onClose={onClose} size="lg" className="overflow-hidden">
      {creator && (
        <div className="flex flex-col md:flex-row gap-5 pt-5">
          <div className="md:w-[260px] shrink-0">
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-elevated">
              <img src={creator.avatarUrl} alt={creator.name} className="size-full object-cover" />
              {creator.featured && <Badge tone="accent" className="absolute top-3 left-3">À la une</Badge>}
            </div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight">{creator.name}</h2>
                <p className="text-sm text-text2">{GENDER_LABELS[creator.gender]} · {creator.age} ans · {creator.ageRange}</p>
              </div>
              <button
                type="button"
                aria-pressed={fav}
                onClick={() => toggleFavorite("creator", creator.id)}
                className={cn("size-9 rounded-full border flex items-center justify-center transition-colors", fav ? "bg-accent border-accent text-on-accent" : "border-border-strong text-text2 hover:text-text")}
                aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <Heart className={cn("size-4", fav && "fill-current")} />
              </button>
            </div>
            <p className="text-sm text-text2 mt-3 leading-relaxed">{creator.bio}</p>
            <dl className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <div className="rounded-md bg-surface border border-border p-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted">Style</dt>
                <dd className="mt-1 font-medium">{creator.style}</dd>
              </div>
              <div className="rounded-md bg-surface border border-border p-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted">Langues</dt>
                <dd className="mt-1 font-medium">{creator.languages.join(", ")}</dd>
              </div>
            </dl>
            <figure className="mt-4">
              <img src={creator.sheet} alt={`Fiche personnage de ${creator.name}`} loading="lazy" className="w-full rounded-md border border-border bg-surface" />
              <figcaption className="text-[11px] text-muted mt-1.5">Fiche personnage : la même personne dans toutes vos vidéos.</figcaption>
            </figure>
            {creator.intro && <video src={creator.intro} controls playsInline preload="none" poster={creator.portrait} className="mt-3 w-full max-h-72 rounded-md border border-border bg-black" />}
            <p className="text-[11px] text-muted mt-3">Créateur IA. Persona fictif ; son apparence est générée par synthèse.</p>
            <div className="mt-auto pt-5 flex items-center gap-2 justify-end">
              <Button variant="ghost" onClick={onClose}>Fermer</Button>
              <Button leftIcon={<Video className="size-4" />} onClick={useInUGC}>Utiliser en UGC</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
