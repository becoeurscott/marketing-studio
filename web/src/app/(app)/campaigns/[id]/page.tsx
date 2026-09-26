"use client";

import { ArrowLeft, BarChart3, CalendarDays, Copy as CopyIcon, Download, FileText, Images, Layers, Megaphone, Trash2, Video, Wand2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CampaignAnalyticsPanel, StatTile } from "@/components/campaigns/AnalyticsCharts";
import { CalendarView } from "@/components/campaigns/CalendarView";
import { PlatformIcon, formatLabel, objectiveLabel, platformLabel, statusLabel, toneLabel } from "@/components/campaigns/platform";
import { AssetCard } from "@/components/assets/AssetCard";
import { ExportModal } from "@/components/assets/ExportModal";
import { PageHeader } from "@/components/shell/PageHeader";
import { usePageTitle } from "@/components/shell/ShellContext";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { Asset, CampaignStatus } from "@/lib/types";
import { formatDate, formatNumber, timeAgo } from "@/lib/utils";

type Tab = "overview" | "assets" | "ads" | "videos" | "copy" | "calendar" | "analytics";

export default function CampaignWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const campaign = useStore((s) => s.campaigns.find((c) => c.id === id));
  const project = useStore((s) => s.projects.find((p) => p.id === campaign?.projectId));
  const allAssets = useStore((s) => s.assets);
  const favorites = useStore((s) => s.favorites.asset);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const updateCampaign = useStore((s) => s.updateCampaign);
  const deleteCampaign = useStore((s) => s.deleteCampaign);

  const [tab, setTab] = useState<Tab>("overview");
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  usePageTitle(campaign?.name);

  if (!campaign) {
    return <EmptyState icon={Megaphone} title="Campagne introuvable" description="Elle a peut-être été supprimée." cta={{ label: "Retour aux campagnes", href: "/campaigns" }} />;
  }

  const assets = campaign.assetIds.map((aid) => allAssets.find((a) => a.id === aid)).filter((a): a is Asset => Boolean(a));
  const videos = assets.filter((a) => a.type === "video");
  const images = assets.filter((a) => a.type === "image");
  const published = campaign.calendar.filter((c) => c.status === "published").length;
  const scheduled = campaign.calendar.filter((c) => c.status === "scheduled").length;

  const setStatus = (status: CampaignStatus) => {
    updateCampaign(campaign.id, { status });
    toast.success(`Campagne : ${statusLabel(status).toLowerCase()}`, campaign.name);
  };

  const tabs = [
    { value: "overview" as const, label: "Vue d'ensemble" },
    { value: "assets" as const, label: "Ressources", count: assets.length },
    { value: "ads" as const, label: "Publicités", count: campaign.variations.length },
    { value: "videos" as const, label: "Vidéos", count: videos.length },
    { value: "copy" as const, label: "Textes", count: campaign.copy.length + campaign.variations.length },
    { value: "calendar" as const, label: "Calendrier", count: campaign.calendar.length },
    { value: "analytics" as const, label: "Statistiques" },
  ];

  return (
    <>
      <Link href="/campaigns" className="inline-flex items-center gap-1 text-[13px] text-text2 hover:text-text mb-3"><ArrowLeft className="size-3.5" /> Campagnes</Link>
      <PageHeader
        eyebrow={
          <div className="flex items-center gap-2">
            <Badge tone={statusTone(campaign.status)} dot>{statusLabel(campaign.status)}</Badge>
            <span className="text-[12px] text-muted">{objectiveLabel(campaign.objective)} · {project?.name ?? "Aucun projet"}</span>
          </div>
        }
        title={campaign.name}
        description={campaign.audience}
        actions={
          <>
            <Select compact aria-label="Changer le statut" value={campaign.status} onChange={(e) => setStatus(e.target.value as CampaignStatus)} options={[{ value: "draft", label: "Brouillon" }, { value: "active", label: "Active" }, { value: "completed", label: "Terminée" }]} />
            <Button variant="secondary" leftIcon={<Download className="size-4" />} onClick={() => setExportOpen(true)}>Exporter la campagne</Button>
          </>
        }
      />

      <Tabs items={tabs} value={tab} onChange={setTab} layoutId="campaign-tabs" className="mb-6" />

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="Ressources" value={String(assets.length)} sub={`${images.length} images · ${videos.length} vidéos`} />
            <StatTile label="Variantes publicitaires" value={String(campaign.variations.length)} sub="Créations A à D" />
            <StatTile label="Calendrier" value={String(campaign.calendar.length)} sub={`${published} publié(s) · ${scheduled} programmé(s)`} />
            <StatTile label="Portée" value={campaign.analytics ? formatNumber(campaign.analytics.reach) : "—"} sub={campaign.analytics ? `${campaign.analytics.ctr.toLocaleString("fr-FR")} % de CTR` : "Activez-la pour suivre"} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <h3 className="text-[15px] font-semibold mb-4">Brief</h3>
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div><dt className="text-[12px] text-muted mb-1">Objectif</dt><dd className="font-medium">{objectiveLabel(campaign.objective)}</dd></div>
                <div><dt className="text-[12px] text-muted mb-1">Créée le</dt><dd className="font-medium">{formatDate(campaign.createdAt)} <span className="text-muted font-normal">· mise à jour {timeAgo(campaign.updatedAt)}</span></dd></div>
                <div className="sm:col-span-2"><dt className="text-[12px] text-muted mb-1">Audience</dt><dd>{campaign.audience}</dd></div>
                <div>
                  <dt className="text-[12px] text-muted mb-1.5">Plateformes</dt>
                  <dd className="flex flex-wrap gap-1.5">{campaign.platforms.map((p) => <span key={p} className="inline-flex items-center gap-1.5 text-[12px] bg-elevated border border-border rounded-full px-2.5 py-1"><PlatformIcon platform={p} className="size-3.5" />{platformLabel(p)}</span>)}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-muted mb-1.5">Formats</dt>
                  <dd className="flex flex-wrap gap-1.5">{campaign.formats.map((f) => <Badge key={f} tone="outline">{formatLabel(f)}</Badge>)}</dd>
                </div>
              </dl>
            </Card>
            <Card>
              <h3 className="text-[15px] font-semibold mb-3">Actions rapides</h3>
              <div className="flex flex-col gap-2">
                <Link href="/studio/image"><Button variant="secondary" fullWidth leftIcon={<Wand2 className="size-4" />} className="justify-start">Générer plus de visuels</Button></Link>
                <Link href="/studio/ads"><Button variant="secondary" fullWidth leftIcon={<Layers className="size-4" />} className="justify-start">Nouvelles variantes publicitaires</Button></Link>
                <Link href="/studio/copy"><Button variant="secondary" fullWidth leftIcon={<FileText className="size-4" />} className="justify-start">Rédiger des textes</Button></Link>
                <Link href={`/campaigns/${campaign.id}/calendar`}><Button variant="secondary" fullWidth leftIcon={<CalendarDays className="size-4" />} className="justify-start">Ouvrir le calendrier</Button></Link>
                <Button variant="secondary" fullWidth leftIcon={<Download className="size-4" />} className="justify-start" onClick={() => setExportOpen(true)}>Exporter la campagne</Button>
                <Button variant="ghost" fullWidth leftIcon={<Trash2 className="size-4" />} className="justify-start text-danger hover:text-danger" onClick={() => setDeleteOpen(true)}>Supprimer la campagne</Button>
              </div>
            </Card>
          </div>

          {assets.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-semibold">Dernières ressources</h3>
                <button className="text-[13px] text-text2 hover:text-text" onClick={() => setTab("assets")}>Tout voir</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {assets.slice(0, 6).map((a) => <AssetCard key={a.id} asset={a} favorite={favorites.includes(a.id)} onToggleFavorite={(x) => toggleFavorite("asset", x.id)} href={`/assets/${a.id}`} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "assets" && (
        assets.length === 0 ? (
          <EmptyState icon={Images} title="Aucune ressource dans cette campagne" description="Générez des visuels dans le Studio et ajoutez-les à la campagne." cta={{ label: "Ouvrir le Studio", href: "/studio" }} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {assets.map((a) => <AssetCard key={a.id} asset={a} favorite={favorites.includes(a.id)} onToggleFavorite={(x) => toggleFavorite("asset", x.id)} href={`/assets/${a.id}`} />)}
          </div>
        )
      )}

      {tab === "ads" && (
        campaign.variations.length === 0 ? (
          <EmptyState icon={Layers} title="Aucune variante publicitaire pour l'instant" description="Générez les créations A à D avec titre, texte principal et CTA." cta={{ label: "Ouvrir le créateur de pubs", href: "/studio/ads" }} />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {campaign.variations.map((v) => (
              <Card key={v.id} padded={false} className="overflow-hidden">
                <div className="relative aspect-[4/5] bg-elevated">
                  <img src={v.visual} alt="" className="size-full object-cover" />
                  <Badge tone="accent" className="absolute top-3 left-3">Création {v.label}</Badge>
                  <span className="absolute top-3 right-3 size-7 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"><PlatformIcon platform={v.platform} className="size-3.5" /></span>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold leading-snug">{v.headline}</p>
                  <p className="text-[13px] text-text2 mt-1.5 line-clamp-3">{v.primaryText}</p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge tone="outline">{v.cta}</Badge>
                    <button className="text-[12px] text-text2 hover:text-text inline-flex items-center gap-1" onClick={() => { navigator.clipboard?.writeText(`${v.headline}\n\n${v.primaryText}\n\n${v.cta}`); toast.success("Copié", `Création ${v.label}`); }}><CopyIcon className="size-3.5" /> Copier</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "videos" && (
        videos.length === 0 ? (
          <EmptyState icon={Video} title="Aucune vidéo pour l'instant" description="Générez une vidéo produit ou une pub UGC et ajoutez-la à la campagne." cta={{ label: "Générer une vidéo", href: "/studio/video" }} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {videos.map((a) => <AssetCard key={a.id} asset={a} favorite={favorites.includes(a.id)} onToggleFavorite={(x) => toggleFavorite("asset", x.id)} href={`/assets/${a.id}`} />)}
          </div>
        )
      )}

      {tab === "copy" && (
        campaign.copy.length === 0 && campaign.variations.length === 0 ? (
          <EmptyState icon={FileText} title="Aucun texte pour l'instant" description="Rédigez des légendes, des textes publicitaires ou des scripts dans le ton de votre marque." cta={{ label: "Ouvrir le rédacteur", href: "/studio/copy" }} />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {campaign.copy.map((c) => (
              <Card key={c.id}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">{c.title}</p>
                  <Badge tone="outline" className="capitalize">{toneLabel(c.tone)}</Badge>
                </div>
                <pre className="text-[13px] text-text2 whitespace-pre-wrap font-sans">{c.text}</pre>
              </Card>
            ))}
            {campaign.variations.map((v) => (
              <Card key={v.id}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Texte publicitaire — Création {v.label}</p>
                  <button className="text-[12px] text-text2 hover:text-text inline-flex items-center gap-1" onClick={() => { navigator.clipboard?.writeText(`${v.headline}\n\n${v.primaryText}\n\n${v.cta}`); toast.success("Copié"); }}><CopyIcon className="size-3.5" /> Copier</button>
                </div>
                <p className="text-[13px]"><span className="text-muted">Titre · </span>{v.headline}</p>
                <p className="text-[13px] mt-1"><span className="text-muted">Texte principal · </span>{v.primaryText}</p>
                <p className="text-[13px] mt-1"><span className="text-muted">CTA · </span>{v.cta}</p>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "calendar" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text2">{campaign.calendar.length} éléments · {published} publié(s) · {scheduled} programmé(s)</p>
            <Link href={`/campaigns/${campaign.id}/calendar`}><Button size="sm" variant="secondary" leftIcon={<CalendarDays className="size-4" />}>Ouvrir le calendrier complet</Button></Link>
          </div>
          <CalendarView campaign={campaign} compact />
        </div>
      )}

      {tab === "analytics" && (
        campaign.analytics ? (
          <CampaignAnalyticsPanel analytics={campaign.analytics} />
        ) : (
          <EmptyState icon={BarChart3} title="Aucune statistique pour l'instant" description="Les statistiques apparaissent dès que la campagne est active. Ce prototype affiche des chiffres simulés." cta={{ label: "Activer", onClick: () => { setStatus("active"); toast.info("Les statistiques apparaîtront après la première synchronisation", "Des données simulées sont associées aux campagnes actives de démonstration."); } }} />
        )
      )}

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} campaignId={campaign.id} assetIds={campaign.assetIds} />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Supprimer la campagne ?"
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteOpen(false)}>Annuler</Button><Button variant="danger" onClick={() => { deleteCampaign(campaign.id); toast.info("Campagne supprimée"); router.push("/campaigns"); }}>Supprimer</Button></>}
      >
        <p className="text-sm text-text2">Les ressources restent dans votre bibliothèque. Cette action est irréversible dans le prototype.</p>
      </Modal>

    </>
  );
}
