"use client";

import { Megaphone, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/ui/FilterBar";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { useStore } from "@/lib/store";
import type { CampaignStatus } from "@/lib/types";

type Filter = "all" | CampaignStatus;
type Sort = "updated" | "created" | "name";

export default function CampaignsPage() {
  const campaigns = useStore((s) => s.campaigns);
  const assets = useStore((s) => s.assets);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("updated");
  const [q, setQ] = useState("");

  const counts = {
    all: campaigns.length,
    draft: campaigns.filter((c) => c.status === "draft").length,
    active: campaigns.filter((c) => c.status === "active").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
  };

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return campaigns
      .filter((c) => filter === "all" || c.status === filter)
      .filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.audience.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "created") return a.createdAt < b.createdAt ? 1 : -1;
        return a.updatedAt < b.updatedAt ? 1 : -1;
      });
  }, [campaigns, filter, q, sort]);

  const newButton = (
    <Link href="/campaigns/new"><Button leftIcon={<Plus className="size-4" />}>Nouvelle campagne</Button></Link>
  );

  return (
    <>
      <PageHeader title="Campagnes" description="Planifiez, générez et programmez des campagnes multiplateformes à partir d'un seul brief." actions={newButton} />

      {campaigns.length === 0 ? (
        <EmptyState icon={Megaphone} title="Aucune campagne pour l'instant" description="Répondez à cinq questions rapides et nous générerons vos visuels, vos textes et un premier calendrier." cta={{ label: "Nouvelle campagne", href: "/campaigns/new" }} />
      ) : (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
            <SearchBar value={q} onChange={setQ} placeholder="Rechercher une campagne…" className="lg:w-72" />
            <FilterBar
              className="flex-1"
              options={[
                { value: "all", label: "Toutes", count: counts.all },
                { value: "draft", label: "Brouillon", count: counts.draft },
                { value: "active", label: "Active", count: counts.active },
                { value: "completed", label: "Terminée", count: counts.completed },
              ]}
              value={filter}
              onChange={setFilter}
              right={<Select compact aria-label="Trier" value={sort} onChange={(e) => setSort(e.target.value as Sort)} options={[{ value: "updated", label: "Dernière mise à jour" }, { value: "created", label: "Plus récentes" }, { value: "name", label: "Nom" }]} />}
            />
          </div>

          {list.length === 0 ? (
            <EmptyState compact icon={Megaphone} title="Aucune campagne ne correspond" description="Essayez un autre filtre ou un autre terme de recherche." cta={{ label: "Effacer les filtres", onClick: () => { setFilter("all"); setQ(""); } }} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {list.map((c) => <CampaignCard key={c.id} campaign={c} assets={assets} />)}
            </div>
          )}
        </>
      )}
    </>
  );
}
