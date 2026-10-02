"use client";

import { Archive, ArchiveRestore, Copy, ImagePlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge, statusTone } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import type { Project } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export interface ProjectCardProps {
  project: Project;
  assetCount: number;
  /** Latest visuals of the project (thumbnail URLs, newest first), used as the cover. */
  covers?: string[];
  onRename?: (p: Project) => void;
  onDuplicate?: (p: Project) => void;
  onArchive?: (p: Project) => void;
  onDelete?: (p: Project) => void;
}

export function ProjectCard({ project, assetCount, covers = [], onRename, onDuplicate, onArchive, onDelete }: ProjectCardProps) {
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
      <Link
        href={`/projects/${project.id}`}
        className={cn(
          "relative block aspect-[4/5] rounded-2xl overflow-hidden border border-white/5 bg-elevated transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_18px_50px_rgba(0,0,0,0.55)]",
          project.status === "archived" && "opacity-60",
        )}
      >
        {covers.length >= 3 ? (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0.5">
            <img src={covers[0]} alt="" className="col-span-2 row-span-2 size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
            <img src={covers[1]} alt="" className="size-full object-cover" />
            <img src={covers[2]} alt="" className="size-full object-cover" />
          </div>
        ) : covers.length ? (
          <img src={covers[0]} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_50%_30%,rgba(255,255,255,0.07),transparent_65%)]">
            <div className="flex flex-col items-center gap-2 text-muted">
              <span className="grid size-12 place-items-center rounded-full border border-dashed border-white/15"><ImagePlus className="size-5" /></span>
              <span className="text-xs">Aucun visuel pour l&apos;instant</span>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        {project.status === "archived" && <Badge tone={statusTone(project.status)} dot className="absolute top-3 left-3">Archivé</Badge>}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[15px] font-semibold text-white truncate">{project.name}</p>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/70">
            <span className="rounded-full bg-white/10 px-2 py-0.5 backdrop-blur">{assetCount} visuel{assetCount > 1 ? "s" : ""}</span>
            <span className="truncate">{formatDate(project.updatedAt)}</span>
          </div>
        </div>
      </Link>
      {hasMenu && (
        <div className="absolute top-3 right-3">
          <IconButton label="Actions sur le projet" size="sm" className="bg-black/50 text-white hover:bg-black/70 backdrop-blur opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity" onClick={(e) => { e.preventDefault(); setMenu((v) => !v); }}>
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
