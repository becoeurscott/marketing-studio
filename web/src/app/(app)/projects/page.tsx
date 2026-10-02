"use client";

import { ArrowRight, FolderKanban, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ProjectFormModal } from "@/components/projects/NewProjectModal";
import { ProjectCard } from "@/components/projects/ProjectCard";
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
  const addProject = useStore((s) => s.addProject);
  const toast = useToast();
  const router = useRouter();
  const [newName, setNewName] = useState("");

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
  const covers = (id: string) =>
    assets
      .filter((a) => a.projectId === id && (a.type === "image" || a.type === "video") && a.thumbnail)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 3)
      .map((a) => a.thumbnail);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) { setEditing(null); setFormOpen(true); return; }
    const p = addProject({ name });
    toast.success("Projet créé", p.name);
    setNewName("");
    router.push(`/projects/${p.id}`);
  };

  return (
    <>
      <section className="relative -mx-4 sm:mx-0 px-4 pt-6 pb-10 sm:pt-10 text-center overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 max-w-2xl rounded-full bg-accent/20 blur-[90px]" />
        <p className="relative inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-text2">Projets</p>
        <h1 className="relative mt-4 text-3xl sm:text-5xl font-black uppercase leading-[0.95] tracking-tight">
          Un produit, un projet.
          <span className="block text-text2/70">Tout son contenu au même endroit.</span>
        </h1>
        <form onSubmit={create} className="relative mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-card/80 p-2 pl-4 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)] focus-within:border-white/25 transition-colors">
          <Plus className="size-4 shrink-0 text-muted" />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nommez votre projet, ex : Promo Tabaski"
            aria-label="Nom du nouveau projet"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-text placeholder:text-muted outline-none h-10"
          />
          <Button type="submit" rightIcon={<ArrowRight className="size-4" />}>Créer</Button>
        </form>
      </section>

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
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {list.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              assetCount={assetCount(p.id)}
              covers={covers(p.id)}
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
