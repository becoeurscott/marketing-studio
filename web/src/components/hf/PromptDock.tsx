"use client";

import { Check, ChevronDown, Clock, Copy, ImagePlus, Loader2, Proportions, Sparkles, UserRound, Wand2, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { creators } from "@/data";
import { useStore } from "@/lib/store";
import { RATIOS, type AspectRatio, type Asset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CreatorPicker } from "@/components/studio/CreatorPicker";
import { ProductPicker } from "@/components/studio/ProductPicker";
import type { RunKind } from "./useStudioRuns";
import { INFLUENCER_SHOTS } from "@/lib/influencer";

export interface DockModel { id: string; label: string; hint: string; price: string; badge?: string }

/** Popover anchored above its trigger pill, rendered in a portal so the scrolling pill row never clips it. */
function Pill({ icon, label, children, wide }: { icon?: ReactNode; label: ReactNode; children: (close: () => void) => ReactNode; wide?: boolean }) {
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const open = pos !== null;
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { const t = e.target as Node; if (!menu.current?.contains(t) && !btn.current?.contains(t)) setPos(null); };
    const close = () => setPos(null);
    document.addEventListener("mousedown", off);
    window.addEventListener("resize", close);
    return () => { document.removeEventListener("mousedown", off); window.removeEventListener("resize", close); };
  }, [open]);
  const toggle = () => {
    if (open) return setPos(null);
    const r = btn.current!.getBoundingClientRect();
    const width = wide ? Math.min(352, window.innerWidth - 32) : 176;
    setPos({ left: Math.max(16, Math.min(r.left, window.innerWidth - width - 16)), bottom: window.innerHeight - r.top + 8 });
  };
  return (
    <>
      <button ref={btn} type="button" onClick={toggle} className={cn("shrink-0 h-9 px-3 rounded-full flex items-center gap-1.5 text-[13px] font-medium transition-colors whitespace-nowrap", open ? "bg-white/15 text-white" : "bg-white/[0.06] text-white/85 hover:bg-white/10")}>
        {icon}{label}<ChevronDown className="size-3.5 opacity-60" />
      </button>
      {open && createPortal(
        <div ref={menu} style={{ left: pos.left, bottom: pos.bottom }} className={cn("fixed z-[90] rounded-2xl border border-white/10 bg-[#121214] p-1.5 shadow-2xl", wide ? "w-[min(22rem,calc(100vw-2rem))]" : "w-44")}>
          {children(() => setPos(null))}
        </div>,
        document.body,
      )}
    </>
  );
}

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] transition-colors", active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/[0.06]")}>
      <span className="flex-1 min-w-0">{children}</span>
      {active && <Check className="size-4 text-accent shrink-0" />}
    </button>
  );
}

export interface PromptDockProps {
  kind: RunKind;
  onKind: (k: RunKind) => void;
  prompt: string;
  onPrompt: (v: string) => void;
  models: DockModel[];
  model: string;
  onModel: (id: string) => void;
  ratio: AspectRatio;
  onRatio: (r: AspectRatio) => void;
  count: number;
  onCount: (n: number) => void;
  duration: 5 | 10 | 15;
  onDuration: (d: 5 | 10 | 15) => void;
  productId: string | null;
  onProduct: (a: Asset | null) => void;
  creatorId: string | null;
  onCreator: (id: string | null) => void;
  shotMode: "multi" | "variations";
  onShotMode: (m: "multi" | "variations") => void;
  shot: string;
  onShot: (id: string) => void;
  cost: number;
  onGenerate: () => void;
  busy?: boolean;
}

/** Higgsfield-style prompt dock: references on the left, prompt, then a row of setting pills and the lime Generate button. */
export function PromptDock(p: PromptDockProps) {
  const assets = useStore((s) => s.assets);
  const credits = useStore((s) => s.credits);
  const product = assets.find((a) => a.id === p.productId) ?? null;
  const creator = creators.find((c) => c.id === p.creatorId) ?? null;
  const [productPicker, setProductPicker] = useState(false);
  const [creatorPicker, setCreatorPicker] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const current = p.models.find((m) => m.id === p.model) ?? p.models[0];
  const canGenerate = !p.busy && (!!p.prompt.trim() || !!product || (p.kind === "image" && !!creator)) && (p.kind !== "ugc" || !!creator);

  const enhance = async () => {
    if (!p.prompt.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const res = await fetch("/api/ai/enhance-prompt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: p.prompt, mode: p.kind }) });
      const data = (await res.json().catch(() => ({}))) as { prompt?: string };
      if (res.ok && data.prompt) p.onPrompt(data.prompt);
    } finally { setEnhancing(false); }
  };

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0d0d0f]/90 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] p-3 md:p-4">
      <div className="flex gap-3">
        {/* Reference tiles */}
        <div className="flex gap-2 shrink-0">
          {p.kind !== "video" && (
            <div className="relative">
            <button type="button" onClick={() => setCreatorPicker(true)} className="relative size-14 md:size-16 rounded-2xl overflow-hidden border border-dashed border-white/15 bg-white/[0.04] flex items-center justify-center text-white/50 hover:text-white hover:border-white/30" aria-label="Choisir un créateur">
              {creator ? <img src={creator.avatarUrl} alt={creator.name} className="size-full object-cover" /> : <UserRound className="size-5" />}
            </button>
            {creator && p.kind === "image" && (
              <button type="button" onClick={() => p.onCreator(null)} className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-white text-black flex items-center justify-center" aria-label="Retirer le créateur"><X className="size-3" /></button>
            )}
            </div>
          )}
          <div className="relative">
            <button type="button" onClick={() => setProductPicker(true)} className="size-14 md:size-16 rounded-2xl overflow-hidden border border-dashed border-white/15 bg-white/[0.04] flex items-center justify-center text-white/50 hover:text-white hover:border-white/30" aria-label="Ajouter une image de référence">
              {product ? <img src={product.thumbnail} alt={product.name} className="size-full object-cover" /> : <ImagePlus className="size-5" />}
            </button>
            {product && (
              <button type="button" onClick={() => p.onProduct(null)} className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-white text-black flex items-center justify-center" aria-label="Retirer l'image"><X className="size-3" /></button>
            )}
          </div>
        </div>
        <textarea
          name="prompt"
          value={p.prompt}
          onChange={(e) => p.onPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canGenerate) p.onGenerate(); }}
          rows={2}
          placeholder={p.kind === "image" && creator ? `Une idée courte : ex. ${creator.name} au marché avec mon produit…` : p.kind === "image" ? "Décrivez la scène que vous imaginez…" : p.kind === "ugc" ? "Ce que le créateur dit et fait avec votre produit…" : "Décrivez le mouvement et la scène…"}
          className="flex-1 min-w-0 resize-none bg-transparent text-[15px] leading-relaxed text-white placeholder:text-white/35 outline-none py-1 max-h-40"
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Pill label={p.kind === "image" ? "Image" : p.kind === "video" ? "Vidéo" : "UGC"}>
            {(close) => (["image", "video", "ugc"] as RunKind[]).map((k) => (
              <Option key={k} active={p.kind === k} onClick={() => { p.onKind(k); close(); }}>{k === "image" ? "Image" : k === "video" ? "Vidéo" : "Vidéo UGC avec créateur"}</Option>
            ))}
          </Pill>
          {p.kind !== "ugc" && current && (
            <Pill wide icon={<Sparkles className="size-3.5 text-accent" />} label={current.label}>
              {(close) => (
                <div className="max-h-80 overflow-y-auto">
                  <p className="px-2.5 pt-1.5 pb-2 text-[11px] uppercase tracking-wider text-white/40">Modèle</p>
                  {p.models.map((m) => (
                    <Option key={m.id} active={m.id === p.model} onClick={() => { p.onModel(m.id); close(); }}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-white">{m.label}</span>
                        {m.badge && <span className="rounded-md bg-accent/15 text-accent px-1.5 py-px text-[10px] font-semibold uppercase">{m.badge}</span>}
                        <span className="ml-auto text-[11px] text-white/45">{m.price}</span>
                      </span>
                      <span className="block text-[12px] text-white/50 mt-0.5 truncate">{m.hint}</span>
                    </Option>
                  ))}
                </div>
              )}
            </Pill>
          )}
          {p.kind !== "ugc" && (
            <Pill icon={<Proportions className="size-3.5" />} label={p.ratio}>
              {(close) => RATIOS.map((r) => <Option key={r} active={r === p.ratio} onClick={() => { p.onRatio(r); close(); }}>{r}</Option>)}
            </Pill>
          )}
          {p.kind === "image" && creator && (
            <Pill wide icon={<UserRound className="size-3.5 text-accent" />} label={p.shotMode === "multi" ? "Multi-plans" : INFLUENCER_SHOTS.find((s) => s.id === p.shot)?.label ?? "Plan"}>
              {(close) => (
                <div className="max-h-80 overflow-y-auto">
                  <Option active={p.shotMode === "multi"} onClick={() => { p.onShotMode("multi"); if (p.count < 2) p.onCount(4); close(); }}>
                    <span className="font-medium text-white">Multi-plans</span>
                    <span className="block text-[12px] text-white/50">Chaque image sous un angle différent (selfie, gros plan, en ville…)</span>
                  </Option>
                  <p className="px-2.5 pt-2 pb-1 text-[11px] uppercase tracking-wider text-white/40">Un seul plan (variations)</p>
                  {INFLUENCER_SHOTS.map((s) => (
                    <Option key={s.id} active={p.shotMode === "variations" && p.shot === s.id} onClick={() => { p.onShotMode("variations"); p.onShot(s.id); close(); }}>{s.label}</Option>
                  ))}
                </div>
              )}
            </Pill>
          )}
          {p.kind === "image" ? (
            <Pill icon={<Copy className="size-3.5" />} label={`${p.count}/4`}>
              {(close) => [1, 2, 3, 4].map((n) => <Option key={n} active={n === p.count} onClick={() => { p.onCount(n); close(); }}>{n} image{n > 1 ? "s" : ""}</Option>)}
            </Pill>
          ) : (
            <Pill icon={<Clock className="size-3.5" />} label={`${p.duration}s`}>
              {(close) => ([5, 10, 15] as const).map((d) => <Option key={d} active={d === p.duration} onClick={() => { p.onDuration(d); close(); }}>{d} secondes</Option>)}
            </Pill>
          )}
          <button type="button" onClick={enhance} disabled={!p.prompt.trim() || enhancing} className="h-9 px-3 rounded-full flex items-center gap-1.5 text-[13px] font-medium bg-white/[0.06] text-white/85 hover:bg-white/10 disabled:opacity-40 whitespace-nowrap" title="Améliorer le prompt">
            {enhancing ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}<span className="hidden sm:inline">Améliorer</span>
          </button>
        </div>
        <button
          type="button"
          onClick={p.onGenerate}
          disabled={!canGenerate}
          title={p.cost > credits ? `Il vous faut ${p.cost} crédits, vous en avez ${credits}.` : undefined}
          className="shrink-0 h-11 md:h-12 pl-5 pr-4 rounded-2xl bg-accent text-on-accent font-semibold text-[15px] flex items-center gap-2 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-40 disabled:active:scale-100"
        >
          Générer
          <span className="flex items-center gap-0.5 rounded-lg bg-black/10 px-1.5 py-0.5 text-[13px]"><Sparkles className="size-3.5" />{p.cost}</span>
        </button>
      </div>

      <ProductPicker open={productPicker} onClose={() => setProductPicker(false)} onPick={(a) => p.onProduct(a)} selectedId={p.productId} />
      <CreatorPicker open={creatorPicker} onClose={() => setCreatorPicker(false)} onPick={(c) => p.onCreator(c.id)} selectedId={p.creatorId} />
    </div>
  );
}
