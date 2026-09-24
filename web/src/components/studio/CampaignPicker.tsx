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
    toast.toast({ title: "Added to campaign", description: c.name, tone: "success", action: { label: "Open campaign", onClick: () => router.push(`/campaigns/${c.id}`) } });
    setPicked(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Use in campaign"
      description="Add this visual to a campaign's asset set."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={confirm} disabled={!picked} leftIcon={<Megaphone className="size-4" />}>Add to campaign</Button>
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
                    <span className="block text-xs text-muted">{c.assetIds.length} assets · {c.platforms.join(", ")}</span>
                  </span>
                  <Badge tone={statusTone(c.status)} dot>{c.status}</Badge>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState compact icon={Megaphone} title="No campaigns yet" description="Create a campaign first, then add visuals to it." secondary={<Link href="/campaigns"><Button variant="secondary">Go to Campaigns</Button></Link>} />
      )}
    </Modal>
  );
}
