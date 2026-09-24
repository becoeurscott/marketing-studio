"use client";

import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { ProgressBar } from "@/components/ui/ProgressIndicator";
import { ApiError, createCampaign } from "@/lib/api";
import { useStore } from "@/lib/store";
import { PLATFORMS, type CampaignFormat, type CampaignObjective, type Platform } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CAMPAIGN_FORMATS, OBJECTIVES, PlatformIcon, formatLabel, objectiveLabel, platformLabel } from "./platform";

const STEPS = ["Objective", "Audience", "Platforms", "Formats", "Review"] as const;
const BUILDER_PLATFORMS: Platform[] = ["instagram", "tiktok", "facebook", "youtube"];
const AUDIENCE_CHIPS = [
  "Women and men 20–35 interested in skincare",
  "Gen Z, TikTok-first, value-driven",
  "Existing customers, 25–40",
  "Gift shoppers 25–45",
  "Urban professionals 25–45",
  "Luxury shoppers, men 30–50",
];

export function CampaignBuilder() {
  const router = useRouter();
  const toast = useToast();
  const projects = useStore((s) => s.projects);
  const currentProjectId = useStore((s) => s.currentProjectId);
  const brandName = useStore((s) => s.brands.find((b) => b.id === s.currentBrandId)?.name ?? "your brand");

  const activeProjects = projects.filter((p) => p.status === "active");
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState(currentProjectId ?? activeProjects[0]?.id ?? "");
  const [objective, setObjective] = useState<CampaignObjective | null>(null);
  const [audience, setAudience] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [formats, setFormats] = useState<CampaignFormat[]>([]);
  const [progress, setProgress] = useState<{ label: string; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canNext = [
    objective !== null,
    audience.trim().length > 3,
    platforms.length > 0,
    formats.length > 0,
    name.trim().length > 1 && Boolean(projectId),
  ][step];

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const suggestedName = () => {
    if (name.trim()) return;
    const proj = projects.find((p) => p.id === projectId);
    const stem = proj ? proj.name.split(" ").slice(0, 2).join(" ") : brandName;
    setName(`${stem} ${objective ? objectiveLabel(objective) : "Campaign"}`);
  };

  const generate = async () => {
    if (!objective) return;
    setError(null);
    setProgress({ label: "Starting", pct: 0 });
    try {
      const campaign = await createCampaign(
        { name: name.trim(), projectId, objective, audience: audience.trim(), platforms, formats },
        (label, pct) => setProgress({ label, pct }),
      );
      toast.success("Campaign ready", `${campaign.name} was generated.`);
      router.push(`/campaigns/${campaign.id}`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Something went wrong.";
      setError(msg);
      setProgress(null);
      toast.error("Something went wrong.", msg);
    }
  };

  if (progress) {
    return (
      <Card className="max-w-xl mx-auto text-center py-12">
        <div className="size-14 mx-auto rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mb-5">
          <Sparkles className="size-6 text-highlight animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Building {name.trim()}</h2>
        <p className="text-sm text-text2 mt-1">{progress.label}…</p>
        <ProgressBar value={progress.pct} className="mt-6 max-w-sm mx-auto" />
        <p className="text-xs text-muted mt-6">Generating creatives, ad variations, copy and a starter calendar.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <ol className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={s} className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={i > step}
                onClick={() => setStep(i)}
                className={cn("flex items-center gap-2 text-[13px] font-medium transition-colors", active ? "text-text" : done ? "text-text2 hover:text-text" : "text-muted")}
              >
                <span className={cn("size-6 rounded-full border flex items-center justify-center text-[11px]", done ? "bg-success/20 border-success/40 text-success" : active ? "border-accent bg-accent/15 text-highlight" : "border-border-strong")}>
                  {done ? <Check className="size-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < STEPS.length - 1 && <span className={cn("h-px w-6 sm:w-10", done ? "bg-success/40" : "bg-border-strong")} />}
            </li>
          );
        })}
      </ol>

      <Card className="p-5 md:p-8">
        {step === 0 && (
          <StepShell title="What's the objective?" description="This shapes the creatives, copy tone and CTA we generate.">
            <div className="grid sm:grid-cols-2 gap-3">
              {OBJECTIVES.map((o) => (
                <OptionCard key={o.id} selected={objective === o.id} onClick={() => setObjective(o.id)} title={o.label} description={o.description} />
              ))}
            </div>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell title="Who is this for?" description="Describe the audience in a sentence, or start from a suggestion.">
            <Textarea value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Women and men 20–35 who want a simple, effective skincare routine" rows={3} />
            <div className="flex flex-wrap gap-2 mt-3">
              {AUDIENCE_CHIPS.map((c) => (
                <Chip key={c} size="sm" label={c} selected={audience === c} onClick={() => setAudience(c)} />
              ))}
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title="Where will it run?" description="Pick every platform you want creatives sized and written for.">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BUILDER_PLATFORMS.map((p) => (
                <OptionCard key={p} selected={platforms.includes(p)} onClick={() => setPlatforms(toggle(platforms, p))} title={platformLabel(p)} icon={<PlatformIcon platform={p} className="size-5" />} center />
              ))}
            </div>
            <p className="text-xs text-muted mt-3">{PLATFORMS.length - BUILDER_PLATFORMS.length} more platforms are available from the Ad creator.</p>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="Which creative formats?" description="We'll generate a set for each format you choose.">
            <div className="grid sm:grid-cols-2 gap-3">
              {CAMPAIGN_FORMATS.map((f) => (
                <OptionCard key={f.id} selected={formats.includes(f.id)} onClick={() => setFormats(toggle(formats, f.id))} title={f.label} description={f.description} />
              ))}
            </div>
          </StepShell>
        )}

        {step === 4 && objective && (
          <StepShell title="Review and generate" description="Name the campaign and confirm the brief.">
            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <Input label="Campaign name" value={name} onChange={(e) => setName(e.target.value)} onFocus={suggestedName} placeholder="Luma Glow Summer Launch" autoFocus />
              <Select label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)} options={activeProjects.map((p) => ({ value: p.id, label: p.name }))} placeholder="Choose a project" />
            </div>
            <dl className="divide-y divide-border rounded-lg border border-border bg-surface/50">
              <ReviewRow label="Objective" onEdit={() => setStep(0)}>{objectiveLabel(objective)}</ReviewRow>
              <ReviewRow label="Audience" onEdit={() => setStep(1)}>{audience}</ReviewRow>
              <ReviewRow label="Platforms" onEdit={() => setStep(2)}>
                <span className="flex flex-wrap gap-1.5">{platforms.map((p) => <span key={p} className="inline-flex items-center gap-1 text-[12px] bg-elevated border border-border rounded-full px-2 py-0.5"><PlatformIcon platform={p} className="size-3" />{platformLabel(p)}</span>)}</span>
              </ReviewRow>
              <ReviewRow label="Formats" onEdit={() => setStep(3)}>{formats.map(formatLabel).join(", ")}</ReviewRow>
            </dl>
            {error && <p className="text-sm text-danger mt-4">{error}</p>}
          </StepShell>
        )}

        <div className="flex items-center justify-between gap-3 mt-8 pt-5 border-t border-border">
          <Button variant="ghost" leftIcon={<ArrowLeft className="size-4" />} onClick={() => (step === 0 ? router.push("/campaigns") : setStep(step - 1))}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button rightIcon={<ArrowRight className="size-4" />} disabled={!canNext} onClick={() => { if (step === 3) suggestedName(); setStep(step + 1); }}>Continue</Button>
          ) : (
            <Button leftIcon={<Sparkles className="size-4" />} disabled={!canNext} onClick={generate}>Generate campaign</Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function StepShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-text2 mt-1 mb-6">{description}</p>
      {children}
    </div>
  );
}

function OptionCard({ selected, onClick, title, description, icon, center }: { selected: boolean; onClick: () => void; title: string; description?: string; icon?: React.ReactNode; center?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={title}
      className={cn(
        "relative text-left rounded-lg border p-4 transition-colors",
        center && "flex flex-col items-center text-center gap-2 py-5",
        selected ? "border-accent bg-accent/10" : "border-border-strong bg-surface hover:border-white/25",
      )}
    >
      {selected && <span className="absolute top-2.5 right-2.5 size-4 rounded-full bg-accent flex items-center justify-center"><Check className="size-2.5 text-white" /></span>}
      {icon && <span className={cn("text-text2", selected && "text-highlight")}>{icon}</span>}
      <span className="block text-sm font-semibold">{title}</span>
      {description && <span className="block text-[13px] text-text2 mt-1">{description}</span>}
    </button>
  );
}

function ReviewRow({ label, children, onEdit }: { label: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <dt className="w-24 shrink-0 text-[13px] text-muted">{label}</dt>
      <dd className="flex-1 text-sm text-text min-w-0">{children}</dd>
      <button type="button" onClick={onEdit} className="text-[12px] text-text2 hover:text-text">Edit</button>
    </div>
  );
}
