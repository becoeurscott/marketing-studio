"use client";

import { CheckCircle2, Download, FileImage, FileText, FileVideo, Package } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressIndicator";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { exportAssets, exportFiles, type ExportParams } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { Asset, ID } from "@/lib/types";
import { cn } from "@/lib/utils";

type Format = ExportParams["format"];
type Quality = ExportParams["quality"];
type PrintSize = NonNullable<ExportParams["printSize"]>;
type Scope = "selected" | "campaign";

const FORMATS: { id: Format; label: string; icon: typeof FileImage; hint: string }[] = [
  { id: "png", label: "PNG", icon: FileImage, hint: "Sans perte, transparence" },
  { id: "jpg", label: "JPG", icon: FileImage, hint: "Léger, prêt pour le web" },
  { id: "mp4", label: "MP4", icon: FileVideo, hint: "Vidéo, H.264" },
  { id: "pdf", label: "PDF à imprimer", icon: FileText, hint: "Flyer, affiche, vitrine" },
];
const PRINT_SIZES: { id: PrintSize; label: string; hint: string }[] = [
  { id: "A5", label: "A5", hint: "Flyer à distribuer" },
  { id: "A4", label: "A4", hint: "Affiche vitrine" },
  { id: "A3", label: "A3", hint: "Grande affiche, étal" },
];
const QUALITIES: { id: Quality; label: string; hint: string }[] = [
  { id: "light", label: "Légère", hint: "Data réduite · WhatsApp" },
  { id: "standard", label: "Standard", hint: "1x · rapide" },
  { id: "high", label: "Haute", hint: "2x · recommandé" },
  { id: "maximum", label: "Maximale", hint: "4x · fichier le plus lourd" },
];
const qualityLabel = (q: Quality) => QUALITIES.find((x) => x.id === q)?.label ?? q;
const itemCount = (n: number) => `${n} élément${n > 1 ? "s" : ""}`;

export interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  /** Preselected asset ids (scope "selected"). */
  assetIds?: ID[];
  /** When given, the "Export campaign" scope is available and preselected. */
  campaignId?: ID;
  onComplete?: (asset: Asset) => void;
}

/** Export Center (SPEC §35). Reused by the assets grid, campaign workspace and /assets/export. */
export function ExportModal({ open, onClose, assetIds = [], campaignId, onComplete }: ExportModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Centre d'export" description="Choisissez un format et une qualité. Chaque export est enregistré comme nouvelle ressource." size="lg">
      <ExportForm key={`${open}-${campaignId ?? ""}-${assetIds.join(",")}`} assetIds={assetIds} campaignId={campaignId} onClose={onClose} onComplete={onComplete} />
    </Modal>
  );
}

/** The export form without the modal chrome (used by /assets/export). */
export function ExportForm({ assetIds, campaignId, onClose, onComplete, embedded }: { assetIds: ID[]; campaignId?: ID; onClose?: () => void; onComplete?: (asset: Asset) => void; embedded?: boolean }) {
  const toast = useToast();
  const assets = useStore((s) => s.assets);
  const campaigns = useStore((s) => s.campaigns);
  const lightByDefault = useStore((s) => s.preferences.lightVideos ?? true);
  const [format, setFormat] = useState<Format>("png");
  const [quality, setQuality] = useState<Quality>(lightByDefault ? "light" : "high");
  const [printSize, setPrintSize] = useState<PrintSize>("A4");
  const [scope, setScope] = useState<Scope>(campaignId ? "campaign" : "selected");
  const [pickedCampaign, setPickedCampaign] = useState<ID>(campaignId ?? campaigns[0]?.id ?? "");
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [done, setDone] = useState<Asset | null>(null);

  const campaign = campaigns.find((c) => c.id === pickedCampaign);
  const ids = scope === "campaign" ? (campaign?.assetIds ?? []) : assetIds;
  const picked = ids.map((id) => assets.find((a) => a.id === id)).filter((a): a is Asset => Boolean(a));
  const hasVideo = picked.some((a) => a.type === "video");

  const run = async () => {
    if (ids.length === 0) return;
    setProgress({ pct: 0, label: "Préparation" });
    try {
      const asset = await exportAssets({ assetIds: ids, format, quality, printSize: format === "pdf" ? printSize : undefined, campaignId: scope === "campaign" ? pickedCampaign : undefined }, (pct, label) => setProgress({ pct, label }));
      setDone(asset);
      onComplete?.(asset);
      toast.success("Export terminé", `${asset.name} a été ajouté à vos ressources.`);
    } catch (e) {
      setProgress(null);
      toast.error("Une erreur est survenue.", e instanceof Error ? e.message : undefined);
    }
  };

  if (done) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="size-12 text-success mx-auto" />
        <h3 className="text-lg font-semibold mt-3">Export prêt</h3>
        <p className="text-sm text-text2 mt-1">{done.name} · {itemCount(ids.length)} · {format.toUpperCase()} · {qualityLabel(quality)}</p>
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button leftIcon={<Download className="size-4" />} onClick={() => { exportFiles(done).forEach((u) => window.open(u, "_blank", "noopener")); toast.info("Téléchargement lancé", done.name); }}>Télécharger</Button>
          <Link href={`/assets/${done.id}`}><Button variant="secondary" onClick={onClose}>Voir dans les ressources</Button></Link>
        </div>
      </div>
    );
  }

  if (progress) {
    return (
      <div className="py-8 max-w-sm mx-auto text-center">
        <Package className="size-8 text-highlight mx-auto animate-pulse" />
        <p className="text-sm font-medium mt-3">{progress.label}…</p>
        <ProgressBar value={progress.pct} className="mt-4" />
        <p className="text-xs text-muted mt-3">{itemCount(ids.length)} · {format.toUpperCase()} · {qualityLabel(quality)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scope */}
      <div>
        <p className="text-[13px] font-medium text-text2 mb-2">Que souhaitez-vous exporter ?</p>
        <div className="grid sm:grid-cols-2 gap-2">
          <ScopeCard selected={scope === "selected"} onClick={() => setScope("selected")} title="Exporter la sélection" hint={`${assetIds.length} ressource${assetIds.length > 1 ? "s" : ""} sélectionnée${assetIds.length > 1 ? "s" : ""}`} disabled={assetIds.length === 0} />
          <ScopeCard selected={scope === "campaign"} onClick={() => setScope("campaign")} title="Exporter la campagne" hint={campaign ? `${campaign.assetIds.length} ressources dans ${campaign.name}` : "Aucune campagne"} disabled={campaigns.length === 0} />
        </div>
        {scope === "campaign" && !campaignId && (
          <Select className="mt-2" compact aria-label="Campagne" value={pickedCampaign} onChange={(e) => setPickedCampaign(e.target.value)} options={campaigns.map((c) => ({ value: c.id, label: c.name }))} />
        )}
      </div>

      {/* Format */}
      <div>
        <p className="text-[13px] font-medium text-text2 mb-2">Format</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FORMATS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFormat(f.id)} aria-pressed={format === f.id} className={cn("rounded-lg border p-3 text-left transition-colors", format === f.id ? "border-accent bg-accent/10" : "border-border-strong bg-surface hover:border-white/25")}>
              <f.icon className={cn("size-4 mb-2", format === f.id ? "text-highlight" : "text-text2")} />
              <span className="block text-sm font-semibold">{f.label}</span>
              <span className="block text-[11px] text-muted">{f.hint}</span>
            </button>
          ))}
        </div>
        {hasVideo && format !== "mp4" && <p className="text-xs text-warning mt-2">Les vidéos de cette sélection seront exportées en image fixe. Choisissez MP4 pour conserver l’animation.</p>}
      </div>

      {format === "pdf" && (
        <div>
          <p className="text-[13px] font-medium text-text2 mb-2">Taille d’impression</p>
          <div className="grid grid-cols-3 gap-2">
            {PRINT_SIZES.map((p) => (
              <button key={p.id} type="button" onClick={() => setPrintSize(p.id)} aria-pressed={printSize === p.id} className={cn("rounded-lg border p-3 text-left transition-colors", printSize === p.id ? "border-accent bg-accent/10" : "border-border-strong bg-surface hover:border-white/25")}>
                <span className="block text-sm font-semibold">{p.label}</span>
                <span className="block text-[11px] text-muted">{p.hint}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted mt-2">Marges de coupe et 300 dpi inclus : prêt pour l’imprimeur du quartier.</p>
        </div>
      )}

      {/* Quality */}
      <div>
        <p className="text-[13px] font-medium text-text2 mb-2">Qualité</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUALITIES.map((q) => (
            <button key={q.id} type="button" onClick={() => setQuality(q.id)} aria-pressed={quality === q.id} className={cn("rounded-lg border p-3 text-left transition-colors", quality === q.id ? "border-accent bg-accent/10" : "border-border-strong bg-surface hover:border-white/25")}>
              <span className="block text-sm font-semibold">{q.label}</span>
              <span className="block text-[11px] text-muted">{q.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview strip */}
      {picked.length > 0 && (
        <div>
          <p className="text-[13px] font-medium text-text2 mb-2">Inclus · {picked.length}</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {picked.slice(0, 12).map((a) => <img key={a.id} src={a.thumbnail} alt="" className="size-14 rounded-md object-cover border border-border shrink-0" />)}
            {picked.length > 12 && <span className="size-14 rounded-md bg-elevated border border-border text-xs text-text2 flex items-center justify-center shrink-0">+{picked.length - 12}</span>}
          </div>
        </div>
      )}

      <div className={cn("flex items-center justify-end gap-2", !embedded && "pt-2")}>
        {onClose && <Button variant="ghost" onClick={onClose}>Annuler</Button>}
        <Button leftIcon={<Download className="size-4" />} disabled={ids.length === 0} onClick={run}>Exporter {ids.length > 0 ? itemCount(ids.length) : ""}</Button>
      </div>
    </div>
  );
}

function ScopeCard({ selected, onClick, title, hint, disabled }: { selected: boolean; onClick: () => void; title: string; hint: string; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} aria-pressed={selected} className={cn("rounded-lg border p-3 text-left transition-colors disabled:opacity-40", selected ? "border-accent bg-accent/10" : "border-border-strong bg-surface hover:border-white/25")}>
      <span className="block text-sm font-semibold">{title}</span>
      <span className="block text-[11px] text-muted mt-0.5">{hint}</span>
    </button>
  );
}
