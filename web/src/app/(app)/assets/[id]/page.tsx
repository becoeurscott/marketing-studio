"use client";

import { ArrowLeft, Download, FolderInput, Heart, Images, Maximize2, Megaphone, Pencil, Trash2, Wand2, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { assetTypeLabel } from "@/components/assets/AssetCard";
import { DeleteAssetsModal, MoveAssetModal, RenameAssetModal } from "@/components/assets/AssetModals";
import { PageHeader } from "@/components/shell/PageHeader";
import { usePageTitle } from "@/components/shell/ShellContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import { cn, formatDate, timeAgo } from "@/lib/utils";

const ZOOMS = [0.5, 0.75, 1, 1.5, 2];

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const asset = useStore((s) => s.assets.find((a) => a.id === id));
  const project = useStore((s) => s.projects.find((p) => p.id === asset?.projectId));
  const campaigns = useStore((s) => s.campaigns);
  const favorite = useStore((s) => s.favorites.asset.includes(id));
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const updateCampaign = useStore((s) => s.updateCampaign);

  const [zoomIdx, setZoomIdx] = useState(2);
  const [fullscreen, setFullscreen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [useIn, setUseIn] = useState(false);
  usePageTitle(asset?.name);

  if (!asset) {
    return <EmptyState icon={Images} title="Ressource introuvable" description="Elle a peut-être été supprimée." cta={{ label: "Retour aux ressources", href: "/assets" }} />;
  }

  const zoom = ZOOMS[zoomIdx];
  const usedIn = campaigns.filter((c) => c.assetIds.includes(asset.id));

  const addToCampaign = (cid: string) => {
    const c = campaigns.find((x) => x.id === cid);
    if (!c) return;
    if (c.assetIds.includes(asset.id)) { toast.info("Déjà dans la campagne", c.name); return; }
    updateCampaign(c.id, { assetIds: [...c.assetIds, asset.id] });
    toast.success("Ajoutée à la campagne", c.name);
    setUseIn(false);
  };

  const meta: [string, string][] = [
    ["Type", assetTypeLabel(asset.type)],
    ["Dimensions", asset.width && asset.height ? `${asset.width} × ${asset.height}` : "—"],
    ["Durée", asset.durationSec ? `${asset.durationSec} s` : "—"],
    ["Taille", `${(Math.round(asset.sizeKb / 100) / 10).toLocaleString("fr-FR")} Mo`],
    ["Créée le", `${formatDate(asset.createdAt)} · ${timeAgo(asset.createdAt)}`],
    ["Projet", project?.name ?? "Aucun projet"],
  ];

  return (
    <>
      <Link href="/assets" className="inline-flex items-center gap-1 text-[13px] text-text2 hover:text-text mb-3"><ArrowLeft className="size-3.5" /> Ressources</Link>
      <PageHeader
        eyebrow={<div className="flex items-center gap-2"><Badge tone="outline">{assetTypeLabel(asset.type)}</Badge>{favorite && <Badge tone="danger"><Heart className="size-3 fill-current" /> Favori</Badge>}</div>}
        title={asset.name}
        description={project ? `Dans ${project.name}` : "Dans aucun projet"}
        actions={
          <>
            <IconButton label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"} variant="outline" active={favorite} onClick={() => toggleFavorite("asset", asset.id)}><Heart className={cn(favorite && "fill-current")} /></IconButton>
            <IconButton label="Renommer" variant="outline" onClick={() => setRenaming(true)}><Pencil /></IconButton>
            <IconButton label="Déplacer vers un projet" variant="outline" onClick={() => setMoving(true)}><FolderInput /></IconButton>
            <IconButton label="Supprimer" variant="outline" className="hover:text-danger" onClick={() => setDeleting(true)}><Trash2 /></IconButton>
            <Button variant="secondary" leftIcon={<Download className="size-4" />} onClick={() => toast.success("Téléchargement lancé", asset.name)}>Télécharger</Button>
          </>
        }
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* Preview */}
        <Card padded={false} className="relative overflow-hidden bg-bg">
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg bg-elevated/90 backdrop-blur border border-border-strong p-1">
            <IconButton label="Dézoomer" size="sm" disabled={zoomIdx === 0} onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}><ZoomOut /></IconButton>
            <button className="text-[12px] font-medium text-text2 hover:text-text w-14 text-center" onClick={() => setZoomIdx(2)}>{Math.round(zoom * 100)} %</button>
            <IconButton label="Zoomer" size="sm" disabled={zoomIdx === ZOOMS.length - 1} onClick={() => setZoomIdx((i) => Math.min(ZOOMS.length - 1, i + 1))}><ZoomIn /></IconButton>
            <span className="w-px h-5 bg-border mx-0.5" />
            <IconButton label="Plein écran" size="sm" onClick={() => setFullscreen(true)}><Maximize2 /></IconButton>
          </div>
          <div className="h-[55vh] lg:h-[calc(100vh-280px)] min-h-80 overflow-auto flex items-center justify-center p-4" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
            <img
              src={asset.url}
              alt={asset.name}
              className="max-w-full max-h-full object-contain transition-transform duration-200 origin-center rounded-md shadow-card"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-[15px] font-semibold mb-3">Détails</h3>
            <dl className="space-y-2.5">
              {meta.map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3 text-[13px]"><dt className="text-muted shrink-0">{k}</dt><dd className="text-right truncate">{v}</dd></div>
              ))}
            </dl>
            {asset.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {asset.tags.map((t) => <Badge key={t} tone="neutral">#{t}</Badge>)}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-[15px] font-semibold mb-3">Actions</h3>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" fullWidth className="justify-start" leftIcon={<Megaphone className="size-4" />} onClick={() => setUseIn(true)}>Utiliser dans une campagne</Button>
              {(asset.type === "image" || asset.type === "logo" || asset.type === "brand") && (
                <Link href={`/studio/image?asset=${asset.id}`}><Button variant="secondary" fullWidth className="justify-start" leftIcon={<Wand2 className="size-4" />}>Modifier dans le Studio</Button></Link>
              )}
              {asset.type === "video" && (
                <Link href={`/studio/video?asset=${asset.id}`}><Button variant="secondary" fullWidth className="justify-start" leftIcon={<Wand2 className="size-4" />}>Ouvrir dans le Studio vidéo</Button></Link>
              )}
              <Button variant="secondary" fullWidth className="justify-start" leftIcon={<Download className="size-4" />} onClick={() => toast.success("Téléchargement lancé", asset.name)}>Télécharger l’original</Button>
            </div>
          </Card>

          {usedIn.length > 0 && (
            <Card>
              <h3 className="text-[15px] font-semibold mb-3">Utilisée dans</h3>
              <ul className="space-y-1.5">
                {usedIn.map((c) => <li key={c.id}><Link href={`/campaigns/${c.id}`} className="text-[13px] text-text2 hover:text-text">{c.name}</Link></li>)}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <Modal open={fullscreen} onClose={() => setFullscreen(false)} size="xl" className="bg-bg" title={asset.name}>
        <div className="flex items-center justify-center max-h-[75vh]"><img src={asset.url} alt={asset.name} className="max-h-[75vh] object-contain rounded-md" /></div>
      </Modal>

      <Modal open={useIn} onClose={() => setUseIn(false)} title="Utiliser dans une campagne" description="Ajoutez cette ressource aux ressources d'une campagne." size="sm">
        {campaigns.length === 0 ? (
          <EmptyState compact icon={Megaphone} title="Aucune campagne pour l'instant" cta={{ label: "Nouvelle campagne", href: "/campaigns/new" }} />
        ) : (
          <ul className="divide-y divide-border -mx-1">
            {campaigns.map((c) => {
              const has = c.assetIds.includes(asset.id);
              return (
                <li key={c.id}>
                  <button type="button" disabled={has} onClick={() => addToCampaign(c.id)} className="w-full flex items-center justify-between gap-3 px-1 py-2.5 text-left hover:bg-white/5 rounded-md disabled:opacity-50">
                    <span className="text-sm truncate">{c.name}</span>
                    <span className="text-[11px] text-muted whitespace-nowrap">{has ? "Ajoutée" : `${c.assetIds.length} ressources`}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>

      <RenameAssetModal asset={renaming ? asset : null} onClose={() => setRenaming(false)} />
      <MoveAssetModal assets={moving ? [asset] : []} onClose={() => setMoving(false)} />
      <DeleteAssetsModal assets={deleting ? [asset] : []} onClose={() => setDeleting(false)} onDeleted={() => router.push("/assets")} />
    </>
  );
}
