"use client";

import { Archive, ArchiveRestore, Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge, statusTone } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import type { Project } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export interface ProjectCardProps {
  project: Project;
  assetCount: number;
  onRename?: (p: Project) => void;
  onDuplicate?: (p: Project) => void;
  onArchive?: (p: Project) => void;
  onDelete?: (p: Project) => void;
}

export function ProjectCard({ project, assetCount, onRename, onDuplicate, onArchive, onDelete }: ProjectCardProps) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasMenu = !!(onRename || onDuplicate || onArchive || onDelete);

  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menu]);

  const item = (label: string, Icon: typeof Pencil, fn?: (p: Project) => void, danger?: boolean) =>
    fn && (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenu(false); fn(project); }}
        className={cn("flex items-center gap-2 w-full px-3 h-9 text-[13px] text-left hover:bg-white/5", danger ? "text-danger" : "text-text2 hover:text-text")}
      >
        <Icon className="size-4" /> {label}
      </button>
    );

  return (
    <div ref={ref} className="relative group">
      <Link href={`/projects/${project.id}`} className={cn("block rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-white/15", project.status === "archived" && "opacity-70")}>
        <div className="relative aspect-[16/10] bg-elevated overflow-hidden">
          <img src={project.thumbnail} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <Badge tone={statusTone(project.status)} dot className="absolute top-3 left-3">{project.status === "archived" ? "Archivé" : "Actif"}</Badge>
        </div>
        <div className="p-4">
          <p className="text-sm font-semibold truncate">{project.name}</p>
          <p className="text-xs text-muted mt-1">Créé le {formatDate(project.createdAt)} · {assetCount} ressource{assetCount > 1 ? "s" : ""}</p>
        </div>
      </Link>
      {hasMenu && (
        <div className="absolute top-3 right-3">
          <IconButton label="Actions sur le projet" size="sm" className="bg-black/50 text-white hover:bg-black/70 backdrop-blur" onClick={(e) => { e.preventDefault(); setMenu((v) => !v); }}>
            <MoreHorizontal />
          </IconButton>
          {menu && (
            <div className="absolute right-0 mt-1 w-48 rounded-md bg-elevated border border-border-strong shadow-float py-1 z-20">
              {item("Renommer", Pencil, onRename)}
              {item("Dupliquer", Copy, onDuplicate)}
              {item(project.status === "archived" ? "Restaurer" : "Archiver", project.status === "archived" ? ArchiveRestore : Archive, onArchive)}
              {item("Supprimer", Trash2, onDelete, true)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
