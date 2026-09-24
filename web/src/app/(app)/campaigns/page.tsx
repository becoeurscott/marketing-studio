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
    <Link href="/campaigns/new"><Button leftIcon={<Plus className="size-4" />}>New campaign</Button></Link>
  );

  return (
    <>
      <PageHeader title="Campaigns" description="Plan, generate and schedule multi-platform campaigns from one brief." actions={newButton} />

      {campaigns.length === 0 ? (
        <EmptyState icon={Megaphone} title="No campaigns yet" description="Answer five quick questions and we'll generate creatives, copy and a starter calendar." cta={{ label: "New campaign", href: "/campaigns/new" }} />
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
            <SearchBar value={q} onChange={setQ} placeholder="Search campaigns…" className="md:w-72" />
            <FilterBar
              className="flex-1"
              options={[
                { value: "all", label: "All", count: counts.all },
                { value: "draft", label: "Draft", count: counts.draft },
                { value: "active", label: "Active", count: counts.active },
                { value: "completed", label: "Completed", count: counts.completed },
              ]}
              value={filter}
              onChange={setFilter}
              right={<Select compact aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} options={[{ value: "updated", label: "Last updated" }, { value: "created", label: "Newest" }, { value: "name", label: "Name" }]} />}
            />
          </div>

          {list.length === 0 ? (
            <EmptyState compact icon={Megaphone} title="No campaigns match" description="Try a different filter or search term." cta={{ label: "Clear filters", onClick: () => { setFilter("all"); setQ(""); } }} />
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
