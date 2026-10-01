"use client";

import { Building2, Check, ChevronDown, Mail, Pencil, Shield, Trash2, UserPlus, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConfirmModal } from "@/components/account/ConfirmModal";
import { PageHeader, Section } from "@/components/shell/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { WorkspaceMember, WorkspaceRole } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export const ROLES: { id: WorkspaceRole; label: string; tone: BadgeTone; description: string }[] = [
  { id: "owner", label: "Propriétaire", tone: "accent", description: "Accès complet, facturation, suppression de l’espace." },
  { id: "admin", label: "Admin", tone: "success", description: "Gère les membres, les marques et tous les projets." },
  { id: "editor", label: "Éditeur", tone: "neutral", description: "Crée et modifie projets, ressources et campagnes." },
  { id: "viewer", label: "Lecteur", tone: "outline", description: "Consulte et commente. Ne peut ni générer ni exporter." },
];

const PERMISSIONS: { label: string; owner: boolean; admin: boolean; editor: boolean; viewer: boolean }[] = [
  { label: "Voir les projets et ressources", owner: true, admin: true, editor: true, viewer: true },
  { label: "Générer et modifier du contenu", owner: true, admin: true, editor: true, viewer: false },
  { label: "Exporter les ressources", owner: true, admin: true, editor: true, viewer: false },
  { label: "Gérer les kits de marque", owner: true, admin: true, editor: false, viewer: false },
  { label: "Inviter et retirer des membres", owner: true, admin: true, editor: false, viewer: false },
  { label: "Facturation et forfait", owner: true, admin: false, editor: false, viewer: false },
];

export default function WorkspacePage() {
  const workspaceName = useStore((s) => s.workspaceName);
  const setWorkspaceName = useStore((s) => s.setWorkspaceName);
  const members = useStore((s) => s.members);
  const user = useStore((s) => s.user);
  const inviteMember = useStore((s) => s.inviteMember);
  const removeMember = useStore((s) => s.removeMember);
  const changeMemberRole = useStore((s) => s.changeMemberRole);
  const plan = useStore((s) => s.plan);
  const toast = useToast();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(workspaceName);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<WorkspaceMember | null>(null);

  const saveName = () => {
    const v = nameDraft.trim();
    if (v && v !== workspaceName) { setWorkspaceName(v); toast.success("Espace de travail renommé", v); }
    setEditingName(false);
  };

  const active = members.filter((m) => m.status === "active").length;
  const invited = members.length - active;

  return (
    <>
      <PageHeader
        title="Espace de travail"
        description="Votre équipe, ses rôles et les droits associés à chacun."
        actions={<Button leftIcon={<UserPlus className="size-4" />} onClick={() => setInviteOpen(true)}>Inviter un membre</Button>}
      />

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="size-14 rounded-xl bg-gradient-to-br from-highlight via-accent to-green flex items-center justify-center shrink-0">
            <Building2 className="size-6 text-on-accent" />
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <form onSubmit={(e) => { e.preventDefault(); saveName(); }} className="flex items-center gap-2 max-w-md">
                <Input name="workspaceName" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus className="flex-1" aria-label="Nom de l’espace de travail" />
                <IconButton label="Enregistrer" variant="solid" type="submit"><Check /></IconButton>
                <IconButton label="Annuler" type="button" onClick={() => { setNameDraft(workspaceName); setEditingName(false); }}><X /></IconButton>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight truncate">{workspaceName}</h2>
                <IconButton label="Renommer l’espace de travail" size="sm" onClick={() => { setNameDraft(workspaceName); setEditingName(true); }}><Pencil /></IconButton>
              </div>
            )}
            <p className="text-[13px] text-text2 mt-0.5">
              {active} membre{active > 1 ? "s" : ""} actif{active > 1 ? "s" : ""}{invited ? ` · ${invited} invitation${invited > 1 ? "s" : ""} en attente` : ""} · forfait <span className="capitalize">{plan}</span>
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <Section title="Membres" description="Les propriétaires et admins peuvent modifier les rôles.">
          {members.length ? (
            <Card padded={false} className="divide-y divide-border">
              {members.map((m) => {
                const isSelf = m.id === user.id;
                const role = ROLES.find((r) => r.id === m.role)!;
                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar src={m.avatarUrl} name={m.name} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name} {isSelf && <span className="text-muted font-normal">(vous)</span>}</p>
                      <p className="text-[12px] text-muted truncate">{m.email} · {m.status === "invited" ? "Invité" : `Membre depuis le ${formatDate(m.joinedAt)}`}</p>
                    </div>
                    {m.status === "invited" && <Badge tone="warning" dot className="hidden sm:inline-flex">En attente</Badge>}
                    {m.role === "owner" ? (
                      <Badge tone={role.tone}>{role.label}</Badge>
                    ) : (
                      <RoleMenu value={m.role} onChange={(r) => { changeMemberRole(m.id, r); toast.success("Rôle mis à jour", `${m.name} est désormais ${ROLES.find((x) => x.id === r)?.label}`); }} />
                    )}
                    <IconButton label="Retirer le membre" size="sm" disabled={m.role === "owner"} className="text-muted hover:text-danger" onClick={() => setRemoving(m)}><Trash2 /></IconButton>
                  </div>
                );
              })}
            </Card>
          ) : (
            <EmptyState icon={Users} title="Aucun membre pour le moment" description="Invitez vos collègues à collaborer sur vos projets." cta={{ label: "Inviter un membre", onClick: () => setInviteOpen(true) }} />
          )}
        </Section>

        <Section title="Autorisations" description="Ce que chaque rôle peut faire.">
          <Card padded={false}>
            <div className="p-4 space-y-3 border-b border-border">
              {ROLES.map((r) => (
                <div key={r.id} className="flex items-start gap-2">
                  <Badge tone={r.tone} className="mt-0.5 min-w-14 shrink-0 justify-center">{r.label}</Badge>
                  <p className="text-[13px] text-text2">{r.description}</p>
                </div>
              ))}
            </div>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-muted">
                  <th className="text-left font-medium px-4 py-2">Autorisation</th>
                  {ROLES.map((r) => <th key={r.id} className="font-medium px-1 py-2 w-9" title={r.label}>{r.label[0]}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PERMISSIONS.map((p) => (
                  <tr key={p.label}>
                    <td className="px-4 py-2 text-text2">{p.label}</td>
                    {ROLES.map((r) => (
                      <td key={r.id} className="text-center py-2">
                        {p[r.id] ? <Check className="size-3.5 text-success inline" /> : <span className="text-muted">–</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-[11px] text-muted flex items-center gap-1.5 border-t border-border"><Shield className="size-3" /> Les rôles sont appliqués dans le produit final ; ce prototype se contente de les afficher.</p>
          </Card>
        </Section>
      </div>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={(input) => { const m = inviteMember(input); toast.success("Invitation envoyée", `${m.email} en tant que ${ROLES.find((r) => r.id === m.role)?.label}`); }} />

      <ConfirmModal
        open={!!removing}
        onClose={() => setRemoving(null)}
        danger
        title="Retirer ce membre ?"
        description={`${removing?.name} perdra l’accès à ${workspaceName}.`}
        confirmLabel="Retirer"
        onConfirm={() => { if (removing) { removeMember(removing.id); toast.info("Membre retiré", removing.name); } setRemoving(null); }}
      />
    </>
  );
}

function RoleMenu({ value, onChange }: { value: WorkspaceRole; onChange: (r: WorkspaceRole) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const current = ROLES.find((r) => r.id === value)!;
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} className="inline-flex items-center gap-1 h-7 pl-2 pr-1.5 rounded-full border border-border-strong text-[12px] font-medium text-text2 hover:text-text hover:border-white/25">
        {current.label} <ChevronDown className="size-3.5" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-1 w-56 rounded-md bg-elevated border border-border-strong shadow-float py-1 z-20">
          {ROLES.filter((r) => r.id !== "owner").map((r) => (
            <button key={r.id} role="menuitem" onClick={() => { setOpen(false); if (r.id !== value) onChange(r.id); }} className={cn("flex items-start gap-2 w-full px-3 py-2 text-left hover:bg-white/5", r.id === value && "bg-white/[0.04]")}>
              <span className="w-4 pt-0.5">{r.id === value && <Check className="size-3.5 text-highlight" />}</span>
              <span><span className="block text-[13px] text-text">{r.label}</span><span className="block text-[11px] text-muted">{r.description}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InviteModal({ open, onClose, onInvite }: { open: boolean; onClose: () => void; onInvite: (i: { name: string; email: string; role: WorkspaceRole }) => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Inviter un membre" description="Cette personne recevra un e-mail avec un lien pour rejoindre l’espace.">
      <InviteForm key={String(open)} onClose={onClose} onInvite={onInvite} />
    </Modal>
  );
}

function InviteForm({ onClose, onInvite }: { onClose: () => void; onInvite: (i: { name: string; email: string; role: WorkspaceRole }) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("editor");
  const [error, setError] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { setError("Saisissez une adresse e-mail valide."); return; }
    const name = v.split("@")[0].split(/[._-]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    onInvite({ name, email: v, role });
    onClose();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="E-mail" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="collegue@entreprise.com" leftIcon={<Mail />} error={error} autoFocus />
      <Select label="Rôle" name="role" value={role} onChange={(e) => setRole(e.target.value as WorkspaceRole)} options={ROLES.filter((r) => r.id !== "owner").map((r) => ({ value: r.id, label: `${r.label} — ${r.description}` }))} />
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
        <Button type="submit" leftIcon={<UserPlus className="size-4" />}>Envoyer l’invitation</Button>
      </div>
    </form>
  );
}
