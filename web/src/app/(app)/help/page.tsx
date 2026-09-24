"use client";

import { BookOpen, ChevronDown, CreditCard, ExternalLink, Keyboard, LifeBuoy, Mail, MessageCircle, Palette, Send, Sparkles, Wand2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader, Section } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { delay } from "@/lib/api";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const APP_VERSION = "0.9.0 (prototype)";

const FAQ: { q: string; a: string; tags: string[] }[] = [
  { q: "How do credits work?", a: "Every generation costs credits: images 10, videos 50, upscales 15, UGC 60, product shoots 30, ad sets 20, copy 2. Your plan adds credits monthly and you can buy one-time packs from the Credits page. Exports are free.", tags: ["credits", "billing"] },
  { q: "What happens when I use a template?", a: "Templates open Studio with the mode, style, aspect ratio, prompt and other settings preconfigured. You can change anything before generating.", tags: ["templates", "studio"] },
  { q: "How does the Brand kit affect generations?", a: "The Copywriter and Ad creator read your brand voice (tone, writing style, keywords, words to avoid). Brand colors, fonts and logo are used when composing ads and exports.", tags: ["brand"] },
  { q: "Can I invite my team?", a: "Yes. Go to Workspace, click Invite member and choose a role. Owners and admins manage members; editors create content; viewers can only view and comment.", tags: ["workspace", "team"] },
  { q: "Are the AI creators real people?", a: "No. Creators are fictitious AI personas with synthetic likenesses. You can use them in UGC videos without licensing concerns.", tags: ["creators", "ugc"] },
  { q: "Where are my exports?", a: "Exports land in the Asset library under the Exports type and you get a notification when they're ready. From there you can download or move them into a project.", tags: ["export", "assets"] },
  { q: "Does anything get published to social platforms?", a: "Not in this prototype. The content calendar lets you plan posts by platform and date, but publishing is simulated.", tags: ["campaigns", "calendar"] },
  { q: "How do I reset the demo data?", a: "Open Settings and use Reset demo data. Everything on this device returns to the sample content and you'll go through onboarding again.", tags: ["settings", "data"] },
];

const LINKS: { label: string; description: string; icon: LucideIcon; href: string }[] = [
  { label: "Getting started", description: "Upload a product and make your first ad in 2 minutes.", icon: Wand2, href: "/studio" },
  { label: "Templates", description: "Browse proven formats by category.", icon: Sparkles, href: "/templates" },
  { label: "Brand kit", description: "Set colors, fonts, voice.", icon: Palette, href: "/brand" },
  { label: "Plans & credits", description: "Compare plans and top up.", icon: CreditCard, href: "/pricing" },
];

const SHORTCUTS: [string, string][] = [["⌘ K", "Search everything"], ["⌘ Enter", "Generate"], ["⌘ Z / ⇧ ⌘ Z", "Undo / redo in Studio"], ["F", "Fit canvas"], ["Esc", "Close dialogs"]];

export default function HelpPage() {
  const user = useStore((s) => s.user);
  const toast = useToast();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const [contact, setContact] = useState(false);

  const s = q.trim().toLowerCase();
  const faqs = FAQ.filter((f) => !s || f.q.toLowerCase().includes(s) || f.a.toLowerCase().includes(s) || f.tags.some((t) => t.includes(s)));

  return (
    <>
      <PageHeader title="Help & support" description="Answers to common questions, guides, and a way to reach us." actions={<Button leftIcon={<MessageCircle className="size-4" />} onClick={() => setContact(true)}>Contact support</Button>} />

      <SearchBar value={q} onChange={setQ} placeholder="Search help…" className="max-w-md mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div>
          <Section title="Quick links">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LINKS.map((l) => (
                <Link key={l.label} href={l.href} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-white/15 transition-colors">
                  <span className="size-9 rounded-md bg-elevated border border-border flex items-center justify-center shrink-0"><l.icon className="size-4 text-highlight" /></span>
                  <span className="min-w-0"><span className="block text-sm font-medium">{l.label}</span><span className="block text-[13px] text-text2">{l.description}</span></span>
                </Link>
              ))}
            </div>
          </Section>

          <Section title="Frequently asked" description={faqs.length ? `${faqs.length} article${faqs.length === 1 ? "" : "s"}` : undefined}>
            {faqs.length ? (
              <Card padded={false} className="divide-y divide-border">
                {faqs.map((f, i) => {
                  const isOpen = open === i;
                  return (
                    <div key={f.q}>
                      <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03]">
                        <span className="text-sm font-medium">{f.q}</span>
                        <ChevronDown className={cn("size-4 text-muted shrink-0 transition-transform", isOpen && "rotate-180")} />
                      </button>
                      {isOpen && <p className="px-4 pb-4 text-[13px] text-text2 leading-relaxed">{f.a}</p>}
                    </div>
                  );
                })}
              </Card>
            ) : (
              <Card className="text-center py-10">
                <BookOpen className="size-5 text-highlight mx-auto mb-3" />
                <p className="text-sm font-medium">No articles match “{q}”</p>
                <p className="text-[13px] text-text2 mt-1">Try another term or contact support.</p>
                <Button size="sm" variant="secondary" className="mt-4" onClick={() => setContact(true)}>Contact support</Button>
              </Card>
            )}
          </Section>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-[15px] font-semibold mb-1 flex items-center gap-2"><LifeBuoy className="size-4 text-highlight" /> Contact</h3>
            <p className="text-[13px] text-text2">We reply within one business day.</p>
            <div className="mt-3 space-y-2 text-[13px]">
              <a href="mailto:support@marketingstudio.example" className="flex items-center gap-2 text-text2 hover:text-text"><Mail className="size-4" /> support@marketingstudio.example</a>
              <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Community", "The community forum opens in the full product."); }} className="flex items-center gap-2 text-text2 hover:text-text"><ExternalLink className="size-4" /> Community forum</a>
            </div>
            <Button fullWidth variant="secondary" className="mt-4" leftIcon={<Send className="size-4" />} onClick={() => setContact(true)}>Send a message</Button>
          </Card>
          <Card>
            <h3 className="text-[15px] font-semibold mb-3 flex items-center gap-2"><Keyboard className="size-4 text-highlight" /> Shortcuts</h3>
            <ul className="space-y-2 text-[13px]">
              {SHORTCUTS.map(([k, v]) => (
                <li key={k} className="flex items-center justify-between gap-3"><span className="text-text2">{v}</span><kbd className="px-1.5 py-0.5 rounded-xs bg-elevated border border-border-strong text-[11px] font-mono text-text">{k}</kbd></li>
              ))}
            </ul>
          </Card>
          <Card>
            <p className="text-[13px] text-text2">Marketing Studio <span className="text-text font-medium">v{APP_VERSION}</span></p>
            <p className="text-[12px] text-muted mt-1">Frontend prototype. All AI, payments and publishing are simulated.</p>
            <div className="flex gap-3 mt-2 text-[12px]">
              <a href="#" onClick={(e) => e.preventDefault()} className="text-text2 hover:text-text">Terms</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-text2 hover:text-text">Privacy</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-text2 hover:text-text">Status</a>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={contact} onClose={() => setContact(false)} title="Contact support" description={`We'll reply to ${user.email}.`}>
        <ContactForm key={String(contact)} onClose={() => setContact(false)} onSent={() => toast.success("Message sent", "We'll get back to you within one business day.")} />
      </Modal>
    </>
  );
}

function ContactForm({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [topic, setTopic] = useState("question");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) { setError("Tell us what's going on."); return; }
    setSending(true);
    await delay(700, 1100);
    setSending(false);
    onSent();
    onClose();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Select label="Topic" name="topic" value={topic} onChange={(e) => setTopic(e.target.value)} options={[{ value: "question", label: "Question" }, { value: "bug", label: "Something's broken" }, { value: "billing", label: "Billing" }, { value: "feature", label: "Feature request" }]} />
      <Input label="Subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" />
      <Textarea label="Message" name="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the issue or question…" error={error} autoFocus />
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={sending}>Cancel</Button>
        <Button type="submit" loading={sending} leftIcon={<Send className="size-4" />}>Send</Button>
      </div>
    </form>
  );
}
