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
  { id: "owner", label: "Owner", tone: "accent", description: "Full access, billing, delete workspace." },
  { id: "admin", label: "Admin", tone: "success", description: "Manage members, brands and all projects." },
  { id: "editor", label: "Editor", tone: "neutral", description: "Create and edit projects, assets and campaigns." },
  { id: "viewer", label: "Viewer", tone: "outline", description: "View and comment. Cannot generate or export." },
];

const PERMISSIONS: { label: string; owner: boolean; admin: boolean; editor: boolean; viewer: boolean }[] = [
  { label: "View projects & assets", owner: true, admin: true, editor: true, viewer: true },
  { label: "Generate & edit content", owner: true, admin: true, editor: true, viewer: false },
  { label: "Export assets", owner: true, admin: true, editor: true, viewer: false },
  { label: "Manage brand kits", owner: true, admin: true, editor: false, viewer: false },
  { label: "Invite & remove members", owner: true, admin: true, editor: false, viewer: false },
  { label: "Billing & plan", owner: true, admin: false, editor: false, viewer: false },
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
    if (v && v !== workspaceName) { setWorkspaceName(v); toast.success("Workspace renamed", v); }
    setEditingName(false);
  };

  const active = members.filter((m) => m.status === "active").length;
  const invited = members.length - active;

  return (
    <>
      <PageHeader
        title="Workspace"
        description="Your team, their roles, and what each role can do."
        actions={<Button leftIcon={<UserPlus className="size-4" />} onClick={() => setInviteOpen(true)}>Invite member</Button>}
      />

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="size-14 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shrink-0">
            <Building2 className="size-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <form onSubmit={(e) => { e.preventDefault(); saveName(); }} className="flex items-center gap-2 max-w-md">
                <Input name="workspaceName" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus className="flex-1" aria-label="Workspace name" />
                <IconButton label="Save" variant="solid" type="submit"><Check /></IconButton>
                <IconButton label="Cancel" type="button" onClick={() => { setNameDraft(workspaceName); setEditingName(false); }}><X /></IconButton>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight truncate">{workspaceName}</h2>
                <IconButton label="Rename workspace" size="sm" onClick={() => { setNameDraft(workspaceName); setEditingName(true); }}><Pencil /></IconButton>
              </div>
            )}
            <p className="text-[13px] text-text2 mt-0.5">
              {active} active member{active === 1 ? "" : "s"}{invited ? ` · ${invited} pending invite${invited === 1 ? "" : "s"}` : ""} · <span className="capitalize">{plan}</span> plan
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <Section title="Members" description="Owners and admins can change roles.">
          {members.length ? (
            <Card padded={false} className="divide-y divide-border">
              {members.map((m) => {
                const isSelf = m.id === user.id;
                const role = ROLES.find((r) => r.id === m.role)!;
                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar src={m.avatarUrl} name={m.name} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name} {isSelf && <span className="text-muted font-normal">(you)</span>}</p>
                      <p className="text-[12px] text-muted truncate">{m.email} · {m.status === "invited" ? "Invited" : `Joined ${formatDate(m.joinedAt)}`}</p>
                    </div>
                    {m.status === "invited" && <Badge tone="warning" dot className="hidden sm:inline-flex">Pending</Badge>}
                    {m.role === "owner" ? (
                      <Badge tone={role.tone}>{role.label}</Badge>
                    ) : (
                      <RoleMenu value={m.role} onChange={(r) => { changeMemberRole(m.id, r); toast.success("Role updated", `${m.name} is now ${ROLES.find((x) => x.id === r)?.label}`); }} />
                    )}
                    <IconButton label="Remove member" size="sm" disabled={m.role === "owner"} className="text-muted hover:text-danger" onClick={() => setRemoving(m)}><Trash2 /></IconButton>
                  </div>
                );
              })}
            </Card>
          ) : (
            <EmptyState icon={Users} title="No members yet" description="Invite teammates to collaborate on projects." cta={{ label: "Invite member", onClick: () => setInviteOpen(true) }} />
          )}
        </Section>

        <Section title="Permissions" description="What each role can do.">
          <Card padded={false}>
            <div className="p-4 space-y-3 border-b border-border">
              {ROLES.map((r) => (
                <div key={r.id} className="flex items-start gap-2">
                  <Badge tone={r.tone} className="mt-0.5 w-14 justify-center">{r.label}</Badge>
                  <p className="text-[13px] text-text2">{r.description}</p>
                </div>
              ))}
            </div>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-muted">
                  <th className="text-left font-medium px-4 py-2">Permission</th>
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
            <p className="px-4 py-3 text-[11px] text-muted flex items-center gap-1.5 border-t border-border"><Shield className="size-3" /> Roles are enforced in the real product; the prototype only displays them.</p>
          </Card>
        </Section>
      </div>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={(input) => { const m = inviteMember(input); toast.success("Invite sent", `${m.email} as ${ROLES.find((r) => r.id === m.role)?.label}`); }} />

      <ConfirmModal
        open={!!removing}
        onClose={() => setRemoving(null)}
        danger
        title="Remove member?"
        description={`${removing?.name} will lose access to ${workspaceName}.`}
        confirmLabel="Remove"
        onConfirm={() => { if (removing) { removeMember(removing.id); toast.info("Member removed", removing.name); } setRemoving(null); }}
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
    <Modal open={open} onClose={onClose} title="Invite a member" description="They'll get an email with a link to join.">
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
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { setError("Enter a valid email address."); return; }
    const name = v.split("@")[0].split(/[._-]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    onInvite({ name, email: v, role });
    onClose();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" leftIcon={<Mail />} error={error} autoFocus />
      <Select label="Role" name="role" value={role} onChange={(e) => setRole(e.target.value as WorkspaceRole)} options={ROLES.filter((r) => r.id !== "owner").map((r) => ({ value: r.id, label: `${r.label} — ${r.description}` }))} />
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" leftIcon={<UserPlus className="size-4" />}>Send invite</Button>
      </div>
    </form>
  );
}
