"use client";

import { Archive, ArchiveRestore, ArrowLeft, Copy, FolderKanban, Images, Megaphone, Pencil, Play, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ProjectFormModal } from "@/components/projects/NewProjectModal";
import { PageHeader } from "@/components/shell/PageHeader";
import { usePageTitle } from "@/components/shell/ShellContext";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import { formatDate, formatNumber, timeAgo } from "@/lib/utils";

type Tab = "overview" | "assets" | "generations" | "campaigns";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const brand = useStore((s) => s.brands.find((b) => b.id === project?.brandId));
  const allAssets = useStore((s) => s.assets);
  const allGenerations = useStore((s) => s.generations);
  const allCampaigns = useStore((s) => s.campaigns);
  const duplicateProject = useStore((s) => s.duplicateProject);
  const archiveProject = useStore((s) => s.archiveProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const setCurrentProject = useStore((s) => s.setCurrentProject);

  const assets = allAssets.filter((a) => a.projectId === id);
  const generations = allGenerations.filter((g) => g.projectId === id);
  const campaigns = allCampaigns.filter((c) => c.projectId === id);

  const [tab, setTab] = useState<Tab>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  usePageTitle(project?.name);

  if (!project) {
    return <EmptyState icon={FolderKanban} title="Project not found" description="It may have been deleted." cta={{ label: "Back to projects", href: "/projects" }} />;
  }

  const archived = project.status === "archived";
  const openInStudio = () => { setCurrentProject(project.id); router.push("/studio"); };

  const overviewStats: [string, number, typeof Images][] = [["Assets", assets.length, Images], ["Generations", generations.length, Sparkles], ["Campaigns", campaigns.length, Megaphone]];

  return (
    <>
      <Link href="/projects" className="inline-flex items-center gap-1 text-[13px] text-text2 hover:text-text mb-3"><ArrowLeft className="size-3.5" /> Projects</Link>
      <PageHeader
        eyebrow={<Badge tone={statusTone(project.status)} dot className="capitalize">{project.status}</Badge>}
        title={project.name}
        description={project.description || "No description yet."}
        actions={
          <>
            <IconButton label="Rename" variant="outline" onClick={() => setEditOpen(true)}><Pencil /></IconButton>
            <IconButton label="Duplicate" variant="outline" onClick={() => { const c = duplicateProject(project.id); if (c) { toast.success("Project duplicated", c.name); router.push(`/projects/${c.id}`); } }}><Copy /></IconButton>
            <IconButton label={archived ? "Restore" : "Archive"} variant="outline" onClick={() => { archiveProject(project.id, !archived); toast.info(archived ? "Project restored" : "Project archived"); }}>{archived ? <ArchiveRestore /> : <Archive />}</IconButton>
            <IconButton label="Delete" variant="outline" className="hover:text-danger" onClick={() => setDeleteOpen(true)}><Trash2 /></IconButton>
            <Button leftIcon={<Wand2 className="size-4" />} onClick={openInStudio}>Open in Studio</Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-text2 mb-5">
        <span>Brand <span className="text-text">{brand?.name ?? "—"}</span></span>
        <span>Created <span className="text-text">{formatDate(project.createdAt)}</span></span>
        <span>Updated <span className="text-text">{timeAgo(project.updatedAt)}</span></span>
      </div>

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "overview", label: "Overview" },
          { value: "assets", label: "Assets", count: assets.length },
          { value: "generations", label: "Generations", count: generations.length },
          { value: "campaigns", label: "Campaigns", count: campaigns.length },
        ]}
      />

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 overflow-hidden" padded={false}>
            <div className="aspect-[21/9] bg-elevated"><img src={project.thumbnail} alt="" className="size-full object-cover" /></div>
            <div className="p-5 grid grid-cols-3 gap-4">
              {overviewStats.map(([label, value, Icon]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="size-9 rounded-md bg-elevated border border-border flex items-center justify-center text-text2"><Icon className="size-4" /></span>
                  <span><span className="block text-lg font-semibold leading-none">{formatNumber(value)}</span><span className="block text-xs text-muted mt-1">{label}</span></span>
                </div>
              ))}
            </div>
          </Card>
          <div className="space-y-4">
            <Card>
              <p className="text-[13px] font-semibold mb-3">Next steps</p>
              <div className="space-y-2">
                {[["Generate product shots", "/studio/product-shoot"], ["Create a UGC ad", "/studio/ugc"], ["Write campaign copy", "/studio/copy"], ["Build a campaign", "/campaigns"]].map(([l, h]) => (
                  <Link key={h} href={h} onClick={() => setCurrentProject(project.id)} className="flex items-center justify-between h-10 px-3 rounded-md bg-surface border border-border text-[13px] text-text2 hover:text-text hover:border-white/20 transition-colors">
                    {l} <Plus className="size-4" />
                  </Link>
                ))}
              </div>
            </Card>
            {brand && (
              <Card className="flex items-center gap-3">
                <img src={brand.logoUrl} alt="" className="size-10 rounded-md object-cover border border-border" />
                <span className="min-w-0"><span className="block text-sm font-medium truncate">{brand.name}</span><span className="block text-xs text-muted">{brand.industry} · {brand.styleTags.slice(0, 2).join(", ")}</span></span>
                <Link href="/brand" className="ml-auto text-xs text-highlight">Edit</Link>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === "assets" && (assets.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {assets.map((a) => (
            <Link key={a.id} href={`/assets/${a.id}`} className="group relative aspect-[4/5] rounded-lg overflow-hidden border border-border bg-elevated">
              <img src={a.thumbnail} alt={a.name} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              {a.type === "video" && <span className="absolute top-2 right-2 size-6 rounded-full bg-black/60 flex items-center justify-center"><Play className="size-3 text-white fill-white" /></span>}
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent"><span className="text-[11px] text-white line-clamp-1">{a.name}</span></div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={Images} title="No assets in this project" description="Generate or upload something to see it here." cta={{ label: "Open Studio", onClick: openInStudio }} />
      ))}

      {tab === "generations" && (generations.length ? (
        <div className="space-y-2">
          {generations.map((g) => (
            <Card key={g.id} className="flex items-center gap-4 p-3">
              <div className="size-14 rounded-md overflow-hidden bg-elevated border border-border shrink-0">
                {g.thumbnails[0] ? <img src={g.thumbnails[0]} alt="" className="size-full object-cover" /> : <span className="size-full flex items-center justify-center text-muted"><Sparkles className="size-4" /></span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{g.prompt}</p>
                <p className="text-xs text-muted mt-0.5 capitalize">{g.type} · {timeAgo(g.createdAt)} · {g.creditsUsed} credits</p>
              </div>
              <Badge tone={statusTone(g.status)} className="capitalize">{g.status}</Badge>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Sparkles} title="No generations yet" description="Every image, video and copy you generate in this project will be listed here." cta={{ label: "Generate", onClick: openInStudio }} />
      ))}

      {tab === "campaigns" && (campaigns.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/campaigns/${c.id}`}>
              <Card interactive>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <p className="text-xs text-muted mt-0.5 capitalize">{c.objective} · {c.platforms.join(", ")}</p>
                  </div>
                  <Badge tone={statusTone(c.status)} dot className="capitalize">{c.status}</Badge>
                </div>
                <p className="text-xs text-text2 mt-3">{c.assetIds.length} assets · {c.variations.length} variations · {c.calendar.length} scheduled</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={Megaphone} title="No campaigns yet" description="Turn this project's assets into a multi-platform campaign." cta={{ label: "Build a campaign", href: "/campaigns" }} />
      ))}

      <ProjectFormModal open={editOpen} onClose={() => setEditOpen(false)} project={project} />
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete project?"
        description={`"${project.name}" and its ${assets.length} assets, ${generations.length} generations and ${campaigns.length} campaigns will be removed.`}
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => { deleteProject(project.id); toast.info("Project deleted"); router.replace("/projects"); }}>Delete</Button></>}
      >
        <p className="text-sm text-text2">This can&apos;t be undone in the prototype.</p>
      </Modal>
    </>
  );
}
