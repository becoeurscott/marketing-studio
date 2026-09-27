"use client";

import { Crop, Expand, Eraser, ImageIcon, Lightbulb, Scaling, Sparkles, Stamp, Type, Wand2, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { delay, type ImageResult } from "@/lib/api";
import { RATIOS, type AspectRatio } from "@/lib/types";
import { cn, img, uid } from "@/lib/utils";
import { EDITOR_TOOL_LABELS, EDITOR_TOOLS, RATIO_CLASS, type EditorTool } from "./constants";

const toolIcons: Record<EditorTool, LucideIcon> = {
  Crop, Resize: Scaling, "Remove Background": Eraser, "Replace Background": ImageIcon, Relight: Lightbulb, Retouch: Wand2, "Add Text": Type, "Add Logo": Stamp, "Expand Image": Expand,
};
const toolHints: Record<EditorTool, string> = {
  Crop: "Faites glisser les poignées sur le canevas pour recadrer.", Resize: "Choisissez un nouveau format ; le contenu est recomposé.", "Remove Background": "Isole le produit sur un calque transparent.",
  "Replace Background": "Décrivez le nouvel arrière-plan dans le prompt.", Relight: "Décrivez la direction et l'ambiance de la lumière.", Retouch: "Décrivez ce qu'il faut corriger ou supprimer.",
  "Add Text": "Saisissez le titre ; il est positionné automatiquement.", "Add Logo": "Utilise le logo principal de votre kit de marque.", "Expand Image": "Étend l'image au-delà du cadre actuel.",
};

export interface ImageEditorProps {
  open: boolean;
  onClose: () => void;
  result: ImageResult | null;
  onApply: (next: ImageResult) => void;
}

/** SPEC §13: tool list + inspector (prompt, strength, ratio) + mock Apply Changes. */
export function ImageEditor({ open, onClose, result, onApply }: ImageEditorProps) {
  return (
    <Modal open={open} onClose={onClose} size="xl" className="md:max-h-[90vh]">
      {result && <EditorBody key={result.id} result={result} onApply={onApply} onClose={onClose} />}
    </Modal>
  );
}

function EditorBody({ result, onApply, onClose }: { result: ImageResult; onApply: (r: ImageResult) => void; onClose: () => void }) {
  const toast = useToast();
  const [tool, setTool] = useState<EditorTool>("Retouch");
  const [prompt, setPrompt] = useState("");
  const [strength, setStrength] = useState(60);
  const [ratio, setRatio] = useState<AspectRatio>(result.ratio);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState<ImageResult>(result);
  const [edits, setEdits] = useState<string[]>([]);
  const Icon = toolIcons[tool];

  const apply = async () => {
    setApplying(true);
    try {
      await delay(900, 1500);
      const seed = uid("edit");
      const w = ratio === "16:9" ? 960 : ratio === "9:16" ? 540 : 800;
      const h = ratio === "16:9" ? 540 : ratio === "9:16" ? 960 : ratio === "1:1" ? 800 : ratio === "3:2" ? 533 : 1000;
      const next: ImageResult = { ...preview, id: preview.id, ratio, url: img(seed, w * 2, h * 2), thumbnail: img(seed, w, h), seed };
      setPreview(next);
      setEdits((e) => [...e, `${EDITOR_TOOL_LABELS[tool]}${prompt ? ` — ${prompt.slice(0, 30)}` : ""}`]);
      toast.success("Modifications appliquées", `${EDITOR_TOOL_LABELS[tool]} · intensité ${strength} %`);
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 -mx-1">
      {/* Tool list */}
      <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar lg:w-44 shrink-0" aria-label="Outils d'édition">
        {EDITOR_TOOLS.map((t) => {
          const I = toolIcons[t];
          const sel = t === tool;
          return (
            <button key={t} onClick={() => setTool(t)} className={cn("flex items-center gap-2 h-9 px-3 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors", sel ? "bg-accent/15 text-highlight" : "text-text2 hover:text-text hover:bg-white/5")} aria-pressed={sel}>
              <I className="size-4" /> {EDITOR_TOOL_LABELS[t]}
            </button>
          );
        })}
      </nav>

      {/* Canvas */}
      <div className="flex-1 min-w-0">
        <div className="rounded-lg bg-surface border border-border p-3 flex items-center justify-center min-h-[280px] lg:min-h-[440px]">
          <div className={cn("relative max-h-[52vh] w-auto overflow-hidden rounded-md shadow-card", RATIO_CLASS[ratio], ratio === "16:9" || ratio === "3:2" ? "w-full" : "h-[52vh]")}>
            <img src={preview.url} alt="Image en cours d'édition" className={cn("size-full object-cover transition-opacity", applying && "opacity-40")} />
            {tool === "Crop" && !applying && (
              <div className="absolute inset-[10%] border-2 border-highlight/80 pointer-events-none">
                {["-top-1 -left-1", "-top-1 -right-1", "-bottom-1 -left-1", "-bottom-1 -right-1"].map((c) => <span key={c} className={cn("absolute size-2.5 bg-highlight rounded-xs", c)} />)}
              </div>
            )}
            {applying && <div className="absolute inset-0 flex items-center justify-center text-sm font-medium"><Sparkles className="size-4 mr-2 animate-pulse text-highlight" />{EDITOR_TOOL_LABELS[tool]} en cours…</div>}
          </div>
        </div>
        {edits.length > 0 && <p className="text-xs text-muted mt-2 truncate">Modifications : {edits.join(" · ")}</p>}
      </div>

      {/* Inspector */}
      <aside className="lg:w-64 shrink-0 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-highlight" /> {EDITOR_TOOL_LABELS[tool]}</div>
        <p className="text-xs text-text2 -mt-2">{toolHints[tool]}</p>
        <Textarea label="Prompt" name="edit-prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={tool === "Add Text" ? "Sublimez-vous. -20 %." : "Décrivez la modification…"} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="strength" className="flex justify-between text-[13px] font-medium text-text2"><span>Intensité</span><span className="text-muted">{strength} %</span></label>
          <input id="strength" type="range" min={0} max={100} value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="w-full accent-[#F97316]" />
        </div>
        <Select label="Format d'image" name="edit-ratio" value={ratio} onChange={(e) => setRatio(e.target.value as AspectRatio)} options={RATIOS.map((r) => ({ value: r, label: r }))} compact />
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <Button onClick={apply} loading={applying} leftIcon={<Sparkles className="size-4" />}>Appliquer</Button>
          <Button variant="secondary" disabled={edits.length === 0 || applying} onClick={() => { onApply(preview); onClose(); }}>Terminé</Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </div>
      </aside>
    </div>
  );
}
