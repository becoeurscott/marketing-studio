"use client";

import { motion } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/Toast";
import { assistantReply } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useShell } from "@/components/shell/ShellContext";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "./useMediaQuery";

interface Msg { id: number; role: "user" | "assistant"; text: string; actions?: string[] }

/** Suggested action → route (SPEC §32). */
const ACTION_ROUTES: Record<string, string> = {
  "Generate Campaign": "/campaigns",
  "Generate Product Shoot": "/studio/product-shoot",
  "Generate UGC": "/studio/ugc",
  "Write Ad Copy": "/studio/copy",
  "Generate Video": "/studio/video",
};
const STARTERS = ["Generate Campaign", "Generate Product Shoot", "Generate UGC", "Write Ad Copy", "Generate Video"];
/** French labels for suggested actions (keys stay stable for routing). */
const ACTION_LABELS: Record<string, string> = {
  "Generate Campaign": "Générer une campagne",
  "Generate Product Shoot": "Générer un shooting produit",
  "Generate UGC": "Générer une vidéo UGC",
  "Write Ad Copy": "Rédiger un texte publicitaire",
  "Generate Video": "Générer une vidéo",
};

/** Floating AI Assistant button; opens a Drawer on desktop and a BottomSheet on mobile. */
export function AssistantButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const desktop = useIsDesktop();
  const { inspectorCount } = useShell();
  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.95 }}
        className={cn("fixed z-40 right-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+7.5rem)] lg:bottom-6 h-11", inspectorCount > 0 ? "lg:right-[344px]" : "lg:right-6", " pl-3 pr-4 rounded-full bg-elevated border border-border-strong shadow-float inline-flex items-center gap-2 text-sm font-medium hover:border-accent/50", className)}
        aria-label="Ouvrir l'assistant IA"
      >
        <span className="size-7 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center"><Sparkles className="size-4 text-on-accent" /></span>
        <span className="hidden sm:inline">Assistant IA</span>
      </motion.button>
      {desktop ? (
        <Drawer open={open} onClose={() => setOpen(false)} title="Assistant IA" width={420}><AssistantChat /></Drawer>
      ) : (
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Assistant IA" className="h-[85vh]"><AssistantChat /></BottomSheet>
      )}
    </>
  );
}

export function AssistantChat() {
  const user = useStore((s) => s.user);
  const router = useRouter();
  const toast = useToast();
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, role: "assistant", text: `Bonjour ${user.name.split(" ")[0]}, que créons-nous aujourd'hui ? Importez un produit ou choisissez une suggestion ci-dessous.`, actions: STARTERS }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const counter = useRef(1);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, typing]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || typing) return;
    setInput("");
    setMsgs((m) => [...m, { id: counter.current++, role: "user", text: t }]);
    setTyping(true);
    try {
      const r = await assistantReply(t);
      setMsgs((m) => [...m, { id: counter.current++, role: "assistant", text: r.text, actions: r.actions }]);
    } catch (err) {
      toast.error("Une erreur est survenue.", err instanceof Error ? err.message : undefined);
    } finally {
      setTyping(false);
    }
  };

  const act = (a: string) => {
    const href = ACTION_ROUTES[a];
    if (href) router.push(href); else void send(a);
  };

  return (
    <div className="flex flex-col h-full min-h-[50vh]">
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {msgs.map((m) => (
          <div key={m.id} className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
            <div className={cn("max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed", m.role === "user" ? "bg-accent text-on-accent rounded-br-sm" : "bg-surface border border-border rounded-bl-sm")}>
              {m.role === "assistant" && <Bot className="size-3.5 text-highlight inline mr-1.5 -mt-0.5" />}{m.text}
            </div>
            {m.actions && m.actions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {m.actions.map((a) => (
                  <button key={a} onClick={() => act(a)} className="h-7 px-2.5 rounded-full border border-accent/40 bg-accent/10 text-highlight text-xs font-medium hover:bg-accent/20">{ACTION_LABELS[a] ?? a}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="inline-flex items-center gap-1 rounded-xl rounded-bl-sm bg-surface border border-border px-3.5 py-3 w-fit" aria-label="L'assistant écrit…">
            {[0, 1, 2].map((i) => <motion.span key={i} className="size-1.5 rounded-full bg-text2" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />)}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Demandez une campagne, une vidéo, un texte…" className="flex-1 h-10 bg-surface border border-border-strong rounded-md px-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none" />
        <button type="submit" disabled={!input.trim() || typing} className="size-10 rounded-md bg-accent text-on-accent flex items-center justify-center disabled:opacity-50" aria-label="Envoyer"><Send className="size-4" /></button>
      </form>
    </div>
  );
}
