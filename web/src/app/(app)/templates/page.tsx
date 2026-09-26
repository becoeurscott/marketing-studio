"use client";

import { LayoutTemplate } from "lucide-react";
import { useMemo, useState } from "react";
import { TemplateCard } from "@/components/library/TemplateCard";
import { PageHeader } from "@/components/shell/PageHeader";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { TEMPLATE_CATEGORIES, templates } from "@/data";
import { useStore } from "@/lib/store";
import type { TemplateCategory } from "@/lib/types";
import { TEMPLATE_CATEGORY_LABELS, labelOf } from "@/lib/labels";

type Category = TemplateCategory | "All" | "Favorites";
type Sort = "popular" | "az";

export default function TemplatesPage() {
  const favorites = useStore((s) => s.favorites.template);
  const [category, setCategory] = useState<Category>("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("popular");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return templates
      .filter((t) => category === "All" || (category === "Favorites" ? favorites.includes(t.id) : t.category === category))
      .filter((t) => !s || t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s) || t.category.toLowerCase().includes(s))
      .sort((a, b) => (sort === "az" ? a.title.localeCompare(b.title) : b.uses - a.uses));
  }, [category, q, sort, favorites]);

  const countFor = (c: Category) => (c === "All" ? templates.length : c === "Favorites" ? favorites.length : templates.filter((t) => t.category === c).length);

  return (
    <>
      <PageHeader title="Modèles" description="Partez d’un format qui a fait ses preuves. Chaque modèle ouvre le Studio préconfiguré." />

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Rechercher un modèle…" className="md:w-72" />
        <div className="md:ml-auto">
          <Select compact value={sort} onChange={(e) => setSort(e.target.value as Sort)} options={[{ value: "popular", label: "Les plus utilisés" }, { value: "az", label: "A – Z" }]} aria-label="Trier" />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 py-0.5 mb-6">
        {(["All", "Favorites", ...TEMPLATE_CATEGORIES] as Category[]).map((c) => (
          <Chip key={c} size="sm" label={`${c === "All" ? "Tous" : c === "Favorites" ? "Favoris" : labelOf(TEMPLATE_CATEGORY_LABELS, c)} · ${countFor(c)}`} selected={category === c} onClick={() => setCategory(c)} />
        ))}
      </div>

      {list.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {list.map((t) => <TemplateCard key={t.id} template={t} />)}
        </div>
      ) : (
        <EmptyState
          icon={LayoutTemplate}
          title={q ? "Aucun modèle ne correspond" : category === "Favorites" ? "Aucun modèle favori pour le moment" : "Aucun modèle dans cette catégorie"}
          description={q ? "Essayez une autre recherche ou retirez le filtre." : category === "Favorites" ? "Touchez le cœur d’un modèle pour le retrouver ici." : "Revenez bientôt : de nouveaux modèles sont ajoutés chaque semaine."}
          cta={{ label: q ? "Effacer la recherche" : "Afficher tous les modèles", onClick: () => { setQ(""); setCategory("All"); } }}
        />
      )}
    </>
  );
}
