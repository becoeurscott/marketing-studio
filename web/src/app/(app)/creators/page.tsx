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
      <PageHeader title="Creators" description="AI creators for UGC-style videos. Pick a persona, write a script, generate." />

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search creators…" className="md:w-72" />
        <div className="md:ml-auto">
          <Select
            compact
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            aria-label="Gender"
            options={[{ value: "all", label: "Any gender" }, { value: "female", label: "Female" }, { value: "male", label: "Male" }, { value: "non-binary", label: "Non-binary" }]}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 py-0.5 mb-6">
        {styles.map((s) => (
          <Chip key={s} size="sm" label={s === "Favorites" ? `Favorites · ${favorites.length}` : s} selected={style === s} onClick={() => setStyle(s)} />
        ))}
      </div>

      {list.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {list.map((c) => <CreatorCard key={c.id} creator={c} onOpen={setOpen} />)}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={style === "Favorites" && !q ? "No favorite creators yet" : "No creators match"}
          description={style === "Favorites" && !q ? "Tap the heart on a creator to keep them here." : "Try another style, gender or search term."}
          cta={{ label: "Show all creators", onClick: () => { setQ(""); setStyle("All"); setGender("all"); } }}
        />
      )}

      <CreatorDetailModal creator={open} onClose={() => setOpen(null)} />
    </>
  );
}
