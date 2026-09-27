"use client";

import { Card } from "@/components/ui/Card";
import type { CampaignAnalytics } from "@/lib/types";
import { useMoney } from "@/components/account/PaymentMethodPicker";
import { cn, formatNumber } from "@/lib/utils";

export function StatTile({ label, value, sub, className }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <Card padded={false} className={cn("p-4", className)}>
      <p className="text-[12px] text-muted">{label}</p>
      <p className="text-xl md:text-2xl font-bold tracking-tight mt-1">{value}</p>
      {sub && <p className="text-[12px] text-text2 mt-0.5">{sub}</p>}
    </Card>
  );
}

/** Simple SVG bar chart; no external libs. */
export function BarChart({ data, height = 160, accent, labels, className }: { data: number[]; height?: number; accent?: boolean; labels?: string[]; className?: string }) {
  const max = Math.max(...data, 1);
  const w = 100;
  const gap = 1.2;
  const bw = (w - gap * (data.length - 1)) / data.length;
  return (
    <div className={className}>
      <svg viewBox={`0 0 ${w} 40`} preserveAspectRatio="none" className="w-full block" style={{ height }} role="img" aria-label="Graphique en barres">
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={0} x2={w} y1={40 - g * 40} y2={40 - g * 40} stroke="currentColor" className="text-border" strokeWidth={0.2} />)}
        {data.map((v, i) => {
          const h = (v / max) * 38;
          return (
            <rect key={i} x={i * (bw + gap)} y={40 - h} width={bw} height={h} rx={0.6} className={cn(accent ? "fill-accent" : "fill-white/25", "hover:fill-highlight transition-colors")}>
              <title>{labels?.[i] ? `${labels[i]}: ` : ""}{formatNumber(v)}</title>
            </rect>
          );
        })}
      </svg>
      {labels && (
        <div className="flex justify-between text-[10px] text-muted mt-1.5">
          <span>{labels[0]}</span><span>{labels[Math.floor(labels.length / 2)]}</span><span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

export function Sparkline({ data, height = 48, className, stroke = "stroke-highlight" }: { data: number[]; height?: number; className?: string; stroke?: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const w = 100;
  const pts = data.map((v, i) => [(i / Math.max(data.length - 1, 1)) * w, 30 - ((v - min) / Math.max(max - min, 1)) * 28] as const);
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${path} L${w},30 L0,30 Z`;
  return (
    <svg viewBox={`0 0 ${w} 32`} preserveAspectRatio="none" className={cn("w-full block", className)} style={{ height }} role="img" aria-label="Tendance">
      <path d={area} className="fill-accent/15" />
      <path d={path} fill="none" strokeWidth={0.9} vectorEffect="non-scaling-stroke" className={stroke} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function CampaignAnalyticsPanel({ analytics }: { analytics: CampaignAnalytics }) {
  const money = useMoney();
  const labels = analytics.daily.map((d) => new Date(d.date).toLocaleDateString("fr-FR", { month: "short", day: "numeric" }));
  const engagement = analytics.daily.map((d) => Math.round(d.impressions * 0.06 + d.clicks * 0.4));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Portée" value={formatNumber(analytics.reach)} sub={`${formatNumber(analytics.impressions)} impressions`} />
        <StatTile label="Engagement" value={formatNumber(engagement.reduce((a, b) => a + b, 0))} sub="J'aime, enregistrements, commentaires" />
        <StatTile label="Clics" value={formatNumber(analytics.clicks)} sub={`${analytics.ctr.toLocaleString("fr-FR")} % de CTR`} />
        <StatTile label="ROAS" value={`${analytics.roas.toLocaleString("fr-FR")}x`} sub={`${money(analytics.spend)} dépensés · ${formatNumber(analytics.conversions)} commandes`} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[15px] font-semibold">Portée par jour</h3>
              <p className="text-[12px] text-text2">14 derniers jours</p>
            </div>
          </div>
          <BarChart data={analytics.daily.map((d) => Math.round(d.impressions * 0.72))} labels={labels} accent />
        </Card>
        <div className="space-y-4">
          <Card>
            <p className="text-[12px] text-muted">Tendance de l’engagement</p>
            <p className="text-lg font-semibold mt-0.5">{formatNumber(engagement[engagement.length - 1])} <span className="text-[12px] text-success font-medium">aujourd’hui</span></p>
            <Sparkline data={engagement} className="mt-2" />
          </Card>
          <Card>
            <p className="text-[12px] text-muted">Tendance des clics</p>
            <p className="text-lg font-semibold mt-0.5">{formatNumber(analytics.daily[analytics.daily.length - 1].clicks)} <span className="text-[12px] text-text2 font-medium">aujourd’hui</span></p>
            <Sparkline data={analytics.daily.map((d) => d.clicks)} className="mt-2" stroke="stroke-success" />
          </Card>
        </div>
      </div>
    </div>
  );
}
