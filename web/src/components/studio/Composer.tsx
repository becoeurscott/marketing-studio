"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Clock, ImageIcon, Plus, Scan, SendHorizontal, SlidersHorizontal, Sparkles, UserRound, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { creators } from "@/data";
import { useStore } from "@/lib/store";
import { CREDIT_COSTS, RATIOS, type AspectRatio, type Asset, type Creator } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DURATIONS, MODELS, type DurationSec, type ModelId } from "./constants";
import { CreatorPicker } from "./CreatorPicker";
import type { ComposeMode } from "./ModeTabs";
import { ProductPicker, useProductUpload } from "./ProductPicker";

export interface ComposerProps {
  mode: ComposeMode;
  /** Free text that follows the template sentence. */
  prompt: string;
  onPrompt: (v: string) => void;
  productId: string | null;
  onProduct: (a: Asset | null) => void;
  creatorId?: string | null;
  onCreator?: (c: Creator | null) => void;
  model: ModelId;
  onModel: (m: ModelId) => void;
  ratio: AspectRatio;
  onRatio: (r: AspectRatio) => void;
  duration?: DurationSec;
  onDuration?: (d: DurationSec) => void;
  onGenerate: () => void;
  generating?: boolean;
  /** Opens advanced options (Inspector on desktop, BottomSheet on mobile). */
  onMore: () => void;
  moreActive?: boolean;
  templateName?: string | null;
  className?: string;
}

type Segment = { kind: "text"; text: string } | { kind: "slot"; slot: "product" | "creator" };

/** Mode-specific sentence templates. Chips render in place of slots; free text follows. */
const TEMPLATES: Record<ComposeMode, { segments: Segment[]; placeholder: string }> = {
  image: { segments: [{ kind: "text", text: "Créer une image de" }, { kind: "slot", slot: "product" }], placeholder: "dans un studio ensoleillé, ombres douces…" },
  video: { segments: [{ kind: "text", text: "Créer une vidéo où" }, { kind: "slot", slot: "product" }], placeholder: "tourne lentement sur un pagne wax, lumière du matin…" },
  ugc: { segments: [{ kind: "text", text: "Créer une vidéo UGC où" }, { kind: "slot", slot: "creator" }, { kind: "text", text: "profite du produit" }, { kind: "slot", slot: "product" }], placeholder: "pendant sa routine du matin…" },
};

const COST: Record<ComposeMode, number> = { image: CREDIT_COSTS.image, video: CREDIT_COSTS.video, ugc: CREDIT_COSTS.ugc };

/**
 * Floating composer card (SPEC §46 redesign): media slots → inline chip prompt → pill row.
 * Near-black translucent card that subtly expands while the prompt is focused.
 */
export function Composer(p: ComposerProps) {
  const assets = useStore((s) => s.assets);
  const product = assets.find((a) => a.id === p.productId) ?? null;
  const creator = creators.find((c) => c.id === p.creatorId) ?? null;
  const wantsCreator = p.mode === "ugc";

  const [productPicker, setProductPicker] = useState(false);
  const [creatorPicker, setCreatorPicker] = useState(false);
  const [focused, setFocused] = useState(false);
  const { uploading, progress, upload } = useProductUpload((a) => p.onProduct(a));
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); void upload(e.dataTransfer.files?.[0] ?? null); };

  const canGenerate = !p.generating && (!!p.prompt.trim() || !!product) && (!wantsCreator || !!creator);
  const tpl = TEMPLATES[p.mode];

  /** The dashed slot opens whichever picker is still empty. */
  const addMedia = () => {
    if (wantsCreator && !creator && product) setCreatorPicker(true);
    else setProductPicker(true);
  };

  return (
    <>
      <motion.div
        layout
        animate={{ scale: focused ? 1.01 : 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className={cn(
          "rounded-[24px] bg-[#0b0b0b]/92 backdrop-blur-xl border border-white/10 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] text-white transition-[padding,box-shadow] duration-200",
          focused ? "p-3.5 shadow-[0_28px_70px_-10px_rgba(0,0,0,0.85),0_0_0_1px_rgba(249,115,22,0.35)]" : "p-3",
          p.className,
        )}
      >
        {/* 1. media slots */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {product && <MediaSlot label={product.name} src={product.thumbnail} icon={null} onClick={() => setProductPicker(true)} onClear={() => p.onProduct(null)} />}
          {wantsCreator && (
            <MediaSlot label={creator ? creator.name : "Ajouter un créateur"} src={creator?.avatarUrl} icon={<UserRound className="size-6 text-white/45" />} onClick={() => setCreatorPicker(true)} onClear={creator ? () => p.onCreator?.(null) : undefined} />
          )}
          <button onClick={addMedia} onDragOver={(e) => e.preventDefault()} onDrop={onDrop} disabled={uploading} className="relative size-[84px] shrink-0 rounded-[18px] border border-dashed border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/30 flex items-center justify-center transition-colors" aria-label="Ajouter un média">
            {uploading ? <span className="text-[11px] text-white/70 tabular-nums">{progress ?? 0}%</span> : <ImageIcon className="size-6 text-white/45" />}
          </button>
          {p.templateName && (
            <span className="ml-auto self-start shrink-0 inline-flex items-center gap-1 rounded-full bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-medium text-highlight"><Sparkles className="size-3" /> {p.templateName}</span>
          )}
        </div>

        {/* 2. inline chip prompt */}
        <div
          className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px] leading-7 text-white/90 cursor-text px-0.5"
          onClick={(e) => { if (e.target === e.currentTarget) (e.currentTarget.querySelector("textarea") as HTMLTextAreaElement | null)?.focus(); }}
        >
          {tpl.segments.map((seg, i) =>
            seg.kind === "text" ? (
              <span key={i}>{seg.text}</span>
            ) : seg.slot === "product" ? (
              <InlineChip key={i} name={product?.name} src={product?.thumbnail} empty="product" onClick={() => setProductPicker(true)} />
            ) : (
              <InlineChip key={i} name={creator?.name} src={creator?.avatarUrl} empty="creator" onClick={() => setCreatorPicker(true)} />
            ),
          )}
          <GrowingInput
            value={p.prompt}
            onChange={p.onPrompt}
            placeholder={tpl.placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmit={() => { if (canGenerate) p.onGenerate(); }}
          />
        </div>

        {/* 3. pill row */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <ModelPill value={p.model} onChange={p.onModel} mode={p.mode} />
          {p.duration && p.onDuration && (
            <Pill onClick={() => p.onDuration?.(DURATIONS[(DURATIONS.indexOf(p.duration!) + 1) % DURATIONS.length])} label="Durée"><Clock className="size-4" />{p.duration}s</Pill>
          )}
          <Pill onClick={() => p.onRatio(RATIOS[(RATIOS.indexOf(p.ratio) + 1) % RATIOS.length])} label="Format d'image"><Scan className="size-4" />{p.ratio}</Pill>
          <Pill onClick={p.onMore} label="Plus d'options" active={p.moreActive} className="px-2.5"><SlidersHorizontal className="size-4" /></Pill>
          </div>
          <button
            onClick={p.onGenerate}
            disabled={!canGenerate}
            className={cn("shrink-0 h-10 md:h-11 px-3.5 md:px-4 rounded-full bg-accent text-on-accent font-bold text-[15px] inline-flex items-center gap-2 shadow-[0_8px_24px_-6px_rgba(249,115,22,0.7)] transition-[transform,opacity,background] hover:bg-highlight active:scale-95 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed", p.generating && "animate-pulse")}
            aria-label={`Générer · ${COST[p.mode]} crédits`}
          >
            <SendHorizontal className="size-[18px]" />
            <span className="tabular-nums">{COST[p.mode]}</span>
          </button>
        </div>
      </motion.div>

      <ProductPicker open={productPicker} onClose={() => setProductPicker(false)} onPick={(a) => p.onProduct(a)} selectedId={p.productId} />
      <CreatorPicker open={creatorPicker} onClose={() => setCreatorPicker(false)} onPick={(c) => p.onCreator?.(c)} selectedId={p.creatorId} />
    </>
  );
}

/* ---------- pieces ---------- */

function MediaSlot({ label, src, icon, onClick, onClear }: { label: string; src?: string; icon: ReactNode; onClick: () => void; onClear?: () => void }) {
  return (
    <div className="relative shrink-0">
      <button onClick={onClick} className={cn("size-[84px] rounded-[18px] overflow-hidden border flex items-center justify-center transition-colors", src ? "border-white/10 bg-white/5" : "border-dashed border-white/15 bg-white/[0.04] hover:bg-white/[0.08]")} aria-label={label} title={label}>
        {src ? <img src={src} alt="" className="size-full object-cover" /> : icon}
      </button>
      {onClear && (
        <button onClick={onClear} className="absolute -top-1.5 -right-1.5 size-6 rounded-full bg-black border border-white/20 text-white/80 hover:text-white flex items-center justify-center shadow-card" aria-label={`Retirer ${label}`}>
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

const SLOT_LABELS: Record<"product" | "creator", { noun: string; change: string; choose: string }> = {
  product: { noun: "produit", change: "Changer le produit", choose: "Choisir un produit" },
  creator: { noun: "créateur", change: "Changer le créateur", choose: "Choisir un créateur" },
};

function InlineChip({ name, src, empty, onClick }: { name?: string; src?: string; empty: "product" | "creator"; onClick: () => void }) {
  const l = SLOT_LABELS[empty];
  return (
    <button
      onClick={onClick}
      className={cn("inline-flex items-center gap-1.5 h-7 rounded-full pl-1 pr-2.5 align-middle text-[13px] font-medium transition-colors", name ? "bg-white/10 border border-white/10 text-white hover:bg-white/15" : "border border-dashed border-white/25 text-white/60 hover:text-white hover:border-white/40")}
      aria-label={name ? `${l.change} : ${name}` : l.choose}
    >
      {src ? <img src={src} alt="" className="size-5 rounded-full object-cover" /> : <span className="size-5 rounded-full bg-white/10 flex items-center justify-center"><Plus className="size-3" /></span>}
      <span className="max-w-[7.5rem] truncate">{name ?? l.noun}</span>
    </button>
  );
}

/** Auto-growing textarea that behaves like the tail of the sentence (Enter submits, Shift+Enter newline). */
function GrowingInput({ value, onChange, placeholder, onFocus, onBlur, onSubmit }: { value: string; onChange: (v: string) => void; placeholder: string; onFocus: () => void; onBlur: () => void; onSubmit: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(28, el.scrollHeight)}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      name="prompt"
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
      placeholder={placeholder}
      className="flex-1 min-w-[8rem] basis-32 resize-none bg-transparent outline-none placeholder:text-white/35 text-white leading-7 py-0"
      aria-label="Prompt"
    />
  );
}

function Pill({ children, onClick, label, active, className }: { children: ReactNode; onClick: () => void; label: string; active?: boolean; className?: string }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className={cn("h-10 md:h-11 px-3 md:px-3.5 rounded-full bg-white/[0.07] border border-white/10 text-white text-[13px] md:text-[15px] font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 hover:bg-white/[0.12] transition-colors", active && "bg-accent/20 border-accent/40 text-highlight", className)}>
      {children}
    </button>
  );
}

function ModelPill({ value, onChange, mode }: { value: ModelId; onChange: (m: ModelId) => void; mode: ComposeMode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; bottom: number }>({ left: 0, bottom: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const toggle = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - 248)), bottom: window.innerHeight - r.top + 8 });
    setOpen((v) => !v);
  };
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const cur = MODELS.find((m) => m.id === value) ?? MODELS[0];
  return (
    <div ref={ref} className="relative shrink-0">
      <Pill onClick={toggle} label={`Modèle : ${cur.label}`} className="pl-1.5">
        <span className="size-7 md:size-8 rounded-full bg-accent flex items-center justify-center"><Sparkles className="size-4 text-on-accent" /></span>
        {cur.label}
        <ChevronDown className={cn("size-3.5 text-white/50 transition-transform", open && "rotate-180")} />
      </Pill>
      {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }} transition={{ duration: 0.15 }}
            style={{ position: "fixed", left: pos.left, bottom: pos.bottom }}
            className="w-60 rounded-xl bg-[#111]/95 backdrop-blur-xl border border-white/10 shadow-float p-1 z-[120]"
          >
            {MODELS.map((m) => {
              const sel = m.id === value;
              const recommended = mode === "image" ? m.id === "studio-v3" : m.id === "drift-2";
              return (
                <li key={m.id}>
                  <button role="option" aria-selected={sel} onClick={() => { onChange(m.id); setOpen(false); }} className={cn("w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-white/8", sel && "bg-white/8")}>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-medium text-white truncate">{m.label}{recommended && <span className="ml-1.5 text-[10px] text-highlight font-semibold">RECOMMANDÉ</span>}</span>
                      <span className="block text-[11px] text-white/50 truncate">{m.hint}</span>
                    </span>
                    {sel && <Check className="size-4 text-highlight shrink-0" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </div>
  );
}
