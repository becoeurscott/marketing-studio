"use client";

import { Bookmark, Check, ClipboardCopy, Clapperboard, Mic2, PenLine, RefreshCw, Sparkles, Trash2, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Canvas, ControlField, ErrorState, StudioControls } from "@/components/creative";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChipGroup } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { COPY_TOOLS, TONES } from "@/data";
import { generateCopy, generateHooks } from "@/lib/api";
import { useTemplatePreset } from "@/components/studio/useTemplatePreset";
import { selectCurrentBrand, useStore } from "@/lib/store";
import { CREDIT_COSTS, type CopyResult, type CopyTool, type Tone } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

type Mode = "copy" | "hooks" | "saved";
type Phase = { kind: "idle" } | { kind: "loading" } | { kind: "done" } | { kind: "error"; error: unknown };

const GOALS = ["Increase online sales", "Launch awareness", "Drive sign-ups", "Grow followers", "Promote a discount"];

export default function CopyPage() {
  const router = useRouter();
  const toast = useToast();
  const brand = useStore(selectCurrentBrand);
  const currentProjectId = useStore((s) => s.currentProjectId);
  const savedCopy = useStore((s) => s.savedCopy);
  const savedHooks = useStore((s) => s.savedHooks);
  const saveCopy = useStore((s) => s.saveCopy);
  const removeSavedCopy = useStore((s) => s.removeSavedCopy);
  const saveHook = useStore((s) => s.saveHook);
  const removeSavedHook = useStore((s) => s.removeSavedHook);

  const [mode, setMode] = useState<Mode>("copy");
  const [tool, setTool] = useState<CopyTool>("ad-copy");
  const [product, setProduct] = useState("Luma Glow Serum");
  const [audience, setAudience] = useState("Women and men 20–35");
  const { template, preset } = useTemplatePreset("copy");
  const [tone, setTone] = useState<Tone>(preset?.tone ?? "friendly");
  const [goal, setGoal] = useState(GOALS[0]);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [results, setResults] = useState<CopyResult[]>([]);
  const [hooks, setHooks] = useState<string[]>([]);
  const [variationsLoading, setVariationsLoading] = useState(false);

  const isHooks = mode === "hooks";
  const loading = phase.kind === "loading";
  const toolMeta = COPY_TOOLS.find((t) => t.id === tool)!;

  async function generate() {
    if (!product.trim()) { toast.error("Add a product first"); return; }
    setPhase({ kind: "loading" });
    try {
      if (isHooks) {
        setHooks(await generateHooks({ product, audience, tone, projectId: currentProjectId }));
        toast.success("10 hooks ready", `Written in your ${brand?.voice.tone ?? "brand"} voice`);
      } else {
        const r = await generateCopy({ tool, product, audience, tone, goal, projectId: currentProjectId });
        setResults([r]);
        toast.success(`${toolMeta.label} ready`, `${tone} tone · ${CREDIT_COSTS.copy} credits`);
      }
      setPhase({ kind: "done" });
    } catch (error) {
      setPhase({ kind: "error", error });
    }
  }
  async function moreVariations() {
    setVariationsLoading(true);
    try {
      const tones: Tone[] = [tone, ...TONES.map((t) => t.id).filter((t) => t !== tone).slice(0, 2)];
      const extra = await Promise.all(tones.slice(1).map((t) => generateCopy({ tool, product, audience, tone: t, goal, projectId: currentProjectId })));
      setResults((r) => [...r, ...extra]);
      toast.success("2 variations added", "Different tones for A/B testing");
    } catch (error) {
      toast.error("Something went wrong.", error instanceof Error ? error.message : undefined);
    } finally {
      setVariationsLoading(false);
    }
  }
  async function regenerateOne(r: CopyResult) {
    try {
      const next = await generateCopy({ tool: r.tool, product, audience, tone: r.tone, goal, projectId: currentProjectId });
      setResults((list) => list.map((x) => (x.id === r.id ? next : x)));
    } catch (error) {
      toast.error("Something went wrong.", error instanceof Error ? error.message : undefined);
    }
  }
  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); } catch { toast.error("Couldn't copy", "Clipboard is unavailable."); }
  }
  function openInScript(hook: string) {
    router.push(`/studio/ugc?script=${encodeURIComponent(`${hook} Create a 15-second TikTok-style video introducing ${product}.`)}`);
  }

  const savedCopyIds = new Set(savedCopy.map((c) => c.id));
  const savedHookTexts = new Set(savedHooks.map((h) => h.text));

  const controls = (
    <>
      {!isHooks && (
        <ControlField label="Tool">
          <div className="grid grid-cols-2 gap-1.5">
            {COPY_TOOLS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTool(t.id)} aria-pressed={tool === t.id} className={cn("text-left rounded-md border px-2.5 py-2 transition-colors", tool === t.id ? "border-accent/60 bg-accent/10 text-text" : "border-border bg-surface text-text2 hover:text-text hover:border-white/25")}>
                <p className="text-xs font-medium">{t.label}</p>
              </button>
            ))}
          </div>
        </ControlField>
      )}
      <Input label="Product" value={product} onChange={(e) => setProduct(e.target.value)} />
      <Input label="Audience" value={audience} onChange={(e) => setAudience(e.target.value)} />
      <ControlField label="Tone">
        <ChipGroup size="sm" options={TONES.map((t) => ({ value: t.id, label: t.label }))} value={tone} onChange={setTone} />
      </ControlField>
      {!isHooks && (
        <ControlField label="Goal">
          <ChipGroup size="sm" options={GOALS.map((g) => ({ value: g, label: g }))} value={goal} onChange={setGoal} />
        </ControlField>
      )}
      {brand && (
        <Link href="/brand/voice" className="block rounded-md border border-border bg-surface p-3 hover:border-white/25 transition-colors">
          <div className="flex items-center gap-2 mb-1"><Mic2 className="size-3.5 text-highlight" /><span className="text-xs font-medium">Brand voice · {brand.name}</span><Badge tone="accent" className="ml-auto">{brand.voice.tone}</Badge></div>
          <p className="text-[11px] text-muted line-clamp-2">{brand.voice.writingStyle || "No writing style set yet."}</p>
        </Link>
      )}
    </>
  );

  return (
    <>
      <PageHeader title="Copywriter" description="On-brand copy for ads, captions, emails and scripts. Hooks included." eyebrow={<div className="flex flex-wrap items-center gap-1.5"><Badge tone="accent">Studio · Copy</Badge>{template && <Badge tone="outline">Template · {template.title}</Badge>}</div>} />
      <Tabs
        layoutId="copy-mode"
        variant="pill"
        className="mb-4"
        items={[{ value: "copy", label: "Copywriter", icon: <PenLine /> }, { value: "hooks", label: "Hook Generator", icon: <Zap /> }, { value: "saved", label: "Saved", icon: <Bookmark />, count: savedCopy.length + savedHooks.length }]}
        value={mode}
        onChange={(m) => { setMode(m); if (m !== "saved") setPhase({ kind: "idle" }); }}
      />

      {mode !== "saved" && (
        <StudioControls
          title={isHooks ? "Hook settings" : "Copy settings"}
          controls={controls}
          generateLabel={isHooks ? "Generate 10 hooks" : phase.kind === "done" ? "Regenerate" : `Generate ${toolMeta.label}`}
          generateIcon={Sparkles}
          onGenerate={generate}
          loading={loading}
          cost={CREDIT_COSTS.copy}
        />
      )}

      {mode === "saved" ? (
        <SavedView copy={savedCopy} hooks={savedHooks} onCopy={copyText} onRemoveCopy={removeSavedCopy} onRemoveHook={removeSavedHook} onUseInScript={openInScript} />
      ) : (
        <Canvas className="lg:min-h-[calc(100dvh-16rem)]">
          {phase.kind === "error" ? (
            <ErrorState error={phase.error} onRetry={generate} />
          ) : phase.kind === "idle" ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
              <span className="size-14 rounded-full bg-accent/15 text-highlight flex items-center justify-center">{isHooks ? <Zap className="size-6" /> : <PenLine className="size-6" />}</span>
              <div>
                <h3 className="text-lg font-semibold">{isHooks ? "Scroll-stopping openers for your next video" : toolMeta.label}</h3>
                <p className="text-sm text-text2 mt-1 max-w-sm">{isHooks ? `Ten hooks for ${product}, tuned to ${audience}.` : `${toolMeta.description} Written in ${brand?.name ?? "your brand"}'s ${brand?.voice.tone.toLowerCase() ?? ""} voice.`}</p>
              </div>
              <Button leftIcon={<Sparkles className="size-4" />} onClick={generate}>{isHooks ? "Generate 10 hooks" : `Generate ${toolMeta.label}`} · {CREDIT_COSTS.copy} cr</Button>
            </div>
          ) : (
            <div className="flex-1 p-4 md:p-6 pb-28 lg:pb-6">
              {loading ? (
                <div className="space-y-3 max-w-2xl">
                  {Array.from({ length: isHooks ? 6 : 1 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-full" /><Skeleton className={cn("h-3", isHooks ? "w-1/2" : "w-5/6")} />{!isHooks && <Skeleton className="h-3 w-2/3" />}</div>
                  ))}
                </div>
              ) : isHooks ? (
                <div className="max-w-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-text2">{hooks.length} hooks for <span className="text-text">{product}</span></p>
                    <Button size="sm" variant="secondary" leftIcon={<RefreshCw className="size-4" />} onClick={generate}>Regenerate</Button>
                  </div>
                  <ol className="space-y-2">
                    {hooks.map((h, i) => {
                      const isSaved = savedHookTexts.has(h);
                      return (
                        <li key={`${i}-${h}`} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                          <span className="text-xs text-muted font-mono w-5 pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                          <p className="flex-1 text-sm leading-snug">{h}</p>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <IconButton label="Copy" size="sm" onClick={() => copyText(h)}><ClipboardCopy /></IconButton>
                            <IconButton label={isSaved ? "Saved" : "Save"} size="sm" active={isSaved} onClick={() => { saveHook(h, product); toast.success("Hook saved"); }}>{isSaved ? <Check className="text-success" /> : <Bookmark />}</IconButton>
                            <IconButton label="Use in Script" size="sm" onClick={() => openInScript(h)}><Clapperboard /></IconButton>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ) : (
                <div className="max-w-2xl space-y-4">
                  {results.map((r, i) => (
                    <CopyCard key={r.id} result={r} index={i} saved={savedCopyIds.has(r.id)} onCopy={() => copyText(r.text)} onSave={() => { saveCopy(r); toast.success("Copy saved"); }} onRegenerate={() => regenerateOne(r)} />
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" loading={variationsLoading} leftIcon={<Sparkles className="size-4" />} onClick={moreVariations}>More variations · {CREDIT_COSTS.copy * 2} cr</Button>
                    <Button variant="ghost" leftIcon={<RefreshCw className="size-4" />} onClick={generate}>Regenerate</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Canvas>
      )}
    </>
  );
}

function CopyCard({ result, index, saved, onCopy, onSave, onRegenerate }: { result: CopyResult; index: number; saved: boolean; onCopy: () => void; onSave: () => void; onRegenerate: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <span className="text-xs font-medium">{index === 0 ? "Result" : `Variation ${index + 1}`}</span>
        <Badge tone="outline">{TONES.find((t) => t.id === result.tone)?.label ?? result.tone}</Badge>
        <span className="flex-1" />
        <IconButton label="Copy to clipboard" size="sm" onClick={onCopy}><ClipboardCopy /></IconButton>
        <IconButton label={saved ? "Saved" : "Save"} size="sm" active={saved} onClick={onSave}>{saved ? <Check className="text-success" /> : <Bookmark />}</IconButton>
        <IconButton label="Regenerate" size="sm" disabled={busy} onClick={async () => { setBusy(true); await onRegenerate(); setBusy(false); }}><RefreshCw className={cn(busy && "animate-spin")} /></IconButton>
      </div>
      <pre className="px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap font-sans text-text">{result.text}</pre>
    </Card>
  );
}

function SavedView({ copy, hooks, onCopy, onRemoveCopy, onRemoveHook, onUseInScript }: { copy: CopyResult[]; hooks: { id: string; text: string; product: string; createdAt: string }[]; onCopy: (t: string) => void; onRemoveCopy: (id: string) => void; onRemoveHook: (id: string) => void; onUseInScript: (h: string) => void }) {
  if (!copy.length && !hooks.length) {
    return <EmptyState icon={Bookmark} title="Nothing saved yet" description="Save copy or hooks from the generator and they'll show up here, across devices." cta={{ label: "Write something", onClick: () => window.scrollTo({ top: 0 }) }} />;
  }
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <section>
        <h2 className="text-[15px] font-semibold mb-3">Saved copy <span className="text-muted font-normal">{copy.length}</span></h2>
        {copy.length ? (
          <div className="space-y-3">
            {copy.map((c) => (
              <Card key={c.id} padded={false}>
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
                  <span className="text-xs font-medium truncate">{c.title}</span><Badge tone="outline">{c.tone}</Badge><span className="text-[11px] text-muted ml-auto shrink-0">{timeAgo(c.createdAt)}</span>
                  <IconButton label="Copy" size="sm" onClick={() => onCopy(c.text)}><ClipboardCopy /></IconButton>
                  <IconButton label="Remove" size="sm" onClick={() => onRemoveCopy(c.id)}><Trash2 /></IconButton>
                </div>
                <pre className="px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap font-sans text-text2 line-clamp-6">{c.text}</pre>
              </Card>
            ))}
          </div>
        ) : <p className="text-sm text-muted">No saved copy.</p>}
      </section>
      <section>
        <h2 className="text-[15px] font-semibold mb-3">Saved hooks <span className="text-muted font-normal">{hooks.length}</span></h2>
        {hooks.length ? (
          <ul className="space-y-2">
            {hooks.map((h) => (
              <li key={h.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                <div className="flex-1 min-w-0"><p className="text-sm leading-snug">{h.text}</p><p className="text-[11px] text-muted mt-1">{h.product} · {timeAgo(h.createdAt)}</p></div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <IconButton label="Copy" size="sm" onClick={() => onCopy(h.text)}><ClipboardCopy /></IconButton>
                  <IconButton label="Use in Script" size="sm" onClick={() => onUseInScript(h.text)}><Clapperboard /></IconButton>
                  <IconButton label="Remove" size="sm" onClick={() => onRemoveHook(h.id)}><Trash2 /></IconButton>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No saved hooks.</p>}
      </section>
    </div>
  );
}
