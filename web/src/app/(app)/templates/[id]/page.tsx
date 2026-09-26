"use client";

import { ArrowLeft, Heart, LayoutTemplate, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { TemplateCard, platformLabel } from "@/components/library/TemplateCard";
import { usePageTitle } from "@/components/shell/ShellContext";
import { PageHeader, Section } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { templates } from "@/data";
import { studioRouteForMode } from "@/components/studio/useTemplatePreset";
import { useStore } from "@/lib/store";
import { cn, formatNumber } from "@/lib/utils";
import { AD_FORMAT_LABELS, IMAGE_STYLE_LABELS, STUDIO_MODE_LABELS, TEMPLATE_CATEGORY_LABELS, TONE_LABELS, labelOf } from "@/lib/labels";


export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const template = templates.find((t) => t.id === id);
  const favorites = useStore((s) => s.favorites.template);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const setPendingTemplate = useStore((s) => s.setPendingTemplate);
  usePageTitle(template?.title);

  if (!template) {
    return (
      <EmptyState icon={LayoutTemplate} title="Modèle introuvable" description="Il a peut-être été supprimé, ou le lien est incorrect." cta={{ label: "Parcourir les modèles", href: "/templates" }} />
    );
  }

  const fav = favorites.includes(template.id);
  const related = templates.filter((t) => t.category === template.category && t.id !== template.id).slice(0, 4);
  const preset = template.preset;
  const presetRows: [string, string | undefined][] = [
    ["Mode", STUDIO_MODE_LABELS[preset.mode]],
    ["Style", preset.style ? labelOf(IMAGE_STYLE_LABELS, preset.style) : undefined],
    ["Format d’image", preset.ratio],
    ["Durée", preset.durationSec ? `${preset.durationSec} s` : undefined],
    ["Camera", preset.camera],
    ["Ton", preset.tone ? labelOf(TONE_LABELS, preset.tone) : undefined],
  ];

  const useTemplate = () => {
    setPendingTemplate(template.id);
    toast.success("Modèle chargé", `Le Studio est configuré pour « ${template.title} ».`);
    router.push(studioRouteForMode(template.preset.mode));
  };

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/templates" className="inline-flex items-center gap-1 text-[13px] text-text2 hover:text-text"><ArrowLeft className="size-3.5" /> Modèles</Link>}
        title={template.title}
        description={template.description}
        actions={
          <>
            <Button variant="secondary" aria-pressed={fav} leftIcon={<Heart className={cn("size-4", fav && "fill-current text-highlight")} />} onClick={() => toggleFavorite("template", template.id)}>
              {fav ? "Enregistré" : "Enregistrer"}
            </Button>
            <Button leftIcon={<Sparkles className="size-4" />} onClick={useTemplate}>Utiliser ce modèle</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 mb-8">
        <div className="relative rounded-xl overflow-hidden bg-elevated border border-border">
          <img src={template.thumbnail} alt={template.title} className="w-full max-h-[70vh] object-cover" />
          {template.popular && <Badge tone="accent" className="absolute top-4 left-4">Populaire</Badge>}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-[15px] font-semibold mb-3">Détails</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-text2">Catégorie</dt><dd className="font-medium">{labelOf(TEMPLATE_CATEGORY_LABELS, template.category)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-text2">Plateforme</dt><dd><Badge tone="outline">{platformLabel(template.platform)}</Badge></dd></div>
              <div className="flex justify-between gap-3"><dt className="text-text2">Format</dt><dd className="font-medium">{labelOf(AD_FORMAT_LABELS, template.format)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-text2">Utilisations</dt><dd className="font-medium">{formatNumber(template.uses)}</dd></div>
            </dl>
          </Card>
          <Card>
            <h3 className="text-[15px] font-semibold mb-1">Préréglage du Studio</h3>
            <p className="text-[13px] text-text2 mb-3">Ces réglages sont appliqués lorsque vous utilisez le modèle.</p>
            <dl className="space-y-2.5 text-sm">
              {presetRows.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-text2">{k}</dt><dd className="font-medium capitalize">{v}</dd></div>
              ))}
              {preset.prompt && (
                <div>
                  <dt className="text-text2 mb-1">Prompt</dt>
                  <dd className="text-[13px] bg-surface border border-border rounded-md p-2.5 text-text2 leading-relaxed">“{preset.prompt}”</dd>
                </div>
              )}
            </dl>
          </Card>
          <Button fullWidth size="lg" leftIcon={<Sparkles className="size-4" />} onClick={useTemplate}>Utiliser ce modèle</Button>
        </div>
      </div>

      {related.length > 0 && (
        <Section title={`Plus de modèles ${labelOf(TEMPLATE_CATEGORY_LABELS, template.category)}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {related.map((t) => <TemplateCard key={t.id} template={t} />)}
          </div>
        </Section>
      )}
    </>
  );
}
