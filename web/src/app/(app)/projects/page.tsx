"use client";

import { FolderKanban, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { ProjectFormModal } from "@/components/projects/NewProjectModal";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/ui/FilterBar";
import { Modal } from "@/components/ui/Modal";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { Project } from "@/lib/types";

type Filter = "all" | "active" | "archived";
type Sort = "updated" | "created" | "name";

export default function ProjectsPage() {
  const projects = useStore((s) => s.projects);
  const assets = useStore((s) => s.assets);
  const duplicateProject = useStore((s) => s.duplicateProject);
  const archiveProject = useStore((s) => s.archiveProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const toast = useToast();

  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("updated");
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const counts = { all: projects.length, active: projects.filter((p) => p.status === "active").length, archived: projects.filter((p) => p.status === "archived").length };

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return projects
      .filter((p) => filter === "all" || p.status === filter)
      .filter((p) => !s || p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s))
      .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : sort === "created" ? (a.createdAt < b.createdAt ? 1 : -1) : a.updatedAt < b.updatedAt ? 1 : -1));
  }, [projects, filter, q, sort]);

  const assetCount = (id: string) => assets.filter((a) => a.projectId === id).length;

  return (
    <>
      <PageHeader
        title="Projects"
        description="Everything you're working on, grouped by product or launch."
        actions={<Button leftIcon={<Plus className="size-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>New project</Button>}
      />

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <SearchBar value={q} onChange={setQ} placeholder="Search projects…" className="md:w-72" />
        <FilterBar
          className="flex-1"
          options={[{ value: "all", label: "All", count: counts.all }, { value: "active", label: "Active", count: counts.active }, { value: "archived", label: "Archived", count: counts.archived }]}
          value={filter}
          onChange={setFilter}
          right={<Select compact value={sort} onChange={(e) => setSort(e.target.value as Sort)} options={[{ value: "updated", label: "Last updated" }, { value: "created", label: "Newest" }, { value: "name", label: "Name" }]} aria-label="Sort" />}
        />
      </div>

      {list.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              assetCount={assetCount(p.id)}
              onRename={(pr) => { setEditing(pr); setFormOpen(true); }}
              onDuplicate={(pr) => { const c = duplicateProject(pr.id); if (c) toast.success("Project duplicated", c.name); }}
              onArchive={(pr) => { const arch = pr.status !== "archived"; archiveProject(pr.id, arch); toast.info(arch ? "Project archived" : "Project restored", pr.name); }}
              onDelete={(pr) => setDeleting(pr)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title={q ? "No projects match" : filter === "archived" ? "No archived projects" : "No projects yet"}
          description={q ? "Try a different search or clear the filter." : "Create a project to organize assets, generations and campaigns for a product or launch."}
          cta={q ? { label: "Clear search", onClick: () => setQ("") } : { label: "New project", onClick: () => { setEditing(null); setFormOpen(true); } }}
        />
      )}

      <ProjectFormModal open={formOpen} onClose={() => setFormOpen(false)} project={editing} />

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete project?"
        description={`"${deleting?.name}" and its ${deleting ? assetCount(deleting.id) : 0} assets, generations and campaigns will be removed.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { if (deleting) { deleteProject(deleting.id); toast.info("Project deleted", deleting.name); } setDeleting(null); }}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-text2">This can&apos;t be undone in the prototype.</p>
      </Modal>
    </>
  );
}
