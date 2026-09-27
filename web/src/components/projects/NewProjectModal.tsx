"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { Project } from "@/lib/types";

export interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  /** When set, the modal edits this project instead of creating one. */
  project?: Project | null;
}

export function ProjectFormModal({ open, onClose, project }: ProjectFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={project ? "Modifier le projet" : "Nouveau projet"} description={project ? undefined : "Un projet regroupe des ressources, des générations et des campagnes."}>
      {/* Keyed so the form resets each time it opens or the target project changes. */}
      <ProjectForm key={`${open}-${project?.id ?? "new"}`} project={project} onClose={onClose} />
    </Modal>
  );
}

function ProjectForm({ project, onClose }: { project?: Project | null; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const brands = useStore((s) => s.brands);
  const currentBrandId = useStore((s) => s.currentBrandId);
  const addProject = useStore((s) => s.addProject);
  const updateProject = useStore((s) => s.updateProject);

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [brandId, setBrandId] = useState(project?.brandId ?? currentBrandId);
  const [error, setError] = useState("");

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) { setError("Donnez un nom à votre projet."); return; }
    if (project) {
      updateProject(project.id, { name: name.trim(), description: description.trim(), brandId });
      toast.success("Projet mis à jour");
      onClose();
    } else {
      const p = addProject({ name: name.trim(), description: description.trim(), brandId });
      toast.success("Projet créé", p.name);
      onClose();
      router.push(`/projects/${p.id}`);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Nom" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Promo Tabaski Karité d'Or" error={error} autoFocus />
      <Textarea label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="À quoi sert ce projet ?" />
      <Select label="Marque" name="brand" value={brandId} onChange={(e) => setBrandId(e.target.value)} options={brands.map((b) => ({ value: b.id, label: b.name }))} />
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
        <Button type="submit">{project ? "Enregistrer" : "Créer le projet"}</Button>
      </div>
    </form>
  );
}
