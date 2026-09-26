"use client";

import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ExportForm } from "@/components/assets/ExportModal";
import { PageHeader } from "@/components/shell/PageHeader";
import { usePageTitle } from "@/components/shell/ShellContext";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/lib/store";

/** /assets/export?ids=a,b,c or ?campaign=id — the Export Center as a full route. */
export default function ExportCenterPage() {
  usePageTitle("Centre d'export");
  return (
    <>
      <Link href="/assets" className="inline-flex items-center gap-1 text-[13px] text-text2 hover:text-text mb-3"><ArrowLeft className="size-3.5" /> Ressources</Link>
      <PageHeader title="Centre d'export" description="Exportez des ressources ou une campagne entière en PNG, JPG, MP4 ou PDF." />
      <Suspense fallback={null}>
        <ExportRoute />
      </Suspense>
    </>
  );
}

function ExportRoute() {
  const params = useSearchParams();
  const campaignId = params.get("campaign") ?? undefined;
  const idsParam = params.get("ids");
  const assets = useStore((s) => s.assets);
  const campaigns = useStore((s) => s.campaigns);
  const ids = idsParam ? idsParam.split(",").filter((id) => assets.some((a) => a.id === id)) : [];
  const hasCampaign = campaignId ? campaigns.some((c) => c.id === campaignId) : campaigns.length > 0;

  if (ids.length === 0 && !hasCampaign) {
    return <EmptyState icon={Download} title="Rien à exporter" description="Sélectionnez des ressources dans la bibliothèque, ou ouvrez une campagne et choisissez Exporter la campagne." cta={{ label: "Voir les ressources", href: "/assets" }} />;
  }

  return (
    <Card className="max-w-2xl">
      <ExportForm key={`${campaignId ?? ""}-${ids.join(",")}`} assetIds={ids} campaignId={campaignId} embedded />
    </Card>
  );
}
