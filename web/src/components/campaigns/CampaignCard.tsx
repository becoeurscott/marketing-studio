"use client";

import { Images, Layers } from "lucide-react";
import Link from "next/link";
import { Badge, statusTone } from "@/components/ui/Badge";
import type { Asset, Campaign } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { PlatformIcons, objectiveLabel, statusLabel } from "./platform";

export function CampaignCard({ campaign, assets }: { campaign: Campaign; assets: Asset[] }) {
  const thumbs = campaign.assetIds
    .map((id) => assets.find((a) => a.id === id))
    .filter((a): a is Asset => Boolean(a))
    .slice(0, 4);
  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className={cn("group block rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-white/15")}
    >
      <div className="relative aspect-[16/9] bg-elevated grid grid-cols-4 gap-px overflow-hidden">
        {thumbs.length === 0 && <div className="col-span-4 flex items-center justify-center text-muted"><Images className="size-6" /></div>}
        {thumbs.map((a) => (
          <img key={a.id} src={a.thumbnail} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <Badge tone={statusTone(campaign.status)} dot className="absolute top-3 left-3">{statusLabel(campaign.status)}</Badge>
        <span className="absolute bottom-3 left-3 text-[11px] font-medium text-white/80 bg-black/40 backdrop-blur px-2 py-0.5 rounded-full">{objectiveLabel(campaign.objective)}</span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{campaign.name}</p>
            <p className="text-xs text-muted mt-0.5 truncate">{campaign.audience}</p>
          </div>
          <PlatformIcons platforms={campaign.platforms} />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-text2">
          <span className="inline-flex items-center gap-1"><Images className="size-3.5" /> {campaign.assetIds.length} ressources</span>
          <span className="inline-flex items-center gap-1"><Layers className="size-3.5" /> {campaign.variations.length} variantes</span>
          <span className="ml-auto text-muted">{timeAgo(campaign.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
