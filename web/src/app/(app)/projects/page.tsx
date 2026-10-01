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
        title="Projets"
        description="Tout ce sur quoi vous travaillez, regroupé par produit ou par lancement."
        actions={<Button leftIcon={<Plus className="size-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>Nouveau projet</Button>}
      />

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
        <SearchBar value={q} onChange={setQ} placeholder="Rechercher un projet…" className="lg:w-72" />
        <FilterBar
          className="flex-1"
          options={[{ value: "all", label: "Tous", count: counts.all }, { value: "active", label: "Actifs", count: counts.active }, { value: "archived", label: "Archivés", count: counts.archived }]}
          value={filter}
          onChange={setFilter}
          right={<Select compact value={sort} onChange={(e) => setSort(e.target.value as Sort)} options={[{ value: "updated", label: "Dernière mise à jour" }, { value: "created", label: "Plus récents" }, { value: "name", label: "Nom" }]} aria-label="Trier" />}
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
              onDuplicate={(pr) => { const c = duplicateProject(pr.id); if (c) toast.success("Projet dupliqué", c.name); }}
              onArchive={(pr) => { const arch = pr.status !== "archived"; archiveProject(pr.id, arch); toast.info(arch ? "Projet archivé" : "Projet restauré", pr.name); }}
              onDelete={(pr) => setDeleting(pr)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title={q ? "Aucun projet ne correspond" : filter === "archived" ? "Aucun projet archivé" : "Aucun projet pour l'instant"}
          description={q ? "Essayez une autre recherche ou effacez le filtre." : "Créez un projet pour organiser les ressources, générations et campagnes d'un produit ou d'un lancement."}
          cta={q ? { label: "Effacer la recherche", onClick: () => setQ("") } : { label: "Nouveau projet", onClick: () => { setEditing(null); setFormOpen(true); } }}
        />
      )}

      <ProjectFormModal open={formOpen} onClose={() => setFormOpen(false)} project={editing} />

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Supprimer le projet ?"
        description={`« ${deleting?.name} » ainsi que ses ${deleting ? assetCount(deleting.id) : 0} ressources, ses générations et ses campagnes seront supprimés.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Annuler</Button>
            <Button variant="danger" onClick={() => { if (deleting) { deleteProject(deleting.id); toast.info("Projet supprimé", deleting.name); } setDeleting(null); }}>Supprimer</Button>
          </>
        }
      >
        <p className="text-sm text-text2">Cette action est irréversible dans le prototype.</p>
      </Modal>
    </>
  );
}
