"use client";

import { Check, Star } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { creators } from "@/data";
import type { Creator } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Modal: pick the UGC creator that will appear in the video. */
export function CreatorPicker({ open, onClose, onPick, selectedId }: { open: boolean; onClose: () => void; onPick: (c: Creator) => void; selectedId?: string | null }) {
  return (
    <Modal open={open} onClose={onClose} title="Choisir un créateur" description="Le créateur présentera votre produit dans la vidéo." size="lg">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {creators.map((c) => {
          const sel = c.id === selectedId;
          return (
            <button key={c.id} onClick={() => { onPick(c); onClose(); }} className={cn("group relative rounded-md overflow-hidden border text-left transition-colors", sel ? "border-accent shadow-glow" : "border-border hover:border-white/25")} title={c.bio}>
              <img src={c.avatarUrl} alt={c.name} className="w-full aspect-square object-cover" loading="lazy" />
              <span className="block px-2 py-1.5 bg-surface">
                <span className="block text-[13px] font-medium truncate">{c.name}</span>
                <span className="block text-[11px] text-muted truncate">{c.style} · {c.ageRange}</span>
              </span>
              {c.featured && <span className="absolute top-1.5 left-1.5 size-5 rounded-full bg-black/60 backdrop-blur flex items-center justify-center"><Star className="size-3 text-warning" /></span>}
              {sel && <span className="absolute top-1.5 right-1.5 size-5 rounded-full bg-accent flex items-center justify-center"><Check className="size-3 text-on-accent" /></span>}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
