"use client";

import { Check, ChevronDown, Cloud, CloudUpload, Download, FolderKanban, Link2, Redo2, Share2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressIndicator";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { exportAssets, type ExportParams } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { Asset } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { SaveStatus } from "./useImageGenerator";

export interface StudioTopBarProps {
  saveStatus: SaveStatus;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  /** Returns the asset to export (persisting the selection if needed) or null. */
  getExportAsset: () => Asset | null;
  exportKind?: "image" | "video";
  /** Rendered between the project name and the actions (e.g. mode tabs on desktop). */
  center?: React.ReactNode;
  className?: string;
}

/** Studio top bar: project name (→ picker), save status, undo/redo, share, export (SPEC §9). */
export function StudioTopBar({ saveStatus, onUndo, onRedo, canUndo, canRedo, getExportAsset, exportKind = "image", center, className }: StudioTopBarProps) {
  const projects = useStore((s) => s.projects);
  const currentProjectId = useStore((s) => s.currentProjectId);
  const setCurrentProject = useStore((s) => s.setCurrentProject);
  const toast = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const project = projects.find((p) => p.id === currentProjectId) ?? null;
  const active = projects.filter((p) => p.status === "active");

  const share = async () => {
    const url = `${window.location.origin}/projects/${project?.id ?? ""}`;
    try { await navigator.clipboard.writeText(url); toast.success("Link copied", "Anyone in your workspace can open it."); }
    catch { toast.info("Share link", url); }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button onClick={() => setPickerOpen(true)} className="flex items-center gap-2 h-9 pl-2 pr-2.5 rounded-md hover:bg-white/5 min-w-0 flex-1 md:flex-none md:max-w-[40%]" aria-haspopup="dialog">
        <span className="size-6 rounded-sm bg-elevated border border-border overflow-hidden shrink-0">{project && <img src={project.thumbnail} alt="" className="size-full object-cover" />}</span>
        <span className="text-sm font-semibold truncate max-w-[40vw] sm:max-w-[9rem] xl:max-w-xs">{project?.name ?? "No project"}</span>
        <ChevronDown className="size-4 text-muted shrink-0" />
      </button>
      <span className={cn("hidden xl:inline-flex items-center gap-1 text-xs", saveStatus === "saved" ? "text-muted" : saveStatus === "saving" ? "text-highlight" : "text-warning")}>
        {saveStatus === "saved" ? <Cloud className="size-3.5" /> : <CloudUpload className={cn("size-3.5", saveStatus === "saving" && "animate-pulse")} />}
        {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving…" : "Unsaved changes"}
      </span>
      {center && <div className="hidden md:flex flex-1 justify-center min-w-0 shrink-0">{center}</div>}

      <div className="ml-auto flex items-center gap-1 shrink-0">
        <IconButton size="sm" label="Undo" onClick={onUndo} disabled={!canUndo}><Undo2 /></IconButton>
        <IconButton size="sm" label="Redo" onClick={onRedo} disabled={!canRedo}><Redo2 /></IconButton>
        <span className="w-px h-5 bg-border mx-1" />
        <IconButton size="sm" label="Share" onClick={share}><Share2 /></IconButton>
        <span className="hidden xl:inline-flex"><Button size="sm" variant="secondary" leftIcon={<Download className="size-4" />} onClick={() => setExportOpen(true)}>Export</Button></span>
        <span className="inline-flex xl:hidden"><IconButton size="sm" label="Export" onClick={() => setExportOpen(true)}><Download /></IconButton></span>
      </div>

      <ProjectPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} projects={active} currentId={currentProjectId} onPick={(id) => { setCurrentProject(id); setPickerOpen(false); }} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} getAsset={getExportAsset} kind={exportKind} />
    </div>
  );
}

function ProjectPickerModal({ open, onClose, projects, currentId, onPick }: { open: boolean; onClose: () => void; projects: { id: string; name: string; thumbnail: string; description: string }[]; currentId: string | null; onPick: (id: string) => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Switch project" description="Generations and assets are saved to the selected project." size="sm">
      <ul className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto">
        {projects.map((p) => {
          const sel = p.id === currentId;
          return (
            <li key={p.id}>
              <button onClick={() => onPick(p.id)} className={cn("w-full flex items-center gap-3 rounded-md border px-2.5 py-2 text-left transition-colors", sel ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-white/20")}>
                <img src={p.thumbnail} alt="" className="size-9 rounded-sm object-cover border border-border" />
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium truncate">{p.name}</span><span className="block text-xs text-muted truncate">{p.description || "No description"}</span></span>
                {sel && <Check className="size-4 text-highlight" />}
              </button>
            </li>
          );
        })}
      </ul>
      <Link href="/projects" onClick={onClose} className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-highlight hover:underline"><FolderKanban className="size-4" /> Manage projects</Link>
    </Modal>
  );
}

/** Export center for the current selection (SPEC §35, mini). */
export function ExportModal({ open, onClose, getAsset, kind }: { open: boolean; onClose: () => void; getAsset: () => Asset | null; kind: "image" | "video" }) {
  const toast = useToast();
  const [format, setFormat] = useState<ExportParams["format"]>(kind === "video" ? "mp4" : "png");
  const [quality, setQuality] = useState<ExportParams["quality"]>("high");
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [done, setDone] = useState<Asset | null>(null);

  const run = async () => {
    const asset = getAsset();
    if (!asset) { toast.info("Nothing to export", "Generate or select a result first."); return; }
    setProgress({ pct: 0, label: "Starting" }); setDone(null);
    try {
      const out = await exportAssets({ assetIds: [asset.id], format, quality }, (pct, label) => setProgress({ pct, label }));
      setDone(out);
      toast.success("Export complete", out.name);
    } catch (err) {
      toast.error("Something went wrong.", err instanceof Error ? err.message : undefined);
    } finally {
      setProgress(null);
    }
  };

  const formats = kind === "video" ? [{ value: "mp4", label: "MP4" }] : [{ value: "png", label: "PNG" }, { value: "jpg", label: "JPG" }, { value: "pdf", label: "PDF" }];

  return (
    <Modal open={open} onClose={onClose} title="Export" description="Export the selected result." size="sm" footer={<><Button variant="ghost" onClick={onClose}>Close</Button><Button onClick={run} loading={!!progress} leftIcon={<Download className="size-4" />}>Export</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Format" name="format" value={format} onChange={(e) => setFormat(e.target.value as ExportParams["format"])} options={formats} />
        <Select label="Quality" name="quality" value={quality} onChange={(e) => setQuality(e.target.value as ExportParams["quality"])} options={[{ value: "standard", label: "Standard" }, { value: "high", label: "High" }, { value: "maximum", label: "Maximum" }]} />
      </div>
      {progress && <ProgressBar value={progress.pct} label={progress.label} className="mt-4" />}
      {done && (
        <div className="mt-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm flex items-center gap-2">
          <Check className="size-4 text-success" /> <span className="truncate flex-1">{done.name}</span>
          <Link href="/assets" className="text-highlight text-xs inline-flex items-center gap-1 hover:underline"><Link2 className="size-3" />Assets</Link>
        </div>
      )}
    </Modal>
  );
}
