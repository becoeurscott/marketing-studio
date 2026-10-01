"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import { PLATFORMS, type AdFormat, type Asset, type CalendarItem, type CalendarStatus, type Campaign, type Platform } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AD_FORMATS, CALENDAR_STATUSES } from "./platform";

export interface CalendarItemModalProps {
  open: boolean;
  onClose: () => void;
  campaign: Campaign;
  /** null → create */
  item: CalendarItem | null;
  defaultDate: Date;
}

const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function CalendarItemModal({ open, onClose, campaign, item, defaultDate }: CalendarItemModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={item ? "Modifier l'élément" : "Ajouter un élément au calendrier"} description={item ? undefined : "Programmez une publication sur l'une des plateformes de la campagne."} size="lg">
      <Form key={`${open}-${item?.id ?? "new"}-${defaultDate.getTime()}`} campaign={campaign} item={item} defaultDate={defaultDate} onClose={onClose} />
    </Modal>
  );
}

function Form({ campaign, item, defaultDate, onClose }: { campaign: Campaign; item: CalendarItem | null; defaultDate: Date; onClose: () => void }) {
  const toast = useToast();
  const allAssets = useStore((s) => s.assets);
  const addCalendarItem = useStore((s) => s.addCalendarItem);
  const updateCalendarItem = useStore((s) => s.updateCalendarItem);
  const removeCalendarItem = useStore((s) => s.removeCalendarItem);

  const initialDate = item ? new Date(item.date) : new Date(defaultDate.getFullYear(), defaultDate.getMonth(), defaultDate.getDate(), 10, 0);
  const [title, setTitle] = useState(item?.title ?? "");
  const [date, setDate] = useState(toLocalInput(initialDate));
  const [platform, setPlatform] = useState<Platform>(item?.platform ?? campaign.platforms[0] ?? "instagram");
  const [format, setFormat] = useState<AdFormat>(item?.format ?? "image");
  const [status, setStatus] = useState<CalendarStatus>(item?.status ?? "draft");
  const [assetId, setAssetId] = useState<string | null>(item?.assetId ?? null);

  const candidates: Asset[] = [
    ...campaign.assetIds.map((id) => allAssets.find((a) => a.id === id)).filter((a): a is Asset => Boolean(a)),
    ...allAssets.filter((a) => (a.type === "image" || a.type === "video") && !campaign.assetIds.includes(a.id)).slice(0, 12),
  ];

  const platformOptions = (campaign.platforms.length ? PLATFORMS.filter((p) => campaign.platforms.includes(p.id)) : PLATFORMS).map((p) => ({ value: p.id, label: p.label }));

  const save = () => {
    const iso = new Date(date).toISOString();
    const patch = { title: title.trim() || `${campaign.name} — publication`, date: iso, platform, format, status, assetId };
    if (item) {
      updateCalendarItem(campaign.id, item.id, patch);
      toast.success("Élément mis à jour", patch.title);
    } else {
      addCalendarItem(campaign.id, patch);
      toast.success("Élément ajouté", patch.title);
    }
    onClose();
  };

  return (
    <div className="space-y-4">
      <Input label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Teaser de lancement" autoFocus />
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Date et heure" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select label="Statut" value={status} onChange={(e) => setStatus(e.target.value as CalendarStatus)} options={CALENDAR_STATUSES.map((s) => ({ value: s.id, label: s.label }))} />
        <Select label="Plateforme" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} options={platformOptions} />
        <Select label="Format" value={format} onChange={(e) => setFormat(e.target.value as AdFormat)} options={AD_FORMATS.map((f) => ({ value: f.id, label: f.label }))} />
      </div>
      <div>
        <p className="text-[13px] font-medium text-text2 mb-2">Ressource</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
          <button type="button" onClick={() => setAssetId(null)} aria-pressed={assetId === null} className={cn("aspect-square rounded-md border text-[11px] text-text2 flex items-center justify-center", assetId === null ? "border-accent bg-accent/10 text-highlight" : "border-border-strong bg-surface hover:border-white/25")}>Aucune</button>
          {candidates.map((a) => (
            <button key={a.id} type="button" onClick={() => setAssetId(a.id)} aria-pressed={assetId === a.id} title={a.name} className={cn("aspect-square rounded-md overflow-hidden border transition-colors", assetId === a.id ? "border-accent ring-2 ring-accent/40" : "border-border hover:border-white/25")}>
              <img src={a.thumbnail} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
        {item ? (
          <Button variant="ghost" className="text-danger hover:text-danger" leftIcon={<Trash2 className="size-4" />} onClick={() => { removeCalendarItem(campaign.id, item.id); toast.info("Élément retiré"); onClose(); }}>Retirer</Button>
        ) : <span />}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={save}>{item ? "Enregistrer" : "Ajouter au calendrier"}</Button>
        </div>
      </div>
    </div>
  );
}
