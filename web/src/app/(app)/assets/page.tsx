"use client";

import { CheckSquare, Download, FolderInput, Images, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AssetCard } from "@/components/assets/AssetCard";
import { DeleteAssetsModal, MoveAssetModal, PreviewAssetModal, RenameAssetModal } from "@/components/assets/AssetModals";
import { ExportModal } from "@/components/assets/ExportModal";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { Asset, AssetType } from "@/lib/types";
import { cn } from "@/lib/utils";

type TypeTab = "all" | AssetType;
type DateFilter = "any" | "7d" | "30d";
type Sort = "newest" | "oldest" | "name" | "size";

const TYPE_TABS: { value: TypeTab; label: string }[] = [
  { value: "all", label: "All" }, { value: "image", label: "Images" }, { value: "video", label: "Videos" }, { value: "audio", label: "Audio" },
  { value: "logo", label: "Logos" }, { value: "brand", label: "Brand" }, { value: "export", label: "Exports" },
];

export default function AssetsPage() {
  const router = useRouter();
  const toast = useToast();
  const assets = useStore((s) => s.assets);
  const projects = useStore((s) => s.projects);
  const favorites = useStore((s) => s.favorites.asset);
  const toggleFavorite = useStore((s) => s.toggleFavorite);

  const [type, setType] = useState<TypeTab>("all");
  const [q, setQ] = useState("");
  const [date, setDate] = useState<DateFilter>("any");
  const [projectId, setProjectId] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const [preview, setPreview] = useState<Asset | null>(null);
  const [renaming, setRenaming] = useState<Asset | null>(null);
  const [moving, setMoving] = useState<Asset[]>([]);
  const [deleting, setDeleting] = useState<Asset[]>([]);
  const [exportOpen, setExportOpen] = useState(false);

  const counts = useMemo(() => {
    const c: Record<TypeTab, number> = { all: assets.length, image: 0, video: 0, audio: 0, logo: 0, brand: 0, export: 0 };
    for (const a of assets) c[a.type] += 1;
    return c;
  }, [assets]);

  const [now] = useState(() => Date.now());
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const cutoff = date === "7d" ? now - 7 * 86400000 : date === "30d" ? now - 30 * 86400000 : 0;
    return assets
      .filter((a) => type === "all" || a.type === type)
      .filter((a) => !needle || a.name.toLowerCase().includes(needle) || a.tags.some((t) => t.includes(needle)))
      .filter((a) => !cutoff || new Date(a.createdAt).getTime() >= cutoff)
      .filter((a) => !projectId || a.projectId === projectId)
      .filter((a) => !favOnly || favorites.includes(a.id))
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "size") return b.sizeKb - a.sizeKb;
        if (sort === "oldest") return a.createdAt < b.createdAt ? -1 : 1;
        return a.createdAt < b.createdAt ? 1 : -1;
      });
  }, [assets, type, q, date, now, projectId, favOnly, sort, favorites]);

  const selectedAssets = selected.map((id) => assets.find((a) => a.id === id)).filter((a): a is Asset => Boolean(a));
  const toggleSelect = (a: Asset) => setSelected((s) => (s.includes(a.id) ? s.filter((x) => x !== a.id) : [...s, a.id]));
  const exitSelect = () => { setSelecting(false); setSelected([]); };
  const filtersActive = q || date !== "any" || projectId || favOnly;

  return (
    <>
      <PageHeader
        title="Asset library"
        description="Every image, video, audio track, logo and export in one place."
        actions={
          <>
            <Button variant="secondary" leftIcon={<CheckSquare className="size-4" />} onClick={() => (selecting ? exitSelect() : setSelecting(true))}>{selecting ? "Done" : "Select"}</Button>
            <Button leftIcon={<Upload className="size-4" />} onClick={() => router.push("/studio")}>Upload</Button>
          </>
        }
      />

      {assets.length === 0 ? (
        <EmptyState icon={Images} title="Your library is empty" description="Generate an image or upload a product photo to get started." cta={{ label: "Generate an image", href: "/studio/image" }} />
      ) : (
        <>
          <Tabs layoutId="asset-types" items={TYPE_TABS.map((t) => ({ ...t, count: counts[t.value] }))} value={type} onChange={(v) => { setType(v); setSelected([]); }} className="mb-4" />

          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
            <SearchBar value={q} onChange={setQ} placeholder="Search assets…" className="lg:w-72" />
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5 flex-1">
              <Select compact aria-label="Date" value={date} onChange={(e) => setDate(e.target.value as DateFilter)} options={[{ value: "any", label: "Any date" }, { value: "7d", label: "Last 7 days" }, { value: "30d", label: "Last 30 days" }]} className="shrink-0" />
              <Select compact aria-label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)} options={[{ value: "", label: "All projects" }, ...projects.map((p) => ({ value: p.id, label: p.name }))]} className="shrink-0 max-w-48" />
              <Chip size="sm" label="Favorites" selected={favOnly} onClick={() => setFavOnly((v) => !v)} />
              {filtersActive && <button className="text-[12px] text-text2 hover:text-text whitespace-nowrap" onClick={() => { setQ(""); setDate("any"); setProjectId(""); setFavOnly(false); }}>Clear</button>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[12px] text-muted whitespace-nowrap">{list.length} item{list.length === 1 ? "" : "s"}</span>
              <Select compact aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} options={[{ value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }, { value: "name", label: "Name" }, { value: "size", label: "Largest" }]} />
            </div>
          </div>

          {list.length === 0 ? (
            <EmptyState compact icon={Images} title="Nothing matches" description="Try another type, project or search term." cta={{ label: "Clear filters", onClick: () => { setQ(""); setDate("any"); setProjectId(""); setFavOnly(false); setType("all"); } }} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {list.map((a) => (
                <AssetCard
                  key={a.id}
                  asset={a}
                  favorite={favorites.includes(a.id)}
                  onToggleFavorite={(x) => toggleFavorite("asset", x.id)}
                  selectable={selecting}
                  selected={selected.includes(a.id)}
                  onSelect={toggleSelect}
                  href={selecting ? undefined : `/assets/${a.id}`}
                  onPreview={setPreview}
                  onDownload={(x) => toast.success("Download started", x.name)}
                  onRename={setRenaming}
                  onMove={(x) => setMoving([x])}
                  onDelete={(x) => setDeleting([x])}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Selection bar */}
      <div className={cn("fixed left-1/2 -translate-x-1/2 bottom-20 md:bottom-6 z-40 transition-all", selecting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
        <div className="flex items-center gap-2 rounded-xl bg-elevated border border-border-strong shadow-float px-3 py-2">
          <span className="text-[13px] font-medium px-1 whitespace-nowrap">{selected.length} selected</span>
          <Button size="sm" variant="ghost" onClick={() => setSelected(selected.length === list.length ? [] : list.map((a) => a.id))}>{selected.length === list.length ? "None" : "All"}</Button>
          <Button size="sm" leftIcon={<Download className="size-4" />} disabled={selected.length === 0} onClick={() => setExportOpen(true)}>Export selected</Button>
          <Button size="sm" variant="secondary" leftIcon={<FolderInput className="size-4" />} disabled={selected.length === 0} onClick={() => setMoving(selectedAssets)} className="hidden sm:inline-flex">Move</Button>
          <Button size="sm" variant="danger" leftIcon={<Trash2 className="size-4" />} disabled={selected.length === 0} onClick={() => setDeleting(selectedAssets)}>Delete</Button>
          <Button size="sm" variant="ghost" onClick={exitSelect} aria-label="Exit selection"><X className="size-4" /></Button>
        </div>
      </div>

      <PreviewAssetModal asset={preview} onClose={() => setPreview(null)} />
      <RenameAssetModal asset={renaming} onClose={() => setRenaming(null)} />
      <MoveAssetModal assets={moving} onClose={() => setMoving([])} />
      <DeleteAssetsModal assets={deleting} onClose={() => setDeleting([])} onDeleted={() => setSelected([])} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} assetIds={selected} onComplete={exitSelect} />
    </>
  );
}
