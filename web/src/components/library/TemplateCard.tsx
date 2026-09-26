"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import { PLATFORMS, type Template } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { AD_FORMAT_LABELS, TEMPLATE_CATEGORY_LABELS, labelOf } from "@/lib/labels";

export function platformLabel(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

export function TemplateCard({ template, className }: { template: Template; className?: string }) {
  const favorites = useStore((s) => s.favorites.template);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const fav = favorites.includes(template.id);

  return (
    <div className={cn("relative group", className)}>
      <Link href={`/templates/${template.id}`} className="block rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-white/15">
        <div className="relative aspect-[4/5] bg-elevated overflow-hidden">
          <img src={template.thumbnail} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          {template.popular && <Badge tone="accent" className="absolute top-3 left-3">Populaire</Badge>}
          <div className="absolute inset-x-3 bottom-3">
            <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{template.title}</p>
            <p className="text-[11px] text-white/70 mt-1">{formatNumber(template.uses)} utilisations</p>
          </div>
        </div>
        <div className="px-3 py-2.5 flex items-center gap-1.5 flex-wrap">
          <Badge tone="outline">{platformLabel(template.platform)}</Badge>
          <Badge tone="neutral">{labelOf(AD_FORMAT_LABELS, template.format)}</Badge>
          <span className="ml-auto text-[11px] text-muted truncate">{labelOf(TEMPLATE_CATEGORY_LABELS, template.category)}</span>
        </div>
      </Link>
      <button
        type="button"
        aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={fav}
        onClick={(e) => { e.preventDefault(); toggleFavorite("template", template.id); }}
        className={cn(
          "absolute top-3 right-3 size-8 rounded-full flex items-center justify-center backdrop-blur transition-colors",
          fav ? "bg-accent text-white" : "bg-black/50 text-white hover:bg-black/70",
        )}
      >
        <Heart className={cn("size-4", fav && "fill-current")} />
      </button>
    </div>
  );
}
