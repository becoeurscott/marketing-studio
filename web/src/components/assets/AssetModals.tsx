"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { Asset } from "@/lib/types";

export function RenameAssetModal({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(asset)} onClose={onClose} title="Rename asset" size="sm">
      {asset && <RenameForm key={asset.id} asset={asset} onClose={onClose} />}
    </Modal>
  );
}

function RenameForm({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const updateAsset = useStore((s) => s.updateAsset);
  const toast = useToast();
  const [name, setName] = useState(asset.name);
  const save = () => {
    if (!name.trim()) return;
    updateAsset(asset.id, { name: name.trim() });
    toast.success("Renamed", name.trim());
    onClose();
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!name.trim()}>Save</Button></div>
    </form>
  );
}

export function MoveAssetModal({ assets, onClose }: { assets: Asset[]; onClose: () => void }) {
  return (
    <Modal open={assets.length > 0} onClose={onClose} title={assets.length === 1 ? "Move to project" : `Move ${assets.length} assets`} size="sm">
      {assets.length > 0 && <MoveForm key={assets.map((a) => a.id).join(",")} assets={assets} onClose={onClose} />}
    </Modal>
  );
}

function MoveForm({ assets, onClose }: { assets: Asset[]; onClose: () => void }) {
  const projects = useStore((s) => s.projects);
  const updateAsset = useStore((s) => s.updateAsset);
  const toast = useToast();
  const [projectId, setProjectId] = useState(assets[0].projectId ?? "");
  const save = () => {
    for (const a of assets) updateAsset(a.id, { projectId: projectId || null });
    const p = projects.find((x) => x.id === projectId);
    toast.success("Moved", p ? `${assets.length === 1 ? assets[0].name : `${assets.length} assets`} → ${p.name}` : "Removed from project");
    onClose();
  };
  return (
    <div className="space-y-4">
      <Select label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)} options={[{ value: "", label: "No project" }, ...projects.map((p) => ({ value: p.id, label: p.name }))]} />
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>Move</Button></div>
    </div>
  );
}

export function DeleteAssetsModal({ assets, onClose, onDeleted }: { assets: Asset[]; onClose: () => void; onDeleted?: () => void }) {
  const deleteAsset = useStore((s) => s.deleteAsset);
  const toast = useToast();
  const n = assets.length;
  return (
    <Modal
      open={n > 0}
      onClose={onClose}
      title={n === 1 ? "Delete asset?" : `Delete ${n} assets?`}
      size="sm"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={() => { assets.forEach((a) => deleteAsset(a.id)); toast.info(n === 1 ? "Asset deleted" : `${n} assets deleted`); onClose(); onDeleted?.(); }}>Delete</Button></>}
    >
      <p className="text-sm text-text2">{n === 1 ? assets[0].name : "These assets"} will be removed from your library and any campaigns. This can&apos;t be undone in the prototype.</p>
    </Modal>
  );
}

export function PreviewAssetModal({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(asset)} onClose={onClose} title={asset?.name} size="xl" className="bg-bg">
      {asset && (
        <div className="flex items-center justify-center bg-black/40 rounded-lg overflow-hidden max-h-[70vh]">
          <img src={asset.url} alt={asset.name} className="max-h-[70vh] w-auto object-contain" />
        </div>
      )}
    </Modal>
  );
}
