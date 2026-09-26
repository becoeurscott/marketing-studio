"use client";

import { Check, Megaphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { Asset } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = { draft: "Brouillon", active: "Active", completed: "Terminée" };

/** "Use in Campaign": pick a campaign → updateCampaign(assetIds). `getAsset` persists the result lazily. */
export function CampaignPicker({ open, onClose, getAsset }: { open: boolean; onClose: () => void; getAsset: () => Asset | null }) {
  const campaigns = useStore((s) => s.campaigns);
  const updateCampaign = useStore((s) => s.updateCampaign);
  const toast = useToast();
  const [picked, setPicked] = useState<string | null>(null);
  const router = useRouter();

  const confirm = () => {
    const c = campaigns.find((x) => x.id === picked);
    const asset = getAsset();
    if (!c || !asset) return;
    if (!c.assetIds.includes(asset.id)) updateCampaign(c.id, { assetIds: [asset.id, ...c.assetIds] });
    toast.toast({ title: "Ajouté à la campagne", description: c.name, tone: "success", action: { label: "Ouvrir la campagne", onClick: () => router.push(`/campaigns/${c.id}`) } });
    setPicked(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Utiliser dans une campagne"
      description="Ajoutez ce visuel aux ressources d'une campagne."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={confirm} disabled={!picked} leftIcon={<Megaphone className="size-4" />}>Ajouter à la campagne</Button>
        </>
      }
    >
      {campaigns.length ? (
        <ul className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
          {campaigns.map((c) => {
            const sel = c.id === picked;
            return (
              <li key={c.id}>
                <button onClick={() => setPicked(c.id)} className={cn("w-full text-left flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors", sel ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-white/20")} aria-pressed={sel}>
                  <span className={cn("size-5 rounded-full border flex items-center justify-center shrink-0", sel ? "bg-accent border-accent" : "border-border-strong")}>{sel && <Check className="size-3 text-white" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">{c.name}</span>
                    <span className="block text-xs text-muted">{c.assetIds.length} ressource{c.assetIds.length > 1 ? "s" : ""} · {c.platforms.join(", ")}</span>
                  </span>
                  <Badge tone={statusTone(c.status)} dot>{STATUS_LABELS[c.status] ?? c.status}</Badge>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState compact icon={Megaphone} title="Aucune campagne pour l'instant" description="Créez d'abord une campagne, puis ajoutez-y des visuels." secondary={<Link href="/campaigns"><Button variant="secondary">Voir les campagnes</Button></Link>} />
      )}
    </Modal>
  );
}
