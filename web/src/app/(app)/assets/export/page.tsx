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
  usePageTitle("Export center");
  return (
    <>
      <Link href="/assets" className="inline-flex items-center gap-1 text-[13px] text-text2 hover:text-text mb-3"><ArrowLeft className="size-3.5" /> Assets</Link>
      <PageHeader title="Export center" description="Package assets or a whole campaign as PNG, JPG, MP4 or PDF." />
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
    return <EmptyState icon={Download} title="Nothing to export" description="Select assets in the library or open a campaign and choose Export campaign." cta={{ label: "Go to assets", href: "/assets" }} />;
  }

  return (
    <Card className="max-w-2xl">
      <ExportForm key={`${campaignId ?? ""}-${ids.join(",")}`} assetIds={ids} campaignId={campaignId} embedded />
    </Card>
  );
}
