"use client";

import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import { CreatorCard } from "@/components/library/CreatorCard";
import { CreatorDetailModal } from "@/components/library/CreatorDetailModal";
import { PageHeader } from "@/components/shell/PageHeader";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { creators } from "@/data";
import { useStore } from "@/lib/store";
import type { Creator } from "@/lib/types";
import { GENDER_LABELS } from "@/lib/labels";

type Gender = "all" | Creator["gender"];

export default function CreatorsPage() {
  const favorites = useStore((s) => s.favorites.creator);
  const [style, setStyle] = useState<string>("All");
  const [gender, setGender] = useState<Gender>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Creator | null>(null);

  const styles = useMemo(() => ["All", "Favorites", ...Array.from(new Set(creators.map((c) => c.style)))], []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return creators
      .filter((c) => style === "All" || (style === "Favorites" ? favorites.includes(c.id) : c.style === style))
      .filter((c) => gender === "all" || c.gender === gender)
      .filter((c) => !s || c.name.toLowerCase().includes(s) || c.style.toLowerCase().includes(s) || c.languages.some((l) => l.toLowerCase().includes(s)))
      .sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [style, gender, q, favorites]);

  return (
    <>
      <PageHeader title="Créateurs" description="Des créateurs IA pour vos vidéos style UGC. Choisissez un persona, écrivez un script, générez." />

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Rechercher un créateur…" className="md:w-72" />
        <div className="md:ml-auto">
          <Select
            compact
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            aria-label="Genre"
            options={[{ value: "all", label: "Tous les genres" }, { value: "female", label: GENDER_LABELS.female }, { value: "male", label: GENDER_LABELS.male }, { value: "non-binary", label: GENDER_LABELS["non-binary"] }]}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 py-0.5 mb-6">
        {styles.map((s) => (
          <Chip key={s} size="sm" label={s === "Favorites" ? `Favoris · ${favorites.length}` : s === "All" ? "Tous" : s} selected={style === s} onClick={() => setStyle(s)} />
        ))}
      </div>

      {list.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {list.map((c) => <CreatorCard key={c.id} creator={c} onOpen={setOpen} />)}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={style === "Favorites" && !q ? "Aucun créateur favori pour le moment" : "Aucun créateur ne correspond"}
          description={style === "Favorites" && !q ? "Touchez le cœur d’un créateur pour le retrouver ici." : "Essayez un autre style, genre ou terme de recherche."}
          cta={{ label: "Afficher tous les créateurs", onClick: () => { setQ(""); setStyle("All"); setGender("all"); } }}
        />
      )}

      <CreatorDetailModal creator={open} onClose={() => setOpen(null)} />
    </>
  );
}
