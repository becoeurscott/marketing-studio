"use client";

import { LEGAL } from "@/lib/legal";
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
  { q: "Comment fonctionnent les crédits ?", a: "Chaque génération consomme des crédits : 10 par image, 50 par vidéo, 15 par upscale, 60 par UGC, 30 par shooting produit, 20 par série de publicités et 2 par texte. Votre forfait ajoute des crédits chaque mois et vous pouvez acheter des packs ponctuels depuis la page Crédits. Les exports sont gratuits.", tags: ["credits", "crédits", "billing", "facturation"] },
  { q: "Que se passe-t-il quand j’utilise un modèle ?", a: "Les modèles ouvrent le Studio avec le mode, le style, le format, le prompt et les autres réglages déjà configurés. Vous pouvez tout modifier avant de générer.", tags: ["templates", "modèles", "studio"] },
  { q: "Quel est l’impact du kit de marque sur les générations ?", a: "Le Rédacteur et le Créateur de publicités s’appuient sur votre ton de marque (ton, style d’écriture, mots-clés, mots à éviter). Les couleurs, polices et logo de la marque sont utilisés pour composer les publicités et les exports.", tags: ["brand", "marque"] },
  { q: "Puis-je inviter mon équipe ?", a: "Oui. Rendez-vous dans Espace de travail, cliquez sur Inviter un membre et choisissez un rôle. Les propriétaires et admins gèrent les membres, les éditeurs créent du contenu, les lecteurs peuvent uniquement consulter et commenter.", tags: ["workspace", "espace", "team", "équipe"] },
  { q: "Les créateurs IA sont-ils de vraies personnes ?", a: "Non. Les créateurs sont des personnages IA fictifs à l’apparence synthétique. Vous pouvez les utiliser dans vos vidéos UGC sans vous soucier des droits.", tags: ["creators", "créateurs", "ugc"] },
  { q: "Où se trouvent mes exports ?", a: "Les exports sont rangés dans la bibliothèque de ressources, sous le type Exports, et vous recevez une notification dès qu’ils sont prêts. Vous pouvez ensuite les télécharger ou les déplacer dans un projet.", tags: ["export", "assets", "ressources"] },
  { q: "Des contenus sont-ils publiés sur les réseaux sociaux ?", a: "Pas dans ce prototype. Le calendrier de contenu vous permet de planifier vos publications par plateforme et par date, mais la publication est simulée.", tags: ["campaigns", "campagnes", "calendar", "calendrier"] },
  { q: "Comment réinitialiser les données de démo ?", a: "Ouvrez les Paramètres et utilisez Réinitialiser la démo. Tout le contenu de cet appareil revient aux données d’exemple et vous repasserez par l’onboarding.", tags: ["settings", "paramètres", "data", "données"] },
];

const LINKS: { label: string; description: string; icon: LucideIcon; href: string }[] = [
  { label: "Bien démarrer", description: "Importez un produit et créez votre première publicité en 2 minutes.", icon: Wand2, href: "/studio" },
  { label: "Modèles", description: "Parcourez des formats éprouvés par catégorie.", icon: Sparkles, href: "/templates" },
  { label: "Kit de marque", description: "Définissez couleurs, polices et ton.", icon: Palette, href: "/brand" },
  { label: "Forfaits et crédits", description: "Comparez les forfaits et rechargez.", icon: CreditCard, href: "/pricing" },
];

const SHORTCUTS: [string, string][] = [["⌘ K", "Tout rechercher"], ["⌘ Entrée", "Générer"], ["⌘ Z / ⇧ ⌘ Z", "Annuler / rétablir dans le Studio"], ["F", "Ajuster le canevas"], ["Échap", "Fermer les fenêtres"]];

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
      <PageHeader title="Aide et support" description="Réponses aux questions fréquentes, guides et moyens de nous contacter." actions={<Button leftIcon={<MessageCircle className="size-4" />} onClick={() => setContact(true)}>Contacter le support</Button>} />

      <SearchBar value={q} onChange={setQ} placeholder="Rechercher dans l’aide…" className="max-w-md mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div>
          <Section title="Liens rapides">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LINKS.map((l) => (
                <Link key={l.label} href={l.href} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-white/15 transition-colors">
                  <span className="size-9 rounded-md bg-elevated border border-border flex items-center justify-center shrink-0"><l.icon className="size-4 text-highlight" /></span>
                  <span className="min-w-0"><span className="block text-sm font-medium">{l.label}</span><span className="block text-[13px] text-text2">{l.description}</span></span>
                </Link>
              ))}
            </div>
          </Section>

          <Section title="Questions fréquentes" description={faqs.length ? `${faqs.length} article${faqs.length > 1 ? "s" : ""}` : undefined}>
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
                <p className="text-sm font-medium">Aucun article ne correspond à « {q} »</p>
                <p className="text-[13px] text-text2 mt-1">Essayez un autre terme ou contactez le support.</p>
                <Button size="sm" variant="secondary" className="mt-4" onClick={() => setContact(true)}>Contacter le support</Button>
              </Card>
            )}
          </Section>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-[15px] font-semibold mb-1 flex items-center gap-2"><LifeBuoy className="size-4 text-highlight" /> Contact</h3>
            <p className="text-[13px] text-text2">Nous répondons sous un jour ouvré.</p>
            <div className="mt-3 space-y-2 text-[13px]">
              <a href={`mailto:${LEGAL.supportEmail}`} className="flex items-center gap-2 text-text2 hover:text-text"><Mail className="size-4" /> {LEGAL.supportEmail}</a>
              <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Communauté", "Le forum de la communauté sera disponible dans la version complète."); }} className="flex items-center gap-2 text-text2 hover:text-text"><ExternalLink className="size-4" /> Forum de la communauté</a>
            </div>
            <Button fullWidth variant="secondary" className="mt-4" leftIcon={<Send className="size-4" />} onClick={() => setContact(true)}>Envoyer un message</Button>
          </Card>
          <Card>
            <h3 className="text-[15px] font-semibold mb-3 flex items-center gap-2"><Keyboard className="size-4 text-highlight" /> Raccourcis</h3>
            <ul className="space-y-2 text-[13px]">
              {SHORTCUTS.map(([k, v]) => (
                <li key={k} className="flex items-center justify-between gap-3"><span className="text-text2">{v}</span><kbd className="px-1.5 py-0.5 rounded-xs bg-elevated border border-border-strong text-[11px] font-mono text-text">{k}</kbd></li>
              ))}
            </ul>
          </Card>
          <Card>
            <p className="text-[13px] text-text2">Sokozia <span className="text-text font-medium">v{APP_VERSION}</span></p>
            <p className="text-[12px] text-muted mt-1">Prototype frontend. L’IA, les paiements et la publication sont entièrement simulés.</p>
            <div className="flex gap-3 mt-2 text-[12px]">
              <a href="#" onClick={(e) => e.preventDefault()} className="text-text2 hover:text-text">Conditions</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-text2 hover:text-text">Confidentialité</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-text2 hover:text-text">État du service</a>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={contact} onClose={() => setContact(false)} title="Contacter le support" description={`Nous vous répondrons à ${user.email}.`}>
        <ContactForm key={String(contact)} onClose={() => setContact(false)} onSent={() => toast.success("Message envoyé", "Nous vous répondrons sous un jour ouvré.")} />
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
    if (!message.trim()) { setError("Expliquez-nous ce qui se passe."); return; }
    setSending(true);
    await delay(700, 1100);
    setSending(false);
    onSent();
    onClose();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Select label="Sujet" name="topic" value={topic} onChange={(e) => setTopic(e.target.value)} options={[{ value: "question", label: "Question" }, { value: "bug", label: "Quelque chose ne fonctionne pas" }, { value: "billing", label: "Facturation" }, { value: "feature", label: "Suggestion de fonctionnalité" }]} />
      <Input label="Objet" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Résumé en quelques mots" />
      <Textarea label="Message" name="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Décrivez votre problème ou votre question…" error={error} autoFocus />
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={sending}>Annuler</Button>
        <Button type="submit" loading={sending} leftIcon={<Send className="size-4" />}>Envoyer</Button>
      </div>
    </form>
  );
}
